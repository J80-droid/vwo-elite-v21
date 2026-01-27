/**
 * Model Registry Store
 * Zustand store for managing AI models, presets, and configuration
 */

import { createStore } from "@shared/lib/storeFactory";
import type {
  AIModel,
  AIPreset,
  ModelCapability,
  ModelMetrics,
  ModelProvider,
} from "@shared/types/ai-brain";

// =============================================================================
// DEFAULT PRESETS
// =============================================================================

const DEFAULT_PRESETS: AIPreset[] = [
  {
    id: "preset-fast",
    name: "Snel",
    type: "fast",
    description:
      "Snelle antwoorden met lichte modellen. Ideaal voor simpele vragen.",
    modelAssignments: {},
    maxParallelCloud: 5,
    localExecution: "linear",
    fallbackEnabled: true,
    isDefault: false,
    isBuiltIn: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "preset-quality",
    name: "Kwaliteit",
    type: "quality",
    description: "Beste resultaten met krachtige modellen. Kan langer duren.",
    modelAssignments: {},
    maxParallelCloud: 3,
    localExecution: "linear",
    fallbackEnabled: true,
    isDefault: false,
    isBuiltIn: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "preset-private",
    name: "Privacy",
    type: "private",
    description: "Alleen lokale modellen. Geen data naar de cloud.",
    modelAssignments: {},
    maxParallelCloud: 0,
    localExecution: "linear",
    fallbackEnabled: false,
    isDefault: true,
    isBuiltIn: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "preset-exam",
    name: "Examen Modus",
    type: "exam",
    description: "Optimale instellingen voor examenvoorbereiding.",
    modelAssignments: {},
    maxParallelCloud: 3,
    localExecution: "linear",
    fallbackEnabled: true,
    isDefault: false,
    isBuiltIn: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "preset-cost",
    name: "Kosten Besparen",
    type: "cost_saver",
    description:
      "Minimaliseert API kosten door gratis/goedkope modellen te prefereren.",
    modelAssignments: {},
    maxParallelCloud: 2,
    localExecution: "linear",
    fallbackEnabled: true,
    isDefault: false,
    isBuiltIn: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

// =============================================================================
// STORE STATE
// =============================================================================

interface ModelRegistryState {
  // Models
  models: AIModel[];

  // Presets
  presets: AIPreset[];
  activePresetId: string;

  // Auto mode
  autoModeEnabled: boolean;

  // Module-specific overrides
  modulePresets: Record<string, string>; // moduleId -> presetId

  // Actions
  addModel: (model: Omit<AIModel, "id" | "createdAt" | "metrics">) => string;
  updateModel: (id: string, updates: Partial<AIModel>) => void;
  removeModel: (id: string) => void;
  toggleModel: (id: string) => void;

  // Preset actions
  addPreset: (
    preset: Omit<AIPreset, "id" | "createdAt" | "updatedAt">,
  ) => string;
  updatePreset: (id: string, updates: Partial<AIPreset>) => void;
  removePreset: (id: string) => void;
  setActivePreset: (id: string) => void;
  setModulePreset: (moduleId: string, presetId: string) => void;

  // Model metrics
  updateModelMetrics: (id: string, metrics: Partial<ModelMetrics>) => void;
  recordModelSuccess: (
    id: string,
    responseTimeMs: number,
    tokens: number,
  ) => void;
  recordModelError: (id: string, error: string) => void;

  // Getters
  getModel: (id: string) => AIModel | undefined;
  getActivePreset: () => AIPreset;
  getPresetForModule: (moduleId: string) => AIPreset;
  getModelsWithCapability: (capability: ModelCapability) => AIModel[];
  getEnabledModels: () => AIModel[];
  getBestModelForCapability: (
    capability: ModelCapability,
  ) => AIModel | undefined;

  // Auto mode
  setAutoMode: (enabled: boolean) => void;

  // Discovery
  importDiscoveredModels: (models: Partial<AIModel>[]) => void;

  // Onboarding
  onboardingComplete: boolean;
  setOnboardingComplete: (complete: boolean) => void;
  systemSpecs?: import("@shared/lib/hardwareDetector").SystemSpecs;
  setSystemSpecs: (
    specs: import("@shared/lib/hardwareDetector").SystemSpecs,
  ) => void;
}

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useModelRegistryStore = createStore<ModelRegistryState>(
  (set, get) => ({
    // Initial state
    models: [],
    presets: DEFAULT_PRESETS,
    activePresetId: "preset-private",
    autoModeEnabled: true,
    modulePresets: {},
    onboardingComplete: true, // v21.3 strategy: Move wizard to settings
    systemSpecs: undefined,

    setOnboardingComplete: (complete) =>
      set({ onboardingComplete: complete }),
    setSystemSpecs: (specs) => set({ systemSpecs: specs }),

    // =========================
    // MODEL ACTIONS
    // =========================

    addModel: (modelData) => {
      const id = `model-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const model: AIModel = {
        ...modelData,
        id,
        createdAt: Date.now(),
        metrics: {
          avgResponseMs: 0,
          successRate: 1.0,
          totalRequests: 0,
          totalTokens: 0,
        },
      };

      set((state) => ({
        models: [...state.models, model],
      }));

      return id;
    },

    updateModel: (id, updates) => {
      set((state) => ({
        models: state.models.map((m) =>
          m.id === id ? { ...m, ...updates } : m,
        ),
      }));
    },

    removeModel: (id) => {
      set((state) => ({
        models: state.models.filter((m) => m.id !== id),
      }));
    },

    toggleModel: (id) => {
      set((state) => ({
        models: state.models.map((m) =>
          m.id === id ? { ...m, enabled: !m.enabled } : m,
        ),
      }));
    },

    // =========================
    // PRESET ACTIONS
    // =========================

    addPreset: (presetData) => {
      const id = `preset-custom-${Date.now()}`;
      const preset: AIPreset = {
        ...presetData,
        id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      set((state) => ({
        presets: [...state.presets, preset],
      }));

      return id;
    },

    updatePreset: (id, updates) => {
      set((state) => ({
        presets: state.presets.map((p) =>
          p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p,
        ),
      }));
    },

    removePreset: (id) => {
      const preset = get().presets.find((p) => p.id === id);
      if (preset?.isBuiltIn) return; // Can't remove built-in presets

      set((state) => ({
        presets: state.presets.filter((p) => p.id !== id),
        // If removing active preset, switch to default
        activePresetId:
          state.activePresetId === id
            ? "preset-private"
            : state.activePresetId,
      }));
    },

    setActivePreset: (id) => {
      set({ activePresetId: id });
    },

    setModulePreset: (moduleId, presetId) => {
      set((state) => ({
        modulePresets: {
          ...state.modulePresets,
          [moduleId]: presetId,
        },
      }));
    },

    // =========================
    // METRICS ACTIONS
    // =========================

    updateModelMetrics: (id, metrics) => {
      set((state) => ({
        models: state.models.map((m) =>
          m.id === id ? { ...m, metrics: { ...m.metrics, ...metrics } } : m,
        ),
      }));
    },

    recordModelSuccess: (id, responseTimeMs, tokens) => {
      const model = get().models.find((m) => m.id === id);
      if (!model) return;

      const newTotal = model.metrics.totalRequests + 1;
      const newAvgTime =
        (model.metrics.avgResponseMs * model.metrics.totalRequests +
          responseTimeMs) /
        newTotal;

      set((state) => ({
        models: state.models.map((m) =>
          m.id === id
            ? {
              ...m,
              lastUsedAt: Date.now(),
              metrics: {
                ...m.metrics,
                totalRequests: newTotal,
                totalTokens: m.metrics.totalTokens + tokens,
                avgResponseMs: Math.round(newAvgTime),
                // Slightly increase success rate (moving average)
                successRate: Math.min(
                  1,
                  m.metrics.successRate * 0.95 + 0.05,
                ),
              },
            }
            : m,
        ),
      }));
    },

    recordModelError: (id, error) => {
      set((state) => ({
        models: state.models.map((m) =>
          m.id === id
            ? {
              ...m,
              metrics: {
                ...m.metrics,
                totalRequests: m.metrics.totalRequests + 1,
                // Decrease success rate on error
                successRate: Math.max(0, m.metrics.successRate * 0.9),
                lastError: error,
                lastErrorAt: Date.now(),
              },
            }
            : m,
        ),
      }));
    },

    // =========================
    // GETTERS
    // =========================

    getModel: (id) => get().models.find((m) => m.id === id),

    getActivePreset: () => {
      const { presets, activePresetId } = get();
      return presets.find((p) => p.id === activePresetId) || presets[0]!;
    },

    getPresetForModule: (moduleId) => {
      const { presets, modulePresets } = get();
      const modulePresetId = modulePresets[moduleId];
      if (modulePresetId) {
        const preset = presets.find((p) => p.id === modulePresetId);
        if (preset) return preset;
      }
      return get().getActivePreset();
    },

    getModelsWithCapability: (capability) => {
      return get().models.filter(
        (m) => m.enabled && m.capabilities.includes(capability),
      );
    },

    getEnabledModels: () => {
      return get().models.filter((m) => m.enabled);
    },

    getBestModelForCapability: (capability) => {
      const models = get().getModelsWithCapability(capability);
      if (models.length === 0) return undefined;

      // Sort by: priority (desc) → success rate (desc) → avg time (asc)
      return models.sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        if (b.metrics.successRate !== a.metrics.successRate) {
          return b.metrics.successRate - a.metrics.successRate;
        }
        return a.metrics.avgResponseMs - b.metrics.avgResponseMs;
      })[0];
    },

    // =========================
    // AUTO MODE
    // =========================

    setAutoMode: (enabled) => {
      set({ autoModeEnabled: enabled });
    },

    // =========================
    // DISCOVERY
    // =========================

    importDiscoveredModels: (discoveredModels) => {
      const existingIds = new Set(get().models.map((m) => m.modelId));

      discoveredModels.forEach((discovered) => {
        // Skip if already exists
        if (discovered.modelId && existingIds.has(discovered.modelId)) {
          return;
        }

        get().addModel({
          name: discovered.name || "Unknown Model",
          provider: discovered.provider || "custom",
          modelId: discovered.modelId || `unknown-${Date.now()}`,
          endpoint: discovered.endpoint,
          localPath: discovered.localPath,
          capabilities: discovered.capabilities || ["fast"],
          requirements: discovered.requirements || {},
          enabled: false, // Disabled by default until user enables
          priority: 50,
        });
      });
    },
  }),
  {
    name: "model-registry",
  }
);

// =============================================================================
// HELPER HOOKS
// =============================================================================

/**
 * Get models grouped by provider
 */
export function useModelsByProvider(): Record<ModelProvider, AIModel[]> {
  const models = useModelRegistryStore((s) => s.models);

  const grouped: Record<ModelProvider, AIModel[]> = {
    gemini: [],
    openai: [],
    anthropic: [],
    groq: [],
    ollama: [],
    lm_studio: [],
    gpt4all: [],
    custom: [],
  };

  models.forEach((model) => {
    grouped[model.provider].push(model);
  });

  return grouped;
}

/**
 * Get count of enabled models
 */
export function useEnabledModelCount(): number {
  return useModelRegistryStore((s) => s.models.filter((m) => m.enabled).length);
}

/**
 * Check if any local model is configured
 */
export function useHasLocalModels(): boolean {
  return useModelRegistryStore((s) =>
    s.models.some(
      (m) =>
        m.enabled &&
        ["ollama", "lm_studio", "gpt4all", "custom"].includes(m.provider),
    ),
  );
}
