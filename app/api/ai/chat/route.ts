/**
 * ZEVO AI Chat API Route
 * 
 * Security: Rate limiting (30/min), threat detection, input sanitization,
 * error sanitization, streaming support
 */

import { NextRequest, NextResponse } from 'next/server';
import { getVertexAIService } from '@/lib/ai/vertex-ai-web.service';
import { buildCoachSystemPrompt } from '@/lib/ai/build-system-prompt';
import { validateApiRequest, sanitizeErrorForClient, logSecurityEvent } from '@/lib/ai/security';
import { sanitizeMessage, sanitizeHistory } from '@/lib/ai/sanitize';

export const runtime = 'nodejs';
export const maxDuration = 60;

const ENDPOINT = '/api/ai/chat';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { message, history, sportType, injuries, streaming } = body;

        // â”€â”€ Security validation pipeline â”€â”€
        const security = validateApiRequest(request, ENDPOINT, message);
        if (!security.passed) {
            return security.response!;
        }

        // â”€â”€ Input validation â”€â”€
        if (!message || typeof message !== 'string' || !message.trim()) {
            return NextResponse.json(
                { error: 'Mesaj boş olamaz.' },
                { status: 400 }
            );
        }

        const cleanMessage = security.sanitizedMessage || sanitizeMessage(message);
        const cleanHistory = sanitizeHistory(history || []);

        // Build user profile for context detection
        const userProfile = {
            sportType: sportType || undefined,
            hasInjuries: injuries && injuries.length > 0,
            injuries: injuries
                ? injuries.map((inj: string) => ({ location: inj }))
                : [],
        };

        // Build system prompt with modular loading
        // Detect user language and add appropriate instruction
        const isEnglish = /^[a-zA-Z0-9\s.,!?'"():;@#$%^&*+\-=<>\/\[\]{}|\\~`_]+$/.test(cleanMessage.trim());
        const langInstruction = isEnglish
            ? '\nCRITICAL: The user is writing in English. You MUST respond ENTIRELY in English. Do NOT use Turkish.\n'
            : '\nCRITICAL: Kullanıcı Türkçe yazıyor. MUTLAKA tüm yanıtını Türkçe ver. İngilizce KULLANMA. Her cümle, başlık ve madde Türkçe olmalı.\n';

        const systemPrompt = langInstruction + buildCoachSystemPrompt(
            cleanMessage,
            userProfile,
            cleanHistory as any
        );

        const vertexAI = getVertexAIService();

        // â”€â”€â”€ Streaming Response â”€â”€â”€
        if (streaming) {
            const stream = await vertexAI.chatStream({
                message: cleanMessage,
                history: cleanHistory as any,
                systemInstruction: systemPrompt,
                context: {
                    sportType: sportType || 'general',
                    injuries: injuries || [],
                },
            });

            return new Response(stream, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    Connection: 'keep-alive',
                },
            });
        }

        // â”€â”€â”€ Standard Response â”€â”€â”€
        const response = await vertexAI.chat({
            message: cleanMessage,
            history: cleanHistory as any,
            systemInstruction: systemPrompt,
            context: {
                sportType: sportType || 'general',
                injuries: injuries || [],
            },
        });

        return NextResponse.json({
            message: response.message,
            usage: response.usage,
        });
    } catch (error) {
        console.error('AI Chat API error:', error);
        const clientError = sanitizeErrorForClient(error, 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.');
        return NextResponse.json(
            { error: clientError.message },
            { status: 500 }
        );
    }
}

