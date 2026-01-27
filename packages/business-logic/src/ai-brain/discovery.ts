import type { AIModel, ModelCapability } from "@vwo/shared-types";

export interface DiscoveryResult {
  provider: string;
  available: boolean;
  models: Partial<AIModel>[];
  error?: string;
}

export const KNOWN_MODELS: Record<
  string,
  {
    displayName: string;
    capabilities: ModelCapability[];
    sizeGB: number;
    description: string;
  }
> = {
  "llama3.2:3b": {
    displayName: "Llama 3.2 (3B)",
    capabilities: ["fast", "reasoning"],
    sizeGB: 2.0,
    description: "Meta's efficient 3B model. Great for quick tasks.",
  },
  "llama3.1:8b": {
    displayName: "Llama 3.1 (8B)",
    capabilities: ["reasoning", "code"],
    sizeGB: 4.7,
    description: "Balanced performance and quality.",
  },
  "llava:7b": {
    displayName: "LLaVA (7B)",
    capabilities: ["vision", "reasoning"],
    sizeGB: 4.5,
    description: "Vision-language model for image analysis.",
  },
  "nomic-embed-text": {
    displayName: "Nomic Embed Text",
    capabilities: ["embedding"],
    sizeGB: 0.27,
    description: "Local text embeddings.",
  },
};

export function enhanceWithKnownData(
  model: Partial<AIModel>,
): Partial<AIModel> {
  const known = KNOWN_MODELS[model.modelId || ""];
  if (!known) return model;

  return {
    ...model,
    name: known.displayName,
    capabilities: [
      ...new Set([...(model.capabilities || []), ...known.capabilities]),
    ],
    requirements: {
      ...model.requirements,
      modelSizeGB: known.sizeGB,
    },
  };
}
