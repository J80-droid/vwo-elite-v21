/**
 * AI Model Registry Types
 * Core type definitions for the multi-model AI system
 */

// =============================================================================
// MODEL CAPABILITIES
// =============================================================================

export type ModelCapability =
  | "vision" // Can process images
  | "reasoning" // Complex logic/math
  | "fast" // Sub-second responses
  | "code" // Code generation
  | "audio" // Audio processing
  | "embedding" // Can create embeddings
  | "long_context" // 100K+ tokens
  | "function_calling" // Supports tool use
  | "streaming"; // Supports streaming responses

export type ModelProvider =
  | "gemini"
  | "openai"
  | "anthropic"
  | "groq"
  | "ollama"
  | "lm_studio"
  | "gpt4all"
  | "custom";

// =============================================================================
// MODEL DEFINITION
// =============================================================================

export interface AIModel {
  id: string;
  name: string;
  provider: ModelProvider;

  // Connection Details
  endpoint?: string; // API URL or local endpoint
  apiKeyId?: string; // Reference to secure storage
  localPath?: string; // Path to local model file
  modelId: string; // Provider-specific model ID (e.g., "gemini-2.0-flash")

  // Capabilities
  capabilities: ModelCapability[];

  // Performance Metrics (updated dynamically)
  metrics: ModelMetrics;

  // Resource Requirements
  requirements: ModelRequirements;

  // User Configuration
  enabled: boolean;
  priority: number; // 1-100, higher = prefer

  // Timestamps
  createdAt: number;
  lastUsedAt?: number;
}

export interface ModelMetrics {
  avgResponseMs: number;
  successRate: number; // 0.0 - 1.0
  totalRequests: number;
  totalTokens: number;
  lastError?: string;
  lastErrorAt?: number;
}

export interface ModelRequirements {
  minRamGB?: number;
  minVramGB?: number;
  modelSizeGB?: number;
  contextLength?: number;
}

// =============================================================================
// MODEL REGISTRY
// =============================================================================

export interface ModelRegistry {
  models: AIModel[];
  defaultModelByCapability: Record<ModelCapability, string | undefined>;
  lastUpdated: number;
}

// =============================================================================
// PRESETS
// =============================================================================

export type PresetType =
  | "fast"
  | "quality"
  | "private"
  | "exam"
  | "cost_saver"
  | "custom";

export interface AIPreset {
  id: string;
  name: string;
  type: PresetType;
  description: string;

  // Model assignments by capability
  modelAssignments: Partial<Record<ModelCapability, string>>;

  // Execution settings
  maxParallelCloud: number;
  localExecution: "linear" | "parallel";
  fallbackEnabled: boolean;

  // Module-specific overrides
  moduleOverrides?: Record<string, Partial<Record<ModelCapability, string>>>;

  // Flags
  isDefault: boolean;
  isBuiltIn: boolean;

  createdAt: number;
  updatedAt: number;
}

// =============================================================================
// TASK QUEUE
// =============================================================================

export type TaskStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export type TaskIntent =
  | "simple_question"
  | "complex_reasoning"
  | "math_problem"
  | "code_task"
  | "vision_task"
  | "creative_writing"
  | "translation"
  | "summarization"
  | "embedding"
  | "image_generation"
  | "speech_output"
  | "somtoday_action"
  | "video_generation"
  | "multi_agent_collab"
  | "quantum_reasoning"
  | "complex_goal"
  | "research"
  | "unknown";

export interface AITask {
  id: string;
  intent: TaskIntent;
  status: TaskStatus;

  // Input
  prompt: string;
  systemPrompt?: string;
  images?: string[]; // Base64 encoded
  context?: string; // Injected context from memory

  // Execution
  modelId?: string;
  priority: number;
  isLocal: boolean; // Determines queue behavior

  // Timing
  createdAt: number;
  startedAt?: number;
  completedAt?: number;

  // Result
  output?: string;
  error?: string;
  tokensUsed?: number;
  responseTimeMs?: number;

  // Steps (Thought Process)
  steps?: Array<{
    id: string;
    name: string;
    status: "pending" | "running" | "completed" | "failed";
    data?: unknown;
    timestamp: number;
  }>;

  // Routing metadata
  routingReason?: string;

  // HITL
  requiresUserApproval?: boolean;
}

// =============================================================================
// MCP TOOLS
// =============================================================================

export interface MCPTool {
  id: string;
  name: string;
  description: string;
  parametersSchema: Record<string, unknown>; // JSON Schema
  executionType: "internal" | "local_mcp" | "http_api";
  endpointUrl?: string;
  requiresAuth?: boolean;
  requiresApproval?: boolean;
  enabled: boolean;
  category?: string;
}

export interface ToolCallRequest {
  toolName: string;
  parameters: Record<string, unknown>;
}

export interface ToolCallResponse {
  result: unknown;
  error?: string;
  durationMs: number;
}

export interface AIResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: Record<string, unknown>;
}

export interface TaskQueueState {
  localQueue: AITask[];
  cloudQueue: AITask[];
  isLocalRunning: boolean;
  activeCloudTasks: number;
  maxParallelCloud: number;
}

