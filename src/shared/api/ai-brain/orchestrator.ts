/**
 * AI Brain Orchestrator
 * Central controller that routes tasks to the best available model
 * Part of the 1250% Elite Intelligence Upgrade
 */

import type { LLMMessage, LLMToolDefinition } from "@shared/api/providers/types";

import { useModelRegistryStore } from "../../model/modelRegistryStore";
import type { AIModel, OrchestratorConfig, RoutingDecision, TaskIntent } from "../../types/ai-brain";
import type { CustomAIProvider } from "../../types/config";
import { isValidMultiAgentResponse, type MultiAgentResponse } from "../multiAgentTypes";
import { getContextInjector } from "./contextInjector";
import { getIntelligenceConfig, mapIntentToIntelligence } from "./intelligenceLinker";
import { classifyIntent, intentToCapability } from "./intentClassifier";
import { getMCPOrchestrator } from "./mcpOrchestrator";
import { mcpPromptManager } from "./mcpPromptManager";
import { getTaskExecutor, useTaskQueueStore } from "./taskQueue";
import { getToolRunner } from "./toolRunner";

type ChatMessage = LLMMessage;

interface ToolCall {
  name: string;
  args: Record<string, unknown>;
}

/**
 * Smart truncation strategy to preserve prompt structure
 * Keeps the start (instructions) and end (specific data) while cutting the middle
 */
function smartTruncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const keepEnd = Math.floor(maxChars * 0.2); // Keep last 20%
  const keepStart = maxChars - keepEnd - 80; // keep rest at start, 80 for ellipsis
  return text.substring(0, keepStart) +
    `\n\n[... ${text.length - maxChars} karakters overgeslagen voor context-behoud ...]\n\n` +
    text.substring(text.length - keepEnd);
}

/**
 * Intelligent message pruning for structured history
 * Keeps the system prompt (index 0) and the last N items, pruning the middle
 */
function smartPruneMessages(messages: ChatMessage[], maxTokens: number): ChatMessage[] {
  // Conservative estimate: 4 chars = 1 token
  const estimateTokens = (msgs: ChatMessage[]) => msgs.reduce((acc, m) => acc + Math.ceil(m.content.length / 4), 0);

  if (estimateTokens(messages) <= maxTokens) return messages;

  console.warn(`[Elite] Scaling history: Context limit reached. Pruning middle turns.`);

  // Always keep first message (usually system prompt or first user instruction)
  const head = messages.slice(0, 1);
  // Keep the last 4 messages (approx 2 turns) for immediate context
  const tail = messages.slice(-4);

  return [...head, { role: "system", content: "[... Oudere context geplet voor geheugenbehoud ...]" }, ...tail];
}

// =============================================================================
// DEFAULT CONFIG
// =============================================================================

const DEFAULT_CONFIG: OrchestratorConfig = {
  routingStrategy: "rule_based",
  fallbackEnabled: true,
  maxRetries: 2,
  contextInjectionEnabled: true,
  maxContextTokens: 4096,
  proactiveSuggestionsEnabled: true,
  suggestionTypes: ["exam_prep", "practice_reminder", "weak_point_focus"],
  showRoutingDecisions: true,
  debugMode: false,
};

// =============================================================================
// ORCHESTRATOR CLASS
// =============================================================================

export class Orchestrator {
  private config: OrchestratorConfig;
  private routingHistory: RoutingDecision[] = [];
  private listeners: Map<string, Set<(event: unknown) => void>> = new Map();

  constructor(config: Partial<OrchestratorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // =========================
  // CONFIGURATION
  // =========================

  updateConfig(updates: Partial<OrchestratorConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  getConfig(): OrchestratorConfig {
    return { ...this.config };
  }

  // =========================
  // EVENT SYSTEM
  // =========================

  on(event: string, callback: (data: unknown) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.off(event, callback);
    };
  }

  off(event: string, callback: (data: unknown) => void): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach((callback) => callback(data));
  }

  // =========================
  // INTENT CLASSIFICATION
  // =========================

