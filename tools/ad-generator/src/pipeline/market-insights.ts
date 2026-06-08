/**
 * Market-insights loader. Reads the competitor gap-analysis (`market-insights.json` at the
 * ad-generator root) — distilled from fresh Meta Ad Library scrapes of the fitness / running /
 * sports / nutrition category — and turns it into a prompt section injected into the concept
 * generator. This makes EVERY future concept automatically apply the "what to add / what to
 * remove" learnings from the market analysis, instead of the lessons living only in a report.
 *
 * Data-only (market-insights.json) so it can be re-generated after each market scrape without
 * touching code. Mirrors the hooks.ts / buildHookPromptSection pattern.
 */
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

export interface MarketInsights {
  _meta: {
    purpose: string;
    generated: string; // ISO date
    sample: string; // human description of the analyzed sample
    sources: string[];
  };
  /** Things competitors do that we currently under-use — concept gen should lean INTO these. */
  add: string[];
  /** Things that hurt performance / look generic — concept gen must AVOID these. */
  remove: string[];
  /** Quantified benchmarks the model should aim to match (hook mix, pacing, CTA, etc.). */
  benchmarks: string[];
}

let _cache: MarketInsights | null = null;

export async function loadMarketInsights(rootDir: string = process.cwd()): Promise<MarketInsights | null> {
  if (_cache) return _cache;
  const path = join(rootDir, "market-insights.json");
  if (!existsSync(path)) return null;
  try {
    _cache = JSON.parse(await readFile(path, "utf8")) as MarketInsights;
    return _cache;
  } catch {
    return null;
  }
}

/**
 * Builds the prompt section. The model is told to treat ADD items as priorities, REMOVE items
 * as hard avoid-list, and BENCHMARKS as targets to match. Kept terse so it complements (not
 * drowns) the hook library and competitor analyses already in the prompt.
 */
export function buildMarketInsightsPromptSection(mi: MarketInsights): string {
  const lines: string[] = [
    ``,
    `**MARKET INSIGHTS (fresh competitor gap analysis — ${mi._meta.sample}). These are distilled directives from analyzing what currently performs in the fitness/running/nutrition ad category. Apply them on top of the hook library.**`,
    ``,
    `DO MORE OF (we currently under-use these — competitors win with them):`,
    ...mi.add.map((s) => `  ✅ ${s}`),
    ``,
    `AVOID (generic / fatigued / low-converting — do NOT produce these):`,
    ...mi.remove.map((s) => `  ⛔ ${s}`),
    ``,
    `TARGETS TO MATCH (category benchmarks):`,
    ...mi.benchmarks.map((s) => `  🎯 ${s}`),
  ];
  return lines.join("\n");
}
