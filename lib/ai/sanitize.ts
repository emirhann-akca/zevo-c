/**
 * Input sanitization for AI API routes
 */

/**
 * Sanitize user message before sending to AI
 */
export function sanitizeMessage(message: string): string {
    return message
        .trim()
        .slice(0, 2000) // Max 2000 characters
        .replace(/[<>]/g, ''); // Basic XSS prevention
}

/**
 * Validate and sanitize chat history
 */
export function sanitizeHistory(
    history: any[]
): Array<{ role: string; content: string }> {
    if (!Array.isArray(history)) return [];

    return history
        .slice(-10) // Max 10 messages in history
        .filter(
            (msg) =>
                msg &&
                typeof msg.role === 'string' &&
                typeof msg.content === 'string' &&
                ['user', 'model'].includes(msg.role)
        )
        .map((msg) => ({
            role: msg.role,
            content: msg.content.slice(0, 2000),
        }));
}

/**
 * Validate base64 image data
 */
export function validateImageBase64(base64: string): boolean {
    if (!base64 || typeof base64 !== 'string') return false;

    // Check reasonable size (max ~10MB in base64)
    if (base64.length > 13_000_000) return false;

    // Basic base64 pattern check
    const base64Pattern = /^[A-Za-z0-9+/]+=*$/;

    // Remove data URI prefix if present
    const cleaned = base64.replace(/^data:image\/\w+;base64,/, '');

    return base64Pattern.test(cleaned);
}
