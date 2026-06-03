import { readFile } from "node:fs/promises";
import { VertexAI } from "@google-cloud/vertexai";
import { config } from "dotenv";
config();

const vertex = new VertexAI({
  project: process.env.VERTEX_PROJECT_ID,
  location: process.env.VERTEX_AI_LOCATION || "us-central1",
});
const model = vertex.getGenerativeModel({
  model: "gemini-2.5-pro",
  generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
});

// Load existing manifest as style reference (first 3 entries)
const existingManifest = JSON.parse(await readFile("brand-assets/manifest.json", "utf8"));
const examples = existingManifest.assets.slice(0, 3);

const videoPath = process.argv[2] ?? "brand-assets/videos/Video1.mp4";
const buf = await readFile(videoPath);
const mb = (buf.length / 1024 / 1024).toFixed(1);
console.log(`Analyzing ${videoPath} (${mb} MB)...`);

const systemPrompt = `You are cataloging real Zevo (AI fitness/sports app) brand footage for an ad pipeline. For each video, write a manifest entry that lets a downstream concept generator (Gemini) and asset picker decide when to use this clip in an ad shot.

The pipeline uses two top-level "feature" buckets that you MUST match exactly:
- "ai-form-check": real-time AR pose detection / form scoring on phone (squat, shoulder press, push-up, etc.)
- "workout-plan": structured day-by-day exercise list with timer, sets/reps, navigation
- "home-dashboard": main app screen, weekly calendar, navigation tabs
- "onboarding": signup/setup flow (goals, plan creation, splash)
- "progress-stats": charts, body metrics, streaks, performance over time
- "gps-running": koşu / outdoor running with map + route
- "nutrition": meal plans, calorie tracking, food logging
- "brand": logo reveals, brand magic, app showcases without specific feature
- "lifestyle": real athletes training, gym scenes, motion footage WITHOUT app UI

The narrative tag describes the STORY ROLE this clip can play in an ad:
- "problem-state": user struggling alone, no help, bad form, frustrated
- "feature-demo": app actively solving the problem
- "transformation-state": after using app, confident, succeeding
- "neutral-state": clean UI showcase without strong emotion
- "brand-magic": logo/intro/outro material
- "social-proof": multiple users, community, testimonials

Output ONLY a single JSON object matching the schema, no markdown fences:
{
  "id": "kebab-case-id",
  "type": "video",
  "path": "videos/<actual-filename>.mp4",
  "description": "Concrete visual description, max 60 words. Mention any visible text/numbers from the UI exactly (e.g. 'TEKRAR 0/12', 'Squat 0:48', 'Form 50'). Mention setting, clothes, camera feel.",
  "tags": ["3-7 short tags", "lowercase", "no underscores"],
  "feature": "<one of the feature buckets above>",
  "narrative": "<feature-bucket type> — short reason why this clip fits that narrative",
  "duration_hint_sec": <approximate length in seconds, decimal ok>,
  "suggested_rename": "kebab-case-id.mp4 — propose a NEW filename matching the id field"
}`;

const userPrompt = `Existing manifest entries (style + schema reference — DO NOT copy, just match the style):
${JSON.stringify(examples, null, 2)}

Now analyze the attached video and produce the JSON entry for it.`;

const result = await model.generateContent({
  contents: [{
    role: "user",
    parts: [
      { text: systemPrompt + "\n\n" + userPrompt },
      { inlineData: { mimeType: "video/mp4", data: buf.toString("base64") } },
    ],
  }],
});

const txt = result.response.candidates?.[0]?.content?.parts?.map(p => p.text).join("") ?? "";
console.log("\n=== RAW RESPONSE ===");
console.log(txt);

// Extract first balanced JSON object
const first = txt.indexOf("{");
let depth = 0, last = -1, inStr = false, esc = false;
for (let i = first; i < txt.length; i++) {
  const c = txt[i];
  if (esc) { esc = false; continue; }
  if (c === "\\") { esc = true; continue; }
  if (c === '"') { inStr = !inStr; continue; }
  if (inStr) continue;
  if (c === "{") depth++;
  else if (c === "}") { depth--; if (depth === 0) { last = i; break; } }
}
if (last > 0) {
  const obj = JSON.parse(txt.slice(first, last + 1));
  console.log("\n=== PARSED ENTRY ===");
  console.log(JSON.stringify(obj, null, 2));
}
