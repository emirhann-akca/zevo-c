import { readFile, writeFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { ZEVO_BRAND } from "../brand.ts";
import { generate } from "../llm.ts";
import { loadBrandAssets, type BrandAsset } from "./brand-assets.ts";
import { AdConceptSchema, type AdAnalysis, type AdConcept } from "../types.ts";
import { loadLessons, loadTopPerformers, loadWorstPerformers, buildMemoryPromptSection } from "./memory.ts";

// Active tip taxonomy. Core modes: shared template / free creative / minimalist no-UI,
// plus the retained narrative modes `kurucu` (founder story) and `beslenme` (nutrition hero).
// Truly-removed legacy types (form-check, antrenman, basari) still PARSE for back-compat and
// map to the closest current mode (`klasik`).
export type ConceptType = "zevo-template" | "klasik" | "motivasyon" | "kurucu" | "beslenme";
export type ConceptTypeLegacy = ConceptType | "form-check" | "antrenman" | "basari";
function normalizeType(t: ConceptTypeLegacy | string | undefined): ConceptType {
  if (t === "zevo-template" || t === "klasik" || t === "motivasyon" || t === "kurucu" || t === "beslenme") return t;
  // form-check, antrenman, basari, anything else → klasik (most flexible)
  return "klasik";
}

const BASE_SYSTEM_PROMPT = `You are the lead creative director at Zevo, designing short-form vertical video ads (Reels/TikTok, 9:16, 15-30s) for Zevo, an AI-powered sports & fitness assistant app. You synthesize competitor analyses into NEW, original concepts — never copying, always borrowing structural patterns and applying them to Zevo's brand voice and unique features.

Brand rules you NEVER violate:
- Tone: ${ZEVO_BRAND.voice.tone}
- Primary color: ${ZEVO_BRAND.visual.primaryColor} (emerald), background ${ZEVO_BRAND.visual.backgroundColor} (dark navy)
- CTA: "${ZEVO_BRAND.cta.tr}" (TR) / "${ZEVO_BRAND.cta.en}" (EN), always shown in the final 2 seconds
- TR and EN scripts must be culturally adapted, NOT word-for-word translations
- Visuals should feel UGC-friendly (handheld vertical, real athletes) rather than over-polished corporate
- Lean into Zevo's differentiators: AI form check, personalized programs, competitive leagues, nutrition planning
- IMPORTANT: write 'visual' fields in English using simple 2-5 word descriptions (e.g. "young runner morning park", "smartphone fitness app workout") — they become Pexels stock-footage search queries

**NARRATIVE QUALITY — critical for TR audience (most common complaint: ads feel "cırt", jerky, with gaps):**
- Each shot's voiceover MUST flow naturally into the next. Read aloud: if there's an awkward jump between shots, rewrite.
- Avoid one-liners that "drop" without setup. Build → tension → release.
- Use micro-connectors between sentences: "Çünkü...", "Bu yüzden...", "Şimdi...", "Ve...", "Artık..." — these are the glue.
- Don't pack a new idea into every shot. Two related shots that develop ONE idea > five shots each pushing a different idea.
- Voiceover per shot should be 5-12 words in TR. Longer than 12 → split. Shorter than 5 → feels rushed/jerky.
- Open with a HOOK that earns the next 3 seconds (a question, a contradiction, a "wait, what?" moment). Don't open with the feature.
- End with payoff, not a generic CTA — the brand name + final hook line, the CTA appears in the outro card automatically.
- Each shot should have a PURPOSE in the arc: hook → problem → escalation → solution → proof → brand.

**RHYTHM RULES:**
- Total ad duration: aim 18-25 seconds (NOT shorter — TR ads need breathing room, faster than that feels like a cut-up reel).
- Average shot length: 3-4 seconds. NEVER below 2 seconds.
- The last story shot before the outro should be the EMOTIONAL PEAK, not a filler.

**HOOK SHOT (shot 0) — MUST be a cinematic Pexels-friendly visual, NOT a product UI screen:**
- The first shot is the THUMB-STOP — viewers decide in 0.5 seconds whether to keep watching.
- Use atmospheric stock footage: "athlete sprinting morning", "weights crashing floor", "sweat dripping closeup", "tense face workout", "running shoes lacing", "city sunrise rooftop run", "barbell drop", "boxing glove punch", etc.
- DO NOT put a Zevo app screenshot/UI video as shot 0 — that feels like a product demo, not an ad. UI footage belongs in shots 1+ once the viewer is hooked.
- The hook visual should match the emotional tone of the voiceover hook line.`;

const KLASIK_PROMPT = BASE_SYSTEM_PROMPT + `

**This is a KLASIK (classic) ad — Problem → Agitation → Solution → Proof structure:**
- Shot 0: cinematic Pexels hook (NO UI)
- Shots 1-2: relate the problem (UI can appear here showing the issue, e.g. user training without guidance)
- Shots 3-4: Zevo as the solution (UI shines here — AI form check, personalized plan, perfect form)
- Last story shot: emotional peak / transformation (Pexels celebration / GPS art reveal / brand asset combo)`;

// (Legacy tip-specific prompts — form-check, antrenman, beslenme, basari — were removed when
// the tip taxonomy was collapsed to {zevo-template, klasik, motivasyon}. The behavior they
// enforced is now achievable by writing a tighter brief in the user prompt under "klasik".)

// ZEVO TEMPLATE — locked 5-shot structure. The LLM only writes voiceover lines + the
// onScreenText. Shot visuals are FIXED to specific category buckets so every ad has the
// same proven flow. List of brand asset IDs per bucket is built dynamically from the
// manifest at call time and injected into the prompt.
function buildZevoTemplatePrompt(buckets: { sorular: string[]; hareketler: string[]; araya: string[] }): string {
  return BASE_SYSTEM_PROMPT + `

**ZEVO TEMPLATE MODE — locked 5-shot structure. You write ONLY voiceover lines + onScreenText. The shot 'visual' field MUST come from the prescribed buckets below, no improvisation.**

The locked shotlist for EVERY concept you generate:

- **Shot 0 (0-3s) — Pexels HOOK:** visual = a cinematic 3-5 word Pexels search query (NO UI). Examples: "athlete frustrated mirror gym", "runner dawn city street", "weights crashing slow motion". The query should set up the problem/curiosity the ad addresses.
- **Shot 1 (3-6s) — SORULAR (onboarding questions):** visual MUST be EXACTLY ONE of these brand asset IDs: [${buckets.sorular.join(" | ")}]. Pick the one whose content best matches what the voiceover at this moment will say (the app asking personalization questions).
- **Shot 2 (6-10s) — HAREKETLER (AI form check, HERO):** visual MUST be EXACTLY ONE of these IDs: [${buckets.hareketler.join(" | ")}]. This is the centerpiece. The voiceover here should explain the core differentiator: AI tracks every rep with real-time form scoring.
- **Shot 3 (10-13s) — ARAYA (in-app, optional payoff UI):** visual MUST be EXACTLY ONE of these IDs: [${buckets.araya.join(" | ")}]. Voiceover explains the workout-plan / day-by-day program output.
- **Shot 4 (13-17s) — Pexels PAYOFF:** visual = a 3-5 word Pexels query depicting the emotional climax. Examples: "athlete celebrating victory gym", "runner finish line arms raised", "confident man strong pose". MUST be a triumphant peak energy moment.

(The outro logo-reveal video is appended automatically after shot 4 — do NOT include it in the shotlist.)

Rules:
- Output EXACTLY 5 shots — no more, no less.
- Shots 1, 2, 3 visual MUST be a brand asset ID copied EXACTLY (lowercase, with hyphens) from the lists above. Any other value is invalid.
- Shots 0 and 4 visual MUST be a generic Pexels query (NO UI mention, NO competitor brands, NO color names like "red"/"orange").
- Voiceover lines must FLOW as a single coherent script across the 5 shots — total 12-15 Turkish words combined, easy to read at TTS rate +25%.
- onScreenText for shots 1-3 can echo a key word (max 3 words). For shots 0 and 4, leave onScreenText empty.
- Each voiceover line should land in ~2-3 seconds of speech (avoid stuffing a long sentence into a 3s shot).`;
}

const MOTIVASYON_PROMPT = BASE_SYSTEM_PROMPT + `

**This is a MOTIVASYON (lifestyle / energy) ad — saf duygu. Ürün arka planda, hayat önde. Angle: "spor bir uygulama değil, bir kimlik. Zevo o kimliği destekler".**

- Audience: aspirational; ürünü görmeye değil, "ben de o ekibe ait olabilir miyim" hissetmeye gelmiş kullanıcı.
- Story arc:
  - Shot 0: Pexels HOOK — güçlü silüet, gün doğumu, ter, ritim. Sinematik, NO UI.
  - Shots 1-3: Sürekli Pexels lifestyle — koşu, ağırlık, ter, müzik kulaklığı. UI ASLA YOK.
  - Shot 4 (KISA, 1.5s max): tek bir minimal Zevo asset — logo reveal NEXT veya sadece kısa bir 'lifestyle' brand-asset flash. UI değil, brand imzası.
  - Last shot: kişi başarılı, kameraya bakar veya yola devam → outro
- App UI footage: lifestyle ONLY + outro. ai-form-check / workout-plan / nutrition / onboarding YASAK. Reklam Nike/Adidas tarzı — ürün açıkça gösterilmez, aidiyet hissi yaratılır.
- Tone: minimum kelime, maksimum görsel. Voiceover 6-8 kelime toplam. "Sıradan değil. Zevo." gibi.`;

const KURUCU_PROMPT = BASE_SYSTEM_PROMPT + `

**This is a KURUCU (founder story) ad — first-person, raw, builds trust through story not features:**
- This ad is narrated in FIRST PERSON ("Biz", "Ben") by the founders. Tone is HONEST, PERSONAL, slightly vulnerable — NOT salesy.
- Zevo was founded by three young Turkish founders: **Emirhan Boran Akça** (kurucu + AI/yazılım), **Hasan Sefa Karakoyunlu** (tasarım + ürün), **Hasan Server Kamber** (pazarlama + büyüme). They are friends, early 20s, building from Sakarya / Türkiye.
- Origin narrative: They saw friends (and themselves) injuring themselves training alone — wrong form, no feedback, generic YouTube programs that didn't fit them. Personal trainers were expensive, gym coaches inattentive. "Antrenörün cebinde olsa" fikri buradan doğdu.
- The story arc:
  - Shot 0: CINEMATIC Pexels hook — a young person training alone, frustrated/exhausted (NOT UI). Sets the emotional stakes.
  - Shots 1-2: Founders' realization in first person (use UI sparingly here — a quick onboarding screen showing how personal Zevo gets)
  - Shots 3-4: "İşte bu yüzden Zevo'yu kurduk" → show what they built (AI form check, personalized plan)
  - Last story shot: human element — happy user / runner / GPS reveal — Zevo's promise delivered
- Voiceover tone: warm, slightly imperfect, like someone telling a friend over coffee. Avoid corporate copy.
- DO NOT say "Zevo is the best AI fitness app" — that's marketing speak. Say "Biz de senin gibi spor yaparken sakatlandık. Bu yüzden Zevo'yu kurduk."`;

const BESLENME_PROMPT = BASE_SYSTEM_PROMPT + `

**This is a BESLENME (nutrition) ad — Zevo's AI nutrition planning is the HERO. The workout/form features are not the focus here.**

- The product story is: Zevo asks you a few personal questions (sakatlık, sağlık sorunları, yaş, hedef) → builds you a daily calorie + meal plan personalized to YOUR body and goals → you track it on the dashboard.
- The viewer's emotional journey: "Zayıf kalmaya çalışıyorum / kas yapmaya çalışıyorum ama beslenme planı hiç tutmuyor" → "Genel diyet planları işe yaramıyor, hepsi aynı" → "Aaa Zevo bana sakatlığımı, sağlık sorunlarımı sorup planı kişiselleştiriyormuş" → "Günlük kalori hedefim, yediklerim, eksiklerim — hepsi tek ekranda" → "Bu sefer tutuyor."

**VISUAL CONSTRAINTS — strictly enforced:**
- App UI footage is RESTRICTED to nutrition + onboarding-questions ONLY:
  - 'nutrition-dashboard' (daily calorie target + meal plan)
  - 'onboarding-health', 'onboarding-injury', 'onboarding-age' (the personalization questions)
  - NO ai-form-check, NO workout-screens, NO logo until outro.
- MOST shots (at least 60%) must be Pexels cinematic stock — food, eating, healthy meals, kitchen cooking, gym-related body shots, scale weighing, frustration eating, person enjoying meal, etc.
- The hero UI moment (shot ~3 or 4) is when nutrition-dashboard appears — this is the "Aaa Zevo bunu da yapıyor" payoff. Keep it ONE shot, not multiple, to maximize impact.

**SHOT TEMPLATE (use as STARTING POINT, vary as needed):**
- Shot 0 (3s): Pexels HOOK — frustration with food/diet (e.g., "tired person eating sad meal", "fast food guilt", "scale frustration", "boring meal prep")
- Shot 1-2 (6-8s): Problem build (Pexels OR onboarding question — "shu kadar diyet denedim ama..." / shows Zevo asking about user's body)
- Shot 3 (3-4s): HERO REVEAL — nutrition-dashboard UI showing personalized plan
- Shot 4-5 (6-8s): Pexels payoff — happy person eating, energy, transformation, healthier moments
- Shot 6 (2-3s): brand close (text on dark navy, voice = brand)

**TONE RULES (Turkish nutrition audience):**
- Use foods Turkish viewers know: tavuk göğsü, yoğurt, mercimek çorbası, kahvaltı menemen, fıstık ezmesi vs.
- DON'T say "diet" — say "beslenme planı". Don't say "kilo ver" — say "hedefine ulaş". Don't moralize.
- Voice should sound like a friend who finally found something that works — relief and slight surprise, not "buy this".`;

function getSystemPrompt(typeRaw: ConceptType | string, brandAssets: BrandAsset[] = []): string {
  const type = normalizeType(typeRaw);
  if (type === "zevo-template") {
    const sorular = brandAssets.filter((a) => a.feature === "onboarding").map((a) => a.id);
    const hareketler = brandAssets.filter((a) => a.feature === "ai-form-check").map((a) => a.id);
    const araya = brandAssets.filter((a) => a.feature === "workout-plan" || a.feature === "nutrition").map((a) => a.id);
    return buildZevoTemplatePrompt({ sorular, hareketler, araya });
  }
  switch (type) {
    case "motivasyon":
      return MOTIVASYON_PROMPT;
    case "kurucu":
      return KURUCU_PROMPT;
    case "beslenme":
      return BESLENME_PROMPT;
    case "klasik":
    default:
      return KLASIK_PROMPT;
  }
}

function buildUserPrompt(analyses: AdAnalysis[], brandAssets: BrandAsset[], count: number, memorySection: string = "", targetDuration: number = 20): string {
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
    memorySection,
    ``,
    `Generate ${count} ORIGINAL ad concepts for Zevo. Diversify across hook types — do not produce ${count} variants of the same concept.`,
    ``,
    `**TARGET DURATION:** ~${targetDuration} seconds total per concept (acceptable range: ${Math.max(8, targetDuration - 5)}-${targetDuration + 5}s). The 'durationSec' field MUST be close to ${targetDuration}, and the shotlist's last shot 'seconds' end MUST land near ${targetDuration}. Pace the shots accordingly — for shorter ads (≤15s), use 3-4 fast shots; for longer (20-30s), 5-7 shots with breathing room.`,
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
  type?: ConceptType;
  targetDuration?: number;
}): Promise<AdConcept[]> {
  // Fallback: if this run's analyses.json doesn't exist (because Discover/Analyze were skipped
  // on a fresh date dir), reuse the most recent analyses.json found anywhere under output/.
  // Competitor ad landscape doesn't change daily — weeks-old analyses are fine to recycle.
  let resolvedAnalysesPath = opts.analysesFile;
  if (!existsSync(resolvedAnalysesPath)) {
    // opts.outputDir is .../output/<date>; we want .../output (siblings = date folders)
    const outputRoot = dirname(opts.outputDir);
    const candidates: { path: string; mtime: number }[] = [];
    if (existsSync(outputRoot)) {
      const subs = await readdir(outputRoot).catch(() => []);
      for (const sub of subs) {
        const p = join(outputRoot, sub, "analyses.json");
        if (existsSync(p)) {
          const s = await stat(p).catch(() => null);
          if (s) candidates.push({ path: p, mtime: s.mtimeMs });
        }
      }
    }
    candidates.sort((a, b) => b.mtime - a.mtime);
    if (candidates.length === 0) {
      throw new Error(`No analyses.json found in ${opts.outputDir} or anywhere under ${outputRoot}. Run Discover+Analyze first, or copy an existing analyses.json into the date dir.`);
    }
    resolvedAnalysesPath = candidates[0].path;
    console.log(`[concept] analyses.json missing in current dir, reusing latest: ${resolvedAnalysesPath}`);
  }
  const analyses = JSON.parse(await readFile(resolvedAnalysesPath, "utf8")) as AdAnalysis[];
  const count = opts.count ?? 5;
  const type = opts.type ?? "klasik";
  const brandAssetsDir = opts.brandAssetsDir ?? join(process.cwd(), "brand-assets");
  const brandAssets = await loadBrandAssets(brandAssetsDir, type);

  const [lessons, topPerformers, worstPerformers] = await Promise.all([
    loadLessons(),
    loadTopPerformers(),
    loadWorstPerformers(),
  ]);
  const memorySection = buildMemoryPromptSection(lessons, topPerformers, worstPerformers);
  if (lessons.length > 0 || topPerformers.length > 0 || worstPerformers.length > 0) {
    console.log(`[concept] memory loaded: ${lessons.length} lessons, ${topPerformers.length} top, ${worstPerformers.length} worst performers`);
  }

  const targetDuration = opts.targetDuration ?? 20;
  const text = await generate({
    system: getSystemPrompt(type, brandAssets),
    user: buildUserPrompt(analyses, brandAssets, count, memorySection, targetDuration),
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
