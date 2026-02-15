import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'https://localhost:3000',
    'https://zevosports.com',
    'https://www.zevosports.com',
];

const SOFT_RATE_LIMIT = 120;
const SOFT_WINDOW_MS = 60_000;

const softRateMap = new Map<string, number[]>();

if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        for (const [key, timestamps] of softRateMap.entries()) {
            const valid = timestamps.filter(t => now - t < SOFT_WINDOW_MS);
            if (valid.length === 0) softRateMap.delete(key);
            else softRateMap.set(key, valid);
        }
    }, 120_000);
}

function getClientIP(request: NextRequest): string {
    return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || request.headers.get('x-real-ip')
        || 'unknown';
}

function isAllowedOrigin(origin: string | null): boolean {
    if (!origin) return true;
    return ALLOWED_ORIGINS.some(allowed => origin === allowed)
        || /^https:\/\/.*\.vercel\.app$/.test(origin || '');
}

function softRateCheck(ip: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const timestamps = (softRateMap.get(ip) || []).filter(t => now - t < SOFT_WINDOW_MS);
    if (timestamps.length >= SOFT_RATE_LIMIT) {
        softRateMap.set(ip, timestamps);
        return { allowed: false, remaining: 0 };
    }
    timestamps.push(now);
    softRateMap.set(ip, timestamps);
    return { allowed: true, remaining: SOFT_RATE_LIMIT - timestamps.length };
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    if (!pathname.startsWith('/api/')) return NextResponse.next();

    const ip = getClientIP(request);
    const origin = request.headers.get('origin');
    const method = request.method;

    if (method === 'OPTIONS') {
        if (!isAllowedOrigin(origin)) return new NextResponse(null, { status: 403 });
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

    if (origin && !isAllowedOrigin(origin)) {
        return NextResponse.json({ error: 'Origin not allowed' }, { status: 403 });
    }

    if ((method === 'POST' || method === 'PUT' || method === 'DELETE') &&
        process.env.NODE_ENV === 'production' && origin && !isAllowedOrigin(origin)) {
        return NextResponse.json({ error: 'Request origin not trusted' }, { status: 403 });
    }

    const rateResult = softRateCheck(ip);
    if (!rateResult.allowed) {
        return NextResponse.json(
            { error: 'Çok fazla istek gönderildi. Lütfen bekleyin.' },
            { status: 429, headers: { 'Retry-After': '30' } }
        );
    }

    const response = NextResponse.next();
    if (origin && isAllowedOrigin(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Access-Control-Allow-Credentials', 'true');
    }
    response.headers.set('X-RateLimit-Remaining', String(rateResult.remaining));
    return response;
}

export const config = { matcher: '/api/:path*' };
