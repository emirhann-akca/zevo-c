import { config } from "dotenv";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { discoverCompetitorAds } from "./pipeline/1-discover.ts";
import { analyzeAds } from "./pipeline/2-analyze.ts";
import { generateConcepts } from "./pipeline/3-concept.ts";
import { gatherAssets } from "./pipeline/4-assets.ts";
import { renderAds } from "./pipeline/6-render.ts";
import { publishToMeta } from "./pipeline/7-publish.ts";
import { runQc } from "./pipeline/8-qc.ts";
import { iterateDecisionLoop } from "./pipeline/9-iterate.ts";

config();

type Phase = "discover" | "analyze" | "concept" | "assets" | "render" | "qc" | "iterate" | "publish";
const ALL_PHASES: Phase[] = ["discover", "analyze", "concept", "assets", "render", "qc", "iterate", "publish"];

interface CliFlags {
  count: number;
  langs: ("tr" | "en")[];
  countries: string[];
  maxAdsPerKeyword: number;
  analyzeLimit?: number;
  conceptIds?: string[];
  skip: Set<Phase>;
  only?: Phase;
  headful: boolean;
  dryRun: boolean;
  date?: string;
  tip: "zevo-template" | "klasik" | "motivasyon" | "kurucu" | "beslenme" | "donusum" | "pattern-interrupt";
  viralityThreshold: number;
  maxRetries: number;
  targetDuration: number;
}

// Nutrition-focused competitor keywords used when tip=beslenme
const NUTRITION_KEYWORDS = [
  "calorie tracker app",
  "MyFitnessPal",
  "Noom",
  "Lose It",
  "macro tracker",
  "AI diet planner",
  "meal plan app",
  "nutrition tracker",
  "kalori takip",
  "diyet uygulaması",
] as const;

function parseFlags(argv: string[]): CliFlags {
  const flags: CliFlags = {
    count: 5,
    langs: ["tr", "en"],
    countries: ["TR", "US"],
    maxAdsPerKeyword: 6,
    skip: new Set(),
    headful: false,
    dryRun: false,
    tip: "klasik",
    viralityThreshold: 80,
    maxRetries: 0,
    targetDuration: 20,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === "--count") flags.count = Number(next());
    else if (a === "--langs") flags.langs = next().split(",") as any;
    else if (a === "--countries") flags.countries = next().split(",");
    else if (a === "--max-per-keyword") flags.maxAdsPerKeyword = Number(next());
    else if (a === "--analyze-limit") flags.analyzeLimit = Number(next());
    else if (a === "--concept-ids") flags.conceptIds = next().split(",");
    else if (a === "--skip") next().split(",").forEach((s) => flags.skip.add(s as Phase));
    else if (a === "--only") flags.only = next() as Phase;
    else if (a === "--headful") flags.headful = true;
    else if (a === "--dry-run") flags.dryRun = true;
    else if (a === "--date") flags.date = next();
    else if (a === "--tip") flags.tip = next() as "zevo-template" | "klasik" | "motivasyon" | "kurucu" | "beslenme" | "donusum" | "pattern-interrupt";
    else if (a === "--virality-threshold") flags.viralityThreshold = Number(next());
    else if (a === "--max-retries") flags.maxRetries = Number(next());
    else if (a === "--target-duration") flags.targetDuration = Number(next());
  }
  return flags;
}

function shouldRun(phase: Phase, flags: CliFlags): boolean {
  if (flags.only) return flags.only === phase;
  return !flags.skip.has(phase);
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  const stamp = flags.date ?? new Date().toISOString().slice(0, 10);
  const outputDir = join(process.cwd(), "output", stamp);
  await mkdir(outputDir, { recursive: true });

  console.log(`\n=== Zevo Ad Generator ===`);
  console.log(`Output dir: ${outputDir}`);
  console.log(`Phases: ${ALL_PHASES.filter((p) => shouldRun(p, flags)).join(" → ")}\n`);

  if (shouldRun("discover", flags)) {
    // For tip=beslenme, swap the default competitor seeds for nutrition-focused apps.
    const customKeywords = flags.tip === "beslenme" ? NUTRITION_KEYWORDS : undefined;
    console.log(`→ Phase 1: Discovering competitor ads${customKeywords ? ` (nutrition keywords: ${customKeywords.length})` : ""}...`);
    await discoverCompetitorAds({
      outputDir,
      countries: flags.countries,
      maxAdsPerKeyword: flags.maxAdsPerKeyword,
      headless: !flags.headful,
      keywords: customKeywords,
    });
  }

  if (shouldRun("analyze", flags)) {
    console.log("\n→ Phase 2: Analyzing ads with Claude...");
    await analyzeAds({
      competitorsFile: join(outputDir, "competitors.json"),
      outputDir,
      limit: flags.analyzeLimit,
    });
  }

  if (shouldRun("concept", flags)) {
    console.log(`\n→ Phase 3: Generating Zevo ad concepts (tip: ${flags.tip})...`);
    await generateConcepts({
      analysesFile: join(outputDir, "analyses.json"),
      outputDir,
      count: flags.count,
      type: flags.tip,
      targetDuration: flags.targetDuration,
    });
  }

  if (shouldRun("assets", flags)) {
    console.log("\n→ Phase 4: Gathering stock footage from Pexels...");
    await gatherAssets({
      conceptsFile: join(outputDir, "concepts.json"),
      outputDir,
      conceptIds: flags.conceptIds,
      tip: flags.tip,
    });
  }

  if (shouldRun("render", flags)) {
    console.log("\n→ Phase 5+6: Rendering videos + brand overlay...");
    await renderAds({
      conceptsFile: join(outputDir, "concepts.json"),
      assetsManifestFile: join(outputDir, "assets-manifest.json"),
      outputDir,
      langs: flags.langs,
      conceptIds: flags.conceptIds,
    });
  }

  if (shouldRun("qc", flags)) {
    console.log("\n→ Phase 8: Gemini Vision QC review...");
    await runQc({ outputDir, cleanupFrames: false });
  }

  if (shouldRun("iterate", flags)) {
    console.log(`\n→ Phase 9: Decision loop (threshold=${flags.viralityThreshold}, maxRetries=${flags.maxRetries})...`);
    await iterateDecisionLoop({
      outputDir,
      threshold: flags.viralityThreshold,
      maxRetries: flags.maxRetries,
      langs: flags.langs,
      tip: flags.tip,
    });
  }

  if (shouldRun("publish", flags)) {
    console.log("\n→ Phase 7: Publishing to Meta Ads (PAUSED status)...");
    await publishToMeta({
      rendersFile: join(outputDir, "renders.json"),
      conceptsFile: join(outputDir, "concepts.json"),
      outputDir,
      dryRun: flags.dryRun,
    });
  }

  console.log(`\n✓ Pipeline complete. Output: ${outputDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
