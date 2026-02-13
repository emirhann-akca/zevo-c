/**
 * Intelligent context detection to determine which modules to load
 * SHARED: Identical to mobile app's services/prompts/contextDetector.ts
 */

export interface DetectedContext {
    needsNutrition: boolean;
    needsTraining: boolean;
    needsSupplements: boolean;
    needsInjury: boolean;
    needsSportSpecific: boolean;
    confidence: number;
}

export interface ContextUserProfile {
    hasInjuries?: boolean;
    sportType?: string;
    injuries?: Array<{ location: string; severity?: string }>;
}

const NUTRITION_KEYWORDS = [
    'beslenme', 'nutrition', 'diyet', 'diet', 'yemek', 'meal', 'öğün',
    'protein', 'karb', 'karbonhidrat', 'carb', 'carbohydrate', 'yağ', 'fat',
    'kalori', 'calorie', 'makro', 'macro', 'mikro', 'micro', 'vitamin',
    'ne yesem', 'ne yemeli', 'ne içmeli', 'hidrasyon', 'hydration', 'su',
    'kilo', 'weight', 'zayıfla', 'lose weight', 'bulk', 'cutting', 'kitle',
    'kahvaltı', 'breakfast', 'öğle', 'lunch', 'akşam', 'dinner', 'atıştırma', 'snack',
    'besin', 'nutrient', 'mineral', 'fiber', 'lif', 'gluten', 'vegan', 'vejetaryen',
    'porsiyon', 'portion', 'gram', 'g/kg', 'günlük', 'daily', 'haftalık', 'weekly',
];

const TRAINING_KEYWORDS = [
    'antrenman', 'training', 'workout', 'egzersiz', 'exercise', 'program',
    'plan', 'rutin', 'routine', 'set', 'tekrar', 'rep', 'repetition',
    'periodizasyon', 'periodization', 'hacim', 'volume', 'yoğunluk', 'intensity',
    'kuvvet', 'strength', 'kas', 'muscle', 'hipertrofi', 'hypertrophy',
    'kondisyon', 'conditioning', 'kardio', 'cardio', 'hiit', 'dayanıklılık', 'endurance',
    'squat', 'bench', 'deadlift', 'pullup', 'pushup', 'lunge', 'plank',
    'ısınma', 'warm-up', 'soğuma', 'cool-down', 'stretch', 'germe',
    'seans', 'session',
];

const SUPPLEMENT_KEYWORDS = [
    'supplement', 'takviye', 'kreatin', 'creatine', 'protein tozu', 'whey',
    'kafein', 'caffeine', 'beta-alanin', 'beta-alanine', 'vitamin', 'mineral',
    'omega', 'fish oil', 'balık yağı', 'd vitamini', 'vitamin d',
    'bcaa', 'pre-workout', 'post-workout', 'gainer', 'alsam mı', 'should i take',
];

const INJURY_KEYWORDS = [
    'sakatlık', 'injury', 'ağrı', 'pain', 'acı', 'hurt', 'yaralanma',
    'sakatlandım', 'injured', 'recovery', 'toparlanma', 'iyileşme', 'healing',
    'diz', 'knee', 'omuz', 'shoulder', 'sırt', 'back', 'bel', 'lower back',
    'hamstring', 'ayak bileği', 'ankle', 'bilek', 'wrist', 'dirsek', 'elbow',
    'rehabilitasyon', 'rehabilitation', 'tedavi', 'treatment', 'fizyoterapi',
];

const SPORT_SPECIFIC_KEYWORDS = [
    'futbol', 'football', 'soccer', 'koşu', 'running', 'run', 'maraton', 'marathon',
    'bisiklet', 'cycling', 'yüzme', 'swimming', 'voleybol', 'volleyball',
    'basketbol', 'basketball', 'tenis', 'tennis', 'ssg', 'small-sided',
];

function countMatches(text: string, keywords: string[]): number {
    return keywords.filter((keyword) => text.includes(keyword.toLowerCase())).length;
}

function calculateConfidence(
    n: number, t: number, s: number, i: number, sp: number
): number {
    const total = n + t + s + i + sp;
    if (total === 0) return 0.5;
    if (total <= 2) return 0.6;
    if (total <= 4) return 0.8;
    return 1.0;
}

export function detectContext(
    userMessage: string,
    userProfile?: ContextUserProfile
): DetectedContext {
    const msg = userMessage.toLowerCase().trim();

    const n = countMatches(msg, NUTRITION_KEYWORDS);
    const t = countMatches(msg, TRAINING_KEYWORDS);
    const s = countMatches(msg, SUPPLEMENT_KEYWORDS);
    const i = countMatches(msg, INJURY_KEYWORDS);
    const sp = countMatches(msg, SPORT_SPECIFIC_KEYWORDS);

    const hasInjuries = userProfile?.hasInjuries || false;
    const sportType = userProfile?.sportType?.toLowerCase() || '';
    const hasSpecificSport =
        sportType !== '' && sportType !== 'genel' && sportType !== 'general';

    const context: DetectedContext = {
        needsNutrition: n >= 1,
        needsTraining: t >= 1,
        needsSupplements: s >= 1,
        needsInjury: i >= 1 || hasInjuries,
        needsSportSpecific: sp >= 1 || hasSpecificSport,
        confidence: calculateConfidence(n, t, s, i, sp),
    };

    if (
        !context.needsNutrition &&
        !context.needsTraining &&
        !context.needsSupplements &&
        !context.needsInjury &&
        !context.needsSportSpecific
    ) {
        context.needsNutrition = true;
        context.needsTraining = true;
        context.confidence = 0.5;
    }

    return context;
}
