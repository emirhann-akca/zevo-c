import { mkdir, writeFile } from "node:fs/promises";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { join } from "node:path";

const execp = promisify(exec);

const ELEVENLABS_API = "https://api.elevenlabs.io/v1/text-to-speech";

export interface WordTiming {
  text: string;
  startSec: number;
  endSec: number;
}

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

/**
 * Generate voiceover via ElevenLabs with per-character timestamps, then group into word timings.
 * Each word's startSec/endSec matches the exact moment ElevenLabs speaks it — enables word-by-word
 * caption reveal that lights up in lockstep with the audio.
 */
async function elevenLabsTtsWithAlignment(
  text: string,
  lang: VoLang,
  outPath: string,
  apiKey: string
): Promise<WordTiming[]> {
  const voiceId =
    (lang === "tr" ? process.env.ELEVENLABS_VOICE_TR : process.env.ELEVENLABS_VOICE_EN) ?? DEFAULT_VOICES[lang];
  const res = await fetch(`${ELEVENLABS_API}/${voiceId}/with-timestamps?output_format=mp3_44100_128`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.42, similarity_boost: 0.78, style: 0.55, use_speaker_boost: true },
    }),
  });
  if (!res.ok) throw new Error(`elevenlabs (timestamps) ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as {
    audio_base64: string;
    alignment?: {
      characters: string[];
      character_start_times_seconds: number[];
      character_end_times_seconds: number[];
    };
    normalized_alignment?: {
      characters: string[];
      character_start_times_seconds: number[];
      character_end_times_seconds: number[];
    };
  };
  const buf = Buffer.from(data.audio_base64, "base64");
  await writeFile(outPath, buf);

  // Group characters into words using whitespace as the delimiter.
  const align = data.alignment ?? data.normalized_alignment;
  if (!align) return [];
  const words: WordTiming[] = [];
  let current = "";
  let currentStart = 0;
  let currentEnd = 0;
  let inWord = false;
  for (let i = 0; i < align.characters.length; i++) {
    const ch = align.characters[i];
    const st = align.character_start_times_seconds[i];
    const en = align.character_end_times_seconds[i];
    if (/\s/.test(ch)) {
      if (inWord) {
        words.push({ text: current, startSec: currentStart, endSec: currentEnd });
        current = "";
        inWord = false;
      }
    } else {
      if (!inWord) {
        currentStart = st;
        inWord = true;
      }
      current += ch;
      currentEnd = en;
    }
  }
  if (inWord && current) {
    words.push({ text: current, startSec: currentStart, endSec: currentEnd });
  }
  return words;
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

/**
 * Per-shot voiceover with word-level alignment (when using ElevenLabs).
 * Returns: { path, words } per shot where `words` contains the exact start/end time of each spoken word.
 * The caller uses `words` to render captions that reveal in lockstep with the audio.
 * Empty/whitespace text → null entry (no audio for that shot).
 */
export async function generateVoiceoverPerShot(opts: {
  lines: string[];
  lang: VoLang;
  outDir: string;
  prefix?: string;
}): Promise<{ path: string | null; provider: VoProvider; words: WordTiming[] }[]> {
  await mkdir(opts.outDir, { recursive: true }).catch(() => {});
  const prefix = opts.prefix ?? "vo";
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const results: { path: string | null; provider: VoProvider; words: WordTiming[] }[] = [];
  for (let i = 0; i < opts.lines.length; i++) {
    const text = (opts.lines[i] ?? "").trim();
    if (!text) {
      results.push({ path: null, provider: "skipped", words: [] });
      continue;
    }
    const outPath = join(opts.outDir, `${prefix}-${i}.mp3`);
    if (apiKey) {
      try {
        const words = await elevenLabsTtsWithAlignment(text, opts.lang, outPath, apiKey);
        results.push({ path: outPath, provider: "elevenlabs", words });
        continue;
      } catch (err) {
        console.warn(`[voiceover] timestamps endpoint failed for shot ${i}, falling back to plain TTS:`, (err as Error).message);
      }
    }
    // Fallback: plain TTS without timestamps (kelime senkronu olmaz, ama ses olur)
    const provider = await generateVoiceover({ text, lang: opts.lang, outPath });
    results.push({ path: provider === "skipped" ? null : outPath, provider, words: [] });
  }
  return results;
}
