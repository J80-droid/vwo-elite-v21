import { LessonItem } from "@features/lesson";
import { SavedLesson } from "@shared/types/study";
import { X } from "lucide-react";
import React from "react";

import { SUBJECT_THEME_CONFIG } from "../../types/library.types";

type ThemeConfig = typeof SUBJECT_THEME_CONFIG[string];

interface LessonViewerOverlayProps {
    lessonData: ReturnType<typeof import("@shared/hooks/useLessonGenerator").useLessonGenerator>;
    subjectLessons: SavedLesson[];
    ui: ReturnType<typeof import("../../hooks/useSubjectRoomState").useSubjectRoomState>;
    theme: ThemeConfig;
    lang: string;
}

export const LessonViewerOverlay: React.FC<LessonViewerOverlayProps> = ({
    lessonData,
    subjectLessons,
    ui,
    lang,
}) => {
    if (!lessonData.expandedLessonId) return null;

    const activeLesson = subjectLessons.find((l) => l.id === lessonData.expandedLessonId);

    return (
        <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-xl animate-in fade-in duration-300 overflow-y-auto custom-scrollbar p-6 md:p-12">
            <button
                onClick={() => lessonData.setExpandedLessonId(null)}
                className="fixed top-8 right-8 p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all z-[160] shadow-2xl"
            >
                <X size={24} />
            </button>
            <div className="max-w-4xl mx-auto py-10">
                {activeLesson && (
                    <LessonItem
                        lesson={activeLesson}
                        isExpanded={true}
                        onToggle={() => { }}
                        editingLessonId={lessonData.editingLessonId}
                        editingTitle={lessonData.editingTitle}
                        setEditingTitle={lessonData.setEditingTitle}
                        setEditingLessonId={lessonData.setEditingLessonId}
                        handleRenameLesson={lessonData.handleRenameLesson}
                        handleGeneratePodcast={lessonData.handleGeneratePodcast}
                        handleGenerateImage={lessonData.handleGenerateImage}
                        podcastLoading={lessonData.podcastLoading}
                        handleExportPDF={lessonData.handleExportPDF}
                        setLessonToDelete={lessonData.setLessonToDelete}
                        handleConvertToFlashcards={lessonData.handleConvertToFlashcards}
                        onExploreInGraph={ui.setActiveGraphNodeId}
                        sectionRefs={lessonData.sectionRefs}
                        lessonT={lessonData.lessonT}
                        materials={lessonData.materials}
                        highlightedConcepts={lessonData.highlightedConcepts}
                        setHighlightedConcepts={lessonData.setHighlightedConcepts}
                        onSessionUpdate={(updated) =>
                            lessonData.updateLesson(updated.id, updated)
                        }
                        lang={lang as "nl" | "en" | "fr" | "es"}
                        t={lessonData.t}
                    />
                )}
            </div>
        </div>
    );
};
