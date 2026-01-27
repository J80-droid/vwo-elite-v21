/**
 * Intelligence Defaults
 * Defines sensible default configurations for each Elite Intelligence Engine.
 * These defaults are optimized for the specific use case of each intelligence.
 */

import type { IntelligenceEngineConfig } from "@shared/types/config";

// ═══════════════════════════════════════════════════════════════════════════
// BASE DEFAULTS (Shared across all intelligences)
// ═══════════════════════════════════════════════════════════════════════════
const BASE_DEFAULTS: IntelligenceEngineConfig = {
    modelId: "default",
    provider: "google",
    temperature: 0.7,
    topP: 1.0,
    maxTokens: 4096,
    active: true,
    contextWindow: 32000,

    // Sampling
    topK: 40,
    minP: 0.05,
    mirostat: 0,
    mirostatTau: 5.0,
    mirostatEta: 0.1,
    tfsZ: 1.0,
    typicalP: 1.0,
    topA: 0,
    etaCutoff: 0,
    smoothingFactor: 0,

    // Penalties
    frequencyPenalty: 0,
    presencePenalty: 0,
    repetitionPenalty: 1.1,
    noRepeatNGramSize: 0,
    dryMultiplier: 0,
    dryBase: 1.75,
    dryAllowedLength: 2,
    repetitionPenaltyRange: 1024,

    // Steering
    seed: undefined,
    stopSequences: [],
    logitBias: {},

    // Structure
    grammarGBNF: undefined,
    jsonModeForced: false,

    // Search
    beamSearch: false,
    numBeams: 1,
    contrastiveSearch: false,

    // Context
    ropeFrequencyBase: 10000,
    ropeFrequencyScale: 1.0,
    numCtx: 4096,
    kvCacheQuantization: 16,

    // Guidance
    cfgScale: 1.0,
    negativePrompt: undefined,

    // Model Mods
    loraPath: undefined,
    loraScale: 1.0,
    quantizationLevel: undefined,

    // Prompt
    promptTemplate: undefined,
    systemPromptPosition: "start",

    // Performance
    speculativeDecoding: false,
    flashAttention: true,
    threadCount: undefined,
    dynamicTemperature: false,
};

// ═══════════════════════════════════════════════════════════════════════════
// INTELLIGENCE-SPECIFIC OVERRIDES
// ═══════════════════════════════════════════════════════════════════════════
const INTELLIGENCE_OVERRIDES: Partial<Record<string, Partial<IntelligenceEngineConfig>>> = {
    // TEXT: Balanced, general-purpose
    text: {
        temperature: 0.7,
        topP: 0.95,
        repetitionPenalty: 1.1,
    },

    // LOGIC: High determinism, low creativity
    logic: {
        temperature: 0.2,
        topP: 0.8,
        topK: 20,
        repetitionPenalty: 1.0,
        beamSearch: true,
        numBeams: 3,
    },

    // VISION: Standard, with vision model preference
    vision: {
        temperature: 0.5,
        maxTokens: 2048,
    },

    // CODE: Very low temperature, high precision
    code: {
        temperature: 0.1,
        topP: 0.9,
        topK: 10,
        repetitionPenalty: 1.0,
        frequencyPenalty: 0.1,
    },

    // EMBEDDING: Not used for generation, minimal config
    embedding: {
        temperature: 0,
        maxTokens: 0,
        active: true,
    },

    // SPEECH: Moderate creativity for natural speech
    speech: {
        temperature: 0.6,
        topP: 0.9,
    },

    // VISUAL_GEN: High creativity for image prompts
    visual_gen: {
        temperature: 0.9,
        topP: 0.95,
        topK: 50,
        cfgScale: 7.0,
    },

    // AGENTIC: Balanced for tool use
    agentic: {
        temperature: 0.3,
        topP: 0.9,
        maxTokens: 8192,
        jsonModeForced: true,
    },

    // RERANKING: Deterministic scoring
    reranking: {
        temperature: 0,
        topP: 1.0,
        maxTokens: 256,
    },

    // SCIENTIFIC: High precision, no hallucination
    scientific: {
        temperature: 0.15,
        topP: 0.85,
        topK: 15,
        repetitionPenalty: 1.05,
        frequencyPenalty: 0.2,
    },

    // SPATIAL: Balanced for 3D reasoning
    spatial: {
        temperature: 0.4,
        topP: 0.9,
    },

    // TEMPORAL: Low temp for video/timeline precision
    temporal: {
        temperature: 0.3,
        topP: 0.9,
    },

    // EMOTIONAL: Higher creativity for empathy
    emotional: {
        temperature: 0.8,
        topP: 0.95,
        presencePenalty: 0.1,
    },

    // STRATEGIC: Balanced for planning
    strategic: {
        temperature: 0.5,
        topP: 0.9,
        maxTokens: 8192,
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get the default configuration for a specific intelligence ID.
 * Returns a fresh copy merged with intelligence-specific overrides.
 */
export function getDefaultConfig(intelId: string): IntelligenceEngineConfig {
    const overrides = INTELLIGENCE_OVERRIDES[intelId] || {};
    return { ...BASE_DEFAULTS, ...overrides };
}

/**
 * Get all default configurations as a record.
 */
export function getAllDefaultConfigs(): Record<string, IntelligenceEngineConfig> {
    const configs: Record<string, IntelligenceEngineConfig> = {};
    const intelligenceIds = [
        "text", "logic", "vision", "code", "embedding", "speech",
        "visual_gen", "agentic", "reranking", "scientific", "spatial",
        "temporal", "emotional", "strategic",
    ];
    for (const id of intelligenceIds) {
        configs[id] = getDefaultConfig(id);
    }
    return configs;
}

/**
 * The base defaults object (immutable snapshot).
 */
export const INTELLIGENCE_BASE_DEFAULTS = Object.freeze({ ...BASE_DEFAULTS });
