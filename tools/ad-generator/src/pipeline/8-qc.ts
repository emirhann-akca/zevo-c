/**
 * Phase 8 — Quality Control
 *
 * After rendering, sample N frames from each finished MP4 and ask Gemini 2.5 Pro Vision
 * to grade the ad. Gemini has full editorial authority: it returns a structured verdict
 * (PASS / WARN / FAIL) per ad plus per-frame critique. The report is written to
 * `output/<date>/qc-report.json` and a summary is printed to the console.
 *
 * Why: rendered videos can have caption/UI collision, bad crops, brand violations etc.
 * Gemini Vision catches what we cannot easily detect with ffprobe alone.
 */
import { mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { join } from "node:path";
import { generateWithLocalImages, isAvailable as llmAvailable } from "../llm.ts";
import { ZEVO_BRAND } from "../brand.ts";

const execp = promisify(exec);

// 5 frames sampled from the CONTENT portion only. The last ~5-6s is the brand outro
// (logo-reveal.mp4 — user-controlled, fixed, intentionally on-brand) which we EXCLUDE from
// QC so Gemini doesn't misread the logo animation or the App Store/Play badges as violations.
// runQc computes the content-only duration and remaps these percentages accordingly.
const SAMPLE_PCTS = [0.08, 0.28, 0.48, 0.68, 0.88];
const OUTRO_DURATION_SEC = 5.85; // matches brand-assets/videos/logo-reveal.mp4 length

export type QcVerdict = "PASS" | "WARN" | "FAIL";

export interface FrameCritique {
  frameIdx: number;
  timestampSec: number;
  captionReadability: number; // 0-10
  textCollision: boolean;
  framingOk: boolean;
  brandConsistent: boolean;
  notes: string;
}

export interface ViralityScores {
  hookStrength: number;        // 0-100 — first 3 seconds attention-grab
  holdPrediction: number;      // 0-100 — scene variety, cut rhythm, visual interest
  captionHook: number;         // 0-100 — opening words punch
  brandSafety: number;         // 0-100 — production quality + brand consistency
}

export interface AdQcReport {
  conceptId: string;
  lang: string;
  videoPath: string;
  durationSec: number;
  verdict: QcVerdict;
  overallScore: number;        // 0-100 weighted aggregate
  virality: ViralityScores;
  summary: string;
  frames: FrameCritique[];
  recommendations: string[];
  iteration?: number;          // 0 = first attempt, 1 = first retry, etc.
}

const SYSTEM_PROMPT = `You are the senior creative director reviewing finished Zevo ad videos before they ship to Meta Ads. You see ${SAMPLE_PCTS.length} sampled frames per ad (in chronological order). Your job is to grade ruthlessly — Zevo's brand reputation is on the line.

Brand rules Zevo NEVER violates:
- Primary accent color: ${ZEVO_BRAND.visual.primaryColor} (emerald)
- Tone: ${ZEVO_BRAND.voice.tone}
- Captions must be readable — high-contrast, no overlap with app UI text already present in the footage
- The sampled frames are from the AD CONTENT only — the brand outro is NOT included. If you nevertheless see a frame depicting the neon-emerald 'ZEVO' logo (rendered with a circuit-board pattern on the 'Z'), the 'Cebindeki Antrenör' tagline, or 'Google Play' / 'App Store'dan İndirin' badges on dark navy: this is the OFFICIAL ZEVO OUTRO. Score it PASS for brandSafety. Do NOT flag it as "misspelled logo" (the circuit-style 'Z' is intentional design, not a typo), and do NOT flag the tagline or store badges as a "CTA card violation" — they are required brand elements.
- Vertical 9:16, important content within the safe zone (not cropped at edges)
- Stock footage may show the Zevo app UI (which has its own emerald accents, app text like "TEKRAR", "FORM", number counters, "DİPTE"/"ÜSTTE" labels). The app UI is on-brand — do NOT flag emerald inside the app as "off-brand colors". Only flag colors that compete with brand emerald: red, orange, lime, neon pink etc. in the surrounding scene.

What to inspect on EVERY frame:
1. Caption readability (0-10): is the on-screen text easy to read at thumb-scrolling speed? Does the background fight it?
2. Text collision: does the caption overlap with text already in the footage (app UI labels like "TEKRAR", "FORM", numbers, etc.)?
3. Framing: is anything important cropped? Is the phone/person/app screen entirely visible?
4. Brand consistency: is the emerald accent visible somewhere? No off-brand colors dominating? No competitor logos?

ALSO score the ad on 4 VIRALITY dimensions (0-100 each):
- hookStrength: Does the very first frame (~3s) grab attention? Pattern interrupt? Curiosity? Question? Bold visual? A boring "we are a fitness app" opening scores low.
- holdPrediction: Across the sampled frames, is there visual variety — different scenes, angles, motion, color? A static slideshow scores low. Fast-paced, varied = high.
- captionHook: The opening caption text (frame 1). Is it a punchy hook ("Bu hatayı yaparsan…", "Antrenörün yanlış söylüyor") or generic ("Welcome to Zevo")? Score the hook strength.
- brandSafety: Production quality + brand consistency overall. Off-brand colors / cropped logos / amateurish frames lower this.

Then aggregate to a final verdict for the whole ad:
- PASS: ready to ship (overallScore >= 70 and no critical brand violations)
- WARN: usable but has fixable issues (overallScore 50-69)
- FAIL: do not ship (overallScore < 50 OR critical brand violation)

Output ONLY a JSON object, no markdown, matching this shape:
{
  "verdict": "PASS"|"WARN"|"FAIL",
  "overallScore": 0-100,
  "virality": {
    "hookStrength": 0-100,
    "holdPrediction": 0-100,
    "captionHook": 0-100,
    "brandSafety": 0-100
  },
  "summary": "one-sentence verdict",
  "frames": [
    {
      "frameIdx": 0,
      "captionReadability": 0-10,
      "textCollision": true|false,
      "framingOk": true|false,
      "brandConsistent": true|false,
      "notes": "specific observation, max 20 words"
    }
  ],
  "recommendations": ["specific fix 1 (actionable for next render)", "specific fix 2"]
}`;

async function probeDuration(path: string): Promise<number> {
  try {
    const { stdout } = await execp(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${path}"`);
    return parseFloat(stdout.trim()) || 0;
  } catch {
    return 0;
  }
}

async function sampleFrames(videoPath: string, durationSec: number, outDir: string, prefix: string): Promise<string[]> {
  await mkdir(outDir, { recursive: true }).catch(() => {});
  const paths: string[] = [];
  // Exclude the outro: sample only from [0, contentEnd]. If the ad is shorter than the outro
  // (shouldn't happen in practice), fall back to sampling 0–80% of total.
  const contentEnd = Math.max(durationSec * 0.5, durationSec - OUTRO_DURATION_SEC);
  for (let i = 0; i < SAMPLE_PCTS.length; i++) {
    const t = Math.max(0.1, Math.min(contentEnd - 0.1, contentEnd * SAMPLE_PCTS[i]));
    const out = join(outDir, `${prefix}-${i}.jpg`);
    // Downscale to 720 wide → smaller upload, plenty for Gemini Vision
    await execp(
      `ffmpeg -y -ss ${t.toFixed(2)} -i "${videoPath}" -frames:v 1 -vf "scale=720:-1" -q:v 3 "${out}"`
    ).catch((e) => {
      console.warn(`[qc] failed to sample frame at t=${t.toFixed(2)}: ${(e as Error).message}`);
    });
    if (existsSync(out)) paths.push(out);
  }
  return paths;
}

function parseGeminiJson(raw: string): any {
  let body = raw.trim();
  // Strip optional ```json fences (may be unbalanced if response was truncated)
  const fenceStart = body.match(/^```(?:json)?\s*/);
  if (fenceStart) body = body.slice(fenceStart[0].length);
  const fenceEnd = body.match(/```\s*$/);
  if (fenceEnd) body = body.slice(0, -fenceEnd[0].length);
  // Find the largest balanced { ... } substring
  const firstBrace = body.indexOf("{");
  if (firstBrace < 0) throw new Error("no JSON object found");
  let depth = 0;
  let lastClose = -1;
  let inString = false;
  let escape = false;
  for (let i = firstBrace; i < body.length; i++) {
    const ch = body[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") depth++;
    else if (ch === "}") { depth--; if (depth === 0) { lastClose = i; break; } }
  }
  if (lastClose < 0) throw new Error("unbalanced JSON (response likely truncated)");
  return JSON.parse(body.slice(firstBrace, lastClose + 1));
}

async function qcOneAd(
  conceptId: string,
  lang: string,
  videoPath: string,
  workDir: string,
  concept: any
): Promise<AdQcReport> {
  const durationSec = await probeDuration(videoPath);
  const framesDir = join(workDir, "qc-frames", `${conceptId}-${lang}`);
  const framePaths = await sampleFrames(videoPath, durationSec, framesDir, "frame");

  if (framePaths.length === 0) {
    return {
      conceptId,
      lang,
      videoPath,
      durationSec,
      verdict: "FAIL",
      overallScore: 0,
      virality: { hookStrength: 0, holdPrediction: 0, captionHook: 0, brandSafety: 0 },
      summary: "Could not sample frames for QC",
      frames: [],
      recommendations: ["Re-run render and verify the MP4 is valid"],
    };
  }

  const scriptLines = (concept?.scenes ?? [])
    .map((s: any, i: number) => `Scene ${i + 1} (${s.seconds?.[0]}-${s.seconds?.[1]}s): "${s.voiceover?.[lang] ?? s.voiceover ?? ""}"`)
    .join("\n");

  const userPrompt = `Concept: ${concept?.title ?? conceptId}\nHook: ${concept?.hook ?? "(n/a)"}\nLanguage: ${lang}\nDuration: ${durationSec.toFixed(1)}s\n\nScript:\n${scriptLines}\n\nReview the ${framePaths.length} attached frames (chronological) and output the JSON verdict.`;

  let raw: string;
  try {
    raw = await generateWithLocalImages({
      system: SYSTEM_PROMPT,
      user: userPrompt,
      imagePaths: framePaths,
      model: "heavy",
      temperature: 0.2,
      maxOutputTokens: 8192,
    });
  } catch (err) {
    return {
      conceptId,
      lang,
      videoPath,
      durationSec,
      verdict: "WARN",
      overallScore: 50,
      virality: { hookStrength: 0, holdPrediction: 0, captionHook: 0, brandSafety: 0 },
      summary: `Vision call failed: ${(err as Error).message}`,
      frames: [],
      recommendations: ["Retry QC after the API issue is resolved"],
    };
  }

  let parsed: any;
  try {
    parsed = parseGeminiJson(raw);
  } catch {
    return {
      conceptId,
      lang,
      videoPath,
      durationSec,
      verdict: "WARN",
      overallScore: 50,
      virality: { hookStrength: 0, holdPrediction: 0, captionHook: 0, brandSafety: 0 },
      summary: "Gemini returned non-JSON; manual review needed",
      frames: [],
      recommendations: [`Raw response: ${raw.slice(0, 200)}`],
    };
  }

  const frames: FrameCritique[] = (parsed.frames ?? []).map((f: any, i: number) => ({
    frameIdx: i,
    timestampSec: durationSec * SAMPLE_PCTS[Math.min(i, SAMPLE_PCTS.length - 1)],
    captionReadability: Number(f.captionReadability ?? 0),
    textCollision: !!f.textCollision,
    framingOk: f.framingOk !== false,
    brandConsistent: f.brandConsistent !== false,
    notes: String(f.notes ?? ""),
  }));

  const v = parsed.virality ?? {};
  return {
    conceptId,
    lang,
    videoPath,
    durationSec,
    verdict: (parsed.verdict as QcVerdict) ?? "WARN",
    overallScore: Number(parsed.overallScore ?? 0),
    virality: {
      hookStrength: Number(v.hookStrength ?? 0),
      holdPrediction: Number(v.holdPrediction ?? 0),
      captionHook: Number(v.captionHook ?? 0),
      brandSafety: Number(v.brandSafety ?? 0),
    },
    summary: String(parsed.summary ?? ""),
    frames,
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.map(String) : [],
  };
}

export async function runQc(opts: { outputDir: string; cleanupFrames?: boolean }): Promise<AdQcReport[]> {
  if (!llmAvailable()) {
    console.warn("[qc] Vertex AI not configured — skipping QC");
    return [];
  }
  const rendersPath = join(opts.outputDir, "renders.json");
  const conceptsPath = join(opts.outputDir, "concepts.json");
  if (!existsSync(rendersPath) || !existsSync(conceptsPath)) {
    console.warn("[qc] renders.json or concepts.json missing — skipping QC");
    return [];
  }
  const renders = JSON.parse(await readFile(rendersPath, "utf8")) as any[];
  const concepts = JSON.parse(await readFile(conceptsPath, "utf8")) as any[];
  const conceptMap = new Map(concepts.map((c: any) => [c.id, c]));

  const reports: AdQcReport[] = [];
  const workDir = join(opts.outputDir, "_qc");
  await mkdir(workDir, { recursive: true }).catch(() => {});

  for (const r of renders) {
    const concept = conceptMap.get(r.conceptId);
    if (!r.videoPath || !existsSync(r.videoPath)) {
      console.warn(`[qc] ${r.conceptId} [${r.lang}] — videoPath missing, skipping`);
      continue;
    }
    console.log(`[qc] reviewing ${r.conceptId} [${r.lang}]...`);
    const report = await qcOneAd(r.conceptId, r.lang, r.videoPath, workDir, concept);
    reports.push(report);
    const emoji = report.verdict === "PASS" ? "✓" : report.verdict === "WARN" ? "⚠" : "✗";
    console.log(`[qc]   ${emoji} ${report.verdict} (${report.overallScore}/100) — ${report.summary}`);
    if (report.recommendations.length > 0) {
      for (const rec of report.recommendations) console.log(`[qc]     → ${rec}`);
    }
  }

  const reportPath = join(opts.outputDir, "qc-report.json");
  await writeFile(reportPath, JSON.stringify(reports, null, 2));
  console.log(`[qc] report → ${reportPath}`);

  if (opts.cleanupFrames) {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }

  const fails = reports.filter((r) => r.verdict === "FAIL").length;
  const warns = reports.filter((r) => r.verdict === "WARN").length;
  const passes = reports.filter((r) => r.verdict === "PASS").length;
  console.log(`[qc] verdict — PASS:${passes} WARN:${warns} FAIL:${fails}`);

  return reports;
}
