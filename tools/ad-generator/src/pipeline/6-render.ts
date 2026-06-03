import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { join, resolve } from "node:path";
import { ZEVO_BRAND } from "../brand.ts";
import { generateVoiceover, generateVoiceoverPerShot } from "./5-voiceover.ts";
import { generateMusic, buildMusicPrompt } from "./5-music.ts";
import { generateWhoosh, generateImpact } from "./sfx.ts";
import { renderCaptionPng, renderKineticCaptions, closeRenderer } from "./caption-renderer.ts";
import { imageToKenBurnsClip, videoToShotClip } from "./brand-assets.ts";
import { type AdConcept, type RenderedAd } from "../types.ts";

const execpBase = promisify(exec);
const execp = (cmd: string) => execpBase(cmd, { maxBuffer: 64 * 1024 * 1024 });

const W = 1080;
const H = 1920;
const ACCENT = ZEVO_BRAND.visual.primaryColor.replace("#", "");
const BG = ZEVO_BRAND.visual.backgroundColor.replace("#", "");

// Color-grade filter: subtle contrast + saturation + slight teal-shadow / warm-highlight (cinematic feel).
// Applied to every shot so cuts between disparate stock clips feel coherent.
const COLOR_GRADE = "eq=contrast=1.08:saturation=1.12:gamma=0.98,unsharp=5:5:0.6:5:5:0.0";

const SHOT_FPS = 30;
// Crossfade between adjacent shots. Shorter = tighter cuts, faster pace.
// Override via env: XFADE_DUR_SEC=0.15 (snappy) ... 0.5 (slow)
const XFADE_DUR = parseFloat(process.env.XFADE_DUR_SEC ?? "0.25");
// Breathing room AFTER the voiceover ends on each shot (silent tail). Lower = more rapid cuts.
// Override via env: INTER_SHOT_GAP_SEC=0.05 (very tight) ... 0.5 (relaxed)
const INTER_SHOT_GAP = parseFloat(process.env.INTER_SHOT_GAP_SEC ?? "0.15");

