/**
 * Memory Module - Barrel Export
 */

// Memory Store
export {
  addToMemory,
  getMemoryStore,
  initializeMemoryStore,
  searchMemory,
  TRUST_SCORES,
} from "./memoryStore";

// Embedding Service
export type { EmbeddingOptions, EmbeddingResult } from "./embeddingService";
export {
  clearEmbeddingCache,
  EmbeddingService,
  embedText,
  getEmbeddingCacheStats,
  getEmbeddingService,
} from "./embeddingService";

// Tiered Storage
export { getTieredStorage, TieredStorageManager } from "./tieredStorage";

// Chat Summarizer
export {
  extractFormulas,
  extractTopics,
  summarizeChat,
  summarizeChatBatch,
} from "./chatSummarizer";

// Semantic Search
export type { SearchContext, SemanticSearchOptions } from "./semanticSearch";
export {
  getContextForPrompt,
  getSemanticSearch,
  semanticSearch,
  SemanticSearchService,
} from "./semanticSearch";
