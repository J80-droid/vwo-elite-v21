/**
 * AI Brain Bootstrap
 * Initializes all tool registrations at startup
 */

import { getToolRegistry } from "./ToolRegistry";
import { registerEducationTools } from "./tools/educationTools";
import { registerMathTools } from "./tools/mathTools";
import { registerResearchTools } from "./tools/researchTools";

let isInitialized = false;

/**
 * Initialize the AI Brain with all registered tools
 * Call this once at application startup
 */
export async function initializeAIBrain(): Promise<void> {
    if (isInitialized) {
        console.log("[AIBrain] Already initialized, skipping.");
        return;
    }

    console.log("[AIBrain] Initializing tool registry...");

    // Register all tool categories
    registerEducationTools();
    registerMathTools();
    registerResearchTools();

    // Future: Add more tool registrations here as they are migrated
    // registerScienceTools();
    // registerLanguageTools();
    // registerPlanningTools();
    // registerMediaTools();
    // registerExternalTools();

    const registry = getToolRegistry();
    console.log(`[AIBrain] Initialized with ${registry.size} registered tools.`);

    isInitialized = true;
}

/**
 * Get initialization status
 */
export function isAIBrainInitialized(): boolean {
    return isInitialized;
}

/**
 * Reset for testing purposes
 */
export function resetAIBrain(): void {
    getToolRegistry().clear();
    isInitialized = false;
}