async function renderShot(opts: {
  sourcePath?: string;
  sourceKind?: "video" | "brand-video" | "brand-image";
  durationSec: number;
  caption?: string;
  captionWorkDir?: string;
  captionPrefix?: string;
  /**
   * Optional per-word start times (in seconds, relative to shot start).
   * When provided AND the count matches the number of words in `caption`,
   * captions reveal at each word's exact spoken moment (ElevenLabs alignment).
   * Otherwise, reveal is evenly distributed across the shot.
   */
  wordStartTimes?: number[];
  outPath: string;
  kenBurnsDirection?: "in" | "out";
}): Promise<void> {
  const dur = Math.max(1, opts.durationSec);

  const inputs: string[] = [];
  const filters: string[] = [];

  if (opts.sourcePath && existsSync(opts.sourcePath) && opts.sourceKind === "brand-image") {
    // Brand image → Ken Burns clip (no color-grade — UI screenshots should stay crisp/unmodified)
    const frames = Math.ceil(dur * SHOT_FPS);
    const dir = opts.kenBurnsDirection ?? "in";
    const zoomExpr = dir === "in" ? `min(1.0+0.0008*on,1.08)` : `max(1.08-0.0008*on,1.0)`;
    inputs.push(`-loop 1 -i "${opts.sourcePath}"`);
    filters.push(
      `[0:v]scale=${W * 1.2}:${H * 1.2}:force_original_aspect_ratio=increase,crop=${Math.floor(W * 1.1)}:${Math.floor(H * 1.1)},zoompan=z='${zoomExpr}':x='iw/2-(iw/zoom/2)+sin(on/30)*8':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=${SHOT_FPS},format=yuv420p[v0]`
    );
  } else if (opts.sourcePath && existsSync(opts.sourcePath) && opts.sourceKind === "brand-video") {
    // Brand video → conform to 9:16 WITHOUT color grade (preserve product look)
    inputs.push(`-stream_loop -1 -i "${opts.sourcePath}"`);
    filters.push(
      `[0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1,trim=duration=${dur},setpts=PTS-STARTPTS,format=yuv420p[v0]`
    );
  } else if (opts.sourcePath && existsSync(opts.sourcePath)) {
    // Pexels stock video → conform + color grade. NO zoompan: applying zoompan to a video
    // stream with d=totalFrames effectively repeats each input frame d times, which freezes
    // the playback (the user sees a "Ken Burns photo" instead of a moving video). Stock video
    // already has its own motion — let it play naturally.
    inputs.push(`-stream_loop -1 -i "${opts.sourcePath}"`);
    filters.push(
      `[0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1,trim=duration=${dur},setpts=PTS-STARTPTS,${COLOR_GRADE},fps=${SHOT_FPS},format=yuv420p[v0]`
    );
  } else {
    inputs.push(`-f lavfi -i color=c=0x${BG}:s=${W}x${H}:d=${dur}:r=${SHOT_FPS}`);
    filters.push(`[0:v]format=yuv420p[v0]`);
  }

  let lastLabel = "v0";

  if (opts.caption && opts.captionWorkDir && opts.captionPrefix) {
    // Render N kinetic frames (one per word revealed)
    const frames = await renderKineticCaptions(opts.caption, opts.captionWorkDir, opts.captionPrefix, {
      width: W - 240,
      height: 360,
      fontSize: 52,
      uppercase: false, // Instagram-style mixed-case is more natural
      accentColor: ZEVO_BRAND.visual.primaryColor,
    });
    if (frames.length > 0) {
      // Compute reveal start times.
      // If ElevenLabs alignment was provided AND count matches, use real per-word timings.
      // Otherwise, fall back to even distribution across first 70% of the shot.
      let starts: number[];
      const useAlign = opts.wordStartTimes && opts.wordStartTimes.length === frames.length;
      if (useAlign) {
        starts = opts.wordStartTimes!.map((t) => Math.max(0, Math.min(dur - 0.05, t)));
      } else {
        const revealEnd = Math.min(dur * 0.7, dur - 0.5);
        const perWord = revealEnd / frames.length;
        starts = frames.map((_, i) => i * perWord);
      }
      const holdEnd = dur - 0.35;

      // Add an input per caption frame
      let inputIdx = inputs.length;
      for (const f of frames) inputs.push(`-loop 1 -i "${f.path}"`);

      // Each frame visible during [starts[i], starts[i+1]); last frame stays through holdEnd then fades.
      const captionFilters: string[] = [];
      const overlayChain: string[] = [];
      let current = lastLabel;
      for (let i = 0; i < frames.length; i++) {
        const isLast = i === frames.length - 1;
        const start = starts[i].toFixed(3);
        const end = isLast ? holdEnd.toFixed(3) : starts[i + 1].toFixed(3);
        const lbl = `cap${i}`;
        if (isLast) {
          captionFilters.push(
            `[${inputIdx}:v]format=rgba,fade=t=out:st=${end}:d=0.35:alpha=1[${lbl}]`
          );
        } else {
          captionFilters.push(`[${inputIdx}:v]format=rgba[${lbl}]`);
        }
        const nextLabel = `vov${i}`;
        overlayChain.push(
          `[${current}][${lbl}]overlay=(W-w)/2:H*0.62-h/2:enable='between(t,${start},${isLast ? dur.toFixed(3) : end})':format=auto[${nextLabel}]`
        );
        current = nextLabel;
        inputIdx++;
      }
      filters.push(...captionFilters, ...overlayChain);
      lastLabel = current;
    }
  }

  const filterComplex = filters.join(";");
  const cmd = `ffmpeg -y ${inputs.join(" ")} -filter_complex "${filterComplex}" -map "[${lastLabel}]" -t ${dur} -r ${SHOT_FPS} -c:v libx264 -pix_fmt yuv420p -preset veryfast -crf 20 -an "${opts.outPath}"`;
  await execp(cmd);
}

/**
 * Veo-based outro with a SOFT GRADIENT FADE over the bottom region.
 * This is the user-preferred approach: the Veo source plays AS-IS for the top 60% (clean
 * logo + tagline visible), then the bottom 40% gradually fades to dark navy. The fade is
 * a smooth gradient (no hard rectangle), so App Store icons + Play Store icons + Veo
 * watermark blend into the background without a visible "kara kutu".
 *
 * Implementation: a one-time pre-rendered gradient PNG mask (transparent top, opaque
 * dark-navy bottom, feathered transition) is overlayed on top of the scaled source.
 */
