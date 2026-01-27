/* eslint-disable @typescript-eslint/no-explicit-any -- dynamic mocks and service status store interactions */
import { aiGenerateJSON, cascadeGenerate } from "@shared/api/aiCascadeService";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock Dependencies
vi.mock("../services/groqService", () => ({
  isGroqConfigured: vi.fn(() => true),
  groqGenerate: vi.fn(),
  GROQ_MODELS: { LLAMA_8B: "llama-8b" },
}));

vi.mock("../services/huggingFaceService", () => ({
  isHFTextConfigured: vi.fn(() => true),
  generateHFText: vi.fn(),
  TEXT_MODELS: { QWEN_7B: "qwen-7b" },
}));

vi.mock("../services/configService", () => ({
  getAIConfig: vi.fn().mockResolvedValue({
    routing: [
      { provider: "gemini", model: "gemini-1", priority: 1, enabled: true },
      { provider: "groq", model: "groq-1", priority: 2, enabled: true },
    ],
  }),
}));

vi.mock("../services/geminiBase", () => ({
  geminiGenerate: vi.fn(),
  API_KEY: "mock-key",
}));

describe("aiCascadeService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("successfully generates text using the first provider", async () => {
    const { geminiGenerate } = await import("@shared/api/geminiBase");
    (geminiGenerate as any).mockResolvedValue("Gemini Response");

    const result = await cascadeGenerate("Hello");
    expect(result).toBe("Gemini Response");
    expect(geminiGenerate).toHaveBeenCalled();
  });

  it("falls back to the second provider if the first fails", async () => {
    const { geminiGenerate } = await import("@shared/api/geminiBase");
    const { groqGenerate } = await import("@shared/api/groqService");

    (geminiGenerate as any).mockRejectedValue(new Error("Gemini Down"));
    (groqGenerate as any).mockResolvedValue("Groq Response");

    const result = await cascadeGenerate("Hello");
    expect(result).toBe("Groq Response");
    expect(geminiGenerate).toHaveBeenCalled();
    expect(groqGenerate).toHaveBeenCalled();
  });

  it("throws error if all providers fail", async () => {
    const { geminiGenerate } = await import("@shared/api/geminiBase");
    const { groqGenerate } = await import("@shared/api/groqService");

    (geminiGenerate as any).mockRejectedValue(new Error("Error 1"));
    (groqGenerate as any).mockRejectedValue(new Error("Error 2"));

    await expect(cascadeGenerate("Hello")).rejects.toThrow(
      "All providers failed",
    );
  });

  it("parses JSON correctly with aiGenerateJSON", async () => {
    const { geminiGenerate } = await import("@shared/api/geminiBase");
    (geminiGenerate as any).mockResolvedValue('```json\n{"test": true}\n```');

    const result = await aiGenerateJSON<{ test: boolean }>("Get JSON");
    expect(result.test).toBe(true);
  });

  it("handles failure to parse JSON", async () => {
    const { geminiGenerate } = await import("@shared/api/geminiBase");
    (geminiGenerate as any).mockResolvedValue("Invalid JSON");

    await expect(aiGenerateJSON("Get JSON")).rejects.toThrow(
      "Failed to parse AI response as JSON",
    );
  });
});
