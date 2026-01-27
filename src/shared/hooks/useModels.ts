/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any -- dynamic model configuration and user settings */
/**
 * useModels Hook - Dynamic model discovery and selection
 * Refactored to use centralized modelsStore for global state and auto-refresh
 */
import { DEFAULT_MODELS } from "@shared/lib/modelDefaults";
import { useAIStatusStore } from "@shared/model/aiStatusStore";
import { useModelsStore } from "@shared/model/modelsStore";
import { useCallback } from "react";

import { CustomAIProvider } from "../types";
import { useSettings } from "./useSettings";

export const useModels = () => {
  const { settings, updateSettings } = useSettings();
  const {
    availableModels,
    isLoading,
    error,
    refreshGeminiModels: storeRefreshGemini,
    refreshGroqModels: storeRefreshGroq,
    refreshCustomModels: storeRefreshCustom,
  } = useModelsStore();

  // Fetch available models from Gemini API
  const refreshGeminiModels = useCallback(async () => {
    const apiKey = settings.aiConfig?.geminiApiKey;
    if (!apiKey) return;
    await storeRefreshGemini(apiKey);
  }, [settings.aiConfig?.geminiApiKey, storeRefreshGemini]);

  // Fetch available models from Groq API
  const refreshGroqModels = useCallback(async () => {
    const apiKey = settings.aiConfig?.groqApiKey;
    if (!apiKey) return;
    await storeRefreshGroq(apiKey);
  }, [settings.aiConfig?.groqApiKey, storeRefreshGroq]);

  // Fetch available models from a Custom Provider
  const refreshCustomModels = useCallback(
    async (provider: CustomAIProvider) => {
      await storeRefreshCustom(provider);
    },
    [storeRefreshCustom],
  );

  const getModel = useCallback(
    (provider: "gemini" | "groq" | "huggingface", type: string): string => {
      const modelKey =
        `${provider}${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof NonNullable<
          typeof settings.aiConfig.models
        >;
      const userModel = settings.aiConfig?.models?.[modelKey];

      if (userModel) return userModel;

      // Return default
      switch (provider) {
        case "gemini":
          return (
            (DEFAULT_MODELS.gemini as any)[type] || DEFAULT_MODELS.gemini.chat
          );
        case "groq":
          return (DEFAULT_MODELS.groq as any)[type] || DEFAULT_MODELS.groq.fast;
        case "huggingface":
          return (
            (DEFAULT_MODELS.huggingface as any)[type] ||
            DEFAULT_MODELS.huggingface.image
          );
        default:
          return "";
      }
    },
    [settings.aiConfig?.models],
  );

  // Update custom provider specific model
  const setCustomModel = useCallback(
    (providerId: string, modelName: string) => {
      const updatedProviders = settings.aiConfig?.customProviders?.map(
        (p: CustomAIProvider) =>
          p.id === providerId
            ? { ...p, models: { ...p.models, chat: modelName } }
            : p,
      );

      updateSettings({
        aiConfig: {
          ...settings.aiConfig,
          customProviders: updatedProviders,
        },
      });
    },
    [settings.aiConfig, updateSettings],
  );

  // Update a specific model selection
  const setModel = useCallback(
    (
      provider: "gemini" | "groq" | "huggingface",
      type: string,
      modelName: string,
    ) => {
      const modelKey = `${provider}${type.charAt(0).toUpperCase() + type.slice(1)}`;

      updateSettings({
        aiConfig: {
          ...settings.aiConfig,
          models: {
            ...settings.aiConfig?.models,
            [modelKey]: modelName,
          },
        },
      });

      useAIStatusStore.getState().clearModelError();
    },
    [settings.aiConfig, updateSettings],
  );

  return {
    availableModels,
    isLoading,
    error,
    refreshGeminiModels,
    refreshGroqModels,
    refreshCustomModels,
    getModel,
    setModel,
    setCustomModel,
  };
};
