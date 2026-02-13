/**
 * ZEVO Enhanced Input Sanitization
 * 
 * Protections:
 * - XSS payload detection and stripping
 * - SQL injection pattern detection
 * - Prompt injection protection
 * - HTML entity stripping
 * - Base64 image validation
 * - Chat history validation
 */

// ─── XSS Patterns ────────────────────────────────────────

const XSS_PATTERNS = [
    /<script\b[^>]*>/i,
    /<\/script>/i,
    /\bon\w+\s*=/i,                          // onerror=, onload=, onclick=, etc.
    /javascript\s*:/i,
    /vbscript\s*:/i,
    /data\s*:\s*text\/html/i,
    /expression\s*\(/i,                       // CSS expression()
    /<iframe\b/i,
    /<embed\b/i,
    /<object\b/i,
    /<svg\b[^>]*\bon/i,                       // <svg onload=...>
    /&#x?[0-9a-f]+;/i,                        // HTML numeric entities used for evasion
    /\beval\s*\(/i,
    /\bdocument\s*\.\s*(cookie|write|domain)/i,
    /\bwindow\s*\.\s*(location|open)/i,
];

// ─── SQL Injection Patterns ───────────────────────────────

const SQL_PATTERNS = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION)\b\s+(ALL\s+)?)/i,
    /(\b(TABLE|DATABASE|FROM|WHERE|AND|OR)\b.*(\b(SELECT|DROP|DELETE|INSERT)\b))/i,
    /(--|#|\/\*|\*\/)/,                       // SQL comments
    /('\s*(OR|AND)\s+')/i,                    // ' OR '1'='1
    /(\b(UNION)\s+(ALL\s+)?(SELECT)\b)/i,
    /(;\s*(DROP|DELETE|UPDATE|INSERT)\b)/i,    // ; DROP TABLE
    /(\bxp_\w+)/i,                            // SQL Server extended procedures
    /(\bSLEEP\s*\()/i,                        // Time-based injection
    /(\bBENCHMARK\s*\()/i,
    /(\bWAITFOR\s+DELAY\b)/i,
];

// ─── Prompt Injection Patterns ────────────────────────────

const PROMPT_INJECTION_PATTERNS = [
    /ignore\s+(all\s+)?previous\s+(instructions|prompts|context)/i,
    /forget\s+(all\s+)?previous\s+(instructions|prompts|context)/i,
    /disregard\s+(all\s+)?previous/i,
    /override\s+(system|previous)\s+(prompt|instructions)/i,
    /\byou\s+are\s+now\b/i,
    /\bact\s+as\b/i,
    /\bpretend\s+(to\s+be|you\s+are)\b/i,
    /\bsystem\s*:\s*/i,                       // system: override attempt
    /\b(assistant|user|system)\s*:\s*\n/i,    // Role injection
    /\[INST\]/i,                               // LLM special tokens
    /\[\/INST\]/i,
    /<\|im_start\|>/i,
    /<\|im_end\|>/i,
    /\bDAN\s+mode\b/i,                        // Jailbreak patterns
    /\bjailbreak\b/i,
    /\bdo\s+anything\s+now\b/i,
];

// ─── Core Functions ───────────────────────────────────────

/**
 * Sanitize user message before sending to AI
 * Strips dangerous content while preserving normal text
 */
export function sanitizeMessage(message: string): string {
    if (!message || typeof message !== 'string') return '';

    let cleaned = message
        .trim()
        .slice(0, 2000);                         // Max 2000 characters

    // Strip HTML tags completely
    cleaned = cleaned.replace(/<[^>]*>/g, '');

    // Strip HTML entities
    cleaned = cleaned.replace(/&[#\w]+;/g, '');

    // Remove null bytes
    cleaned = cleaned.replace(/\0/g, '');

    return cleaned;
}

/**
 * Detect dangerous patterns in input
 * Returns array of detected threat types
 */
export function detectThreats(input: string): string[] {
    const threats: string[] = [];

    for (const pattern of XSS_PATTERNS) {
        if (pattern.test(input)) {
            threats.push('xss');
            break;
        }
    }

    for (const pattern of SQL_PATTERNS) {
        if (pattern.test(input)) {
            threats.push('sql_injection');
            break;
        }
    }

    for (const pattern of PROMPT_INJECTION_PATTERNS) {
        if (pattern.test(input)) {
            threats.push('prompt_injection');
            break;
        }
    }

    return threats;
}

/**
 * Check if input contains dangerous patterns
 * Returns true if threats are detected
 */
export function hasDangerousContent(input: string): boolean {
    return detectThreats(input).length > 0;
}

/**
 * Validate and sanitize chat history
 */
export function sanitizeHistory(
    history: any[]
): Array<{ role: string; content: string }> {
    if (!Array.isArray(history)) return [];

    return history
        .slice(-10)                              // Max 10 messages in history
        .filter(
            (msg) =>
                msg &&
                typeof msg.role === 'string' &&
                typeof msg.content === 'string' &&
                ['user', 'model'].includes(msg.role)
        )
        .map((msg) => ({
            role: msg.role,
            content: sanitizeMessage(msg.content),
        }));
}

/**
 * Validate base64 image data
 */
export function validateImageBase64(base64: string): {
    valid: boolean;
    error?: string;
} {
    if (!base64 || typeof base64 !== 'string') {
        return { valid: false, error: 'Image data is required' };
    }

    // Check reasonable size (max ~10MB in base64)
    if (base64.length > 13_000_000) {
        return { valid: false, error: 'Image too large (max 10MB)' };
    }

    // Remove data URI prefix if present
    const cleaned = base64.replace(/^data:image\/\w+;base64,/, '');

    // Basic base64 pattern check
    const base64Pattern = /^[A-Za-z0-9+/]+=*$/;
    if (!base64Pattern.test(cleaned.slice(0, 100))) {
        return { valid: false, error: 'Invalid base64 format' };
    }

    return { valid: true };
}

/**
 * Validate MIME type is an allowed image type
 */
export function validateImageMimeType(mimeType: string): boolean {
    const ALLOWED_TYPES = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/bmp',
    ];
    return ALLOWED_TYPES.includes(mimeType?.toLowerCase());
}

/**
 * Validate request body size
 * @param bodyString - Stringified body
 * @param maxSizeMB - Maximum size in megabytes
 */
export function validateBodySize(bodyString: string, maxSizeMB: number = 1): boolean {
    const sizeInBytes = new TextEncoder().encode(bodyString).length;
    return sizeInBytes <= maxSizeMB * 1024 * 1024;
}
