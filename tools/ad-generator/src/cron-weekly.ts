/**
 * Weekly autonomous run. Schedule via `launchd` (macOS) or `cron` (Linux):
 *
 *   # crontab entry (every Monday 09:00 local time)
 *   0 9 * * 1  cd /Users/emirhanakca/zevo-site/tools/ad-generator && /usr/local/bin/npx tsx src/cron-weekly.ts >> output/cron.log 2>&1
 *
 * What it does:
 *   1. Runs the full pipeline (discover → analyze → concept → assets → render → publish)
 *   2. Auto-publishes to Meta in PAUSED status (user flips to ACTIVE manually)
 *   3. Appends a run summary to output/cron-history.jsonl
 */
import { config } from "dotenv";
import { mkdir, appendFile } from "node:fs/promises";
import { join } from "node:path";
import { discoverCompetitorAds } from "./pipeline/1-discover.ts";
import { analyzeAds } from "./pipeline/2-analyze.ts";
import { generateConcepts } from "./pipeline/3-concept.ts";
import { gatherAssets } from "./pipeline/4-assets.ts";
import { renderAds } from "./pipeline/6-render.ts";
import { publishToMeta } from "./pipeline/7-publish.ts";

config();

async function run() {
  const stamp = new Date().toISOString().slice(0, 10);
  const outputDir = join(process.cwd(), "output", stamp);
  await mkdir(outputDir, { recursive: true });

  const startedAt = new Date().toISOString();
  console.log(`[cron] starting weekly run @ ${startedAt}`);

  const summary: Record<string, any> = { startedAt, outputDir };

  try {
    const ads = await discoverCompetitorAds({ outputDir, maxAdsPerKeyword: 4, headless: true });
    summary.competitors = ads.length;

    await analyzeAds({ competitorsFile: join(outputDir, "competitors.json"), outputDir, limit: 15 });
    const concepts = await generateConcepts({ analysesFile: join(outputDir, "analyses.json"), outputDir, count: 5 });
    summary.concepts = concepts.length;

    await gatherAssets({ conceptsFile: join(outputDir, "concepts.json"), outputDir });
    const rendered = await renderAds({
      conceptsFile: join(outputDir, "concepts.json"),
      assetsManifestFile: join(outputDir, "assets-manifest.json"),
      outputDir,
    });
    summary.rendered = rendered.length;

    const published = await publishToMeta({
      rendersFile: join(outputDir, "renders.json"),
      conceptsFile: join(outputDir, "concepts.json"),
      outputDir,
    });
    summary.published = published.filter((p) => p.status === "uploaded").length;
    summary.dryRun = published.filter((p) => p.status === "dry-run").length;
    summary.errors = published.filter((p) => p.status === "error").length;
    summary.status = "ok";
  } catch (err) {
    summary.status = "error";
    summary.error = (err as Error).message;
    console.error("[cron] failed:", err);
  }

  summary.finishedAt = new Date().toISOString();
  const historyPath = join(process.cwd(), "output", "cron-history.jsonl");
  await appendFile(historyPath, JSON.stringify(summary) + "\n");
  console.log(`[cron] done ${summary.status} — see ${historyPath}`);

  if (summary.status === "error") process.exit(1);
}

run();
