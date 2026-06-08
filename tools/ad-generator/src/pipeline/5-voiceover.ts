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

// Default speaking-rate boost for ad-format energy. We pulled this DOWN from +25% to +8%
// because the faster rate made the per-shot TTS sound rushed/robotic (user feedback: wants
// it to sound like a real human read it). +8% keeps ad energy without clipping prosody, and
// gives each complete-sentence shot line room to land naturally. SSML accepts "+8%" or a
// multiplier (1.08). Override per-language via EDGE_TTS_RATE_TR / EDGE_TTS_RATE_EN.
const DEFAULT_EDGE_RATE = "+8%";

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
  // Optional pitch shift (e.g. "-2Hz", "+3%") to vary delivery away from the default monotone.
  const pitch = (lang === "tr" ? process.env.EDGE_TTS_PITCH_TR : process.env.EDGE_TTS_PITCH_EN) || undefined;
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
  const { audioStream, metadataStream } = tts.toStream(xmlEscape(text), pitch ? { rate, pitch } : { rate });

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

async function probeMp3Duration(path: string): Promise<number> {
  try {
    const { stdout } = await execp(
      `ffprobe -v error -show_entries format=duration -of csv=p=0 "${path}"`
    );
    const d = parseFloat(stdout.trim());
    return Number.isFinite(d) ? d : 0;
  } catch {
    return 0;
  }
}

function normToken(s: string): string {
  return s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

/**
 * Split a flat list of word-boundary timings (from ONE continuous synthesis) back into
 * per-line groups, by greedily consuming words until each line's normalized text is covered.
 * Tolerant of tokenization differences (numbers, punctuation). Returns null on gross mismatch.
 */
function mapWordsToLines(words: WordTiming[], lines: string[]): ContinuousVoShot[] | null {
  const result: ContinuousVoShot[] = [];
  let k = 0;
  for (let li = 0; li < lines.length; li++) {
    const target = normToken(lines[li]);
    let acc = "";
    const seg: WordTiming[] = [];
    while (k < words.length && acc.length < target.length) {
      acc += normToken(words[k].text);
      seg.push(words[k]);
      k++;
    }
    if (seg.length === 0) return null;
    result.push({ words: seg, startSec: seg[0].startSec, endSec: seg[seg.length - 1].endSec });
  }
  // Any trailing words → fold into the last line so nothing is lost.
  if (k < words.length && result.length > 0) {
    const last = result[result.length - 1];
    for (; k < words.length; k++) {
      last.words.push(words[k]);
      last.endSec = words[k].endSec;
    }
  }
  return result;
}

export interface ContinuousVoShot {
  /** word timings in GLOBAL seconds (relative to the whole continuous audio). */
  words: WordTiming[];
  startSec: number;
  endSec: number;
}

export interface ContinuousVoResult {
  /** path to the single continuous audio file, or null if nothing was spoken. */
  path: string | null;
  provider: VoProvider;
  /** one entry per input line (empty lines → empty words). GLOBAL times. */
  shots: ContinuousVoShot[];
  /** total audio duration in seconds (0 if unknown — caller may probe). */
  totalDur: number;
}

/**
 * Synthesize the ENTIRE script as ONE continuous voiceover so the delivery flows like a real
 * person reading top-to-bottom — natural sentence-final intonation and a short human breath
 * between sentences, NOT a dead pause and prosody-reset at every shot (the old per-shot TTS).
 * Returns per-line word timings (GLOBAL) so the renderer can both place the single audio track
 * and drive per-shot karaoke captions.
 */
export async function generateVoiceoverContinuous(opts: {
  lines: string[];
  lang: VoLang;
  outDir: string;
  prefix?: string;
}): Promise<ContinuousVoResult> {
  await mkdir(opts.outDir, { recursive: true }).catch(() => {});
  const prefix = opts.prefix ?? "vo";
  const lines = opts.lines.map((l) => (l ?? "").trim());
  const spoken = lines.map((l, i) => ({ i, l })).filter((x) => x.l.length > 0);
  const emptyShots = (): ContinuousVoShot[] => lines.map(() => ({ words: [], startSec: 0, endSec: 0 }));

  if (spoken.length === 0) {
    return { path: null, provider: "skipped", shots: emptyShots(), totalDur: 0 };
  }

  const outPath = join(opts.outDir, `${prefix}-cont.mp3`);
  // Ensure each line ends with sentence punctuation → natural intonation + a short breath
  // (not a dead pause) between sentences in the single synthesis.
  const withStops = spoken.map((x) => (/[.!?…]$/.test(x.l) ? x.l : x.l + "."));
  const combined = withStops.join(" ");

  // PRIMARY: one continuous Edge TTS synthesis (natural prosody over the whole script).
  try {
    const words = await edgeTtsWithAlignment(combined, opts.lang, outPath);
    const mapped = mapWordsToLines(words, spoken.map((x) => x.l));
    if (mapped) {
      const shots = emptyShots();
      for (let s = 0; s < spoken.length; s++) shots[spoken[s].i] = mapped[s];
      const totalDur = await probeMp3Duration(outPath);
      return { path: outPath, provider: "edge-tts", shots, totalDur };
    }
    console.warn("[voiceover] continuous word→line mapping mismatch — falling back to per-line concat");
  } catch (err) {
    console.warn("[voiceover] continuous edge-tts failed — falling back to per-line concat:", (err as Error).message);
  }

  // FALLBACK: synthesize each line separately, concat audio back-to-back with NO silence, and
  // offset each line's word times by the cumulative duration. Gap-free; prosody resets per line.
  const perLine = await generateVoiceoverPerShot({ lines, lang: opts.lang, outDir: opts.outDir, prefix });
  const shots = emptyShots();
  const segPaths: string[] = [];
  let acc = 0;
  let provider: VoProvider = "skipped";
  for (let i = 0; i < lines.length; i++) {
    const entry = perLine[i];
    if (!entry?.path) continue;
    if (entry.provider !== "skipped") provider = entry.provider;
    const d = await probeMp3Duration(entry.path);
    shots[i] = {
      words: entry.words.map((w) => ({ text: w.text, startSec: w.startSec + acc, endSec: w.endSec + acc })),
      startSec: acc,
      endSec: acc + d,
    };
    segPaths.push(entry.path);
    acc += d;
  }
  if (segPaths.length === 0) {
    return { path: null, provider: "skipped", shots: emptyShots(), totalDur: 0 };
  }
  const listFile = join(opts.outDir, `${prefix}-cont-list.txt`);
  await writeFile(listFile, segPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n"));
  try {
    await execp(`ffmpeg -y -f concat -safe 0 -i "${listFile}" -c:a libmp3lame -b:a 192k "${outPath}"`);
  } catch (err) {
    console.warn("[voiceover] continuous concat failed:", (err as Error).message);
    return { path: null, provider: "skipped", shots: emptyShots(), totalDur: 0 };
  }
  return { path: outPath, provider, shots, totalDur: acc };
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
