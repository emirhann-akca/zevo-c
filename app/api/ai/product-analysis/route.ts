/**
 * ZEVO Product Analysis API Route
 * 
 * Security: Rate limiting (15/min), input sanitization, error sanitization
 */

import { NextRequest, NextResponse } from 'next/server';
import { getVertexAIService } from '@/lib/ai/vertex-ai-web.service';
import { validateApiRequest, sanitizeErrorForClient } from '@/lib/ai/security';
import { sanitizeMessage } from '@/lib/ai/sanitize';

export const runtime = 'nodejs';
export const maxDuration = 60;

const ENDPOINT = '/api/ai/product-analysis';

const ANALYSIS_SCHEMA = {
    type: 'object',
    properties: {
        zevo_score: { type: 'number' },
        score_reason: { type: 'string' },
        analysis_summary: { type: 'string' },
        pros: { type: 'array', items: { type: 'string' } },
        cons: { type: 'array', items: { type: 'string' } },
        micro_insight: { type: 'string' },
        warnings: { type: 'array', items: { type: 'string' } },
        next_meal_recommendation: { type: 'string' },
    },
    required: [
        'zevo_score',
        'score_reason',
        'analysis_summary',
        'pros',
        'cons',
        'micro_insight',
        'warnings',
        'next_meal_recommendation',
    ],
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { product, userProfile, dailyIntake } = body;

        // ── Security validation pipeline ──
        const security = validateApiRequest(request, ENDPOINT, product?.name);
        if (!security.passed) {
            return security.response!;
        }

        // ── Input validation ──
        if (!product?.name) {
            return NextResponse.json(
                { error: 'Ürün bilgisi gereklidir.' },
                { status: 400 }
            );
        }

        const vertexAI = getVertexAIService();

        // Build prompt with sanitized inputs
        const cleanName = sanitizeMessage(product.name);
        let prompt =
            "Sen Zevo Fitness App'in profesyonel AI diyetisyenisin. Bu ürünü analiz et ve Zevo Score hesapla.\n\n";
        prompt += `ÜRÜN BİLGİLERİ:\n- İsim: ${cleanName}\n`;
        if (product.brand) prompt += `- Marka: ${sanitizeMessage(product.brand)}\n`;

        if (product.nutritionFacts) {
            const nf = product.nutritionFacts;
            prompt += '- Besin Değerleri:\n';
            if (nf.calories) prompt += `  - Kalori: ${nf.calories} kcal\n`;
            if (nf.protein) prompt += `  - Protein: ${nf.protein} g\n`;
            if (nf.carbs) prompt += `  - Karbonhidrat: ${nf.carbs} g\n`;
            if (nf.fat) prompt += `  - Yağ: ${nf.fat} g\n`;
            if (nf.fiber) prompt += `  - Lif: ${nf.fiber} g\n`;
            if (nf.sugar) prompt += `  - Şeker: ${nf.sugar} g\n`;
            if (nf.sodium) prompt += `  - Sodyum: ${nf.sodium} mg\n`;
            if (nf.servingSize) prompt += `  - Porsiyon: ${sanitizeMessage(nf.servingSize)}\n`;
        }

        if (product.ingredients?.length) {
            const cleanIngredients = (product.ingredients as string[]).map((i: string) => sanitizeMessage(i));
            prompt += `- İçindekiler: ${cleanIngredients.join(', ')}\n`;
        }

        prompt += '\n';

        if (userProfile) {
            prompt += 'KULLANICI PROFİLİ:\n';
            if (userProfile.goals?.length) {
                prompt += `- Hedefler: ${userProfile.goals.join(', ')}\n`;
            }
            if (userProfile.dailyCalorieGoal)
                prompt += `- Günlük kalori hedefi: ${userProfile.dailyCalorieGoal} kcal\n`;
            if (userProfile.dailyProteinGoal)
                prompt += `- Günlük protein hedefi: ${userProfile.dailyProteinGoal} g\n`;
            if (userProfile.dietaryRestrictions?.length) {
                prompt += `- Diyet kısıtlamaları: ${userProfile.dietaryRestrictions.join(', ')}\n`;
            }
            if (userProfile.allergies?.length) {
                prompt += `- Alerjiler: ${userProfile.allergies.join(', ')}\n`;
            }
            prompt += '\n';
        }

        if (dailyIntake) {
            prompt += 'GÜNLÜK ALIM:\n';
            if (dailyIntake.calories)
                prompt += `- Kalori: ${dailyIntake.calories} kcal\n`;
            if (dailyIntake.protein)
                prompt += `- Protein: ${dailyIntake.protein} g\n`;
            if (dailyIntake.carbs)
                prompt += `- Karbonhidrat: ${dailyIntake.carbs} g\n`;
            if (dailyIntake.fat) prompt += `- Yağ: ${dailyIntake.fat} g\n`;
            prompt += '\n';
        }

        prompt += `GÖREV:
1. Bu ürünü 0-100 arası Zevo Score ile değerlendir (100 = mükemmel)
2. Skor nedenini açıkla
3. Özet analiz yap (2-3 cümle)
4. Artıları listele (3-5 madde)
5. Eksileri listele (3-5 madde)
6. Mikro besin içgörüsü ver
7. Uyarılar varsa belirt
8. Sonraki öğün için öneri ver\n`;

        const analysis = await vertexAI.generateStructured<any>(
            prompt,
            ANALYSIS_SCHEMA
        );

        // Validate score range
        if (
            typeof analysis.zevo_score !== 'number' ||
            analysis.zevo_score < 0 ||
            analysis.zevo_score > 100
        ) {
            analysis.zevo_score = 50;
        }

        // Ensure arrays
        if (!Array.isArray(analysis.pros)) analysis.pros = [];
        if (!Array.isArray(analysis.cons)) analysis.cons = [];
        if (!Array.isArray(analysis.warnings)) analysis.warnings = [];

        return NextResponse.json(analysis);
    } catch (error) {
        console.error('Product analysis API error:', error);
        const clientError = sanitizeErrorForClient(error, 'Ürün analizi yapılırken bir hata oluştu.');
        return NextResponse.json(
            { error: clientError.message },
            { status: 500 }
        );
    }
}
