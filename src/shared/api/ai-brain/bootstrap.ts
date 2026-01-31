/**
 * AI Brain Bootstrap
 * Initializes all tool registrations at startup
 */

import { getToolRegistry } from "./ToolRegistry";
import { registerEducationTools } from "./tools/educationTools";
import { registerExternalTools } from "./tools/externalTools";
import { registerLanguageTools } from "./tools/languageTools";
import { registerMathTools } from "./tools/mathTools";
import { registerMediaTools } from "./tools/mediaTools";
import { registerPlanningTools } from "./tools/planningTools";
import { registerResearchTools } from "./tools/researchTools";
import { registerScienceTools } from "./tools/scienceTools";

let isInitialized = false;
let initPromise: Promise<void> | null = null;

/**
 * Initialize the AI Brain with all registered tools
 * Call this once at application startup
 */
export async function initializeAIBrain(): Promise<void> {
    if (isInitialized) return;
    if (initPromise) return initPromise;

    initPromise = (async () => {
        console.log("[AIBrain] Initializing tool registry...");

        // Register all tool categories
        registerEducationTools();
        registerMathTools();
        registerResearchTools();
        registerScienceTools();
        registerLanguageTools();
        registerPlanningTools();
        registerMediaTools();
        registerExternalTools();

        const registry = getToolRegistry();
        console.log(`[AIBrain] Initialized with ${registry.size} registered tools.`);

        isInitialized = true;
    })();

    return initPromise;
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
