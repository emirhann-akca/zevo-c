import { mkdir, writeFile } from "node:fs/promises";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { join } from "node:path";

const execp = promisify(exec);

const ELEVENLABS_API = "https://api.elevenlabs.io/v1/text-to-speech";

// Default ElevenLabs voice IDs — verified Turkish-supporting via list-voices.ts.
// Liam is officially tagged "Energetic, Social Media Creator" with Turkish in verified_languages,
// which is the exact profile we want for performance-marketing Reels.
const DEFAULT_VOICES = {
  en: "TX3LPaxmHKxFdv7VOQHJ", // Liam — energetic social-media creator
  tr: "TX3LPaxmHKxFdv7VOQHJ", // Liam (TR-verified) — swap via ELEVENLABS_VOICE_TR if you prefer Daniel (onwK4e9ZLuTAKqWW03F9)
};

export type VoLang = "tr" | "en";
export type VoProvider = "elevenlabs" | "macos-say" | "skipped";

async function elevenLabsTts(text: string, lang: VoLang, outPath: string, apiKey: string): Promise<void> {
  const voiceId =
    (lang === "tr" ? process.env.ELEVENLABS_VOICE_TR : process.env.ELEVENLABS_VOICE_EN) ?? DEFAULT_VOICES[lang];
  const res = await fetch(`${ELEVENLABS_API}/${voiceId}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      // Tuned for ad-style delivery: slightly less stable = more emotive, higher style = punchier.
      voice_settings: { stability: 0.42, similarity_boost: 0.78, style: 0.55, use_speaker_boost: true },
    }),
  });
  if (!res.ok) throw new Error(`elevenlabs ${res.status}: ${await res.text()}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(outPath, buf);
}

async function macosSay(text: string, lang: VoLang, outPath: string): Promise<void> {
  // macOS `say` produces .aiff; we'll convert with ffmpeg
  const voice = lang === "tr" ? "Yelda" : "Samantha"; // Yelda is the TR system voice on macOS
  const aiff = outPath.replace(/\.\w+$/, ".aiff");
  await execp(`say -v "${voice}" -o "${aiff}" "${text.replace(/"/g, '\\"')}"`);
  await execp(`ffmpeg -y -i "${aiff}" -ac 1 -ar 44100 "${outPath}"`);
}

export async function generateVoiceover(opts: {
  text: string;
  lang: VoLang;
  outPath: string;
}): Promise<VoProvider> {
  await mkdir(join(opts.outPath, ".."), { recursive: true }).catch(() => {});
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (apiKey) {
    try {
      await elevenLabsTts(opts.text, opts.lang, opts.outPath, apiKey);
      return "elevenlabs";
    } catch (err) {
      console.warn(`[voiceover] elevenlabs failed, falling back to macOS say:`, (err as Error).message);
    }
  }
  if (process.platform === "darwin") {
    try {
      await macosSay(opts.text, opts.lang, opts.outPath);
      return "macos-say";
    } catch (err) {
      console.warn(`[voiceover] macOS say failed:`, (err as Error).message);
    }
  }
  console.warn("[voiceover] no provider available — skipping");
  return "skipped";
}
