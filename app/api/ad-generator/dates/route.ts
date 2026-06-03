import { NextResponse } from "next/server";
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";

export const dynamic = "force-dynamic";

const OUTPUT_ROOT = join(process.cwd(), "tools", "ad-generator", "output");

/**
 * Returns every subdirectory under output/ that contains at least one rendered mp4.
 * Sorted newest first so the UI date picker shows recent runs at the top.
 */
export async function GET() {
  if (!existsSync(OUTPUT_ROOT)) return NextResponse.json({ dates: [] });
  const entries = await readdir(OUTPUT_ROOT).catch(() => []);
  const dates: { name: string; mp4Count: number; modified: number }[] = [];
  for (const name of entries) {
    const sub = join(OUTPUT_ROOT, name);
    const rendersDir = join(sub, "renders");
    if (!existsSync(rendersDir)) continue;
    const files = await readdir(rendersDir).catch(() => []);
    const mp4s = files.filter((f) => f.endsWith(".mp4"));
    if (mp4s.length === 0) continue;
    const s = await stat(sub).catch(() => null);
    dates.push({ name, mp4Count: mp4s.length, modified: s?.mtimeMs ?? 0 });
  }
  dates.sort((a, b) => b.modified - a.modified);
  return NextResponse.json({ dates });
}
