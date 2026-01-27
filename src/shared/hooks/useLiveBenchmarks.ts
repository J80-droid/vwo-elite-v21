import { useEffect } from 'react';

import { useBenchmarksStore } from '../model/benchmarksStore';

/**
 * Hook to ensure live LMSYS benchmarks are loaded.
 * Call this in your root layout or Settings component.
 */
export const useLiveBenchmarks = () => {
    const { fetchBenchmarks, benchmarks, lastUpdated, loading } = useBenchmarksStore();

    useEffect(() => {
        // Fetch if empty or it's been a while (optional persistence check)
        // For now, we trust the store's persistence, but let's fetch on mount 
        // if we want "Live" updates every session.
        // Given the user wants "Real Live Data", fetching on mount is safer.
        fetchBenchmarks();
    }, [fetchBenchmarks]);

    return { benchmarks, lastUpdated, loading };
};
