/**
 * Model Classifier
 * Heuristics to categorize AI models based on their identity
 */
import { ModelInfo } from "@shared/types/config";

export type IntelligenceType = "chat" | "reasoning" | "vision" | "live" | "threed" | "emotion" | "image";

const CAPABILITIES_CACHE_KEY = "vwo-elite-capabilities-v1";

/**
 * Extraheert het primaire versienummer uit een model-ID string.
 * Voorbeeld: "gemini-3.5-pro" -> 3.5
 */
const extractVersion = (id: string): number => {
    const match = id.match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[0]) : 0;
};

export const classifyModel = (modelId: string): IntelligenceType[] => {
    const m = modelId.toLowerCase();
    const version = extractVersion(m);

    // Default to chat UNLESS it's a known specialized model
    const isSpecialized =
        m.includes("shap-e") ||
        m.includes("prosody") ||
        m.includes("face") ||
        m.includes("burst") ||
        m.includes("rerank");

    const types: IntelligenceType[] = isSpecialized ? [] : ["chat"];

    // 1. Reasoning Heuristics (High-tier models)
    if (
        version >= 3.0 || // Toekomstbestendig: alle 3.0+ modellen zijn krachtig
        m.includes("pro") ||
        m.includes("ultra") ||
        m.includes("think") ||
        m.includes("reason") ||
        m.includes("large") ||
        m.includes("r1") ||
        m.includes("o1") ||
        m.includes("70b") ||
        m.includes("405b") ||
        m.includes("moonshot") ||
        m.includes("k2") ||
        m.includes("deepseek") ||
        m.includes("128k")
    ) {
        types.push("reasoning");
    }

    // 2. Vision Heuristics (Multimodal capabilities)
    if (
        version >= 2.0 || // Alle moderne modellen (Gemini 2.0+, GPT-4+) ondersteunen vision
        m.includes("vision") ||
        m.includes("multimodal") ||
        m.includes("vl") ||
        m.includes("pixtral") ||
        m.includes("llava") ||
        m.includes("4o") ||
        m.includes("k2") ||
        m.includes("1.5-flash") || // Baseline 1.5 also has it
        m.includes("1.5-pro")
    ) {
        types.push("vision");
    }

    // 3. Live/Fast Heuristics (Efficiency & Bidirectional support)
    if (
        m.includes("flash") ||
        m.includes("instant") ||
        m.includes("mini") ||
        m.includes("turbo") ||
        m.includes("schnell") ||
        m.includes("audio") ||
        m.includes("live") ||
        (version < 2.0 && (m.includes("8b") || m.includes("1.5b") || m.includes("3b")))
    ) {
        types.push("live");
    }

    return Array.from(new Set(types));
};

export const filterModelsForIntelligence = (models: string[] | ModelInfo[], type: IntelligenceType): string[] => {
    // Safety check for undefined/null models
    if (!models || !Array.isArray(models)) return [];

    // 1. Check de Cache (Feit) - We access localStorage directly in the renderer
    let cache: Record<string, { methods: string[] }> = {};
    try {
        cache = JSON.parse(localStorage.getItem(CAPABILITIES_CACHE_KEY) || "{}");
    } catch {
        // Fallback if localStorage or JSON parse fails
    }

    const requiredMethod = type === "live" ? "BidiGenerateContent" : "generateContent";

    return models
        .filter(m => {
            const mId = typeof m === "string" ? m : m.id;

            // Priority 1: Verified Cache Capability (The "Ground Truth")
            if (cache[mId]) {
                return cache[mId].methods.some((meth: string) =>
                    meth.toLowerCase().includes(requiredMethod.toLowerCase())
                );
            }

            // Priority 2: Methods info passed in (if available and not in cache)
            if (typeof m !== "string" && m.methods.length > 0) {
                return m.methods.some(meth => meth.toLowerCase().includes(requiredMethod.toLowerCase()));
            }

            // Priority 3: Identity Heuristics (The "Smart Guess")
            // For strings (Ollama/Groq) we assume basic chat capability if filtered for chat.
            // If filtering for Live, we generally require verified methods unless it's a known fast model.
            const identityMatch = classifyModel(mId).includes(type);

            // Assume local/custom string models support generateContent if they match the identity
            if (type !== "live") return identityMatch;

            return identityMatch;
        })
        .map(m => typeof m === "string" ? m : m.id);
};

/**
 * Sort models by reliability: Verified/Cached models first, then by score.
 */
export const sortModelsByReliability = (models: string[], calculateModelScore: (id: string) => number): string[] => {
    if (!models || !Array.isArray(models)) return [];

    let cache: Record<string, { methods: string[]; lastSeen: number }> = {};
    try {
        cache = JSON.parse(localStorage.getItem(CAPABILITIES_CACHE_KEY) || "{}");
    } catch {
        // Fallback
    }

    return [...models].sort((a, b) => {
        const aVerified = cache[a] ? 1 : 0;
        const bVerified = cache[b] ? 1 : 0;

        // Eerst op verificatie-status
        if (aVerified !== bVerified) return bVerified - aVerified;
        // Daarna op ELO score
        return calculateModelScore(b) - calculateModelScore(a);
    });
};
