import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BenchmarksState {
    benchmarks: Record<string, number>;
    lastUpdated: string | null;
    loading: boolean;
    error: string | null;
    fetchBenchmarks: () => Promise<void>;
    getScore: (modelId: string) => number | null;
}

export const useBenchmarksStore = create<BenchmarksState>()(
    persist(
        (set, get) => ({
            benchmarks: {},
            lastUpdated: null,
            loading: false,
            error: null,

            fetchBenchmarks: async () => {
                const { lastUpdated, loading } = get();

                // ELITE OPTIMIZATION: Only fetch if empty or older than 6 hours
                if (lastUpdated && !loading) {
                    const lastDate = new Date(lastUpdated.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')).getTime();
                    const now = Date.now();
                    const sixHours = 6 * 60 * 60 * 1000;

                    if (now - lastDate < sixHours) {
                        console.log("[Benchmarks] Using cached data (fresh).");
                        return;
                    }
                }

                set({ loading: true, error: null });
                try {
                    // Attempt to fetch from local proxy
                    const response = await fetch('http://localhost:3001/api/benchmarks');

                    if (!response.ok) {
                        throw new Error(`Failed to fetch benchmarks: ${response.statusText}`);
                    }

                    const data = await response.json();

                    if (data && data.scores) {
                        set({
                            benchmarks: data.scores,
                            lastUpdated: data.date,
                            loading: false
                        });
                    } else {
                        throw new Error("Invalid benchmark data structure");
                    }
                } catch (error) {
                    console.error("Benchmark fetch failed:", error);
                    set({
                        error: (error as Error).message,
                        loading: false
                    });
                }
            },

            getScore: (modelId: string) => {
                const { benchmarks } = get();
                if (!benchmarks) return null;

                // 1. Direct match
                if (benchmarks[modelId]) return benchmarks[modelId];

                // 2. Fuzzy match / API version mapping
                // The leaderboard often uses specific versions like "gemini-1.5-pro-api-0514"
                // Our app uses "gemini-1.5-pro" or "gemini-1.5-pro-latest"

                const lowerId = modelId.toLowerCase();

                // Find keys that contain the model ID
                const matches = Object.keys(benchmarks).filter(k => k.toLowerCase().includes(lowerId));

                if (matches.length > 0) {
                    // Sort by length to find most specific, or maybe highest score?
                    // Usually we want the latest API version. 
                    // Let's pick the one with the highest score as a "best case" represention of that class.
                    const scores = matches.map(k => benchmarks[k]).filter((s): s is number => s !== undefined);
                    return scores.length > 0 ? Math.max(...scores) : null;
                }

                return null;
            }
        }),
        {
            name: 'elite-benchmarks-storage',
        }
    )
);
