import type { LLMMessage } from "@shared/api/providers/types";

import { useModelRegistryStore } from "../../model/modelRegistryStore";
import { useSnippetStore } from "../../model/snippetStore";
import { EliteTaskSchema, type OrchestratorConfig, type RoutingDecision, type TaskIntent } from "../../types/ai-brain";
import { aiGenerate as cascadeAiGenerate } from "../aiCascadeService";
import { isValidMultiAgentResponse, type MultiAgentResponse } from "../multiAgentTypes";
import { getContextInjector } from "./contextInjector";
import { ContextManager } from "./ContextManager";
import { getIntelligenceConfig, mapIntentToIntelligence } from "./intelligenceLinker";
import { classifyIntent, intentToCapability } from "./intentClassifier";
import { getMCPOrchestrator } from "./mcpOrchestrator";
import { CloudAgentRunner, LocalAgentRunner, type TaskRunner } from "./runners";
import { useTaskQueueStore } from "./taskQueue";

// =============================================================================
// SYSTEM CONFIGURATION (Centralized Constants)
// =============================================================================

const SYSTEM_CONFIG = {
  MAX_INPUT_CHARS: 32000,
  DEFAULT_MAX_CONTEXT_TOKENS: 4096,
  LOCAL_TASK_TIMEOUT_MS: 60000,
  RETRY_LIMIT: 2,
};

