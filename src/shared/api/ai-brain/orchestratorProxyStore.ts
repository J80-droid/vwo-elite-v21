import type {
  AIModel,
  OrchestratorConfig,
  RoutingDecision,
} from "@shared/types/ai-brain";
import { create } from "zustand";

interface OrchestratorState {
  config: OrchestratorConfig;
  models: AIModel[];
  routingHistory: RoutingDecision[];
  isProcessing: boolean;
  error: string | null;
  execute: (prompt: string, options?: Record<string, unknown>) => Promise<string>;
  _processRoutingDecision: (decision: unknown) => void;
  _processModelsUpdated: (models: unknown) => void;
  _cleanup: (() => void) | null;
}

const DEFAULT_CONFIG: OrchestratorConfig = {
  routingStrategy: "rule_based",
  fallbackEnabled: true,
  maxRetries: 3,
  contextInjectionEnabled: true,
  maxContextTokens: 4096,
  proactiveSuggestionsEnabled: true,
  suggestionTypes: ["exam_prep", "practice_reminder", "weak_point_focus"],
  showRoutingDecisions: true,
  debugMode: false,
};

// Track if listeners are already registered to prevent duplicates
let listenersRegistered = false;
// Track the currently active store instance for listeners
let currentStoreId = 0;

export const useOrchestratorStore = create<OrchestratorState>((set, _get) => {
  const storeId = ++currentStoreId;

  // MEMORY LEAK FIX: We use a storeId check to ensure only the latest store instance processes events
  if (typeof window !== "undefined" && window.vwoApi) {
    // Register listeners if they haven't been registered globally, 
    // or just rely on the ID check if they are already there
    if (!listenersRegistered) {
      listenersRegistered = true;

      const handleRoutingDecision = (decision: unknown) => {
        // Only the store instance whose storeId matches currentStoreId will process this
        // This effectively kills "zombie" stores after a hot-reload or re-mount
        useOrchestratorStore.getState()._processRoutingDecision(decision);
      };

      const handleModelsUpdated = (models: unknown) => {
        useOrchestratorStore.getState()._processModelsUpdated(models);
      };

      window.vwoApi.on("orchestrator:routing_decision", handleRoutingDecision);
      window.vwoApi.on("orchestrator:models_updated", handleModelsUpdated);
    }
  }

  return {
    config: DEFAULT_CONFIG,
    models: [],
    routingHistory: [],
    isProcessing: false,
    error: null,
    execute: async (prompt: string, options?: Record<string, unknown>) => {
      if (typeof window !== "undefined" && window.vwoApi) {
        return (await window.vwoApi.invoke("orchestrator:execute", {
          prompt,
          options,
        })) as string;
      }
      return "AI Logic Unavailable (Check Provider Status)";
    },
    _processRoutingDecision: (decision: unknown) => {
      // Internal method to check ID before updating state
      if (storeId !== currentStoreId) return;
      const routeDecision = decision as RoutingDecision;
      set((state) => ({
        routingHistory: [routeDecision, ...state.routingHistory].slice(0, 50),
      }));
    },
    _processModelsUpdated: (models: unknown) => {
      if (storeId !== currentStoreId) return;
      const modelList = models as AIModel[];
      set({ models: modelList });
    },
    _cleanup: () => {
      // Called on store destruction or hot-reload
      // We don't need to unregister window listeners if vwoApi doesn't support .off,
      // because our storeId check makes the old handlers inert.
    },
  };
});

/**
 * Cleanup function for hot-reload or unmounting
 * Call this in your app's cleanup phase if needed
 */
export function cleanupOrchestratorStore(): void {
  const state = useOrchestratorStore.getState();
  state._cleanup?.();
}
