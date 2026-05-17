import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { generate } from "../llm.ts";
import { AdAnalysisSchema, type AdAnalysis, type CompetitorAd } from "../types.ts";

const SYSTEM_PROMPT = `You are a senior performance-marketing creative strategist analyzing competitor video ads in the AI fitness / sports app category. For each ad you receive, output a structured analysis. Be specific and concrete — name the hook type, describe the scene structure as second-by-second beats, identify what makes the ad work, and call out reusable elements another brand could borrow. Avoid fluff.`;

function buildUserPrompt(ad: CompetitorAd): string {
  return [
    `Analyze this competitor ad from the Meta Ad Library.`,
    ``,
    `Ad ID: ${ad.adId}`,
    `Advertiser: ${ad.advertiser}`,
    `Region: ${ad.region}`,
    `Discovered via keyword: "${ad.searchKeyword}"`,
    `Media type: ${ad.mediaType}`,
    ad.startedRunning ? `Started running: ${ad.startedRunning}` : "",
    ``,
    `Raw text snippet captured from the ad card (may include copy, hashtags, CTA):`,
    `"""`,
    ad.rawSnippet ?? "(no snippet)",
    `"""`,
    ``,
    `Return ONLY a JSON object matching this TypeScript shape (no markdown, no commentary):`,
    `{`,
    `  "adId": string,`,
    `  "hookType": "problem"|"social_proof"|"before_after"|"curiosity"|"shock"|"ugc_testimonial"|"demo_walkthrough"|"humor"|"stat_drop"|"other",`,
    `  "hookSummary": string,`,
    `  "sceneStructure": [{ "seconds": [start, end], "description": string }],`,
    `  "cta": string,`,
    `  "ctaPlacement": "intro"|"mid"|"outro"|"throughout",`,
    `  "toneTags": string[],`,
    `  "whyItWorks": string,`,
    `  "reusableElements": string[]`,
    `}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("no JSON object found in model output");
  return JSON.parse(raw.slice(start, end + 1));
}

export async function analyzeAds(opts: {
  competitorsFile: string;
  outputDir: string;
  limit?: number;
}): Promise<AdAnalysis[]> {
  const raw = await readFile(opts.competitorsFile, "utf8");
  const ads = JSON.parse(raw) as CompetitorAd[];
  const sliced = opts.limit ? ads.slice(0, opts.limit) : ads;

  const results: AdAnalysis[] = [];
  for (const ad of sliced) {
    try {
      const text = await generate({
        system: SYSTEM_PROMPT,
        user: buildUserPrompt(ad),
        model: "fast",
        maxOutputTokens: 4096,
      });
      const parsed = AdAnalysisSchema.safeParse({ ...(extractJson(text) as object), adId: ad.adId });
      if (parsed.success) {
        results.push(parsed.data);
        console.log(`[analyze] ${ad.adId} (${ad.advertiser}) → ${parsed.data.hookType}`);
      } else {
        console.warn(`[analyze] ${ad.adId} schema fail:`, parsed.error.issues.slice(0, 2));
      }
    } catch (err) {
      console.warn(`[analyze] ${ad.adId} error:`, (err as Error).message);
    }
  }

  const outPath = join(opts.outputDir, "analyses.json");
  await writeFile(outPath, JSON.stringify(results, null, 2), "utf8");
  console.log(`[analyze] saved ${results.length} analyses → ${outPath}`);
  return results;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { config } = await import("dotenv");
  config();
  const stamp = new Date().toISOString().slice(0, 10);
  const dir = join(process.cwd(), "output", stamp);
  await analyzeAds({
    competitorsFile: join(dir, "competitors.json"),
    outputDir: dir,
    limit: Number(process.env.LIMIT) || undefined,
  });
}
