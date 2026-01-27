import { SoundPreset } from "../api/audio/notificationSounds";
import { Language } from "./common";
import { DidacticConfig } from "./lesson.schema";
import { SubjectPersona } from "./persona";

// --- CONFIG TYPES ---
export enum AppView {
  DASHBOARD = "dashboard",
  STUDY = "study",
  TEST_LAB = "testlab",
  PLANNER = "planner",
  PROFILE = "profile",
  SETTINGS = "settings",
  // Hub Views (Consolidated)
  MATH_LAB = "math",
  SCIENCE_LAB = "science",
  STUDIO_3D = "3d-studio",
  LANGUAGE_LAB = "language",
  CODE_LAB = "code",
  AI_LAB = "ailab",
  BRAINSTORM = "brainstorm",
  RESEARCH = "research",
  EXAM_CENTER = "examen-centrum",
  SMART_LIBRARY = "library",
  // STUDY_PLANNER = 'planner', // Duplicate of PLANNER

  // Legacy / Sub-Views (to be integrated or redirected)
  VIDEO_LAB = "videolab",
  FORMULA_LAB = "formulalab",
  BIO_LAB = "biolab",
  HISTORY = "history",
  RESULTS = "results",
  COACH = "coach",
  LESSON_GENERATOR = "lesson-generator",

  // Detailed Views
  // LIBRARY = 'library', // Duplicate of SMART_LIBRARY
  SMART_REVIEW = "smart-review",
  // SOCRATIC_COACH = 'coach', // Duplicate of COACH
  PWS_COPILOT = "pws",
  BLURTING_LAB = "blurting",
  BLOOM_TRAINER = "bloom",
  SPATIAL_TRAINER = "spatial",
  SJT_LAB = "sjt",
  STEREO_TRAINER = "stereo",
  DYNAMIC_SLICER = "slicer",
  BUILD_MODE = "build",
  PROJECTION_CHALLENGE = "projection",
  CONSTRUCTION_GAME = "construction",
  CROSS_SECTION_CHALLENGE = "cross-section",
  MINDMAP_LAB = "mindmap",
  VECTOR_LAB = "vectors",
  CALCULUS_LAB = "calculus",
  PHYSICS_LAB = "physics",
  CHEM_LAB = "chemistry",
  BIOLOGY_LAB = "biology",
  PHILOSOPHY_LAB = "philosophy",
  PSYCHOLOGY_LAB = "psychology",
  FORMULA_SEARCH = "formula",
  SOURCE_LAB = "source",
  IDIOM_LAB = "idiom",
  MOLECULE_BUILDER = "molecules",
  SNAP_SOLVE = "snap-solve",
  EXAM_SIMULATOR = "exam-sim",
}

export type AppTheme =
  | "electric"
  | "cyberpunk"
  | "matrix"
  | "gold"
  | "rose"
  | "nebula";

export interface UserProfile {
  name: string;
  grade?: string | number;
  profile?: "NT" | "NG" | "EM" | "CM";
  examYear?: number;
  targetGrades?: Record<string, number>;
  avatar?: string;
}

export interface CustomAIProvider {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  enabled: boolean;
  models: {
    chat: string;
    embedding?: string;
    image?: string;
    vision?: string;
  };
}

export type PersonaType =
  | "socratic"
  | "strict"
  | "peer"
  | "eli5"
  | "strategist"
  | "debater"
  | "feynman";

export type CoachRole = PersonaType;

export interface ChatSessionSummary {
  topic: string;
  summary: string;
  actionItems: string[];
}

export interface ChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

export interface AIModelConfig {
  provider: string; // 'openai', 'anthropic', 'google', 'groq', 'custom', 'local'
  modelId: string; // 'gpt-4o', 'claude-3-5-sonnet', etc.
  live?: string; // Specific model for live/speech interactions
  vision?: string; // Specific model for vision/multimodal interactions
  contextWindow: number; // e.g. 128000
}

export interface AIPromptConfig {
  systemPrompt: string;
  fewShotExamples: { input: string; output: string }[];
  negativePrompt: string;
  enableChainOfThought: boolean;
  historyContextLength: number; // 0 to max
}

export interface AIInferenceParams {
  temperature: number;
  topP: number;
  maxTokens: number;
  stopSequences: string[];
  frequencyPenalty: number;
  presencePenalty: number;
  seed?: number;
}

export interface AIKnowledgeConfig {
  enableRAG: boolean;
  ragSources: string[]; // 'pdf', 'web', 'obsidian', etc.
  knowledgeCutoff?: string; // informational
  maxContextLength?: number; // Max tokens for RAG context
}

export interface AIAdvancedConfig {
  jsonMode: boolean;
  functionCalling: boolean;
  logitBias: Record<string, number>;
}

export interface IntelligenceEngineConfig {
  modelId: string;
  provider: string; // 'google', 'openai', 'anthropic', 'groq', 'deepseek', 'local'
  temperature: number;
  topP: number;
  maxTokens: number;
  active: boolean;
  contextWindow?: number;

