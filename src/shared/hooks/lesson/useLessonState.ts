import { useLessonStore } from "@features/lesson/model/lessonStore";
import { useLessonProgressStore } from "@shared/model/lessonProgressStore";
import { StudyMaterial } from "@shared/types/index";
import { useCallback, useMemo, useState } from "react";

import { useMaterialsBySubject } from "../useLocalData";

export interface UseLessonStateProps {
    subject: string;
}

export function useLessonState({ subject }: UseLessonStateProps) {
    const {
        savedLessons: allSavedLessons,
        addLesson,
        updateLesson,
        deleteLesson,
        importLessons,
    } = useLessonProgressStore();

    const { data: materials = [], refetch: refetchMaterials } =
        useMaterialsBySubject(subject);

    // Filter lessons for this subject
    const savedLessons = useMemo(
        () => allSavedLessons.filter((l) => l.subject === subject),
        [allSavedLessons, subject],
    );

    // Global State via Store
    const {
        selectedMaterials: globalSelectedMaterials,
        setSelectedMaterials,
        searchQuery,
        setSearchQuery,
        manualOrder,
        setManualOrder,
    } = useLessonStore();

    // Subject-scoped selection
    const selectedMaterials = useMemo(() => {
        const subjectIds = new Set(materials.map((m) => m.id));
        const filtered = new Set<string>();
        globalSelectedMaterials.forEach((id) => {
            if (subjectIds.has(id)) filtered.add(id);
        });
        return filtered;
    }, [globalSelectedMaterials, materials]);

    // Local UI State (ephemeral)
    const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);
    const [lessonToDelete, setLessonToDelete] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [genStage, setGenStage] = useState<"idle" | "ingest" | "digest" | "cache" | "generating" | "complete">("idle");
    const [progress, setProgress] = useState(0);
    const [progressStatus, setProgressStatus] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [showMaterialsLibrary, setShowMaterialsLibrary] = useState(false);

    // Derived state: Combine materials with manual order
    const orderedMaterialIds = useMemo(() => {
        const materialIds = materials.map((m) => m.id);

        // Filter manual order to only include existing materials
        const preserved = manualOrder.filter(id => materialIds.includes(id));

        // Find new materials not in manual order
        const newIds = materialIds.filter(id => !manualOrder.includes(id));

        return [...preserved, ...newIds];
    }, [materials, manualOrder]);

    const filteredMaterials = useMemo(
        () =>
            orderedMaterialIds
                .map((id) => materials.find((m) => m.id === id))
                .filter((m): m is StudyMaterial => !!m)
                .filter((m) =>
                    (m.name || "").toLowerCase().includes(searchQuery.toLowerCase()),
                ),
        [orderedMaterialIds, materials, searchQuery],
    );

    const reorderMaterials = useCallback(
        async (activeId: string, overId: string) => {
            setManualOrder((prev) => {
                // If prev is empty, initialize it from current orderedMaterialIds
                const currentOrder = prev.length > 0 ? prev : orderedMaterialIds;
                const oldIndex = currentOrder.indexOf(activeId);
                const newIndex = currentOrder.indexOf(overId);

                if (oldIndex !== -1 && newIndex !== -1) {
                    const newOrder = [...currentOrder];
                    const [removed] = newOrder.splice(oldIndex, 1);
                    if (removed) {
                        newOrder.splice(newIndex, 0, removed);
                    }
                    return newOrder;
                }
                return currentOrder;
            });
        },
        [orderedMaterialIds, setManualOrder],
    );

    return {
        materials,
        selectedMaterials,
        setSelectedMaterials,
        searchQuery,
        setSearchQuery,
        savedLessons,
        expandedLessonId,
        setExpandedLessonId,
        lessonToDelete,
        setLessonToDelete,
        loading,
        setLoading,
        genStage,
        setGenStage,
        progress,
        setProgress,
        progressStatus,
        setProgressStatus,
        error,
        setError,
        orderedMaterialIds,
        setManualOrder,
        showMaterialsLibrary,
        setShowMaterialsLibrary,
        filteredMaterials,
        refetchMaterials,
        reorderMaterials,
        addLesson,
        updateLesson,
        deleteLesson,
        importLessons,
    };
}
