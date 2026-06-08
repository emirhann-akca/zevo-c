/**
 * Veo 3 video generation via Vertex AI (same project + service-account creds as the Gemini
 * calls in llm.ts — no separate API key needed). Generates a single ~8s 9:16 clip from a text
 * prompt, polls the long-running operation, and writes the resulting mp4 to disk.
 *
 * This is the "generative video" upgrade: instead of searching Pexels for an approximate stock
 * clip, we generate a bespoke shot that matches the script exactly. Used for HERO shots only
 * (e.g. the AI live-form-correction moment stock can never show) to keep credit cost contained.
 *
 * Vertex Veo REST API (async):
 *   POST .../publishers/google/models/{model}:predictLongRunning   → { name: operationName }
 *   POST .../publishers/google/models/{model}:fetchPredictOperation → poll until { done: true }
 * Result video is returned inline as base64 (bytesBase64Encoded) or as a GCS uri.
 */
import { writeFile } from "node:fs/promises";
import { GoogleAuth } from "google-auth-library";

// veo-3.0-fast-generate-001 = cheaper/faster (good for tests); veo-3.0-generate-001 = top quality.
// Override with VEO_MODEL. Veo 3 clips are fixed at 8s.
const DEFAULT_VEO_MODEL = process.env.VEO_MODEL || "veo-3.0-fast-generate-001";

let _auth: GoogleAuth | null = null;
function getAuth(): GoogleAuth {
  if (_auth) return _auth;
  _auth = new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/cloud-platform"] });
  return _auth;
}

async function authedFetch(url: string, body: unknown): Promise<any> {
  const client = await getAuth().getClient();
  const token = (await client.getAccessToken()).token;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Veo ${res.status}: ${text.slice(0, 500)}`);
  }
  return JSON.parse(text);
}

export interface VeoOptions {
  prompt: string;
  outPath: string;
  /** "9:16" (default, vertical ad) or "16:9". */
  aspectRatio?: "9:16" | "16:9";
  /** Negative prompt to steer away from unwanted content (text, watermark, etc.). */
  negativePrompt?: string;
  model?: string;
  /** Max seconds to wait for the LRO before giving up. */
  timeoutSec?: number;
  /** Generate audio (Veo 3 supports native audio). Default false for a clean music-bed mix. */
  generateAudio?: boolean;
}

/**
 * Generates one Veo clip and writes it to opts.outPath. Returns the path on success, or null
 * on failure (so the pipeline can gracefully fall back to stock).
 */
export async function generateVeoClip(opts: VeoOptions): Promise<string | null> {
  const project = process.env.VERTEX_PROJECT_ID;
  const location = process.env.VERTEX_AI_LOCATION || "us-central1";
  if (!project) {
    console.warn("[veo] VERTEX_PROJECT_ID not set — skipping Veo generation");
    return null;
  }
  const model = opts.model || DEFAULT_VEO_MODEL;
  const base = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${model}`;

  try {
    console.log(`[veo] generating (${model}, ${opts.aspectRatio ?? "9:16"}): "${opts.prompt.slice(0, 80)}..."`);
    const start = await authedFetch(`${base}:predictLongRunning`, {
      instances: [{ prompt: opts.prompt }],
      parameters: {
        aspectRatio: opts.aspectRatio ?? "9:16",
        sampleCount: 1,
        durationSeconds: 8,
        generateAudio: opts.generateAudio ?? false,
        ...(opts.negativePrompt ? { negativePrompt: opts.negativePrompt } : {}),
      },
    });
    const operationName: string | undefined = start?.name;
    if (!operationName) {
      console.warn("[veo] no operation name returned:", JSON.stringify(start).slice(0, 200));
      return null;
    }

    // Poll the LRO. Veo 3 typically takes 1-3 minutes.
    const timeoutMs = (opts.timeoutSec ?? 300) * 1000;
    const begin = Date.now();
    let pollCount = 0;
    while (Date.now() - begin < timeoutMs) {
      await new Promise((r) => setTimeout(r, 10_000));
      pollCount++;
      const op = await authedFetch(`${base}:fetchPredictOperation`, { operationName });
      if (op?.done) {
        if (op.error) {
          console.warn("[veo] operation failed:", JSON.stringify(op.error).slice(0, 300));
          return null;
        }
        // Result shape: response.videos[0].bytesBase64Encoded  OR  response.videos[0].gcsUri
        const videos =
          op.response?.videos ?? op.response?.generatedSamples ?? op.response?.predictions ?? [];
        const v = videos[0];
        const b64 = v?.bytesBase64Encoded ?? v?.video?.bytesBase64Encoded;
        if (b64) {
          await writeFile(opts.outPath, Buffer.from(b64, "base64"));
          console.log(`[veo] ✓ wrote ${opts.outPath} (after ${pollCount} polls, ${Math.round((Date.now() - begin) / 1000)}s)`);
          return opts.outPath;
        }
        const gcsUri = v?.gcsUri ?? v?.video?.gcsUri;
        if (gcsUri) {
          console.warn(`[veo] result is in GCS (${gcsUri}) — inline download not implemented; set storageUri handling`);
          return null;
        }
        console.warn("[veo] operation done but no video payload:", JSON.stringify(op.response).slice(0, 300));
        return null;
      }
      console.log(`[veo]   polling… (${Math.round((Date.now() - begin) / 1000)}s)`);
    }
    console.warn(`[veo] timed out after ${opts.timeoutSec ?? 300}s`);
    return null;
  } catch (err) {
    console.warn("[veo] error:", (err as Error).message);
    return null;
  }
}

// Standalone test:  npx tsx src/pipeline/veo.ts "your prompt here" out.mp4
if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}`) {
  const { config } = await import("dotenv");
  config();
  const prompt =
    process.argv[2] ||
    "Vertical 9:16 cinematic shot: a person doing a barbell squat in a modern gym, a smartphone on a tripod shows a live AI skeleton overlay tracking their form, emerald-green motion lines highlighting joints, shallow depth of field, dramatic side lighting, realistic, no text, no watermark";
  const out = process.argv[3] || "veo-test.mp4";
  const r = await generateVeoClip({
    prompt,
    outPath: out,
    aspectRatio: "9:16",
    negativePrompt: "text, captions, watermark, logo, distorted hands, blurry",
  });
  console.log(r ? `DONE → ${r}` : "FAILED");
  process.exit(r ? 0 : 1);
}
