/**
 * Pluggable stock-video providers.
 *
 * The pipeline must not be locked to Pexels. This module exposes a small provider
 * interface so we can pull legally-safe, commercial-use-OK footage from several
 * sources with identical downstream handling. Each provider:
 *   - reports whether it's configured (API key present),
 *   - searches by free-text query and returns a normalized `StockVideo[]`
 *     (portrait, >=5s, >=1080 tall, sorted best-resolution-first).
 *
 * Adding a new provider = implement `StockProvider` and push it into `getProviders()`.
 * Currently wired: Pexels + Pixabay (both free, commercial-use, clean public APIs).
 * NOTE: Coverr / Mixkit are deliberately excluded — no clean public API; scraping
 * them is fragile and legally murkier than the licensed APIs above.
 */

export type ProviderName = "pexels" | "pixabay";

/** Provider-agnostic, render-ready stock clip. */
export interface StockVideo {
  provider: ProviderName;
  /** Unique within a provider; combine with `provider` for a global key. */
  id: string;
  duration: number;
  width: number;
  height: number;
  /** Still-frame URL used for Gemini vision scoring. */
  thumbnail: string;
  /** Best portrait mp4 link, already chosen (closest to 1920 tall). */
  downloadUrl: string;
}

/** Stable global key so "used" tracking never collides across providers. */
export function stockKey(v: StockVideo): string {
  return `${v.provider}:${v.id}`;
}

export interface StockProvider {
  name: ProviderName;
  /** True when the provider has the credentials it needs. */
  available(): boolean;
  /** Returns normalized portrait candidates, best-resolution first. */
  search(query: string, perPage?: number): Promise<StockVideo[]>;
}

function passesPortraitGate(width: number, height: number, duration: number): boolean {
  return height > width && duration >= 5 && height >= 1080;
}

// ----------------------------- Pexels -----------------------------

const PEXELS_API = "https://api.pexels.com/videos/search";

interface PexelsVideoRaw {
  id: number;
  duration: number;
  width: number;
  height: number;
  image: string;
  video_files: { link: string; width: number; height: number; quality: string; file_type: string }[];
}

function pexelsPickFile(v: PexelsVideoRaw): string | null {
  const mp4s = v.video_files.filter((f) => f.file_type === "video/mp4" && f.height >= 720);
  const sorted = mp4s.sort((a, b) => {
    const aDist = Math.abs(a.height - 1920);
    const bDist = Math.abs(b.height - 1920);
    if (aDist !== bDist) return aDist - bDist;
    return b.width - a.width;
  });
  return sorted[0]?.link ?? null;
}

class PexelsProvider implements StockProvider {
  name = "pexels" as const;
  private key = process.env.PEXELS_API_KEY ?? "";
  available(): boolean {
    return this.key.length > 0;
  }
  async search(query: string, perPage = 80): Promise<StockVideo[]> {
    if (!this.key) return [];
    const url = `${PEXELS_API}?query=${encodeURIComponent(query)}&orientation=portrait&size=large&per_page=${perPage}`;
    let res: Response;
    try {
      res = await fetch(url, { headers: { Authorization: this.key } });
    } catch (err) {
      console.warn(`[stock:pexels] fetch failed for "${query}":`, (err as Error).message);
      return [];
    }
    if (!res.ok) {
      console.warn(`[stock:pexels] ${res.status} for "${query}"`);
      return [];
    }
    const data = (await res.json()) as { videos: PexelsVideoRaw[] };
    const out: StockVideo[] = [];
    for (const v of data.videos ?? []) {
      if (!passesPortraitGate(v.width, v.height, v.duration)) continue;
      const downloadUrl = pexelsPickFile(v);
      if (!downloadUrl) continue;
      out.push({
        provider: "pexels",
        id: String(v.id),
        duration: v.duration,
        width: v.width,
        height: v.height,
        thumbnail: v.image,
        downloadUrl,
      });
    }
    return out.sort((a, b) => b.width * b.height - a.width * a.height);
  }
}

