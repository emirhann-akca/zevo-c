/**
 * ZEVO Central Security Utilities
 * 
 * Shared security functions used across all API routes:
 * - Request validation pipeline
 * - Error sanitization for client responses
 * - Security event logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimitAdvanced, recordFailure, type RateLimitResult } from './rate-limiter';
import { sanitizeMessage, detectThreats, hasDangerousContent } from './sanitize';

// ─── Types ────────────────────────────────────────────────

export interface SecurityCheckResult {
    passed: boolean;
    response?: NextResponse;
    clientIP: string;
    sanitizedMessage?: string;
}

// ─── Request Validation Pipeline ──────────────────────────

/**
 * Validate an API request through the full security pipeline:
 * 1. Extract client IP
 * 2. Endpoint-specific rate limit check
 * 3. Input threat detection (XSS, SQL injection, prompt injection)
 * 
 * Returns a SecurityCheckResult. If `passed` is false, return the `response` immediately.
 */
export function validateApiRequest(
    request: NextRequest,
    endpoint: string,
    message?: string
): SecurityCheckResult {
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || request.headers.get('x-real-ip')
        || 'unknown';

    // ── Rate limit check ──
    const rateResult: RateLimitResult = checkRateLimitAdvanced(clientIP, endpoint);

    if (!rateResult.allowed) {
        const statusMessage = rateResult.blocked
            ? 'IP adresiniz geçici olarak engellenmiştir. Lütfen daha sonra tekrar deneyin.'
            : 'Çok fazla istek gönderildi. Lütfen biraz bekleyin.';

        logSecurityEvent('rate_limit', clientIP, endpoint, {
            blocked: rateResult.blocked,
            retryAfter: rateResult.retryAfterSeconds,
        });

        return {
            passed: false,
            clientIP,
            response: NextResponse.json(
                { error: statusMessage },
                {
                    status: 429,
                    headers: { 'Retry-After': String(rateResult.retryAfterSeconds) },
                }
            ),
        };
    }

    // ── Threat detection on message ──
    if (message) {
        const threats = detectThreats(message);
        if (threats.length > 0) {
            recordFailure(clientIP);
            logSecurityEvent('threat_detected', clientIP, endpoint, { threats, messagePreview: message.slice(0, 50) });

            return {
                passed: false,
                clientIP,
                response: NextResponse.json(
                    { error: 'Mesajınız güvenlik kontrolünden geçemedi. Lütfen içeriği değiştirip tekrar deneyin.' },
                    { status: 400 }
                ),
            };
        }
    }

    return {
        passed: true,
        clientIP,
        sanitizedMessage: message ? sanitizeMessage(message) : undefined,
    };
}

// ─── Error Sanitization ───────────────────────────────────

/**
 * Sanitize error for client response.
 * In production, strips stack traces and internal details.
 * In development, includes full error info.
 */
export function sanitizeErrorForClient(
    error: unknown,
    fallbackMessage: string = 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.'
): { message: string; details?: string } {
    const isDev = process.env.NODE_ENV !== 'production';

    if (isDev && error instanceof Error) {
        return {
            message: error.message,
            details: error.stack,
        };
    }

    // Production: generic message only — never expose internals
    return { message: fallbackMessage };
}

// ─── Security Event Logging ───────────────────────────────

/**
 * Log a structured security event (server-side only)
 */
export function logSecurityEvent(
    eventType: string,
    clientIP: string,
    endpoint: string,
    details?: Record<string, unknown>
): void {
    const event = {
        timestamp: new Date().toISOString(),
        type: eventType,
        ip: clientIP,
        endpoint,
        ...details,
    };

    // In production, this would go to a structured logging service
    console.warn(`🛡️ Security Event:`, JSON.stringify(event));
}
