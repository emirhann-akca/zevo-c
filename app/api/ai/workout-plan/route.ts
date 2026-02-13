/**
 * ZEVO Workout Plan API Route
 * 
 * Security: Rate limiting (5/min), input sanitization, error sanitization
 */

import { NextRequest, NextResponse } from 'next/server';
import { getVertexAIService } from '@/lib/ai/vertex-ai-web.service';
import { validateApiRequest, sanitizeErrorForClient } from '@/lib/ai/security';
import { sanitizeMessage } from '@/lib/ai/sanitize';

export const runtime = 'nodejs';
export const maxDuration = 90;

const ENDPOINT = '/api/ai/workout-plan';

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
        const body = await request.json();
        const { sportType, level, goals, injuries, daysPerWeek } = body;

        // ── Security validation pipeline ──
        const security = validateApiRequest(request, ENDPOINT, sportType);
        if (!security.passed) {
            return security.response!;
        }

        // ── Input validation ──
        if (!sportType || !level || !goals?.length) {
            return NextResponse.json(
                { error: 'Spor türü, seviye ve hedefler gereklidir.' },
                { status: 400 }
            );
        }

        // Sanitize text inputs
        const cleanSport = sanitizeMessage(sportType);
        const cleanLevel = sanitizeMessage(level);
        const cleanGoals = (goals as string[]).map((g: string) => sanitizeMessage(g));
        const cleanInjuries = injuries ? (injuries as string[]).map((i: string) => sanitizeMessage(i)) : [];

        const vertexAI = getVertexAIService();

        const prompt = `Şu kriterlere göre bir antrenman planı oluştur:
- Spor türü: ${cleanSport}
- Seviye: ${cleanLevel}
- Hedefler: ${cleanGoals.join(', ')}
- Haftalık antrenman günü: ${daysPerWeek || 3}
${cleanInjuries.length ? `- Yaralanmalar: ${cleanInjuries.join(', ')} (bu yaralanmaları dikkate al)\n` : ''}
8 haftalık, bilimsel ve güvenli bir antrenman planı oluştur.`;

        const workoutPlan = await vertexAI.generateStructured(
            prompt,
            WORKOUT_SCHEMA
        );

        return NextResponse.json(workoutPlan);
    } catch (error) {
        console.error('Workout plan API error:', error);
        const clientError = sanitizeErrorForClient(error, 'Antrenman planı oluşturulurken bir hata oluştu.');
        return NextResponse.json(
            { error: clientError.message },
            { status: 500 }
        );
    }
}
