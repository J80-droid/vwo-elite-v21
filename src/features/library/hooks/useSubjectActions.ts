import { useCelebration } from "@shared/hooks/useCelebration";
import { useLessonGenerator } from "@shared/hooks/useLessonGenerator";
import { useTranslations } from "@shared/hooks/useTranslations";
import { useContextSetStore } from "@shared/model/contextSetStore";
import { useCallback,useRef } from "react";

import { useContentManager } from "./useContentManager";
import { useSubjectRoomState } from "./useSubjectRoomState";

interface UseSubjectActionsProps {
    ui: ReturnType<typeof useSubjectRoomState>;
    lessonData: ReturnType<typeof useLessonGenerator>;
    contentManager: ReturnType<typeof useContentManager>;
    storeSubjectName: string;
}

export const useSubjectActions = ({
    ui,
    lessonData,
    contentManager,
    storeSubjectName,
}: UseSubjectActionsProps) => {
    const { t } = useTranslations();
    const { addSet } = useContextSetStore();
    const { celebrate } = useCelebration();

    // 1. Refs voor onzichtbare inputs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);
    const zipInputRef = useRef<HTMLInputElement>(null);

    // 2. Dock Actions (De switch-case logic)
    const handleDockAction = useCallback(async (id: string) => {
        switch (id) {
            case "file":
                fileInputRef.current?.click();
                break;
            case "folder":
                folderInputRef.current?.click();
                break;
            case "zip":
                zipInputRef.current?.click();
                break;
            case "clipboard":
                try {
                    const text = await navigator.clipboard.readText();
                    if (text) {
                        await contentManager.handleUrlUpload(text, "url");
                        celebrate();
                    }
                } catch (err) {
                    console.error("Clipboard access denied", err);
                }
                break;
            // Modals openen
            case "text":
                ui.setActiveModal("text", t("library.modals.titles.note") || "Notitie");
                break;
            case "url":
                ui.setActiveModal("url", t("library.modals.titles.url") || "Link");
                break;
            case "youtube":
                ui.setActiveModal("youtube", t("library.modals.titles.youtube") || "YouTube");
                break;
            case "wikipedia":
                ui.setActiveModal("wikipedia", t("library.modals.titles.wikipedia") || "Wikipedia");
                break;
            case "search":
                ui.setActiveModal("search", t("library.modals.titles.search") || "Zoeken");
                break;
            case "save":
                ui.setActiveModal("saveSet", t("library.modals.titles.save_set") || "Set Opslaan");
                break;
            case "load":
                ui.setActiveModal("loadSet", undefined);
                break;
            default:
                console.warn("Action not implemented:", id);
        }
    }, [ui, contentManager, celebrate, t]);

    // 3. Modal Submit Logic
    const handleModalSubmit = useCallback(async () => {
        if (!ui.modalValue.trim()) return;

        // A. Set Opslaan
        if (ui.activeModal === "saveSet") {
            const materialIds = Array.from(lessonData.selectedMaterials);
            if (materialIds.length > 0) {
                addSet({
                    name: ui.modalValue,
                    subject: storeSubjectName,
                    materialIds: materialIds as string[],
                });
                celebrate();
            }
            ui.resetModal();
            return;
        }

        // B. Content Toevoegen (URL, Text, etc)
        try {
            // @ts-expect-error - narrowing handled by logic
            await contentManager.handleUrlUpload(ui.modalValue, ui.activeModal);
            celebrate();
            ui.resetModal();
        } catch (err) {
            console.error("Failed to add content:", err);
        }
    }, [ui, lessonData.selectedMaterials, storeSubjectName, addSet, celebrate, contentManager]);

    // 4. Start Module Logic
    const handleStartModule = useCallback(async () => {
        const canStart = (lessonData.materials.length > 0 && lessonData.selectedMaterials.size > 0) || ui.topic.length > 0;

        if (!canStart || ui.modes.size === 0) return;

        if (ui.modes.size === 1 && ui.modes.has("exam")) {
            await lessonData.handleStartExam();
        } else {
            // Map modes to intentions
            const intentMap: Record<string, string> = {
                recap: "summarize",
                deep: "apply",
                analysis: "analyze",
                argument: "criticize",
                oral: "summarize",
            };

            const combinedIntent = Array.from(ui.modes)
                .map((m) => intentMap[m as string])
                .filter(Boolean)
                .join(",");

            // Fallback: pak de eerste intent
            const primaryIntent = combinedIntent.split(',')[0] || 'summarize';

            // @ts-expect-error - pass through
            await lessonData.handleGenerateLesson(primaryIntent);
        }
    }, [lessonData, ui.modes, ui.topic]);

    return {
        fileInputRef,
        folderInputRef,
        zipInputRef,
        handleDockAction,
        handleModalSubmit,
        handleStartModule
    };
};