const DEFAULT_CONFIG: OrchestratorConfig = {
  routingStrategy: "rule_based",
  fallbackEnabled: true,
  maxRetries: SYSTEM_CONFIG.RETRY_LIMIT,
  contextInjectionEnabled: true,
  maxContextTokens: SYSTEM_CONFIG.DEFAULT_MAX_CONTEXT_TOKENS,
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
  private listeners = new Map<string, Set<(event: unknown) => void>>();
  private runners: TaskRunner[];

  constructor(config: Partial<OrchestratorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.runners = [new CloudAgentRunner(), new LocalAgentRunner()];
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
  // EVENT SYSTEM (Hardenend)
  // =========================

  on(event: string, callback: (data: unknown) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return the cleanup function to prevent memory leaks
    return () => this.off(event, callback);
  }

  off(event: string, callback: (data: unknown) => void): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(callback);
      if (set.size === 0) this.listeners.delete(event);
    }
  }

  private emit(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach((callback) => {
      try { callback(data); } catch { console.error(`[Orchestrator] Event ${event} listener failed`); }
    });
  }

  // =========================
  // INTENT CLASSIFICATION
  // =========================

  async classifyQuery(query: string): Promise<TaskIntent> {
    const result = await classifyIntent(query, {
      llmFallback: this.config.routingStrategy === "llm_based",
      generateFn: this.config.routingStrategy === "llm_based"
        ? (p) => this.execute(p, { preferFast: true })
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
    const intelId = mapIntentToIntelligence(intent);
    const intelConfig = getIntelligenceConfig(intelId);

    if (intelConfig?.modelId && intelConfig.modelId !== "default") {
      const configuredModel = modelRegistry.models.find(
        (m) => m.modelId === intelConfig.modelId || m.name === intelConfig.modelId
      );

      if (configuredModel?.enabled) {
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
    let candidates = modelRegistry.getModelsWithCapability(capability);

    if (options?.requireLocal) {
      candidates = candidates.filter((m) =>
        ["ollama", "lm_studio", "gpt4all", "local"].includes(m.provider),
      );
    }

    if (options?.excludeModels) {
      candidates = candidates.filter((m) => !options.excludeModels!.includes(m.id));
    }

    if (candidates.length === 0) {
      this.emit("routing_failed", { intent, capability });
      return null;
    }

    // Sort by priority and latency
    const best = candidates.sort((a, b) => b.priority - a.priority)[0]!;

    const decision: RoutingDecision = {
      taskId: `route-${Date.now()}`,
      selectedModel: best,
      reason: `Automated Routing: Capability ${capability} matched to ${best.name}`,
      alternatives: candidates.slice(1, 4),
      confidence: 0.9,
    };

    this.routingHistory.push(decision);
    this.emit("model_selected", decision);

    return decision;
  }

  // =========================
  // EXECUTION (Elite Runner Flow)
  // =========================

  async execute(
    prompt: string,
    options?: {
      intent?: TaskIntent;
      systemPrompt?: string;
      images?: string[];
      context?: string;
      preferFast?: boolean;
      preferQuality?: boolean;
      requireLocal?: boolean;
      taskId?: string;
      signal?: AbortSignal;
      messages?: LLMMessage[];
    },
  ): Promise<string> {
    // 1. Validation & Safety
    if (!prompt?.trim()) return "Ik heb een vraag of opdracht nodig om je te helpen. Wat kan ik voor je doen?";

    if (prompt.length > SYSTEM_CONFIG.MAX_INPUT_CHARS) {
      console.warn(`[Orchestrator] Prompt too long (${prompt.length} chars). Applying semantic truncation.`);
      prompt = ContextManager.smartTruncate(prompt, SYSTEM_CONFIG.MAX_INPUT_CHARS);
    }

    // 2. Context Injection
    let context = options?.context || "";
    if (this.config.contextInjectionEnabled && !options?.context) {
      try {
        const isSimpleCommand = prompt.length < 20 && !prompt.toLowerCase().includes("context");
        if (!isSimpleCommand) {
          const injection = await getContextInjector().buildContext(prompt, {});
          context = injection.systemPromptAddendum || "";
        }
      } catch (e) {
        console.warn("[Orchestrator] Context injection warning:", e);
      }
    }

    // 3. Intent & Special Handlers
    const intent = options?.intent || (await this.classifyQuery(prompt));

    // 🚀 ELITE AGENCY: Tool Discovery for all queries
    const mcpOrchestrator = getMCPOrchestrator();
    const relevantTools = await mcpOrchestrator.getToolDefinitionsForLLM(prompt);

    // 📚 ELITE MEMORY: Snippet Recall (The Recipe Book)
    const snippetStore = useSnippetStore.getState();
    const existingSnippet = await snippetStore.findSnippetByIntent(prompt);
    if (existingSnippet) {
      context += `\n\n[Relevante Eerdere Oplossing]:\nIk heb dit eerder opgelost met deze code:\n\`\`\`python\n${existingSnippet.code}\n\`\`\`\nJe kunt dit hergebruiken of aanpassen.`;
    }

    // Inject tool descriptions into context for implicit availability
    if (relevantTools.length > 0) {
      const toolCtxt = `\n\n[Beschikbare Tools]:\n${relevantTools.map(t => `- ${t.name}: ${t.description}`).join("\n")}\nAls je een van deze tools nodig hebt, vraag dan om een 'complex_goal' planning sessie.`;
      context += toolCtxt;
    }

    // Handle Specialized Intents
    if (intent === "complex_goal") return this.handleComplexGoal(prompt, context);
    if (intent === "somtoday_action") return this.handleSomtodayAction(prompt);
    if (intent === "image_generation") return this.handleImageGeneration(prompt);
    if (intent === "speech_output") return this.handleSpeechOutput(prompt, options?.context);
    if (intent === "multi_agent_collab") return this.handleMultiAgentCollab(prompt, context, options?.signal);

    // 4. Model Selection
    const routing = this.selectModel(intent, options);
    if (!routing) throw new Error(`No model available for intent: ${intent}`);

    // 5. Elite Task Protocol (Runtime Validation)
    const rawTask = {
      id: options?.taskId || crypto.randomUUID(),
      intent,
      prompt,
      systemPrompt: options?.systemPrompt,
      images: options?.images,
      context,
      messages: options?.messages || [{ role: "user", content: prompt } as LLMMessage],
      modelId: routing.selectedModel.id,
      priority: options?.preferFast ? 80 : 50,
      isLocal: ["ollama", "lm_studio", "gpt4all", "local"].includes(routing.selectedModel.provider),
    };

    const validation = EliteTaskSchema.safeParse(rawTask);
    if (!validation.success) {
      console.error("[Orchestrator] Task Protocol Violation:", validation.error);
      const errorMessage = validation.error.issues[0]?.message || "Unknown validation error";
      throw new Error(`Elite Protocol Error: ${errorMessage}`);
    }
    const task = validation.data;

    // 6. Delegate to Runner
    const runner = this.runners.find(r => r.canHandle(task));
    if (!runner) throw new Error("No execution runner found for this task type.");

    // Update Task Queue for UI tracking
    const taskQueue = useTaskQueueStore.getState();
    taskQueue.addTask(task);

    const result = await runner.execute(task, options?.signal);

    if (!result.success) {
      if (this.config.fallbackEnabled) return this.executeFallback(prompt, options?.systemPrompt);
      throw new Error(String(result.rawError || "Execution failed"));
    }

    // Update Queue on Completion
    taskQueue.updateTask(task.id!, {
      status: "completed",
      output: result.content,
      completedAt: Date.now()
    });

    return result.content;
  }

  // =========================
  // SPECIALIZED HANDLERS
  // =========================

  private async handleComplexGoal(prompt: string, context: string): Promise<string> {
    try {
      const { generatePlan, executePlanStep } = await import("./planExecutor");
      const mcpOrchestrator = getMCPOrchestrator();
      const tools = await mcpOrchestrator.getToolDefinitionsForLLM(prompt);
      const typedTools = tools.map((t) => ({ name: String(t.name), description: String(t.description) }));
      const fullPrompt = context ? `${prompt}\n\n[Relevant Context]:\n${context}` : prompt;

      let plan = await generatePlan(fullPrompt, typedTools);

      // 🚀 ELITE SELF-HEALING LOOP
      const firstStep = plan.steps[0];
      if (firstStep && firstStep.toolName === "python_interpreter") {
        let attempts = 0;
        const maxAttempts = 3;
        let lastError = "";

        const toolExecutor = async (name: string, args: Record<string, unknown>) => {
          while (attempts < maxAttempts) {
            try {
              const res = await (mcpOrchestrator.executeLocalTool(name, args) as Promise<{ error?: string; output: string; result: unknown; images?: string[] }>);
              if (res.error) throw new Error(res.error);

              // 🧠 Elite Learning: Save successful snippet
              const code = args.code as string | undefined;
              if (code && code.length > 20) {
                const snippetStoreObj = useSnippetStore.getState();
                snippetStoreObj.saveSnippet({
                  intent: prompt,
                  description: `Automated solution for: ${prompt}`,
                  code: code,
                  tags: "python,automated"
                });
              }

              // Return filtered context (don't send huge images back to LLM history)
              this.emit("healing_success", { stepId: firstStep.id, toolName: name });
              return `Execution Successful.\nOutput: ${res.output}\nResult: ${res.result}\n[System: ${res.images?.length || 0} image(s) attached]`;
            } catch (err: unknown) {
              lastError = err instanceof Error ? err.message : String(err);
              attempts++;
              if (attempts >= maxAttempts) break;

              console.warn(`[Orchestrator] Self-Healing: Attempt ${attempts} failed. Repairing...`);
              this.emit("healing_attempt", {
                stepId: firstStep.id,
                attempt: attempts,
                error: lastError,
                toolName: name
              });

              const fixPrompt = `De Python code die je schreef gaf een error: "${lastError}". 
                      Originele code:
                      \`\`\`python
                      ${args.code}
                      \`\`\`
                      Herschrijf de code om deze error op te lossen. Geef ALLEEN de gecorrigeerde code terug.`;

              const fixedCode = await cascadeAiGenerate(fixPrompt, { intelligenceId: "code" });
              args.code = fixedCode.replace(/```python|```/g, "").trim();
            }
          }
          throw new Error(`Self-Healing failed after ${maxAttempts} attempts. Final error: ${lastError}`);
        };

        plan = await executePlanStep(plan, firstStep.id, (name, args) => toolExecutor(name, args));
      }

      const stepsSummary = plan.steps.map((s, i) => {
        const statusIcon = s.status === "completed" ? "✅" : s.status === "failed" ? "❌" : "⏳";
        return `${i + 1}. ${statusIcon} **${s.title}**\n   _${s.description}_`;
      }).join("\n");

      let finalResponse = `Ik heb een strategisch plan opgesteld:\n\n${stepsSummary}`;
      const firstResult = plan.steps[0];
      if (firstResult && firstResult.status === "completed") {
        finalResponse += `\n\n**Resultaat Stap 1:**\n${firstResult.result}`;
      }

      return finalResponse;
    } catch (e: unknown) {
      console.error("[Orchestrator] Complex goal failure:", e);
      const msg = e instanceof Error ? e.message : String(e);
      return `Mijn excuses, ik kon het plan niet uitvoeren. Fout: ${msg}`;
    }
  }

  private async handleSomtodayAction(prompt: string): Promise<string> {
    try {
      const { getSomtodayService } = await import("../somtodayService");
      const somtoday = getSomtodayService();
      if (!somtoday.isConnected()) return "Je bent niet ingelogd bij Somtoday.";

      const lowerPrompt = prompt.toLowerCase();
      if (lowerPrompt.includes("rooster") || lowerPrompt.includes("les")) {
        const now = new Date();
        const start = now.toISOString().split("T")[0]!;
        const end = new Date(now.getTime() + 86400000).toISOString().split("T")[0]!;
        const schedule = await somtoday.getSchedule(start, end);
        if (schedule && schedule.length > 0) {
          return `Je hebt vandaag de volgende lessen:\n${schedule.map((s) => `- **${s.titel}** (${s.beginDatumTijd?.split("T")[1]?.substring(0, 5)}) in lokaal ${s.locatie || 'onbekend'}`).join("\n")}`;
        }
        return "Ik kon geen lessen vinden voor vandaag.";
      }
      return "Ik begrijp je Somtoday verzoek niet helemaal.";
    } catch { return "Kon Somtoday gegevens niet ophalen."; }
  }

  private async handleImageGeneration(prompt: string): Promise<string> {
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
      return "Geen API key voor beeldbewerking gevonden.";
    } catch { return "Beeldgeneratie mislukt."; }
  }

  private async handleSpeechOutput(prompt: string, context?: string): Promise<string> {
    try {
      const { playSpeech } = await import("../ttsService");
      const { resolveApiKey } = await import("../../lib/keyResolver");
      const modelRegistry = useModelRegistryStore.getState();
      const ttsModel = modelRegistry.getBestModelForCapability("audio");
      const provider = ttsModel?.provider || "openai";
      const apiKey = await resolveApiKey(provider, ttsModel?.apiKeyId);
      if (apiKey) {
        await playSpeech(context || prompt, { apiKey });
        return "Ik lees de tekst nu voor u voor. 🎙️";
      }
      return "Geen spraakmodel geconfigureerd.";
    } catch { return "Spraakweergave mislukt."; }
  }

  private async handleMultiAgentCollab(prompt: string, context: string, signal?: AbortSignal): Promise<string> {
    try {
      const { runMultiAgentSession } = await import("../multiAgentService");
      const lowerPrompt = prompt.toLowerCase();
      const VALID_AGENTS = ["biologist", "physicist", "chemist", "philosopher", "psychologist", "linguist", "historian", "economist", "mathematician", "data_scientist", "scientific_researcher"] as const;
      const matchedAgents = VALID_AGENTS.filter(a => lowerPrompt.includes(a.substring(0, 4)) || lowerPrompt.includes(a.split('_')[0]!));
      const finalAgents: string[] = matchedAgents.length > 0 ? [...matchedAgents] : ["biologist", "physicist", "scientific_researcher"];
      const augmentedPrompt = context ? `${prompt}\n\n[ACHTERGRONDINFORMATIE]:\n${context}` : prompt;

      const session = runMultiAgentSession(augmentedPrompt, finalAgents, { signal });
      let lastValue: unknown = null;
      for await (const update of session) {
        lastValue = update;
      }

      if (!isValidMultiAgentResponse(lastValue)) throw new Error('Ongeldig resultaat.');
      const result = lastValue as MultiAgentResponse;
      return `### Elite Expert Consensus\n\n${result.consensus}\n\n---\n**Experts:** ` +
        result.individualInsights.map((i) => `*${i.agent}*`).join(", ");
    } catch { return "Expert sessie afgebroken."; }
  }

  private async executeFallback(prompt: string, systemPrompt?: string): Promise<string> {
    this.emit("fallback_triggered", { reason: "Primary model failed" });
    const { cascadeGenerate } = await import("../aiCascadeService");
    const res = await cascadeGenerate(prompt, systemPrompt || "You are a helpful assistant.");
    return res.content;
  }

  getRoutingHistory(): RoutingDecision[] { return [...this.routingHistory]; }
  clearRoutingHistory(): void { this.routingHistory = []; }
}

let orchestratorInstance: Orchestrator | null = null;
export function getOrchestrator(): Orchestrator {
  if (!orchestratorInstance) orchestratorInstance = new Orchestrator();
  return orchestratorInstance;
}

export async function aiGenerate(prompt: string, options?: AIGenerateOptions): Promise<string> {
  return getOrchestrator().execute(prompt, options);
}

export async function aiGenerateWithIntent(prompt: string, intent: TaskIntent, options?: AIGenerateOptions): Promise<string> {
  return getOrchestrator().execute(prompt, { ...options, intent });
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
  messages?: LLMMessage[];
  taskId?: string;
  jsonMode?: boolean;
  intelligenceId?: string;
}
