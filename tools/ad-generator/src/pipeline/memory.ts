/**
 * Persistent memory across runs.
 *
 * Two files live in `<adGeneratorRoot>/memory/`:
 *   - lessons.json        — patterns to AVOID, learned from FAIL/WARN attempts
 *   - top-performers.json — concepts that scored >= TOP_SCORE_MIN, to inspire new ones
 *
 * On each pipeline run:
 *   - BEFORE concept generation: load both files, inject summaries into the prompt.
 *   - AFTER iterate phase: extract new lessons from any failed attempts via Gemini,
 *     append concepts that scored high to top-performers.
 *
 * Both files are CAPPED (cheap pruning) so context size stays bounded:
 *   - lessons: keep top 20 by frequency (deduplicated)
 *   - top-performers: keep top 10 by score (highest wins)
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { generate } from "../llm.ts";
import type { AdQcReport } from "./8-qc.ts";

const TOP_SCORE_MIN = 65;  // ≥ this score → save as "what to replicate"
const WORST_SCORE_MAX = 50; // ≤ this score → save as "what to avoid (concrete example)"
const MAX_LESSONS = 20;
const MAX_TOP_PERFORMERS = 10;
const MAX_WORST_PERFORMERS = 15; // bigger pool so we don't drop older failures too fast

export interface Lesson {
  pattern: string;        // short rule, e.g. "Bottom-center captions collide with Zevo app UI CTA button"
  frequency: number;      // how many times observed
  firstSeen: string;      // ISO date
  lastSeen: string;       // ISO date
}

export interface TopPerformer {
  conceptId: string;
  hookLine: string;
  hookType: string;
  overallScore: number;
  virality: {
    hookStrength: number;
    holdPrediction: number;
    captionHook: number;
    brandSafety: number;
  };
  shotCount: number;
  rationale: string;
  capturedAt: string;
}

// Concrete "what NOT to do" example. Tracks a concept that scored badly + the SPECIFIC reason
// — much more actionable for Gemini than the abstract lessons.json rules.
export interface WorstPerformer {
  conceptId: string;
  hookLine: string;
  hookType: string;
  overallScore: number;
  virality: {
    hookStrength: number;
    holdPrediction: number;
    captionHook: number;
    brandSafety: number;
  };
  shotCount: number;
  failureSummary: string;        // QC's one-line summary of what was wrong
  primaryFailure: string;        // "low hookStrength" | "low brandSafety" | etc — the weakest dimension
  capturedAt: string;
}

function memoryRoot(): string {
  // memory.ts lives in src/pipeline/, project root is two levels up
  const here = dirname(fileURLToPath(import.meta.url));
  return join(here, "..", "..", "memory");
}

async function loadJsonOr<T>(path: string, fallback: T): Promise<T> {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(await readFile(path, "utf8")) as T;
  } catch {
    return fallback;
  }
}

export async function loadLessons(): Promise<Lesson[]> {
  return loadJsonOr<Lesson[]>(join(memoryRoot(), "lessons.json"), []);
}

export async function loadTopPerformers(): Promise<TopPerformer[]> {
  return loadJsonOr<TopPerformer[]>(join(memoryRoot(), "top-performers.json"), []);
}

export async function loadWorstPerformers(): Promise<WorstPerformer[]> {
  return loadJsonOr<WorstPerformer[]>(join(memoryRoot(), "worst-performers.json"), []);
}

async function saveLessons(lessons: Lesson[]): Promise<void> {
  await mkdir(memoryRoot(), { recursive: true }).catch(() => {});
  // Sort by frequency desc, cap
  const sorted = [...lessons].sort((a, b) => b.frequency - a.frequency).slice(0, MAX_LESSONS);
  await writeFile(join(memoryRoot(), "lessons.json"), JSON.stringify(sorted, null, 2));
}

async function saveTopPerformers(performers: TopPerformer[]): Promise<void> {
  await mkdir(memoryRoot(), { recursive: true }).catch(() => {});
  // Sort by score desc, then THEME-DEDUPE: keep at most 2 per hookType so the prompt
  // doesn't reinforce one tema (e.g. "plato") to the point where every new concept reuses it.
  // After dedupe, cap by total count.
  const sorted = [...performers].sort((a, b) => b.overallScore - a.overallScore);
  const perTheme = new Map<string, number>();
  const filtered: TopPerformer[] = [];
  for (const p of sorted) {
    const theme = (p.hookType ?? "unknown").toLowerCase();
    const c = perTheme.get(theme) ?? 0;
    if (c >= 2) continue;
    perTheme.set(theme, c + 1);
    filtered.push(p);
    if (filtered.length >= MAX_TOP_PERFORMERS) break;
  }
  await writeFile(join(memoryRoot(), "top-performers.json"), JSON.stringify(filtered, null, 2));
}

async function saveWorstPerformers(performers: WorstPerformer[]): Promise<void> {
  await mkdir(memoryRoot(), { recursive: true }).catch(() => {});
  // Lowest scores at top of file (highest "lesson value" — biggest failures)
  const sorted = [...performers].sort((a, b) => a.overallScore - b.overallScore).slice(0, MAX_WORST_PERFORMERS);
  await writeFile(join(memoryRoot(), "worst-performers.json"), JSON.stringify(sorted, null, 2));
}

/**
 * Render memory as a prompt fragment for concept generation. Returns "" if empty
 * so the prompt stays clean on first-ever run.
 */
