/**
 * useModels Hook - Dynamic model discovery and selection
 */
import { resolveModel } from "@shared/lib/modelDefaults";
import { useAIStatusStore } from "@shared/model/aiStatusStore";
import { useModelsStore } from "@shared/model/modelsStore";
import type { CustomAIProvider, ModelInfo } from "@shared/types/config";
import { useCallback } from "react";

import { useSettings } from "./useSettings";

export const useModels = () => {
  const { settings, updateSettings } = useSettings();
  const {
    availableModels,
    isLoading,
    errors,
    refreshGeminiModels: storeRefreshGemini,
    refreshGroqModels: storeRefreshGroq,
    refreshKimiModels: storeRefreshKimi,
    refreshOpenAIModels: storeRefreshOpenAI,
    refreshCohereModels: storeRefreshCohere,
    refreshAnthropicModels: storeRefreshAnthropic,
    refreshOpenRouterModels: storeRefreshOpenRouter,
    refreshDeepSeekModels: storeRefreshDeepSeek,
    refreshMistralModels: storeRefreshMistral,
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

  // Fetch available models from Kimi API
  const refreshKimiModels = useCallback(async () => {
    const apiKey = settings.aiConfig?.kimiApiKey;
    if (!apiKey) return;
    await storeRefreshKimi(apiKey);
  }, [settings.aiConfig?.kimiApiKey, storeRefreshKimi]);

  // Fetch available models from OpenAI API
  const refreshOpenAIModels = useCallback(async () => {
    const apiKey = settings.aiConfig?.openaiApiKey;
    if (!apiKey) return;
    await storeRefreshOpenAI(apiKey);
  }, [settings.aiConfig?.openaiApiKey, storeRefreshOpenAI]);

  // Fetch available models from Cohere API
  const refreshCohereModels = useCallback(async () => {
    const apiKey = settings.aiConfig?.cohereApiKey;
    if (!apiKey) return;
    await storeRefreshCohere(apiKey);
  }, [settings.aiConfig?.cohereApiKey, storeRefreshCohere]);

  // Fetch available models from Anthropic API
  const refreshAnthropicModels = useCallback(async () => {
    const apiKey = settings.aiConfig?.anthropicApiKey;
    if (!apiKey) return;
    await storeRefreshAnthropic(apiKey);
  }, [settings.aiConfig?.anthropicApiKey, storeRefreshAnthropic]);

  // Fetch available models from OpenRouter API
  const refreshOpenRouterModels = useCallback(async () => {
    const apiKey = settings.aiConfig?.openRouterApiKey;
    if (!apiKey) return;
    await storeRefreshOpenRouter(apiKey);
  }, [settings.aiConfig?.openRouterApiKey, storeRefreshOpenRouter]);

  // Fetch available models from DeepSeek API
  const refreshDeepSeekModels = useCallback(async () => {
    const apiKey = settings.aiConfig?.deepSeekApiKey;
    if (!apiKey) return;
    await storeRefreshDeepSeek(apiKey);
  }, [settings.aiConfig?.deepSeekApiKey, storeRefreshDeepSeek]);

  // Fetch available models from Mistral API
  const refreshMistralModels = useCallback(async () => {
    const apiKey = settings.aiConfig?.mistralApiKey;
    if (!apiKey) return;
    await storeRefreshMistral(apiKey);
  }, [settings.aiConfig?.mistralApiKey, storeRefreshMistral]);

  // Fetch available models from a Custom Provider
  const refreshCustomModels = useCallback(
    async (provider: CustomAIProvider) => {
      await storeRefreshCustom(provider);
    },
    [storeRefreshCustom],
  );

  const getModel = useCallback(
    (provider: "gemini" | "groq" | "huggingface" | "kimi" | "openai" | "cohere" | "anthropic" | "openrouter" | "deepseek" | "mistral" | "replicate" | "hume", type: string): string => {
      // Use the newly refactored resolveModel with dynamic context
      const providerModels = (availableModels as unknown as Record<string, ModelInfo[] | string[]>)[provider] || [];
      return resolveModel(provider, type, settings.aiConfig, providerModels);
    },
    [settings.aiConfig, availableModels],
  );

  /**
   * ELITE UTILITY: Get the best model that supports standard REST calls (generateContent).
   * Crucial for Voice Previews and other non-streaming tasks.
   */
  const getBestRESTModel = useCallback(
    (provider: "gemini" | "groq" | "huggingface" | "kimi" | "openai" | "cohere" | "anthropic" | "openrouter" | "deepseek" | "mistral" | "replicate" | "hume"): string => {
      const providerModels = (availableModels as unknown as Record<string, ModelInfo[] | string[]>)[provider] || [];
      return resolveModel(provider, "chat", settings.aiConfig, providerModels);
    },
    [settings.aiConfig, availableModels],
  );

  // Update custom provider specific model
  const setCustomModel = useCallback(
    (providerId: string, type: string, modelName: string) => {
      const updatedProviders = settings.aiConfig?.customProviders?.map(
        (p: CustomAIProvider) =>
          p.id === providerId
            ? { ...p, models: { ...p.models, [type]: modelName } }
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
      provider: "gemini" | "groq" | "huggingface" | "kimi" | "openai" | "cohere" | "anthropic" | "openrouter" | "deepseek" | "mistral" | "replicate" | "hume",
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
    errors,
    refreshGeminiModels,
    refreshGroqModels,
    refreshKimiModels,
    refreshOpenAIModels,
    refreshCohereModels,
    refreshAnthropicModels,
    refreshOpenRouterModels,
    refreshDeepSeekModels,
    refreshMistralModels,
    refreshCustomModels,
    getModel,
    getBestRESTModel,
    setModel,
    setCustomModel,
  };
};
