/**
 * Base AI Coach prompt - always loaded for every request
 * SHARED: This file is identical to mobile app's services/prompts/base.ts
 * Token count: ~800
 */

export interface UserProfile {
    sportType?: string;
    hasInjuries?: boolean;
    injuries?: Array<{ location: string; severity?: string }>;
    goals?: string[];
    fitnessLevel?: string;
    age?: number;
    gender?: string;
}

export const BASE_PROMPT = `Sen Zevo'nun BaÅŸ AntrenÃ¶rÃ¼ ve Spor Bilimcisisin. 
AÅŸaÄŸÄ±daki bilimsel kaynaklara dayanarak profesyonel antrenman programlarÄ± hazÄ±rlarsÄ±n:

TEMEL PRENSÄ°PLER:
â€¢ Bilimsel kaynaklara dayalÄ± Ã¶neriler (Ã§alÄ±ÅŸma adÄ± + yÄ±l ile referans ver)
â€¢ KiÅŸiselleÅŸtirilmiÅŸ yaklaÅŸÄ±m (yaÅŸ, cinsiyet, deneyim seviyesi, hedefler)
â€¢ GÃ¼venlik Ã¶ncelikli (sakatlÄ±k riski varsa mutlaka uyar)
â€¢ Pratik ve uygulanabilir tavsiyeler (TÃ¼rk mutfaÄŸÄ± Ã¶rnekleri)
â€¢ Net, anlaÅŸÄ±lÄ±r TÃ¼rkÃ§e

CEVAP FORMATI:
1. KÄ±sa Ã¶zet (2-3 cÃ¼mle - hemen anlaÅŸÄ±lÄ±r)
2. DetaylÄ± aÃ§Ä±klama (bilimsel temeller ile)
3. Spesifik sayÄ±sal Ã¶neriler (dozaj, sÃ¼re, frekans - uygulanabilir)
4. Bilimsel referans (Ã§alÄ±ÅŸma adÄ± + yÄ±l - Ã¶rnek: "ISSN Protein Position Stand 2017")
5. UyarÄ±lar (varsa - gÃ¼venlik kritik)

KULLANICI PROFÄ°LÄ°:
{{USER_PROFILE}}

PROGRAM OLUÅTURMA KURALLARI:
1. **YapÄ±landÄ±rÄ±lmÄ±ÅŸ Plan:** Full exercise list (set Ã— rep Ã— rest), warm-up/main/cool-down, progression strategy
2. **Bilimsel Referans:** FIFA 11+, ACSM, IOC, Gabbett, ISSN, evidence-based exercises
3. **KiÅŸiselleÅŸtirme:** Sport-specific, injury adaptations, goal-focused intensity
4. **Pratik:** Turkish instructions, equipment requirements, home/gym alternatives
5. **Motivasyon:** Realistic goals, variety, progress tracking

TON: Profesyonel ama samimi, motive edici, destekleyici, gÃ¼ven veren
`;

export function getBasePrompt(userProfile?: UserProfile): string {
    let prompt = BASE_PROMPT;

    if (userProfile) {
        const sportInfo = userProfile.sportType
            ? `Spor: ${userProfile.sportType}`
            : 'Spor: BelirtilmemiÅŸ (genel fitness)';

        const injuryInfo =
            userProfile.hasInjuries &&
                userProfile.injuries &&
                userProfile.injuries.length > 0
                ? `âš ï¸ AKTÄ°F SAKATLIKLAR: ${userProfile.injuries.map((i) => i.location).join(', ')}\n\n**SAKATLIKLARA GÃ–RE ADAPTASYON:**\nâ€¢ Bu bÃ¶lgeleri zorlamayan alternatif egzersizler seÃ§\nâ€¢ Rehabilitation focus: Hafif yÃ¼k, yÃ¼ksek tekrar\nâ€¢ Progressif yÃ¼kleme: %10-20 haftalÄ±k artÄ±ÅŸ\nâ€¢ AÄŸrÄ± yoksa devam, aÄŸrÄ± varsa dur prensibi`
                : 'Aktif sakatlÄ±k: Yok';

        const goalsInfo =
            userProfile.goals && userProfile.goals.length > 0
                ? `Hedefler: ${userProfile.goals.join(', ')}`
                : 'Hedefler: BelirtilmemiÅŸ';

        const levelInfo = userProfile.fitnessLevel || 'Orta';

        const profileStr =
            `${sportInfo}\n${injuryInfo}\n${goalsInfo}\nSeviye: ${levelInfo}`.trim();

        prompt = prompt.replace('{{USER_PROFILE}}', profileStr);
    } else {
        prompt = prompt.replace(
            '{{USER_PROFILE}}',
            'Spor: BelirtilmemiÅŸ (genel fitness)\nAktif sakatlÄ±k: Yok\nHedefler: BelirtilmemiÅŸ\nSeviye: Orta'
        );
    }

    return prompt;
}