// ----------------------------- Pixabay -----------------------------

const PIXABAY_API = "https://pixabay.com/api/videos/";

interface PixabayHit {
  id: number;
  duration: number;
  picture_id?: string;
  videos: Record<string, { url: string; width: number; height: number; size: number; thumbnail?: string }>;
}

class PixabayProvider implements StockProvider {
  name = "pixabay" as const;
  private key = process.env.PIXABAY_API_KEY ?? "";
  available(): boolean {
    return this.key.length > 0;
  }
  async search(query: string, perPage = 80): Promise<StockVideo[]> {
    if (!this.key) return [];
    // Pixabay video API has no orientation param; we filter portrait client-side.
    // per_page max is 200; clamp to a sane window.
    const pp = Math.min(Math.max(perPage, 3), 100);
    const url = `${PIXABAY_API}?key=${this.key}&q=${encodeURIComponent(query)}&per_page=${pp}&safesearch=true`;
    let res: Response;
    try {
      res = await fetch(url);
    } catch (err) {
      console.warn(`[stock:pixabay] fetch failed for "${query}":`, (err as Error).message);
      return [];
    }
    if (!res.ok) {
      console.warn(`[stock:pixabay] ${res.status} for "${query}"`);
      return [];
    }
    const data = (await res.json()) as { hits: PixabayHit[] };
    const out: StockVideo[] = [];
    for (const h of data.hits ?? []) {
      // Choose the best available rendition closest to 1920 tall (portrait only).
      const renditions = Object.values(h.videos ?? {}).filter(
        (r) => r && r.url && passesPortraitGate(r.width, r.height, h.duration),
      );
      if (renditions.length === 0) continue;
      renditions.sort((a, b) => Math.abs(a.height - 1920) - Math.abs(b.height - 1920));
      const best = renditions[0];
      const thumbnail =
        best.thumbnail ??
        renditions.find((r) => r.thumbnail)?.thumbnail ??
        (h.picture_id ? `https://i.vimeocdn.com/video/${h.picture_id}_640x360.jpg` : "");
      if (!thumbnail) continue; // need a still for vision scoring
      out.push({
        provider: "pixabay",
        id: String(h.id),
        duration: h.duration,
        width: best.width,
        height: best.height,
        thumbnail,
        downloadUrl: best.url,
      });
    }
    return out.sort((a, b) => b.width * b.height - a.width * a.height);
  }
}

// ----------------------------- registry -----------------------------

let _providers: StockProvider[] | null = null;

/** All configured providers, in priority order. Unconfigured ones are dropped. */
export function getProviders(): StockProvider[] {
  if (_providers) return _providers;
  const all: StockProvider[] = [new PexelsProvider(), new PixabayProvider()];
  _providers = all.filter((p) => p.available());
  const names = _providers.map((p) => p.name);
  if (names.length === 0) {
    console.warn("[stock] no providers configured (set PEXELS_API_KEY and/or PIXABAY_API_KEY)");
  } else {
    console.log(`[stock] active providers: ${names.join(", ")}`);
  }
  return _providers;
}

/**
 * Search EVERY configured provider for one query and merge the results.
 * `excludeKeys` drops already-used clips (use `stockKey`). Results stay sorted
 * best-resolution-first across providers.
 */
export async function searchAllProviders(
  query: string,
  perPage = 60,
  excludeKeys?: Set<string>,
): Promise<StockVideo[]> {
  const providers = getProviders();
  const batches = await Promise.all(
    providers.map((p) =>
      p.search(query, perPage).catch((err) => {
        console.warn(`[stock:${p.name}] search threw:`, (err as Error).message);
        return [] as StockVideo[];
      }),
    ),
  );
  const merged = batches.flat();
  const filtered = excludeKeys ? merged.filter((v) => !excludeKeys.has(stockKey(v))) : merged;
  return filtered.sort((a, b) => b.width * b.height - a.width * a.height);
}