export function buildMemoryPromptSection(
  lessons: Lesson[],
  performers: TopPerformer[],
  worst: WorstPerformer[] = []
): string {
  if (lessons.length === 0 && performers.length === 0 && worst.length === 0) return "";
  const parts: string[] = ["", "**ACCUMULATED LEARNINGS FROM PREVIOUS RUNS** — use this knowledge to write better concepts:"];

  if (performers.length > 0) {
    parts.push("", "### WHAT WORKED (replicate these STRUCTURAL patterns, never copy text):");
    for (const p of performers.slice(0, 5)) {
      parts.push(`- "${p.hookLine}" (hookType=${p.hookType}, score=${p.overallScore}, shots=${p.shotCount}) — ${p.rationale.slice(0, 120)}`);
    }
  }

  if (worst.length > 0) {
    parts.push("", "### WHAT FAILED (concrete past examples — DO NOT reproduce this hook structure or shot framing):");
    for (const w of worst.slice(0, 7)) {
      parts.push(`- "${w.hookLine}" (hookType=${w.hookType}, score=${w.overallScore}, weakest=${w.primaryFailure}) — ${w.failureSummary.slice(0, 140)}`);
    }
  }

  if (lessons.length > 0) {
    parts.push("", "### GENERAL RULES (from repeated mistakes — apply to every concept):");
    for (const l of lessons.slice(0, 10)) {
      parts.push(`- (×${l.frequency}) ${l.pattern}`);
    }
  }
  return parts.join("\n");
}

/**
 * Use the fast model to detect semantic duplicates. We send the candidate + all existing patterns
 * and ask Gemini to return the index of the matching existing lesson, or "none". This catches
 * paraphrases that prefix matching misses (e.g. "Captions must be in safe zones" vs
 * "Captions should be positioned away from UI elements").
 */
async function findSemanticDuplicate(candidate: string, existing: Lesson[]): Promise<Lesson | null> {
  if (existing.length === 0) return null;
  // Cheap prefilter: identical first 25 chars → same lesson
  const stem25 = candidate.slice(0, 25).toLowerCase();
  const cheap = existing.find((l) => l.pattern.slice(0, 25).toLowerCase() === stem25);
  if (cheap) return cheap;
  try {
    const list = existing.map((l, i) => `${i}: ${l.pattern}`).join("\n");
    const out = await generate({
      system: `You compare a NEW lesson against existing lessons and decide if it's essentially the same advice expressed differently. Two lessons are "same" if applying one would automatically satisfy the other (paraphrases of identical guidance). Output ONLY a single integer index (the matching existing lesson) or "none" if this is a genuinely new lesson. No explanation.`,
      user: `EXISTING LESSONS:\n${list}\n\nNEW LESSON:\n${candidate}\n\nWhich existing lesson index matches semantically? Reply with index or "none".`,
      model: "fast",
      temperature: 0.0,
      maxOutputTokens: 256,
    });
    const trimmed = out.trim().toLowerCase();
    if (trimmed.startsWith("none")) return null;
    const m = trimmed.match(/\d+/);
    if (!m) return null;
    const idx = parseInt(m[0], 10);
    if (idx >= 0 && idx < existing.length) return existing[idx];
    return null;
  } catch {
    return null;
  }
}

const LESSON_EXTRACT_SYSTEM = `You are extracting generalizable lessons from a failed Zevo ad QC report. Read the report and recommendations. Return short, reusable rules — patterns that would apply to FUTURE ads, not one-off issues for this specific concept.

Good lesson examples:
- "Captions positioned in the bottom 30% collide with app UI buttons in Zevo app footage"
- "Hooks starting with 'Welcome to' or 'Discover' score low on hookStrength"
- "Frame 1 with no on-screen text fails to grab attention in vertical scroll"

Bad lesson examples (TOO SPECIFIC — do not return these):
- "The squat scene at 8s was bad" (specific to one ad)
- "Red color in scene 2" (specific instance)

Output ONLY a JSON array of 1-4 lesson strings. No markdown. If no generalizable lesson is found, return [].`;