// =============================================================================
// ORCHESTRATOR
// =============================================================================

export interface OrchestratorConfig {
  // Routing strategy
  routingStrategy: "rule_based" | "llm_based" | "learned";

  // Fallback behavior
  fallbackEnabled: boolean;
  maxRetries: number;

  // Context injection
  contextInjectionEnabled: boolean;
  maxContextTokens: number;

  // Proactive suggestions
  proactiveSuggestionsEnabled: boolean;
  suggestionTypes: string[];

  // Debug mode
  showRoutingDecisions: boolean;
  debugMode: boolean;
}

export interface RoutingDecision {
  taskId: string;
  selectedModel: AIModel;
  reason: string;
  alternatives: AIModel[];
  confidence: number;
}

// =============================================================================
// USER PROFILE
// =============================================================================

export interface WeakPoint {
  id: string;
  subject: string;
  topic: string;

  // Metrics
  errorCount: number;
  attemptCount: number;
  errorRate: number; // errorCount / attemptCount

  // Analysis
  commonMistakes: string[];
  suggestedFocus: string;

  // Improvement tracking
  improvementScore: number; // -1.0 to 1.0
  lastErrorAt?: number;
  lastPracticeAt?: number;

  createdAt: number;
  updatedAt: number;
}

export interface UserLearningProfile {
  id: string;

  // Weak points by subject
  weakPoints: WeakPoint[];

  // Preferences
  preferredLanguage: string;
  learningStyle: "visual" | "text" | "interactive";
  difficultyPreference: "easy" | "medium" | "hard" | "adaptive";

  // Engagement
  totalStudyTimeMinutes: number;
  averageSessionMinutes: number;
  streakDays: number;

  // Model preferences (learned from feedback)
  modelFeedback: Record<string, { thumbsUp: number; thumbsDown: number }>;

  updatedAt: number;
}

// =============================================================================
// MEMORY TYPES
// =============================================================================

export type MemoryType =
  | "library"
  | "note"
  | "flashcard"
  | "lesson"
  | "chat_summary";

export interface VectorDocument {
  id: string;
  vector: number[];
  text: string;
  metadata: VectorMetadata;
}

export interface VectorMetadata {
  type: MemoryType;
  trustScore: number; // 1.0 (library) → 0.5 (AI generated)
  sourceId: string;
  sourceType: string;
  subject?: string;
  topic?: string;
  validated: boolean;
  validationDate?: number;
  createdAt: number;
  accessedAt: number;
}

export interface SearchOptions {
  types?: MemoryType[];
  minTrust?: number;
  subject?: string;
  limit?: number;
  after?: string | number;
  before?: string | number;
}

// =============================================================================
// MEMORY CONTENT TYPES
// =============================================================================

export interface StudyMaterialContent {
  id: string;
  title: string;
  content: string;
  subject: string;
  topic?: string;
  type: "pdf" | "text" | "url" | "manual" | "note" | "flashcard" | "summary" | "diagram" | "quiz" | "txt" | "image" | "chat";
}

export interface NoteContent {
  id: string;
  content: string;
  subject?: string;
  topic?: string;
  materialId?: string;
}

export interface FlashcardContent {
  id: string;
  front: string;
  back: string;
  subject?: string;
  topic?: string;
  deckId?: string;
}

export interface GeneratedLessonContent {
  id: string;
  title: string;
  content: string;
  subject: string;
  topic?: string;
  sections?: string[];
}

export interface ChatSession {
  id: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  subject?: string;
  topic?: string;
  startedAt: number;
  endedAt?: number;
}

export interface SearchResult extends VectorDocument {
  score: number; // Similarity score
}

// =============================================================================
// PROACTIVE SUGGESTIONS
// =============================================================================

export type SuggestionType =
  | "exam_prep"
  | "practice_reminder"
  | "weak_point_focus"
  | "new_material"
  | "streak_motivation";

export interface ProactiveSuggestion {
  id: string;
  type: SuggestionType;
  title: string;
  description: string;
  action: string;
  actionLabel: string;
  priority: "low" | "medium" | "high" | "urgent";
  metadata?: Record<string, unknown>;
  createdAt: number;
  dismissedAt?: number;
}

// =============================================================================
// EVENTS & TELEMETRY
// =============================================================================

export interface AIEvent {
  id: string;
  type: "request" | "response" | "error" | "routing" | "fallback";
  modelId: string;
  provider: ModelProvider;
  timestamp: number;

  // Details
  intent?: TaskIntent;
  tokensIn?: number;
  tokensOut?: number;
  responseTimeMs?: number;
  success: boolean;
  error?: string;

  // Cost estimation
  estimatedCost?: number;
}

export interface AITelemetry {
  // Totals
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  avgResponseTime: number;

  // By provider
  byProvider: Record<
    ModelProvider,
    {
      requests: number;
      tokens: number;
      cost: number;
      avgTime: number;
      successRate: number;
    }
  >;

  // By capability
  byCapability: Record<
    ModelCapability,
    {
      requests: number;
      preferredModel: string;
    }
  >;

  // Time range
  periodStart: number;
  periodEnd: number;
}
