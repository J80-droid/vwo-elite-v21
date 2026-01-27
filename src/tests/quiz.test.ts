import * as quizService from "@shared/api/gemini/quiz";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGenerateContent = vi.fn();
vi.mock("../services/geminiBase", () => ({
  getGeminiAPI: vi.fn(() => ({
    models: {
      generateContent: mockGenerateContent,
    },
  })),
}));

vi.mock("../services/aiCascadeService", () => ({
  aiGenerateJSON: vi.fn().mockResolvedValue({
    questions: [{ question: "Q1", options: [], correctAnswer: 0 }],
  }),
}));

describe("Quiz Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateQuizFromMaterials", () => {
    it("should use cascade service first", async () => {
      const { aiGenerateJSON } = await import("@shared/api/aiCascadeService");
      const result = await quizService.generateQuizFromMaterials(
        [
          {
            name: "doc",
            content: "text",
            type: "txt",
            id: "1",
            subject: "Bio",
            date: "2024-01-01",
            createdAt: 12345,
          },
        ],
        "nl",
      );

      expect(aiGenerateJSON).toHaveBeenCalled();
      expect(result.questions).toHaveLength(1);
    });
  });

  describe("generateQuizQuestions", () => {
    it("should use gemini directly fallback", async () => {
      const mockQuiz = {
        questions: [{ question: "Gemini Q", options: [], correctAnswer: 0 }],
      };
      mockGenerateContent.mockResolvedValue({ text: JSON.stringify(mockQuiz) });

      const result = await quizService.generateQuizQuestions(
        "Math",
        "hard",
        "nl",
      );
      expect(result.questions[0].question).toBe("Gemini Q");
    });
  });
});
