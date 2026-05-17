export const ZEVO_BRAND = {
  name: "Zevo",
  category: "AI sports & fitness assistant app",
  oneLiner: {
    en: "Your Trainer In Your Pocket",
    tr: "Cebindeki antrenörün",
  },
  description: {
    en: "AI-powered sports coach that analyzes workouts, builds personalized programs, plans nutrition, checks form, and connects athletes in competitive leagues.",
    tr: "Antrenmanlarını analiz eden, kişiselleştirilmiş program oluşturan, beslenme planlayan ve seni rekabetçi liglerde diğer sporcularla buluşturan yapay zeka destekli spor asistanı.",
  },
  audience: {
    age: "16-35",
    psychographic:
      "Performance-driven athletes and fitness enthusiasts who value data, gamification, and want to level up to semi-pro / pro. Comfortable with AI-powered tools.",
  },
  voice: {
    tone: "Young, dynamic, confident-but-friendly. Avoids corporate jargon. Uses sports metaphors. Short, punchy sentences.",
    keyPhrases: {
      en: ["Win the game", "Living programs", "AI-Powered", "Trusted by 2.5K+ athletes"],
      tr: ["Ölç, analiz et, gelişir", "Yapay zeka destekli", "2.5K+ aktif sporcu"],
    },
  },
  cta: {
    en: "Get Started",
    tr: "Hemen Dene",
  },
  visual: {
    primaryColor: "#10DC78", // bright emerald
    backgroundColor: "#0A1628", // dark navy
    secondaryColor: "#22C55E",
    logoLight: "public/zevo-logo.png",
    logoDark: "public/zevo-logo-dark.png",
    aspectRatio: "9:16",
    targetDurationSec: { min: 15, max: 30 },
  },
  social: {
    instagram: "@zevo.app",
    x: "@AppZevo",
    linkedin: "@zevoo",
  },
  competitorSeeds: [
    "AI fitness app",
    "AI workout coach",
    "personalized training app",
    "AI sports tracker",
    "form analysis app",
    "running coach app",
    "Strava",
    "Freeletics",
    "Nike Training Club",
    "Future fitness",
    "Fitbod",
    "Whoop",
  ],
} as const;

export type ZevoBrand = typeof ZEVO_BRAND;
