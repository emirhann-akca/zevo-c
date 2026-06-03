/**
 * Phase 9 — Decision Loop
 *
 * Reads the QC report. For each ad with overallScore < threshold, regenerates the
 * concept with QC feedback injected, then re-runs assets + render + qc for that
 * single concept. Stops when either:
 *   - overallScore >= threshold (accept current cut)
 *   - retry count hits maxRetries (accept the BEST attempt across iterations)
 *
 * The whole loop is per-(conceptId, lang). Each iteration writes its renders into a
 * suffixed file (`<id>-<lang>-iter<N>.mp4`) so previous attempts are preserved for
 * audit. The final winning cut is also copied to `<id>-<lang>.mp4` (canonical path).
 */
import { readFile, writeFile, copyFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { generate } from "../llm.ts";
import { gatherAssets } from "./4-assets.ts";
import { renderAds } from "./6-render.ts";
import { runQc, type AdQcReport } from "./8-qc.ts";
import { updateMemoryFromReports } from "./memory.ts";
import { ZEVO_BRAND } from "../brand.ts";

const CONCEPT_REVISION_SYSTEM = `You are the lead Zevo ad copywriter revising a concept that QC scored below the acceptable threshold. You receive: the previous concept JSON, the QC critique, and the brand rules. Output a REVISED concept JSON that addresses every recommendation. Keep the same id. Change scenes, hook, or voiceover lines as needed to lift the weakest virality dimension.

Brand rules NEVER violated:
- Tone: ${ZEVO_BRAND.voice.tone}
- Primary color: ${ZEVO_BRAND.visual.primaryColor} (emerald)
- TR-only output (do not include EN unless previous concept had EN)
- Visual fields stay in English (2-5 word Pexels-search-friendly phrases)
- Hook MUST be a pattern-interrupt: bold question, contrarian statement, shock stat, or "you're doing X wrong" — NOT "welcome to / discover / Zevo helps you"

Output ONLY the revised concept JSON object, no markdown, same schema as input.`;

export interface IterateOptions {
  outputDir: string;
  threshold: number;          // default 60
  maxRetries: number;         // default 2 (so up to 3 total attempts per ad)
  langs: ("tr" | "en")[];
  cleanupFrames?: boolean;
}

export interface IterationHistory {
  conceptId: string;
  lang: string;
  attempts: { iteration: number; videoPath: string; overallScore: number; verdict: string }[];
  finalVideoPath: string;
  finalScore: number;
  reason: "accepted" | "max_retries";
}

function bestAttempt(attempts: IterationHistory["attempts"]) {
  return [...attempts].sort((a, b) => b.overallScore - a.overallScore)[0];
}

async function reviseConcept(concept: any, report: AdQcReport): Promise<any> {
  const user = `PREVIOUS CONCEPT (JSON):\n${JSON.stringify(concept, null, 2)}\n\nQC REPORT:\nOverall: ${report.overallScore}/100 (${report.verdict})\nVirality: hook=${report.virality.hookStrength}, hold=${report.virality.holdPrediction}, captionHook=${report.virality.captionHook}, brandSafety=${report.virality.brandSafety}\nSummary: ${report.summary}\n\nFrame notes:\n${report.frames.map((f, i) => `  ${i + 1}. ${f.notes}`).join("\n")}\n\nFix recommendations:\n${report.recommendations.map((r, i) => `  ${i + 1}. ${r}`).join("\n")}\n\nReturn the revised concept JSON object. Focus on lifting the lowest virality dimension.`;
  const text = await generate({
    system: CONCEPT_REVISION_SYSTEM,
    user,
    model: "heavy",
    temperature: 0.85,
    maxOutputTokens: 16384,
  });
  // Find first balanced { ... } object
  const firstBrace = text.indexOf("{");
  if (firstBrace < 0) throw new Error("revised concept: no JSON found");
  let depth = 0, lastClose = -1, inString = false, escape = false;
  for (let i = firstBrace; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") depth++;
    else if (ch === "}") { depth--; if (depth === 0) { lastClose = i; break; } }
  }
  if (lastClose < 0) throw new Error("revised concept: unbalanced JSON");
  return JSON.parse(text.slice(firstBrace, lastClose + 1));
}

export async function iterateDecisionLoop(opts: IterateOptions): Promise<IterationHistory[]> {
  const reportPath = join(opts.outputDir, "qc-report.json");
  const conceptsPath = join(opts.outputDir, "concepts.json");
  if (!existsSync(reportPath) || !existsSync(conceptsPath)) {
    console.warn("[iterate] qc-report.json or concepts.json missing — run render+qc first");
    return [];
  }

  const initialReports = JSON.parse(await readFile(reportPath, "utf8")) as AdQcReport[];
  const concepts = JSON.parse(await readFile(conceptsPath, "utf8")) as any[];
  const conceptIndex = new Map(concepts.map((c: any, i: number) => [c.id, i]));

  const histories: IterationHistory[] = [];

  for (const initial of initialReports) {
    const history: IterationHistory = {
      conceptId: initial.conceptId,
      lang: initial.lang,
      attempts: [
        {
          iteration: 0,
          videoPath: initial.videoPath,
          overallScore: initial.overallScore,
          verdict: initial.verdict,
        },
      ],
      finalVideoPath: initial.videoPath,
      finalScore: initial.overallScore,
      reason: "accepted",
    };

    // Already acceptable? Done — no need to even resolve the concept.
    if (initial.overallScore >= opts.threshold) {
      console.log(`[iterate] ${initial.conceptId} [${initial.lang}] ✓ score ${initial.overallScore} >= ${opts.threshold}, no retry needed`);
      histories.push(history);
      continue;
    }

    const conceptIdx = conceptIndex.get(initial.conceptId);
    if (conceptIdx == null) {
      console.warn(`[iterate] concept ${initial.conceptId} not found in concepts.json — cannot revise. Keeping as-is with score ${initial.overallScore}.`);
      history.reason = "max_retries";
      histories.push(history);
      continue;
    }

    console.log(`[iterate] ${initial.conceptId} [${initial.lang}] score ${initial.overallScore} < ${opts.threshold}, entering retry loop (max ${opts.maxRetries})`);

    let currentReport = initial;
    for (let retry = 1; retry <= opts.maxRetries; retry++) {
      console.log(`[iterate]   retry ${retry}/${opts.maxRetries} — revising concept...`);
      let revised: any;
      try {
        revised = await reviseConcept(concepts[conceptIdx], currentReport);
        // Preserve id
        revised.id = currentReport.conceptId;
        concepts[conceptIdx] = revised;
        await writeFile(conceptsPath, JSON.stringify(concepts, null, 2), "utf8");
      } catch (err) {
        console.warn(`[iterate]   concept revision failed: ${(err as Error).message} — stopping retries`);
        break;
      }

      // Re-run assets (only for this concept) + render + qc
      console.log(`[iterate]   re-gathering assets for ${currentReport.conceptId}...`);
      try {
        await gatherAssets({
          conceptsFile: conceptsPath,
          outputDir: opts.outputDir,
          conceptIds: [currentReport.conceptId],
        });
      } catch (err) {
        console.warn(`[iterate]   assets failed: ${(err as Error).message} — stopping retries`);
        break;
      }

      console.log(`[iterate]   re-rendering ${currentReport.conceptId}...`);
      try {
        await renderAds({
          conceptsFile: conceptsPath,
          assetsManifestFile: join(opts.outputDir, "assets-manifest.json"),
          outputDir: opts.outputDir,
          langs: [currentReport.lang as "tr" | "en"],
          conceptIds: [currentReport.conceptId],
        });
      } catch (err) {
        console.warn(`[iterate]   render failed: ${(err as Error).message} — stopping retries`);
        break;
      }

      // Preserve this iteration's video under a versioned name so audit shows progression.
      const rendersJsonPath = join(opts.outputDir, "renders.json");
      const renders = JSON.parse(await readFile(rendersJsonPath, "utf8")) as any[];
      const thisRender = renders.find((r: any) => r.conceptId === currentReport.conceptId && r.lang === currentReport.lang);
      if (!thisRender?.videoPath) {
        console.warn(`[iterate]   no render output, stopping retries`);
        break;
      }
      const iterPath = thisRender.videoPath.replace(/\.mp4$/, `-iter${retry}.mp4`);
      await copyFile(thisRender.videoPath, iterPath).catch(() => {});

      // Re-run QC just for this ad
      console.log(`[iterate]   re-running QC for iteration ${retry}...`);
      const reports = await runQc({ outputDir: opts.outputDir, cleanupFrames: false });
      const updated = reports.find((r) => r.conceptId === currentReport.conceptId && r.lang === currentReport.lang);
      if (!updated) {
        console.warn(`[iterate]   QC returned no report for ${currentReport.conceptId}, stopping retries`);
        break;
      }

      history.attempts.push({
        iteration: retry,
        videoPath: iterPath,
        overallScore: updated.overallScore,
        verdict: updated.verdict,
      });
      console.log(`[iterate]   iter ${retry} score=${updated.overallScore} verdict=${updated.verdict}`);

      if (updated.overallScore >= opts.threshold) {
        history.finalVideoPath = thisRender.videoPath;
        history.finalScore = updated.overallScore;
        history.reason = "accepted";
        console.log(`[iterate] ${initial.conceptId} [${initial.lang}] ✓ accepted at iter ${retry} (score ${updated.overallScore})`);
        break;
      }
      currentReport = updated;
    }

    // If loop ended without acceptance, pick the best attempt
    if (history.reason !== "accepted" || history.finalScore < opts.threshold) {
      const best = bestAttempt(history.attempts);
      history.finalVideoPath = best.videoPath;
      history.finalScore = best.overallScore;
      history.reason = "max_retries";
      // Copy best to canonical path so downstream (publish) gets the winner
      const canonical = best.videoPath.replace(/-iter\d+\.mp4$/, ".mp4");
      if (canonical !== best.videoPath) {
        await copyFile(best.videoPath, canonical).catch(() => {});
      }
      console.log(`[iterate] ${initial.conceptId} [${initial.lang}] ⚠ max retries hit — keeping best (iter ${best.iteration}, score ${best.overallScore})`);
    }

    histories.push(history);
  }

  const historyPath = join(opts.outputDir, "iteration-history.json");
  await writeFile(historyPath, JSON.stringify(histories, null, 2));
  console.log(`[iterate] history → ${historyPath}`);

  const accepted = histories.filter((h) => h.reason === "accepted").length;
  const maxed = histories.filter((h) => h.reason === "max_retries").length;
  console.log(`[iterate] summary — accepted: ${accepted}, max_retries: ${maxed}`);

  // Update persistent memory: extract lessons from failures, capture high performers.
  // Reads the latest qc-report.json (contains the final QC pass per ad).
  try {
    const finalReportPath = join(opts.outputDir, "qc-report.json");
    if (existsSync(finalReportPath)) {
      const finalReports = JSON.parse(await readFile(finalReportPath, "utf8")) as AdQcReport[];
      const { lessonsAdded, performersAdded, worstAdded } = await updateMemoryFromReports(finalReports);
      console.log(`[memory] +${lessonsAdded} lessons, +${performersAdded} top, +${worstAdded} worst performers`);
    }
  } catch (err) {
    console.warn(`[memory] update failed: ${(err as Error).message}`);
  }

  return histories;
}
