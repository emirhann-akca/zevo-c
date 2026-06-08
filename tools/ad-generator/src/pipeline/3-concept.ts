import { readFile, writeFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { ZEVO_BRAND } from "../brand.ts";
import { generate } from "../llm.ts";
import { loadBrandAssets, type BrandAsset } from "./brand-assets.ts";
import { AdConceptSchema, type AdAnalysis, type AdConcept } from "../types.ts";
import { loadLessons, loadTopPerformers, loadWorstPerformers, buildMemoryPromptSection } from "./memory.ts";
import { loadHookLibrary, buildHookPromptSection } from "./hooks.ts";
import { loadMarketInsights, buildMarketInsightsPromptSection } from "./market-insights.ts";

// Active tip taxonomy. Core modes: shared template / free creative / minimalist no-UI,
// plus the retained narrative modes `kurucu` (founder story) and `beslenme` (nutrition hero).
// Truly-removed legacy types (form-check, antrenman, basari) still PARSE for back-compat and
// map to the closest current mode (`klasik`).
export type ConceptType = "zevo-template" | "klasik" | "motivasyon" | "kurucu" | "beslenme" | "donusum" | "pattern-interrupt";
export type ConceptTypeLegacy = ConceptType | "form-check" | "antrenman" | "basari";
function normalizeType(t: ConceptTypeLegacy | string | undefined): ConceptType {
  if (t === "zevo-template" || t === "klasik" || t === "motivasyon" || t === "kurucu" || t === "beslenme" || t === "donusum" || t === "pattern-interrupt") return t;
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
- **EACH SHOT'S VOICEOVER MUST BE A COMPLETE, SELF-CONTAINED CLAUSE.** Every shot is voiced SEPARATELY (its own TTS clip with a tiny pause before/after), so a shot that ends mid-thought sounds broken.
- **HARD RULE — never START or END a shot's voiceover on a bare conjunction or postposition.** Forbidden as the FIRST or LAST word of any shot line: "ve", "ama", "fakat", "ancak", "çünkü", "ki", "ya da", "veya", "ile", "için", "de/da", "hem". (A connector like "çünkü"/"bu yüzden" is fine ONLY when it both opens AND the SAME line completes the full thought — e.g. "Çünkü herkese aynı program işe yaramaz." is OK; "...bir adıma dönüşüyor" then next shot "Zevo ile" is FORBIDDEN — the "Zevo ile" must finish its own clause or merge into the previous line.)
- Connectors belong INSIDE a clause to bind two parts of the SAME shot, not stranded at a shot boundary. Read each shot line alone: if it sounds unfinished or like a fragment, rewrite it into a full sentence.
- Don't pack a new idea into every shot. Two related shots that develop ONE idea > five shots each pushing a different idea.
- Voiceover per shot should be 5-12 words in TR, and each must end on a natural sentence-final word (verb/noun), never a linking word. Longer than 12 → split at a clause boundary, not mid-clause. Shorter than 5 → feels rushed/jerky.
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
- Voiceover lines must FLOW as a single coherent script across the 5 shots — total 12-15 Turkish words combined, easy to read at a natural TTS rate.
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

const DONUSUM_PROMPT = BASE_SYSTEM_PROMPT + `

**This is a DÖNÜŞÜM (before/after transformation) ad — the single most proven fitness format. The arc is literally ÖNCE (before) → DÖNÜM NOKTASI (turning point = Zevo) → SONRA (after). The emotional payoff is the contrast.**

Core idea: the viewer sees themselves in the "ÖNCE" — months of effort, no results, no feedback, about to quit. Zevo is the turning point that makes the "SONRA" finally happen. The transformation is EARNED through consistency + personalized feedback, NOT a magic-pill fake before/after.

**STRUCTURE (4-5 shots):**
- **Shot 0 — ÖNCE (the before, Pexels HOOK, NO UI):** a cinematic moment of struggle/stagnation. Examples: "tired man slumped gym bench", "woman frustrated mirror gym", "exhausted person sitting workout floor", "discouraged athlete catching breath". Mood: low energy, muted. onScreenText: "ÖNCE" (or empty). The voiceover hook names the pain: "Aylardır deniyorsun ama hiçbir şey değişmiyor."
- **Shot 1 — neden öyleydi (Pexels OR onboarding UI):** explain WHY before failed — no plan that fits you, no one correcting your form, generic programs. UI may appear (onboarding question) showing Zevo getting personal. Voiceover: "Çünkü herkese aynı program işe yaramaz."
- **Shot 2 — DÖNÜM NOKTASI (Zevo, HERO UI):** Zevo enters. Show the differentiator — AI form check (skeletal overlay + form score) OR the personalized plan. This is the "işte o an değişti" beat. Voiceover: "Sonra her tekrarını izleyen, formunu düzelten bir antrenör cebine girdi."
- **Shot 3-4 — SONRA (the after, Pexels PAYOFF, triumphant):** the transformation realized — confident, strong, consistent, energetic. Examples: "confident athlete strong pose gym", "runner finish line arms raised", "woman dancing victory workout", "fit man celebrating mirror". Mood: bright, high energy — the visual OPPOSITE of shot 0. onScreenText: "SONRA". Voiceover lands the payoff + brand.

**RULES:**
- The ÖNCE and SONRA shots must feel visually CONTRASTING (before = drained/static; after = vivid/triumphant). Pick Pexels queries that reflect this.
- You MAY use onScreenText "ÖNCE" on shot 0 and "SONRA" on the after shot for an explicit before/after frame (max 1-2 words). Other shots: echo a key word only.
- Honest transformation: the change came from CONSISTENCY that Zevo enabled (it fit them + corrected them), not from a 7-day miracle. Don't promise specific kilos or timelines.
- App UI (form-check, onboarding, nutrition, workout-plan) is ALLOWED in the turning-point/middle shots — Zevo IS the reason for the change, so showing the product is on-message here.
- Voiceover flows as ONE story across shots, TR 5-12 words each. Each shot line is a COMPLETE sentence — never end a shot on "ile/ve/ama/çünkü". The final SONRA shot must end on a finished payoff (e.g. "...artık her antrenman bir adıma dönüşüyor." NOT "...bir adıma dönüşüyor" then "Zevo ile").`;

const PATTERN_INTERRUPT_PROMPT = BASE_SYSTEM_PROMPT + `

**This is a PATTERN-INTERRUPT ad — the scroll-stopper format. You open on a topic that has NOTHING to do with fitness, hijack the viewer's attention, then PIVOT to Zevo with a believable bridge. The pivot is the payoff. This is high-risk/high-reward: it lives or dies on the BRIDGE being logical, not random.**

Core mechanic (the proven 3-beat structure):
1. **OPENER (shot 0, ~3s) — the unrelated hook:** open on something the viewer does NOT expect from a fitness ad — a car/servis analogy, a phone-battery panic, a GPS/navigation idea, a tech habit, an everyday frustration. Cinematic Pexels footage that matches the OPENER's literal topic (e.g. "car mechanic garage", "phone low battery screen closeup", "person lost driving night"), NOT a gym shot, NOT app UI. The voiceover states a confident, slightly absurd-but-true claim about that unrelated thing. onScreenText may echo the absurd claim (max ~4 words).
2. **BRIDGE (shot 1, ~3-4s) — the pivot sentence:** this is the MOST IMPORTANT line. Connect the unrelated opener to the viewer's own training in ONE logical/emotional sentence. The viewer should think "...oh, that's actually true about me." Visual can start transitioning toward fitness (Pexels person training, OR a quick onboarding UI). Example bridge: "Ama vücudunu hiç kontrol ettirmeden yıllarca zorluyorsun."
3. **REVEAL + PAYOFF (shots 2-4):** Zevo enters as the answer the bridge set up. Show the differentiator (AI form check / personalized plan / nutrition) — UI is fully on-message here. End on a confident payoff + brand. Last story shot = emotional/energy peak (Pexels triumph).

**RULES:**
- The OPENER must genuinely surprise — if a fitness viewer could predict it, it's not a pattern interrupt. But it must be relatable (everyone services a car / fears a dead battery / uses GPS).
- The BRIDGE must be airtight. If the analogy is a stretch, the concept fails — rewrite until the connection is obvious in hindsight.
- Do NOT mention Zevo or any fitness feature in shot 0. The whole point is the viewer doesn't see it coming.
- Shot 0 visual = a Pexels query about the OPENER's literal topic (NO UI, NO gym unless the opener is about a gym). Shots 2+ may use brand UI assets.
- Voiceover flows as ONE arc; TR 5-12 words per shot. Each shot line is a COMPLETE sentence and must never start OR end on a bare conjunction/postposition (ve/ama/çünkü/ile).
- Use the pattern-interrupt examples from the HOOK LIBRARY (opener → bridge → pivot) as style reference, but write fresh material.
- Set "hookType" to "pattern-interrupt".`;

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
    case "donusum":
      return DONUSUM_PROMPT;
    case "pattern-interrupt":
      return PATTERN_INTERRUPT_PROMPT;
    case "klasik":
    default:
      return KLASIK_PROMPT;
  }
}

