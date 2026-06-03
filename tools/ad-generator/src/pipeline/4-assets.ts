import { mkdir, writeFile, readFile, readdir, copyFile } from "node:fs/promises";
import { join } from "node:path";
import { createWriteStream, existsSync } from "node:fs";
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

// Pexels IDs banned from ever being used again. Lives in brand-assets/pexels-blacklist.json.
// Format: { "blocked": [12345, 67890] }
let _blacklistCache: Set<number> | null = null;
async function loadPexelsBlacklist(brandAssetsDir: string): Promise<Set<number>> {
  if (_blacklistCache) return _blacklistCache;
  try {
    const { readFile: rf } = await import("node:fs/promises");
    const path = `${brandAssetsDir}/pexels-blacklist.json`;
    const raw = await rf(path, "utf8");
    const parsed = JSON.parse(raw);
    _blacklistCache = new Set(parsed.blocked ?? []);
  } catch {
    _blacklistCache = new Set();
  }
  return _blacklistCache;
}

async function searchPexels(query: string, apiKey: string, perPage = 80, blacklist?: Set<number>): Promise<PexelsVideo[]> {
  const url = `${PEXELS_API}?query=${encodeURIComponent(query)}&orientation=portrait&size=large&per_page=${perPage}`;
  const res = await fetch(url, { headers: { Authorization: apiKey } });
  if (!res.ok) {
    console.warn(`[assets] pexels ${res.status} for "${query}"`);
    return [];
  }
  const data = (await res.json()) as { videos: PexelsVideo[] };
  return data.videos
    .filter((v) => v.height > v.width && v.duration >= 5 && v.height >= 1080)
    .filter((v) => !blacklist || !blacklist.has(v.id))
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

/**
 * Build a Pexels query that captures BOTH what the shot looks like (visual) AND what the
 * voiceover is emoting at that moment. For problem-state shots (first ~30% of the ad), the
 * query MUST emphasize the negative emotion (struggle / injury / frustration / confusion) so
 * Pexels returns footage that actually depicts the problem — not just generic "athlete squat".
 */
interface QueryContext {
  shotIdx: number;
  totalShots: number;
  voiceoverLine: string;
}
async function visualToQuery(visual: string, useLlm: boolean, ctx?: QueryContext): Promise<string> {
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
  const phase = !ctx ? "unknown"
    : ctx.shotIdx === 0 ? "hook (cinematic opener — should grab attention)"
    : ctx.shotIdx < Math.floor(ctx.totalShots * 0.3) ? "problem (must depict the negative state — frustration, struggle, injury risk, confusion)"
    : ctx.shotIdx === ctx.totalShots - 1 ? "FINAL payoff before logo outro (the EMOTIONAL climax — confident athlete celebrating, runner finish line, triumphant gesture, peak energy. This is the LAST emotional beat before the brand logo, so it MUST feel like a victory moment, NOT a quiet ending)"
    : ctx.shotIdx >= Math.floor(ctx.totalShots * 0.7) ? "payoff (must depict success — confidence, energy, transformation)"
    : "solution (transition — moving from problem to product)";
  try {
    const text = await generate({
      system:
        `You convert ad shot details into 2-5 word stock-footage search queries for Pexels. The result will be used in a Zevo (AI fitness/sports app) social-media ad.

CRITICAL: The shot's NARRATIVE PHASE drives the query emotion:
- "hook": cinematic, dramatic, attention-grabbing. Examples: "sunrise gym silhouette", "athlete intense focus"
- "problem": SHOW the suffering. Examples for an injury-prevention ad: "injured runner knee", "bad squat form", "athlete frustrated mirror", "weightlifter struggling pain". Do NOT just describe the subject ("athlete squat") — describe what's WRONG.
- "solution": transition. Examples: "phone fitness app close-up", "user checking phone gym"
- "payoff": success, confidence. Examples: "athlete celebrating victory", "runner finish line smile", "fit woman strong gym"
- "FINAL payoff before logo outro": the BIGGEST emotional moment of the ad — the last beat before the brand logo. MUST be a triumph/peak energy moment, NOT a quiet pose. Examples: "runner crossing finish line raised arms", "athlete celebrating fist pump", "weightlifter triumphant lockout cheer", "woman dancing victory gym", "sunrise mountain top stretch hands up". Avoid: static poses, sad/tired expressions, UI screens, mid-action shots.

Output rules:
- 2-5 English words, lowercase, no punctuation
- Prefer CONCRETE physical subjects + emotion state over abstracts
- For people: include gender + activity + emotion ('frustrated man squat', 'happy woman lifting')
- AVOID generic queries ("fitness motivation", "athlete workout") — those return staged stock
- AVOID CGI keywords: 'concept', 'graphic', 'digital', 'animation'
- BRAND-SAFE bias: NEVER include competitor names ('adidas', 'nike', 'crossfit', 'puma', 'reebok'). Prefer DARK / MUTED clothing in queries when applicable ('athlete dark gym', 'man black shorts squat') so results lean neutral. Avoid color words that fight Zevo emerald: do not say 'red', 'orange', 'lime', 'pink', 'yellow' — say 'monochrome', 'dark', or omit color entirely.

Output ONLY the query string, no quotes, no explanation.`,
      user: ctx
        ? `Shot phase: ${phase}\nVisual description: ${visual}\nVoiceover at this moment: "${ctx.voiceoverLine}"\n\nProduce the Pexels query that matches BOTH the visual AND the voiceover's emotion in this phase.`
        : visual,
      model: "fast",
      maxOutputTokens: 256,
      temperature: 0.2,
    });
    return text.trim().replace(/^["']|["']$/g, "").replace(/\n.*/s, "") || "fitness workout";
  } catch {
    return visualToQuery(visual, false);
  }
}

// --- Curated stock library (user-managed) ---
// brand-assets/stock/<phase>/*.mp4 — clips the user has hand-picked. Pipeline tries these
// BEFORE hitting Pexels API. Each phase folder maps to a position in the shotlist:
//   hook = shot 0
//   problem = first 30% (excluding shot 0)
//   solution-transition = middle 30-70%
//   payoff = last shot (and other late shots)
type StockPhase = "hook" | "problem" | "solution-transition" | "payoff";

function phaseForShot(shotIdx: number, totalShots: number): StockPhase {
  if (shotIdx === 0) return "hook";
  if (shotIdx === totalShots - 1) return "payoff";
  const problemEnd = Math.max(1, Math.floor(totalShots * 0.3));
  if (shotIdx < problemEnd) return "problem";
  if (shotIdx >= Math.floor(totalShots * 0.7)) return "payoff";
  return "solution-transition";
}

async function listCuratedStock(brandAssetsDir: string, phase: StockPhase): Promise<string[]> {
  const dir = join(brandAssetsDir, "stock", phase);
  if (!existsSync(dir)) return [];
  const files = await readdir(dir).catch(() => []);
  return files
    .filter((f) => f.toLowerCase().endsWith(".mp4"))
    .map((f) => join(dir, f));
}

/**
 * Pick the curated-stock clip whose filename best matches the shot intent. Returns absolute
 * path or null if no curated clip fits / no clips available.
 */
async function pickCuratedStock(
  shotVisual: string,
  voiceoverLine: string,
  candidates: string[],
  usedPaths: Set<string>,
  useLlm: boolean
): Promise<string | null> {
  const fresh = candidates.filter((p) => !usedPaths.has(p));
  if (fresh.length === 0) return null;
  if (fresh.length === 1) return fresh[0];
  if (!useLlm) return fresh[0];

  // Filename-as-tag matcher: the filename describes the content (e.g. "frustrated-athlete-mirror.mp4").
  const labelled = fresh.map((p, i) => {
    const base = p.split(/[\\/]/).pop() ?? p;
    const tag = base.replace(/\.mp4$/i, "").replace(/[-_]/g, " ");
    return { idx: i, path: p, label: tag };
  });
  try {
    const out = await generate({
      system: `You are choosing a hand-curated stock clip for a Zevo ad shot. Filenames describe the clip content (kebab-case). Pick the BEST match for the shot's intent based on the voiceover and visual description. Reply with ONLY a single digit 0-${labelled.length - 1}. If nothing fits well enough, reply "none".`,
      user: `Candidates:\n${labelled.map((c) => `${c.idx}: ${c.label}`).join("\n")}\n\nShot visual: "${shotVisual}"\nVoiceover: "${voiceoverLine}"\n\nWhich index?`,
      model: "fast",
      maxOutputTokens: 32,
      temperature: 0.1,
    });
    const trimmed = out.trim().toLowerCase();
    if (trimmed.startsWith("none")) return null;
    const m = trimmed.match(/\d+/);
    if (m) {
      const idx = parseInt(m[0], 10);
      if (idx >= 0 && idx < labelled.length) return labelled[idx].path;
    }
  } catch (err) {
    console.warn(`[assets] curated pick LLM failed, using first candidate:`, (err as Error).message);
  }
  return fresh[0];
}

/**
 * Multimodal pick: show Gemini all candidate thumbnails and ask which is the BEST AND BRAND-SAFE.
 * Vetoes off-brand colors (red, orange, lime, neon pink dominant) and competitor logos
 * (Adidas, Nike, Under Armour, etc.) — if ALL candidates fail brand-safety, returns -1 so caller
 * can retry with a different query.
 */
async function pickBestCandidate(
  shotDescription: string,
  voiceoverLine: string,
  candidates: PexelsVideo[]
): Promise<number> {
  if (candidates.length === 0) return -1;
  if (candidates.length === 1) return 0;
  // Show Gemini the top 10 candidates
  const top = candidates.slice(0, 10);
  const thumbnails = top.map((c) => c.image);

  try {
    const out = await generateWithImages({
      system: `You are a senior video editor choosing stock footage for a Zevo (AI fitness app) social-media ad. Zevo's brand color is EMERALD GREEN (#10DC78) on dark navy. The ad MUST NOT feature dominant off-brand colors or competitor branding.

REJECT any image showing:
- ANY phone/tablet app interface or screen UI that is not clearly Zevo (dark navy + emerald-green app). Zevo UI shows Turkish text like "TEKRAR", "FORM", "Squat", "Shoulder Press" on a dark-navy background with emerald accents. ANY OTHER app UI (a fitness tracker, a generic health app, an iOS settings screen, a maps app, etc.) is a fatal brand violation and must be rejected — even if the image otherwise matches the shot description.
- Dominant non-brand colors: ANY saturated red / orange / lime / pink / yellow taking up >25% of the frame (athlete's clothing, gym walls, equipment, lighting). The Zevo brand is dark navy + emerald — anything that competes with that palette must be rejected. When in doubt about a borderline color, reject. Prefer black/grey/white/dark-blue clothing or dim warm-light scenes.
- Competitor logos / brand marks: Adidas (3 stripes), Nike (swoosh), Under Armour, Puma, Reebok, New Balance, Crossfit branding, gym chain logos
- Amateur/dated production: blurry, poorly lit, staged-looking 2000s stock, watermarks, text overlays from another source
- Aspect mismatch: clearly landscape orientation that won't crop to 9:16 cleanly

Choose the BEST image that PASSES all four checks AND best matches the shot's intent.

Return format: ONLY a single digit 0-${top.length - 1} for the chosen index, OR the word "none" if every image fails brand-safety. No explanation.`,
      user: `Shot description: "${shotDescription}"\nVoiceover at this moment: "${voiceoverLine}"\n\nWhich image is best AND brand-safe?`,
      imageUrls: thumbnails,
      maxOutputTokens: 32,
    });
    const trimmed = out.trim().toLowerCase();
    if (trimmed.startsWith("none")) return -1;
    const m = trimmed.match(/\d+/);
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
  tip?: string;
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

  // Load brand assets (real Zevo screenshots/videos) — filtered by tip when set
  const brandAssetsDir = opts.brandAssetsDir ?? join(process.cwd(), "brand-assets");
  const brandAssets = useLlm ? await loadBrandAssets(brandAssetsDir, opts.tip) : [];

  const manifest: Record<string, AssetEntry[]> = {};

  // CROSS-CONCEPT coverage: count how many times each brand asset has been used across the WHOLE
  // run. The picker prefers low-count assets so every brand video gets airtime when N>1 concepts.
  const globalUseCount = new Map<string, number>();
  for (const a of brandAssets) globalUseCount.set(a.id, 0);

  /**
   * Last-resort asset: when every smart picker has refused, we still MUST give the shot
   * something to play — leaving a blank dark-navy screen is worse than reusing an asset.
   * Preference order:
   *   1. Brand assets not yet used in this concept (any feature)
   *   2. Brand asset with lowest global use count
   * Returns null only if there are literally zero brand assets in the manifest.
   */
  function lastResortBrandAsset(
    pool: BrandAsset[],
    usedInThisConcept: Set<string>,
    globalCount: Map<string, number>
  ): BrandAsset | null {
    if (pool.length === 0) return null;
    const sorted = [...pool].sort((a, b) => {
      // Prefer assets not used yet in THIS concept
      const aFresh = usedInThisConcept.has(a.id) ? 1 : 0;
      const bFresh = usedInThisConcept.has(b.id) ? 1 : 0;
      if (aFresh !== bFresh) return aFresh - bFresh;
      // Then prefer lifestyle/neutral (safer to fit any shot)
      const aLs = a.feature === "lifestyle" ? 0 : 1;
      const bLs = b.feature === "lifestyle" ? 0 : 1;
      if (aLs !== bLs) return aLs - bLs;
      // Finally, least globally used
      return (globalCount.get(a.id) ?? 0) - (globalCount.get(b.id) ?? 0);
    });
    return sorted[0];
  }

  for (const concept of filtered) {
    manifest[concept.id] = [];
    // Track which brand assets are already used in THIS concept (no asset twice in one ad)
    const usedBrandIds = new Set<string>();
    const usedCuratedPaths = new Set<string>();
    // Track which Pexels video IDs are already used in this concept
    const usedPexelsIds = new Set<number>();

    // Helper used by every "skip" path to GUARANTEE the shot gets an asset rather than going empty.
    // Returns true if the shot was filled by the fallback (caller should then `continue` clean).
    const fillWithLastResort = (i: number, reason: string): boolean => {
      const fb = lastResortBrandAsset(brandAssets, usedBrandIds, globalUseCount);
      if (!fb) return false;
      usedBrandIds.add(fb.id);
      globalUseCount.set(fb.id, (globalUseCount.get(fb.id) ?? 0) + 1);
      manifest[concept.id].push({
        shotIdx: i,
        source: fb.type === "image" ? "brand-image" : "brand-video",
        localPath: fb.path,
        brandAssetId: fb.id,
        visionPick: false,
        fallbackReason: reason,
      });
      console.log(`[assets] ${concept.id}/${i} → brand-${fb.type} (FALLBACK: ${reason}): ${fb.id}`);
      return true;
    };

    for (let i = 0; i < concept.shotlist.length; i++) {
      const shot = concept.shotlist[i];
      const voLine = (shot.voiceover as any)?.en ?? (shot.voiceover as any)?.tr ?? "";

      // 1) Try brand asset first. Sort the candidates so the least-used-globally appear FIRST →
      // Gemini's pick is biased toward variety across the run without breaking semantic match.
      const minCount = Math.min(...brandAssets.filter((a) => !usedBrandIds.has(a.id)).map((a) => globalUseCount.get(a.id) ?? 0));
      const available = brandAssets
        .filter((a) => !usedBrandIds.has(a.id))
        .sort((x, y) => {
          const cx = globalUseCount.get(x.id) ?? 0;
          const cy = globalUseCount.get(y.id) ?? 0;
          // Prefer unused (count===0), then less-used. Stable order within a tier.
          if (cx !== cy) return cx - cy;
          return 0;
        });
      // Fast path: when the concept generator wrote a brand-asset ID directly into shot.visual
      // (e.g. visual="onboarding-questionnaire-turkish"), bypass the LLM picker. Match strictly
      // first, then fall back to fuzzy (substring) so minor LLM typos still hit the right asset.
      // This is critical for template mode where Gemini outputs exact IDs but might paraphrase.
      const visualTrimmed = (shot.visual ?? "").trim().toLowerCase();
      let directIdMatch = available.find((a) => a.id.toLowerCase() === visualTrimmed);
      if (!directIdMatch && visualTrimmed.length > 5) {
        // Try: visual contains an asset id, or asset id contains visual stem
        directIdMatch = available.find((a) => visualTrimmed.includes(a.id.toLowerCase()))
          ?? available.find((a) => a.id.toLowerCase().includes(visualTrimmed.replace(/[^a-z0-9-]/g, "")));
      }
      const brandPick = directIdMatch
        ?? (available.length > 0
          ? await pickBrandAsset(shot.visual, voLine, available, { shotIdx: i, totalShots: concept.shotlist.length })
          : null);

      if (brandPick) {
        usedBrandIds.add(brandPick.id);
        globalUseCount.set(brandPick.id, (globalUseCount.get(brandPick.id) ?? 0) + 1);
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

      // 2) Try the user's CURATED stock library (brand-assets/stock/<phase>/*.mp4) before
      //    hitting the Pexels API. This lets the user hand-pick clips they trust.
      const phase = phaseForShot(i, concept.shotlist.length);
      const curatedCandidates = await listCuratedStock(brandAssetsDir, phase);
      if (curatedCandidates.length > 0) {
        const pickedPath = await pickCuratedStock(shot.visual, voLine, curatedCandidates, usedCuratedPaths, useLlm);
        if (pickedPath) {
          usedCuratedPaths.add(pickedPath);
          manifest[concept.id].push({
            shotIdx: i,
            source: "curated-stock",
            phase,
            localPath: pickedPath,
            visionPick: useLlm,
          });
          const fname = pickedPath.split(/[\\/]/).pop();
          console.log(`[assets] ${concept.id}/${i} → curated-stock (${phase}): ${fname}`);
          continue;
        }
      }

      // 3) Fall back to Pexels
      if (!pexelsKey) {
        console.warn(`[assets] ${concept.id}/${i} no brand match and no PEXELS_API_KEY`);
        if (fillWithLastResort(i, "no-pexels-key")) continue;
        continue;
      }
      // If the shot description SUGGESTS an app UI / phone interface, we must NOT fetch
      // Pexels stock — random Pexels footage that looks like an app screen is almost certainly
      // a competitor's app. Fall back to brand asset (last resort) instead of leaving empty.
      const looksUiThemed = /\b(app|interface|screen|ui|dashboard|phone|telefon|ekran|arayüz)\b/i.test(
        shot.visual + " " + voLine
      );
      if (looksUiThemed) {
        console.warn(`[assets] ${concept.id}/${i} is UI-themed, no brand match — using last-resort brand asset (avoid competitor app)`);
        if (fillWithLastResort(i, "ui-themed-no-brand")) continue;
        continue;
      }

      const blacklist = await loadPexelsBlacklist(brandAssetsDir);

      // Try up to 3 query variants. First: primary query. Each retry asks the LLM for a
      // fresh phrasing biased toward neutral/dark color schemes & no competitor brands.
      // Picker now returns -1 when EVERY candidate fails brand-safety — that triggers retry.
      let video: PexelsVideo | null = null;
      let query = await visualToQuery(shot.visual, useLlm, {
        shotIdx: i,
        totalShots: concept.shotlist.length,
        voiceoverLine: voLine,
      });
      let pickedIdx = -1;
      let attempt = 0;
      const triedQueries: string[] = [];
      while (!video && attempt < 3) {
        triedQueries.push(query);
        const rawCandidates = await searchPexels(query, pexelsKey, 80, blacklist);
        const candidates = rawCandidates.filter((v) => !usedPexelsIds.has(v.id));
        if (candidates.length === 0) {
          attempt++;
          query = await visualToQuery(shot.visual + " (alternative wording, neutral tones)", useLlm, {
            shotIdx: i,
            totalShots: concept.shotlist.length,
            voiceoverLine: voLine,
          });
          continue;
        }
        pickedIdx = useLlm ? await pickBestCandidate(shot.visual, voLine, candidates) : 0;
        if (pickedIdx === -1) {
          // All candidates flagged off-brand → retry with neutral-leaning query
          attempt++;
          query = await visualToQuery(`${shot.visual} (neutral colors, no logos, monochrome clothing)`, useLlm, {
            shotIdx: i,
            totalShots: concept.shotlist.length,
            voiceoverLine: voLine,
          });
          continue;
        }
        video = candidates[pickedIdx] ?? candidates[0];
      }
      if (!video) {
        console.warn(`[assets] ${concept.id}/${i} all Pexels retries failed (tried: ${triedQueries.join(", ")}) — using last-resort brand asset`);
        if (fillWithLastResort(i, "pexels-exhausted")) continue;
        continue;
      }
      usedPexelsIds.add(video.id);
      const fileUrl = pickFile(video);
      if (!fileUrl) {
        if (fillWithLastResort(i, "pexels-no-file-url")) continue;
        continue;
      }
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
