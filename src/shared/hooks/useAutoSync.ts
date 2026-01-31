import { useModelsStore } from "@shared/model/modelsStore";
import type { UserSettings } from "@shared/types/config";
import { useCallback, useEffect, useRef } from "react";

const HEARTBEAT_INTERVAL = 30 * 60 * 1000; // 30 minutes

/**
 * Simple debounce helper to avoid lodash dependency.
 */
function useDebounce<A extends unknown[], R>(callback: (...args: A) => R, delay: number) {
    const timer = useRef<NodeJS.Timeout | null>(null);

    const debouncedFunc = useCallback((...args: A) => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => {
            callback(...args);
        }, delay);
    }, [callback, delay]);

    return debouncedFunc;
}

interface ProviderSyncItem {
    id: string;
    key: string;
    baseUrl?: string;
    isCustom?: boolean;
    name?: string;
}

/**
 * Hook to automatically synchronize and monitor AI provider health.
 * Re-validates nodes on key changes (debounced) and periodically via heartbeat.
 */
export const useAutoSync = (settings: UserSettings) => {
    const syncProvider = useModelsStore((state) => state.syncProvider);
    const prevKeys = useRef<Record<string, string>>({});

    // 🛡️ SEED: Initialize with current keys to prevent double-sync on mount
    useEffect(() => {
        if (settings.aiConfig && Object.keys(prevKeys.current).length === 0) {
            const config = settings.aiConfig;
            if (config.geminiApiKey) prevKeys.current["gemini"] = config.geminiApiKey;
            if (config.groqApiKey) prevKeys.current["groq"] = config.groqApiKey;
            if (config.kimiApiKey) prevKeys.current["kimi"] = config.kimiApiKey;
            config.customProviders?.forEach(p => {
                if (p.enabled && p.apiKey) prevKeys.current[p.id] = p.apiKey;
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /**
     * Universal synchronizer for all active providers.
     */
    const syncAllProviders = useCallback(async (config: UserSettings["aiConfig"], force = false) => {
        if (!config) return;

        const providers: ProviderSyncItem[] = [
            { id: "gemini", key: String(config.geminiApiKey || "").trim() },
            { id: "groq", key: String(config.groqApiKey || "").trim() },
            { id: "kimi", key: String(config.kimiApiKey || "").trim() },
            { id: "openai", key: String(config.openaiApiKey || "").trim() },
            { id: "cohere", key: String(config.cohereApiKey || "").trim() },
            ...(config.customProviders?.filter(p => p.enabled).map(p => ({
                id: p.id, key: (p.apiKey || "").trim(), baseUrl: p.baseUrl, isCustom: true, name: p.name
            })) || [])
        ];

        for (const p of providers) {
            if (p.key && (force || prevKeys.current[p.id] !== p.key)) {
                console.log(`[AutoSync] Triggering sync for ${p.id}...`);

                await syncProvider({
                    id: p.id,
                    apiKey: p.key,
                    baseUrl: p.baseUrl,
                    isCustom: p.isCustom,
                    name: p.name
                });

                prevKeys.current[p.id] = p.key;
            }
        }
    }, [syncProvider]);

    // Using a separate effect for debouncedSync to satisfy the linter's dependency requirement
    const debouncedSync = useDebounce(syncAllProviders, 1500);

    useEffect(() => {
        // 1. Reactive Sync: Key change detection
        if (settings.aiConfig) {
            debouncedSync(settings.aiConfig);
        }

        // 2. Idle Heartbeat: Health verification
        const heartbeat = setInterval(() => {
            console.log("[AutoSync] Heartbeat: Validating provider health...");
            syncAllProviders(settings.aiConfig, true);
        }, HEARTBEAT_INTERVAL);

        return () => {
            clearInterval(heartbeat);
        };
    }, [settings.aiConfig, debouncedSync, syncAllProviders]);
};
