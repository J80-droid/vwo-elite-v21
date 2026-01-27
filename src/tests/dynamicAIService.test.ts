/* eslint-disable @typescript-eslint/no-explicit-any -- dynamic fetch mocks and API responses */
import {
  fetchCustomModels,
  generateCustomCompletion,
} from "@shared/api/dynamicAIService";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CustomAIProvider } from "../types";

describe("dynamicAIService", () => {
  const mockProvider: CustomAIProvider = {
    id: "test-host",
    name: "Test Provider",
    baseUrl: "https://api.test.com/v1",
    apiKey: "test-key",
    enabled: true,
    models: { chat: "test-model" },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
  });

  it("generates completion via OpenAI-compatible API", async () => {
    const mockResponse = {
      choices: [{ message: { content: "Hello from test" } }],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await generateCustomCompletion(mockProvider, [
      { role: "user", content: "Hi" },
    ]);

    expect(result).toBe("Hello from test");
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.test.com/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-key",
          "Content-Type": "application/json",
        }),
      }),
    );
  });

  it("fetches models correctly", async () => {
    const mockModelsResponse = {
      data: [{ id: "model-1" }, { id: "model-2" }],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockModelsResponse,
    });

    const models = await fetchCustomModels(mockProvider);

    expect(models).toEqual(["model-1", "model-2"]);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.test.com/v1/models",
      expect.any(Object),
    );
  });

  it("handles API errors gracefully", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    });

    await expect(generateCustomCompletion(mockProvider, [])).rejects.toThrow(
      "[Test Provider] API error: 401 - Unauthorized",
    );
  });
});
