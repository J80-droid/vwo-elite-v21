/* eslint-disable @typescript-eslint/no-explicit-any -- dynamic mocks and store error state checks */
import { cascadeGenerate } from "@shared/api/aiCascadeService";
import { useAIStatusStore } from "@shared/model/aiStatusStore";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock Providers
vi.mock("../services/groqService", () => ({
  isGroqConfigured: vi.fn(() => true),
  groqGenerate: vi.fn(),
}));

vi.mock("../services/huggingFaceService", () => ({
  isHFTextConfigured: vi.fn(() => true),
  generateHFText: vi.fn(),
}));

vi.mock("../services/geminiBase", () => ({
  geminiGenerate: vi.fn(),
  checkGeminiHealth: vi.fn(),
}));

vi.mock("../services/configService", () => ({
  getAIConfig: vi.fn().mockResolvedValue({
    routing: [
      {
        provider: "gemini",
        model: "invalid-model",
        priority: 1,
        enabled: true,
      },
    ],
  }),
}));

describe("AI Model Error Notification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAIStatusStore.getState().clearModelError();
  });

  it("sets model error in store when Gemini returns 404", async () => {
    const { geminiGenerate } = await import("@shared/api/geminiBase");
    (geminiGenerate as any).mockRejectedValue(new Error("404 Model not found"));

    try {
      await cascadeGenerate("test");
    } catch {
      // expected
    }

    const error = useAIStatusStore.getState().modelError;
    expect(error).not.toBeNull();
    expect(error?.provider).toBe("gemini");
    expect(error?.message).toContain("Model niet beschikbaar");
  });

  it("sets model error in store when Groq returns 404", async () => {
    // Force Groq to be tried
    const { getAIConfig } = await import("@shared/api/configService");
    (getAIConfig as any).mockResolvedValue({
      routing: [
        {
          provider: "groq",
          model: "bad-groq-model",
          priority: 1,
          enabled: true,
        },
      ],
    });

    const { groqGenerate } = await import("@shared/api/groqService");
    (groqGenerate as any).mockRejectedValue(new Error("404 Not Found"));

    try {
      await cascadeGenerate("test");
    } catch {
      // expected
    }

    const error = useAIStatusStore.getState().modelError;
    expect(error).not.toBeNull();
    expect(error?.provider).toBe("groq");
    expect(error?.message).toContain("Model niet gevonden");
  });

  it("sets model error in store when HuggingFace returns 404", async () => {
    const { getAIConfig } = await import("@shared/api/configService");
    (getAIConfig as any).mockResolvedValue({
      routing: [
        {
          provider: "huggingface",
          model: "bad/hf-model",
          priority: 1,
          enabled: true,
        },
      ],
    });

    const { generateHFText } = await import("@shared/api/huggingFaceService");
    (generateHFText as any).mockRejectedValue(new Error("404 Model not found"));

    try {
      await cascadeGenerate("test");
    } catch {
      // expected
    }

    const error = useAIStatusStore.getState().modelError;
    expect(error).not.toBeNull();
    expect(error?.provider).toBe("huggingface");
    expect(error?.message).toContain("HuggingFace model niet gevonden");
  });
});
