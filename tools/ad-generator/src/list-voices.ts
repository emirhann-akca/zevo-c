/**
 * Lists available ElevenLabs voices with Turkish-language hints.
 * Usage: npx tsx src/list-voices.ts
 */
import { config } from "dotenv";
config();

const key = process.env.ELEVENLABS_API_KEY;
if (!key) {
  console.error("ELEVENLABS_API_KEY missing in .env");
  process.exit(1);
}

interface VoiceLabels {
  accent?: string;
  description?: string;
  age?: string;
  gender?: string;
  use_case?: string;
  language?: string;
}
interface Voice {
  voice_id: string;
  name: string;
  category: string;
  labels?: VoiceLabels;
  preview_url?: string;
  verified_languages?: { language: string; accent?: string }[];
  high_quality_base_model_ids?: string[];
}

const res = await fetch("https://api.elevenlabs.io/v2/voices?page_size=100", {
  headers: { "xi-api-key": key },
});
if (!res.ok) {
  console.error(`ElevenLabs ${res.status}: ${await res.text()}`);
  process.exit(1);
}
const data = (await res.json()) as { voices: Voice[] };

const rows: { id: string; name: string; tr: boolean; gender: string; accent: string; desc: string }[] = [];
for (const v of data.voices) {
  const langs = (v.verified_languages || []).map((l) => l.language?.toLowerCase()).filter(Boolean);
  const hasTr = langs.some((l) => l === "tr" || l === "turkish" || l?.startsWith("tr"));
  const labelLang = v.labels?.language?.toLowerCase();
  const isTrLabel = labelLang === "tr" || labelLang === "turkish";
  rows.push({
    id: v.voice_id,
    name: v.name,
    tr: hasTr || isTrLabel,
    gender: v.labels?.gender || "?",
    accent: v.labels?.accent || "",
    desc: v.labels?.description || v.labels?.use_case || "",
  });
}

rows.sort((a, b) => (a.tr === b.tr ? 0 : a.tr ? -1 : 1));

console.log("\nAvailable voices (Turkish-tagged first):\n");
console.log("TR | Name                 | Gender | Accent       | Voice ID                  | Description");
console.log("---|----------------------|--------|--------------|---------------------------|--------------");
for (const r of rows.slice(0, 40)) {
  const tag = r.tr ? "✓ " : "  ";
  console.log(
    `${tag} | ${r.name.padEnd(20)} | ${r.gender.padEnd(6)} | ${r.accent.padEnd(12)} | ${r.id.padEnd(25)} | ${r.desc}`
  );
}

const trVoices = rows.filter((r) => r.tr);
console.log(`\nFound ${trVoices.length} Turkish-tagged voices.`);
if (trVoices.length > 0) {
  console.log(`\nSuggested .env line:\n  ELEVENLABS_VOICE_TR=${trVoices[0].id}\n`);
}
