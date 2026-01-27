import * as chatService from "@shared/api/gemini/chat";
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
  aiGenerateJSON: vi.fn().mockResolvedValue({
    summary: "Summary",
    questions: [],
    devilsAdvocate: "",
  }),
}));

describe("Chat Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("chatWithSocraticCoach", () => {
    it("should send history and message to AI", async () => {
      mockGenerateContent.mockResolvedValue({ text: "Coach response" });

      const history = [{ role: "user", parts: [{ text: "Hi" }] }];
      const response = await chatService.chatWithSocraticCoach(
        history,
        "My question",
        "nl",
      );

      expect(response).toBe("Coach response");
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.arrayContaining([
            expect.objectContaining({
              role: "user",
              parts: [{ text: "My question" }],
            }),
          ]),
        }),
      );
    });
  });

  describe("generateChatSummary", () => {
    it("should return summary JSON", async () => {
      const mockSummary = {
        topic: "Physics",
        summary: "Discussed gravity",
        actionItems: ["Read ch. 4"],
      };
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockSummary),
      });

      const result = await chatService.generateChatSummary([], "nl");
      expect(result.topic).toBe("Physics");
    });
  });
});
