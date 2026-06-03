import { NextResponse } from "next/server";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

export const dynamic = "force-dynamic";

const MEMORY_DIR = join(process.cwd(), "tools", "ad-generator", "memory");

async function loadOr<T>(name: string, fallback: T): Promise<T> {
  const path = join(MEMORY_DIR, name);
  if (!existsSync(path)) return fallback;
  try { return JSON.parse(await readFile(path, "utf8")) as T; } catch { return fallback; }
}

export async function GET() {
  const [lessons, topPerformers, worstPerformers] = await Promise.all([
    loadOr<any[]>("lessons.json", []),
    loadOr<any[]>("top-performers.json", []),
    loadOr<any[]>("worst-performers.json", []),
  ]);
  return NextResponse.json({ lessons, topPerformers, worstPerformers });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { lessons, topPerformers, worstPerformers } = body;
  if (Array.isArray(lessons)) {
    await writeFile(join(MEMORY_DIR, "lessons.json"), JSON.stringify(lessons, null, 2));
  }
  if (Array.isArray(topPerformers)) {
    await writeFile(join(MEMORY_DIR, "top-performers.json"), JSON.stringify(topPerformers, null, 2));
  }
  if (Array.isArray(worstPerformers)) {
    await writeFile(join(MEMORY_DIR, "worst-performers.json"), JSON.stringify(worstPerformers, null, 2));
  }
  return NextResponse.json({ ok: true });
}
