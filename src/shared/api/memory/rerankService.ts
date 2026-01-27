/**
 * Reranking Service
 * Improves search precision using cross-encoder models
 * Provider: Cohere Rerank API
 * Part of the 750% Elite Intelligence Upgrade
 */

export interface RerankConfig {
    apiKey: string;
    model?: "rerank-v3.5" | "rerank-multilingual-v3.0" | "rerank-english-v3.0";
    topN?: number;
    returnDocuments?: boolean;
    maxChunksPerDoc?: number;
}

export interface RerankResult {
    index: number;
    document: string;
    relevanceScore: number;
}

export interface RerankResponse {
    results: RerankResult[];
    meta: {
        apiVersion: string;
        billedUnits: number;
    };
}

/**
 * Rerank documents based on query relevance using Cohere API
 * @param query - The search query
 * @param documents - Array of document texts to rerank
 * @param config - Cohere configuration
 * @returns Reranked results with relevance scores
 */
export async function rerankDocuments(
    query: string,
    documents: string[],
    config: RerankConfig,
): Promise<RerankResponse> {
    if (!config.apiKey) {
        throw new Error("Cohere API key is required for reranking");
    }

    if (documents.length === 0) {
        return { results: [], meta: { apiVersion: "v1", billedUnits: 0 } };
    }

    // Filter out empty documents
    const validDocuments = documents.filter((d) => d && d.trim().length > 0);

    if (validDocuments.length === 0) {
        return { results: [], meta: { apiVersion: "v1", billedUnits: 0 } };
    }

    const response = await fetch("https://api.cohere.ai/v1/rerank", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${config.apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            query,
            documents: validDocuments,
            model: config.model || "rerank-multilingual-v3.0",
            top_n: config.topN || Math.min(10, validDocuments.length),
            return_documents: config.returnDocuments ?? true,
            max_chunks_per_doc: config.maxChunksPerDoc,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
            errorData.message || `Cohere API error: ${response.status}`;
        throw new Error(errorMessage);
    }

    const data = await response.json();

    return {
        results: data.results.map(
            (r: {
                index: number;
                document?: { text: string };
                relevance_score: number;
            }) => ({
                index: r.index,
                document: r.document?.text || validDocuments[r.index] || "",
                relevanceScore: r.relevance_score,
            }),
        ),
        meta: {
            apiVersion: data.meta?.api_version || "v1",
            billedUnits: data.meta?.billed_units?.search_units || 0,
        },
    };
}

/**
 * Check if Cohere is configured (API key present)
 */
export function isCohereConfigured(apiKey?: string): boolean {
    return !!apiKey && apiKey.length > 10;
}

/**
 * Get Cohere API key from localStorage settings
 */
export function getCohereApiKey(): string | undefined {
    try {
        const backup = localStorage.getItem("vwo_elite_settings_backup");
        if (backup) {
            const settings = JSON.parse(backup);
            return settings?.aiConfig?.cohereApiKey;
        }
    } catch {
        // Ignore
    }
    return undefined;
}

/**
 * Rerank with automatic fallback (returns original order if no API key)
 * This is the recommended function to use in search pipelines
 *
 * @param query - The search query
 * @param documents - Array of documents with content and optional metadata
 * @param apiKey - Optional API key (will try localStorage if not provided)
 * @returns Reordered documents array
 */
export async function rerankWithFallback<
    T extends { content: string; metadata?: Record<string, unknown> },
>(query: string, documents: T[], apiKey?: string): Promise<T[]> {
    const key = apiKey || getCohereApiKey();

    // No API key or only 1 document - return original order
    if (!key || documents.length <= 1) {
        return documents;
    }

    try {
        console.log(
            `[Rerank] Reranking ${documents.length} documents for query: "${query.substring(0, 50)}..."`,
        );

        const texts = documents.map((d) => d.content);
        const result = await rerankDocuments(query, texts, {
            apiKey: key,
            topN: documents.length,
        });

        console.log(
            `[Rerank] Complete. Top score: ${result.results[0]?.relevanceScore.toFixed(3)}`,
        );

        // Reorder documents based on rerank scores
        return result.results.map((r) => documents[r.index]!);
    } catch (error) {
        console.warn("[Rerank] Failed, returning original order:", error);
        return documents;
    }
}

/**
 * Rerank search results and return with scores
 * Useful when you need the relevance scores for filtering or display
 */
export async function rerankWithScores<T extends { content: string }>(
    query: string,
    documents: T[],
    options?: {
        apiKey?: string;
        minScore?: number;
        topN?: number;
    },
): Promise<Array<T & { _rerankScore: number }>> {
    const key = options?.apiKey || getCohereApiKey();

    if (!key || documents.length === 0) {
        // Return with default scores
        return documents.map((d, i) => ({
            ...d,
            _rerankScore: 1 - i * 0.1, // Decreasing scores based on original order
        }));
    }

    try {
        const texts = documents.map((d) => d.content);
        const result = await rerankDocuments(query, texts, {
            apiKey: key,
            topN: options?.topN || documents.length,
        });

        const reranked = result.results
            .filter((r) => !options?.minScore || r.relevanceScore >= options.minScore)
            .map((r) => ({
                ...documents[r.index]!,
                _rerankScore: r.relevanceScore,
            }));

        return reranked;
    } catch (error) {
        console.warn("[Rerank] Failed:", error);
        return documents.map((d, i) => ({
            ...d,
            _rerankScore: 1 - i * 0.1,
        }));
    }
}
