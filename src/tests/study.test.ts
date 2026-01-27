/* eslint-disable @typescript-eslint/no-explicit-any -- dynamic mocks and service responses */
import * as studyService from "@shared/api/gemini/study";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGenerateContent = vi.fn();
vi.mock("@shared/api/geminiBase", () => ({
  getGeminiAPI: vi.fn(() => ({
    models: {
      generateContent: mockGenerateContent,
    },
  })),
}));

vi.mock("@shared/api/aiCascadeService", () => ({
  aiGenerateJSON: vi.fn(),
  getAvailableProviders: vi.fn(() => ["groq"]),
}));

vi.mock("@shared/api/gemini/helpers", () => ({
  getLangName: vi.fn(() => "Dutch"),
  retryOperation: (fn: any) => fn(),
}));

describe("Study Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateStudyPlan", () => {
    it("should generate a plan via cascade", async () => {
      const mockPlan = [
        {
          id: "1",
          subject: "Math",
          topic: "Algebra",
          date: "2024-01-01",
          durationMinutes: 60,
          type: "practice",
        },
      ];
      const { aiGenerateJSON } = await import("@shared/api/aiCascadeService");
      (aiGenerateJSON as any).mockResolvedValue(mockPlan);

      const result = await studyService.generateStudyPlan(
        "Math",
        "2024-02-01",
        "Ch 1",
        "60min",
        "High",
        "nl",
      );
      expect(result).toHaveLength(1);
      expect(result![0].subject).toBe("Math");
    });
  });

  describe("generateLesson", () => {
    it("should generate text-only lesson via cascade", async () => {
      const mockLesson = {
        title: "Lesson 1",
        summary: "Summary",
        keyConcepts: ["Concept"],
        sections: [{ heading: "H1", content: "C1", imagePrompt: "Prompt" }],
        practiceQuestions: ["Q1"],
      };
      const { aiGenerateJSON } = await import("@shared/api/aiCascadeService");
      (aiGenerateJSON as any).mockResolvedValue(mockLesson);

      const result = await studyService.generateLesson(
        [
          {
            name: "doc",
            content: "text",
            type: "txt",
            id: "1",
            subject: "Math",
            date: "2024-01-01",
            createdAt: 12345,
          },
        ],
        "Math",
        "nl",
      );
      expect(result.title).toBe("Lesson 1");
      expect(aiGenerateJSON).toHaveBeenCalled();
    });
  });
});