function buildUserPrompt(analyses: AdAnalysis[], brandAssets: BrandAsset[], count: number, memorySection: string = "", targetDuration: number = 20, hookSection: string = "", marketSection: string = ""): string {
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
    hookSection,
    marketSection,
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
  const slice = raw.slice(start, end + 1);
  try {
    return JSON.parse(slice);
  } catch (err) {
    // Cheap repair pass: strip trailing commas before } or ] (the most common LLM JSON defect).
    const repaired = slice.replace(/,(\s*[}\]])/g, "$1");
    return JSON.parse(repaired);
  }
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
  const hookLib = await loadHookLibrary(process.cwd());
  const hookSection = hookLib ? buildHookPromptSection(hookLib) : "";
  if (hookLib) console.log(`[concept] hook library loaded: ${hookLib.techniques.length} techniques`);
  const marketInsights = await loadMarketInsights(process.cwd());
  const marketSection = marketInsights ? buildMarketInsightsPromptSection(marketInsights) : "";
  if (marketInsights) console.log(`[concept] market insights loaded: +${marketInsights.add.length} do, -${marketInsights.remove.length} avoid, ${marketInsights.benchmarks.length} targets`);
  const systemPrompt = getSystemPrompt(type, brandAssets);
  const userPrompt = buildUserPrompt(analyses, brandAssets, count, memorySection, targetDuration, hookSection, marketSection);

  // The heavy model occasionally emits malformed JSON (unescaped quotes inside Turkish
  // voiceover strings, truncation, etc.). LLM output is stochastic, so re-rolling almost
  // always yields valid JSON. Try up to 3 times; nudge temperature down each retry for
  // more deterministic formatting. Succeed as soon as we parse >=1 valid concept.
  const concepts: AdConcept[] = [];
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 3 && concepts.length === 0; attempt++) {
    try {
      const text = await generate({
        system: systemPrompt,
        user: userPrompt,
        model: "heavy",
        maxOutputTokens: 8192,
        temperature: attempt === 0 ? 0.85 : 0.5,
      });
      const arr = extractJsonArray(text);
      for (const item of arr) {
        const parsed = AdConceptSchema.safeParse(item);
        if (parsed.success) concepts.push(parsed.data);
        else console.warn("[concept] schema fail:", parsed.error.issues.slice(0, 3));
      }
      if (concepts.length === 0) {
        console.warn(`[concept] attempt ${attempt + 1}/3 produced 0 valid concepts — retrying`);
      }
    } catch (err) {
      lastErr = err;
      console.warn(`[concept] attempt ${attempt + 1}/3 failed to parse model output (${(err as Error).message.slice(0, 80)}) — retrying`);
    }
  }
  if (concepts.length === 0) {
    throw new Error(`Concept generation failed after 3 attempts: ${lastErr ? (lastErr as Error).message : "no valid concepts parsed"}`);
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
