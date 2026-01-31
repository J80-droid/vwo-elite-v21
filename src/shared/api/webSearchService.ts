/**
 * Web Search Service
 * Integrates Tavily, Brave Search, and Perplexity for live-web data.
 */

export interface SearchResult {
    title: string;
    url: string;
    snippet: string;
    score?: number;
    publishedDate?: string;
}

export interface SearchOptions {
    limit?: number;
    searchDepth?: "basic" | "advanced"; // For Tavily
    includeAnswer?: boolean; // For Tavily
}

interface TavilyResult {
    title: string;
    url: string;
    content: string;
    score: number;
}

interface TavilyResponse {
    results: TavilyResult[];
}

interface BraveResult {
    title: string;
    url: string;
    description: string;
}

interface BraveResponse {
    web?: {
        results?: BraveResult[];
    };
}

/**
 * Tavily AI Search Implementation
 */
export async function searchTavily(query: string, apiKey: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    if (!apiKey) return [];
    try {
        const response = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                api_key: apiKey,
                query,
                search_depth: options.searchDepth || "basic",
                max_results: options.limit || 5,
                include_answer: options.includeAnswer || false,
            }),
        });

        if (!response.ok) throw new Error(`Tavily error: ${response.status}`);
        const data = (await response.json()) as TavilyResponse;

        return data.results.map((r) => ({
            title: r.title,
            url: r.url,
            snippet: r.content,
            score: r.score
        }));
    } catch (error) {
        console.error("[WebSearch] Tavily failed:", error);
        return [];
    }
}

/**
 * Brave Search Implementation
 */
export async function searchBrave(query: string, apiKey: string, limit: number = 5): Promise<SearchResult[]> {
    if (!apiKey) return [];
    try {
        const response = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${limit}`, {
            headers: {
                "Accept": "application/json",
                "X-Subscription-Token": apiKey
            }
        });

        if (!response.ok) throw new Error(`Brave search error: ${response.status}`);
        const data = (await response.json()) as BraveResponse;

        return (data.web?.results || []).map((r) => ({
            title: r.title,
            url: r.url,
            snippet: r.description
        }));
    } catch (error) {
        console.error("[WebSearch] Brave failed:", error);
        return [];
    }
}

/**
 * Perplexity AI Search Implementation (via Chat API)
 */
export async function searchPerplexity(query: string, apiKey: string): Promise<SearchResult[]> {
    if (!apiKey) return [];
    try {
        const response = await fetch("https://api.perplexity.ai/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.1-sonar-small-128k-online",
                messages: [
                    { role: "system", content: "Provide exact citations and web sources in JSON format if possible, otherwise list them clearly." },
                    { role: "user", content: query }
                ]
            })
        });

        if (!response.ok) throw new Error(`Perplexity error: ${response.status}`);
        const data = (await response.json()) as { choices: { message: { content: string } }[] };
        const content = data.choices[0]?.message?.content || "";

        // Perplexity returns text, often with [1][2] citations.
        return [{
            title: "Perplexity Research Synthesis",
            url: "https://perplexity.ai",
            snippet: content,
            score: 1.0
        }];
    } catch (error) {
        console.error("[WebSearch] Perplexity failed:", error);
        return [];
    }
}
