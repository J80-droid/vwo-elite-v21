import { useModuleState } from "@features/biology/hooks/useBiologyLabContext";
import { defaultProteinState, ProteinState } from "@features/biology/types";
import {
    getCommonProteins,
    getProteinStructure,
    getProteinStructures,
    type ProteinSearchResult,
    searchProteins,
} from "@shared/api/alphafoldService";
import { useCallback, useEffect } from "react";

export function useProteinExplorer() {
    const [state, setState] = useModuleState<ProteinState>(
        "protein",
        defaultProteinState,
    );

    // Helper to enrich results with PDB URLs
    const enrichResults = useCallback(async (results: ProteinSearchResult[]) => {
        if (!results.length) return;

        try {
            const ids = results.map(r => r.uniprotId);
            const structures = await getProteinStructures(ids);

            setState((prev) => ({
                ...prev,
                results: prev.results.map(r => {
                    const s = structures.get(r.uniprotId);
                    return s ? { ...r, pdbUrl: s.pdbUrl } : r;
                })
            }));
        } catch (e) {
            console.error("Failed to enrich PDB URLs", e);
        }
    }, [setState]);

    // Initialize with common proteins if empty
    useEffect(() => {
        if (state.results.length === 0 && !state.query) {
            const common = getCommonProteins();
            setState((p) => ({ ...p, results: common }));
            enrichResults(common);
        }
    }, [state.results.length, state.query, setState, enrichResults]);

    const handleSearch = useCallback(async (query: string) => {
        const trimmedQuery = query.trim();
        if (!trimmedQuery) {
            const common = getCommonProteins();
            setState((p) => ({ ...p, results: common, query: "" }));
            enrichResults(common);
            return;
        }

        setState((p) => ({ ...p, loading: true, error: null, selectedProtein: null, query: trimmedQuery }));

        try {
            const proteins = await searchProteins(trimmedQuery);
            setState((p) => ({
                ...p,
                results: proteins,
                error: proteins.length === 0 ? `Geen eiwitten gevonden voor "${trimmedQuery}".` : null
            }));

            // Trigger enrichment
            enrichResults(proteins);
        } catch (e) {
            setState((p) => ({ ...p, error: "Zoeken mislukt. Controleer je internetverbinding." }));
            console.error(e);
        } finally {
            setState((p) => ({ ...p, loading: false }));
        }
    }, [setState, enrichResults]);

    const handleSelect = useCallback(async (protein: ProteinSearchResult) => {
        setState((p) => ({ ...p, loading: true, error: null }));

        try {
            const structure = await getProteinStructure(protein.uniprotId);
            if (structure) {
                // The selectedProtein state should hold the ProteinSearchResult,
                // augmented with the structure information if available.
                // This ensures the selected protein object contains all relevant details.
                setState((p) => ({ ...p, selectedProtein: { ...protein, ...structure } }));
            } else {
                setState((p) => ({
                    ...p,
                    error: `Geen AlphaFold structuur beschikbaar voor ${protein.uniprotId} (${protein.proteinName}).`
                }));
            }
        } catch (e) {
            setState((p) => ({ ...p, error: "Structuur ophalen mislukt." }));
            console.error(e);
        } finally {
            setState((p) => ({ ...p, loading: false }));
        }
    }, [setState]);

    return {
        state,
        setQuery: (q: string) => setState((p) => ({ ...p, query: q })),
        handleSearch,
        handleSelect,
    };
}
