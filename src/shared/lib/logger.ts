/**
 * Elite Logger Utility
 * Centralized logging with sensitive data scrubbing
 */

const SENSITIVE_PATTERNS = [
    /sk-[a-zA-Z0-9]{32,}/g, // Generic OpenAI-style keys
    /AIza[a-zA-Z0-9_-]{35}/g, // Google API Keys
    /hf_[a-zA-Z0-9]{34,}/g, // HuggingFace tokens
    /api[-_]?key/gi,
    /token/gi,
];

/**
 * Scrub sensitive information from strings or objects
 */
const scrub = (data: unknown): unknown => {
    if (typeof data === "string") {
        let scrubbed = data;
        SENSITIVE_PATTERNS.forEach((pattern) => {
            scrubbed = scrubbed.replace(pattern, "[REDACTED]");
        });
        return scrubbed;
    }

    if (Array.isArray(data)) {
        return data.map(scrub);
    }

    if (data !== null && typeof data === "object") {
        const scrubbedObj: Record<string, unknown> = {};
        const objData = data as Record<string, unknown>;
        for (const key in objData) {
            // Scrub both keys and values
            const scrubbedKey = String(scrub(key));
            scrubbedObj[scrubbedKey] = scrub(objData[key]);
        }
        return scrubbedObj;
    }

    return data;
};

export const logger = {
    info: (message: string, ...args: unknown[]) => {
        console.info(`[Elite] ${message}`, ...args.map(scrub));
    },
    warn: (message: string, ...args: unknown[]) => {
        console.warn(`[Elite] ${message}`, ...args.map(scrub));
    },
    error: (message: string, ...args: unknown[]) => {
        // In production, we might want to send this to Sentry/etc.
        console.error(`[Elite ERROR] ${message}`, ...args.map(scrub));
    },
    debug: (message: string, ...args: unknown[]) => {
        if (import.meta.env.DEV) {
            console.debug(`[DEBUG] ${message}`, ...args.map(scrub));
        }
    },
};
