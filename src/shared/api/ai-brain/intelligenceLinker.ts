import { TaskIntent } from "@shared/types/ai-brain";

export type EliteIntelligenceId =
    | "text"
    | "logic"
    | "vision"
    | "code"
    | "embedding"
    | "speech"
    | "visual_gen"
    | "agentic"
    | "reranking"
    | "scientific"
    | "spatial"
    | "temporal"
    | "emotional"
    | "strategic";

/**
 * Maps high-level Task Intents to specific Elite Intelligence Engines
 */
export function mapIntentToIntelligence(intent: TaskIntent): EliteIntelligenceId {
    switch (intent) {
        case "math_problem":
        case "complex_reasoning":
        case "quantum_reasoning":
            return "logic";
        case "code_task":
            return "code";
        case "vision_task":
            return "vision";
        case "translation":
        case "summarization":
        case "simple_question":
        case "creative_writing":
            return "text";
        case "image_generation":
            return "visual_gen";
        case "speech_output":
            return "speech";
        case "video_generation":
            return "temporal";
        case "multi_agent_collab":
            return "agentic";
        case "complex_goal":
            return "strategic";
        case "somtoday_action":
            return "agentic";
        default:
            return "text";
    }
}

/**
 * Retrieves the specific intelligence configuration from UserSettings
 */
export function getIntelligenceConfig(intelId: EliteIntelligenceId) {
    try {
        const backup = localStorage.getItem("vwo_elite_settings_backup");
        if (backup) {
            const parsed = JSON.parse(backup);
            const config = parsed?.aiConfig?.intelligencesConfig?.[intelId];
            if (config && config.active !== false) {
                return config;
            }
        }
    } catch (e) {
        console.warn("[IntelligenceLinker] Failed to read user config", e);
    }
    return null;
}