async function renderOutroShot(opts: {
  sourcePath: string;
  durationSec: number;
  outPath: string;
  workDir: string;
}): Promise<void> {
  const dur = opts.durationSec;
  // The new user-uploaded logo-reveal already includes the brand tagline + App Store + Google
  // Play badges as INTENTIONAL design — we no longer fade the bottom. Just scale to 9:16 and
  // trim. (Legacy: previously masked bottom 27% to hide Veo watermark; that source is gone.)
  // To restore the fade behavior, set OUTRO_FADE_MASK=1 in .env.
  const useFadeMask = process.env.OUTRO_FADE_MASK === "1";
  if (useFadeMask) {
    const maskPath = join(opts.workDir, "outro-fade-mask.png");
    await renderOutroFadeMask(maskPath);
    const filter =
      `[0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1[base];` +
      `[1:v]format=rgba[mask];` +
      `[base][mask]overlay=0:0:format=auto,` +
      `trim=duration=${dur},setpts=PTS-STARTPTS,format=yuv420p`;
    const cmd = `ffmpeg -y -stream_loop -1 -i "${opts.sourcePath}" -loop 1 -i "${maskPath}" -filter_complex "${filter}" -t ${dur} -r ${SHOT_FPS} -c:v libx264 -pix_fmt yuv420p -preset veryfast -crf 20 -an "${opts.outPath}"`;
    await execp(cmd);
    return;
  }
  // Clean pass-through: scale to 9:16 and trim. The source video is shown AS-IS.
  const filter =
    `[0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1,trim=duration=${dur},setpts=PTS-STARTPTS,format=yuv420p`;
  const cmd = `ffmpeg -y -stream_loop -1 -i "${opts.sourcePath}" -filter_complex "${filter}" -t ${dur} -r ${SHOT_FPS} -c:v libx264 -pix_fmt yuv420p -preset veryfast -crf 20 -an "${opts.outPath}"`;
  await execp(cmd);
}

/**
 * Renders a 1080x1920 PNG mask tuned to the Veo source layout:
 *  - y=0..1305 (top 68%): fully transparent → ZEVO logo + full 2-line Turkish tagline stay crisp
 *  - y=1305..1410 (68-73%): smooth gradient transparent → opaque
 *  - y=1410..1920 (bottom 27%): fully opaque dark navy → hides App Store icons + Play Store icons + Veo watermark
 * The gradient zone is intentionally short (5% of height) so the transition is visible but quick.
 */
async function renderOutroFadeMask(outPath: string): Promise<void> {
  const bg = ZEVO_BRAND.visual.backgroundColor; // #0A1628
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    html, body { margin: 0; padding: 0; width: ${W}px; height: ${H}px; }
    .mask {
      width: ${W}px; height: ${H}px;
      background: linear-gradient(
        to bottom,
        rgba(10,22,40,0) 0%,
        rgba(10,22,40,0) 68%,
        ${bg} 73%,
        ${bg} 100%
      );
    }
  </style></head><body><div class="mask"></div></body></html>`;
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: W, height: H } });
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.screenshot({ path: outPath, omitBackground: true, type: "png", clip: { x: 0, y: 0, width: W, height: H } });
    await page.close();
  } finally {
    await browser.close();
  }
}

/**
 * (Deprecated) Custom HTML-rendered outro — kept for reference but no longer invoked.
 */
async function renderCustomOutro(opts: {
  durationSec: number;
  outPath: string;
  workDir: string;
}): Promise<void> {
  const dur = opts.durationSec;
  const pngPath = join(opts.workDir, "outro-card.png");
  await renderCustomOutroPng(pngPath);

  // Subtle Ken Burns + brightness pulse so the outro feels alive (not a frozen poster).
  const frames = Math.ceil(dur * SHOT_FPS);
  const filter =
    `[0:v]scale=${Math.floor(W * 1.06)}:${Math.floor(H * 1.06)},` +
    `zoompan=z='min(1.0+0.0006*on,1.04)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=${SHOT_FPS},` +
    // gentle brightness pulse to simulate neon flicker
    `eq=brightness=0.0:saturation=1.05,format=yuv420p`;
  const cmd = `ffmpeg -y -loop 1 -i "${pngPath}" -filter_complex "${filter}" -t ${dur} -r ${SHOT_FPS} -c:v libx264 -pix_fmt yuv420p -preset veryfast -crf 20 -an "${opts.outPath}"`;
  await execp(cmd);
}

/**
 * Renders the outro design as a 1080x1920 PNG via Playwright.
 * Design: dark navy gradient bg with soft emerald radial glow centered,
 * "ZEVO" wordmark composed of (a) circuit-pattern SVG Z + (b) clean white "EVO" letters,
 * both glowing emerald via CSS text-shadow / filter.
 */
