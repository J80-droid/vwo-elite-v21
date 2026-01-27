/**
 * InMemoryPersistence
 * Simulated persistence layer for ultra-fast integration testing.
 */
export class InMemoryPersistence {
    private storage: Map<string, Record<string, unknown>> = new Map();

    async save(sessionId: string, data: Record<string, unknown>): Promise<void> {
        console.log(`[Persistence] Saving session: ${sessionId}`);
        this.storage.set(sessionId, {
            status: 'finalized',
            timestamp: Date.now(),
            payload: data
        });
    }

    async get(sessionId: string): Promise<Record<string, unknown> | undefined> {
        return this.storage.get(sessionId);
    }

    async clear() {
        this.storage.clear();
    }
}
