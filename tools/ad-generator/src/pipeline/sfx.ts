/**
 * Procedural SFX generators using ffmpeg lavfi sources.
 * No external audio files needed.
 */
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execp = promisify(exec);

/**
 * Generates a short "whoosh" transition SFX.
 * Brown noise + lowpass sweep + fade gives a cinematic whoosh.
 */
export async function generateWhoosh(outPath: string, durationSec = 0.5): Promise<void> {
  const d = durationSec;
  const cmd = `ffmpeg -y -f lavfi -i "anoisesrc=color=brown:duration=${d}" -af "highpass=f=80,lowpass=f=2500,volume=0.6,afade=t=in:st=0:d=${(d * 0.3).toFixed(2)},afade=t=out:st=${(d * 0.5).toFixed(2)}:d=${(d * 0.5).toFixed(2)}" -ar 44100 -ac 2 "${outPath}"`;
  await execp(cmd);
}

/**
 * Generates a deep bass impact for CTA reveals.
 */
export async function generateImpact(outPath: string): Promise<void> {
  const cmd = `ffmpeg -y -f lavfi -i "sine=frequency=55:duration=0.6" -af "volume=0.7,afade=t=out:st=0.1:d=0.5" -ar 44100 -ac 2 "${outPath}"`;
  await execp(cmd);
}