async function renderCustomOutroPng(outPath: string): Promise<void> {
  const primary = ZEVO_BRAND.visual.primaryColor; // #10DC78
  const bg = ZEVO_BRAND.visual.backgroundColor;   // #0A1628

  // SVG circuit-Z: stylized Z with internal traces and node dots, emerald stroke
  const circuitZSvg = `
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
      <g fill="none" stroke="${primary}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)">
        <!-- top bar -->
        <path d="M30 30 L170 30" />
        <!-- diagonal -->
        <path d="M170 30 L30 170" />
        <!-- bottom bar -->
        <path d="M30 170 L170 170" />
        <!-- internal traces -->
        <path d="M55 55 L120 55 M120 55 L120 75 M70 90 L130 90 M55 130 L120 130 M80 150 L140 150" stroke-width="5" />
      </g>
      <!-- node dots -->
      <g fill="${primary}" filter="url(#glow)">
        <circle cx="30" cy="30" r="8"/>
        <circle cx="170" cy="30" r="8"/>
        <circle cx="30" cy="170" r="8"/>
        <circle cx="170" cy="170" r="8"/>
        <circle cx="120" cy="55" r="6"/>
        <circle cx="120" cy="75" r="6"/>
        <circle cx="70" cy="90" r="6"/>
        <circle cx="130" cy="90" r="6"/>
        <circle cx="80" cy="150" r="6"/>
        <circle cx="140" cy="150" r="6"/>
      </g>
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
    </svg>
  `.trim();

  const html = `<!doctype html><html><head><meta charset="utf-8">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@800;900&display=swap" rel="stylesheet">
    <style>
      html, body { margin: 0; padding: 0; width: ${W}px; height: ${H}px; background: ${bg}; }
      .stage {
        width: ${W}px; height: ${H}px;
        position: relative;
        background:
          radial-gradient(circle at 50% 50%, rgba(16,220,120,0.20) 0%, rgba(16,220,120,0.05) 35%, rgba(16,220,120,0) 65%),
          linear-gradient(180deg, #0A1628 0%, #050B14 100%);
        display: flex; align-items: center; justify-content: center;
      }
      .logo {
        display: flex; align-items: center; gap: 24px;
      }
      .z {
        width: 360px; height: 360px;
        filter: drop-shadow(0 0 28px ${primary}AA) drop-shadow(0 0 60px ${primary}55);
      }
      .word {
        font-family: 'Inter', -apple-system, sans-serif;
        font-weight: 900;
        font-size: 320px;
        color: ${primary};
        letter-spacing: -10px;
        line-height: 1;
        text-shadow:
          0 0 24px ${primary}CC,
          0 0 60px ${primary}66,
          0 0 100px ${primary}33;
      }
    </style></head><body>
    <div class="stage">
      <div class="logo">
        <div class="z">${circuitZSvg}</div>
        <div class="word">EVO</div>
      </div>
    </div>
  </body></html>`;

  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: W, height: H } });
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.screenshot({ path: outPath, omitBackground: false, type: "png", clip: { x: 0, y: 0, width: W, height: H } });
    await page.close();
  } finally {
    await browser.close();
  }
}

async function renderCtaCard(opts: {
  cta: string;
  oneLiner: string;
  durationSec: number;
  outPath: string;
  workDir: string;
}): Promise<void> {
  const dur = opts.durationSec;
  const ctaPngPath = join(opts.workDir, "cta-card.png");
  await renderFullCtaCardPng(ctaPngPath, opts.cta, opts.oneLiner);

  // Animate end card: subtle scale-up from 0.96 to 1.0 over the first 0.4s.
  const cmd = `ffmpeg -y -loop 1 -i "${ctaPngPath}" -filter_complex "[0:v]trim=duration=${dur},setpts=PTS-STARTPTS,scale=${W}:${H},zoompan=z='min(0.96+0.001*on,1.0)':d=${Math.ceil(dur * SHOT_FPS)}:s=${W}x${H}:fps=${SHOT_FPS},format=yuv420p" -t ${dur} -r ${SHOT_FPS} -c:v libx264 -pix_fmt yuv420p -preset veryfast -crf 20 -an "${opts.outPath}"`;
  await execp(cmd);
}

async function renderFullCtaCardPng(outPath: string, cta: string, oneLiner: string): Promise<void> {
  // Premium end-card composition: large brand wordmark, oversized CTA pill, supporting tagline,
  // emerald gradient backdrop. No grid lines, no busy details.
  const html = `<!doctype html><html><head><meta charset="utf-8">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;700;800;900&display=swap" rel="stylesheet">
    <style>
    html, body { margin: 0; padding: 0; width: ${W}px; height: ${H}px; }
    .card {
      width: ${W}px; height: ${H}px;
      background:
        radial-gradient(circle at 50% 40%, rgba(16,220,120,0.22) 0%, rgba(16,220,120,0) 55%),
        linear-gradient(180deg, #0A1628 0%, #050B14 100%);
      position: relative;
      font-family: 'Inter', -apple-system, sans-serif;
      color: white;
      overflow: hidden;
    }
    .brand {
      position: absolute; left: 0; right: 0; top: 820px;
      text-align: center;
      font-size: 220px; font-weight: 900;
      letter-spacing: -10px;
      color: white;
    }
    .brand .dot { color: ${ZEVO_BRAND.visual.primaryColor}; }
    .pill {
      position: absolute; left: 140px; top: 1200px;
      width: 800px; height: 220px;
      background: ${ZEVO_BRAND.visual.primaryColor};
      border-radius: 110px;
      display: flex; align-items: center; justify-content: center;
      font-size: 96px; font-weight: 900; color: ${ZEVO_BRAND.visual.backgroundColor};
      letter-spacing: -2px;
      box-shadow: 0 30px 60px rgba(16,220,120,0.32);
    }
  </style></head><body>
    <div class="card">
      <div class="brand">zevo<span class="dot">.</span></div>
      <div class="pill">${cta}</div>
    </div>
  </body></html>`;

  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: W, height: H } });
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.screenshot({ path: outPath, omitBackground: false, type: "png", clip: { x: 0, y: 0, width: W, height: H } });
    await page.close();
  } finally {
    await browser.close();
  }
}

