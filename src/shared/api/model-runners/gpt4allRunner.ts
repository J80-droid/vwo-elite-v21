/**
 * GPT4All Model Runner
 * Integration with GPT4All local API
 */

import type { AIModel, AIResponse, TaskIntent } from "../../types/ai-brain";

interface GPT4AllModel {
  id: string;
  object: string;
  owned_by: string;
  permission: unknown[];
}

export class GPT4AllRunner {
  private baseUrl: string;

  constructor(baseUrl: string = "http://localhost:4891/v1") {
    this.baseUrl = baseUrl;
  }

  /**
   * Check if GPT4All is reachable
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        signal: AbortSignal.timeout(2000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Generate completion
   */
  async generate(
    model: AIModel,
    prompt: string,
    options: {
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
      intent?: TaskIntent;
    } = {},
  ): Promise<AIResponse> {
    const messages = [];

    if (options.systemPrompt) {
      messages.push({ role: "system", content: options.systemPrompt });
    }

    messages.push({ role: "user", content: prompt });

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model.modelId,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2048,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GPT4All API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "";

    return {
      content,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
    };
  }

  /**
   * Discover available models in GPT4All
   */
  async discoverModels(): Promise<Partial<AIModel>[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`);
      if (!response.ok) return [];

      const data = await response.json();
      return (data.data || []).map((m: GPT4AllModel) => ({
        name: m.id,
        modelId: m.id,
        provider: "gpt4all",
        capabilities: this.inferCapabilities(m.id),
        enabled: true,
      }));
    } catch {
      return [];
    }
  }

  private inferCapabilities(modelId: string): string[] {
    const caps = ["fast"];
    const id = modelId.toLowerCase();

    if (id.includes("vision") || id.includes("llava")) caps.push("vision");
    if (id.includes("instruct") || id.includes("chat")) caps.push("reasoning");
    if (id.includes("coder") || id.includes("python")) caps.push("code");

    return caps;
  }
}

let instance: GPT4AllRunner | null = null;

export function getGPT4AllRunner(): GPT4AllRunner {
  if (!instance) {
    instance = new GPT4AllRunner();
  }
  return instance;
}
