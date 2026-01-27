import JSZip from "jszip";
import { useCallback } from "react";

import { getTieredStorage } from "../../../shared/api/memory";
import { useFileProcessor } from "../../../shared/hooks/useFileProcessor";
import { useDeleteStudyMaterial, useSaveStudyMaterial } from "../../../shared/hooks/useLocalData";
import { StudyMaterialContent } from "../../../shared/types/ai-brain";
import { StudyMaterial } from "../../../shared/types/study";

interface UseContentManagerProps {
    subject: string;
    setError: (err: string | null) => void;
    refetchMaterials: () => void;
}

export const useContentManager = ({
    subject,
    setError,
    refetchMaterials,
}: UseContentManagerProps) => {
    const saveMaterialMutation = useSaveStudyMaterial();
    const deleteMaterialMutation = useDeleteStudyMaterial();
    const { processFiles: extractMaterials } = useFileProcessor();

    const handleUpload = useCallback(
        async (files: File[]) => {
            setError(null);
            try {
                // AUDIT FIX: Use unified processor
                const validMaterials = await extractMaterials(files, subject);

                if (validMaterials.length === 0) return;

                // AUDIT FIX: Parallel database persistence
                await Promise.all(
                    validMaterials.map(async (m) => {
                        await saveMaterialMutation.mutateAsync(m);
                        // Add to memory brain
                        try {
                            await getTieredStorage().onStudyMaterialCreate({
                                ...m,
                                title: m.name || "Untitled",
                                type: m.type === "txt" ? "text" : m.type,
                            } as StudyMaterialContent);
                        } catch (e) {
                            console.error("Failed to add to memory:", e);
                        }
                    })
                );

                refetchMaterials();
            } catch (err) {
                setError(err instanceof Error ? err.message : "Fout bij uploaden.");
            }
        },
        [saveMaterialMutation, refetchMaterials, setError, extractMaterials, subject],
    );

    const handleZipUpload = useCallback(
        async (file: File) => {
            setError(null);
            try {
                const zip = await JSZip.loadAsync(file);
                const files: File[] = [];

                for (const [path, zipEntry] of Object.entries(zip.files)) {
                    if (!zipEntry.dir) {
                        const blob = await zipEntry.async("blob");
                        files.push(new File([blob], path.split("/").pop() || path));
                    }
                }

                await handleUpload(files);
            } catch (err: unknown) {
                console.error(err);
                setError("Fout bij uitpakken van ZIP.");
            }
        },
        [handleUpload, setError],
    );

    const handleUrlUpload = useCallback(
        async (url: string, type: "url" | "youtube" | "wikipedia" = "url") => {
            setError(null);
            try {
                const newMaterial: StudyMaterial = {
                    id: crypto.randomUUID(),
                    name: type === "wikipedia" ? `Wiki: ${url}` : url.split("/").pop() || url,
                    subject,
                    type: "txt",
                    content: url, // For URLs we store the link as content for scraping later
                    date: new Date().toISOString(),
                    createdAt: Date.now(),
                    // metadata: { sourceUrl: url, sourceType: type } // TODO: Update type definition
                };

                await saveMaterialMutation.mutateAsync(newMaterial);
                refetchMaterials();
            } catch (err: unknown) {
                console.error(err);
                setError("Fout bij opslaan van URL.");
            }
        },
        [subject, saveMaterialMutation, refetchMaterials, setError],
    );

    const handleDelete = useCallback(
        async (id: string) => {
            try {
                await deleteMaterialMutation.mutateAsync(id);
                refetchMaterials();
            } catch (err: unknown) {
                console.error(err);
                setError("Fout bij verwijderen.");
            }
        },
        [deleteMaterialMutation, refetchMaterials, setError],
    );

    return {
        handleUpload,
        handleZipUpload,
        handleUrlUpload,
        handleDelete,
    };
};
