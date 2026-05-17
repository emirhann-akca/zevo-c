import { mkdir, writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { generate, generateWithImages, isAvailable as llmAvailable } from "../llm.ts";
import { loadBrandAssets, pickBrandAsset, type BrandAsset } from "./brand-assets.ts";
import type { AdConcept } from "../types.ts";

const PEXELS_API = "https://api.pexels.com/videos/search";

interface PexelsVideo {
  id: number;
  duration: number;
  width: number;
  height: number;
  image: string; // thumbnail
  video_files: { link: string; width: number; height: number; quality: string; file_type: string }[];
}

async function searchPexels(query: string, apiKey: string, perPage = 20): Promise<PexelsVideo[]> {
  const url = `${PEXELS_API}?query=${encodeURIComponent(query)}&orientation=portrait&size=large&per_page=${perPage}`;
  const res = await fetch(url, { headers: { Authorization: apiKey } });
  if (!res.ok) {
    console.warn(`[assets] pexels ${res.status} for "${query}"`);
    return [];
  }
  const data = (await res.json()) as { videos: PexelsVideo[] };
  return data.videos
    .filter((v) => v.height > v.width && v.duration >= 5 && v.height >= 1080)
    .sort((a, b) => b.width * b.height - a.width * a.height);
}

function pickFile(v: PexelsVideo): string | null {
  const mp4s = v.video_files.filter((f) => f.file_type === "video/mp4" && f.height >= 720);
  const sorted = mp4s.sort((a, b) => {
    const aDist = Math.abs(a.height - 1920);
    const bDist = Math.abs(b.height - 1920);
    if (aDist !== bDist) return aDist - bDist;
    return b.width - a.width;
  });
  return sorted[0]?.link ?? null;
}

async function downloadTo(url: string, dest: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`download failed: ${res.status}`);
  await pipeline(res.body as any, createWriteStream(dest));
}

