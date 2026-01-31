/**
 * Global Health Service
 * Monitors real-time status of external AI providers and local nodes.
 */

export interface ProviderHealthStatus {
    provider: string;
    status: "operational" | "degraded" | "outage" | "unknown";
    latency?: number;
    message?: string;
}

export const GLOBAL_ENDPOINTS = {
    openai: "https://status.openai.com/api/v2/summary.json",
    anthropic: "https://status.anthropic.com/api/v2/summary.json",
    google: "https://status.cloud.google.com/api/v2/summary.json",
    groq: "https://status.groq.com/api/v2/summary.json",
    perplexity: "https://status.perplexity.ai/api/v2/summary.json",
    cohere: "https://status.cohere.com/api/v2/summary.json",
    elevenlabs: "https://elevenlabs.statuspage.io/api/v2/summary.json",
    deepgram: "https://status.deepgram.com/api/v2/summary.json",
    mistral: "https://status.mistral.ai/api/v2/summary.json",
    replicate: "https://replicatestatus.com/api/v2/summary.json",
    huggingface: "https://status.huggingface.co/api/v2/summary.json",
    brave: "https://brave.statuspage.io/api/v2/summary.json",
    tavily: "https://tavily.statuspage.io/api/v2/summary.json",
};

/**
 * Common fetcher for Statuspage.io style summary JSONs via IPC Proxy
 */
async function fetchStatusPage(name: string, url: string): Promise<ProviderHealthStatus> {
    try {
        if (!window.vwoApi?.system?.fetchUrl) {
            // Fallback to direct fetch if API is not available (e.g. during dev/tests)
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                const indicator = data.status.indicator;
                return {
                    provider: name,
                    status: indicator === "none" ? "operational" : indicator === "minor" ? "degraded" : "outage",
                    message: data.status.description
                };
            }
            return { provider: name, status: "unknown" };
        }

        const res = await window.vwoApi.system.fetchUrl(url);
        if (res.ok) {
            const data = res.data;
            const indicator = data.status.indicator;
            return {
                provider: name,
                status: indicator === "none" ? "operational" : indicator === "minor" ? "degraded" : "outage",
                message: data.status.description
            };
        }
        return { provider: name, status: res.status === 404 ? "outage" : "unknown" };
    } catch {
        return { provider: name, status: "unknown" };
    }
}

/**
 * Fetch status for major providers
 */
export async function getGlobalStatus(): Promise<ProviderHealthStatus[]> {
    const statusPromises = [
        fetchStatusPage("OpenAI", GLOBAL_ENDPOINTS.openai),
        fetchStatusPage("Anthropic", GLOBAL_ENDPOINTS.anthropic),
        fetchStatusPage("Google Gemini", GLOBAL_ENDPOINTS.google),
        fetchStatusPage("Groq", GLOBAL_ENDPOINTS.groq),
        fetchStatusPage("Mistral", GLOBAL_ENDPOINTS.mistral),
        fetchStatusPage("Perplexity", GLOBAL_ENDPOINTS.perplexity),
        fetchStatusPage("Cohere", GLOBAL_ENDPOINTS.cohere),
        fetchStatusPage("ElevenLabs", GLOBAL_ENDPOINTS.elevenlabs),
        fetchStatusPage("Deepgram", GLOBAL_ENDPOINTS.deepgram),
        fetchStatusPage("Replicate", GLOBAL_ENDPOINTS.replicate),
        fetchStatusPage("Hugging Face", GLOBAL_ENDPOINTS.huggingface),
        fetchStatusPage("Brave Search", GLOBAL_ENDPOINTS.brave),
        fetchStatusPage("Tavily AI", GLOBAL_ENDPOINTS.tavily),
        // Special case for DeepSeek
        (async (): Promise<ProviderHealthStatus> => {
            try {
                if (window.vwoApi?.system?.fetchUrl) {
                    const res = await window.vwoApi.system.fetchUrl("https://status.deepseek.com/");
                    return { provider: "DeepSeek", status: res.ok ? "operational" : "degraded" };
                }
                const res = await fetch("https://status.deepseek.com/");
                return { provider: "DeepSeek", status: res.ok ? "operational" : "degraded" };
            } catch {
                return { provider: "DeepSeek", status: "unknown" };
            }
        })(),
        // Special case for OpenRouter
        (async (): Promise<ProviderHealthStatus> => {
            try {
                if (window.vwoApi?.system?.fetchUrl) {
                    const res = await window.vwoApi.system.fetchUrl("https://openrouter.ai/api/v1/models");
                    return { provider: "OpenRouter", status: res.ok ? "operational" : "degraded" };
                }
                const res = await fetch("https://openrouter.ai/api/v1/models");
                return { provider: "OpenRouter", status: res.ok ? "operational" : "degraded" };
            } catch {
                return { provider: "OpenRouter", status: "unknown" };
            }
        })(),
        // Special case for Moonshot Kimi
        (async (): Promise<ProviderHealthStatus> => {
            try {
                if (window.vwoApi?.system?.fetchUrl) {
                    const res = await window.vwoApi.system.fetchUrl("https://api.moonshot.cn/v1/models");
                    return { provider: "Moonshot Kimi", status: res.ok ? "operational" : "degraded" };
                }
                const res = await fetch("https://api.moonshot.cn/v1/models");
                return { provider: "Moonshot Kimi", status: res.ok ? "operational" : "degraded" };
            } catch {
                return { provider: "Moonshot Kimi", status: "unknown" };
            }
        })(),
        // Special case for Hume AI
        (async (): Promise<ProviderHealthStatus> => {
            try {
                if (window.vwoApi?.system?.fetchUrl) {
                    const res = await window.vwoApi.system.fetchUrl("https://api.hume.ai/v0/health");
                    return { provider: "Hume AI", status: res.ok ? "operational" : "degraded" };
                }
                const res = await fetch("https://api.hume.ai/v0/health");
                return { provider: "Hume AI", status: res.ok ? "operational" : "degraded" };
            } catch {
                return { provider: "Hume AI", status: "unknown" };
            }
        })()
    ];

    return Promise.all(statusPromises);
}

/**
 * Perform a quick latency test (ping) for a provider
 */
export async function testLatency(providerId: string, apiKey: string): Promise<number> {
    const start = Date.now();
    try {
        const { checkProviderHealth } = await import("./healthChecks");
        const ok = await checkProviderHealth(providerId, apiKey);
        return ok ? Date.now() - start : -1;
    } catch {
        return -1;
    }
}
