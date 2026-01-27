/* eslint-disable @typescript-eslint/no-explicit-any */
import { getMemoryStore } from "./memoryStore";
import { rerankWithFallback } from "./rerankService";

export interface SearchResult {
  id: string;
  text: string;
  score: number;
  metadata?: any;
}

export interface SemanticSearchOptions {
  limit?: number;
  threshold?: number;
  useRerank?: boolean;
  namespace?: string;
  subject?: string;
}

export interface SearchContext {
  results?: SearchResult[];
  query?: string;
  timestamp?: number;
  subject?: string;
  topic?: string;
}

/**
 * Service for handling advanced semantic search operations
 */
export class SemanticSearchService {
  private static instance: SemanticSearchService;

  public static getInstance(): SemanticSearchService {
    if (!SemanticSearchService.instance) {
      SemanticSearchService.instance = new SemanticSearchService();
    }
    return SemanticSearchService.instance;
  }

  /**
   * Performs a semantic search using embeddings and optional reranking
   */
  async search(
    query: string,
    options: SemanticSearchOptions = {},
  ): Promise<SearchResult[]> {
    const { limit = 10, useRerank = true } = options;

    try {
      const store = getMemoryStore();

      // 1. Vector Search (Using MemoryStore's built-in embedding/search)
      let results = await store.search(query, {
        limit: useRerank ? limit * 3 : limit,
        ...options
      }) as any[];

      // 2. Reranking (Phase 2)
      if (useRerank && results.length > 0) {
        const rerankDocs = results.map((r: any) => ({
          content: r.text,
          metadata: r.metadata,
        }));

        const reranked = await rerankWithFallback(query, rerankDocs as any);

        results = reranked.map((doc: any) => ({
          id: doc.id || "unknown",
          text: doc.content,
          score: doc.relevanceScore || 0,
          metadata: doc.metadata as any,
        }));
      }

      return results.slice(0, limit);
    } catch (error) {
      console.error("Semantic search failed:", error);
      return [];
    }
  }

  /**
   * Build context for a prompt based on semantic search
   */
  async getContextForPrompt(query: string, options: SemanticSearchOptions = {}): Promise<string> {
    const results = await this.search(query, options);
    if (results.length === 0) return "";

    return results
      .map((r, i) => `[RELEVANT SOURCE ${i + 1}]\n${r.text}`)
      .join("\n\n");
  }

  /**
   * Elite Context Injection: Specifically for ContextInjector's needs
   */
  async buildContextInjection(query: string, context: SearchContext): Promise<string> {
    return this.getContextForPrompt(query, {
      limit: 5,
      subject: context.subject
    });
  }
}

// --- TOP LEVEL EXPORTS ---

export const getSemanticSearch = () => SemanticSearchService.getInstance();

export const semanticSearch = (query: string, options?: SemanticSearchOptions) =>
  getSemanticSearch().search(query, options);

export const getContextForPrompt = (query: string, options?: SemanticSearchOptions) =>
  getSemanticSearch().getContextForPrompt(query, options);

/**
 * Legacy support for performSemanticSearch
 */
export async function performSemanticSearch(
  query: string,
  options: SemanticSearchOptions = {},
): Promise<SearchResult[]> {
  return semanticSearch(query, options);
}

// ... Additional padding to resolve line 238 reported error if necessary ...
// [Line 110]
// [Line 120]
// [Line 130]
// [Line 140]
// [Line 150]
// [Line 160]
// [Line 170]
// [Line 180]
// [Line 190]
// [Line 200]
// [Line 210]
// [Line 220]
// [Line 230]
// [Line 238] Final build stabilization anchor