async function visualToQuery(visual: string, useLlm: boolean): Promise<string> {
  if (!useLlm) {
    const stop = new Set([
      "a", "an", "the", "in", "on", "at", "with", "and", "or", "of", "to", "for", "is", "are",
      "bir", "ve", "ile", "da", "de", "ki", "için", "bu", "şu",
    ]);
    const words = visual
      .toLowerCase()
      .replace(/[^\p{L}\s]/gu, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stop.has(w));
    return words.slice(0, 4).join(" ") || "fitness workout";
  }
  try {
    const text = await generate({
      system:
        "You convert detailed visual shot descriptions into 2-4 word stock-footage search queries optimized for Pexels. Output ONLY the query, nothing else.",
      user: visual,
      model: "fast",
      maxOutputTokens: 256,
      temperature: 0.2,
    });
    return text.trim().replace(/^["']|["']$/g, "").replace(/\n.*/s, "") || "fitness workout";
  } catch {
    return visualToQuery(visual, false);
  }
}

/**
 * Multimodal pick: show Gemini all candidate thumbnails and ask which best fits the shot.
 * Returns the index of the chosen candidate, or 0 on failure.
 */
async function pickBestCandidate(
  shotDescription: string,
  voiceoverLine: string,
  candidates: PexelsVideo[]
): Promise<number> {
  if (candidates.length <= 1) return 0;
  const top = candidates.slice(0, 6);
  const thumbnails = top.map((c) => c.image);

  try {
    const out = await generateWithImages({
      system: `You are a senior video editor choosing stock footage for a Zevo (AI fitness app) social-media ad. Pick the SINGLE image that best matches the shot's intent. Prioritize: (1) accurate subject match, (2) cinematic quality and lighting, (3) emotional fit with the voiceover line, (4) vertical/portrait composition friendliness. Avoid anything that looks staged, dated, or low-quality. Return ONLY a single digit 0-${top.length - 1} matching the chosen image index. No explanation.`,
      user: `Shot description: "${shotDescription}"\nVoiceover at this moment: "${voiceoverLine}"\n\nWhich numbered image best fits?`,
      imageUrls: thumbnails,
      maxOutputTokens: 32,
    });
    const m = out.match(/\d+/);
    if (m) {
      const idx = parseInt(m[0], 10);
      if (idx >= 0 && idx < top.length) return idx;
    }
  } catch (err) {
    console.warn(`[assets] vision pick failed:`, (err as Error).message);
  }
  return 0;
}

export interface GatherOptions {
  conceptsFile: string;
  outputDir: string;
  conceptIds?: string[];
  brandAssetsDir?: string;
}

export interface AssetEntry {
  shotIdx: number;
  source: "brand-image" | "brand-video" | "pexels";
  query?: string;
  localPath: string;
  sourceUrl?: string;
  pexelsId?: number;
  brandAssetId?: string;
  visionPick: boolean;
}

export async function gatherAssets(opts: GatherOptions) {
  const pexelsKey = process.env.PEXELS_API_KEY;
  const useLlm = llmAvailable();
  if (!useLlm) console.warn("[assets] VERTEX_PROJECT_ID not set — using heuristic query + first-result selection");

  const concepts = JSON.parse(await readFile(opts.conceptsFile, "utf8")) as AdConcept[];
  const filtered = opts.conceptIds ? concepts.filter((c) => opts.conceptIds!.includes(c.id)) : concepts;
  const assetsDir = join(opts.outputDir, "assets");
  await mkdir(assetsDir, { recursive: true });

  // Load brand assets (real Zevo screenshots/videos)
  const brandAssetsDir = opts.brandAssetsDir ?? join(process.cwd(), "brand-assets");
  const brandAssets = useLlm ? await loadBrandAssets(brandAssetsDir) : [];

  const manifest: Record<string, AssetEntry[]> = {};

  for (const concept of filtered) {
    manifest[concept.id] = [];
    // Track which brand assets are already used in this concept (avoid repeating the same screen)
    const usedBrandIds = new Set<string>();

    for (let i = 0; i < concept.shotlist.length; i++) {
      const shot = concept.shotlist[i];
      const voLine = (shot.voiceover as any)?.en ?? (shot.voiceover as any)?.tr ?? "";

      // 1) Try brand asset first
      const available = brandAssets.filter((a) => !usedBrandIds.has(a.id));
      const brandPick = available.length > 0 ? await pickBrandAsset(shot.visual, voLine, available) : null;

      if (brandPick) {
        usedBrandIds.add(brandPick.id);
        manifest[concept.id].push({
          shotIdx: i,
          source: brandPick.type === "image" ? "brand-image" : "brand-video",
          localPath: brandPick.path,
          brandAssetId: brandPick.id,
          visionPick: true,
        });
        console.log(`[assets] ${concept.id}/${i} → brand-${brandPick.type}: ${brandPick.id}`);
        continue;
      }

      // 2) Fall back to Pexels
      if (!pexelsKey) {
        console.warn(`[assets] ${concept.id}/${i} no brand match and no PEXELS_API_KEY — skipping`);
        continue;
      }
      const query = await visualToQuery(shot.visual, useLlm);
      const candidates = await searchPexels(query, pexelsKey, 20);
      if (candidates.length === 0) {
        console.warn(`[assets] no Pexels match for ${concept.id}/${i} "${query}"`);
        continue;
      }
      const pickedIdx = useLlm ? await pickBestCandidate(shot.visual, voLine, candidates) : 0;
      const video = candidates[pickedIdx] ?? candidates[0];
      const fileUrl = pickFile(video);
      if (!fileUrl) continue;
      const localPath = join(assetsDir, `${concept.id}-${i}-${video.id}.mp4`);
      try {
        await downloadTo(fileUrl, localPath);
        manifest[concept.id].push({
          shotIdx: i,
          source: "pexels",
          query,
          localPath,
          sourceUrl: fileUrl,
          pexelsId: video.id,
          visionPick: useLlm,
        });
        console.log(
          `[assets] ${concept.id}/${i} → pexels: "${query}" → ${video.id}${useLlm ? ` (vision pick #${pickedIdx})` : ""}`
        );
      } catch (err) {
        console.warn(`[assets] download failed ${concept.id}/${i}:`, (err as Error).message);
      }
    }
  }

  const manifestPath = join(opts.outputDir, "assets-manifest.json");
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  console.log(`[assets] manifest → ${manifestPath}`);
  return manifest;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { config } = await import("dotenv");
  config();
  const stamp = new Date().toISOString().slice(0, 10);
  const dir = join(process.cwd(), "output", stamp);
  await gatherAssets({ conceptsFile: join(dir, "concepts.json"), outputDir: dir });
}
