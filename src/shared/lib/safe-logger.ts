/**
 * Shared Safe Logger for VWO Elite
 * Works in both Main (Node) and Renderer (Browser) processes.
 */

const sensitivePatterns = [
    /(apiKey[:=]\s*|api_key[:=]\s*|password[:=]\s*|token[:=]\s*|secret[:=]\s*|auth[:=]\s*)["'][^"']+["']/gi,
    /(Bearer\s+)[a-zA-Z0-9-._~+/]+=*/gi,
];

function scrub(arg: unknown): unknown {
    if (typeof arg !== "string") return arg;
    let result = arg;
    for (const pattern of sensitivePatterns) {
        result = result.replace(pattern, "$1******** [HARDENED]");
    }
    return result;
}

export const safeLog = {
    log: (...args: unknown[]) => {
        try {
            const isNode = typeof process !== "undefined" && process.stdout;
            if (isNode && !process.stdout.writable) return;
            console.log(...args.map((a) => scrub(a)));
        } catch {
            // Silently ignore
        }
    },

    warn: (...args: unknown[]) => {
        try {
            const isNode = typeof process !== "undefined" && process.stderr;
            if (isNode && !process.stderr.writable) return;
            console.warn(...args.map((a) => scrub(a)));
        } catch {
            // Silently ignore
        }
    },

    error: (...args: unknown[]) => {
        try {
            const isNode = typeof process !== "undefined" && process.stderr;
            if (isNode && !process.stderr.writable) return;
            console.error(...args.map((a) => scrub(a)));
        } catch {
            // Silently ignore
        }
    },
};
