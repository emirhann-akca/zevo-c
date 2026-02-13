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

        // ── Security validation pipeline ──
        const security = validateApiRequest(request, ENDPOINT, message);
        if (!security.passed) {
            return security.response!;
        }

        // ── Input validation ──
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
        const systemPrompt = buildCoachSystemPrompt(
            cleanMessage,
            userProfile,
            cleanHistory as any
        );

        const vertexAI = getVertexAIService();

        // ─── Streaming Response ───
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

        // ─── Standard Response ───
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