  // ═══════════════════════════════════════════════════════════════════════════
  // SAMPLING PARAMETERS
  // ═══════════════════════════════════════════════════════════════════════════
  topK?: number;
  minP?: number;
  mirostat?: number; // 0=off, 1, 2
  mirostatTau?: number;
  mirostatEta?: number;
  tfsZ?: number; // Tail Free Sampling
  typicalP?: number;

  // Niche & Experimental Sampling
  topA?: number;
  etaCutoff?: number;
  smoothingFactor?: number;

  // ═══════════════════════════════════════════════════════════════════════════
  // PENALTY PARAMETERS
  // ═══════════════════════════════════════════════════════════════════════════
  frequencyPenalty?: number;
  presencePenalty?: number;
  repetitionPenalty?: number;
  noRepeatNGramSize?: number;

  // DRY Sampling (Advanced Anti-Repetition)
  dryMultiplier?: number;
  dryBase?: number;
  dryAllowedLength?: number;
  repetitionPenaltyRange?: number;

  // ═══════════════════════════════════════════════════════════════════════════
  // STEERING & DETERMINISM
  // ═══════════════════════════════════════════════════════════════════════════
  seed?: number;
  stopSequences?: string[];
  logitBias?: Record<string, number>;

  // ═══════════════════════════════════════════════════════════════════════════
  // STRUCTURAL CONSTRAINTS & FORMAT (Guided Generation)
  // ═══════════════════════════════════════════════════════════════════════════
  grammarGBNF?: string;
  jsonModeForced?: boolean;

  // ═══════════════════════════════════════════════════════════════════════════
  // ADVANCED SEARCH STRATEGIES
  // ═══════════════════════════════════════════════════════════════════════════
  beamSearch?: boolean;
  numBeams?: number;
  contrastiveSearch?: boolean;

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTEXT & MEMORY MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  ropeFrequencyBase?: number;
  ropeFrequencyScale?: number;
  numCtx?: number; // Context Size Override
  kvCacheQuantization?: number; // 8, 4, etc.

  // ═══════════════════════════════════════════════════════════════════════════
  // GUIDANCE & CONTROL (CFG)
  // ═══════════════════════════════════════════════════════════════════════════
  cfgScale?: number;
  negativePrompt?: string;

  // ═══════════════════════════════════════════════════════════════════════════
  // MODEL MODIFICATIONS (Local Only)
  // ═══════════════════════════════════════════════════════════════════════════
  loraPath?: string;
  loraScale?: number;
  quantizationLevel?: string; // e.g., 'Q4_K_M', 'Q6_K', 'FP16'

  // ═══════════════════════════════════════════════════════════════════════════
  // PROMPT FORMATTING
  // ═══════════════════════════════════════════════════════════════════════════
  promptTemplate?: string; // e.g., 'chatml', 'llama3', 'alpaca'
  systemPromptPosition?: 'start' | 'end';

  // ═══════════════════════════════════════════════════════════════════════════
  // PERFORMANCE & RUNTIME
  // ═══════════════════════════════════════════════════════════════════════════
  speculativeDecoding?: boolean;
  flashAttention?: boolean;
  threadCount?: number;
  dynamicTemperature?: boolean;
}

export interface AIConfig {
  // Legacy mapping (keep for backward compatibility if needed)
  persona: PersonaType;

  // New Sections
  modelConfig: AIModelConfig;
  promptConfig: AIPromptConfig;
  inferenceConfig: AIInferenceParams;
  knowledgeConfig: AIKnowledgeConfig;
  advancedConfig: AIAdvancedConfig;

  // API Keys (Centralized) - Deprecated in favor of apiVault if needed
  geminiApiKey?: string;
  groqApiKey?: string;
  hfToken?: string;
  elevenLabsApiKey?: string;
  googleCloudApiKey?: string;
  openaiApiKey?: string; // For Whisper STT
  cohereApiKey?: string; // For Reranking (precision search)
  replicateApiKey?: string; // For 3D Generation (Shap-E)
  humeApiKey?: string; // For Emotional AI
  customProviders?: CustomAIProvider[];

  // NEW: Granular Config for the 14 Intelligences
  intelligencesConfig?: Record<string, IntelligenceEngineConfig>;

  // NEW: Secure API Vault
  apiVault?: {
    [key: string]: {
      key: string;
      status: "active" | "error" | "revoked";
      label: string;
    };
  };

  // Deprecated / Migrating
  customPrompts?: Record<string, string>;
  customBasePrompt?: string;
  models?: Record<string, string>;
  activePersona?: SubjectPersona;
  personaOverrides?: Record<string, SubjectPersona>;
  didacticConfig?: DidacticConfig;
}

export interface UserSettings {
  id: string;
  profile: UserProfile;
  theme: AppTheme;
  language: Language;
  aiConfig: AIConfig;
  shortcuts: Record<string, string>;
  pomodoroWork: number;
  pomodoroBreak: number;
  streak: number;
  gamificationEnabled: boolean;
  audioFocusMode: string;
  audioVolume: number;
  graphicsQuality: "low" | "medium" | "high";
  pythonMode: "standard" | "scientific";
  timerStartSound: SoundPreset;
  timerBreakSound: SoundPreset;
  speechRecognitionEnabled: boolean;
  xp: number;
  level: number;
  unlockedAchievements: string[];
}
