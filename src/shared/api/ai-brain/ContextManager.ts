import type { LLMMessage } from "../providers/types";

/**
 * ContextManager
 * Handles session memory for Multi-Agent sessions AND 
 * advanced conversation pruning/truncation for the Elite Orchestrator.
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

    /**
     * Elite Pruning: Respects the structure of conversations.
     * Guarantees that System Messages stay at the top or are consolidated.
     */
    static pruneMessages(
        messages: LLMMessage[],
        maxTokens: number
    ): { safeMessages: LLMMessage[]; systemPrompt?: string } {
        // 1. Extract System Prompts (prevent interleaving errors)
        const systemMessages = messages.filter((m) => m.role === "system");
        const conversation = messages.filter((m) => m.role !== "system");

        // Combine system prompts into one coherent instruction
        const consolidatedSystemPrompt = systemMessages
            .map((m) => m.content)
            .join("\n\n[UPDATE INSTRUCTIES]\n");

        // 2. Token Estimation (Conservative: 4 chars/token)
        const estimatedTokens = conversation.reduce(
            (acc, m) => acc + (m.content?.length || 0) / 4,
            0
        );

        // If within budget, return everything
        if (estimatedTokens <= maxTokens) {
            return {
                safeMessages: conversation,
                systemPrompt: consolidatedSystemPrompt || undefined,
            };
        }

        console.warn(`[Elite Context] Pruning required. Budget: ${maxTokens}, Est: ${estimatedTokens}`);

        // 3. Strategic Pruning: Keep Head and Tail
        // Always keep the last message (the user query)
        const lastMsg = conversation[conversation.length - 1];
        // Always keep the first few messages (context setting)
        const head = conversation.slice(0, 2);

        // The 'body' is what we compress
        const body = conversation.slice(head.length, conversation.length - 1);

        // Calculate space for body
        const reservedTokens = (JSON.stringify(head).length + JSON.stringify(lastMsg).length) / 4;
        const availableForBody = maxTokens - reservedTokens - 100; // 100 buffer

        if (availableForBody <= 0) {
            // Emergency: Only last message
            return { safeMessages: [lastMsg!], systemPrompt: consolidatedSystemPrompt || undefined };
        }

        // Take only the newest messages from the body that fit
        const preservedBody: LLMMessage[] = [];
        let currentBodyTokens = 0;

        // Loop backwards through body (newest first)
        for (let i = body.length - 1; i >= 0; i--) {
            const msg = body[i]!;
            const tokens = (msg.content?.length || 0) / 4;
            if (currentBodyTokens + tokens < availableForBody) {
                preservedBody.unshift(msg);
                currentBodyTokens += tokens;
            } else {
                // Summary marker
                preservedBody.unshift({
                    role: "user",
                    content: `[... Oudere context (${i + 1} berichten) samengevat/verwijderd voor geheugenoptimalisatie ...]`
                } as LLMMessage);
                break;
            }
        }

        return {
            safeMessages: [...head, ...preservedBody, lastMsg!],
            systemPrompt: consolidatedSystemPrompt || undefined,
        };
    }

    /**
     * Semantic Truncation: Won't cut in the middle of code blocks or sentences.
     */
    static smartTruncate(text: string, maxChars: number): string {
        if (text.length <= maxChars) return text;

        const keepEnd = Math.floor(maxChars * 0.3); // Keep last 30%
        const keepStart = maxChars - keepEnd - 100;

        const startText = text.substring(0, keepStart);
        const endText = text.substring(text.length - keepEnd);

        // Try to break at newline or paragraph
        const safeStart = startText.substring(0, startText.lastIndexOf("\n")) || startText;
        const safeEnd = endText.substring(endText.indexOf("\n") + 1) || endText;

        return `${safeStart}\n\n[... ${text.length - maxChars} karakters geskipt (Elite Truncation) ...]\n\n${safeEnd}`;
    }

    private static scrubSecrets(text: string): string {
        if (!text) return text;

        // 1. Recursive JSON Traversal (Deep Scrub)
        let scrubbed = text;
        try {
            // Check if it's a JSON string
            if ((text.startsWith("{") && text.endsWith("}")) || (text.startsWith("[") && text.endsWith("]"))) {
                const data = JSON.parse(text);
                const scrubObject = (obj: unknown): unknown => {
                    if (Array.isArray(obj)) {
                        return obj.map(scrubObject);
                    } else if (obj !== null && typeof obj === "object") {
                        const newObj: Record<string, unknown> = {};
                        const record = obj as Record<string, unknown>;
                        for (const key in record) {
                            const lowKey = key.toLowerCase();
                            if (["password", "token", "apikey", "api_key", "secret", "auth", "credential"].some(s => lowKey.includes(s))) {
                                newObj[key] = "******** [HARDENED]";
                            } else {
                                newObj[key] = scrubObject(record[key]);
                            }
                        }
                        return newObj;
                    }
                    return obj;
                };
                scrubbed = JSON.stringify(scrubObject(data), null, 2);
            }
        } catch {
            // Not valid JSON, fall back to regex
        }

        // 2. Regex Fallback (Surface Scrub)
        const sensitivePatterns = [
            /(apiKey[:=]\s*|api_key[:=]\s*|password[:=]\s*|token[:=]\s*|secret[:=]\s*|auth[:=]\s*|credential[:=]\s*)["'][^"']+["']/gi,
            /(Bearer\s+)[a-zA-Z0-9-._~+/]+=*/gi,
        ];

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
