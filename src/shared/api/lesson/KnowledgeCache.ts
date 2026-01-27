import { IpcChannels } from "@vwo/shared-types";

import { logger } from "../../lib/logger";

interface CacheEntry {
    timestamp: number;
    data: string;
}

/**
 * Knowledge Cache
 * Prevents redundant work during expensive AI operations (Map-Reduce).
 * Uses a combination of In-Memory (fast) and SessionStorage (refresh-proof).
 */
export class KnowledgeCache {
    private static instance: KnowledgeCache;
    private memoryCache: Map<string, CacheEntry> = new Map();

    // Cache Time-To-Live: 7 days (Study materials are permanent until major curriculum changes)
    private readonly TTL = 1000 * 60 * 60 * 24 * 7;

    private constructor() {
        // Restore cache from sessionStorage at startup
        this.hydrate();
    }

    public static getInstance(): KnowledgeCache {
        if (!KnowledgeCache.instance) {
            KnowledgeCache.instance = new KnowledgeCache();
        }
        return KnowledgeCache.instance;
    }

    /**
     * Generates a unique key based on content hashes and topic
     */
    public generateKey(materialHashes: string[], topic: string): string {
        const sortedHashes = [...materialHashes].sort().join("|");
        const keyString = `${topic.toLowerCase()}|${sortedHashes}`;
        return this.hashString(keyString);
    }

    /**
     * SHA-256 Content Hashing (Collision Resistant)
     */
    public async generateContentHash(content: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(content);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    public get(key: string): string | null {
        const entry = this.memoryCache.get(key);

        if (!entry) return null;

        if (Date.now() - entry.timestamp > this.TTL) {
            this.memoryCache.delete(key);
            this.persist(); // Update storage
            return null;
        }

        logger.debug(`[Cache] HIT for key ${key.substring(0, 8)}`);
        return entry.data;
    }

    public set(key: string, data: string): void {
        if (!data || data.length < 10) return; // Don't store empty/invalid garbage

        this.memoryCache.set(key, {
            timestamp: Date.now(),
            data
        });

        // Memory cap: Max 100 items to avoid bloating localStorage while keeping a rich history
        if (this.memoryCache.size > 100) {
            const oldestKey = this.memoryCache.keys().next().value;
            if (oldestKey) this.memoryCache.delete(oldestKey);
        }

        this.persist();
    }

    // --- INTERNALS ---

    private hashString(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(16);
    }

    private async persist() {
        try {
            // Serialize Map to JSON array
            const dump = JSON.stringify(Array.from(this.memoryCache.entries()));
            // ELITE FIX: Move to Filesystem via IPC to bypass 5MB localStorage limit
            if (window.vwoApi) {
                await window.vwoApi.invoke(IpcChannels.KNOWLEDGE_SAVE, dump);
            }
        } catch (e) {
            console.warn("[Cache] Filesystem persist failed, keeping in memory only.", e);
        }
    }

    private async hydrate() {
        try {
            if (!window.vwoApi) return;

            const dump = await window.vwoApi.invoke(IpcChannels.KNOWLEDGE_LOAD) as string | null;
            if (dump) {
                const rawEntries: [string, CacheEntry][] = JSON.parse(dump);
                const now = Date.now();

                // ELITE FIX: Filter direct alle verlopen items eruit
                const validEntries = rawEntries.filter(([_, entry]) => {
                    return (now - entry.timestamp) <= this.TTL;
                });

                if (validEntries.length < rawEntries.length) {
                    console.log(`[Cache] Cleaned up ${rawEntries.length - validEntries.length} expired items on startup.`);
                    // Direct updaten in storage voor de volgende keer
                    this.persist();
                }

                this.memoryCache = new Map(validEntries);
                logger.info(`[Cache] Hydrated ${this.memoryCache.size} persistent knowledge items.`);
            }
        } catch (e) {
            console.warn("[Cache] Failed to hydrate knowledge cache.", e);
        }
    }
}

export const knowledgeCache = KnowledgeCache.getInstance();
