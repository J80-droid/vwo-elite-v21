/**
 * Airlock
 * Deterministic sanitization of external inputs to prevent prompt injection.
 * Part of Audit Remediation (Adversarial Hardening)
 */
export class Airlock {
    /**
     * Sanitizes strings to be used inside XML tags.
     * Escapes <, >, and & characters.
     */
    static sanitize(input: string): string {
        if (!input) return "";
        return input
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    /**
     * Wraps data in a 'secure' container for LLM ingestion.
     */
    static secureWrap(key: string, data: string): string {
        return `<${key}>${this.sanitize(data)}</${key}>`;
    }
}
