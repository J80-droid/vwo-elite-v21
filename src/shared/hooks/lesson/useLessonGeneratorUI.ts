
import { LearningIntent, SourceReliability } from "@shared/types/index";
import { useState } from "react";

export function useLessonGeneratorUI() {
    // Modals
    const [showIntentModal, setShowIntentModal] = useState(false);
    const [showGapModal, setShowGapModal] = useState(false);
    const [showMaterialsLibrary, setShowMaterialsLibrary] = useState(false);
    const [isGraphOpen, setIsGraphOpen] = useState(false);
    const [activeGraphNodeId, setActiveGraphNodeId] = useState<string | undefined>(undefined);

    // Generation Settings UI
    const [intent, setIntent] = useState<LearningIntent>("summarize");
    const [sourceCheck, setSourceCheck] = useState<SourceReliability>("high");
    const [missingConcepts, setMissingConcepts] = useState<string[]>([]);

    const closeGraph = () => {
        setIsGraphOpen(false);
        setActiveGraphNodeId(undefined);
    };

    const openGraph = (id?: string) => {
        setActiveGraphNodeId(id);
        setIsGraphOpen(true);
    };

    return {
        // State
        showIntentModal,
        showGapModal,
        showMaterialsLibrary,
        isGraphOpen,
        activeGraphNodeId,
        intent,
        sourceCheck,
        missingConcepts,

        // Setters
        setShowIntentModal,
        setShowGapModal,
        setShowMaterialsLibrary,
        setIntent,
        setSourceCheck,
        setMissingConcepts,

        // Actions
        closeGraph,
        openGraph,
    };
}
