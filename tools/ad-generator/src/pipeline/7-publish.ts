import { readFile, writeFile, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { join } from "node:path";
import { PublishResultSchema, type AdConcept, type RenderedAd, type PublishResult } from "../types.ts";

const GRAPH_VERSION = "v21.0";
const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`;

interface MetaEnv {
  token: string;
  adAccountId: string; // act_xxxxx
  pageId: string;
  campaignId: string; // pre-existing campaign user created
  adSetId: string; // pre-existing ad set
  destinationUrl: string;
}

function readMetaEnv(): MetaEnv | null {
  const token = process.env.META_ACCESS_TOKEN;
  const adAccountId = process.env.META_AD_ACCOUNT_ID;
  const pageId = process.env.META_PAGE_ID;
  const campaignId = process.env.META_CAMPAIGN_ID;
  const adSetId = process.env.META_AD_SET_ID;
  const destinationUrl = process.env.META_DESTINATION_URL ?? "https://zevoapp.com";
  if (!token || !adAccountId || !pageId || !campaignId || !adSetId) return null;
  return { token, adAccountId, pageId, campaignId, adSetId, destinationUrl };
}

async function uploadVideo(env: MetaEnv, videoPath: string): Promise<string> {
  // Meta video upload uses multipart form to /act_xxx/advideos.
  // For files <100MB the simple upload works; larger files need chunked.
  const size = (await stat(videoPath)).size;
  if (size > 100 * 1024 * 1024) throw new Error(`video too large for simple upload: ${size} bytes`);

  const form = new FormData();
  form.append("access_token", env.token);
  const buf = await readFile(videoPath);
  form.append("source", new Blob([new Uint8Array(buf)], { type: "video/mp4" }), videoPath.split("/").pop()!);

  const res = await fetch(`${GRAPH}/${env.adAccountId}/advideos`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`advideos upload failed: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { id: string };
  return json.id;
}

async function createCreative(
  env: MetaEnv,
  videoId: string,
  concept: AdConcept,
  lang: "tr" | "en"
): Promise<string> {
  const message = concept.hookLine[lang];
  const linkData = {
    page_id: env.pageId,
    video_data: {
      video_id: videoId,
      message,
      call_to_action: { type: "LEARN_MORE", value: { link: env.destinationUrl } },
      title: message,
      link_description: concept.rationale.slice(0, 200),
    },
  };
  const body = new URLSearchParams({
    access_token: env.token,
    name: `Zevo · ${concept.id} · ${lang}`,
    object_story_spec: JSON.stringify(linkData),
  });
  const res = await fetch(`${GRAPH}/${env.adAccountId}/adcreatives`, { method: "POST", body });
  if (!res.ok) throw new Error(`adcreatives failed: ${res.status} ${await res.text()}`);
  return ((await res.json()) as { id: string }).id;
}

async function createAd(env: MetaEnv, creativeId: string, conceptId: string, lang: string): Promise<string> {
  const body = new URLSearchParams({
    access_token: env.token,
    name: `Zevo · ${conceptId} · ${lang}`,
    adset_id: env.adSetId,
    creative: JSON.stringify({ creative_id: creativeId }),
    status: "PAUSED", // SAFE DEFAULT — user flips to ACTIVE manually
  });
  const res = await fetch(`${GRAPH}/${env.adAccountId}/ads`, { method: "POST", body });
  if (!res.ok) throw new Error(`ad create failed: ${res.status} ${await res.text()}`);
  return ((await res.json()) as { id: string }).id;
}

export interface PublishOptions {
  rendersFile: string;
  conceptsFile: string;
  outputDir: string;
  dryRun?: boolean;
}

export async function publishToMeta(opts: PublishOptions): Promise<PublishResult[]> {
  const renders = JSON.parse(await readFile(opts.rendersFile, "utf8")) as RenderedAd[];
  const concepts = JSON.parse(await readFile(opts.conceptsFile, "utf8")) as AdConcept[];
  const conceptMap = new Map(concepts.map((c) => [c.id, c]));

  const env = readMetaEnv();
  const isDryRun = opts.dryRun ?? !env;
  if (isDryRun) {
    console.log(
      env
        ? "[publish] --dry-run flag set, skipping actual upload"
        : "[publish] Meta env not configured (META_ACCESS_TOKEN, META_AD_ACCOUNT_ID, META_PAGE_ID, META_CAMPAIGN_ID, META_AD_SET_ID) — dry-run mode"
    );
  }

  const results: PublishResult[] = [];

  for (const rendered of renders) {
    const concept = conceptMap.get(rendered.conceptId);
    if (!concept) continue;
    const now = new Date().toISOString();

    if (isDryRun || !env) {
      results.push({
        conceptId: rendered.conceptId,
        lang: rendered.lang,
        status: "dry-run",
        uploadedAt: now,
        campaignId: env?.campaignId,
        adSetId: env?.adSetId,
      });
      console.log(`[publish] [dry-run] would upload ${rendered.conceptId} [${rendered.lang}]`);
      continue;
    }

    try {
      console.log(`[publish] uploading ${rendered.conceptId} [${rendered.lang}]...`);
      const videoId = await uploadVideo(env, rendered.videoPath);
      const creativeId = await createCreative(env, videoId, concept, rendered.lang);
      const adId = await createAd(env, creativeId, concept.id, rendered.lang);
      results.push({
        conceptId: rendered.conceptId,
        lang: rendered.lang,
        status: "uploaded",
        metaVideoId: videoId,
        metaCreativeId: creativeId,
        metaAdId: adId,
        campaignId: env.campaignId,
        adSetId: env.adSetId,
        uploadedAt: now,
      });
      console.log(`[publish] ✓ ad ${adId} (PAUSED) — flip to ACTIVE in Ads Manager when ready`);
    } catch (err) {
      results.push({
        conceptId: rendered.conceptId,
        lang: rendered.lang,
        status: "error",
        error: (err as Error).message,
        uploadedAt: now,
      });
      console.warn(`[publish] failed:`, (err as Error).message);
    }
  }

  const outPath = join(opts.outputDir, "publish-results.json");
  await writeFile(outPath, JSON.stringify(results, null, 2), "utf8");
  console.log(`[publish] results → ${outPath}`);
  return results;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { config } = await import("dotenv");
  config();
  const stamp = new Date().toISOString().slice(0, 10);
  const dir = join(process.cwd(), "output", stamp);
  await publishToMeta({
    rendersFile: join(dir, "renders.json"),
    conceptsFile: join(dir, "concepts.json"),
    outputDir: dir,
    dryRun: process.env.DRY_RUN === "1",
  });
}
