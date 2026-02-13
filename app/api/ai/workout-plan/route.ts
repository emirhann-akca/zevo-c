import { NextRequest, NextResponse } from 'next/server';
import { getVertexAIService } from '@/lib/ai/vertex-ai-web.service';
import { checkRateLimit } from '@/lib/ai/rate-limiter';

export const runtime = 'nodejs';
export const maxDuration = 90;

const WORKOUT_SCHEMA = {
    type: 'object',
    properties: {
        plan: {
            type: 'object',
            properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                duration: { type: 'number' },
                daysPerWeek: { type: 'number' },
                weeks: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            week: { type: 'number' },
                            workouts: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        day: { type: 'string' },
                                        exercises: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    name: { type: 'string' },
                                                    sets: { type: 'number' },
                                                    reps: { type: 'string' },
                                                    rest: { type: 'number' },
                                                    notes: { type: 'string' },
                                                },
                                                required: ['name', 'sets', 'reps', 'rest'],
                                            },
                                        },
                                        notes: { type: 'string' },
                                    },
                                    required: ['day', 'exercises'],
                                },
                            },
                        },
                        required: ['week', 'workouts'],
                    },
                },
            },
            required: ['name', 'description', 'duration', 'daysPerWeek', 'weeks'],
        },
    },
    required: ['plan'],
};

export async function POST(request: NextRequest) {
    try {
        // Rate limiting
        const clientIP =
            request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
        if (!checkRateLimit(clientIP, 10, 60000)) {
            return NextResponse.json(
                { error: 'Çok fazla istek gönderildi. Lütfen biraz bekleyin.' },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { sportType, level, goals, injuries, daysPerWeek } = body;

        // Validate
        if (!sportType || !level || !goals?.length) {
            return NextResponse.json(
                { error: 'Spor türü, seviye ve hedefler gereklidir.' },
                { status: 400 }
            );
        }

        const vertexAI = getVertexAIService();

        const prompt = `Şu kriterlere göre bir antrenman planı oluştur:
- Spor türü: ${sportType}
- Seviye: ${level}
- Hedefler: ${goals.join(', ')}
- Haftalık antrenman günü: ${daysPerWeek || 3}
${injuries?.length ? `- Yaralanmalar: ${injuries.join(', ')} (bu yaralanmaları dikkate al)\n` : ''}
8 haftalık, bilimsel ve güvenli bir antrenman planı oluştur.`;

        const workoutPlan = await vertexAI.generateStructured(
            prompt,
            WORKOUT_SCHEMA
        );

        return NextResponse.json(workoutPlan);
    } catch (error) {
        console.error('Workout plan API error:', error);
        return NextResponse.json(
            { error: 'Antrenman planı oluşturulurken bir hata oluştu.' },
            { status: 500 }
        );
    }
}
