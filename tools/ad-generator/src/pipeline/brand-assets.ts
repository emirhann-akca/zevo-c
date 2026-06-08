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

/**
 * Assets that are reserved for the auto-appended outro (NOT exposed to concept generator
 * or per-shot asset picker — they always run at the very end of every video).
 */
const RESERVED_OUTRO_IDS = new Set(["logo-reveal"]);

/**
 * Per-tip brand-asset whitelists. When the user requests a focused ad type (e.g. nutrition),
 * we restrict the brand-asset pool to ONLY the IDs relevant to that feature so the AI doesn't
 * sneak in unrelated UI footage. `null` means "all available" (no restriction).
 */
// Whitelists filter by asset.feature (preferred) — falls back to asset.id matching for legacy.
// `null` = all assets allowed. Whitelisting by feature keeps the rule future-proof when new
// assets get added with matching features.
const TIP_FEATURE_WHITELIST: Record<string, Set<string> | null> = {
  klasik: null, // mixes everything
  kurucu: null, // founder story — all assets fair game
  donusum: null, // before/after — Zevo is the turning point, so ALL product UI is on-message
  "pattern-interrupt": null, // unrelated opener -> bridge -> any feature reveal; all assets fair game
  "form-check": new Set(["ai-form-check", "onboarding", "lifestyle"]),
  antrenman: new Set(["workout-plan", "onboarding", "lifestyle"]),
  beslenme: new Set(["nutrition", "onboarding", "lifestyle"]),
  basari: new Set(["ai-form-check", "workout-plan", "lifestyle"]), // transformation-state assets shine here
  motivasyon: new Set(["lifestyle"]), // minimum UI; brand outro auto-appended elsewhere
};

let _cacheKey: string | null = null;

