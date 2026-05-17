/**
 * Generates a music bed for an ad using ElevenLabs Music API.
 *
 * Returns the path to an mp3, or null if the API key lacks music permission / the call fails.
 * Pipeline gracefully falls back to voice-only audio if null is returned.
 */
import { writeFile } from "node:fs/promises";

const MUSIC_API = "https://api.elevenlabs.io/v1/music";

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