/**
 * Concat shots with xfade transitions for premium polish.
 * If only 1 shot, falls back to a plain copy.
 */
async function concatWithCrossfade(parts: { path: string; durationSec: number }[], outPath: string): Promise<void> {
  if (parts.length === 1) {
    await execp(`ffmpeg -y -i "${parts[0].path}" -c copy "${outPath}"`);
    return;
  }
  // Build a chained xfade graph. Each transition reduces total length by XFADE_DUR.
  const inputs = parts.map((p) => `-i "${p.path}"`).join(" ");
  const filters: string[] = [];
  let prevLabel = "0:v";
  let cumulative = parts[0].durationSec;
  for (let i = 1; i < parts.length; i++) {
    const offset = (cumulative - XFADE_DUR).toFixed(2);
    const outLabel = i === parts.length - 1 ? "vout" : `vx${i}`;
    filters.push(
      `[${prevLabel}][${i}:v]xfade=transition=fade:duration=${XFADE_DUR}:offset=${offset}[${outLabel}]`
    );
    prevLabel = outLabel;
    cumulative = cumulative + parts[i].durationSec - XFADE_DUR;
  }
  const cmd = `ffmpeg -y ${inputs} -filter_complex "${filters.join(";")}" -map "[vout]" -c:v libx264 -pix_fmt yuv420p -preset veryfast -crf 20 -r ${SHOT_FPS} "${outPath}"`;
  await execp(cmd);
}

async function muxAudio(videoPath: string, audioPath: string, outPath: string, totalDur: number): Promise<void> {
  const fadeOutStart = Math.max(0, totalDur - 0.4);
  const cmd = `ffmpeg -y -i "${videoPath}" -i "${audioPath}" -filter_complex "[1:a]apad=whole_dur=${totalDur},afade=t=in:st=0:d=0.2,afade=t=out:st=${fadeOutStart.toFixed(2)}:d=0.4,volume=1.0[a]" -map 0:v -map "[a]" -t ${totalDur} -c:v copy -c:a aac -b:a 192k -movflags +faststart "${outPath}"`;
  await execp(cmd);
}

/**
 * Mixes voiceover + music bed + transition whooshes + final impact into the final video.
 * - voiceover: full volume, ducks the music
 * - music: -10 dB sidechain-style duck; fades in/out
 * - whooshes: positioned at each shot transition (right before the cut)
 * - impact: at the start of the CTA card
 */
