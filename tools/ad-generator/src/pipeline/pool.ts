/**
 * Central video pool helper. Every FINAL, QC-PASSED video is copied into a single pool
 * folder (output/all-videos/) so all shippable ads live in one place. Failed/below-bar
 * videos are intentionally NEVER copied here — the pool is the "ready to ship" shelf.
 *
 * Filename carries the video's TOPIC (the ad tip/kind) + the date+time it landed in the
 * pool, e.g.
 *   donusum__renkli-hayat-1-tr__2026-06-04_16-35.mp4
 * so you can tell at a glance WHAT the video is about and WHEN it was produced/added.
 */
import { copyFile, mkdir } from "node:fs/promises";
import { resolve, join } from "node:path";

/** Local timestamp `YYYY-MM-DD_HH-MM` for embedding into pool filenames. */
export function poolStamp(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}`;
}

/** Absolute path to the single pool dir, derived from a run's outputDir (.../output/<run>). */
export function poolDir(outputDir: string): string {
  return resolve(outputDir, "..", "all-videos");
}

/** Sanitize a topic label so it is filename-safe (lowercase, hyphenated). */
function safeTopic(topic?: string): string {
  if (!topic) return "";
  return topic
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9çğıöşü-]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Copy a passed video into the pool with a topic + datetime-stamped name:
 *   <topic>__<conceptId>-<lang>__<YYYY-MM-DD_HH-MM>.mp4
 * `topic` is the ad's kind/subject (the tip, e.g. "donusum"). If omitted, the topic
 * segment is dropped. Returns the destination path, or null if skipped.
 */
export async function copyToPool(
  videoPath: string,
  conceptId: string,
  lang: string,
  outputDir: string,
  topic?: string,
  when: Date = new Date()
): Promise<string | null> {
  const dir = poolDir(outputDir);
  await mkdir(dir, { recursive: true });
  const t = safeTopic(topic);
  const prefix = t ? `${t}__` : "";
  const dest = join(dir, `${prefix}${conceptId}-${lang}__${poolStamp(when)}.mp4`);
  await copyFile(videoPath, dest);
  return dest;
}
