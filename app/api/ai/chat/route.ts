import { NextRequest, NextResponse } from 'next/server';
import { getVertexAIService } from '@/lib/ai/vertex-ai-web.service';
import { buildCoachSystemPrompt } from '@/lib/ai/build-system-prompt';
import { checkRateLimit } from '@/lib/ai/rate-limiter';
import { sanitizeMessage, sanitizeHistory } from '@/lib/ai/sanitize';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
    try {
        // Rate limiting
        const clientIP =
            request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
        if (!checkRateLimit(clientIP, 30, 60000)) {
            return NextResponse.json(
                { error: 'Çok fazla istek gönderildi. Lütfen biraz bekleyin.' },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { message, history, sportType, injuries, streaming } = body;

        // Validate
        if (!message || typeof message !== 'string' || !message.trim()) {
            return NextResponse.json(
                { error: 'Mesaj boş olamaz.' },
                { status: 400 }
            );
        }

        const cleanMessage = sanitizeMessage(message);
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
        return NextResponse.json(
            { error: 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.' },
            { status: 500 }
        );
    }
}
