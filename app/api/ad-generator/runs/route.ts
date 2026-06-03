import { NextRequest, NextResponse } from "next/server";
import { startRun, listRuns, type RunSpec } from "@/lib/ad-generator-runs";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ runs: listRuns() });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const spec: RunSpec = {
    tip: body.tip ?? "klasik",
    count: Number(body.count ?? 1),
    langs: Array.isArray(body.langs) && body.langs.length > 0 ? body.langs : ["tr"],
    skip: Array.isArray(body.skip) ? body.skip : ["discover", "analyze", "publish"],
    viralityThreshold: Number(body.viralityThreshold ?? 60),
    maxRetries: Number(body.maxRetries ?? 2),
    date: body.date,
    targetDuration: body.targetDuration ? Number(body.targetDuration) : undefined,
    voiceTr: body.voiceTr || undefined,
    voiceEn: body.voiceEn || undefined,
    rateTr: body.rateTr || undefined,
    rateEn: body.rateEn || undefined,
    interShotGapSec: typeof body.interShotGapSec === "number" ? body.interShotGapSec : undefined,
    xfadeDurSec: typeof body.xfadeDurSec === "number" ? body.xfadeDurSec : undefined,
  };
  const state = startRun(spec);
  return NextResponse.json({ run: state });
}
