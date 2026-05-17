/**
 * Brand-asset registry: real Zevo screenshots and screen recordings.
 * Used by the concept generator (to know which features are visually showable)
 * and by the asset picker (to prefer real product footage over Pexels stock).
 */
import { readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { join, resolve } from "node:path";
import { generate, generateWithImages } from "../llm.ts";

const execpBase = promisify(exec);
const execp = (cmd: string) => execpBase(cmd, { maxBuffer: 64 * 1024 * 1024 });

export interface BrandAsset {
  id: string;
  type: "image" | "video";
  path: string;
  description: string;
  tags: string[];
  feature: string;
  narrative: string;
  duration_hint_sec?: number;
}

const W = 1080;
const H = 1920;
const FPS = 30;

let _cache: BrandAsset[] | null = null;
let _baseDir: string | null = null;

export async function loadBrandAssets(brandAssetsDir: string): Promise<BrandAsset[]> {
  if (_cache && _baseDir === brandAssetsDir) return _cache;
  const manifestPath = join(brandAssetsDir, "manifest.json");
  if (!existsSync(manifestPath)) {
    _cache = [];
    _baseDir = brandAssetsDir;
    return _cache;
  }
  const raw = await readFile(manifestPath, "utf8");
  const json = JSON.parse(raw) as { assets: BrandAsset[] };
  // Filter to assets whose file actually exists on disk
  const usable: BrandAsset[] = [];
  for (const a of json.assets) {
    const abs = resolve(brandAssetsDir, a.path);
    try {
      await stat(abs);
      usable.push({ ...a, path: abs });
    } catch {
      console.warn(`[brand-assets] missing file: ${a.id} (${a.path})`);
    }
  }
  _cache = usable;
  _baseDir = brandAssetsDir;
  console.log(`[brand-assets] loaded ${usable.length} usable assets`);
  return usable;
}

/**
 * Asks Gemini Vision to pick the best brand asset (if any) for a given shot.
 * Returns asset id or null if no brand asset is a good fit (so caller falls back to Pexels).
 */
export async function pickBrandAsset(
  shotVisual: string,
  voiceoverLine: string,
  assets: BrandAsset[]
): Promise<BrandAsset | null> {
  if (assets.length === 0) return null;

  const summary = assets.map((a, i) => `${i}: [${a.feature}] ${a.id} — ${a.description.slice(0, 200)}`).join("\n");
  try {
    const out = await generate({
      system: `You are choosing whether to use a real product screenshot/video instead of stock footage for a shot in a Zevo (AI fitness app) ad. Real product footage is heavily preferred BUT only when it genuinely matches the shot's intent. Reply with either the index (0,1,2,...) of the best matching asset, OR "none" if no asset fits well enough — do not force a match.`,
      user: `Available brand assets:\n${summary}\n\nShot visual: "${shotVisual}"\nVoiceover at this moment: "${voiceoverLine}"\n\nWhich asset index matches? Reply with a single digit or "none".`,
      model: "fast",
      maxOutputTokens: 16,
      temperature: 0.1,
    });
    const trimmed = out.trim().toLowerCase();
    if (trimmed.startsWith("none")) return null;
    const m = trimmed.match(/\d+/);
    if (!m) return null;
    const idx = parseInt(m[0], 10);
    if (idx >= 0 && idx < assets.length) return assets[idx];
    return null;
  } catch (err) {
    console.warn(`[brand-assets] pick failed:`, (err as Error).message);
    return null;
  }
}

/**
 * Converts a still brand image into a 9:16 video clip with Ken Burns motion.
 * Subtle zoom-in + slight pan for cinematic feel.
 */
export async function imageToKenBurnsClip(opts: {
  imagePath: string;
  durationSec: number;
  outPath: string;
  direction?: "in" | "out";
}): Promise<void> {
  const dur = opts.durationSec;
  const frames = Math.ceil(dur * FPS);
  const dir = opts.direction ?? "in";
  // Zoom from 1.0 → 1.08 (in) or 1.08 → 1.0 (out). Slight horizontal drift for parallax.
  const zoomExpr = dir === "in" ? `min(1.0+0.0008*on,1.08)` : `max(1.08-0.0008*on,1.0)`;
  const xExpr = `iw/2-(iw/zoom/2)+sin(on/30)*8`;
  const yExpr = `ih/2-(ih/zoom/2)`;
  const cmd = `ffmpeg -y -loop 1 -i "${opts.imagePath}" -filter_complex "[0:v]scale=${W * 1.2}:${H * 1.2}:force_original_aspect_ratio=increase,crop=${W * 1.1}:${H * 1.1},zoompan=z='${zoomExpr}':x='${xExpr}':y='${yExpr}':d=${frames}:s=${W}x${H}:fps=${FPS},format=yuv420p" -t ${dur} -r ${FPS} -c:v libx264 -pix_fmt yuv420p -preset veryfast -crf 20 -an "${opts.outPath}"`;
  await execp(cmd);
}

/**
 * Conforms a brand video clip to 9:16 1080x1920, trimming/looping to fit duration.
 */
export async function videoToShotClip(opts: {
  videoPath: string;
  durationSec: number;
  outPath: string;
}): Promise<void> {
  const dur = opts.durationSec;
  const cmd = `ffmpeg -y -stream_loop -1 -i "${opts.videoPath}" -filter_complex "[0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1,trim=duration=${dur},setpts=PTS-STARTPTS,format=yuv420p" -t ${dur} -r ${FPS} -c:v libx264 -pix_fmt yuv420p -preset veryfast -crf 20 -an "${opts.outPath}"`;
  await execp(cmd);
}