  async classifyQuery(query: string): Promise<TaskIntent> {
    const result = await classifyIntent(query, {
      llmFallback: this.config.routingStrategy === "llm_based",
      generateFn:
        this.config.routingStrategy === "llm_based"
          ? (p) => this.quickGenerate(p)
          : undefined,
    });

    this.emit("intent_classified", { query, result });
    return result.intent;
  }

  // =========================
  // MODEL SELECTION
  // =========================

  selectModel(
    intent: TaskIntent,
    options?: {
      requireLocal?: boolean;
      preferFast?: boolean;
      preferQuality?: boolean;
      excludeModels?: string[];
    },
  ): RoutingDecision | null {
    const modelRegistry = useModelRegistryStore.getState();

    // --- PHASE 4: ELITE INTELLIGENCE OVERRIDE ---
    const intelId = mapIntentToIntelligence(intent);
    const intelConfig = getIntelligenceConfig(intelId);

    if (intelConfig && intelConfig.modelId && intelConfig.modelId !== "default") {
      const configuredModel = modelRegistry.models.find(
        (m) => m.modelId === intelConfig.modelId || m.name === intelConfig.modelId
      );

      if (configuredModel && configuredModel.enabled) {
        return {
          taskId: `intel-override-${Date.now()}`,
          selectedModel: configuredModel,
          reason: `Elite Intelligence Overlay: ${intelId} configured to ${configuredModel.name}`,
          alternatives: [],
          confidence: 1.0,
        };
      }
    }

    const capability = intentToCapability(intent);

    // Get all models with required capability
    let candidates = modelRegistry.getModelsWithCapability(capability);

    // Filter by local if required
    if (options?.requireLocal) {
      candidates = candidates.filter((m) =>
        ["ollama", "lm_studio", "gpt4all", "custom"].includes(m.provider),
      );
    }

    // Exclude specified models
    if (options?.excludeModels) {
      candidates = candidates.filter(
        (m) => !options.excludeModels!.includes(m.id),
      );
    }

    if (candidates.length === 0) {
      this.emit("routing_failed", {
        intent,
        capability,
        reason: "No models available",
      });
      return null;
    }

    const scored = candidates.map((model) => ({
      model,
      score: this.scoreModel(model, intent, options),
    }));

    scored.sort((a, b) => b.score - a.score);

    const selected = scored[0]!.model;
    const alternatives = scored.slice(1, 4).map((s) => s.model);

    const decision: RoutingDecision = {
      taskId: `routing-${Date.now()}`,
      selectedModel: selected,
      reason: this.generateRoutingReason(selected, intent, options),
      alternatives,
      confidence: scored[0]!.score / 100,
    };

    this.routingHistory.push(decision);
    if (this.routingHistory.length > 100) {
      this.routingHistory.shift();
    }

    if (this.config.showRoutingDecisions) {
      this.emit("routing_decision", decision);
    }

    return decision;
  }

