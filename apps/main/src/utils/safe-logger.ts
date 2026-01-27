/** 
 * Safe logger for VWO Elite.
 * In production, console methods are silenced via index.ts, making this a no-op.
 * In development, it provides EPIPE protection and writability checks.
 */
export const safeLog = {
    log: (...args: unknown[]) => {
        try {
            if (process.stdout && process.stdout.writable) {
                console.log(...args.map(a => scrub(a)));
            }
        } catch {
            // Silently ignore EPIPE and other stream errors
        }
    },

    warn: (...args: unknown[]) => {
        try {
            if (process.stderr && process.stderr.writable) {
                console.warn(...args.map(a => scrub(a)));
            }
        } catch {
            // Silently ignore EPIPE
        }
    },

    error: (...args: unknown[]) => {
        try {
            if (process.stderr && process.stderr.writable) {
                console.error(...args.map(a => scrub(a)));
            }
        } catch {
            // Silently ignore EPIPE
        }
    },
};

function scrub(arg: unknown): unknown {
    if (typeof arg !== "string") return arg;
    const sensitivePatterns = [
        /(apiKey[:=]\s*|api_key[:=]\s*|password[:=]\s*|token[:=]\s*|secret[:=]\s*|auth[:=]\s*)["'][^"']+["']/gi,
        /(Bearer\s+)[a-zA-Z0-9-._~+/]+=*/gi,
    ];
    let result = arg;
    for (const pattern of sensitivePatterns) {
        result = result.replace(pattern, "$1******** [HARDENED]");
    }
    return result;
}

