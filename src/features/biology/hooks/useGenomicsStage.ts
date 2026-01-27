import { useModuleState } from "@features/biology/hooks/useBiologyLabContext";
import { defaultGenomicsState, GenomicsState } from "@features/biology/types"; // Keep GenomicsState as it's used in the hook
import { analyzeSnapshot } from "@shared/api/gemini";
import { logActivitySQL } from "@shared/api/sqliteService";
import { Language } from "@shared/types/common";
import { AIConfig } from "@shared/types/config";
import { useCallback, useEffect, useRef } from "react";

interface StageWithResize {
    dispose: () => void;
    handleResize: () => void;
    removeAllComponents: () => void;
    loadFile: (url: string, options: Record<string, unknown>) => Promise<Record<string, unknown>>;
    compList: {
        removeRepresentation: (name: string) => void;
        addRepresentation: (name: string, config: Record<string, unknown>) => void;
    }[];
    _resizeHandler?: () => void;
}

export interface UseGenomicsStageProps {
    settings: {
        aiConfig?: AIConfig;
        [key: string]: unknown;
    };
    language?: Language;
}

export function useGenomicsStage({ settings, language }: UseGenomicsStageProps) {
    const [state, setState] = useModuleState<GenomicsState>(
        "genomics",
        defaultGenomicsState,
    );

    const stageRef = useRef<StageWithResize | null>(null);

    // NGL Viewer Init
    const setViewerRef = useCallback((node: HTMLDivElement | null) => {
        if (node) {
            import("ngl").then(({ Stage }) => {
                if (stageRef.current) stageRef.current.dispose();
                try {
                    const stage = new Stage(node, { backgroundColor: "black" }) as unknown as StageWithResize;
                    stageRef.current = stage;
                    stage.handleResize();

                    stage._resizeHandler = () => stage.handleResize();
                    window.addEventListener("resize", stage._resizeHandler);
                } catch (e) {
                    console.error("Failed to init NGL Stage", e);
                }
            });
        } else {
            if (stageRef.current) {
                const handler = stageRef.current._resizeHandler;
                if (handler) window.removeEventListener("resize", handler);
                stageRef.current.dispose();
                stageRef.current = null;
            }
        }
    }, []);

    // Load PDB Logic
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (state.viewMode === "pdb" && stageRef.current && state.pdbId) {
            const stage = stageRef.current;
            const loadPdbFile = (id: string) => {
                stage.removeAllComponents();
                const url = `rcsb://${id}`;
                stage
                    .loadFile(url, { defaultRepresentation: false })
                    .then((o: Record<string, unknown>) => { // NGL objects are complex and lacks types here
                        if (!stageRef.current) return;
                        (o as { addRepresentation: (name: string, config: Record<string, unknown>) => void; autoView: () => void; }).addRepresentation("cartoon", { color: "chainid" });
                        (o as { addRepresentation: (name: string, config: Record<string, unknown>) => void; autoView: () => void; }).autoView();
                        stage.handleResize();
                    })
                    .catch((err: unknown) => {
                        console.error("PDB Load Error", err);
                    });
            };

            timer = setTimeout(() => loadPdbFile(state.pdbId), 50);
        }
        return () => clearTimeout(timer);
    }, [state.pdbId, state.viewMode]);

    // Highlight Logic
    useEffect(() => {
        if (
            state.viewMode === "pdb" &&
            stageRef.current &&
            state.selectedIndex !== null
        ) {
            const stage = stageRef.current;
            const component = stage.compList[0];
            if (!component) return;

            const residueIndex = Math.floor(state.selectedIndex / 3) + 1;

            try {
                component.removeRepresentation("ball+stick");
                component.addRepresentation("ball+stick", {
                    sele: `${residueIndex}`,
                    color: "yellow",
                    scale: 2.0,
                });
            } catch (err) {
                console.warn("Highlight failed:", err);
            }
        }
    }, [state.selectedIndex, state.viewMode]);

    // AI Snapshot Logic
    const handleAnalyzeSnapshot = async () => {
        const element = document.getElementById("genomics-stage-container");
        if (!element) return;

        setState((p: GenomicsState) => ({ ...p, analyzing: true }));
        try {
            const html2canvas = (await import("html2canvas")).default;
            const canvas = await html2canvas(element, {
                useCORS: true,
                allowTaint: true,
                backgroundColor: "#000000",
                ignoreElements: (node) => node.classList.contains("toaster"),
            });
            const base64 = canvas.toDataURL("image/jpeg", 0.8).split(",")[1];
            if (!base64) throw new Error("Canvas toDataURL failed");

            await logActivitySQL("bio", "Snapshot naar Coach gestuurd", 25);

            const result = await analyzeSnapshot(
                base64,
                "Biology",
                (language || "nl") as Language,
                settings.aiConfig,
            );
            setState((p: GenomicsState) => ({
                ...p,
                analysisResult: result ?? null,
            }));
        } catch (e: unknown) {
            console.error("Snapshot error:", e);
            setState((p: GenomicsState) => ({
                ...p,
                analysisResult: "Error analyzing snapshot.",
            }));
        } finally {
            setState((p: GenomicsState) => ({ ...p, analyzing: false }));
        }
    };

    const closeAnalysis = () => setState((p: GenomicsState) => ({ ...p, analysisResult: null }));
    const closeTool = () => setState((p: GenomicsState) => ({ ...p, activeTool: "none" }));

    return {
        state,
        setViewerRef,
        handleAnalyzeSnapshot,
        closeAnalysis,
        closeTool,
        setSelectedIndex: (idx: number) => setState((p: GenomicsState) => ({ ...p, selectedIndex: idx })),
    };
}
