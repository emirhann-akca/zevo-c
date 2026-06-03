import { NextRequest, NextResponse } from "next/server";
import { readFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

export const dynamic = "force-dynamic";

const AD_GENERATOR_DIR = join(process.cwd(), "tools", "ad-generator");

/**
 * GET /api/ad-generator/results?date=2026-05-24
 * Aggregates artifacts. The `renders` array is built by SCANNING the renders/ directory
 * for all *.mp4 files rather than trusting renders.json (which only reflects the last
 * pipeline run and misses earlier attempts under the same date dir).
 */
export async function GET(req: NextRequest) {
  const folder = req.nextUrl.searchParams.get("date");
  if (!folder) {
    return NextResponse.json({ error: "?date=<folder-name> required" }, { status: 400 });
  }
  const dir = join(AD_GENERATOR_DIR, "output", folder);
  if (!existsSync(dir)) {
    return NextResponse.json({ date: folder, dir, concepts: [], renders: [], qc: [], history: [] });
  }

  async function loadOr<T>(name: string, fallback: T): Promise<T> {
    const path = join(dir, name);
    if (!existsSync(path)) return fallback;
    try { return JSON.parse(await readFile(path, "utf8")) as T; }
    catch { return fallback; }
  }

  const [concepts, manifestRenders, qc, history] = await Promise.all([
    loadOr<any[]>("concepts.json", []),
    loadOr<any[]>("renders.json", []),
    loadOr<any[]>("qc-report.json", []),
    loadOr<any[]>("iteration-history.json", []),
  ]);

  // Scan renders/ for every mp4 actually on disk, regardless of which run produced it.
  const rendersDir = join(dir, "renders");
  const scannedRenders: any[] = [];
  if (existsSync(rendersDir)) {
    const files = await readdir(rendersDir).catch(() => []);
    const mp4s = files.filter((f) => f.endsWith(".mp4") && !f.includes("-iter")); // canonical files only here
    for (const f of mp4s) {
      const full = join(rendersDir, f);
      const stats = await stat(full).catch(() => null);
      // Derive conceptId+lang from filename: "<id>-<lang>.mp4"
      const base = f.replace(/\.mp4$/, "");
      const m = base.match(/^(.+)-(tr|en)$/);
      const conceptId = m?.[1] ?? base;
      const lang = m?.[2] ?? "tr";
      // Prefer manifest entry if exists (carries shot metadata), else build minimal entry
      const manifestEntry = manifestRenders.find((r: any) => r.videoPath === full);
      scannedRenders.push(manifestEntry ?? {
        conceptId,
        lang,
        videoPath: full,
        modified: stats?.mtimeMs ?? 0,
      });
    }
    // newest first
    scannedRenders.sort((a, b) => (b.modified ?? 0) - (a.modified ?? 0));
  }

  return NextResponse.json({ date: folder, dir, concepts, renders: scannedRenders, qc, history });
}
