/**
 * ZEVO Security Middleware
 * 
 * Handles: CORS, CSRF protection, global rate limiting, DDoS protection
 * Runs on every /api/* request before reaching route handlers
 */

import { NextRequest, NextResponse } from 'next/server';

// ─── Configuration ────────────────────────────────────────

const ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'https://localhost:3000',
    'https://zevosports.com',
    'https://www.zevosports.com',
];

const GLOBAL_RATE_LIMIT = 100;  // requests per minute per IP
const GLOBAL_WINDOW_MS = 60_000;
const MAX_CONCURRENT = 5;       // max concurrent requests per IP

// ─── In-memory stores ─────────────────────────────────────

const globalRateMap = new Map<string, { timestamps: number[] }>();
const concurrentMap = new Map<string, number>();

// Clean up every 5 minutes
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of globalRateMap.entries()) {
            entry.timestamps = entry.timestamps.filter(t => now - t < GLOBAL_WINDOW_MS);
            if (entry.timestamps.length === 0) globalRateMap.delete(key);
        }
    }, 300_000);
}

// ─── Helpers ──────────────────────────────────────────────

function getClientIP(request: NextRequest): string {
    return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || request.headers.get('x-real-ip')
        || 'unknown';
}

function isAllowedOrigin(origin: string | null): boolean {
    if (!origin) return true; // Same-origin requests don't send Origin
    return ALLOWED_ORIGINS.some(allowed => origin === allowed);
}

function checkGlobalRateLimit(ip: string): { allowed: boolean; retryAfter: number } {
    const now = Date.now();
    const entry = globalRateMap.get(ip) || { timestamps: [] };

    // Sliding window: keep only timestamps within the window
    entry.timestamps = entry.timestamps.filter(t => now - t < GLOBAL_WINDOW_MS);

    if (entry.timestamps.length >= GLOBAL_RATE_LIMIT) {
        const oldest = entry.timestamps[0];
        const retryAfter = Math.ceil((oldest + GLOBAL_WINDOW_MS - now) / 1000);
        return { allowed: false, retryAfter };
    }

    entry.timestamps.push(now);
    globalRateMap.set(ip, entry);
    return { allowed: true, retryAfter: 0 };
}

function checkConcurrentLimit(ip: string): boolean {
    const current = concurrentMap.get(ip) || 0;
    if (current >= MAX_CONCURRENT) return false;
    concurrentMap.set(ip, current + 1);
    return true;
}

function releaseConcurrent(ip: string): void {
    const current = concurrentMap.get(ip) || 0;
    if (current <= 1) {
        concurrentMap.delete(ip);
    } else {
        concurrentMap.set(ip, current - 1);
    }
}

// ─── Middleware ────────────────────────────────────────────

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isApiRoute = pathname.startsWith('/api/');

    // Only apply full security checks to API routes
    if (!isApiRoute) {
        return NextResponse.next();
    }

    const ip = getClientIP(request);
    const origin = request.headers.get('origin');
    const method = request.method;

    // ── CORS: Preflight ──
    if (method === 'OPTIONS') {
        if (!isAllowedOrigin(origin)) {
            return new NextResponse(null, { status: 403 });
        }

        return new NextResponse(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': origin || '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With',
                'Access-Control-Max-Age': '86400',
            },
        });
    }

    // ── CORS: Origin check ──
    if (origin && !isAllowedOrigin(origin)) {
        console.warn(`🛡️ CORS blocked: ${origin} from ${ip}`);
        return NextResponse.json(
            { error: 'Origin not allowed' },
            { status: 403 }
        );
    }

    // ── CSRF: Check Origin header on mutations ──
    if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
        // In production, require Origin header to match
        if (process.env.NODE_ENV === 'production' && origin && !isAllowedOrigin(origin)) {
            console.warn(`🛡️ CSRF blocked: ${origin} from ${ip}`);
            return NextResponse.json(
                { error: 'Request origin not trusted' },
                { status: 403 }
            );
        }
    }

    // ── DDoS: Concurrent request limit ──
    if (!checkConcurrentLimit(ip)) {
        console.warn(`🛡️ Concurrent limit exceeded: ${ip}`);
        return NextResponse.json(
            { error: 'Çok fazla eşzamanlı istek. Lütfen bekleyin.' },
            { status: 429, headers: { 'Retry-After': '5' } }
        );
    }

    // ── Global rate limit ──
    const rateCheck = checkGlobalRateLimit(ip);
    if (!rateCheck.allowed) {
        releaseConcurrent(ip);
        console.warn(`🛡️ Global rate limit exceeded: ${ip}`);
        return NextResponse.json(
            { error: 'Çok fazla istek gönderildi. Lütfen bekleyin.' },
            {
                status: 429,
                headers: { 'Retry-After': String(rateCheck.retryAfter) },
            }
        );
    }

    // ── Process request ──
    const response = NextResponse.next();

    // Add CORS headers to response
    if (origin && isAllowedOrigin(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    // Release concurrent slot after response
    // Note: Edge middleware can't await response completion,
    // so we release after a timeout as a safety net
    setTimeout(() => releaseConcurrent(ip), 30_000);

    return response;
}

// ─── Matcher: Only run on API routes ──────────────────────

export const config = {
    matcher: '/api/:path*',
};
