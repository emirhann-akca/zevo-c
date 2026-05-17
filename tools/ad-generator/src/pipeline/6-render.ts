import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { join, resolve } from "node:path";
import { ZEVO_BRAND } from "../brand.ts";
import { generateVoiceover } from "./5-voiceover.ts";
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
const XFADE_DUR = 0.4; // seconds of crossfade between adjacent shots

async function renderShot(opts: {
  sourcePath?: string;
  sourceKind?: "video" | "brand-video" | "brand-image";
  durationSec: number;
  caption?: string;
  captionWorkDir?: string;
  captionPrefix?: string;
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
    // Pexels stock video → conform + color grade for cinematic consistency
    inputs.push(`-stream_loop -1 -i "${opts.sourcePath}"`);
    const zoomEnd = 1.06;
    const totalFrames = Math.ceil(dur * SHOT_FPS);
    filters.push(
      `[0:v]scale=${W * 1.15}:${H * 1.15}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1,trim=duration=${dur},setpts=PTS-STARTPTS,${COLOR_GRADE},zoompan=z='min(zoom+0.0008,${zoomEnd})':d=${totalFrames}:s=${W}x${H}:fps=${SHOT_FPS},format=yuv420p[v0]`
    );
  } else {
    inputs.push(`-f lavfi -i color=c=0x${BG}:s=${W}x${H}:d=${dur}:r=${SHOT_FPS}`);
    filters.push(`[0:v]format=yuv420p[v0]`);
  }

  let lastLabel = "v0";

  if (opts.caption && opts.captionWorkDir && opts.captionPrefix) {
    // Render N kinetic frames (one per word revealed)
    const frames = await renderKineticCaptions(opts.caption, opts.captionWorkDir, opts.captionPrefix, {
      width: W - 120,
      height: 600,
      fontSize: 120,
      uppercase: true,
      accentColor: ZEVO_BRAND.visual.primaryColor,
    });
    if (frames.length > 0) {
      // Reveal each word evenly across the first 70% of the shot, hold full caption for 20%, fade out 10%.
      const revealEnd = Math.min(dur * 0.7, dur - 0.5);
      const perWord = revealEnd / frames.length;
      const holdEnd = dur - 0.35;

      // Add an input per caption frame
      let inputIdx = inputs.length;
      for (const f of frames) inputs.push(`-loop 1 -i "${f.path}"`);

      // Each frame is visible during [i*perWord, (i+1)*perWord); last frame stays through holdEnd then fades out.
      const captionFilters: string[] = [];
      const overlayChain: string[] = [];
      let current = lastLabel;
      for (let i = 0; i < frames.length; i++) {
        const start = (i * perWord).toFixed(3);
        const isLast = i === frames.length - 1;
        const end = isLast ? holdEnd.toFixed(3) : ((i + 1) * perWord).toFixed(3);
        const lbl = `cap${i}`;
        if (isLast) {
          // Fade-out for the final state
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
      position: absolute; left: 0; right: 0; top: 720px;
      text-align: center;
      font-size: 200px; font-weight: 900;
      letter-spacing: -10px;
      color: white;
    }
    .brand .dot { color: ${ZEVO_BRAND.visual.primaryColor}; }
    .tagline {
      position: absolute; left: 0; right: 0; top: 980px;
      text-align: center;
      font-size: 56px; font-weight: 500; color: rgba(255,255,255,0.78);
      letter-spacing: -1px;
    }
    .pill {
      position: absolute; left: 140px; top: 1240px;
      width: 800px; height: 220px;
      background: ${ZEVO_BRAND.visual.primaryColor};
      border-radius: 110px;
      display: flex; align-items: center; justify-content: center;
      font-size: 96px; font-weight: 900; color: ${ZEVO_BRAND.visual.backgroundColor};
      letter-spacing: -2px;
      box-shadow: 0 30px 60px rgba(16,220,120,0.32);
    }
    .social {
      position: absolute; left: 0; right: 0; bottom: 120px;
      text-align: center;
      font-size: 38px; font-weight: 700; color: rgba(255,255,255,0.55);
      letter-spacing: 1px;
    }
  </style></head><body>
    <div class="card">
      <div class="brand">zevo<span class="dot">.</span></div>
      <div class="tagline">${oneLiner}</div>
      <div class="pill">${cta}</div>
      <div class="social">${ZEVO_BRAND.social.instagram.replace("@", "")} · ${ZEVO_BRAND.social.x.replace("@", "")}</div>
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
  const cmd = `ffmpeg -y -i "${videoPath}" -i "${audioPath}" -filter_complex "[1:a]apad=whole_dur=${totalDur},afade=t=in:st=0:d=0.2,afade=t=out:st=${fadeOutStart.toFixed(2)}:d=0.4,volume=1.0[a]" -map 0:v -map "[a]" -t ${totalDur} -c:v copy -c:a aac -b:a 192k "${outPath}"`;
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
  whooshPath: string,
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

  // Whoosh at each non-final shot transition: place it -0.2s before the cut.
  const whooshLabels: string[] = [];
  for (let i = 0; i < shotEndTimes.length; i++) {
    inputs.push(`-i "${whooshPath}"`);
    const delayMs = Math.max(0, Math.round((shotEndTimes[i] - 0.2) * 1000));
    audioStreams.push(
      `[${inputIdx}:a]adelay=${delayMs}|${delayMs},volume=0.7[w${i}]`
    );
    whooshLabels.push(`[w${i}]`);
    inputIdx++;
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
  const cmd = `ffmpeg -y ${inputs.join(" ")} -filter_complex "${filter}" -map 0:v -map "[aout]" -t ${totalDur} -c:v copy -c:a aac -b:a 192k "${outPath}"`;
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
      const shotParts: { path: string; durationSec: number }[] = [];
      const shotMeta: RenderedAd["shots"] = [];

      for (let i = 0; i < concept.shotlist.length; i++) {
        const shot = concept.shotlist[i];
        const [start, end] = shot.seconds;
        const dur = Math.max(1, end - start);
        const asset = manifest[concept.id]?.find((m: any) => m.shotIdx === i);
        const shotPath = join(workDir, `shot-${i}.mp4`);
        const caption = shot.onScreenText?.[lang];
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
          outPath: shotPath,
          kenBurnsDirection: i % 2 === 0 ? "in" : "out",
        });
        shotParts.push({ path: shotPath, durationSec: dur });
        shotMeta.push({
          seconds: [start, end],
          sourceUrl: asset?.sourceUrl,
          sourcePath: asset?.localPath,
          provider: asset ? (asset.source === "pexels" ? "pexels" : "placeholder") : "placeholder",
        });
      }

      // Polished end card (2.2s)
      const ctaPath = join(workDir, `cta.mp4`);
      const ctaDur = 2.2;
      await renderCtaCard({
        cta: concept.cta[lang],
        oneLiner: ZEVO_BRAND.oneLiner[lang],
        durationSec: ctaDur,
        outPath: ctaPath,
        workDir,
      });
      shotParts.push({ path: ctaPath, durationSec: ctaDur });

      // Concat with crossfades
      const concatPath = join(workDir, "concat.mp4");
      await concatWithCrossfade(shotParts, concatPath);

      // Voiceover
      const voScript = concept.shotlist.map((s) => s.voiceover[lang]).join(" ... ");
      const voPath = join(workDir, "vo.mp3");
      const voProvider = await generateVoiceover({ text: voScript, lang, outPath: voPath });

      const finalPath = join(rendersDir, `${concept.id}-${lang}.mp4`);
      const totalDur = await probeDuration(concatPath);

      // Background music — try ElevenLabs, fall back to none.
      const musicPath = join(workDir, "music.mp3");
      const musicResult = await generateMusic({
        prompt: buildMusicPrompt(concept.musicMood || "uplifting energetic", totalDur),
        durationSec: Math.ceil(totalDur),
        outPath: musicPath,
      });

      // SFX: whoosh + impact (procedural, always available)
      const whooshPath = join(workDir, "whoosh.wav");
      const impactPath = join(workDir, "impact.wav");
      await generateWhoosh(whooshPath, 0.45);
      await generateImpact(impactPath);

      // Compute shot end times (cumulative, accounting for XFADE_DUR overlap)
      const shotEndTimes: number[] = [];
      let acc = 0;
      for (let i = 0; i < shotParts.length - 1; i++) {
        acc += shotParts[i].durationSec - (i === 0 ? 0 : XFADE_DUR);
        shotEndTimes.push(acc);
      }
      // CTA starts when the last (CTA) part begins
      const ctaStartTime = Math.max(0, totalDur - shotParts[shotParts.length - 1].durationSec + XFADE_DUR);

      const hasVoice = voProvider !== "skipped" && existsSync(voPath);
      if (hasVoice || musicResult) {
        await muxRichAudio(
          concatPath,
          hasVoice ? voPath : null,
          musicResult,
          whooshPath,
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
