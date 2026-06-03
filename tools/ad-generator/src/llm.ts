/**
 * Vertex AI wrapper — mirrors the auth pattern used by lib/ai/vertex-ai-web.service.ts
 * in the main zevo-site app, so a single set of GCP credentials drives both.
 */
import { VertexAI, HarmCategory, HarmBlockThreshold } from "@google-cloud/vertexai";

const HEAVY_MODEL = process.env.VERTEX_MODEL_HEAVY || "gemini-2.5-pro";
const FAST_MODEL = process.env.VERTEX_MODEL_FAST || "gemini-2.5-flash";

let _vertex: VertexAI | null = null;

function getVertex(): VertexAI {
  if (_vertex) return _vertex;
  const project = process.env.VERTEX_PROJECT_ID;
  const location = process.env.VERTEX_AI_LOCATION || "us-central1";
  if (!project) {
    throw new Error(
      "VERTEX_PROJECT_ID is required. Set it in .env (and either GOOGLE_APPLICATION_CREDENTIALS=path/to/sa.json for local, or GOOGLE_CLOUD_CREDENTIALS=<json> for cloud)."
    );
  }
  if (process.env.GOOGLE_CLOUD_CREDENTIALS) {
    _vertex = new VertexAI({
      project,
      location,
      googleAuthOptions: { credentials: JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS) },
    });
  } else {
    _vertex = new VertexAI({ project, location });
  }
  return _vertex;
}

// Exponential-backoff retry for Vertex AI 429 (quota exceeded) and transient 5xx errors.
// Most concept/asset/QC calls hit Vertex in rapid bursts which triggers rate limiting; a
// 4-attempt backoff (1s, 2s, 4s, 8s) usually rides through the throttle window.
async function withRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      const retriable = /429|RESOURCE_EXHAUSTED|503|UNAVAILABLE|ECONNRESET|ETIMEDOUT/i.test(msg);
      if (!retriable || attempt === 3) throw err;
      const waitMs = 1000 * Math.pow(2, attempt);
      console.warn(`[llm:${label}] ${msg.slice(0, 80)} — retrying in ${waitMs}ms (attempt ${attempt + 1}/4)`);
      await new Promise((r) => setTimeout(r, waitMs));
      lastErr = err;
    }
  }
  throw lastErr;
}

const SAFETY = [
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

export interface GenerateOptions {
  system: string;
  user: string;
  model?: "heavy" | "fast";
  maxOutputTokens?: number;
  temperature?: number;
}

export async function generate(opts: GenerateOptions): Promise<string> {
  const modelName = opts.model === "fast" ? FAST_MODEL : HEAVY_MODEL;
  const model = getVertex().getGenerativeModel({
    model: modelName,
    systemInstruction: { role: "system", parts: [{ text: opts.system }] },
    generationConfig: {
      temperature: opts.temperature ?? 0.7,
      topP: 0.95,
      // Gemini 2.5 uses internal "thinking" tokens; bump default so visible output isn't truncated.
      maxOutputTokens: opts.maxOutputTokens ?? 8192,
    },
    safetySettings: SAFETY,
  });

  const result = await withRetry("generate", () => model.generateContent({
    contents: [{ role: "user", parts: [{ text: opts.user }] }],
  }));
  const candidates = result.response.candidates ?? [];
  const text = candidates[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text) throw new Error("Vertex AI returned empty response");
  return text;
}

export interface VisionPickOptions {
  system: string;
  user: string;
  imageUrls: string[];
  maxOutputTokens?: number;
}

/**
 * Multimodal: send image URLs to Gemini and ask it to pick / describe.
 * Used to choose the best stock-footage thumbnail per shot.
 */
export async function generateWithImages(opts: VisionPickOptions): Promise<string> {
  const model = getVertex().getGenerativeModel({
    model: FAST_MODEL,
    systemInstruction: { role: "system", parts: [{ text: opts.system }] },
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: opts.maxOutputTokens ?? 256,
    },
    safetySettings: SAFETY,
  });

  // Fetch each image to base64 (Vertex needs inline data; URLs work only with fileData/GCS).
  const parts: any[] = [{ text: opts.user }];
  for (let i = 0; i < opts.imageUrls.length; i++) {
    const url = opts.imageUrls[i];
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      const mime = res.headers.get("content-type") || "image/jpeg";
      parts.push({ text: `\nImage ${i}:` });
      parts.push({ inlineData: { mimeType: mime, data: buf.toString("base64") } });
    } catch {
      // skip
    }
  }

  const result = await withRetry("vision", () => model.generateContent({ contents: [{ role: "user", parts }] }));
  const candidates = result.response.candidates ?? [];
  const text = candidates[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  return text;
}

export interface VisionLocalOptions {
  system: string;
  user: string;
  imagePaths: string[];
  model?: "heavy" | "fast";
  maxOutputTokens?: number;
  temperature?: number;
}

/**
 * Multimodal with LOCAL image files (read from disk → inline base64). Used by the QC stage
 * to feed sampled video frames into Gemini Vision for quality review.
 */
export async function generateWithLocalImages(opts: VisionLocalOptions): Promise<string> {
  const { readFile } = await import("node:fs/promises");
  const { extname } = await import("node:path");
  const modelName = opts.model === "fast" ? FAST_MODEL : HEAVY_MODEL;
  const model = getVertex().getGenerativeModel({
    model: modelName,
    systemInstruction: { role: "system", parts: [{ text: opts.system }] },
    generationConfig: {
      temperature: opts.temperature ?? 0.2,
      maxOutputTokens: opts.maxOutputTokens ?? 4096,
    },
    safetySettings: SAFETY,
  });

  const parts: any[] = [{ text: opts.user }];
  for (let i = 0; i < opts.imagePaths.length; i++) {
    const p = opts.imagePaths[i];
    const ext = extname(p).toLowerCase();
    const mime = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
    const buf = await readFile(p);
    parts.push({ text: `\nFrame ${i + 1}:` });
    parts.push({ inlineData: { mimeType: mime, data: buf.toString("base64") } });
  }

  const result = await withRetry("vision-local", () => model.generateContent({ contents: [{ role: "user", parts }] }));
  const candidates = result.response.candidates ?? [];
  const text = candidates[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text) throw new Error("Vertex AI returned empty response (vision)");
  return text;
}

export function isAvailable(): boolean {
  return !!process.env.VERTEX_PROJECT_ID;
}
