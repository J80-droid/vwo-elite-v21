/**
 * ContextManager
 * Handles session memory for Multi-Agent sessions
 * Part of Phase 14: Enterprise Agentic Hardening
 */

export interface Interaction {
    query: string;
    optimizedQuery: string;
    consensus: string;
    insights: Array<{ agent: string; insight: string }>;
}

export interface ChatHistory {
    sessionId: string;
    interactions: Interaction[];
}

export class ContextManager {
    private static cache = new Map<string, ChatHistory>();

    /**
     * Get a compact summary of the last few interactions
     */
    static getHistory(sessionId: string, depth = 3): string {
        const history = this.cache.get(sessionId);
        if (!history || history.interactions.length === 0) {
            return "Geen eerdere context beschikbaar.";
        }

        return history.interactions
            .slice(-depth)
            .map((int, i) => {
                return `Interactie ${i + 1}:
Vraag: ${int.query}
Consensus (Samenvatting): ${int.consensus.substring(0, 300)}...`;
            })
            .join("\n\n");
    }

    /**
     * Save a new interaction to the session cache
     */
    static save(sessionId: string, data: Interaction): void {
        const existing = this.cache.get(sessionId) || {
            sessionId,
            interactions: [],
        };

        // Elite Hardening: Scrub secrets before saving to memory
        const scrubbedData = {
            ...data,
            query: this.scrubSecrets(data.query),
            optimizedQuery: this.scrubSecrets(data.optimizedQuery),
        };

        // Add to history and maintain a reasonable size
        existing.interactions.push(scrubbedData);
        if (existing.interactions.length > 10) {
            existing.interactions.shift();
        }

        this.cache.set(sessionId, existing);
    }

    private static scrubSecrets(text: string): string {
        const sensitivePatterns = [
            /(apiKey[:=]\s*|api_key[:=]\s*|password[:=]\s*|token[:=]\s*|secret[:=]\s*|auth[:=]\s*)["'][^"']+["']/gi,
            /(Bearer\s+)[a-zA-Z0-9-._~+/]+=*/gi,
        ];
        let scrubbed = text;
        for (const pattern of sensitivePatterns) {
            scrubbed = scrubbed.replace(pattern, "$1******** [HARDENED]");
        }
        return scrubbed;
    }

    /**
     * Clear context for a session
     */
    static clear(sessionId: string): void {
        this.cache.delete(sessionId);
    }
}
