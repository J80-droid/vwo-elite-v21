/**
 * Voice Cache Service
 * 
 * Provides persistent storage for Gemini voice previews using IndexedDB.
 * This prevents redundant API calls and ensures near-instant playback for users.
 */

const DB_NAME = "vwo_elite_media_cache";
const STORE_NAME = "voice_previews";
const DB_VERSION = 1;

export interface CachedVoice {
    voiceName: string;
    audioBase64: string;
    timestamp: number;
}

/**
 * Initialize / Open the IndexedDB connection
 */
const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
            reject(new Error("IndexedDB not supported"));
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: "voiceName" });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

/**
 * Retrieve a cached voice preview
 */
export const getCachedVoice = async (voiceName: string): Promise<string | null> => {
    try {
        const db = await openDB();
        return new Promise((resolve) => {
            const transaction = db.transaction(STORE_NAME, "readonly");
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(voiceName);

            request.onsuccess = () => {
                const result = request.result as CachedVoice | undefined;
                resolve(result?.audioBase64 || null);
            };
            request.onerror = () => resolve(null);
        });
    } catch (err) {
        console.warn("[VoiceCache] Read failed:", err);
        return null;
    }
};

/**
 * Save a voice preview to the permanent cache
 */
export const saveVoiceToCache = async (voiceName: string, audioBase64: string): Promise<void> => {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, "readwrite");
            const store = transaction.objectStore(STORE_NAME);

            const request = store.put({
                voiceName,
                audioBase64,
                timestamp: Date.now(),
            });

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (err) {
        console.warn("[VoiceCache] Save failed:", err);
    }
};

/**
 * Clear the entire voice cache
 */
export const clearVoiceCache = async (): Promise<void> => {
    try {
        const db = await openDB();
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        store.clear();
    } catch (err) {
        console.error("[VoiceCache] Clear failed:", err);
    }
};

/**
 * ELITE WARMUP: Inject bundled assets into DB if empty
 */
export const warmupVoiceCache = async (bundledVoices: Record<string, string>): Promise<number> => {
    try {
        const db = await openDB();
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);

        // Check current count
        const countRequest = store.count();
        const currentCount = await new Promise<number>((resolve) => {
            countRequest.onsuccess = () => resolve(countRequest.result);
            countRequest.onerror = () => resolve(0);
        });

        let injected = 0;
        const voiceKeys = Object.keys(bundledVoices);

        for (const name of voiceKeys) {
            const audioData = bundledVoices[name];
            if (!audioData) continue;

            const putRequest = store.put({
                voiceName: name,
                audioBase64: audioData,
                timestamp: Date.now(),
            });

            await new Promise((resolve) => {
                putRequest.onsuccess = resolve;
                putRequest.onerror = resolve; // Continue even if one fails
            });
            injected++;
        }

        console.log(`[VoiceCache] Warmup complete. Injected ${injected} voices. (Prev count: ${currentCount})`);
        return injected;
    } catch (err) {
        console.warn("[VoiceCache] Warmup failed:", err);
        return 0;
    }
};
