import { chromium, type Browser } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { ZEVO_BRAND } from "../brand.ts";
import { CompetitorAdSchema, type CompetitorAd } from "../types.ts";

const AD_LIBRARY_BASE = "https://www.facebook.com/ads/library/";

function buildSearchUrl(keyword: string, country: string): string {
  // Match Meta's native URL shape (verified against live URL). URLSearchParams percent-encodes
  // brackets which breaks `sort_data[mode]` — build the query string manually.
  const parts = [
    `active_status=active`,
    `ad_type=all`,
    `country=${encodeURIComponent(country)}`,
    `q=${encodeURIComponent(keyword)}`,
    `media_type=video`,
    `search_type=keyword_unordered`,
  ];
  return `${AD_LIBRARY_BASE}?${parts.join("&")}`;
}

export interface DiscoverOptions {
  keywords?: readonly string[];
  countries?: string[];
  maxAdsPerKeyword?: number;
  outputDir: string;
  headless?: boolean;
}

export async function discoverCompetitorAds(opts: DiscoverOptions): Promise<CompetitorAd[]> {
  const keywords = opts.keywords ?? ZEVO_BRAND.competitorSeeds;
  const countries = opts.countries ?? ["TR", "US"];
  const maxPer = opts.maxAdsPerKeyword ?? 8;

  await mkdir(opts.outputDir, { recursive: true });
  const all: CompetitorAd[] = [];

  const browser: Browser = await chromium.launch({ headless: opts.headless ?? true });
  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      viewport: { width: 1440, height: 900 },
      locale: "en-US",
    });

    for (const country of countries) {
      for (const keyword of keywords) {
        const url = buildSearchUrl(keyword, country);
        const page = await context.newPage();
        try {
          await page.goto(url, { waitUntil: "networkidle", timeout: 45_000 });
          // Dismiss cookie banner if present
          await page
            .getByRole("button", { name: /allow all|accept|kabul/i })
            .first()
            .click({ timeout: 3_000 })
            .catch(() => {});

          // Wait for ad cards to render
          await page.waitForTimeout(3_000);
          await page.evaluate(() => window.scrollBy(0, 2000));
          await page.waitForTimeout(2_000);

          // Meta's DOM has no stable card container; parse the page text by "Library ID" markers.
          const ads = await page.evaluate((max: number) => {
            const results: any[] = [];
            const bodyText = (document.body.innerText || "").replace(/\r/g, "");

            // Each ad block starts with "Library ID:" (EN) or "Kütüphane Kimliği:" (TR)
            const blockSplit = bodyText.split(/(?=Library ID:|Kütüphane Kimliği:)/g);
            const seen = new Set<string>();

            // Collect all video src/poster + img src in DOM order so we can index them
            const mediaUrls: { videos: string[]; posters: string[]; imgs: string[] } = {
              videos: Array.from(document.querySelectorAll("video")).map((v) => (v as HTMLVideoElement).src).filter(Boolean),
              posters: Array.from(document.querySelectorAll("video")).map((v) => (v as HTMLVideoElement).poster).filter(Boolean),
              imgs: Array.from(document.querySelectorAll("img")).map((i) => (i as HTMLImageElement).src).filter((s) => s && !s.startsWith("data:")),
            };

            let mediaIdx = 0;
            for (const block of blockSplit) {
              const idMatch = block.match(/(?:Library ID|Kütüphane Kimliği):\s*(\d+)/);
              if (!idMatch) continue;
              const adId = idMatch[1];
              if (seen.has(adId)) continue;
              seen.add(adId);

              const startedMatch =
                block.match(/Started running on\s*(.+?)(?:\n|$)/) ||
                block.match(/Yayınlanma tarihi:\s*(.+?)(?:\n|$)/);

              // Advertiser is usually 2-3 lines after "See ad details" or right before "Sponsored"
              const advertiserMatch =
                block.match(/See ad details\s*\n([^\n]+)\n/) ||
                block.match(/Reklam ayrıntılarını gör\s*\n([^\n]+)\n/) ||
                block.match(/\n([^\n]+)\nSponsored\b/) ||
                block.match(/\n([^\n]+)\nSponsorlu\b/);

              const hasVideoMarker = /\b\d+:\d{2}\s*\/\s*\d+:\d{2}\b/.test(block); // "0:00 / 1:40"
              const mediaType: "video" | "image" | "unknown" = hasVideoMarker ? "video" : "image";

              const video = hasVideoMarker ? mediaUrls.videos[mediaIdx] : undefined;
              const poster = hasVideoMarker ? mediaUrls.posters[mediaIdx] : undefined;
              if (hasVideoMarker) mediaIdx++;

              results.push({
                adId,
                advertiser: advertiserMatch?.[1]?.trim() || "unknown",
                startedRunning: startedMatch?.[1]?.trim(),
                mediaType,
                mediaUrl: video,
                thumbnailUrl: poster,
                rawSnippet: block.slice(0, 1200),
              });
              if (results.length >= max) break;
            }
            return results;
          }, maxPer);

          for (const raw of ads) {
            const parsed = CompetitorAdSchema.safeParse({
              ...raw,
              region: country,
              searchKeyword: keyword,
            });
            if (parsed.success) all.push(parsed.data);
          }
          console.log(`[discover] ${country} "${keyword}" → ${ads.length} ads`);
        } catch (err) {
          console.warn(`[discover] failed for ${country} "${keyword}":`, (err as Error).message);
        } finally {
          await page.close();
        }
      }
    }
  } finally {
    await browser.close();
  }

  // Dedupe across keywords
  const dedup = new Map<string, CompetitorAd>();
  for (const ad of all) if (!dedup.has(ad.adId)) dedup.set(ad.adId, ad);
  const unique = Array.from(dedup.values());

  const outPath = join(opts.outputDir, "competitors.json");
  await writeFile(outPath, JSON.stringify(unique, null, 2), "utf8");
  console.log(`[discover] saved ${unique.length} unique ads → ${outPath}`);

  return unique;
}

// Allow running this file directly: `tsx src/pipeline/1-discover.ts`
if (import.meta.url === `file://${process.argv[1]}`) {
  const stamp = new Date().toISOString().slice(0, 10);
  const dir = join(process.cwd(), "output", stamp);
  await discoverCompetitorAds({ outputDir: dir, headless: process.env.HEADFUL !== "1" });
}
