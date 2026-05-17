import { z } from "zod";

export const CompetitorAdSchema = z.object({
  adId: z.string(),
  advertiser: z.string(),
  startedRunning: z.string().optional(),
  daysActive: z.number().optional(),
  mediaType: z.enum(["video", "image", "carousel", "unknown"]),
  mediaUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  primaryText: z.string().optional(),
  headline: z.string().optional(),
  cta: z.string().optional(),
  destinationUrl: z.string().optional(),
  region: z.string().optional(),
  searchKeyword: z.string(),
  rawSnippet: z.string().optional(),
});
export type CompetitorAd = z.infer<typeof CompetitorAdSchema>;

export const AdAnalysisSchema = z.object({
  adId: z.string(),
  hookType: z.enum([
    "problem",
    "social_proof",
    "before_after",
    "curiosity",
    "shock",
    "ugc_testimonial",
    "demo_walkthrough",
    "humor",
    "stat_drop",
    "other",
  ]),
  hookSummary: z.string(),
  sceneStructure: z.array(
    z.object({
      seconds: z.tuple([z.number(), z.number()]),
      description: z.string(),
    })
  ),
  cta: z.string(),
  ctaPlacement: z.enum(["intro", "mid", "outro", "throughout"]),
  toneTags: z.array(z.string()),
  whyItWorks: z.string(),
  reusableElements: z.array(z.string()),
});
export type AdAnalysis = z.infer<typeof AdAnalysisSchema>;

export const AdConceptSchema = z.object({
  id: z.string(),
  hookType: z.string(),
  hookLine: z.object({ tr: z.string(), en: z.string() }),
  targetAudience: z.string(),
  durationSec: z.number(),
  inspiredBy: z.array(z.string()).describe("competitor adIds that inspired this concept"),
  shotlist: z.array(
    z.object({
      seconds: z.tuple([z.number(), z.number()]),
      visual: z.string().describe("what is on screen — UGC clip, stock footage description, app UI mockup, etc."),
      voiceover: z.object({ tr: z.string(), en: z.string() }),
      onScreenText: z.object({ tr: z.string(), en: z.string() }).optional(),
    })
  ),
  cta: z.object({ tr: z.string(), en: z.string() }),
  musicMood: z.string(),
  rationale: z.string(),
});
export type AdConcept = z.infer<typeof AdConceptSchema>;

export const RenderedAdSchema = z.object({
  conceptId: z.string(),
  lang: z.enum(["tr", "en"]),
  videoPath: z.string(),
  durationSec: z.number(),
  width: z.number(),
  height: z.number(),
  brandOverlayApplied: z.boolean(),
  voiceoverProvider: z.enum(["elevenlabs", "macos-say", "skipped"]),
  shots: z.array(
    z.object({
      seconds: z.tuple([z.number(), z.number()]),
      sourceUrl: z.string().optional(),
      sourcePath: z.string().optional(),
      provider: z.enum(["pexels", "placeholder"]),
    })
  ),
});
export type RenderedAd = z.infer<typeof RenderedAdSchema>;

export const PublishResultSchema = z.object({
  conceptId: z.string(),
  lang: z.enum(["tr", "en"]),
  status: z.enum(["uploaded", "dry-run", "skipped", "error"]),
  metaVideoId: z.string().optional(),
  metaCreativeId: z.string().optional(),
  metaAdId: z.string().optional(),
  campaignId: z.string().optional(),
  adSetId: z.string().optional(),
  error: z.string().optional(),
  uploadedAt: z.string(),
});
export type PublishResult = z.infer<typeof PublishResultSchema>;
