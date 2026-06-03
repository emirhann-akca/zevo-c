import { mkdir, writeFile } from "node:fs/promises";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { join } from "node:path";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

const execp = promisify(exec);

const ELEVENLABS_API = "https://api.elevenlabs.io/v1/text-to-speech";

export interface WordTiming {
  text: string;
  startSec: number;
  endSec: number;
}

const DEFAULT_VOICES = {
  en: "TX3LPaxmHKxFdv7VOQHJ",
  tr: "TX3LPaxmHKxFdv7VOQHJ",
};

// Microsoft Edge TTS neural voices (free, no API key). Override via EDGE_TTS_VOICE_TR / EDGE_TTS_VOICE_EN.
// `tr-TR-AhmetNeural` is the male TR neural voice — confident, modern, social-media-ad friendly.
// (alternative: `tr-TR-EmelNeural` female.) `en-US-AndrewNeural` is the matching EN male delivery.
const DEFAULT_EDGE_VOICES = {
  tr: "tr-TR-AhmetNeural",
  en: "en-US-AndrewNeural",
};

// Default speaking-rate boost for ad-format energy. Scroll-stopping ads talk faster than
// conversational neutral. SSML accepts "+25%" (25% faster) or a multiplier (1.25). Override
// per-language via EDGE_TTS_RATE_TR / EDGE_TTS_RATE_EN, e.g. "+10%", "+40%", "1.15".
const DEFAULT_EDGE_RATE = "+25%";

export type VoLang = "tr" | "en";
export type VoProvider = "edge-tts" | "elevenlabs" | "macos-say" | "skipped";

function xmlEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

async function edgeTtsWithAlignment(
  text: string,
  lang: VoLang,
  outPath: string
): Promise<WordTiming[]> {
  const voiceName =
    (lang === "tr" ? process.env.EDGE_TTS_VOICE_TR : process.env.EDGE_TTS_VOICE_EN) ?? DEFAULT_EDGE_VOICES[lang];
  const rate =
    (lang === "tr" ? process.env.EDGE_TTS_RATE_TR : process.env.EDGE_TTS_RATE_EN) ?? DEFAULT_EDGE_RATE;
  const tts = new MsEdgeTTS();
  // Multilingual voices speak any language via the voiceLocale field. For non-tr-TR voice
  // names we still want Turkish output, so force voiceLocale = the target lang.
  const targetLocale = lang === "tr" ? "tr-TR" : "en-US";
  const isNativeLocale = voiceName.startsWith(`${targetLocale}-`);
  await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3, {
    wordBoundaryEnabled: true,
    sentenceBoundaryEnabled: false,
    ...(isNativeLocale ? {} : { voiceLocale: targetLocale }),
  });
  const { audioStream, metadataStream } = tts.toStream(xmlEscape(text), { rate });

  const audioChunks: Buffer[] = [];
  const words: WordTiming[] = [];
  const metaChunks: string[] = [];

  await new Promise<void>((resolve, reject) => {
    let audioClosed = false;
    let metaClosed = metadataStream == null;
    const maybeResolve = () => { if (audioClosed && metaClosed) resolve(); };

    audioStream.on("data", (chunk: Buffer) => audioChunks.push(chunk));
    audioStream.on("error", reject);
    audioStream.on("close", () => { audioClosed = true; maybeResolve(); });

    if (metadataStream) {
      metadataStream.on("data", (chunk: Buffer) => metaChunks.push(chunk.toString("utf8")));
      metadataStream.on("error", reject);
      metadataStream.on("close", () => { metaClosed = true; maybeResolve(); });
    }
  });

  // Each chunk is one pretty-printed JSON object: { Metadata: [{ Type, Data: { Offset, Duration, text: { Text } } }] }
  for (const raw of metaChunks) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    try {
      const obj = JSON.parse(trimmed);
      const metas = obj?.Metadata ?? [];
      for (const m of metas) {
        if (m?.Type !== "WordBoundary") continue;
        const offset = Number(m.Data?.Offset ?? 0);
        const duration = Number(m.Data?.Duration ?? 0);
        const t = m.Data?.text?.Text ?? "";
        if (!t) continue;
        // Azure ticks are 100-nanosecond units → seconds = ticks / 1e7
        const startSec = offset / 1e7;
        const endSec = (offset + duration) / 1e7;
        words.push({ text: t, startSec, endSec });
      }
    } catch {
      // ignore non-JSON fragments
    }
  }

  await writeFile(outPath, Buffer.concat(audioChunks));
  tts.close();
  return words;
}

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
      voice_settings: { stability: 0.42, similarity_boost: 0.78, style: 0.55, use_speaker_boost: true },
    }),
  });
  if (!res.ok) throw new Error(`elevenlabs ${res.status}: ${await res.text()}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(outPath, buf);
}

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
  const voice = lang === "tr" ? "Yelda" : "Samantha";
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
  // Edge TTS first — free, neural, no key.
  try {
    await edgeTtsWithAlignment(opts.text, opts.lang, opts.outPath);
    return "edge-tts";
  } catch (err) {
    console.warn(`[voiceover] edge-tts failed, trying fallbacks:`, (err as Error).message);
  }
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (apiKey) {
    try {
      await elevenLabsTts(opts.text, opts.lang, opts.outPath, apiKey);
      return "elevenlabs";
    } catch (err) {
      console.warn(`[voiceover] elevenlabs failed:`, (err as Error).message);
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

    // Primary: Edge TTS with word boundaries (free, neural).
    try {
      const words = await edgeTtsWithAlignment(text, opts.lang, outPath);
      results.push({ path: outPath, provider: "edge-tts", words });
      continue;
    } catch (err) {
      console.warn(`[voiceover] edge-tts failed for shot ${i}, trying ElevenLabs:`, (err as Error).message);
    }

    // Fallback: ElevenLabs with character-level alignment (if key present).
    if (apiKey) {
      try {
        const words = await elevenLabsTtsWithAlignment(text, opts.lang, outPath, apiKey);
        results.push({ path: outPath, provider: "elevenlabs", words });
        continue;
      } catch (err) {
        console.warn(`[voiceover] elevenlabs timestamps failed for shot ${i}, trying plain TTS:`, (err as Error).message);
      }
    }

    // Final fallback: plain TTS without word timings.
    const provider = await generateVoiceover({ text, lang: opts.lang, outPath });
    results.push({ path: provider === "skipped" ? null : outPath, provider, words: [] });
  }
  return results;
}
