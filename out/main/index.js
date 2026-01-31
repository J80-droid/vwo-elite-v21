import { app, ipcMain, BrowserWindow, dialog, contentTracing, session } from "electron";
import fs, { existsSync, writeFileSync } from "fs";
import path, { join } from "path";
import "mathjs";
import { setup, assign, fromPromise } from "xstate";
import { EventEmitter } from "events";
import crypto$1 from "crypto";
import * as lancedb from "@lancedb/lancedb";
import Database from "better-sqlite3";
import { z } from "zod";
import { pipeline } from "@xenova/transformers";
import { Worker } from "worker_threads";
import JSZip from "jszip";
import __cjs_mod__ from "node:module";
const __filename = import.meta.filename;
const __dirname = import.meta.dirname;
const require2 = __cjs_mod__.createRequire(import.meta.url);
function classifyIntentByRules(query) {
  const normalizedQuery = query.toLowerCase().trim();
  const mathPatterns = [
    /bereken|calculate|solve|los op/i,
    /integreer|integraal|integral/i,
    /differentieer|afgeleide|derivative/i,
    /vergelijking|equation/i,
    /\d+\s*[+\-*/^]\s*\d+/,
    // Simple arithmetic
    /\\frac|\\int|\\sum|\\lim/i,
    // LaTeX math
    /x\^2|x²|√|sin|cos|tan|log/i
    // Math functions
  ];
  if (mathPatterns.some((p) => p.test(normalizedQuery))) {
    return {
      intent: "math_problem",
      confidence: 0.9,
      reasoning: "Detected math keywords or expressions"
    };
  }
  const codePatterns = [
    /schrijf.*code|write.*code/i,
    /function|functie|def |class /i,
    /python|javascript|java|c\+\+|typescript/i,
    /debug|fout.*code|error.*code/i,
    /```|<code>|<script>/i,
    /import |export |const |let |var /i
  ];
  if (codePatterns.some((p) => p.test(normalizedQuery))) {
    return {
      intent: "code_task",
      confidence: 0.85,
      reasoning: "Detected code keywords or syntax"
    };
  }
  const visionPatterns = [
    /deze afbeelding|this image|foto|picture/i,
    /wat zie je|what do you see/i,
    /analyseer.*beeld|analyze.*image/i,
    /screenshot|diagram|grafiek|graph/i
  ];
  if (visionPatterns.some((p) => p.test(normalizedQuery))) {
    return {
      intent: "vision_task",
      confidence: 0.8,
      reasoning: "Detected vision-related keywords"
    };
  }
  const translationPatterns = [
    /vertaal|translate/i,
    /naar.*engels|to english/i,
    /naar.*nederlands|to dutch/i,
    /naar.*frans|to french/i,
    /naar.*duits|to german/i,
    /naar.*spaans|to spanish/i
  ];
  if (translationPatterns.some((p) => p.test(normalizedQuery))) {
    return {
      intent: "translation",
      confidence: 0.9,
      reasoning: "Detected translation request"
    };
  }
  const summarizationPatterns = [
    /vat samen|samenvatting|summarize|summary/i,
    /kort.*beschrijf|briefly describe/i,
    /hoofdpunten|key points|main points/i,
    /tl;dr|tldr/i
  ];
  if (summarizationPatterns.some((p) => p.test(normalizedQuery))) {
    return {
      intent: "summarization",
      confidence: 0.85,
      reasoning: "Detected summarization request"
    };
  }
  const creativePatterns = [
    /schrijf.*verhaal|write.*story/i,
    /schrijf.*essay|write.*essay/i,
    /maak.*tekst|create.*text/i,
    /bedenk|invent|imagine/i,
    /gedicht|poem|poetry/i
  ];
  if (creativePatterns.some((p) => p.test(normalizedQuery))) {
    return {
      intent: "creative_writing",
      confidence: 0.8,
      reasoning: "Detected creative writing request"
    };
  }
  const reasoningPatterns = [
    /waarom|why|explain.*reason/i,
    /vergelijk|compare|contrast/i,
    /analyseer|analyze/i,
    /evalueer|evaluate|beoordeel/i,
    /wat.*als|what if|hypothetisch/i,
    /bewijs|prove|argument/i
  ];
  if (reasoningPatterns.some((p) => p.test(normalizedQuery))) {
    return {
      intent: "complex_reasoning",
      confidence: 0.7,
      reasoning: "Detected reasoning/analysis keywords"
    };
  }
  if (normalizedQuery.length < 50 && /^(wat|wie|waar|wanneer|hoe|what|who|where|when|how)\b/i.test(
    normalizedQuery
  )) {
    return {
      intent: "simple_question",
      confidence: 0.6,
      reasoning: "Short query starting with question word"
    };
  }
  return {
    intent: "unknown",
    confidence: 0.3,
    reasoning: "No clear pattern matched"
  };
}
async function classifyIntent(query, options) {
  const ruleResult = classifyIntentByRules(query);
  if (ruleResult.confidence >= 0.7) {
    return ruleResult;
  }
  return ruleResult;
}
function intentToCapability(intent) {
  switch (intent) {
    case "vision_task":
      return "vision";
    case "education_help":
    case "math_problem":
    case "complex_reasoning":
      return "reasoning";
    case "code_task":
      return "code";
    case "simple_question":
    case "summarization":
      return "fast";
    case "translation":
    case "creative_writing":
      return "reasoning";
    // Use reasoning models for quality
    case "embedding":
      return "embedding";
    default:
      return "fast";
  }
}
function scoreModel(model, intent, options) {
  let score = model.priority || 50;
  const hasVision = model.capabilities.includes("vision");
  const hasReasoning = model.capabilities.includes("reasoning");
  if (intent === "vision_task" && !hasVision) return 0;
  if ((intent === "math_problem" || intent === "complex_reasoning") && hasReasoning) {
    score += 20;
  }
  if (!model.enabled) return 0;
  if (model.metrics.successRate < 0.5) score -= 40;
  if (options?.preferFast) {
    if (model.metrics.avgResponseMs > 5e3) score -= 20;
    if (model.metrics.avgResponseMs < 1e3) score += 15;
  }
  if (options?.preferQuality) {
    if (hasReasoning) score += 10;
    if (model.capabilities.includes("long_context")) score += 5;
  }
  if (["ollama", "lm_studio", "gpt4all"].includes(model.provider)) {
    score += 5;
  }
  if (model.metrics.lastErrorAt) {
    const hoursSinceError = (Date.now() - model.metrics.lastErrorAt) / 36e5;
    if (hoursSinceError < 1) score -= 30;
    else if (hoursSinceError < 24) score -= 10;
  }
  return Math.max(0, Math.min(100, score));
}
function generateRoutingReason(model, intent, options) {
  const parts = [];
  parts.push(`Intent: ${intent}`);
  if (options?.preferFast) parts.push("Fast mode");
  else if (options?.preferQuality) parts.push("Quality mode");
  if (model.priority > 70) parts.push("High priority");
  if (model.metrics.successRate > 0.95) parts.push("Reliable");
  return parts.join(" | ");
}
class SyncLog {
  constructor() {
    this.events = [];
    this.listeners = /* @__PURE__ */ new Set();
  }
  append(type, payload) {
    const event = {
      id: crypto.randomUUID(),
      type,
      payload,
      timestamp: Date.now()
    };
    this.events.push(event);
    this.listeners.forEach((l) => l(event));
    return event;
  }
  getEvents(afterTimestamp = 0) {
    return this.events.filter((e) => e.timestamp > afterTimestamp);
  }
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  clear() {
    this.events = [];
  }
}
let instance$2 = null;
function getSyncLog() {
  if (!instance$2) instance$2 = new SyncLog();
  return instance$2;
}
setup({
  types: {
    context: {},
    events: {},
    input: {}
  },
  actors: {
    classifyIntent: fromPromise(
      async () => {
        return { intent: "question" };
      }
    ),
    generateOpener: fromPromise(async ({ input: _ }) => {
      return "Thinking of a question...";
    }),
    evaluateAnswer: fromPromise(async ({ input: _ }) => {
      return "Evaluating...";
    })
  },
  actions: {
    persistState: (_) => {
    },
    hydrateState: assign({
      topic: ({ event }) => event.type === "HYDRATE" ? event.state.topic : "",
      history: ({ event }) => event.type === "HYDRATE" ? event.state.history : [],
      currentConcept: ({ event }) => event.type === "HYDRATE" ? event.state.currentConcept : null,
      hintLevel: ({ event }) => event.type === "HYDRATE" ? event.state.hintLevel : 0,
      reasoningSteps: ({ event }) => event.type === "HYDRATE" ? event.state.reasoningSteps : [],
      confidence: ({ event }) => event.type === "HYDRATE" ? event.state.confidence : 0
    }),
    logUserMessage: assign({
      lastUserMessage: ({ event }) => event.type === "USER_MESSAGE" ? event.message : null,
      history: ({ context, event }) => {
        if (event.type === "USER_MESSAGE") {
          return [
            ...context.history,
            { role: "user", content: event.message }
          ];
        }
        return context.history;
      }
    }),
    logAiResponse: assign({
      history: ({ context, event }) => {
        if (event.type === "AI_RESPONSE") {
          const reasoning = context.reasoningSteps.map((s) => ({
            ...s,
            status: "completed"
          }));
          return [
            ...context.history,
            {
              role: "assistant",
              content: event.message,
              metadata: {
                reasoning: reasoning.length > 0 ? reasoning : void 0,
                confidence: context.confidence > 0 ? context.confidence : void 0
              }
            }
          ];
        } else if (event.type === "AI_ERROR") {
          return [
            ...context.history,
            { role: "assistant", content: `Error: ${event.message} ` }
          ];
        }
        return context.history;
      },
      reasoningSteps: [],
      confidence: 0
    }),
    addReasoningStep: assign({
      reasoningSteps: ({ context, event }) => {
        if (event.type === "ADD_REASONING_STEP") {
          const newHistory = context.reasoningSteps.map(
            (s) => s.status === "active" ? { ...s, status: "completed" } : s
          );
          return [
            ...newHistory,
            {
              id: Date.now().toString(),
              label: event.step,
              status: "active",
              timestamp: Date.now()
            }
          ];
        }
        return context.reasoningSteps;
      }
    }),
    updateConfidence: assign({
      confidence: ({ event }) => event.type === "UPDATE_CONFIDENCE" ? event.score : 0
    }),
    incrementHint: assign({
      hintLevel: ({ context }) => context.hintLevel + 1
    }),
    resetTutor: assign({
      topic: "",
      history: [],
      currentConcept: null,
      hintLevel: 0,
      frustrationScore: 0,
      lastUserMessage: null,
      reasoningSteps: [],
      confidence: 0
    })
  },
  guards: {
    isFrustrated: ({ context }) => context.frustrationScore > 3,
    isResolved: ({ event }) => event.type === "RESOLVED"
  }
}).createMachine({
  id: "socraticTutor",
  initial: "idle",
  context: {
    topic: "",
    history: [],
    currentConcept: null,
    hintLevel: 0,
    frustrationScore: 0,
    lastUserMessage: null,
    reasoningSteps: [],
    confidence: 0
  },
  states: {
    idle: {
      on: {
        USER_MESSAGE: {
          target: "analyzing",
          actions: ["logUserMessage", "persistState"]
        },
        HYDRATE: { actions: "hydrateState" }
      }
    },
    analyzing: {
      invoke: {
        src: "classifyIntent",
        input: ({ context }) => ({
          lastMessage: context.lastUserMessage,
          history: context.history
        }),
        onDone: { target: "questioning" },
        onError: { target: "idle" }
      },
      on: {
        ADD_REASONING_STEP: { actions: "addReasoningStep" },
        UPDATE_CONFIDENCE: { actions: "updateConfidence" }
      }
    },
    questioning: {
      invoke: {
        src: "generateOpener",
        input: ({ context }) => ({ topic: context.topic, context }),
        onDone: {
          actions: [
            {
              type: "logAiResponse",
              params: ({ event }) => ({
                message: event.output,
                intent: "question"
              })
            },
            "persistState"
          ]
        },
        onError: {
          target: "idle",
          actions: [
            {
              type: "logAiResponse",
              params: ({ event }) => ({
                message: String(event.error),
                intent: "explanation"
              })
            },
            "persistState"
          ]
        }
      },
      on: {
        ADD_REASONING_STEP: { actions: "addReasoningStep" },
        UPDATE_CONFIDENCE: { actions: "updateConfidence" },
        USER_MESSAGE: { target: "evaluating", actions: "logUserMessage" },
        AI_RESPONSE: { actions: "logAiResponse" },
        AI_ERROR: { target: "idle", actions: "logAiResponse" },
        GIVE_UP: "explaining"
      }
    },
    evaluating: {
      invoke: {
        src: "evaluateAnswer",
        input: ({ context }) => ({ answer: context.lastUserMessage, context }),
        onDone: {
          // Start simplified: always ask follow up or hint
          actions: [
            {
              type: "logAiResponse",
              params: ({ event }) => ({
                message: event.output,
                intent: "question"
              })
            },
            "persistState"
          ]
        },
        onError: {
          target: "idle",
          actions: [
            {
              type: "logAiResponse",
              params: ({ event }) => ({
                message: String(event.error),
                intent: "explanation"
              })
            },
            "persistState"
          ]
        }
      },
      on: {
        ADD_REASONING_STEP: { actions: "addReasoningStep" },
        UPDATE_CONFIDENCE: { actions: "updateConfidence" },
        AI_RESPONSE: [
          {
            target: "hinting",
            guard: ({ context }) => context.hintLevel < 3,
            actions: "logAiResponse"
          },
          { target: "questioning", actions: "logAiResponse" }
        ],
        AI_ERROR: { target: "idle", actions: "logAiResponse" }
      }
    },
    hinting: {
      entry: "incrementHint",
      on: {
        ADD_REASONING_STEP: { actions: "addReasoningStep" },
        UPDATE_CONFIDENCE: { actions: "updateConfidence" },
        USER_MESSAGE: { target: "evaluating", actions: "logUserMessage" },
        AI_RESPONSE: { actions: "logAiResponse" },
        AI_ERROR: { target: "idle", actions: "logAiResponse" }
      }
    },
    explaining: {
      on: {
        ADD_REASONING_STEP: { actions: "addReasoningStep" },
        UPDATE_CONFIDENCE: { actions: "updateConfidence" },
        USER_MESSAGE: { target: "analyzing", actions: "logUserMessage" },
        AI_RESPONSE: { actions: "logAiResponse" },
        AI_ERROR: { target: "idle", actions: "logAiResponse" },
        RESOLVED: "resolved"
      }
    },
    resolved: { type: "final" }
  }
});
const safeLog$1 = {
  log: (...args) => {
    try {
      if (process.stdout && process.stdout.writable) {
        console.log(...args.map((a) => scrub$1(a)));
      }
    } catch {
    }
  },
  warn: (...args) => {
    try {
      if (process.stderr && process.stderr.writable) {
        console.warn(...args.map((a) => scrub$1(a)));
      }
    } catch {
    }
  },
  error: (...args) => {
    try {
      if (process.stderr && process.stderr.writable) {
        console.error(...args.map((a) => scrub$1(a)));
      }
    } catch {
    }
  }
};
function scrub$1(arg) {
  if (typeof arg !== "string") return arg;
  const sensitivePatterns2 = [
    /(apiKey[:=]\s*|api_key[:=]\s*|password[:=]\s*|token[:=]\s*|secret[:=]\s*|auth[:=]\s*)["'][^"']+["']/gi,
    /(Bearer\s+)[a-zA-Z0-9-._~+/]+=*/gi
  ];
  let result = arg;
  for (const pattern of sensitivePatterns2) {
    result = result.replace(pattern, "$1******** [HARDENED]");
  }
  return result;
}
class LMStudioRunner {
  constructor(baseUrl = "http://localhost:1234/v1") {
    this.abortControllers = /* @__PURE__ */ new Map();
    this.baseUrl = baseUrl;
  }
  // =========================
  // HEALTH CHECK
  // =========================
  async isHealthy() {
    const api = globalThis.vwoApi;
    if (api?.invoke) {
      return await api.invoke("ai:check-endpoint", `${this.baseUrl}/models`);
    }
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: "GET",
        signal: AbortSignal.timeout(3e3)
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  // =========================
  // MODEL MANAGEMENT
  // =========================
  async listModels() {
    try {
      const response = await fetch(`${this.baseUrl}/models`);
      if (!response.ok) throw new Error("Failed to list models");
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error("[LMStudioRunner] Failed to list models:", error);
      return [];
    }
  }
  async getLoadedModel() {
    const models = await this.listModels();
    return models.length > 0 ? models[0]?.id ?? null : null;
  }
  // =========================
  // CHAT COMPLETION
  // =========================
  async chat(request) {
    const taskId = `lmstudio-${Date.now()}`;
    const controller = new AbortController();
    this.abortControllers.set(taskId, controller);
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...request,
          stream: false
        }),
        signal: controller.signal
      });
      if (!response.ok) {
        throw new Error(`LM Studio chat failed: ${response.statusText}`);
      }
      return await response.json();
    } finally {
      this.abortControllers.delete(taskId);
    }
  }
  async *chatStream(request) {
    const taskId = `lmstudio-stream-${Date.now()}`;
    const controller = new AbortController();
    this.abortControllers.set(taskId, controller);
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...request,
          stream: true
        }),
        signal: controller.signal
      });
      if (!response.ok) {
        throw new Error(`LM Studio stream failed: ${response.statusText}`);
      }
      if (!response.body) {
        throw new Error("No response body");
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
        for (const line of lines) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch {
          }
        }
      }
    } finally {
      this.abortControllers.delete(taskId);
    }
  }
  // =========================
  // SIMPLE GENERATE
  // =========================
  async generate(prompt, systemPrompt, options) {
    const model = await this.getLoadedModel();
    if (!model) {
      throw new Error("No model loaded in LM Studio");
    }
    const messages = [];
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: prompt });
    const response = await this.chat({
      model,
      messages,
      temperature: options?.temperature,
      max_tokens: options?.maxTokens
    });
    return response.choices[0]?.message?.content || "";
  }
  // =========================
  // EMBEDDINGS
  // =========================
  async embed(text) {
    try {
      const response = await fetch(`${this.baseUrl}/embeddings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: text,
          model: "text-embedding-ada-002"
          // LM Studio ignores this
        })
      });
      if (!response.ok) {
        throw new Error(`LM Studio embed failed: ${response.statusText}`);
      }
      const data = await response.json();
      return data.data?.[0]?.embedding || [];
    } catch (error) {
      console.error("[LMStudioRunner] Embedding failed:", error);
      throw error;
    }
  }
  // =========================
  // ABORT
  // =========================
  abortAll() {
    this.abortControllers.forEach((controller) => controller.abort());
    this.abortControllers.clear();
  }
}
let lmStudioInstance = null;
function getLMStudioRunner(baseUrl) {
  if (!lmStudioInstance || baseUrl && baseUrl !== lmStudioInstance["baseUrl"]) {
    lmStudioInstance = new LMStudioRunner(baseUrl);
  }
  return lmStudioInstance;
}
class OllamaRunner {
  constructor(baseUrl = "http://localhost:11434") {
    this.abortControllers = /* @__PURE__ */ new Map();
    this.baseUrl = baseUrl;
  }
  // =========================
  // HEALTH CHECK
  // =========================
  async isHealthy() {
    const api = globalThis.vwoApi;
    if (api?.invoke) {
      return await api.invoke(
        "ai:check-endpoint",
        `${this.baseUrl}/api/version`
      );
    }
    try {
      const response = await fetch(`${this.baseUrl}/api/version`, {
        method: "GET",
        signal: AbortSignal.timeout(3e3)
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  async getVersion() {
    try {
      const response = await fetch(`${this.baseUrl}/api/version`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.version;
    } catch {
      return null;
    }
  }
  // =========================
  // MODEL MANAGEMENT
  // =========================
  async listModels() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) throw new Error("Failed to list models");
      const data = await response.json();
      return data.models || [];
    } catch (error) {
      console.error("[OllamaRunner] Failed to list models:", error);
      return [];
    }
  }
  async pullModel(name, onProgress) {
    try {
      const response = await fetch(`${this.baseUrl}/api/pull`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, stream: true })
      });
      if (!response.ok) return false;
      if (!response.body) return false;
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter(Boolean);
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            onProgress?.(
              data.status || "Downloading...",
              data.completed || 0,
              data.total || 100
            );
          } catch {
          }
        }
      }
      return true;
    } catch (error) {
      console.error("[OllamaRunner] Failed to pull model:", error);
      return false;
    }
  }
  async deleteModel(name) {
    try {
      const response = await fetch(`${this.baseUrl}/api/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  // =========================
  // GENERATION
  // =========================
  async generate(request) {
    const taskId = `ollama-${Date.now()}`;
    const controller = new AbortController();
    this.abortControllers.set(taskId, controller);
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...request,
          stream: false
        }),
        signal: controller.signal
      });
      if (!response.ok) {
        throw new Error(`Ollama generate failed: ${response.statusText}`);
      }
      return await response.json();
    } finally {
      this.abortControllers.delete(taskId);
    }
  }
  async *generateStream(request) {
    const taskId = `ollama-stream-${Date.now()}`;
    const controller = new AbortController();
    this.abortControllers.set(taskId, controller);
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...request,
          stream: true
        }),
        signal: controller.signal
      });
      if (!response.ok) {
        throw new Error(`Ollama stream failed: ${response.statusText}`);
      }
      if (!response.body) {
        throw new Error("No response body");
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter(Boolean);
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.response) {
              yield data.response;
            }
          } catch {
          }
        }
      }
    } finally {
      this.abortControllers.delete(taskId);
    }
  }
  // =========================
  // EMBEDDINGS
  // =========================
  async embed(model, text) {
    try {
      let response = await fetch(`${this.baseUrl}/api/embed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, input: text })
      });
      if (response.status === 404) {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const errorData = await response.json().catch(() => ({}));
          if (errorData.error) {
            throw new Error(`Ollama model "${model}" not found: ${errorData.error}`);
          }
        }
        response = await fetch(`${this.baseUrl}/api/embeddings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model, prompt: text })
        });
      }
      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        let errorMessage = response.statusText;
        try {
          const json = JSON.parse(errorText);
          errorMessage = json.error || errorMessage;
        } catch {
        }
        throw new Error(`Ollama embed failed (${response.status}): ${errorMessage}`);
      }
      const data = await response.json();
      if (data.embeddings && Array.isArray(data.embeddings)) {
        return data.embeddings[0] || [];
      }
      return data.embedding || [];
    } catch (error) {
      console.error("[OllamaRunner] Embedding failed:", error);
      throw error;
    }
  }
  // =========================
  // ABORT
  // =========================
  abortAll() {
    this.abortControllers.forEach((controller) => controller.abort());
    this.abortControllers.clear();
  }
}
let ollamaInstance = null;
function getOllamaRunner(baseUrl) {
  if (!ollamaInstance || baseUrl && baseUrl !== ollamaInstance["baseUrl"]) {
    ollamaInstance = new OllamaRunner(baseUrl);
  }
  return ollamaInstance;
}
const sensitivePatterns = [
  /(apiKey[:=]\s*|api_key[:=]\s*|password[:=]\s*|token[:=]\s*|secret[:=]\s*|auth[:=]\s*)["'][^"']+["']/gi,
  /(Bearer\s+)[a-zA-Z0-9-._~+/]+=*/gi
];
function scrub(arg) {
  if (typeof arg !== "string") return arg;
  let result = arg;
  for (const pattern of sensitivePatterns) {
    result = result.replace(pattern, "$1******** [HARDENED]");
  }
  return result;
}
const safeLog = {
  log: (...args) => {
    try {
      const isNode = typeof process !== "undefined" && process.stdout;
      if (isNode && !process.stdout.writable) return;
      console.log(...args.map((a) => scrub(a)));
    } catch {
    }
  },
  warn: (...args) => {
    try {
      const isNode = typeof process !== "undefined" && process.stderr;
      if (isNode && !process.stderr.writable) return;
      console.warn(...args.map((a) => scrub(a)));
    } catch {
    }
  },
  error: (...args) => {
    try {
      const isNode = typeof process !== "undefined" && process.stderr;
      if (isNode && !process.stderr.writable) return;
      console.error(...args.map((a) => scrub(a)));
    } catch {
    }
  }
};
class DatabaseFactory {
  static sqliteInstance = null;
  static lanceConnection = null;
  static getUserDataPath() {
    return app.isPackaged ? app.getPath("userData") : process.cwd();
  }
  static getSQLite() {
    if (this.sqliteInstance) return this.sqliteInstance;
    const dbFolder = path.join(this.getUserDataPath(), "databases");
    if (!fs.existsSync(dbFolder)) fs.mkdirSync(dbFolder, { recursive: true });
    const dbPath = path.join(dbFolder, "app.db");
    safeLog.log(`[SQLite] Attempting to initialize at: ${dbPath}`);
    let instance2;
    try {
      instance2 = new Database(dbPath);
      safeLog.log("[SQLite] better-sqlite3 instance created.");
    } catch (e) {
      safeLog.error(`[SQLite] Failed to open database at ${dbPath}:`, e);
      throw e;
    }
    instance2.pragma("journal_mode = WAL");
    instance2.pragma("synchronous = NORMAL");
    const tables = [
      // 1. PRIMARY APP TABLES
      `CREATE TABLE IF NOT EXISTS documents_meta (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        upload_date TEXT NOT NULL,
        status TEXT NOT NULL,
        path TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS ai_models (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        provider TEXT NOT NULL,
        model_id TEXT NOT NULL,
        endpoint TEXT,
        api_key_id TEXT,
        local_path TEXT,
        capabilities TEXT,
        enabled INTEGER DEFAULT 1,
        priority INTEGER DEFAULT 50,
        metrics TEXT,
        requirements TEXT,
        created_at INTEGER,
        last_used_at INTEGER
      );`,
      `CREATE TABLE IF NOT EXISTS mcp_tools (
        name TEXT PRIMARY KEY,
        description TEXT,
        enabled INTEGER DEFAULT 1,
        requires_approval INTEGER DEFAULT 0
      );`,
      `CREATE TABLE IF NOT EXISTS ai_settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS tutor_snapshots (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        topic TEXT,
        context TEXT NOT NULL,
        created_at INTEGER
      );`,
      `CREATE TABLE IF NOT EXISTS gym_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        engine_id TEXT NOT NULL,
        is_correct INTEGER DEFAULT 0,
        time_taken_ms INTEGER DEFAULT 0,
        score INTEGER DEFAULT 0,
        metrics TEXT,
        timestamp INTEGER DEFAULT (strftime('%s', 'now'))
      );`,
      `CREATE TABLE IF NOT EXISTS gym_progress (
        engine_id TEXT NOT NULL,
        skill_key TEXT NOT NULL,
        box_level INTEGER DEFAULT 1,
        next_review INTEGER,
        difficulty_level INTEGER DEFAULT 1,
        PRIMARY KEY (engine_id, skill_key)
      );`,
      `CREATE TABLE IF NOT EXISTS module_unlocks (
        module_id TEXT PRIMARY KEY,
        is_unlocked INTEGER DEFAULT 0,
        completed_at INTEGER
      );`,
      // 2. CHAT & UI TABLES
      `CREATE TABLE IF NOT EXISTS chat_sessions (
          id TEXT PRIMARY KEY,
          title TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS chat_messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id TEXT,
          role TEXT,
          content TEXT,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(session_id) REFERENCES chat_sessions(id)
      );`,
      `CREATE TABLE IF NOT EXISTS user_settings (
        id TEXT PRIMARY KEY,
        profile TEXT,
        theme TEXT,
        ai_config TEXT,
        shortcuts TEXT,
        pomodoro_work INTEGER,
        pomodoro_break INTEGER,
        language TEXT DEFAULT 'nl',
        streak INTEGER DEFAULT 0,
        gamification_enabled INTEGER DEFAULT 1,
        audio_focus_mode TEXT DEFAULT 'alpha',
        audio_volume INTEGER DEFAULT 50,
        graphics_quality TEXT DEFAULT 'high',
        python_mode TEXT DEFAULT 'standard',
        timer_start_sound TEXT DEFAULT 'zen-bell',
        timer_break_sound TEXT DEFAULT 'success-chord',
        speech_recognition_enabled INTEGER DEFAULT 1,
        xp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        unlocked_achievements TEXT DEFAULT '[]'
      );`,
      // 3. STUDY & RESEARCH TABLES
      `CREATE TABLE IF NOT EXISTS study_materials (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        subject TEXT,
        type TEXT,
        content TEXT,
        embedding TEXT,
        date TEXT,
        quiz TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );`,
      `CREATE TABLE IF NOT EXISTS flashcards (
        id TEXT PRIMARY KEY,
        front TEXT NOT NULL,
        back TEXT NOT NULL,
        material_id TEXT,
        due INTEGER,
        stability REAL,
        difficulty REAL,
        reps INTEGER DEFAULT 0,
        lapses INTEGER DEFAULT 0,
        state TEXT DEFAULT 'new',
        last_review INTEGER,
        tags TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS lab_scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lab_name TEXT NOT NULL,
        score INTEGER,
        date TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        activity TEXT NOT NULL,
        date TEXT NOT NULL,
        xp INTEGER DEFAULT 0
      );`,
      `CREATE TABLE IF NOT EXISTS achievements (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        icon TEXT NOT NULL,
        unlocked_at TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS generated_media (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        prompt TEXT,
        data TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );`,
      `CREATE TABLE IF NOT EXISTS blurting_sessions (
        id TEXT PRIMARY KEY,
        topic TEXT NOT NULL,
        score INTEGER,
        analysis_data TEXT,
        content TEXT,
        date TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS lob_results (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        scores TEXT NOT NULL,
        date TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS research_results (
        id TEXT PRIMARY KEY,
        module TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );`,
      `CREATE TABLE IF NOT EXISTS quiz_history (
        id TEXT PRIMARY KEY,
        topic TEXT NOT NULL,
        date INTEGER NOT NULL,
        score INTEGER NOT NULL,
        total INTEGER NOT NULL,
        type_breakdown TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS saved_questions (
        id TEXT PRIMARY KEY,
        question TEXT NOT NULL,
        saved_at INTEGER NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS weak_points (
        id TEXT PRIMARY KEY,
        subject TEXT NOT NULL,
        topic TEXT NOT NULL,
        error_count INTEGER DEFAULT 0,
        attempt_count INTEGER DEFAULT 0,
        error_rate REAL DEFAULT 0,
        common_mistakes TEXT,
        suggested_focus TEXT,
        improvement_score REAL DEFAULT 0,
        last_error_at INTEGER,
        last_practice_at INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS system_logs (
        id TEXT PRIMARY KEY,
        level TEXT NOT NULL,
        message TEXT NOT NULL,
        data TEXT,
        timestamp INTEGER NOT NULL
      );`,
      // 4. PLANNER & LOB CONTINUED
      `CREATE TABLE IF NOT EXISTS coaching_sessions (
        id TEXT PRIMARY KEY,
        subject TEXT NOT NULL,
        transcript TEXT NOT NULL,
        summary TEXT,
        duration INTEGER,
        date TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS planner_tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        date TEXT NOT NULL,
        start_time TEXT,
        end_time TEXT,
        duration INTEGER NOT NULL DEFAULT 30,
        is_fixed INTEGER DEFAULT 0,
        is_all_day INTEGER DEFAULT 0,
        subject TEXT,
        topic TEXT,
        chapter TEXT,
        grade_goal REAL,
        weight INTEGER,
        exam_type TEXT,
        type TEXT NOT NULL DEFAULT 'study',
        priority TEXT NOT NULL DEFAULT 'medium',
        energy_requirement TEXT NOT NULL DEFAULT 'medium',
        linked_content_id TEXT,
        pws_project_id TEXT,
        parent_task_id TEXT,
        completed INTEGER DEFAULT 0,
        status TEXT DEFAULT 'todo',
        completed_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        source TEXT NOT NULL DEFAULT 'manual',
        color TEXT,
        related_id TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS planner_settings (
        id TEXT PRIMARY KEY,
        chronotype TEXT DEFAULT 'neutral',
        peak_hours_start INTEGER DEFAULT 10,
        peak_hours_end INTEGER DEFAULT 17,
        work_day_start INTEGER DEFAULT 8,
        work_day_end INTEGER DEFAULT 22,
        preferred_study_duration INTEGER DEFAULT 45,
        buffer_minutes INTEGER DEFAULT 15,
        region TEXT DEFAULT 'midden',
        exam_year INTEGER,
        exam_mode INTEGER DEFAULT 0,
        auto_reschedule_enabled INTEGER DEFAULT 1,
        spaced_repetition_enabled INTEGER DEFAULT 1,
        updated_at TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS somtoday_schedule (
        id TEXT PRIMARY KEY,
        title TEXT,
        description TEXT,
        date TEXT NOT NULL,
        start_time TEXT,
        end_time TEXT,
        vak_naam TEXT,
        docent_afkorting TEXT,
        locatie TEXT,
        type TEXT,
        is_huiswerk INTEGER DEFAULT 0,
        is_toets INTEGER DEFAULT 0,
        raw_json TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS personal_tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        date TEXT NOT NULL,
        start_time TEXT,
        end_time TEXT,
        duration INTEGER DEFAULT 30,
        subject TEXT,
        priority TEXT DEFAULT 'medium',
        completed INTEGER DEFAULT 0,
        created_at TEXT,
        updated_at TEXT,
        raw_json TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS manual_grades (
        id TEXT PRIMARY KEY,
        subject TEXT NOT NULL,
        grade REAL NOT NULL,
        weight REAL DEFAULT 1.0,
        date TEXT NOT NULL,
        type TEXT,
        description TEXT,
        period INTEGER,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );`,
      `CREATE TABLE IF NOT EXISTS pws_projects (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        subject TEXT,
        status TEXT,
        priority TEXT,
        deadline TEXT,
        sources TEXT DEFAULT '[]',
        created_at INTEGER,
        updated_at INTEGER
      );`,
      `CREATE TABLE IF NOT EXISTS unavailable_blocks (
        id TEXT PRIMARY KEY,
        day_of_week INTEGER,
        start_time TEXT,
        end_time TEXT,
        reason TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS weekly_reviews (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        good TEXT,
        bad TEXT,
        plan TEXT,
        completed INTEGER DEFAULT 0,
        completed_at TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS somtoday_grades (
        id TEXT PRIMARY KEY,
        subject TEXT,
        grade REAL,
        weight REAL,
        datum_invoer TEXT,
        omschrijving TEXT,
        type TEXT,
        periode INTEGER,
        leerjaar INTEGER,
        is_examendossier INTEGER DEFAULT 0,
        raw_json TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS gap_year_plans (
        id TEXT PRIMARY KEY,
        modules TEXT DEFAULT '[]',
        budget TEXT,
        updated_at INTEGER
      );`,
      `CREATE TABLE IF NOT EXISTS scenario_plans (
        id TEXT PRIMARY KEY,
        plan_a TEXT,
        plan_b TEXT,
        plan_c TEXT,
        updated_at INTEGER
      );`,
      `CREATE TABLE IF NOT EXISTS sjt_scenarios (
        id TEXT PRIMARY KEY,
        title TEXT,
        description TEXT,
        options TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS university_studies (
        id TEXT PRIMARY KEY,
        name TEXT,
        institution TEXT,
        city TEXT,
        description TEXT,
        profiles TEXT,
        requirements TEXT,
        sectors TEXT,
        stats TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS mcp_tool_usage_logs (
        id TEXT PRIMARY KEY,
        tool_name TEXT NOT NULL,
        call_params TEXT,
        response TEXT,
        duration_ms INTEGER,
        success INTEGER DEFAULT 1,
        error TEXT,
        timestamp INTEGER DEFAULT (strftime('%s', 'now'))
      );`,
      `CREATE TABLE IF NOT EXISTS knowledge_digests (
        key TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        last_used_at INTEGER NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS open_days (
        id TEXT PRIMARY KEY,
        institution TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT,
        type TEXT,
        description TEXT,
        link TEXT
      );`
    ];
    const indexes = [
      `CREATE INDEX IF NOT EXISTS idx_mcp_tools_name ON mcp_tools(name);`,
      `CREATE INDEX IF NOT EXISTS idx_mcp_tools_enabled ON mcp_tools(enabled);`,
      `CREATE INDEX IF NOT EXISTS idx_mcp_usage_timestamp ON mcp_tool_usage_logs(timestamp);`,
      `CREATE INDEX IF NOT EXISTS idx_snapshots_session ON tutor_snapshots(session_id);`,
      `CREATE INDEX IF NOT EXISTS idx_history_engine ON gym_history(engine_id);`,
      `CREATE INDEX IF NOT EXISTS idx_messages_session ON chat_messages(session_id);`,
      `CREATE INDEX IF NOT EXISTS idx_study_materials_subject ON study_materials(subject);`,
      `CREATE INDEX IF NOT EXISTS idx_flashcards_due ON flashcards(due);`,
      `CREATE INDEX IF NOT EXISTS idx_flashcards_material ON flashcards(material_id);`,
      `CREATE INDEX IF NOT EXISTS idx_activity_log_date ON activity_log(date);`,
      `CREATE INDEX IF NOT EXISTS idx_quiz_history_date ON quiz_history(date);`,
      `CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp ON system_logs(timestamp);`,
      `CREATE INDEX IF NOT EXISTS idx_planner_tasks_date ON planner_tasks(date);`,
      `CREATE INDEX IF NOT EXISTS idx_planner_tasks_subject ON planner_tasks(subject);`,
      `CREATE INDEX IF NOT EXISTS idx_planner_tasks_status ON planner_tasks(status);`
    ];
    try {
      for (const sql of tables) {
        try {
          instance2.exec(sql);
        } catch (e) {
          safeLog.error(`[SQLite] Table creation failed for statement starting with: ${sql.substring(0, 50)}...`, e);
        }
      }
      for (const sql of indexes) {
        try {
          instance2.exec(sql);
        } catch (e) {
          safeLog.error(`[SQLite] Index creation failed: ${sql}`, e);
        }
      }
      this.syncToolsToVectorStore(instance2).catch(
        (e) => safeLog.error("[Elite] Tool vector sync failed:", e)
      );
      this.sqliteInstance = instance2;
      const tableCheck = (tableName) => {
        try {
          const table = instance2.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(tableName);
          return !!table;
        } catch {
          return false;
        }
      };
      const colCheck = (tableName, colName) => {
        if (!tableCheck(tableName)) return false;
        try {
          const cols = instance2.pragma(`table_info(${tableName})`);
          return cols.some((c) => c.name === colName);
        } catch {
          return false;
        }
      };
      try {
        if (tableCheck("documents_meta")) {
          if (!colCheck("documents_meta", "status")) {
            instance2.exec("ALTER TABLE documents_meta ADD COLUMN status TEXT DEFAULT 'ready'");
          }
          if (!colCheck("documents_meta", "path")) {
            instance2.exec("ALTER TABLE documents_meta ADD COLUMN path TEXT");
          }
        }
        if (tableCheck("mcp_tools") && !colCheck("mcp_tools", "requires_approval")) {
          instance2.exec("ALTER TABLE mcp_tools ADD COLUMN requires_approval INTEGER DEFAULT 0");
        }
        if (tableCheck("coaching_sessions")) {
          const coachCols = [
            "language",
            "fragments",
            "terminology",
            "takeaways",
            "mastery_score",
            "learning_gaps",
            "correction_log",
            "flashcards",
            "test_questions",
            "study_advice",
            "confidence_score",
            "interaction_ratio",
            "sentiment",
            "pitfalls",
            "syllabus_links",
            "exam_vocab",
            "structure_score",
            "argumentation_quality",
            "critical_thinking",
            "scientific_nuance",
            "source_usage",
            "bloom_level",
            "est_study_time",
            "exam_priority",
            "cross_links",
            "anxiety_level",
            "cognitive_load",
            "growth_mindset",
            "learning_state_vector"
          ];
          for (const col of coachCols) {
            if (!colCheck("coaching_sessions", col)) {
              try {
                const type = col.includes("score") || col.includes("ratio") ? "REAL" : "TEXT";
                instance2.exec(`ALTER TABLE coaching_sessions ADD COLUMN ${col} ${type}`);
              } catch (e) {
                safeLog.error(`[SQLite] Migration failed for coaching_sessions column ${col}`, e);
              }
            }
          }
        }
        if (tableCheck("gym_progress") && !colCheck("gym_progress", "difficulty_level")) {
          instance2.exec("ALTER TABLE gym_progress ADD COLUMN difficulty_level INTEGER DEFAULT 1");
        }
        if (tableCheck("gym_history")) {
          if (!colCheck("gym_history", "is_correct")) {
            instance2.exec("ALTER TABLE gym_history ADD COLUMN is_correct INTEGER DEFAULT 0");
          }
          if (!colCheck("gym_history", "time_taken_ms")) {
            instance2.exec("ALTER TABLE gym_history ADD COLUMN time_taken_ms INTEGER DEFAULT 0");
          }
        }
        if (tableCheck("university_studies")) {
          if (!colCheck("university_studies", "institution")) {
            instance2.exec("ALTER TABLE university_studies ADD COLUMN institution TEXT");
          }
          if (!colCheck("university_studies", "description")) {
            instance2.exec("ALTER TABLE university_studies ADD COLUMN description TEXT");
          }
        }
        if (tableCheck("planner_tasks") && !colCheck("planner_tasks", "related_id")) {
          instance2.exec("ALTER TABLE planner_tasks ADD COLUMN related_id TEXT");
        }
      } catch (migrationError) {
        safeLog.error("[SQLite] Compatibility migration failed:", migrationError);
      }
      safeLog.log(`[SQLite] Initialized at ${dbPath} in WAL mode.`);
      return this.sqliteInstance;
    } catch (error) {
      safeLog.error("[SQLite] Outer initialization failed:", error);
      throw error;
    }
  }
  static async getLanceDB() {
    if (this.lanceConnection) return this.lanceConnection;
    const dbFolder = path.join(this.getUserDataPath(), "databases", "knowledge_base.lance");
    this.lanceConnection = await lancedb.connect(dbFolder);
    safeLog.log(`[LanceDB] Connected at ${dbFolder}`);
    return this.lanceConnection;
  }
  static async syncToolsToVectorStore(sqlite) {
    try {
      const lance = await this.getLanceDB();
      const tools = sqlite.prepare("SELECT name, description FROM mcp_tools WHERE enabled = 1").all();
      if (tools.length === 0) return;
      let table;
      try {
        table = await lance.openTable("tool_vectors");
      } catch {
        table = await lance.createTable("tool_vectors", [{
          vector: new Array(768).fill(0),
          name: "seed",
          description: "seed"
        }]);
        await table.delete("name = 'seed'");
      }
      safeLog.log(`[Elite] Semantic registry ready for ${tools.length} tools.`);
    } catch (e) {
      safeLog.error("[Elite] syncToolsToVectorStore failed:", e);
    }
  }
  static async closeAll() {
    safeLog.log("[DatabaseFactory] Closing all database connections...");
    if (this.sqliteInstance) {
      this.sqliteInstance.close();
      this.sqliteInstance = null;
      safeLog.log("[SQLite] Connection closed.");
    }
    if (this.lanceConnection) {
      this.lanceConnection = null;
      safeLog.log("[LanceDB] Connection reference cleared.");
    }
  }
  static getDatabasesPath() {
    return path.join(this.getUserDataPath(), "databases");
  }
}
function getMainDb() {
  return DatabaseFactory.getSQLite();
}
function initMainDb() {
  return DatabaseFactory.getSQLite();
}
const aiModelDao = {
  getAll: () => {
    const rows = DatabaseFactory.getSQLite().prepare("SELECT * FROM ai_models").all();
    return rows.map((row) => ({
      ...row,
      modelId: row.model_id,
      capabilities: JSON.parse(row.capabilities || "[]"),
      metrics: JSON.parse(row.metrics || "{}"),
      requirements: JSON.parse(row.requirements || "{}"),
      enabled: Boolean(row.enabled),
      createdAt: row.created_at,
      lastUsedAt: row.last_used_at
    }));
  },
  get: (id) => {
    const row = DatabaseFactory.getSQLite().prepare("SELECT * FROM ai_models WHERE id = ? OR model_id = ?").get(id, id);
    if (!row) return void 0;
    return {
      ...row,
      modelId: row.model_id,
      capabilities: JSON.parse(row.capabilities || "[]"),
      metrics: JSON.parse(row.metrics || "{}"),
      requirements: JSON.parse(row.requirements || "{}"),
      enabled: Boolean(row.enabled),
      createdAt: row.created_at,
      lastUsedAt: row.last_used_at
    };
  },
  upsert: (model) => {
    const stmt = DatabaseFactory.getSQLite().prepare(`
      INSERT OR REPLACE INTO ai_models 
      (id, name, provider, model_id, endpoint, api_key_id, local_path, capabilities, enabled, priority, metrics, requirements, created_at, last_used_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      model.id,
      model.name,
      model.provider,
      model.modelId,
      model.endpoint || null,
      model.apiKeyId || null,
      model.localPath || null,
      JSON.stringify(model.capabilities || []),
      model.enabled ? 1 : 0,
      model.priority || 50,
      JSON.stringify(model.metrics || {}),
      JSON.stringify(model.requirements || {}),
      model.createdAt || Date.now(),
      model.lastUsedAt || null
    );
  }
};
const DEFAULT_CONFIG = {
  routingStrategy: "rule_based",
  fallbackEnabled: true,
  maxRetries: 2,
  contextInjectionEnabled: true,
  maxContextTokens: 4096,
  proactiveSuggestionsEnabled: true,
  suggestionTypes: ["exam_prep", "practice_reminder", "weak_point_focus"],
  showRoutingDecisions: true,
  debugMode: false
};
class Orchestrator extends EventEmitter {
  config;
  models = [];
  routingHistory = [];
  // Event-driven Task Management (No Polling)
  taskResolvers = /* @__PURE__ */ new Map();
  taskRejectors = /* @__PURE__ */ new Map();
  constructor(config = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadModelsFromDb();
    this.on("task_completed", this.handleTaskCompletion.bind(this));
    this.on("task_failed", this.handleTaskFailure.bind(this));
  }
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    if (this.config.debugMode)
      safeLog$1.log("[Orchestrator] Config updated:", this.config);
  }
  getConfig() {
    return { ...this.config };
  }
  loadModelsFromDb() {
    try {
      this.models = aiModelDao.getAll();
      if (this.config.debugMode)
        safeLog$1.log(`[Orchestrator] Loaded ${this.models.length} models`);
    } catch (error) {
      safeLog$1.error("[Orchestrator] Failed to load models:", error);
    }
  }
  async execute(prompt, options) {
    const intent = options?.intent || await this.classifyQuery(prompt);
    const routing = this.selectModel(intent, options);
    if (!routing) throw new Error(`No model available for intent: ${intent}`);
    this.routingHistory.push(routing);
    this.emit("routing_decision", routing);
    const taskId = crypto$1.randomUUID();
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.cleanupTask(taskId);
        reject(new Error("Orchestrator task timed out after 60s"));
      }, 6e4);
      this.taskResolvers.set(taskId, (res) => {
        clearTimeout(timeout);
        resolve(res);
      });
      this.taskRejectors.set(taskId, (err) => {
        clearTimeout(timeout);
        reject(err);
      });
      this.processTask(taskId, prompt, routing);
    });
  }
  async processTask(taskId, prompt, routing) {
    try {
      this.emit("task_started", { taskId, model: routing.selectedModel.name });
      this.emit("task_started", { taskId, model: routing.selectedModel.name });
      let response;
      const model = routing.selectedModel;
      if (model.provider === "ollama") {
        const runner = getOllamaRunner(model.endpoint);
        const result = await runner.generate({
          model: model.modelId,
          prompt,
          system: "You are a helpful AI tutor."
          // Default system prompt, can be passed via options
        });
        response = result.response;
      } else if (model.provider === "lm_studio") {
        const runner = getLMStudioRunner(model.endpoint);
        response = await runner.generate(prompt);
      } else {
        await new Promise((r) => setTimeout(r, 800));
        response = `[Mock Response] Provider ${model.provider} not supported yet.`;
      }
      this.emit("task_completed", { taskId, result: response });
    } catch (error) {
      this.emit("task_failed", { taskId, error });
    }
  }
  handleTaskCompletion({
    taskId,
    result
  }) {
    const resolve = this.taskResolvers.get(taskId);
    if (resolve) {
      resolve(result);
      this.cleanupTask(taskId);
    }
  }
  handleTaskFailure({
    taskId,
    error
  }) {
    const reject = this.taskRejectors.get(taskId);
    if (reject) {
      reject(error);
      this.cleanupTask(taskId);
    }
  }
  cleanupTask(taskId) {
    this.taskResolvers.delete(taskId);
    this.taskRejectors.delete(taskId);
  }
  async classifyQuery(query) {
    const result = await classifyIntent(query);
    this.emit("intent_classified", { query, intent: result.intent });
    return result.intent;
  }
  selectModel(intent, options) {
    const capability = intentToCapability(intent);
    let availableModels = this.models.filter(
      (m) => m.enabled && m.capabilities.includes(capability)
    );
    if (options?.requireLocal) {
      availableModels = availableModels.filter(
        (m) => ["ollama", "lm_studio"].includes(m.provider)
      );
    }
    if (availableModels.length === 0 && this.config.fallbackEnabled) {
      if (this.config.debugMode) {
        safeLog$1.warn(
          `[Orchestrator] No models for capability "${capability}". Attempting fallback...`
        );
      }
      availableModels = this.models.filter((m) => {
        if (!m.enabled) return false;
        if (intent !== "vision_task" && m.capabilities.includes("vision") && m.capabilities.length === 1)
          return false;
        if (options?.requireLocal && !["ollama", "lm_studio"].includes(m.provider))
          return false;
        return true;
      });
    }
    if (availableModels.length === 0) return null;
    const scored = availableModels.map((m) => ({
      model: m,
      score: scoreModel(m, intent, options)
    })).sort((a, b) => b.score - a.score);
    const best = scored[0];
    if (!best) return null;
    return {
      taskId: crypto$1.randomUUID(),
      selectedModel: best.model,
      reason: generateRoutingReason(best.model, intent, options) + (scored.length > 0 && !best.model.capabilities.includes(capability) ? " (Fallback)" : ""),
      alternatives: scored.slice(1, 4).map((s) => s.model),
      confidence: best.score / 100
    };
  }
}
let instance$1 = null;
function getOrchestrator() {
  if (!instance$1) instance$1 = new Orchestrator();
  return instance$1;
}
class DreamingAgent extends EventEmitter {
  isDreaming = false;
  idleThresholdMs = 3e4;
  // 30 seconds idle
  lastActivity = Date.now();
  dreamInterval = null;
  backoffUntil = 0;
  constructor() {
    super();
    this.startWatching();
    if (typeof process !== "undefined" && process.on) {
      process.on("beforeExit", () => this.destroy());
    }
  }
  startWatching() {
    this.dreamInterval = setInterval(() => {
      const now = Date.now();
      if (now < this.backoffUntil) return;
      if (!this.isDreaming && now - this.lastActivity > this.idleThresholdMs) {
        this.startDreaming();
      }
    }, 1e4);
  }
  notifyActivity() {
    this.lastActivity = Date.now();
    if (this.isDreaming) {
      this.stopDreaming();
    }
  }
  async startDreaming() {
    this.isDreaming = true;
    this.emit("dream_started");
    safeLog$1.log(
      "[DreamingAgent] System idle. Starting proactive reflections..."
    );
    try {
      const syncLog = getSyncLog();
      const mockContext = "User struggled with Centripetal Force in Physics Lab yesterday.";
      const orchestrator = getOrchestrator();
      const prompt = `Context: ${mockContext}. Generate a short, encouraging 1-sentence study tip or challenge for the student.`;
      const aiSuggestion = await orchestrator.execute(prompt, {
        intent: "education_help",
        preferFast: true
        // Dreaming should be cheap
      });
      if (syncLog) {
        syncLog.append("proactive_suggestion", {
          type: "weak_point_focus",
          title: "Verdieping: Natuurkunde Krachten",
          description: aiSuggestion,
          // Real AI output
          action: "open_physics_lab"
        });
        safeLog$1.log("[DreamingAgent] Generated suggestion:", aiSuggestion);
      }
    } catch (error) {
      const message = error.message;
      if (message.includes("No model available")) {
        safeLog$1.log(
          "[DreamingAgent] No models available for dreaming. Backing off for 1 minute."
        );
        this.backoffUntil = Date.now() + 6e4;
      } else {
        safeLog$1.error("[DreamingAgent] Error while dreaming:", error);
      }
    } finally {
      this.isDreaming = false;
    }
  }
  stopDreaming() {
    this.isDreaming = false;
    this.emit("dream_stopped");
    safeLog$1.log("[DreamingAgent] Activity detected. Stopping dreams.");
  }
  destroy() {
    if (this.dreamInterval) {
      clearInterval(this.dreamInterval);
    }
  }
}
let instance = null;
function getDreamingAgent() {
  if (!instance) instance = new DreamingAgent();
  return instance;
}
const AIConfig = {
  embedding: {
    modelId: "Xenova/all-MiniLM-L6-v2",
    dimensions: 384,
    quantized: true
  }
};
var IpcChannels = /* @__PURE__ */ ((IpcChannels2) => {
  IpcChannels2["DOC_ADD"] = "doc:add";
  IpcChannels2["DOC_SEARCH"] = "doc:search";
  IpcChannels2["DOC_DELETE"] = "doc:delete";
  IpcChannels2["DOC_PROGRESS"] = "doc:progress";
  IpcChannels2["AI_GENERATE"] = "ai:generate";
  IpcChannels2["AI_CHECK_ENDPOINT"] = "ai:check-endpoint";
  IpcChannels2["ORCHESTRATOR_EXECUTE"] = "orchestrator:execute";
  IpcChannels2["ORCHESTRATOR_ROUTING_DECISION"] = "orchestrator:routing_decision";
  IpcChannels2["ORCHESTRATOR_MODELS_UPDATED"] = "orchestrator:models_updated";
  IpcChannels2["DB_SAVE_TUTOR_STATE"] = "db:save-tutor-state";
  IpcChannels2["DB_LOAD_TUTOR_STATE"] = "db:load-tutor-state";
  IpcChannels2["DB_QUERY"] = "db:query";
  IpcChannels2["TASK_ADD"] = "task:add";
  IpcChannels2["TASK_UPDATE"] = "task:update";
  IpcChannels2["TASK_REMOVE"] = "task:remove";
  IpcChannels2["TASK_CLEAR"] = "task:clear";
  IpcChannels2["QUEUE_PROCESS_LOCAL"] = "queue:process_local";
  IpcChannels2["QUEUE_UPDATE"] = "queue:update";
  IpcChannels2["SYS_PING"] = "sys:ping";
  IpcChannels2["SYS_OPEN_PATH"] = "sys:open-path";
  IpcChannels2["SYS_FETCH_URL"] = "sys:fetch-url";
  IpcChannels2["SYSTEM_STATUS"] = "system:status";
  IpcChannels2["CONFIG_UPDATE"] = "config:update";
  IpcChannels2["PERF_TRACE_START"] = "perf:trace-start";
  IpcChannels2["PERF_TRACE_STOP"] = "perf:trace-stop";
  IpcChannels2["KNOWLEDGE_SAVE"] = "knowledge:save";
  IpcChannels2["KNOWLEDGE_LOAD"] = "knowledge:load";
  IpcChannels2["WINDOW_MINIMIZE"] = "window:minimize";
  IpcChannels2["WINDOW_MAXIMIZE"] = "window:maximize";
  IpcChannels2["WINDOW_CLOSE"] = "window:close";
  IpcChannels2["WINDOW_IS_MAXIMIZED"] = "window:is-maximized";
  IpcChannels2["VAULT_EXPORT"] = "vault:export";
  IpcChannels2["VAULT_IMPORT"] = "vault:import";
  return IpcChannels2;
})(IpcChannels || {});
const DocMetaSchema = z.object({
  id: z.string().uuid().optional().or(z.string()),
  // Flexible for now
  title: z.string().min(1),
  uploadDate: z.string(),
  status: z.enum(["indexing", "indexed", "failed"]),
  path: z.string().optional()
});
const TaskIntentSchema = z.enum([
  "general_chat",
  "execute_tool",
  "education_help",
  "content_creation",
  "complex_reasoning",
  "code_generation",
  "general"
  // Compatibility
]);
const AiGenerateSchema = z.object({
  prompt: z.string().min(1).max(5e4),
  // Elite limit
  options: z.object({
    intent: TaskIntentSchema.optional()
  }).catchall(z.unknown()).optional()
});
const DbSaveStateSchema = z.object({
  topic: z.string().optional(),
  history: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
      metadata: z.unknown().optional()
    })
  ),
  context: z.unknown().optional()
});
const DbQuerySchema = z.object({
  sql: z.string().min(5),
  params: z.array(z.unknown()).optional(),
  method: z.enum(["run", "get", "all"]).optional().default("all")
});
const TaskAddSchema = z.object({
  prompt: z.string().min(1),
  intent: z.string().optional().default("general"),
  priority: z.number().optional().default(1),
  isLocal: z.boolean().optional().default(false)
});
const DocAddSchema = z.tuple([
  z.string().min(1),
  // filePath
  DocMetaSchema
  // meta
]);
const DocSearchSchema = z.string().nullable().optional();
const DocDeleteSchema = z.string().min(1);
const ConfigUpdateSchema = z.record(z.string(), z.unknown());
const AiCheckEndpointSchema = z.string().url();
const SysOpenPathSchema = z.string().min(1);
const SysFetchUrlSchema = z.object({
  url: z.string().url(),
  options: z.record(z.string(), z.unknown()).optional()
});
const TIMEOUT_MS = 6e4;
class TaskQueueManager extends EventEmitter {
  localQueue = [];
  cloudQueue = [];
  isLocalRunning = false;
  mainWindow = null;
  setMainWindow(window) {
    this.mainWindow = window;
  }
  syncFrontend() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send("queue:update", {
        localQueue: this.localQueue,
        cloudQueue: this.cloudQueue,
        isLocalRunning: this.isLocalRunning
      });
    }
  }
  addTask(taskData) {
    const id = taskData.id || `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const task = {
      ...taskData,
      id,
      status: "pending",
      createdAt: Date.now()
    };
    if (task.isLocal) {
      this.localQueue.push(task);
      this.localQueue.sort((a, b) => b.priority - a.priority);
    } else {
      this.cloudQueue.push(task);
      this.cloudQueue.sort((a, b) => b.priority - a.priority);
    }
    this.syncFrontend();
    this.processLocalQueue();
    return id;
  }
  async processLocalQueue() {
    if (this.isLocalRunning) return;
    this.isLocalRunning = true;
    this.syncFrontend();
    try {
      while (true) {
        const nextTask = this.localQueue.find((t) => t.status === "pending");
        if (!nextTask) break;
        nextTask.status = "running";
        nextTask.startedAt = Date.now();
        this.syncFrontend();
        try {
          const output = await this.executeTask(nextTask);
          nextTask.status = "completed";
          nextTask.completedAt = Date.now();
          nextTask.output = output;
        } catch (error) {
          nextTask.status = "failed";
          nextTask.error = error instanceof Error ? error.message : "Unknown error";
        }
        this.syncFrontend();
      }
    } finally {
      this.isLocalRunning = false;
      this.syncFrontend();
    }
  }
  async executeTask(task) {
    const model = task.modelId ? aiModelDao.get(task.modelId) : void 0;
    if (!model) throw new Error(`Model ${task.modelId} not found`);
    const executionPromise = (async () => {
      if (model.provider === "ollama") {
        const runner = getOllamaRunner(model.endpoint || void 0);
        const res = await runner.generate({
          model: model.modelId,
          prompt: task.prompt,
          system: task.systemPrompt
        });
        return res.response;
      } else if (model.provider === "lm_studio") {
        const runner = getLMStudioRunner(model.endpoint || void 0);
        return await runner.generate(task.prompt, task.systemPrompt);
      } else {
        throw new Error(`Unsupported provider: ${model.provider}`);
      }
    })();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Task timed out")), TIMEOUT_MS);
    });
    return Promise.race([executionPromise, timeoutPromise]);
  }
  // Helper to clear completed
  clearCompleted() {
    this.localQueue = this.localQueue.filter(
      (t) => t.status === "pending" || t.status === "running"
    );
    this.cloudQueue = this.cloudQueue.filter(
      (t) => t.status === "pending" || t.status === "running"
    );
    this.syncFrontend();
  }
}
const taskQueueManager = new TaskQueueManager();
class DocumentRepository {
  // ADDED: Robust Status-Based Transaction
  async addDocument(meta, chunks) {
    const sqlite = DatabaseFactory.getSQLite();
    const lance = await DatabaseFactory.getLanceDB();
    const initialStatus = "indexing";
    const insertMeta = sqlite.prepare(`
            INSERT INTO documents_meta (id, title, upload_date, status, path)
            VALUES (@id, @title, @uploadDate, @status, @path)
        `);
    const insertTransaction = sqlite.transaction(() => {
      insertMeta.run({
        id: meta.id,
        title: meta.title,
        uploadDate: meta.uploadDate,
        status: initialStatus,
        path: meta.path || null
      });
    });
    try {
      insertTransaction();
      if (chunks.length === 0) {
        this.updateStatus(meta.id, "ready");
        return;
      }
      let table;
      try {
        table = await lance.openTable("vectors");
      } catch {
        table = await lance.createTable("vectors", [
          {
            vector: chunks[0].vector ?? new Array(AIConfig.embedding.dimensions).fill(0),
            id: chunks[0].id,
            text: chunks[0].text,
            doc_id: meta.id,
            pageNumber: chunks[0].pageNumber,
            chunkIndex: chunks[0].chunkIndex,
            totalChunks: chunks[0].totalChunks
            // bbox omitted if optional/undefined
          }
        ]);
      }
      const vectorData = chunks.map((c) => ({
        vector: c.vector,
        id: c.id,
        text: c.text,
        doc_id: meta.id,
        pageNumber: c.pageNumber,
        chunkIndex: c.chunkIndex,
        totalChunks: c.totalChunks,
        bbox: c.bbox
      }));
      await table.add(vectorData);
      const exists = sqlite.prepare("SELECT 1 FROM documents_meta WHERE id = ?").get(meta.id);
      if (!exists) {
        safeLog$1.warn(
          `[Repo] Document ${meta.id} was deleted during indexing. Rolling back vectors...`
        );
        await table.delete(`doc_id = '${meta.id}'`);
        return;
      }
      this.updateStatus(meta.id, "ready");
      safeLog$1.log(
        `[Repo] Document ${meta.id} successfully processed and marked 'ready'.`
      );
    } catch (error) {
      safeLog$1.error("[Repo] Save failed, starting cleanup...", error);
      await this.deleteDocument(meta.id);
      throw new Error(`Save failed: ${error.message}`);
    }
  }
  // Helper for status updates
  updateStatus(id, status) {
    const sqlite = DatabaseFactory.getSQLite();
    sqlite.prepare("UPDATE documents_meta SET status = ? WHERE id = ?").run(status, id);
  }
  // SEARCH: Implicitly filters for valid documents
  async search(queryVector, limit = 20) {
    const sqlite = DatabaseFactory.getSQLite();
    const lance = await DatabaseFactory.getLanceDB();
    if (!queryVector) {
      const metaList2 = sqlite.prepare(
        `
                SELECT id, title, upload_date as uploadDate, status, path 
                FROM documents_meta 
                WHERE status = 'ready'
                ORDER BY upload_date DESC
                LIMIT ?
            `
      ).all(limit);
      return metaList2.map((meta) => ({
        id: meta.id,
        // Use doc ID as chunk ID for list view
        documentId: meta.id,
        text: `Document: ${meta.title}`,
        // Placeholder text
        score: 1,
        // Browsing has "perfect" score
        metadata: meta,
        pageNumber: 1,
        chunkIndex: 0,
        totalChunks: 1,
        vector: []
      }));
    }
    const table = await lance.openTable("vectors");
    const results = await table.search(queryVector).limit(limit).toArray();
    if (results.length === 0) return [];
    const docIds = results.map((r) => r.doc_id);
    if (docIds.length === 0) return [];
    const placeholders = docIds.map(() => "?").join(",");
    const metaList = sqlite.prepare(
      `
            SELECT id, title, upload_date as uploadDate, status, path 
            FROM documents_meta 
            WHERE id IN (${placeholders}) AND status = 'ready'
        `
    ).all(...docIds);
    const metaMap = new Map(metaList.map((m) => [m.id, m]));
    const hydratedResults = results.reduce((acc, r) => {
      const docId = r.doc_id;
      const meta = metaMap.get(docId);
      if (meta) {
        acc.push({
          id: r.id,
          documentId: docId,
          text: r.text,
          // LanceDB returns L2 distance by default, convert to similarity-like score if needed
          // For now, raw distance is OK, but UI expects 0-1 similarity usually.
          // Assuming Cosine distance if configured, 1 - distance = similarity
          score: 1 - (r._distance || 0),
          metadata: meta,
          pageNumber: r.pageNumber,
          chunkIndex: r.chunkIndex,
          totalChunks: r.totalChunks,
          bbox: r.bbox,
          vector: []
        });
      }
      return acc;
    }, []);
    return hydratedResults;
  }
  // DELETE: Deep Delete
  async deleteDocument(id) {
    safeLog$1.log(`[Repo] Deleting document: ${id}`);
    const sqlite = DatabaseFactory.getSQLite();
    const lance = await DatabaseFactory.getLanceDB();
    try {
      const table = await lance.openTable("vectors");
      await table.delete(`doc_id = '${id}'`);
    } catch {
      safeLog$1.warn(`[Repo] Vector cleanup skipped (table/vectors not found).`);
    }
    sqlite.prepare("DELETE FROM documents_meta WHERE id = ?").run(id);
  }
  // INTEGRITY: Optimized Startup Cleanup
  async verifyIntegrity() {
    safeLog$1.log("[Repo] Verifying database integrity...");
    const sqlite = DatabaseFactory.getSQLite();
    const stalledUploads = sqlite.prepare(
      `
            SELECT id, title FROM documents_meta WHERE status = 'indexing'
        `
    ).all();
    if (stalledUploads.length === 0) {
      safeLog$1.log("[Integrity] Database is healthy (No stalled uploads).");
      return;
    }
    safeLog$1.warn(
      `[Integrity] Found ${stalledUploads.length} stalled uploads. Cleaning up...`
    );
    for (const meta of stalledUploads) {
      safeLog$1.log(
        `[Integrity] Purging stalled document: ${meta.title} (${meta.id})`
      );
      await this.deleteDocument(meta.id);
    }
    safeLog$1.log("[Integrity] Cleanup complete.");
  }
}
class AIService {
  static instance;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extractor = null;
  modelId = AIConfig.embedding.modelId;
  initPromise = null;
  idleTimer = null;
  constructor() {
  }
  static getInstance() {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }
  async init() {
    if (this.extractor) return;
    if (this.initPromise) {
      return this.initPromise;
    }
    this.initPromise = (async () => {
      try {
        safeLog$1.log(`[AIService] Loading model: ${this.modelId}`);
        const bundledPath = path.join(process.resourcesPath, "models");
        const userDataPath = path.join(app.getPath("userData"), "ai-models");
        let cacheDir = userDataPath;
        if (app.isPackaged) {
          safeLog$1.log(
            `[AIService] Production mode: Checking bundled models at ${bundledPath}`
          );
          cacheDir = bundledPath;
        } else {
          safeLog$1.log(
            `[AIService] Dev mode: Using userData cache at ${userDataPath}`
          );
        }
        process.env.TRANSFORMERS_CACHE = cacheDir;
        this.extractor = await pipeline("feature-extraction", this.modelId, {
          quantized: true
          // Use quantized model for performance/size
          // cache_dir: cacheDir // Xenova transformers usually uses env var or default
          // local_files_only: localFilesOnly
        });
        safeLog$1.log(`[AIService] Model loaded successfully.`);
      } catch (error) {
        safeLog$1.error(`[AIService] Failed to load model:`, error);
        this.initPromise = null;
        throw error;
      }
    })();
    return this.initPromise;
  }
  /**
   * Memory Optimization:
   * Release model from memory after 30 minutes of inactivity.
   */
  resetIdleTimer() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }
    this.idleTimer = setTimeout(
      () => {
        safeLog$1.log("[AIService] Idle timer expired. Releasing model memory.");
        this.dispose();
      },
      30 * 60 * 1e3
    );
  }
  dispose() {
    if (this.extractor) {
      this.extractor = null;
      this.initPromise = null;
      if (global.gc) {
        global.gc();
      }
    }
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }
  /**
   * Generates an embedding vector for the given text.
   * Returns a Float32Array (zero-copy) for all-MiniLM-L6-v2.
   */
  async embed(text) {
    await this.init();
    this.resetIdleTimer();
    if (!this.extractor) {
      throw new Error("Model failed to initialize");
    }
    const cleanText = text.replace(/\n/g, " ").trim();
    if (!cleanText)
      return new Float32Array(AIConfig.embedding.dimensions).fill(0);
    const output = await this.extractor(cleanText, {
      pooling: "mean",
      normalize: true
    });
    return output.data;
  }
}
class IngestionService {
  static instance;
  queue = [];
  activeWorkers = 0;
  maxWorkers = 2;
  // Concurrent file files
  worker = null;
  // Persistent Worker
  constructor() {
  }
  static getInstance() {
    if (!IngestionService.instance) {
      IngestionService.instance = new IngestionService();
    }
    return IngestionService.instance;
  }
  // Initialize/Get Persistent Worker
  getWorker() {
    if (!this.worker) {
      const workerPath = path.join(__dirname, "ingestion.worker.js");
      safeLog$1.log(`[Ingestion] Initializing worker at: ${workerPath}`);
      this.worker = new Worker(workerPath, {
        resourceLimits: {
          maxOldGenerationSizeMb: 4096
          // 4GB
        }
      });
      this.worker.on("error", (err) => {
        safeLog$1.error("[Ingestion] Worker Error:", err);
        this.worker?.terminate();
        this.worker = null;
      });
      this.worker.on("exit", (code) => {
        if (code !== 0) {
          safeLog$1.error(`[Ingestion] Worker exited with code ${code}`);
          this.worker = null;
        }
      });
      safeLog$1.log("[Ingestion] Worker Pool Initialized.");
    }
    return this.worker;
  }
  async addFile(filePath, meta) {
    this.queue.push({ filePath, meta });
    this.processQueue();
  }
  /**
   * Immediate ingestion flow. Used when the caller needs to wait for completion.
   */
  async ingest(filePath, meta, onProgress) {
    safeLog$1.log(`[Ingestion] Starting immediate ingestion: ${meta.title}`);
    try {
      if (onProgress) onProgress("parsing", 0, 100, 0);
      const chunks = await this.parseInWorker(filePath, meta.id);
      if (onProgress) onProgress("parsing", 100, 100, 0);
      const ai = AIService.getInstance();
      const total = chunks.length;
      let processed = 0;
      const startTime = Date.now();
      for (const chunk of chunks) {
        const vectorArray = await ai.embed(chunk.text);
        chunk.vector = Array.from(vectorArray);
        processed++;
        if (onProgress && processed % 2 === 0) {
          const elapsed = Date.now() - startTime;
          const avgTimePerChunk = elapsed / processed;
          const remaining = total - processed;
          const etrSeconds = Math.ceil(remaining * avgTimePerChunk / 1e3);
          onProgress("vectorizing", processed, total, etrSeconds);
        }
      }
      const repo = new DocumentRepository();
      await repo.addDocument(meta, chunks);
      safeLog$1.log(`[Ingestion] Completed immediate ingestion: ${meta.title}`);
      return true;
    } catch (error) {
      safeLog$1.error(
        `[Ingestion] Immediate ingestion failed ${meta.title}:`,
        error
      );
      throw error;
    }
  }
  async parseInWorker(filePath, documentId) {
    return new Promise((resolve, reject) => {
      const worker = this.getWorker();
      const taskId = Math.random().toString(36).substring(7);
      const messageHandler = (msg) => {
        if (msg.id !== taskId) return;
        cleanup();
        if (msg.type === "success") {
          resolve(msg.data.chunks);
        } else {
          reject(new Error(msg.error));
        }
      };
      const errorHandler = (err) => {
        cleanup();
        reject(
          new Error(`Worker crashed processing ${filePath}: ${err.message}`)
        );
      };
      const exitHandler = (code) => {
        if (code !== 0) {
          cleanup();
          reject(
            new Error(`Worker process exited unexpectedly with code ${code}`)
          );
        }
      };
      const cleanup = () => {
        worker.off("message", messageHandler);
        worker.off("error", errorHandler);
        worker.off("exit", exitHandler);
      };
      worker.on("message", messageHandler);
      worker.on("error", errorHandler);
      worker.on("exit", exitHandler);
      worker.postMessage({ type: "parse", id: taskId, filePath, documentId });
    });
  }
  async processQueue() {
    if (this.queue.length === 0 || this.activeWorkers >= this.maxWorkers)
      return;
    const task = this.queue.shift();
    if (!task) return;
    this.activeWorkers++;
    try {
      await this.ingest(task.filePath, task.meta);
    } catch {
    } finally {
      this.activeWorkers--;
      this.processQueue();
    }
  }
}
async function addDirectoryToZip(zip, rootPath, currentPath = "") {
  const absolutePath = path.join(rootPath, currentPath);
  const items = fs.readdirSync(absolutePath);
  for (const item of items) {
    const itemRelativePath = path.join(currentPath, item);
    const itemAbsolutePath = path.join(rootPath, itemRelativePath);
    const stats = fs.statSync(itemAbsolutePath);
    if (stats.isDirectory()) {
      await addDirectoryToZip(zip, rootPath, itemRelativePath);
    } else {
      const content = fs.readFileSync(itemAbsolutePath);
      zip.file(itemRelativePath.replace(/\\/g, "/"), content);
    }
  }
}
async function createVault(databasesPath) {
  safeLog$1.log(`[Vault] Creating vault from: ${databasesPath}`);
  const zip = new JSZip();
  if (!fs.existsSync(databasesPath)) {
    throw new Error("Databases directory not found");
  }
  await addDirectoryToZip(zip, databasesPath);
  return await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}
async function extractVault(vaultBuffer, targetPath) {
  safeLog$1.log(`[Vault] Extracting vault to: ${targetPath}`);
  const zip = await JSZip.loadAsync(vaultBuffer);
  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath, { recursive: true });
  }
  for (const [relativePath, file] of Object.entries(zip.files)) {
    if (file.dir) {
      const dirPath = path.join(targetPath, relativePath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    } else {
      const content = await file.async("nodebuffer");
      const filePath = path.join(targetPath, relativePath);
      const parentDir = path.dirname(filePath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      fs.writeFileSync(filePath, content);
    }
  }
}
let handlersRegistered = false;
function registerIpcHandlers() {
  if (handlersRegistered) {
    safeLog$1.log("[IPC] Handlers already registered, skipping.");
    return;
  }
  handlersRegistered = true;
  safeLog$1.log("[IPC] Registering all handlers...");
  safeLog$1.log(`[IPC] DB_QUERY channel value: ${IpcChannels.DB_QUERY}`);
  const safeHandle = (channel, handler) => {
    try {
      ipcMain.removeHandler(channel);
      ipcMain.handle(channel, handler);
      safeLog$1.log(`[IPC] Successfully registered handler for: ${channel}`);
    } catch (e) {
      safeLog$1.error(`[IPC] Failed to register handler for ${channel}:`, e);
    }
  };
  const orchestrator = getOrchestrator();
  const handleRoutingDecision = (data) => {
    BrowserWindow.getAllWindows().forEach((win) => {
      if (!win.isDestroyed())
        win.webContents.send("orchestrator:routing_decision", data);
    });
  };
  orchestrator.on("routing_decision", handleRoutingDecision);
  safeHandle(
    IpcChannels.AI_GENERATE,
    async (_event, args) => {
      try {
        getOrchestrator().emit("activity", {
          type: "ipc_call",
          channel: IpcChannels.AI_GENERATE
        });
        const validation = AiGenerateSchema.safeParse(args);
        if (!validation.success) {
          safeLog$1.error("[IPC] Invalid arguments:", validation.error);
          throw new Error("Invalid arguments: " + validation.error.message);
        }
        const { prompt, options } = validation.data;
        const orchestratorInstance = getOrchestrator();
        const response = await orchestratorInstance.execute(
          prompt,
          options
        );
        return { response };
      } catch (error) {
        safeLog$1.error("[IPC] AI Generation error:", error);
        throw error;
      }
    }
  );
  safeHandle(
    IpcChannels.DB_SAVE_TUTOR_STATE,
    async (_event, state) => {
      try {
        const validation = DbSaveStateSchema.safeParse(state);
        if (!validation.success) {
          safeLog$1.error("[IPC] Invalid state:", validation.error);
          return false;
        }
        const db = getMainDb();
        const stmt = db.prepare(
          `INSERT OR REPLACE INTO tutor_snapshots (id, session_id, topic, context, created_at) VALUES (?, ?, ?, ?, ?)`
        );
        const sessionId = "current_session";
        stmt.run(
          "latest",
          // Single slot for now
          sessionId,
          validation.data.topic || "unknown",
          JSON.stringify(validation.data),
          Date.now()
        );
        return true;
      } catch (error) {
        safeLog$1.error("[IPC] Save state failed:", error);
        return false;
      }
    }
  );
  safeHandle(IpcChannels.DB_LOAD_TUTOR_STATE, async () => {
    try {
      const db = getMainDb();
      const row = db.prepare("SELECT context FROM tutor_snapshots WHERE id = ?").get("latest");
      return row ? JSON.parse(row.context) : {};
    } catch (error) {
      safeLog$1.error("[IPC] Load state failed:", error);
      return {};
    }
  });
  safeHandle(
    IpcChannels.TASK_ADD,
    async (event, taskData) => {
      try {
        const validation = TaskAddSchema.safeParse(taskData);
        if (!validation.success) {
          safeLog$1.error("[IPC] Invalid task data:", validation.error);
          throw new Error("Invalid task data: " + validation.error.message);
        }
        const { prompt, intent, priority, isLocal } = validation.data;
        const win = BrowserWindow.fromWebContents(event.sender);
        if (win) taskQueueManager.setMainWindow(win);
        const task = {
          prompt,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          intent,
          priority,
          isLocal,
          ...taskData || {}
          // Keep original metadata if any
        };
        const id = taskQueueManager.addTask(task);
        return id;
      } catch (error) {
        safeLog$1.error("[IPC] Add task failed:", error);
        throw error;
      }
    }
  );
  safeHandle(IpcChannels.TASK_CLEAR, async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) taskQueueManager.setMainWindow(win);
    taskQueueManager.clearCompleted();
    return true;
  });
  safeHandle("queue:process_local", async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) taskQueueManager.setMainWindow(win);
    await taskQueueManager.processLocalQueue();
    return true;
  });
  safeHandle(
    IpcChannels.DB_QUERY,
    async (_event, args) => {
      safeLog$1.log(`[IPC] Handler reached: ${IpcChannels.DB_QUERY}`, args);
      try {
        const validation = DbQuerySchema.safeParse(args);
        if (!validation.success) {
          safeLog$1.error("[IPC] Invalid database query arguments:", validation.error);
          throw new Error("Invalid query arguments: " + validation.error.message);
        }
        const { sql, params: sqlParams = [], method = "all" } = validation.data;
        const db = getMainDb();
        if (method === "run") {
          const result = db.prepare(sql).run(sqlParams);
          return result;
        } else if (method === "get") {
          const result = db.prepare(sql).get(sqlParams);
          return result;
        } else {
          const result = db.prepare(sql).all(sqlParams);
          return result;
        }
      } catch (error) {
        safeLog$1.error("[IPC] Database query failed:", error);
        throw error;
      }
    }
  );
  safeHandle(IpcChannels.VAULT_EXPORT, async (event) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (!win) return false;
      const { filePath } = await dialog.showSaveDialog(win, {
        title: "Export Elite Vault",
        defaultPath: `vwo-elite-vault-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.vwo-vault`,
        filters: [{ name: "Elite Vault", extensions: ["vwo-vault"] }]
      });
      if (!filePath) return false;
      const dbPath = DatabaseFactory.getDatabasesPath();
      const vaultBuffer = await createVault(dbPath);
      const fs2 = await import("fs");
      fs2.writeFileSync(filePath, vaultBuffer);
      safeLog$1.log(`[Vault] Export successful: ${filePath}`);
      return true;
    } catch (error) {
      safeLog$1.error("[Vault] Export failed:", error);
      return false;
    }
  });
  safeHandle(IpcChannels.VAULT_IMPORT, async (event) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (!win) return false;
      const { filePaths } = await dialog.showOpenDialog(win, {
        title: "Import Elite Vault",
        filters: [{ name: "Elite Vault", extensions: ["vwo-vault"] }],
        properties: ["openFile"]
      });
      if (!filePaths || filePaths.length === 0) return false;
      const filePath = filePaths[0];
      const { response } = await dialog.showMessageBox(win, {
        type: "warning",
        title: "Confirm Import",
        message: "Importing a vault will OVERWRITE all local data. The app will restart.",
        buttons: ["Cancel", "Import & Restart"],
        defaultId: 0,
        cancelId: 0
      });
      if (response === 0) return false;
      const fs2 = await import("fs");
      const vaultBuffer = fs2.readFileSync(filePath);
      const dbPath = DatabaseFactory.getDatabasesPath();
      await DatabaseFactory.closeAll();
      if (fs2.existsSync(dbPath)) {
        fs2.rmSync(dbPath, { recursive: true, force: true });
      }
      await extractVault(vaultBuffer, dbPath);
      safeLog$1.log(`[Vault] Import successful from ${filePath}. Relaunching...`);
      app.relaunch();
      app.exit(0);
      return true;
    } catch (error) {
      safeLog$1.error("[Vault] Import failed:", error);
      return false;
    }
  });
  safeHandle(IpcChannels.SYSTEM_STATUS, async () => {
    return {
      status: "ready",
      version: "2.0.0-elite",
      mainProcess: true
    };
  });
  safeHandle(IpcChannels.SYS_PING, () => "pong");
  safeHandle(IpcChannels.ORCHESTRATOR_EXECUTE, async (_event, args) => {
    safeLog$1.log("[IPC] Orchestrator Execute:", args);
    return "Orchestrator feedback: Processing...";
  });
  safeHandle(IpcChannels.TASK_UPDATE, async (_event, { id, updates }) => {
    safeLog$1.log(`[IPC] Task Update ${id}:`, updates);
    return true;
  });
  safeHandle(IpcChannels.TASK_REMOVE, async (_event, { id }) => {
    safeLog$1.log(`[IPC] Task Remove ${id}`);
    return true;
  });
  safeHandle("db:load", async () => {
    return ipcMain.emit(IpcChannels.DB_LOAD_TUTOR_STATE);
  });
  safeHandle("ai:check", async (_event, url) => {
    return ipcMain.emit(IpcChannels.AI_CHECK_ENDPOINT, _event, url);
  });
  safeHandle(
    IpcChannels.CONFIG_UPDATE,
    async (_event, newConfig) => {
      try {
        const validation = ConfigUpdateSchema.safeParse(newConfig);
        if (!validation.success) {
          safeLog$1.error("[IPC] Invalid config:", validation.error);
          return false;
        }
        getOrchestrator().updateConfig(validation.data);
        return true;
      } catch (error) {
        safeLog$1.error("[IPC] Config update failed:", error);
        return false;
      }
    }
  );
  safeHandle(
    IpcChannels.AI_CHECK_ENDPOINT,
    async (_event, url) => {
      try {
        const validation = AiCheckEndpointSchema.safeParse(url);
        if (!validation.success) return false;
        const response = await fetch(validation.data, {
          method: "GET",
          signal: AbortSignal.timeout(2e3)
        });
        return response.ok;
      } catch {
        return false;
      }
    }
  );
  safeHandle(
    IpcChannels.SYS_FETCH_URL,
    async (_event, args) => {
      try {
        const validation = SysFetchUrlSchema.safeParse(args);
        if (!validation.success) {
          throw new Error("Invalid fetch arguments");
        }
        const { url, options = {} } = validation.data;
        const res = await fetch(url, options);
        if (!res.ok) {
          return { ok: false, status: res.status, statusText: res.statusText };
        }
        const contentType = res.headers.get("content-type");
        let data;
        if (contentType?.includes("application/json")) {
          data = await res.json();
        } else {
          data = await res.text();
        }
        return { ok: true, status: res.status, data };
      } catch (error) {
        safeLog$1.error(`[IPC] Fetch proxy failed:`, error);
        return { ok: false, error: error.message };
      }
    }
  );
  safeHandle(IpcChannels.PERF_TRACE_START, async () => {
    try {
      await contentTracing.startRecording({
        included_categories: ["*"]
        // Record everything
      });
      return true;
    } catch (e) {
      safeLog$1.error("Failed to start tracing:", e);
      return false;
    }
  });
  safeHandle(IpcChannels.PERF_TRACE_STOP, async () => {
    try {
      const path2 = await contentTracing.stopRecording();
      safeLog$1.log("Trace saved to:", path2);
      return path2;
    } catch (e) {
      safeLog$1.error("Failed to stop tracing:", e);
      return null;
    }
  });
  safeHandle(
    IpcChannels.DOC_ADD,
    async (event, ...args) => {
      const validation = DocAddSchema.safeParse(args);
      if (!validation.success) {
        safeLog$1.error("[IPC] Invalid doc add args:", validation.error);
        return { error: "Invalid arguments: " + validation.error.message };
      }
      const [filePath, metaData] = validation.data;
      const meta = metaData;
      safeLog$1.log(`[IPC] doc:add called for ${filePath}`);
      const win = BrowserWindow.fromWebContents(event.sender);
      try {
        const result = await IngestionService.getInstance().ingest(
          filePath,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          meta,
          // IngestionService expects its own DocumentMeta, assume compatible
          (stage, current, total, etr) => {
            if (win && !win.isDestroyed()) {
              win.webContents.send(IpcChannels.DOC_PROGRESS, {
                fileId: meta.id,
                // Ensure frontend matches progress to file
                stage,
                current,
                total,
                etr
              });
            }
          }
        );
        return result;
      } catch (error) {
        safeLog$1.error("[IPC] Ingestion failed:", error);
        return { error: error.message };
      }
    }
  );
  safeHandle(
    IpcChannels.DOC_SEARCH,
    async (_event, queryArg) => {
      try {
        const validation = DocSearchSchema.safeParse(queryArg);
        if (!validation.success) {
          safeLog$1.error("[IPC] Invalid search query:", validation.error);
          return [];
        }
        const query = validation.data;
        const repo = new DocumentRepository();
        if (!query || query.trim() === "") {
          safeLog$1.log("[IPC] Empty query detected, triggering Browse Mode");
          return await repo.search(null);
        }
        const ai = AIService.getInstance();
        const queryVector = await ai.embed(query);
        return await repo.search(queryVector);
      } catch (error) {
        safeLog$1.error("[IPC] Search failed:", error);
        return [];
      }
    }
  );
  safeHandle(
    IpcChannels.DOC_DELETE,
    async (_event, idArg) => {
      try {
        const validation = DocDeleteSchema.safeParse(idArg);
        if (!validation.success) return false;
        const repo = new DocumentRepository();
        await repo.deleteDocument(validation.data);
        return true;
      } catch (error) {
        safeLog$1.error("[IPC] Delete failed:", error);
        return false;
      }
    }
  );
  safeHandle(IpcChannels.SYS_OPEN_PATH, async (_event, path2) => {
    const validation = SysOpenPathSchema.safeParse(path2);
    if (!validation.success) return false;
    const { shell } = await import("electron");
    await shell.openPath(validation.data);
    return true;
  });
  safeHandle("knowledge:save", async (_event, dataString) => {
    try {
      const db = getMainDb();
      const rawEntries = JSON.parse(dataString);
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO knowledge_digests (key, data, created_at, last_used_at)
        VALUES (?, ?, ?, ?)
      `);
      const now = Date.now();
      const transaction = db.transaction((entries) => {
        for (const [key, entry] of entries) {
          stmt.run(key, JSON.stringify(entry), entry.timestamp || now, now);
        }
      });
      transaction(rawEntries);
      return true;
    } catch (e) {
      safeLog$1.error("[Knowledge] Save to SQLite failed:", e);
      return false;
    }
  });
  safeHandle("knowledge:load", async () => {
    try {
      const db = getMainDb();
      const rows = db.prepare("SELECT key, data FROM knowledge_digests").all();
      if (rows.length === 0) return null;
      const entries = rows.map((row) => [row.key, JSON.parse(row.data)]);
      db.prepare("UPDATE knowledge_digests SET last_used_at = ?").run(Date.now());
      return JSON.stringify(entries);
    } catch (e) {
      safeLog$1.error("[Knowledge] Load from SQLite failed:", e);
      return null;
    }
  });
  safeHandle(IpcChannels.WINDOW_MINIMIZE, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win?.minimize();
  });
  safeHandle(IpcChannels.WINDOW_MAXIMIZE, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      if (win.isMaximized()) {
        win.unmaximize();
      } else {
        win.maximize();
      }
    }
  });
  safeHandle(IpcChannels.WINDOW_CLOSE, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win?.close();
  });
  safeHandle(IpcChannels.WINDOW_IS_MAXIMIZED, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    return win?.isMaximized();
  });
  return () => {
    orchestrator.off("routing_decision", handleRoutingDecision);
    ipcMain.removeHandler(IpcChannels.AI_GENERATE);
    ipcMain.removeHandler(IpcChannels.DB_SAVE_TUTOR_STATE);
    ipcMain.removeHandler(IpcChannels.DB_LOAD_TUTOR_STATE);
    ipcMain.removeHandler(IpcChannels.TASK_ADD);
    ipcMain.removeHandler(IpcChannels.TASK_CLEAR);
    ipcMain.removeHandler(IpcChannels.DB_QUERY);
    ipcMain.removeHandler(IpcChannels.SYSTEM_STATUS);
    ipcMain.removeHandler(IpcChannels.CONFIG_UPDATE);
    ipcMain.removeHandler(IpcChannels.AI_CHECK_ENDPOINT);
  };
}
performance.mark("app-start");
app.commandLine.appendSwitch("enable-unsafe-swiftshader");
function setupSecurity() {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const isDev = !app.isPackaged;
    const headers = { ...details.responseHeaders };
    Object.keys(headers).forEach((k) => {
      if (k.toLowerCase() === "content-security-policy") delete headers[k];
    });
    const scriptSrc = isDev ? "'self' 'unsafe-inline' 'unsafe-eval' blob:" : "'self' 'unsafe-inline' blob:";
    const connectSrc = [
      "'self'",
      "https:",
      "wss:",
      "http://localhost:3001",
      "http://localhost:11434",
      "http://localhost:1234",
      "http://localhost:1337",
      "http://127.0.0.1:3001",
      "http://127.0.0.1:11434",
      "http://127.0.0.1:1234",
      "http://127.0.0.1:1337",
      "ws://localhost:11434",
      "ws://localhost:1234",
      "ws://localhost:1337",
      "ws://127.0.0.1:11434",
      "ws://127.0.0.1:1234",
      "ws://127.0.0.1:1337"
    ].join(" ");
    callback({
      responseHeaders: {
        ...headers,
        "Content-Security-Policy": [
          `default-src 'self'; script-src ${scriptSrc}; worker-src 'self' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src ${connectSrc}; media-src 'self' data: blob:; frame-src 'self' https://embed.windy.com; object-src 'none';`
        ]
      }
    });
  });
}
if (app.isPackaged) {
  const noop = () => {
  };
  console.log = noop;
  console.warn = noop;
  console.error = noop;
  console.time = noop;
  console.timeEnd = noop;
  process.stdout.write = () => true;
  process.stderr.write = () => true;
}
process.on("uncaughtException", (err) => {
  if (err.code === "EPIPE") return;
  safeLog$1.error("[Main] Uncaught Exception:", err);
});
const V8_MARKER = join(app.getPath("userData"), ".v8_instant_marker");
const isFirstRun = !existsSync(V8_MARKER);
const resolveResource = (...paths) => {
  if (app.isPackaged) {
    return join(process.resourcesPath, ...paths);
  }
  return join(__dirname, "../../public", ...paths);
};
let splash = null;
let mainWindow = null;
let splashStartTime = Date.now();
function createSplash() {
  splash = new BrowserWindow({
    width: 600,
    height: 400,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    center: true,
    show: false,
    // READY-TO-SHOW PATTERN
    fullscreen: isFirstRun,
    // Cinematic is always fullscreen
    backgroundColor: "#000000",
    icon: resolveResource("favicon.ico"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      // Simpler for splash communication
      backgroundThrottling: false
    }
  });
  const splashFile = isFirstRun ? "splash_cinematic.html" : "splash.html";
  splash.loadFile(resolveResource(splashFile));
  ipcMain.once("splash:video-ready", () => {
    if (splash && !splash.isDestroyed()) {
      splash.show();
      splashStartTime = Date.now();
      safeLog$1.log("[Main] Splash is visible and playing.");
    }
  });
}
async function bootstrap() {
  safeLog$1.log("[Main] Starting Bootstrap...");
  try {
    initMainDb();
    new DocumentRepository().verifyIntegrity().catch(safeLog$1.error);
    getOrchestrator();
    getDreamingAgent();
    ipcMain.handle("sys:get-resources-path", () => {
      return app.isPackaged ? process.resourcesPath : join(__dirname, "../../public");
    });
    registerIpcHandlers();
    safeLog$1.log("[Main] IPC Handlers registered successfully.");
    createWindow();
    if (isFirstRun) {
      writeFileSync(V8_MARKER, "GOLDEN");
    }
    safeLog$1.log("[Main] VWO Elite Architecture ready.");
    performance.mark("app-bootstrap-done");
  } catch (error) {
    safeLog$1.error("[Main] FATAL: Error during bootstrap:", error);
    throw error;
  }
}
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    backgroundColor: "#020617",
    center: true,
    frame: false,
    autoHideMenuBar: true,
    icon: resolveResource("favicon.ico"),
    webPreferences: {
      preload: join(__dirname, "../preload/index.mjs"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.on("ready-to-show", () => {
    const MIN_DURATION = isFirstRun ? 8e3 : 0;
    const elapsedTime = Date.now() - splashStartTime;
    const remainingTime = Math.max(0, MIN_DURATION - elapsedTime);
    safeLog$1.log(`[Main] Splash active for ${elapsedTime}ms. Remaining: ${remainingTime}ms`);
    setTimeout(() => {
      if (splash && !splash.isDestroyed()) {
        splash.destroy();
        splash = null;
      }
      if (mainWindow) {
        mainWindow.maximize();
        mainWindow.show();
        mainWindow.focus();
        performance.measure("main-window-visible", "app-start");
      }
    }, remainingTime);
  });
  const rendererUrl = process.env.ELECTRON_RENDERER_URL;
  if (rendererUrl) {
    mainWindow.loadURL(rendererUrl);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
  app.whenReady().then(() => {
    performance.mark("app-ready");
    if (!app.isPackaged) {
      createSplash();
    }
    setupSecurity();
    bootstrap().catch((err) => {
      safeLog$1.error("[Main] Critical bootstrap failure:", err);
    });
  });
}
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0 && app.isReady()) {
    createWindow();
  }
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
