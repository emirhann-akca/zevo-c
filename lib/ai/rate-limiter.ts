/**
 * Simple in-memory rate limiter for API routes
 * For production, consider using Vercel KV or Upstash Redis
 */

const rateLimits = new Map<string, { count: number; resetTime: number }>();

/**
 * Check if a request is within rate limits
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param maxRequests - Maximum requests per window
 * @param windowMs - Time window in milliseconds
 * @returns true if allowed, false if rate limited
 */
export function checkRateLimit(
    identifier: string,
    maxRequests: number = 30,
    windowMs: number = 60000
): boolean {
    const now = Date.now();
    const entry = rateLimits.get(identifier);

    if (!entry || now > entry.resetTime) {
        rateLimits.set(identifier, { count: 1, resetTime: now + windowMs });
        return true;
    }

    if (entry.count >= maxRequests) {
        return false;
    }

    entry.count++;
    return true;
}

/**
 * Get remaining requests for an identifier
 */
export function getRemainingRequests(
    identifier: string,
    maxRequests: number = 30
): number {
    const entry = rateLimits.get(identifier);
    if (!entry || Date.now() > entry.resetTime) return maxRequests;
    return Math.max(0, maxRequests - entry.count);
}

// Clean up expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of rateLimits.entries()) {
            if (now > entry.resetTime) {
                rateLimits.delete(key);
            }
        }
    }, 300000);
}
