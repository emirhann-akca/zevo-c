import { NextRequest, NextResponse } from "next/server";
import { getRun, killRun } from "@/lib/ad-generator-runs";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  const run = getRun(ctx.params.id);
  if (!run) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ run });
}

export async function DELETE(_req: NextRequest, ctx: { params: { id: string } }) {
  const ok = killRun(ctx.params.id);
  return NextResponse.json({ killed: ok });
}
