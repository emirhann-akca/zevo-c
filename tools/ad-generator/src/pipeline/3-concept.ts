import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { ZEVO_BRAND } from "../brand.ts";
import { generate } from "../llm.ts";
import { loadBrandAssets, type BrandAsset } from "./brand-assets.ts";
import { AdConceptSchema, type AdAnalysis, type AdConcept } from "../types.ts";

const SYSTEM_PROMPT = `You are the lead creative director at Zevo, designing short-form vertical video ads (Reels/TikTok, 9:16, 15-30s) for Zevo, an AI-powered sports & fitness assistant app. You synthesize competitor analyses into NEW, original concepts — never copying, always borrowing structural patterns and applying them to Zevo's brand voice and unique features.

Brand rules you NEVER violate:
- Tone: ${ZEVO_BRAND.voice.tone}
- Primary color: ${ZEVO_BRAND.visual.primaryColor} (emerald), background ${ZEVO_BRAND.visual.backgroundColor} (dark navy)
- CTA: "${ZEVO_BRAND.cta.tr}" (TR) / "${ZEVO_BRAND.cta.en}" (EN), always shown in the final 2 seconds
- TR and EN scripts must be culturally adapted, NOT word-for-word translations
- Visuals should feel UGC-friendly (handheld vertical, real athletes) rather than over-polished corporate
- Lean into Zevo's differentiators: AI form check, personalized programs, competitive leagues, nutrition planning
- IMPORTANT: write 'visual' fields in English using simple 2-5 word descriptions (e.g. "young runner morning park", "smartphone fitness app workout") — they become Pexels stock-footage search queries`;

function buildUserPrompt(analyses: AdAnalysis[], brandAssets: BrandAsset[], count: number): string {
  const brandSection =
    brandAssets.length > 0
      ? [
          ``,
          `**REAL ZEVO ASSETS AVAILABLE** — strongly prefer building shots around these instead of generic stock. They are the product's actual UI/feature footage and carry far more conviction:`,
          ...brandAssets.map(
            (a) =>
              `- [${a.feature}] ${a.id}: ${a.description.slice(0, 200)}  | Narrative: ${a.narrative}`
          ),
          ``,
          `Aim to use at least ${Math.min(brandAssets.length, 3)} of these brand assets across each concept's shotlist. When you write a shot's 'visual' field that uses one of these, mirror the asset's description language so the asset picker matches it correctly.`,
        ].join("\n")
      : "";

  return [
    `Below are ${analyses.length} competitor ad analyses from the AI fitness / sports app category. Use them as STRUCTURAL inspiration only — do not copy hooks, copy language, or specific scenes.`,
    ``,
    `Competitor analyses (JSON):`,
    `\`\`\`json`,
    JSON.stringify(analyses, null, 2),
    `\`\`\``,
    brandSection,
    ``,
    `Generate ${count} ORIGINAL ad concepts for Zevo. Diversify across hook types — do not produce ${count} variants of the same concept.`,
    ``,
    `For each concept, return an object matching this TypeScript shape:`,
    `{`,
    `  "id": string,  // kebab-case slug like "ai-form-fix-3am"`,
    `  "hookType": string,  // one of the hook types from the analyses`,
    `  "hookLine": { "tr": string, "en": string },  // opening line, max 8 words each`,
    `  "targetAudience": string,`,
    `  "durationSec": number,  // 15-30`,
    `  "inspiredBy": string[],  // competitor adIds`,
    `  "shotlist": [`,
    `    {`,
    `      "seconds": [start, end],`,
    `      "visual": string,  // 2-5 English words, stock-footage friendly (NOT detailed prose)`,
    `      "voiceover": { "tr": string, "en": string },`,
    `      "onScreenText": { "tr": string, "en": string }`,
    `    }`,
    `  ],  // 4-7 shots`,
    `  "cta": { "tr": "${ZEVO_BRAND.cta.tr}", "en": "${ZEVO_BRAND.cta.en}" },`,
    `  "musicMood": string,`,
    `  "rationale": string`,
    `}`,
    ``,
    `Return ONLY a JSON array of ${count} concept objects. No markdown fences, no commentary.`,
  ].join("\n");
}

function extractJsonArray(text: string): unknown[] {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error("no JSON array found in model output");
  return JSON.parse(raw.slice(start, end + 1));
}

export async function generateConcepts(opts: {
  analysesFile: string;
  outputDir: string;
  count?: number;
  brandAssetsDir?: string;
}): Promise<AdConcept[]> {
  const analyses = JSON.parse(await readFile(opts.analysesFile, "utf8")) as AdAnalysis[];
  const count = opts.count ?? 5;
  const brandAssetsDir = opts.brandAssetsDir ?? join(process.cwd(), "brand-assets");
  const brandAssets = await loadBrandAssets(brandAssetsDir);

  const text = await generate({
    system: SYSTEM_PROMPT,
    user: buildUserPrompt(analyses, brandAssets, count),
    model: "heavy",
    maxOutputTokens: 8192,
    temperature: 0.85,
  });

  const arr = extractJsonArray(text);
  const concepts: AdConcept[] = [];
  for (const item of arr) {
    const parsed = AdConceptSchema.safeParse(item);
    if (parsed.success) concepts.push(parsed.data);
    else console.warn("[concept] schema fail:", parsed.error.issues.slice(0, 3));
  }

  const outPath = join(opts.outputDir, "concepts.json");
  await writeFile(outPath, JSON.stringify(concepts, null, 2), "utf8");
  console.log(`[concept] saved ${concepts.length} concepts → ${outPath}`);
  return concepts;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { config } = await import("dotenv");
  config();
  const stamp = new Date().toISOString().slice(0, 10);
  const dir = join(process.cwd(), "output", stamp);
  await generateConcepts({
    analysesFile: join(dir, "analyses.json"),
    outputDir: dir,
    count: Number(process.env.COUNT) || 5,
  });
}
