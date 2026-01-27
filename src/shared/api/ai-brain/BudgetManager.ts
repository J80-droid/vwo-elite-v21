/**
 * BudgetManager
 * Tracks and controls token consumption per session to prevent billing runaway.
 * Part of Audit Remediation (Operational Economics)
 */
export class BudgetManager {
    private static sessions: Map<string, { used: number; limit: number }> = new Map();
    private static readonly DEFAULT_LIMIT = 50000; // 50k tokens hard limit

    static initialize(sessionId: string, limit?: number) {
        this.sessions.set(sessionId, { used: 0, limit: limit || this.DEFAULT_LIMIT });
    }

    static addUsage(sessionId: string, tokens: number) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.used += tokens;
            console.log(`[Budget][${sessionId}] Usage: ${session.used}/${session.limit}`);
        }
    }

    static isExceeded(sessionId: string): boolean {
        const session = this.sessions.get(sessionId);
        return session ? session.used >= session.limit : false;
    }

    static getUsage(sessionId: string) {
        return this.sessions.get(sessionId)?.used || 0;
    }
}