  private scoreModel(
    model: AIModel,
    intent: TaskIntent,
    options?: {
      preferFast?: boolean;
      preferQuality?: boolean;
    },
  ): number {
    let score = 0;
    const requiredCap = intentToCapability(intent);
    if (model.capabilities.includes(requiredCap)) {
      score += 20;
    }
    score += model.priority;
    score += model.metrics.successRate * 20;

    if (options?.preferFast) {
      if (model.metrics.avgResponseMs > 5000) score -= 20;
      if (model.metrics.avgResponseMs < 1000) score += 15;
    }

    if (options?.preferQuality) {
      if (model.capabilities.includes("reasoning")) score += 10;
      if (model.capabilities.includes("long_context")) score += 5;
    }

    if (["ollama", "lm_studio", "gpt4all"].includes(model.provider)) {
      score += 5;
    }

    if (model.metrics.lastErrorAt) {
      const hoursSinceError = (Date.now() - model.metrics.lastErrorAt) / 3600000;
      if (hoursSinceError < 1) score -= 30;
      else if (hoursSinceError < 24) score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  private generateRoutingReason(
    model: AIModel,
    intent: TaskIntent,
    options?: { preferFast?: boolean; preferQuality?: boolean },
  ): string {
    const parts: string[] = [`Intent: ${intent}`];
    if (options?.preferFast) parts.push(`Fast mode`);
    else if (options?.preferQuality) parts.push(`Quality mode`);
    if (model.priority > 70) parts.push(`High priority`);
    if (model.metrics.successRate > 0.95) parts.push(`Reliable`);
    return parts.join(" | ");
  }

  // =========================
  // TASK EXECUTION
  // =========================

  async execute(
    prompt: string,
    options?: {
      systemPrompt?: string;
      images?: string[];
      intent?: TaskIntent;
      context?: string;
      preferFast?: boolean;
      preferQuality?: boolean;
      requireLocal?: boolean;
      taskId?: string;
      signal?: AbortSignal;
    },
  ): Promise<string> {
    // Elite Guard: Empty prompt validation
    if (!prompt || prompt.trim().length === 0) {
      return "Ik heb een vraag of opdracht nodig om je te helpen. Wat kan ik voor je doen?";
    }

    // Elite Guard: Huge prompt pre-check (32k char limit before processing)
    const MAX_INPUT_CHARS = 32000;
    if (prompt.length > MAX_INPUT_CHARS) {
      console.warn(`[Orchestrator] Prompt too long (${prompt.length} chars). Applying smart truncation.`);
      prompt = smartTruncate(prompt, MAX_INPUT_CHARS);
    }

    // --- PHASE 0: CONTEXT & MEMORY INJECTION ---
    // We laden context NU, zodat zowel de Classifier als de Agents er gebruik van kunnen maken.
    let context = options?.context || "";

    // Alleen ophalen als het nog niet is meegegeven én injectie aan staat
    if (this.config.contextInjectionEnabled && !options?.context) {
      try {
        // Performance Guard: Skip heavy vector search for simple greetings/commands
        // Dit voorkomt vertraging op "Hoi" of "Dankjewel"
        const isSimpleCommand = prompt.length < 20 && !prompt.toLowerCase().includes("context") && !prompt.toLowerCase().includes("dit");

        if (!isSimpleCommand) {
          const injection = await getContextInjector().buildContext(prompt, {});
          if (injection.systemPromptAddendum) {
            context = injection.systemPromptAddendum;
          }
        }
      } catch (e) {
        // Non-fatal warning: we gaan door zonder geheugen als de database faalt
        console.warn("[Orchestrator] Context injection warning:", e);
      }
    }

    // --- PHASE 1: INTENT CLASSIFICATION ---
    // De classifier kan nu profiteren van de geladen context (toekomstige optimalisatie)
    const intent = options?.intent || (await this.classifyQuery(prompt));

    // 1.2 Handle Complex Goal (Agentic Planning)
    if (intent === "complex_goal") {
      try {
        const { generatePlan } = await import("./planExecutor");
        const mcpOrchestrator = getMCPOrchestrator();
        const tools = await mcpOrchestrator.getToolDefinitionsForLLM(prompt);
        const typedTools = tools.map((t) => ({ name: String(t.name), description: String(t.description) }));

        // Pass context to planner if needed
        const fullPrompt = context ? `${prompt}\n\n[Relevant Context]:\n${context}` : prompt;
        const plan = await generatePlan(fullPrompt, typedTools);

        return `Ik heb een plan voor je gemaakt om dit doel te bereiken:\n\n${plan.steps.map((s, i) => `${i + 1}. **${s.title}**\n   _${s.description}_`).join("\n")}\n\nZal ik beginnen met het uitvoeren van de eerste stap?`;
      } catch (e) {
        console.error("[Orchestrator] Planning failed:", e);
        return "Mijn excuses, ik kon geen stappenplan genereren voor dit doel. Kan ik je op een andere manier helpen?";
      }
    }

    // 1.3 Handle Somtoday Actions (Agentic Intelligence)
    if (intent === "somtoday_action") {
      try {
        const { getSomtodayService } = await import("../somtodayService");
        const somtoday = getSomtodayService();
        if (somtoday.isConnected()) {
          const lowerPrompt = prompt.toLowerCase();
          if (lowerPrompt.includes("rooster") || lowerPrompt.includes("les")) {
            const now = new Date();
            const start = now.toISOString().split("T")[0]!;
            const end = new Date(now.getTime() + 86400000).toISOString().split("T")[0]!;
            const schedule = await somtoday.getSchedule(start, end);
            // Elite fix: Proper null guard + length check
            if (schedule && schedule.length > 0) {
              return `Je hebt vandaag de volgende lessen:\n${schedule.map((s) => `- **${s.titel}** (${s.beginDatumTijd?.split("T")[1]?.substring(0, 5)}) in lokaal ${s.locatie || 'onbekend'}`).join("\n")}`;
            }
            return "Ik kon geen lessen vinden voor vandaag.";
          }
        }
      } catch (e) {
        console.error("[Orchestrator] Somtoday action failed:", e);
        return "Er ging iets mis bij het ophalen van je Somtoday gegevens. Controleer je verbinding of probeer het later opnieuw.";
      }
    }

    // 1.4 Handle Image Generation
    if (intent === "image_generation") {
      try {
        const { generateImage } = await import("../imageGenService");
        const { resolveApiKey } = await import("../../lib/keyResolver");
        const modelRegistry = useModelRegistryStore.getState();
        const bestImageModel = modelRegistry.getBestModelForCapability("vision");
        const provider = bestImageModel?.provider || "openai";
        const apiKey = await resolveApiKey(provider, bestImageModel?.apiKeyId);
        if (apiKey) {
          const result = await generateImage(prompt, {
            apiKey,
            model: (bestImageModel?.modelId === "dall-e-3" || bestImageModel?.modelId === "dall-e-2") ? bestImageModel.modelId : "dall-e-2"
          });
          return `Ik heb een afbeelding voor je gegenereerd:\n![${prompt}](${result.url})\n\n_Revised Prompt: ${result.revisedPrompt}_`;
        }
      } catch (e) {
        console.error("[Orchestrator] Image generation failed:", e);
        return "Excuses, het genereren van de afbeelding is mislukt. Probeer een andere omschrijving.";
      }
    }

    // 1.4 Handle Speech Output
    if (intent === "speech_output") {
      try {
        const { playSpeech } = await import("../ttsService");
        const { resolveApiKey } = await import("../../lib/keyResolver");
        const modelRegistry = useModelRegistryStore.getState();
        const ttsModel = modelRegistry.getBestModelForCapability("audio");
        const provider = ttsModel?.provider || "openai";
        const apiKey = await resolveApiKey(provider, ttsModel?.apiKeyId);
        if (apiKey) {
          const textToSpeak = options?.context || prompt;
          await playSpeech(textToSpeak, { apiKey });
          return "Ik lees de tekst nu voor u voor. 🎙️";
        }
      } catch (e) {
        console.error("[Orchestrator] Speech output failed:", e);
        return "Ik kon de tekst niet voorlezen op dit moment.";
      }
    }

    // 1.5 Handle Video Generation (Temporal)
    if (intent === "video_generation") {
      try {
        const { generateVideo } = await import("../videoService");
        const { resolveApiKey } = await import("../../lib/keyResolver");
        const modelRegistry = useModelRegistryStore.getState();
        const videoModel = modelRegistry.getModelsWithCapability("vision").find(m => m.provider === "openai" || m.provider === "custom") || { provider: "openai" };
        const apiKey = await resolveApiKey(videoModel.provider, (videoModel as AIModel).apiKeyId);
        if (apiKey) {
          const result = await generateVideo(prompt, { apiKey });
          return `Ik ben de video-simulatie voor je aan het voorbereiden (ID: ${result.id}). Dit duurt meestal 1-2 minuten. Je krijgt een seintje als het filmpje klaar is! 🎥`;
        }
      } catch (e) {
        console.error("[Orchestrator] Video generation failed:", e);
        return "De video-simulatie kon niet worden gestart. Probeer het later nog eens.";
      }
    }

    // 1.6 Handle Multi-Agent (Social)
    if (intent === "multi_agent_collab") {
      try {
        const { runMultiAgentSession } = await import("../multiAgentService");
        const lowerPrompt = prompt.toLowerCase();
        // Elite fix: Type-safe agent selection without unsafe casts
        const VALID_AGENTS = ["biologist", "historian", "economist", "mathematician", "data_scientist", "scientific_researcher"] as const;
        const matchedAgents = VALID_AGENTS.filter(a => lowerPrompt.includes(a.substring(0, 4)) || lowerPrompt.includes(a.split('_')[0]!));
        const finalAgents: string[] = matchedAgents.length > 0 ? [...matchedAgents] : ["biologist", "scientific_researcher"];

        // ELITE FIX: Inject Context into the Agent Session!
        // Zonder dit weten de agents niet waar "het document" over gaat.
        const augmentedPrompt = context
          ? `${prompt}\n\n[ACHTERGRONDINFORMATIE UIT GEHEUGEN]:\n${context}`
          : prompt;

        const session = runMultiAgentSession(augmentedPrompt, finalAgents);

        let lastValue: unknown = null;
        for await (const update of session) {
          lastValue = update;
        }
        if (!isValidMultiAgentResponse(lastValue)) {
          throw new Error('Multi-agent sessie retourneerde een ongeldig of corrupt formaat.');
        }
        const result = lastValue as MultiAgentResponse;
        return `### Elite Expert Consensus\n\n${result.consensus}\n\n---\n**Bijdragen van experts:**\n` +
          result.individualInsights.map((i) => `* **${i.agent}**: _${i.insight.substring(0, 100)}..._`).join("\n");
      } catch (e) {
        console.error("[Orchestrator] Multi-agent session failed:", e);
        return "De experts konden het niet eens worden of de sessie is afgebroken. Probeer het opnieuw met een specifiekere vraag.";
      }
    }

    // 1.7 Handle Quantum Reasoning (Quantum Logic)
    if (intent === "quantum_reasoning") {
      try {
        const { executeQuantumReasoning } = await import("../quantumLogicService");
        const subject = prompt.toLowerCase().includes("wiskunde") ? "math_d" : "quantum_physics";
        const result = await executeQuantumReasoning(prompt, subject);
        return `### Analyse Voltooid\n\n${result.solution}\n\n**Bewijs:** ${result.proof}`;
      } catch (e) {
        console.error("[Orchestrator] Quantum reasoning failed:", e);
        return "De quantum-analyse is mislukt door een berekeningsfout. Controleer je formulering.";
      }
    }

    // (OUDE Context Injection Blok is hier verwijderd - zie Phase 0)

    // 2. Select best model
    const routing = this.selectModel(intent, {
      requireLocal: options?.requireLocal,
      preferFast: options?.preferFast,
      preferQuality: options?.preferQuality,
    });

    if (!routing) throw new Error(`No model available for intent: ${intent}`);

    const mcpOrchestrator = getMCPOrchestrator();
    const tools = await mcpOrchestrator.getToolDefinitionsForLLM(prompt);
    // 3. Queue task
    const intelId = mapIntentToIntelligence(intent);
    const intelConfig = getIntelligenceConfig(intelId);
    const isLocal = ["ollama", "lm_studio", "gpt4all"].includes(routing.selectedModel.provider);

    const taskQueue = useTaskQueueStore.getState();
    const taskId = taskQueue.addTask({
      intent,
      prompt,
      systemPrompt: options?.systemPrompt,
      images: options?.images,
      context,
      modelId: routing.selectedModel.id,
      priority: options?.preferFast ? 80 : 50,
      isLocal,
    });

    // 4. Execute
    if (isLocal) {
      const executor = getTaskExecutor();
      await executor.processLocalQueue();
      // Elite fix: Add timeout to prevent infinite polling
      const TIMEOUT_MS = 60000; // 60 seconds max wait
      const startTime = Date.now();
      return new Promise((resolve, reject) => {
        const checkResult = () => {
          // Elite guard: Timeout check
          if (Date.now() - startTime > TIMEOUT_MS) {
            return reject(new Error("Taak timeout: lokale AI reageerde niet binnen 60 seconden."));
          }
          const task = useTaskQueueStore.getState().getTask(taskId);
          if (!task) return reject(new Error("Task not found"));
          if (task.status === "completed") resolve(task.output || "");
          else if (task.status === "failed") reject(new Error(task.error || "Task failed"));
          else setTimeout(checkResult, 100);
        };
        checkResult();
      });
    } else {
      return await this.executeCloudTask(routing.selectedModel, {
        taskId,
        prompt,
        systemPrompt: options?.systemPrompt,
        images: options?.images,
        context,
        tools: tools as LLMToolDefinition[],
        intelConfig,
        signal: options?.signal,
      });
    }
  }

  private async executeCloudTask(
    model: AIModel,
    request: {
      taskId?: string;
      prompt: string;
      systemPrompt?: string;
      images?: string[];
      context?: string;
      tools?: LLMToolDefinition[];
      intelConfig?: Record<string, unknown>;
      signal?: AbortSignal;
    },
  ): Promise<string> {
    const modelRegistry = useModelRegistryStore.getState();
    const toolRunner = getToolRunner();

    try {
      const fullPrompt = request.context ? `${request.prompt}\n\n[CONTEXT]\n${request.context}` : request.prompt;
      let systemPrompt = request.systemPrompt;

      if (this.config.proactiveSuggestionsEnabled) {
        if (request.prompt.toLowerCase().includes("hint") || request.prompt.toLowerCase().includes("uitleg")) {
          systemPrompt = mcpPromptManager.getPrompt("socratic_coach", { context: request.context || "studie" });
        } else if (request.prompt.toLowerCase().includes("examen") || request.prompt.toLowerCase().includes("binas")) {
          systemPrompt = mcpPromptManager.getPrompt("exam_prep");
        }
      }

      if (model.provider === "gemini" || model.provider === "groq") {
        const { cascadeGenerate } = await import("../aiCascadeService");
        let turnCount = 0;
        const MAX_TURNS = 3;
        const MAX_CONTEXT_TOKENS = this.config.maxContextTokens || 4096;
        // Elite fix: Conservative token estimate (3 chars/token) with 1.2x safety buffer
        let estimatedTokens = Math.ceil((request.prompt.length / 3) * 1.2);
        let lastResponse: { content: string; functionCalls?: ToolCall[] } | null = null;
        const { useTaskQueueStore } = await import("./taskQueue");
        const taskQueue = useTaskQueueStore.getState();

        let messages: ChatMessage[] = [
          { role: "user", content: fullPrompt }
        ];

        while (turnCount < MAX_TURNS && estimatedTokens < MAX_CONTEXT_TOKENS) {
          turnCount++;
          const turnId = crypto.randomUUID();

          if (request.taskId) {
            const step = { id: turnId, name: `Turn ${turnCount}: Generating (${estimatedTokens}/${MAX_CONTEXT_TOKENS} tokens)`, status: "running" as const, timestamp: Date.now() };
            taskQueue.updateTask(request.taskId, {
              status: "running",
              steps: [...(taskQueue.getTask(request.taskId)?.steps || []), step],
            });
          }

          const res = await cascadeGenerate(undefined as unknown as string, systemPrompt!, {
            messages: messages as LLMMessage[],
            tools: turnCount === 1 ? (request.tools as unknown as LLMToolDefinition[]) : undefined,
            inlineImages: request.images ? request.images.map(img => ({ mimeType: "image/jpeg", data: img })) : undefined,
            signal: request.signal,
            ...request.intelConfig as Record<string, unknown>,
          });
          lastResponse = res;
          messages.push({ role: "model", content: res.content });

          if (request.taskId) {
            taskQueue.updateTask(request.taskId, {
              steps: (taskQueue.getTask(request.taskId)?.steps || []).map((s) => (s.id === turnId ? { ...s, status: "completed" } : s)),
            });
          }

          if (res.functionCalls && res.functionCalls.length > 0) {
            for (const call of res.functionCalls) {
              const callId = crypto.randomUUID();
              if (request.taskId) {
                taskQueue.updateTask(request.taskId, {
                  steps: [...(taskQueue.getTask(request.taskId)?.steps || []), { id: callId, name: `Tool: ${call.name}`, status: "running", data: call.args, timestamp: Date.now() }],
                });
              }

              try {
                const mcpOrchestrator = getMCPOrchestrator();
                const enabledTools = await mcpOrchestrator.getEnabledTools();
                const toolDef = enabledTools.find((t) => t.name === (call as ToolCall).name);

                if (toolDef?.requiresApproval) {
                  if (request.taskId) {
                    taskQueue.updateTask(request.taskId, {
                      status: "pending",
                      requiresUserApproval: true,
                      steps: [
                        ...(taskQueue.getTask(request.taskId)?.steps || []),
                        {
                          id: callId,
                          name: `Approval Required: ${call.name}`,
                          status: "pending",
                          data: call.args,
                          timestamp: Date.now(),
                        },
                      ],
                    });
                  }
                  return `STOP: De actie **${call.name}** vereist je goedkeuring voordat ik verder kan gaan. Geef akkoord in de Planner of typ 'ja'.`;
                }

                const toolResult = await toolRunner.executeTool({
                  toolName: call.name,
                  parameters: call.args,
                });
                if (request.taskId) {
                  taskQueue.updateTask(request.taskId, {
                    steps: (taskQueue.getTask(request.taskId)?.steps || []).map((s) => s.id === callId ? { ...s, status: "completed", data: { ...call.args, result: toolResult.data } } : s),
                  });
                }
              } catch (e) {
                if (request.taskId) {
                  taskQueue.updateTask(request.taskId, {
                    steps: (taskQueue.getTask(request.taskId)?.steps || []).map((s) => s.id === callId ? { ...s, status: "failed", data: { ...call.args, error: e } } : s),
                  });
                }
              }
            }
            const steps = request.taskId ? taskQueue.getTask(request.taskId)?.steps || [] : [];
            const turnToolResults = steps.filter((s) => s.name.startsWith("Tool:") && s.status === "completed").slice(-res.functionCalls.length);

            // TOKEN BUDGETING: Truncate tool results to prevent overflow
            const MAX_TOTAL_TOOL_OUTPUT = 4000;
            let totalOutputLen = 0;
            const resultsStr = turnToolResults.map((tr) => {
              const resultData = JSON.stringify((tr.data as Record<string, unknown>)?.result || "");
              if (totalOutputLen > MAX_TOTAL_TOOL_OUTPUT) return `[${tr.name}]\n[Output omitted due to context length limits]`;
              const truncated = resultData.length > 2000 ? resultData.substring(0, 2000) + "...[truncated]" : resultData;
              totalOutputLen += truncated.length;
              return `[${tr.name}]\n${truncated}`;
            }).join("\n\n");

            // Update token estimate and append to messages
            const appendStr = `\n\n${resultsStr}\n\nContinue based on these results.`;
            estimatedTokens += Math.ceil(appendStr.length / 4);

            if (estimatedTokens > MAX_CONTEXT_TOKENS * 0.8) {
              console.warn(`[Orchestrator] Token budget at ${estimatedTokens}/${MAX_CONTEXT_TOKENS}. Pruning structured history.`);
              messages = smartPruneMessages(messages, MAX_CONTEXT_TOKENS * 0.7);
              // Recalculate tokens after pruning
              estimatedTokens = messages.reduce((acc, m) => acc + Math.ceil(m.content.length / 4), 0);
              messages.push({ role: "tool", content: `[Historie geschaald voor stabiliteit. ${res.functionCalls.length} tools uitgevoerd.]`, name: "summary" });
            } else {
              messages.push({ role: "tool", content: resultsStr, name: (res.functionCalls && res.functionCalls.length > 1) ? "batch" : (res.functionCalls?.[0]?.name || "tool") });
            }

            // Elite Optimization: Check budget and break immediately BEFORE next LLM call
            if (estimatedTokens >= MAX_CONTEXT_TOKENS) {
              console.warn(`[Orchestrator] Token budget reached (${estimatedTokens}). Breaking loop.`);
              break;
            }
          } else {
            break;
          }
        }

        if (estimatedTokens >= MAX_CONTEXT_TOKENS) {
          console.warn(`[Orchestrator] Token budget exceeded (${estimatedTokens}/${MAX_CONTEXT_TOKENS}). Forcing completion.`);
        }

        const finalResult = lastResponse?.content || "";
        if (request.taskId) {
          taskQueue.updateTask(request.taskId, { status: "completed", output: finalResult, completedAt: Date.now() });
        }

        // Record success for the model
        modelRegistry.recordModelSuccess(model.id, 100, estimatedTokens); // 100ms default latency confirm
        return finalResult;
      } else {
        const { generateCustomCompletion } = await import("../dynamicAIService");
        const { resolveApiKey } = await import("../../lib/keyResolver");
        const apiKey = await resolveApiKey(model.provider, model.apiKeyId);
        // Elite guard: Validate API key exists
        if (!apiKey) {
          throw new Error(`Geen API key gevonden voor provider ${model.provider}. Configureer deze in instellingen.`);
        }
        const provider: CustomAIProvider = { id: model.id, name: model.name, baseUrl: model.endpoint || "", apiKey, models: { chat: model.modelId }, enabled: true };
        const messages = [];
        if (request.systemPrompt) messages.push({ role: "system" as const, content: request.systemPrompt });
        messages.push({ role: "user" as const, content: fullPrompt });
        const res = await generateCustomCompletion(provider, messages, {});
        return res.content;
      }
    } catch (error) {
      modelRegistry.recordModelError(model.id, error instanceof Error ? error.message : "Unknown error");
      if (this.config.fallbackEnabled) return await this.executeFallback(request);
      throw error;
    }
  }

  private async executeFallback(request: { prompt: string; systemPrompt?: string }): Promise<string> {
    this.emit("fallback_triggered", { reason: "Primary model failed" });
    const { cascadeGenerate } = await import("../aiCascadeService");
    const res = await cascadeGenerate(request.prompt, request.systemPrompt || "You are a helpful assistant.");
    return res.content;
  }

  private async quickGenerate(prompt: string): Promise<string> {
    const modelRegistry = useModelRegistryStore.getState();
    const fastModel = modelRegistry.getBestModelForCapability("fast");
    if (!fastModel) {
      const { cascadeGenerate } = await import("../aiCascadeService");
      const res = await cascadeGenerate(prompt, "You are a helpful assistant.", {});
      return res.content;
    }
    return await this.executeCloudTask(fastModel, { prompt });
  }

  getRoutingHistory(): RoutingDecision[] {
    return [...this.routingHistory];
  }

  clearRoutingHistory(): void {
    this.routingHistory = [];
  }
}

let orchestratorInstance: Orchestrator | null = null;
export function getOrchestrator(): Orchestrator {
  if (!orchestratorInstance) orchestratorInstance = new Orchestrator();
  return orchestratorInstance;
}

export interface AIGenerateOptions {
  systemPrompt?: string;
  images?: string[];
  context?: string;
  preferFast?: boolean;
  preferQuality?: boolean;
  requireLocal?: boolean;
  signal?: AbortSignal;
  intent?: TaskIntent;
}

export async function aiGenerate(prompt: string, options?: AIGenerateOptions): Promise<string> {
  return getOrchestrator().execute(prompt, options);
}

export async function aiGenerateWithIntent(prompt: string, intent: TaskIntent, options?: AIGenerateOptions): Promise<string> {
  return getOrchestrator().execute(prompt, { ...options, intent });
}
