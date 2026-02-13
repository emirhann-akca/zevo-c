/**
 * ZEVO Food Analysis API Route
 * 
 * Security: Rate limiting (10/min), threat detection, image validation,
 * body size limit (15MB), error sanitization
 */

import { NextRequest, NextResponse } from 'next/server';
import { getVertexAIService } from '@/lib/ai/vertex-ai-web.service';
import { validateApiRequest, sanitizeErrorForClient } from '@/lib/ai/security';
import { validateImageBase64, validateImageMimeType } from '@/lib/ai/sanitize';

export const runtime = 'nodejs';
export const maxDuration = 120;

const ENDPOINT = '/api/ai/food-analysis';

function buildNutritionPrompt(userProfile?: any): string {
    let prompt = `Sen Zevo'nun AI Diyetisyenisin. Yemek fotoğraflarından KAPSAMLI beslenme analizi yaparsın.

GÖREV:
Fotoğraftaki yemeği analiz et ve aşağıdaki JSON formatında döndür.

ÖNEMLİ KURALLAR:
1. Tüm değerleri TAHMİN et (tahmin edemediğin değerler için null yaz)
2. Gerçekçi tahminler yap (bilimsel verilerle tutarlı)
3. Porsiyon büyüklüğünü göz önünde bulundur
4. Birden fazla yiyecek varsa TOPLA

`;

    if (userProfile) {
        prompt += 'KULLANICI PROFİLİ:\n';
        if (userProfile.age) prompt += `- Yaş: ${userProfile.age}\n`;
        if (userProfile.gender) prompt += `- Cinsiyet: ${userProfile.gender}\n`;
        if (userProfile.weight) prompt += `- Kilo: ${userProfile.weight} kg\n`;
        if (userProfile.goals?.length) {
            prompt += `- Hedefler: ${userProfile.goals.join(', ')}\n`;
        }
        prompt += '\n';
    }

    prompt += `JSON FORMAT (SADECE JSON DÖNDÜR):

{
  "confidence": 85,
  "foodItems": ["Pilav", "Tavuk göğsü", "Salata"],
  "portionSize": "1 porsiyon (ortalama)",
  "macronutrients": {
    "calories": 450,
    "protein": 35,
    "carbohydrate": 45,
    "fiber": 5,
    "sugar": 3,
    "totalFat": 15,
    "saturatedFat": 3,
    "sodium": 650
  },
  "vitamins": {
    "vitaminA": 250,
    "vitaminC": 25,
    "vitaminD": 2,
    "vitaminB12": 1.5
  },
  "minerals": {
    "calcium": 150,
    "iron": 3,
    "magnesium": 60,
    "potassium": 450,
    "zinc": 4
  },
  "notes": ["Tavuk göğsü protein kaynağı olarak mükemmel"],
  "estimationAccuracy": {
    "macronutrients": "high",
    "vitamins": "medium",
    "minerals": "medium"
  }
}

SADECE JSON DÖNDÜR, BAŞKA HİÇBİR ŞEY YAZMA!`;

    return prompt;
}

export async function POST(request: NextRequest) {
    try {
        // ── Security validation pipeline ──
        const security = validateApiRequest(request, ENDPOINT);
        if (!security.passed) {
            return security.response!;
        }

        const body = await request.json();
        const { imageBase64, mimeType, userProfile } = body;

        // ── Image validation ──
        if (!imageBase64) {
            return NextResponse.json(
                { error: 'Görüntü verisi gereklidir.' },
                { status: 400 }
            );
        }

        const imageValidation = validateImageBase64(imageBase64);
        if (!imageValidation.valid) {
            return NextResponse.json(
                { error: imageValidation.error || 'Geçersiz görüntü verisi.' },
                { status: 400 }
            );
        }

        if (mimeType && !validateImageMimeType(mimeType)) {
            return NextResponse.json(
                { error: 'Desteklenmeyen görüntü formatı. JPEG, PNG, GIF, WebP kullanın.' },
                { status: 400 }
            );
        }

        const vertexAI = getVertexAIService();
        const prompt = buildNutritionPrompt(userProfile);

        // Remove data URI prefix if present
        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

        const analysisText = await vertexAI.analyzeImage(
            cleanBase64,
            mimeType || 'image/jpeg',
            prompt
        );

        // Parse JSON response
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return NextResponse.json(
                { error: 'Analiz sonucu işlenemedi.' },
                { status: 500 }
            );
        }

        const analysis = JSON.parse(jsonMatch[0]);

        // Backward compatibility fields
        if (analysis.macronutrients) {
            analysis.calories = analysis.macronutrients.calories;
            analysis.protein = analysis.macronutrients.protein;
            analysis.carbs = analysis.macronutrients.carbohydrate;
            analysis.fat = analysis.macronutrients.totalFat;
            analysis.fiber = analysis.macronutrients.fiber;
            analysis.sugar = analysis.macronutrients.sugar;
        }

        // Defaults
        if (!analysis.foodItems) analysis.foodItems = [];
        if (!analysis.portionSize) analysis.portionSize = '1 porsiyon (ortalama)';
        if (!analysis.notes) analysis.notes = [];
        if (typeof analysis.confidence !== 'number') analysis.confidence = 50;

        return NextResponse.json(analysis);
    } catch (error) {
        console.error('Food analysis API error:', error);
        const clientError = sanitizeErrorForClient(error, 'Görüntü analizi yapılırken bir hata oluştu.');
        return NextResponse.json(
            { error: clientError.message },
            { status: 500 }
        );
    }
}
