/**
 * Cinematic "look" presets — rotating color grades so every ad looks visually distinct instead
 * of all sharing one flat grade (recurring "videos all feel the same" feedback). One look is
 * chosen per video (deterministic by concept id, or pinned via LOOK=<name>), and the SAME look
 * is applied to BOTH stock and brand footage within that video so the cut between Pexels and
 * Zevo app footage stays consistent (no sudden saturation/brightness jump).
 *
 * Each look provides two ffmpeg filter chains:
 *   - stock: applied to Pexels/Pixabay footage (can be punchier)
 *   - brand: applied to Zevo app UI footage (gentler — keep UI text crisp & true-to-product)
 *
 * All looks are deliberately tasteful and brand-compatible (no aggressive hue rotation that
 * would turn the emerald/navy palette off-brand — QC penalizes off-brand color hard).
 */

export interface Look {
  name: string;
  stock: string;
  brand: string;
}

// Shared tail that keeps small UI text legible after scaling.
const SHARP = "unsharp=5:5:0.6:5:5:0.0";
const SHARP_SOFT = "unsharp=5:5:0.4:5:5:0.0";

export const LOOKS: Look[] = [
  {
    // Current signature look — balanced feed-punchy emerald-friendly grade.
    name: "signature",
    stock: `eq=contrast=1.10:saturation=1.18:gamma=1.03:brightness=0.02,vibrance=intensity=0.16,${SHARP}`,
    brand: `eq=contrast=1.10:saturation=1.18:gamma=1.05:brightness=0.04,vibrance=intensity=0.10,${SHARP_SOFT}`,
  },
  {
    // Warm cinematic film — slightly warmer, soft contrast, gentle vignette.
    name: "warm-film",
    stock: `eq=contrast=1.12:saturation=1.10:gamma=1.04:brightness=0.02,colorbalance=rm=0.06:gm=0.02:bm=-0.05:rs=0.04:bs=-0.04,vibrance=intensity=0.12,vignette=PI/5,${SHARP}`,
    brand: `eq=contrast=1.10:saturation=1.12:gamma=1.05:brightness=0.04,colorbalance=rm=0.04:bm=-0.03,vibrance=intensity=0.08,${SHARP_SOFT}`,
  },
  {
    // Cool clean tech — cooler whites, crisp, brighter; modern app feel.
    name: "cool-clean",
    stock: `eq=contrast=1.12:saturation=1.12:gamma=1.02:brightness=0.04,colorbalance=rm=-0.04:bm=0.06:bs=0.05,vibrance=intensity=0.14,${SHARP}`,
    brand: `eq=contrast=1.10:saturation=1.14:gamma=1.04:brightness=0.05,colorbalance=bm=0.04,vibrance=intensity=0.09,${SHARP_SOFT}`,
  },
  {
    // Bold high-contrast editorial — punchy contrast, slightly restrained saturation.
    name: "high-contrast",
    stock: `eq=contrast=1.22:saturation=1.08:gamma=0.98:brightness=0.0,vibrance=intensity=0.10,vignette=PI/4.5,${SHARP}`,
    brand: `eq=contrast=1.16:saturation=1.12:gamma=1.02:brightness=0.03,vibrance=intensity=0.08,${SHARP_SOFT}`,
  },
  {
    // Vibrant feed-pop — higher saturation/vibrance for energetic, scroll-stopping color.
    name: "vibrant-pop",
    stock: `eq=contrast=1.12:saturation=1.30:gamma=1.03:brightness=0.03,vibrance=intensity=0.24,${SHARP}`,
    brand: `eq=contrast=1.10:saturation=1.22:gamma=1.05:brightness=0.04,vibrance=intensity=0.14,${SHARP_SOFT}`,
  },
];

/** Stable small hash so a given concept id always maps to the same look (reproducible runs). */
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Picks the look for a video. Priority:
 *   1. LOOK=<name> env override (pin a specific look),
 *   2. deterministic by `seed` (concept id) so each concept gets a consistent, varied look,
 *   3. first look as a safe default.
 */
export function pickLook(seed: string): Look {
  const pinned = process.env.LOOK;
  if (pinned) {
    const found = LOOKS.find((l) => l.name === pinned);
    if (found) return found;
  }
  if (seed) return LOOKS[hashString(seed) % LOOKS.length];
  return LOOKS[0];
}
