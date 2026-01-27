/* eslint-disable @typescript-eslint/no-explicit-any -- dynamic mocks and test configuration casts */
import { cascadeGenerate, getCascade } from "@shared/api/aiCascadeService";
import * as dynamicService from "@shared/api/dynamicAIService";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AIConfig, CustomAIProvider } from "../types";

describe("aiCascadeService with Custom Providers", () => {
  const mockCustomProvider: CustomAIProvider = {
    id: "cp1",
    name: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    apiKey: "ds-key",
    enabled: true,
    models: { chat: "deepseek-chat" },
  };

  const mockAIConfig: AIConfig = {
    persona: "socratic",
    customProviders: [mockCustomProvider],
  } as any;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("includes enabled custom providers in the cascade", () => {
    const cascade = getCascade(mockAIConfig);
    const hasCustom = cascade.some((c) => String(c.provider) === "custom:cp1");
    expect(hasCustom).toBe(true);

    // Priority should be between Groq (2) and HF (3)
    const customEntry = cascade.find(
      (c) => String(c.provider) === "custom:cp1",
    );
    expect(customEntry?.priority).toBeGreaterThan(2);
    expect(customEntry?.priority).toBeLessThan(3);
  });

  it("calls dynamicAIService when custom provider is reached in cascade", async () => {
    const spy = vi.spyOn(dynamicService, "generateCustomCompletion");
    spy.mockResolvedValueOnce("DeepSeek response");

    // Force a cascade that only has the custom provider or starts with it
    const customCascade = [
      { provider: "custom:cp1" as any, model: "deepseek-chat", priority: 1 },
    ];

    const result = await cascadeGenerate("Hello", "System", {
      cascade: customCascade,
      aiConfig: mockAIConfig,
    });

    expect(result).toBe("DeepSeek response");
    expect(spy).toHaveBeenCalledWith(
      mockCustomProvider,
      expect.any(Array),
      expect.any(Object),
    );
  });

  it("skips disabled custom providers", () => {
    const disabledConfig = {
      ...mockAIConfig,
      customProviders: [{ ...mockCustomProvider, enabled: false }],
    };
    const cascade = getCascade(disabledConfig);
    const hasCustom = cascade.some((c) => String(c.provider) === "custom:cp1");
    expect(hasCustom).toBe(false);
  });
});
