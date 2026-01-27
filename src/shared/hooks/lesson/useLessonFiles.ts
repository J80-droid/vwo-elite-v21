import { getTieredStorage } from "@shared/api/memory";
import { useCallback } from "react";

import { useFileProcessor } from "../useFileProcessor";
import { useSaveStudyMaterial } from "../useLocalData";

export interface UseLessonFilesProps {
    subject: string;
    setError: (err: string | null) => void;
    refetchMaterials: () => void;
}

export function useLessonFiles({
    subject,
    setError,
    refetchMaterials,
}: UseLessonFilesProps) {
    const saveMaterialMutation = useSaveStudyMaterial();
    const { processFiles: extractMaterials } = useFileProcessor();

    const processFiles = useCallback(async (files: File[]) => {
        setError(null);

        // STEP 1: Delegate processing to unified hook
        const processedMaterials = await extractMaterials(files, subject);

        if (processedMaterials.length === 0 && files.length > 0) {
            setError("Geen bestanden konden worden verwerkt.");
            return;
        }

        // STEP 2: Save and Index
        try {
            // 1. Save materials to DB first
            await Promise.all(processedMaterials.map(mat => saveMaterialMutation.mutateAsync(mat)));

            // 2. Trigger background memory indexing serially
            const tieredStorage = getTieredStorage();
            console.log(`[useLessonFiles] Indexing ${processedMaterials.length} materials in memory...`);

            // ELITE FIX: Serially index to prevent competing with lesson generation
            for (const mat of processedMaterials) {
                try {
                    await tieredStorage.onStudyMaterialCreate({
                        ...mat,
                        title: (mat.name || "Bestand") as string
                    });
                } catch (err) {
                    console.error(`[useLessonFiles] Memory indexing failed for ${mat.name}:`, err);
                }
            }

            refetchMaterials();
        } catch (err: unknown) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Opslaan mislukt.");
        }
    }, [subject, saveMaterialMutation, refetchMaterials, setError, extractMaterials]);

    return {
        processFiles,
    };
}
