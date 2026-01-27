import { smartIngest } from "@shared/lib/smartIngest";
import { StudyMaterial } from "@shared/types/index";
import { useCallback } from "react";

export interface ProcessFileResult {
    file: File;
    material: StudyMaterial | null;
    error?: string;
}

// Simplified helper using the Elite smartIngest pipeline
const readFileContent = async (file: File) => {
    try {
        const ingested = await smartIngest(file);
        return {
            type: ingested.type === "text" ? "txt" : (ingested.type === "image" ? "image" : "pdf"),
            content: ingested.content
        };
    } catch (e) {
        console.error("SmartIngest Error:", e);
        // Fallback to basic text reading if smartIngest fails
        const text = await file.text();
        return { type: "txt", content: text };
    }
};

export const useFileProcessor = () => {
    const processFiles = useCallback(async (files: File[], subject: string): Promise<StudyMaterial[]> => {
        const results: StudyMaterial[] = [];

        // ELITE FINESSE: Process files in batches to prevent UI freeze
        const BATCH_SIZE = 3;
        for (let i = 0; i < files.length; i += BATCH_SIZE) {
            const batch = files.slice(i, i + BATCH_SIZE);
            const batchResults = await Promise.all(batch.map(async (file) => {
                try {
                    const { type, content } = await readFileContent(file);

                    const material: StudyMaterial = {
                        id: crypto.randomUUID(),
                        name: file.name,
                        subject,
                        type: type as StudyMaterial['type'],
                        content,
                        date: new Date().toISOString(),
                        createdAt: Date.now(),
                    };
                    return material;
                } catch (err) {
                    console.error(`Skipping file ${file.name}`, err);
                    return null;
                }
            }));
            results.push(...batchResults.filter((m): m is StudyMaterial => m !== null));
        }

        return results;
    }, []);

    return { processFiles };
};
