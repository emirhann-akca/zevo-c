/**
 * ZEVO Enhanced Rate Limiter
 * 
 * Features:
 * - Sliding window algorithm (more accurate than fixed window)
 * - Endpoint-specific rate limits
 * - Brute force protection (IP blocking after repeated failures)
 * - Retry-After header support
 */

// ─── Types ────────────────────────────────────────────────

interface RateLimitEntry {
    timestamps: number[];
}

interface BlockEntry {
    blockedUntil: number;
    failureCount: number;
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    retryAfterSeconds: number;
    blocked: boolean;
}

// ─── Endpoint-specific limits ─────────────────────────────

export const ENDPOINT_LIMITS: Record<string, { maxRequests: number; windowMs: number }> = {
    '/api/ai/chat': { maxRequests: 30, windowMs: 60_000 },
    '/api/ai/food-analysis': { maxRequests: 10, windowMs: 60_000 },
    '/api/ai/workout-plan': { maxRequests: 5, windowMs: 60_000 },
    '/api/ai/product-analysis': { maxRequests: 15, windowMs: 60_000 },
};

const DEFAULT_LIMIT = { maxRequests: 30, windowMs: 60_000 };

// ─── Brute force config ───────────────────────────────────

const BRUTE_FORCE_THRESHOLD = 10;      // failures before blocking
const BRUTE_FORCE_BLOCK_MS = 15 * 60_000; // 15 minutes

// ─── In-memory stores ─────────────────────────────────────

const rateLimits = new Map<string, RateLimitEntry>();
const blockedIPs = new Map<string, BlockEntry>();

// Clean up every 5 minutes
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();

        // Clean rate limit entries
        for (const [key, entry] of rateLimits.entries()) {
            entry.timestamps = entry.timestamps.filter(t => now - t < 120_000);
            if (entry.timestamps.length === 0) rateLimits.delete(key);
        }

        // Clean expired blocks
        for (const [key, entry] of blockedIPs.entries()) {
            if (now > entry.blockedUntil) blockedIPs.delete(key);
        }
    }, 300_000);
}

// ─── Core Functions ───────────────────────────────────────

/**
 * Check rate limit using sliding window algorithm
 * @param identifier - IP address or user identifier
 * @param endpoint - API endpoint path (for endpoint-specific limits)
 * @returns RateLimitResult with allowed status and metadata
 */
export function checkRateLimit(
    identifier: string,
    endpointOrMax?: string | number,
    windowMs?: number
): boolean {
    // Support legacy signature: checkRateLimit(id, maxRequests, windowMs)
    if (typeof endpointOrMax === 'number') {
        const result = checkRateLimitAdvanced(identifier, undefined, endpointOrMax, windowMs);
        return result.allowed;
    }

    const result = checkRateLimitAdvanced(identifier, endpointOrMax as string);
    return result.allowed;
}

/**
 * Advanced rate limit check with full metadata
 */
export function checkRateLimitAdvanced(
    identifier: string,
    endpoint?: string,
    maxRequestsOverride?: number,
    windowMsOverride?: number
): RateLimitResult {
    const now = Date.now();

    // ── Check if IP is blocked (brute force) ──
    const blockEntry = blockedIPs.get(identifier);
    if (blockEntry && now < blockEntry.blockedUntil) {
        const retryAfter = Math.ceil((blockEntry.blockedUntil - now) / 1000);
        return { allowed: false, remaining: 0, retryAfterSeconds: retryAfter, blocked: true };
    }

    // ── Determine limits ──
    const limits = endpoint ? (ENDPOINT_LIMITS[endpoint] || DEFAULT_LIMIT) : DEFAULT_LIMIT;
    const maxRequests = maxRequestsOverride ?? limits.maxRequests;
    const windowMs = windowMsOverride ?? limits.windowMs;

    // ── Sliding window check ──
    const key = endpoint ? `${identifier}:${endpoint}` : identifier;
    const entry = rateLimits.get(key) || { timestamps: [] };

    // Keep only timestamps within the window
    entry.timestamps = entry.timestamps.filter(t => now - t < windowMs);

    if (entry.timestamps.length >= maxRequests) {
        const oldest = entry.timestamps[0];
        const retryAfter = Math.ceil((oldest + windowMs - now) / 1000);
        rateLimits.set(key, entry);
        return { allowed: false, remaining: 0, retryAfterSeconds: retryAfter, blocked: false };
    }

    entry.timestamps.push(now);
    rateLimits.set(key, entry);

    const remaining = maxRequests - entry.timestamps.length;
    return { allowed: true, remaining, retryAfterSeconds: 0, blocked: false };
}

/**
 * Record a failed request for brute force tracking
 */
export function recordFailure(identifier: string): void {
    const existing = blockedIPs.get(identifier) || { blockedUntil: 0, failureCount: 0 };
    existing.failureCount++;

    if (existing.failureCount >= BRUTE_FORCE_THRESHOLD) {
        existing.blockedUntil = Date.now() + BRUTE_FORCE_BLOCK_MS;
        console.warn(`🛡️ Brute force: IP ${identifier} blocked for 15 minutes (${existing.failureCount} failures)`);
    }

    blockedIPs.set(identifier, existing);
}

/**
 * Reset failure count (e.g., after successful request)
 */
export function resetFailures(identifier: string): void {
    blockedIPs.delete(identifier);
}

/**
 * Get remaining requests for an identifier
 */
export function getRemainingRequests(
    identifier: string,
    endpoint?: string
): number {
    const limits = endpoint ? (ENDPOINT_LIMITS[endpoint] || DEFAULT_LIMIT) : DEFAULT_LIMIT;
    const key = endpoint ? `${identifier}:${endpoint}` : identifier;
    const entry = rateLimits.get(key);

    if (!entry) return limits.maxRequests;

    const now = Date.now();
    const active = entry.timestamps.filter(t => now - t < limits.windowMs);
    return Math.max(0, limits.maxRequests - active.length);
}
