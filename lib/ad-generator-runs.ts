/**
 * In-memory store for ad-generator pipeline runs.
 * One process per run. Logs streamed to subscribers via per-run event listeners.
 *
 * Note: state is lost on Next.js dev server restart, but the actual output (mp4, json
 * artifacts) is on disk under tools/ad-generator/output/<date>/, so nothing is destroyed.
 */
import { spawn, type ChildProcess } from "node:child_process";
import { join } from "node:path";
import { EventEmitter } from "node:events";

export type RunStatus = "queued" | "running" | "completed" | "failed" | "killed";

export interface RunSpec {
  tip: "zevo-template" | "klasik" | "motivasyon";
  count: number;
  langs: ("tr" | "en")[];
  skip: string[];                   // phase names to skip
  viralityThreshold: number;
  maxRetries: number;
  date?: string;                    // override output date dir
  targetDuration?: number;          // target ad length in seconds (default 20)
  voiceTr?: string;                 // EDGE_TTS_VOICE_TR override
  voiceEn?: string;                 // EDGE_TTS_VOICE_EN override
  rateTr?: string;                  // EDGE_TTS_RATE_TR override, e.g. "+25%"
  rateEn?: string;                  // EDGE_TTS_RATE_EN override
  interShotGapSec?: number;         // silent tail after each shot's VO (default 0.15s)
  xfadeDurSec?: number;             // crossfade length between shots (default 0.25s)
}

export interface RunState {
  id: string;
  status: RunStatus;
  spec: RunSpec;
  startedAt: number;
  endedAt?: number;
  outputDir: string;
  date: string;
  log: string[];                    // line-buffered stdout+stderr
  phase: string;                    // current phase guess from log
  exitCode?: number | null;
}

interface InternalRun extends RunState {
  proc: ChildProcess | null;
  emitter: EventEmitter;
}

const runs = new Map<string, InternalRun>();

const REPO_ROOT = process.cwd();
const AD_GENERATOR_DIR = join(REPO_ROOT, "tools", "ad-generator");

// ffmpeg lives outside the default PATH on this machine; prepend so child can use it.
const FFMPEG_BIN =
  "C:\\Users\\serve\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1.1-full_build\\bin";

function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

function specToArgs(spec: RunSpec): string[] {
  const args: string[] = ["tsx", "src/cli.ts", "--langs", spec.langs.join(","), "--count", String(spec.count), "--tip", spec.tip, "--virality-threshold", String(spec.viralityThreshold), "--max-retries", String(spec.maxRetries)];
  if (spec.targetDuration) args.push("--target-duration", String(spec.targetDuration));
  if (spec.skip.length > 0) args.push("--skip", spec.skip.join(","));
  if (spec.date) args.push("--date", spec.date);
  return args;
}

function detectPhase(line: string): string | null {
  // CLI prints "→ Phase N: ..." headings — extract the human label
  const m = line.match(/Phase\s+\d+\+?\d*:\s*(.+?)(?:\.\.\.|$)/i);
  if (m) return m[1].trim();
  if (line.includes("Pipeline complete")) return "Done";
  return null;
}

export function startRun(spec: RunSpec): RunState {
  const id = `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const date = spec.date ?? todayStamp();
  const outputDir = join(AD_GENERATOR_DIR, "output", date);
  const emitter = new EventEmitter();
  emitter.setMaxListeners(50);

  const state: InternalRun = {
    id,
    status: "queued",
    spec,
    startedAt: Date.now(),
    outputDir,
    date,
    log: [],
    phase: "queued",
    proc: null,
    emitter,
  };
  runs.set(id, state);

  const args = specToArgs(spec);
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    PATH: `${FFMPEG_BIN};${process.env.PATH ?? ""}`,
  };
  if (spec.voiceTr) env.EDGE_TTS_VOICE_TR = spec.voiceTr;
  if (spec.voiceEn) env.EDGE_TTS_VOICE_EN = spec.voiceEn;
  if (spec.rateTr) env.EDGE_TTS_RATE_TR = spec.rateTr;
  if (spec.rateEn) env.EDGE_TTS_RATE_EN = spec.rateEn;
  if (typeof spec.interShotGapSec === "number") env.INTER_SHOT_GAP_SEC = String(spec.interShotGapSec);
  if (typeof spec.xfadeDurSec === "number") env.XFADE_DUR_SEC = String(spec.xfadeDurSec);

  const proc = spawn("npx", args, {
    cwd: AD_GENERATOR_DIR,
    env,
    shell: true,
  });
  state.proc = proc;
  state.status = "running";

  const pushLine = (line: string) => {
    if (!line.trim()) return;
    state.log.push(line);
    const phase = detectPhase(line);
    if (phase) state.phase = phase;
    emitter.emit("line", line);
  };

  let stdoutBuf = "";
  proc.stdout?.on("data", (chunk: Buffer) => {
    stdoutBuf += chunk.toString("utf8");
    const parts = stdoutBuf.split(/\r?\n/);
    stdoutBuf = parts.pop() ?? "";
    for (const line of parts) pushLine(line);
  });
  let stderrBuf = "";
  proc.stderr?.on("data", (chunk: Buffer) => {
    stderrBuf += chunk.toString("utf8");
    const parts = stderrBuf.split(/\r?\n/);
    stderrBuf = parts.pop() ?? "";
    for (const line of parts) pushLine(line);
  });

  proc.on("close", (code) => {
    if (stdoutBuf) pushLine(stdoutBuf);
    if (stderrBuf) pushLine(stderrBuf);
    state.exitCode = code;
    state.endedAt = Date.now();
    state.status = code === 0 ? "completed" : state.status === "killed" ? "killed" : "failed";
    emitter.emit("end", state.status);
  });

  proc.on("error", (err) => {
    pushLine(`[spawn error] ${err.message}`);
    state.status = "failed";
    state.endedAt = Date.now();
    emitter.emit("end", "failed");
  });

  return toPublic(state);
}

export function killRun(id: string): boolean {
  const r = runs.get(id);
  if (!r || !r.proc) return false;
  r.status = "killed";
  try {
    r.proc.kill("SIGTERM");
  } catch { /* ignore */ }
  return true;
}

export function getRun(id: string): RunState | null {
  const r = runs.get(id);
  return r ? toPublic(r) : null;
}

export function listRuns(): RunState[] {
  return Array.from(runs.values())
    .sort((a, b) => b.startedAt - a.startedAt)
    .map(toPublic);
}

export function subscribe(id: string, onLine: (line: string) => void, onEnd: (status: string) => void): () => void {
  const r = runs.get(id);
  if (!r) return () => {};
  r.emitter.on("line", onLine);
  r.emitter.on("end", onEnd);
  return () => {
    r.emitter.off("line", onLine);
    r.emitter.off("end", onEnd);
  };
}

function toPublic(r: InternalRun): RunState {
  const { proc, emitter, ...rest } = r;
  return { ...rest };
}
