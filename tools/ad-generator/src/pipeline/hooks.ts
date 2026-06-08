/**
 * Hook library loader. Reads the researched hook techniques from `hooks.json` (repo root of
 * the ad-generator) and turns them into a prompt section that is injected into the concept
 * generator, so EVERY concept is forced to pick a strong, named hook instead of a weak generic
 * opener. The library is data-only (hooks.json) so it can be edited without touching code.
 */
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

interface PatternInterruptExample {
  opener: string;
  bridge: string;
  pivot: string;
}
interface HookTechnique {
  id: string;
  name: string;
  why: string;
  template: string;
  zevo_tr: (string | PatternInterruptExample)[];
}
interface HookLibrary {
  _meta: { purpose: string; research_basis: string[]; rules: string[] };
  techniques: HookTechnique[];
}

let _cache: HookLibrary | null = null;

export async function loadHookLibrary(rootDir: string = process.cwd()): Promise<HookLibrary | null> {
  if (_cache) return _cache;
  const path = join(rootDir, "hooks.json");
  if (!existsSync(path)) return null;
  try {
    _cache = JSON.parse(await readFile(path, "utf8")) as HookLibrary;
    return _cache;
  } catch {
    return null;
  }
}

/** Returns the pattern-interrupt examples specifically (used by the pattern-interrupt tip). */
export async function loadPatternInterruptExamples(rootDir?: string): Promise<PatternInterruptExample[]> {
  const lib = await loadHookLibrary(rootDir);
  const t = lib?.techniques.find((x) => x.id === "pattern-interrupt");
  if (!t) return [];
  return t.zevo_tr.filter((e): e is PatternInterruptExample => typeof e === "object" && "bridge" in e);
}

/**
 * Builds a prompt section listing every hook technique with its psychological rationale and
 * Zevo-specific TR examples. The model is instructed to choose ONE named technique per concept
 * and set the concept's `hookType` to that technique id.
 */
export function buildHookPromptSection(lib: HookLibrary): string {
  const lines: string[] = [
    ``,
    `**HOOK LIBRARY — the single highest-leverage part of the ad. The first 1-3 seconds decide ~80% of completion. For EACH concept, pick exactly ONE technique below, set "hookType" to its id, and write shot 0's voiceover hook in that style.**`,
    ``,
    `Hard hook rules: ${lib._meta.rules.map((r) => `\n  - ${r}`).join("")}`,
    ``,
    `Available techniques:`,
  ];
  for (const t of lib.techniques) {
    const examples = t.zevo_tr
      .map((e) =>
        typeof e === "string"
          ? `      • "${e}"`
          : `      • [pivot] "${e.opener}" → "${e.bridge}" → "${e.pivot}"`
      )
      .join("\n");
    lines.push(
      `  - **${t.id}** (${t.name}): ${t.why}\n    Şablon: ${t.template}\n    Zevo TR örnekleri:\n${examples}`
    );
  }
  lines.push(
    ``,
    `Diversify hook techniques across concepts — do NOT use the same technique twice. Use the examples ONLY as style reference; write fresh lines, never copy verbatim.`
  );
  return lines.join("\n");
}
