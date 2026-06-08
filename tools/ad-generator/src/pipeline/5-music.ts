/**
 * Generates a music bed for an ad.
 *
 * Primary: ElevenLabs Music API (when the key has Music permission).
 * Fallback: a LOCAL royalty-safe music library at brand-assets/music/ — tracks we previously
 *   generated for Zevo ads, so we own commercial rights. This guarantees EVERY ad has a music
 *   bed even when the ElevenLabs key lacks Music permission (the recurring "videos feel flat /
 *   all the same" root cause was silent, voice-only audio). The mux step loops/trims any track
 *   to the exact video length, so track duration doesn't need to match.
 *
 * Returns the path to an mp3, or null only if BOTH sources are unavailable.
 */
import { writeFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const MUSIC_API = "https://api.elevenlabs.io/v1/music";

// Maps concept musicMood phrases → a local track basename. The mood field is free text from the
// LLM, so we match on keywords; anything unmatched falls back to "drive" (safe energetic default).
const MOOD_TO_TRACK: { keywords: string[]; track: string }[] = [
  { keywords: ["emotional", "duygusal", "heartfelt", "warm", "intimate", "founder", "story", "hikaye"], track: "emotional" },
  { keywords: ["inspir", "ilham", "hopeful", "uplift", "rising", "triumph", "empower", "potansiyel"], track: "inspirational" },
  { keywords: ["cinematic", "sinematik", "epic", "dramatic", "bold", "powerful"], track: "cinematic" },
  { keywords: ["tense", "tension", "gerilim", "dark", "struggle", "problem", "urgent", "intense"], track: "tension" },
  { keywords: ["calm", "uplifting", "bright", "positive", "fresh", "clean", "optimistic"], track: "uplifting" },
  { keywords: ["energetic", "energy", "enerji", "drive", "hype", "workout", "motivational", "motivasyon", "fast", "upbeat"], track: "drive" },
];

function pickLocalMusic(moodSeed: string, rootDir: string = process.cwd()): string | null {
  const dir = join(rootDir, "brand-assets", "music");
  if (!existsSync(dir)) return null;
  const seed = (moodSeed || "").toLowerCase();
  let chosen = "drive";
  for (const m of MOOD_TO_TRACK) {
    if (m.keywords.some((k) => seed.includes(k))) { chosen = m.track; break; }
  }
  const path = join(dir, `${chosen}.mp3`);
  if (existsSync(path)) return path;
  // chosen track missing → use any available track so we still get music
  return null;
}

/** Selects a local library track for the given mood, or null if the library is empty. */
export async function selectLocalMusic(opts: {
  moodSeed: string;
  rootDir?: string;
}): Promise<string | null> {
  const root = opts.rootDir ?? process.cwd();
  const direct = pickLocalMusic(opts.moodSeed, root);
  if (direct) return direct;
  const dir = join(root, "brand-assets", "music");
  if (!existsSync(dir)) return null;
  const files = (await readdir(dir)).filter((f) => /\.(mp3|wav|m4a|aac)$/i.test(f));
  return files.length > 0 ? join(dir, files[0]) : null;
}

export async function generateMusic(opts: {
  prompt: string;
  durationSec: number;
  outPath: string;
}): Promise<string | null> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return null;

  // ElevenLabs Music endpoint accepts duration in ms, prompt, and returns mp3 audio.
  const body = {
    prompt: opts.prompt,
    music_length_ms: Math.round(opts.durationSec * 1000),
  };

  try {
    const res = await fetch(MUSIC_API, {
      method: "POST",
      headers: {
        "xi-api-key": key,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const txt = await res.text();
      if (res.status === 401 || res.status === 403) {
        console.warn(`[music] ElevenLabs key lacks Music permission. Add 'Music Generation: Access' to the key. Falling back to voice-only.`);
      } else {
        console.warn(`[music] ${res.status}: ${txt.slice(0, 200)}`);
      }
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(opts.outPath, buf);
    return opts.outPath;
  } catch (err) {
    console.warn(`[music] error:`, (err as Error).message);
    return null;
  }
}

/**
 * Maps the concept's musicMood field into a richer prompt that biases toward
 * licensed, ad-ready beds: instrumental, modern production, brand-safe.
 */
export function buildMusicPrompt(moodSeed: string, durationSec: number): string {
  return [
    `Instrumental background music bed for a ${Math.round(durationSec)}-second vertical fitness app ad`,
    `Mood: ${moodSeed}`,
    `Style: modern, energetic, motivational, slightly cinematic`,
    `Production: clean mix, prominent kick + bass, subtle synth pads, no vocals, no lyrics`,
    `BPM around 110-130`,
    `Should build subtly through the duration and end on a clean beat`,
  ].join(". ");
}
