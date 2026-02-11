// ================================
// Centralized Constants
// ================================

/** Section IDs used across the application for navigation and scroll targeting */
export const SECTION_IDS = {
    hero: 'performans',
    features: 'ozellikler',
    motionAnalysis: 'hareket-analizi',
    pvpArena: 'pvp-arena',
    aiCoach: 'ai-koc',
    nutrition: 'beslenme',
    teams: 'ekipler',
    about: 'hakkimizda',
    team: 'ekibimiz',
} as const

/** Navigation links shared between Navigation and Footer */
export const NAV_LINKS = [
    { name: 'Anasayfa', href: `#${SECTION_IDS.hero}` },
    { name: 'Özellikler', href: `#${SECTION_IDS.features}` },
    { name: 'Hakkımızda', href: `#${SECTION_IDS.about}` },
    { name: 'Ekip', href: `#${SECTION_IDS.teams}` },
] as const

/** Social media links */
export const SOCIAL_LINKS = [
    { name: 'Twitter', href: '#' },
    { name: 'Instagram', href: '#' },
    { name: 'LinkedIn', href: '#' },
    { name: 'GitHub', href: '#' },
] as const