async function muxRichAudio(
  videoPath: string,
  voicePath: string | null,
  musicPath: string | null,
  whooshPath: string | null,
  impactPath: string,
  shotEndTimes: number[], // cumulative end times of each non-final shot
  ctaStartTime: number,
  totalDur: number,
  outPath: string
): Promise<void> {
  const inputs: string[] = [`-i "${videoPath}"`];
  const audioStreams: string[] = [];
  let inputIdx = 1;

  if (voicePath) {
    inputs.push(`-i "${voicePath}"`);
    audioStreams.push(
      `[${inputIdx}:a]apad=whole_dur=${totalDur},volume=1.0[voice]`
    );
    inputIdx++;
  }

  if (musicPath) {
    inputs.push(`-i "${musicPath}"`);
    // Music: -12 dB under voice, fades in/out, padded/trimmed to totalDur.
    const fadeOutStart = Math.max(0, totalDur - 1.2);
    audioStreams.push(
      `[${inputIdx}:a]aloop=loop=-1:size=2e+9,atrim=duration=${totalDur},volume=0.22,afade=t=in:st=0:d=0.8,afade=t=out:st=${fadeOutStart.toFixed(2)}:d=1.2[music]`
    );
    inputIdx++;
  }

  // Whoosh at each non-final shot transition (opt-in). Skipped entirely when whooshPath is null.
  const whooshLabels: string[] = [];
  if (whooshPath) {
    for (let i = 0; i < shotEndTimes.length; i++) {
      inputs.push(`-i "${whooshPath}"`);
      const delayMs = Math.max(0, Math.round((shotEndTimes[i] - 0.2) * 1000));
      audioStreams.push(
        `[${inputIdx}:a]adelay=${delayMs}|${delayMs},volume=0.7[w${i}]`
      );
      whooshLabels.push(`[w${i}]`);
      inputIdx++;
    }
  }

  // Impact at CTA reveal
  inputs.push(`-i "${impactPath}"`);
  const impactDelayMs = Math.max(0, Math.round(ctaStartTime * 1000));
  audioStreams.push(`[${inputIdx}:a]adelay=${impactDelayMs}|${impactDelayMs},volume=0.6[impact]`);
  const impactLabel = `[impact]`;
  inputIdx++;

  // Final mix
  const mixInputs = [
    voicePath ? "[voice]" : null,
    musicPath ? "[music]" : null,
    ...whooshLabels,
    impactLabel,
  ].filter(Boolean) as string[];
  const mixCount = mixInputs.length;
  audioStreams.push(`${mixInputs.join("")}amix=inputs=${mixCount}:duration=longest:dropout_transition=0:normalize=0[mixed]`);

  const fadeOutStart = Math.max(0, totalDur - 0.4);
  audioStreams.push(
    `[mixed]afade=t=out:st=${fadeOutStart.toFixed(2)}:d=0.4,aresample=44100[aout]`
  );

  const filter = audioStreams.join(";");
  const cmd = `ffmpeg -y ${inputs.join(" ")} -filter_complex "${filter}" -map 0:v -map "[aout]" -t ${totalDur} -c:v copy -c:a aac -b:a 192k -movflags +faststart "${outPath}"`;
  await execp(cmd);
}

