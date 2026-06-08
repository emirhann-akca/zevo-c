import { config } from "dotenv";
import { generateVeoClip } from "../src/pipeline/veo.ts";

config();

const prompt = process.argv[2];
const out = process.argv[3] || "veo-out.mp4";
if (!prompt) {
  console.error("usage: tsx scripts/veo-once.ts \"<prompt>\" <outPath>");
  process.exit(1);
}

const r = await generateVeoClip({
  prompt,
  outPath: out,
  aspectRatio: "9:16",
  negativePrompt: "text, captions, on-screen text, watermark, logo, distorted hands, extra fingers, blurry",
});
console.log(r ? `DONE → ${r}` : "FAILED");
process.exit(r ? 0 : 1);
