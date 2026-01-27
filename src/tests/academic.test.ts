/* eslint-disable @typescript-eslint/no-explicit-any -- dynamic mocks and test data */
import * as academicService from "@shared/api/gemini/academic";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock Dependencies
const mockGenerateContent = vi.fn();
vi.mock("../services/geminiBase", () => ({
  getGeminiAPI: vi.fn(() => ({
    models: {
      generateContent: mockGenerateContent,
    },
  })),
}));

vi.mock("../services/aiCascadeService", () => ({
  aiGenerate: vi.fn(),
  aiGenerateJSON: vi.fn(),
  cascadeGenerate: vi.fn(),
  getAvailableProviders: vi.fn(() => []),
}));

vi.mock("../services/gemini/helpers", () => ({
  getLangName: vi.fn(() => "Dutch"),
  retryOperation: (fn: any) => fn(),
}));

describe("Academic Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("evaluateSource", () => {
    it("should return parsed JSON source evaluation", async () => {
      const mockResponse = {
        text: JSON.stringify({
          score: 8,
          reliability: "High",
          bias: "none",
          fallacies: [],
          authorIntent: "Inform",
          analysis: "Good",
        }),
      };
      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await academicService.evaluateSource("Some text", "nl");
      expect(result.score).toBe(8);
      expect(mockGenerateContent).toHaveBeenCalled();
    });

    it("should handle JSON parse errors gracefully", async () => {
      mockGenerateContent.mockResolvedValue({ text: "Invalid JSON" });
      // The service catches internally or we expect it to fail?
      // Looking at code: return JSON.parse(response.text || 'default')
      // It might throw if invalid json is returned entirely without try/catch inside
      // But let's check the code: Logic is `JSON.parse` directly.
      // So this test expects failure unless code is wrapped.
      // Wait, the code I read does NOT have try/catch blocks for `evaluateSource`.
      // So checking success path first.
      const result = await academicService
        .evaluateSource("Text", "nl")
        .catch(() => "error");
      expect(result).toBe("error");
    });
  });

  describe("summarizePaper", () => {
    it("should return a summary text", async () => {
      mockGenerateContent.mockResolvedValue({ text: "Summary content" });
      const result = await academicService.summarizePaper("Long paper", "nl");
      expect(result).toBe("Summary content");
    });
  });

  describe("checkOriginality", () => {
    it("should return feedback string", async () => {
      mockGenerateContent.mockResolvedValue({ text: "Original content" });
      const result = await academicService.checkOriginality(
        "My text",
        [],
        "nl",
      );
      expect(result).toBe("Original content");
    });
  });
});