async function probeDuration(path: string): Promise<number> {
  const { stdout } = await execp(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${path}"`);
  return parseFloat(stdout.trim()) || 0;
}

export interface RenderOptions {
  conceptsFile: string;
  outputDir: string;
  assetsManifestFile?: string;
  langs?: ("tr" | "en")[];
  conceptIds?: string[];
}

export async function renderAds(opts: RenderOptions): Promise<RenderedAd[]> {
  const concepts = JSON.parse(await readFile(opts.conceptsFile, "utf8")) as AdConcept[];
  const manifest =
    opts.assetsManifestFile && existsSync(opts.assetsManifestFile)
      ? (JSON.parse(await readFile(opts.assetsManifestFile, "utf8")) as Record<
          string,
          { shotIdx: number; source?: "brand-image" | "brand-video" | "pexels"; localPath: string; sourceUrl?: string }[]
        >)
      : {};
  const langs = opts.langs ?? ["tr", "en"];
  const filtered = opts.conceptIds ? concepts.filter((c) => opts.conceptIds!.includes(c.id)) : concepts;
  const rendersDir = join(opts.outputDir, "renders");
  await mkdir(rendersDir, { recursive: true });

  const results: RenderedAd[] = [];

  for (const concept of filtered) {
    for (const lang of langs) {
      const workDir = join(rendersDir, `${concept.id}-${lang}-work`);
      await mkdir(workDir, { recursive: true });

      console.log(`[render] ${concept.id} [${lang}]...`);

      // 1) Generate per-shot voiceovers FIRST so we can sync each shot's duration to its VO.
      const voLines = concept.shotlist.map((s) => s.voiceover[lang]);
      const perShotVo = await generateVoiceoverPerShot({
        lines: voLines,
        lang,
        outDir: workDir,
        prefix: "vo",
      });
      const voProvider = perShotVo.find((v) => v.provider !== "skipped")?.provider ?? "skipped";

      // 2) Render each shot with duration = max(concept-hint, vo-duration + 0.4s breathing room).
      //    This guarantees the voiceover finishes before the cut, eliminating drift.
      const shotParts: { path: string; durationSec: number }[] = [];
      const shotMeta: RenderedAd["shots"] = [];
      const voPaths: (string | null)[] = [];

      for (let i = 0; i < concept.shotlist.length; i++) {
        const shot = concept.shotlist[i];
        const [start, end] = shot.seconds;
        const hintDur = Math.max(1, end - start);
        const voEntry = perShotVo[i];
        const voDur = voEntry?.path ? await probeDuration(voEntry.path) : 0;
        const asset = manifest[concept.id]?.find((m: any) => m.shotIdx === i);
        // Probe the source asset's natural duration so we can cap the shot length to it.
        // Rationale: if the brand video is only 2s but the VO is 3s, we'd rather end the shot
        // at 2s (and let the VO tail get clipped at the mix step) than loop the visual.
        // For Pexels we don't cap because their videos are reliably long enough.
        let sourceDur = 0;
        if (asset?.localPath && (asset.source === "brand-video" || asset.source === "brand-image")) {
          sourceDur = await probeDuration(asset.localPath).catch(() => 0);
        }
        // Compute desired duration from VO (or hint if no VO).
        const desiredDur = voDur > 0 ? voDur + INTER_SHOT_GAP : hintDur;
        // Cap: never exceed the source video's natural length when the source is a brand asset.
        // Only the visual is shortened — VO mp3 is unchanged at render time but will be trimmed
        // at the audio mix step (its mapping uses the shot's actual duration).
        const dur = sourceDur > 0 ? Math.min(desiredDur, sourceDur) : desiredDur;
        if (sourceDur > 0 && desiredDur > sourceDur + 0.05) {
          console.warn(`[render] shot ${i} (${asset?.brandAssetId}): VO needs ${desiredDur.toFixed(1)}s but asset is only ${sourceDur.toFixed(1)}s — trimming shot to asset length (no loop).`);
        }
        const shotPath = join(workDir, `shot-${i}.mp4`);
        // Caption = spoken voiceover text (so the on-screen words match what's heard).
        // If alignment is available, each word reveals at its actual spoken moment.
        // If shot has no voiceover (e.g. logo outro shot), no caption is rendered.
        const voWords = voEntry?.words ?? [];
        let caption: string | undefined;
        let wordStartTimes: number[] | undefined;
        if (voWords.length > 0) {
          caption = voWords.map((w) => w.text).join(" ");
          wordStartTimes = voWords.map((w) => w.startSec);
        }
        const sourceKind =
          asset?.source === "brand-image"
            ? "brand-image"
            : asset?.source === "brand-video"
            ? "brand-video"
            : "video";
        await renderShot({
          sourcePath: asset?.localPath,
          sourceKind,
          durationSec: dur,
          caption,
          captionWorkDir: caption ? workDir : undefined,
          captionPrefix: caption ? `caption-${i}` : undefined,
          wordStartTimes,
          outPath: shotPath,
          kenBurnsDirection: i % 2 === 0 ? "in" : "out",
        });
        shotParts.push({ path: shotPath, durationSec: dur });
        voPaths.push(voEntry?.path ?? null);
        shotMeta.push({
          seconds: [start, end],
          sourceUrl: asset?.sourceUrl,
          sourcePath: asset?.localPath,
          provider: asset
            ? (asset.source === "pexels" ? "pexels"
              : asset.source === "curated-stock" ? "curated-stock"
              : "placeholder")
            : "placeholder",
        });
      }

      // 3) Veo-based outro restored at user request — but with a SOFT GRADIENT FADE
      //    over the bottom region (no hard rectangles, no aggressive crop). The fade
      //    smoothly blends App Store icons + Play Store icons + Veo watermark into the
      //    dark-navy background. Logo + tagline stay crisp.
      const logoOutroPath = resolve(process.cwd(), "brand-assets", "videos", "logo-reveal.mp4");
      if (existsSync(logoOutroPath)) {
        const outroNatural = await probeDuration(logoOutroPath);
        const outroDur = outroNatural;
        const outroShotPath = join(workDir, "outro.mp4");
        await renderOutroShot({
          sourcePath: logoOutroPath,
          durationSec: outroDur,
          outPath: outroShotPath,
          workDir,
        });
        shotParts.push({ path: outroShotPath, durationSec: outroDur });
        voPaths.push(null); // no VO over outro
      }

      // 5) Concat with crossfades
      const concatPath = join(workDir, "concat.mp4");
      await concatWithCrossfade(shotParts, concatPath);

      // 6) Build a combined VO track by placing each shot's audio at its computed shot start time
      //    (accounting for crossfade overlap). Empty entries (no VO for that shot) are skipped.
      const voPath = join(workDir, "vo.mp3");
      const voTotalDur = await probeDuration(concatPath);
      const haveAnyVo = voPaths.some((p) => p !== null);
      if (haveAnyVo) {
        // shotStartAcc = global start time of shot i in the crossfaded output.
        // With chained xfade, shot (i+1) starts XFADE_DUR before shot i ends, so each
        // increment subtracts XFADE_DUR. (Previously we skipped subtraction for shot 0,
        // which made every audio delay XFADE_DUR too LATE → captions ahead of voice
        // at every cut. This now aligns audio with the visual start exactly.)
        let shotStartAcc = 0;
        const voInputs: string[] = [];
        const voFilters: string[] = [];
        let voIdx = 0;
        for (let i = 0; i < shotParts.length; i++) {
          const p = voPaths[i];
          if (p) {
            voInputs.push(`-i "${p}"`);
            const delayMs = Math.max(0, Math.round(shotStartAcc * 1000));
            // Trim each VO to its shot's visual duration so a long VO does not bleed into the
            // next shot's audio. The visual is already capped to source length above — match
            // the VO. afade=out softens the cut so it doesn't feel like a hard chop.
            const shotDurMs = (shotParts[i].durationSec).toFixed(3);
            const fadeStart = Math.max(0, shotParts[i].durationSec - 0.15).toFixed(3);
            voFilters.push(`[${voIdx}:a]atrim=duration=${shotDurMs},afade=t=out:st=${fadeStart}:d=0.15,adelay=${delayMs}:all=1[v${voIdx}]`);
            voIdx++;
          }
          shotStartAcc += shotParts[i].durationSec - XFADE_DUR;
        }
        if (voIdx > 0) {
          const mixLabels = Array.from({ length: voIdx }, (_, k) => `[v${k}]`).join("");
          voFilters.push(`${mixLabels}amix=inputs=${voIdx}:duration=longest:normalize=0[aout]`);
          const cmd = `ffmpeg -y ${voInputs.join(" ")} -filter_complex "${voFilters.join(";")}" -map "[aout]" -t ${voTotalDur} -c:a libmp3lame -b:a 192k "${voPath}"`;
          await execp(cmd);
        }
      }

      const finalPath = join(rendersDir, `${concept.id}-${lang}.mp4`);
      const totalDur = await probeDuration(concatPath);

      // Background music — try ElevenLabs, fall back to none.
      const musicPath = join(workDir, "music.mp3");
      const musicResult = await generateMusic({
        prompt: buildMusicPrompt(concept.musicMood || "uplifting energetic", totalDur),
        durationSec: Math.ceil(totalDur),
        outPath: musicPath,
      });

      // SFX: whoosh (at scene cuts) + impact (at outro). Whoosh is OPT-IN via SFX_WHOOSH=1 —
      // user prefers a clean cut without transition sweep. Impact remains on for outro emphasis.
      const whooshEnabled = process.env.SFX_WHOOSH === "1";
      const whooshPath = join(workDir, "whoosh.wav");
      const impactPath = join(workDir, "impact.wav");
      if (whooshEnabled) await generateWhoosh(whooshPath, 0.45);
      await generateImpact(impactPath);

      // Compute shot end times (= start time of NEXT shot in crossfaded output).
      // Whoosh SFX play at each cut. Same fix as audio delay above: subtract XFADE_DUR per shot.
      const shotEndTimes: number[] = [];
      let acc = 0;
      for (let i = 0; i < shotParts.length - 1; i++) {
        acc += shotParts[i].durationSec - XFADE_DUR;
        shotEndTimes.push(acc);
      }
      // Last shot starts at totalDur - dur[last] + XFADE_DUR (its crossfade midpoint)
      const ctaStartTime = Math.max(0, totalDur - shotParts[shotParts.length - 1].durationSec + XFADE_DUR);

      const hasVoice = voProvider !== "skipped" && existsSync(voPath);
      if (hasVoice || musicResult) {
        await muxRichAudio(
          concatPath,
          hasVoice ? voPath : null,
          musicResult,
          whooshEnabled ? whooshPath : null,
          impactPath,
          shotEndTimes,
          ctaStartTime,
          totalDur,
          finalPath
        );
      } else {
        await execp(`ffmpeg -y -i "${concatPath}" -c copy "${finalPath}"`);
      }
      console.log(`[render]   audio: voice=${hasVoice ? voProvider : "none"} music=${musicResult ? "elevenlabs" : "none"} sfx=procedural`);

      const rendered: RenderedAd = {
        conceptId: concept.id,
        lang,
        videoPath: finalPath,
        durationSec: totalDur,
        width: W,
        height: H,
        brandOverlayApplied: false, // top-left logo removed; branding lives in end card
        voiceoverProvider: voProvider,
        shots: shotMeta,
      };
      results.push(rendered);
      console.log(`[render] ✓ ${finalPath} (${totalDur.toFixed(1)}s, vo=${voProvider})`);
    }
  }

  await closeRenderer();

  const manifestOut = join(opts.outputDir, "renders.json");
  await writeFile(manifestOut, JSON.stringify(results, null, 2), "utf8");
  console.log(`[render] manifest → ${manifestOut}`);
  return results;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { config } = await import("dotenv");
  config();
  const stamp = new Date().toISOString().slice(0, 10);
  const dir = join(process.cwd(), "output", stamp);
  await renderAds({
    conceptsFile: join(dir, "concepts.json"),
    assetsManifestFile: join(dir, "assets-manifest.json"),
    outputDir: dir,
  });
}