/**
 * After a finished iterate run, look at FAIL/WARN attempts and ask Gemini to extract
 * generalizable lessons. Merge them with the existing lesson library (dedupe by lower-case
 * stem match — if a lesson with same first 40 chars exists, bump its frequency instead).
 */
export async function updateMemoryFromReports(reports: AdQcReport[]): Promise<{ lessonsAdded: number; performersAdded: number; worstAdded: number }> {
  const existing = await loadLessons();
  const performers = await loadTopPerformers();
  const worst = await loadWorstPerformers();
  const now = new Date().toISOString();
  let lessonsAdded = 0;
  let performersAdded = 0;
  let worstAdded = 0;

  for (const r of reports) {
    // Helper to load concept JSON (shared between top and worst paths)
    const loadConcept = async (): Promise<any | null> => {
      const conceptsPath = join(dirname(r.videoPath), "..", "concepts.json");
      if (!existsSync(conceptsPath)) return null;
      try {
        const arr = JSON.parse(await readFile(conceptsPath, "utf8"));
        return arr.find((c: any) => c.id === r.conceptId) ?? null;
      } catch { return null; }
    };

    // Capture high performers
    if (r.overallScore >= TOP_SCORE_MIN) {
      const concept = await loadConcept();
      if (concept && !performers.some((p) => p.conceptId === r.conceptId)) {
        performers.push({
          conceptId: r.conceptId,
          hookLine: concept.hookLine?.tr ?? concept.hookLine?.en ?? "",
          hookType: concept.hookType ?? "unknown",
          overallScore: r.overallScore,
          virality: r.virality,
          shotCount: (concept.shotlist ?? []).length,
          rationale: concept.rationale ?? "",
          capturedAt: now,
        });
        performersAdded++;
      }
    }

    // Capture low performers — the "concrete what-not-to-do" memory
    if (r.overallScore <= WORST_SCORE_MAX) {
      const concept = await loadConcept();
      if (concept && !worst.some((w) => w.conceptId === r.conceptId)) {
        // Identify which virality dimension was the weakest — that's the primary lesson
        const dims = r.virality ?? { hookStrength: 0, holdPrediction: 0, captionHook: 0, brandSafety: 0 };
        const dimEntries: [string, number][] = [
          ["hookStrength", dims.hookStrength],
          ["holdPrediction", dims.holdPrediction],
          ["captionHook", dims.captionHook],
          ["brandSafety", dims.brandSafety],
        ];
        const weakest = dimEntries.sort((a, b) => a[1] - b[1])[0];
        worst.push({
          conceptId: r.conceptId,
          hookLine: concept.hookLine?.tr ?? concept.hookLine?.en ?? "",
          hookType: concept.hookType ?? "unknown",
          overallScore: r.overallScore,
          virality: dims,
          shotCount: (concept.shotlist ?? []).length,
          failureSummary: r.summary ?? "(no summary)",
          primaryFailure: `low ${weakest[0]} (${weakest[1]}/100)`,
          capturedAt: now,
        });
        worstAdded++;
      }
    }

    // Extract lessons from failures
    if (r.verdict !== "PASS" && r.recommendations.length > 0) {
      let extracted: string[] = [];
      try {
        const text = await generate({
          system: LESSON_EXTRACT_SYSTEM,
          user: `QC report (verdict=${r.verdict}, score=${r.overallScore}):\n${r.summary}\n\nRecommendations:\n${r.recommendations.map((x, i) => `${i + 1}. ${x}`).join("\n")}\n\nFrame notes:\n${r.frames.map((f, i) => `${i + 1}. ${f.notes}`).join("\n")}\n\nReturn JSON array of generalizable lessons.`,
          model: "fast",
          temperature: 0.2,
          maxOutputTokens: 1024,
        });
        const firstBracket = text.indexOf("[");
        const lastBracket = text.lastIndexOf("]");
        if (firstBracket >= 0 && lastBracket > firstBracket) {
          extracted = JSON.parse(text.slice(firstBracket, lastBracket + 1));
        }
      } catch (err) {
        console.warn(`[memory] lesson extraction failed for ${r.conceptId}: ${(err as Error).message}`);
      }

      for (const pattern of extracted) {
        if (typeof pattern !== "string" || pattern.length < 10) continue;
        // Semantic dedup: ask Gemini if this pattern is essentially the same as any existing one.
        // Falls back to prefix matching on error or empty existing list.
        const match = await findSemanticDuplicate(pattern, existing);
        if (match) {
          match.frequency += 1;
          match.lastSeen = now;
        } else {
          existing.push({ pattern, frequency: 1, firstSeen: now, lastSeen: now });
          lessonsAdded++;
        }
      }
    }
  }

  await saveLessons(existing);
  await saveTopPerformers(performers);
  await saveWorstPerformers(worst);
  return { lessonsAdded, performersAdded, worstAdded };
}