export async function loadBrandAssets(brandAssetsDir: string, tip?: string): Promise<BrandAsset[]> {
  const cacheKey = `${brandAssetsDir}::${tip ?? "all"}`;
  if (_cache && _cacheKey === cacheKey) return _cache;
  const manifestPath = join(brandAssetsDir, "manifest.json");
  if (!existsSync(manifestPath)) {
    _cache = [];
    _baseDir = brandAssetsDir;
    _cacheKey = cacheKey;
    return _cache;
  }
  const raw = await readFile(manifestPath, "utf8");
  const json = JSON.parse(raw) as { assets: BrandAsset[] };
  const featureWhitelist = tip ? TIP_FEATURE_WHITELIST[tip] : null;
  // Filter to assets that (a) exist on disk, (b) aren't reserved for outro, (c) are allowed by tip
  const usable: BrandAsset[] = [];
  for (const a of json.assets) {
    if (RESERVED_OUTRO_IDS.has(a.id)) continue;
    if (featureWhitelist && !featureWhitelist.has(a.feature)) continue;
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
  _cacheKey = cacheKey;
  const tipLabel = tip && featureWhitelist ? ` (tip=${tip}, features=${[...featureWhitelist].join(",")})` : "";
  console.log(`[brand-assets] loaded ${usable.length} usable assets (logo-reveal reserved for auto-outro)${tipLabel}`);
  return usable;
}

/**
 * Asks Gemini Vision to pick the best brand asset (if any) for a given shot.
 * Returns asset id or null if no brand asset is a good fit (so caller falls back to Pexels).
 *
 * Shot-position rules (enforced BEFORE asking Gemini — saves a model call when answer is obvious):
 *   - Hook (shotIdx === 0): NEVER pick a brand UI/feature asset. The hook MUST be cinematic
 *     stock footage. Only "neutral-state" lifestyle assets are allowed (rarely a good fit anyway).
 *   - Problem zone (shotIdx in first 30% of shotlist, but not shot 0): filter OUT feature-demo
 *     and transformation-state brand UI assets — those are payoff material, not problem material.
 *     Only allow neutral-state / problem-state / lifestyle assets.
 *   - Solution / payoff (shotIdx >= 30%): all assets fair game.
 */
export interface PickContext {
  shotIdx: number;
  totalShots: number;
}

function filterByShotPosition(assets: BrandAsset[], ctx: PickContext): BrandAsset[] {
  const { shotIdx, totalShots } = ctx;
  // Hook = first shot: ZERO brand UI allowed. Only lifestyle/neutral allowed (and even those rarely picked).
  if (shotIdx === 0) {
    return assets.filter((a) => {
      const narrative = (a.narrative ?? "").toLowerCase();
      const feature = (a.feature ?? "").toLowerCase();
      return feature === "lifestyle" || narrative.startsWith("neutral-state");
    });
  }
  // Problem zone: early shots (e.g., shot 1 in a 5-shot ad, shots 1-2 in a 7-shot ad).
  // No feature-demo / transformation-state UI here.
  const problemZoneEnd = Math.max(1, Math.floor(totalShots * 0.3));
  if (shotIdx < problemZoneEnd) {
    return assets.filter((a) => {
      const narrative = (a.narrative ?? "").toLowerCase();
      if (narrative.startsWith("feature-demo")) return false;
      if (narrative.startsWith("transformation-state")) return false;
      if (narrative.startsWith("brand-magic")) return false; // outro material
      return true;
    });
  }
  // LAST shot (right before outro logo): the EMOTIONAL CLIMAX. We deliberately return an
  // EMPTY list here so the picker fails fast → caller falls through to Pexels, which provides
  // varied triumph/celebration footage. Using brand assets here makes every ad end with the
  // same clip (we only have one lifestyle clip, and transformation-state ones are app UI —
  // neither delivers the cinematic peak the final beat needs).
  // If Pexels ALSO fails, lastResortBrandAsset still kicks in — so we never go empty.
  if (shotIdx === totalShots - 1) {
    return [];
  }
  // Solution / mid: anything goes.
  return assets;
}

// Words/phrases that signal a PROBLEM shot — when these appear in the visual or voiceover,
// the picker MUST return null so the shot pulls real footage from Pexels (showing actual
// bad form / injury / frustration), not our app catching the problem.
const PROBLEM_KEYWORDS = [
  // Turkish
  "yanlış", "yanliş", "kötü form", "hatalı", "sakatlan", "sakatlık", "sakatlığ", "ağrı",
  "tehlikeli", "incin", "zarar", "yanlış form", "bozuk form", "frustra", "bıktın", "yorgun",
  "umutsuz", "çaresiz", "kayıt yok", "tahmin", "şanslı değil",
  // English
  "wrong", "bad form", "incorrect", "injury", "injured", "pain", "hurt", "struggling",
  "frustrated", "exhausted", "dangerous", "risk", "wasted", "guessing", "alone",
];

function looksLikeProblemShot(visual: string, voiceover: string): boolean {
  const text = `${visual} ${voiceover}`.toLowerCase();
  return PROBLEM_KEYWORDS.some((kw) => text.includes(kw));
}

export async function pickBrandAsset(
  shotVisual: string,
  voiceoverLine: string,
  assets: BrandAsset[],
  context?: PickContext
): Promise<BrandAsset | null> {
  if (assets.length === 0) return null;

  // HARD GUARD: if the shot's text describes a PROBLEM (wrong form, injury, frustration),
  // never use a brand asset. Our brand footage shows Zevo working correctly — even AI form
  // check screens with a low score still depict the app catching the problem, not the
  // problem itself. Real-world problem footage must come from Pexels (real human + bad form).
  if (looksLikeProblemShot(shotVisual, voiceoverLine)) return null;

  const filtered = context ? filterByShotPosition(assets, context) : assets;
  if (filtered.length === 0) return null; // shot position forbids any brand asset → forces Pexels

  const summary = filtered.map((a, i) => `${i}: [${a.feature}] ${a.id} — ${a.description.slice(0, 200)}`).join("\n");
  const posHint = context
    ? `\nShot position: ${context.shotIdx + 1} of ${context.totalShots}.${context.shotIdx < Math.floor(context.totalShots * 0.3) ? " This is an EARLY/PROBLEM shot — only use a brand asset if it genuinely depicts the problem (not a feature-demo)." : context.shotIdx >= Math.floor(context.totalShots * 0.7) ? " This is a LATE/PAYOFF shot — transformation/feature-demo assets are ideal." : " This is a MID/SOLUTION shot — feature-demo assets work well here."}`
    : "";
  try {
    const out = await generate({
      system: `You are choosing whether to use a real product screenshot/video instead of stock footage for a shot in a Zevo (AI fitness app) ad.

CRITICAL RULE: Brand assets ALWAYS depict Zevo working correctly. They are NEVER the "problem footage". Even AI form-check screens that show a low form score (e.g. score 50) are the APP CATCHING the problem — they belong in SOLUTION shots, not problem shots. If the shot's voiceover or visual describes:
- wrong / bad form (yanlış form, hatalı, bozuk)
- injury risk (sakatlık, ağrı, tehlikeli, incinmek)
- frustration / struggle / exhaustion (yorgun, umutsuz, çaresiz, bıktın)
- generic doing-it-alone-without-help imagery

→ Reply "none". Pexels stock will show real humans doing real wrong form / real injury / real struggle. Brand assets only fit shots where Zevo's response is the focus (form correction, personalized plan, perfect form, transformation, nutrition tracking, etc.).

For all other shots: real product footage is preferred BUT only when it genuinely matches the shot's intent AND narrative position. Reply with either the index (0,1,2,...) of the best matching asset, OR "none" if no asset fits. Generic stock is better than a misplaced product shot.`,
      user: `Available brand assets:\n${summary}\n${posHint}\n\nShot visual: "${shotVisual}"\nVoiceover at this moment: "${voiceoverLine}"\n\nWhich asset index matches? Reply with a single digit or "none".`,
      model: "fast",
      maxOutputTokens: 512, // Gemini 2.5 burns "thinking" tokens before visible output; 16 was empty
      temperature: 0.1,
    });
    const trimmed = out.trim().toLowerCase();
    if (trimmed.startsWith("none")) return null;
    const m = trimmed.match(/\d+/);
    if (!m) return null;
    const idx = parseInt(m[0], 10);
    if (idx >= 0 && idx < filtered.length) return filtered[idx];
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
