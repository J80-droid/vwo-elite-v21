import { closestCenter, DndContext, DragEndEvent, DragStartEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { KnowledgeStage as KnowledgeGraph } from "@features/brainstorm/ui/modules/knowledge/KnowledgeStage";
import { LessonItem } from "@features/lesson/LessonGenerator/LessonItem";
import { LessonMaterialLibrary } from "@features/lesson/LessonGenerator/LessonMaterialLibrary";
import { LessonUploadZone } from "@features/lesson/LessonGenerator/LessonUploadZone";
import { LearningCockpit } from "@features/lesson/ui/LearningCockpit";
import { SubjectHeader } from "@features/library/ui/components/SubjectHeader";
import { UseLessonGeneratorReturn } from "@shared/hooks/useLessonGenerator";
import { useTranslations } from "@shared/hooks/useTranslations";
import { DidacticConfig, LearningIntent, type SavedLesson, SourceReliability } from "@shared/types";
import { Language } from "@shared/types/common";
import { AnimatePresence, motion } from "framer-motion";
import { AlertOctagon, X, Zap } from "lucide-react";
import React from "react";

interface MainGeneratorViewProps {
    data: UseLessonGeneratorReturn;
    ui: {
        showGapModal: boolean;
        showMaterialsLibrary: boolean;
        isGraphOpen: boolean;
        activeGraphNodeId: string | undefined;
        missingConcepts: string[];
        setShowMaterialsLibrary: (v: boolean) => void;
        setShowGapModal: (v: boolean) => void;
        closeGraph: () => void;
        openGraph: (id?: string) => void;
    };
    metrics: {
        mastery: number;
        weakTopics: string[];
    };
    onGenerateClick: (config: DidacticConfig, intent: LearningIntent, sourceCheck: SourceReliability) => void;
    onDragEnd: (event: DragEndEvent) => void;
}

const ZenProgressBar: React.FC<{ progress: number, status?: string }> = ({ progress, status }) => (
    <div className="w-full space-y-3 px-1">
        <div className="flex justify-between items-end">
            <span className="text-[7px] font-black uppercase tracking-[0.5em] text-indigo-400 animate-pulse">{status || "Synthesizing Telemetry..."}</span>
            <span className="text-[8px] font-black text-white/20 tabular-nums">{Math.round(progress)}%</span>
        </div>
        <div className="relative h-[1px] w-full bg-white/5 overflow-hidden">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="absolute inset-y-0 left-0 bg-indigo-500 shadow-[0_0_10px_indigo]"
            />
        </div>
    </div>
);

export const MainGeneratorView: React.FC<MainGeneratorViewProps> = ({
    data,
    ui,
    onDragEnd,
}) => {
    const {
        subject,
        selectedMaterials,
        filteredMaterials,
        savedLessons,
        expandedLessonId,
        lessonToDelete,
        loading,
        progress,
        progressStatus,
        podcastLoading,
        editingLessonId,
        editingTitle,
        searchQuery,
        highlightedConcepts,
        error,
        fileInputRef,
        sectionRefs,
        lessonT,
        setSearchQuery,
        setExpandedLessonId,
        setLessonToDelete,
        setEditingLessonId,
        setEditingTitle,
        setHighlightedConcepts,
        handleFileUpload,
        handleFileDrop,
        toggleSelection,
        handleDeleteMaterial,
        handleExportPDF,
        handleExportHTML,
        handleConvertToFlashcards,
        confirmDeleteLesson,
        handleRenameLesson,
        handleGeneratePodcast,
        handleGenerateImage,
        clearError,
        materials,
        handleGenerateLesson,
    } = data;

    const { isGraphOpen, activeGraphNodeId } = ui;
    const { t } = useTranslations();

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const announcements = {
        onDragStart: ({ active }: DragStartEvent) => `Picking up ${active.id}`,
        onDragEnd: ({ over }: DragEndEvent) => over ? `Dropped over ${over.id}` : "Drag ended",
        onDragOver: () => "",
        onDragCancel: () => "",
    };

    const handleSessionUpdate = React.useCallback(
        (updatedLesson: SavedLesson) => updatedLesson.id && data.updateLesson(updatedLesson.id, updatedLesson),
        [data]
    );

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
            accessibility={{ announcements }}
        >
            <div className="min-h-screen flex flex-col relative overflow-hidden bg-transparent selection:bg-indigo-500/30 font-outfit">
                {/* Minimalist Error HUD */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="fixed top-8 right-8 z-[100] max-w-sm"
                        >
                            <div className="bg-rose-500/5 border border-rose-500/20 p-6 rounded-3xl backdrop-blur-xl flex items-start gap-4">
                                <AlertOctagon className="text-rose-500 mt-1" size={18} />
                                <div className="flex-1">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-500">System Error</h4>
                                    <p className="text-rose-300/60 text-[9px] font-bold mt-1 uppercase leading-relaxed">{error}</p>
                                </div>
                                <button onClick={clearError} className="text-white/20 hover:text-white"><X size={14} /></button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <SubjectHeader
                    subjectName={subject}
                    onBack={() => window.history.back()}
                    themeKey={subject.toLowerCase()}
                    storeSubjectName={subject}
                    hideActionButton={true}
                />

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="max-w-[1600px] mx-auto px-6 py-12 md:px-12 md:py-20 lg:py-12">
                        {/* Zen Layout */}
                        <div className="flex flex-col gap-12">

                            {/* Top Row: Horizontal Upload Zone & Telemetry */}
                            <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
                                <div className="xl:col-span-3">
                                    <div className="flex items-center gap-4 px-2 mb-6">
                                        <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                                        <h2 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">
                                            Library
                                        </h2>
                                    </div>
                                    <LessonMaterialLibrary
                                        lessonT={lessonT}
                                        searchQuery={searchQuery}
                                        setSearchQuery={setSearchQuery}
                                        filteredMaterials={filteredMaterials}
                                        selectedMaterials={selectedMaterials}
                                        toggleSelection={toggleSelection}
                                        handleDeleteMaterial={handleDeleteMaterial}
                                        loading={loading}
                                        progress={progress}
                                        progressStatus={progressStatus}
                                        handleGenerateLesson={handleGenerateLesson}
                                    />
                                </div>

                                <div className="xl:col-span-9 space-y-12">
                                    <LessonUploadZone
                                        lessonT={lessonT}
                                        fileInputRef={fileInputRef}
                                        handleFileUpload={handleFileUpload}
                                        handleFileDrop={handleFileDrop}
                                    />

                                    <div className="relative">
                                        <LearningCockpit
                                            subject={subject}
                                            onGenerate={handleGenerateLesson}
                                        />

                                        {/* Immersive Integration HUD */}
                                        <AnimatePresence>
                                            {loading && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="absolute inset-x-[-2rem] inset-y-[-2rem] z-50 flex flex-col items-center justify-center backdrop-blur-md rounded-[5rem] bg-black/40 border border-indigo-500/20"
                                                >
                                                    <div className="w-full max-w-sm space-y-12 px-6">
                                                        <div className="flex flex-col items-center gap-6">
                                                            <div className="w-16 h-16 rounded-full border border-indigo-500/20 flex items-center justify-center relative">
                                                                <motion.div
                                                                    animate={{ rotate: 360 }}
                                                                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                                                    className="absolute inset-0 border-t border-indigo-500 rounded-full"
                                                                />
                                                                <Zap className="text-indigo-400" size={20} />
                                                            </div>
                                                            <span className="text-[9px] font-black uppercase tracking-[0.5em] text-white">Synthesizing Neural Path</span>
                                                        </div>
                                                        <ZenProgressBar progress={progress} status={progressStatus} />
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>

                            {/* Archive Section */}
                            <div className="space-y-12">
                                <div className="flex items-center gap-6 px-2">
                                    <h2 className="text-[10px] font-black text-white/20 uppercase tracking-[0.6em]">
                                        Neural Archive
                                    </h2>
                                    <div className="h-[1px] w-12 bg-white/5" />
                                    <span className="text-[10px] font-black text-indigo-400/30 italic uppercase">{savedLessons.length} DATA STREAMS</span>
                                </div>

                                <div className="space-y-4">
                                    {savedLessons.length === 0 ? (
                                        <div className="py-24 flex flex-col items-center justify-center border border-white/5 rounded-[4rem] bg-white/[0.02]">
                                            <div className="w-px h-12 bg-white/5 mb-6" />
                                            <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/10">Archive silent</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-2">
                                            {savedLessons.map((lesson) => (
                                                <LessonItem
                                                    key={lesson.id}
                                                    lesson={lesson}
                                                    isExpanded={expandedLessonId === lesson.id}
                                                    onToggle={() => setExpandedLessonId(expandedLessonId === lesson.id ? null : (lesson.id || null))}
                                                    editingLessonId={editingLessonId}
                                                    editingTitle={editingTitle}
                                                    setEditingTitle={setEditingTitle}
                                                    setEditingLessonId={setEditingLessonId}
                                                    handleRenameLesson={handleRenameLesson}
                                                    handleGeneratePodcast={handleGeneratePodcast}
                                                    handleGenerateImage={handleGenerateImage}
                                                    podcastLoading={podcastLoading}
                                                    handleExportPDF={handleExportPDF}
                                                    handleExportHTML={handleExportHTML}
                                                    setLessonToDelete={setLessonToDelete}
                                                    handleConvertToFlashcards={handleConvertToFlashcards}
                                                    onSessionUpdate={handleSessionUpdate}
                                                    onExploreInGraph={ui.openGraph}
                                                    highlightedConcepts={highlightedConcepts}
                                                    setHighlightedConcepts={setHighlightedConcepts}
                                                    sectionRefs={sectionRefs}
                                                    lessonT={lessonT || {}}
                                                    t={t}
                                                    materials={materials}
                                                    lang={(lesson.language as Language) || "nl"}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Minimal Purge Portal */}
                <AnimatePresence>
                    {lessonToDelete && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-black/60">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-full max-w-sm bg-black border border-white/5 rounded-[3rem] p-12 text-center"
                            >
                                <span className="text-[9px] font-black text-rose-500 uppercase tracking-[0.5em] mb-8 block">Permanent Purge</span>
                                <h3 className="text-white text-lg font-black italic uppercase tracking-tighter mb-4">Disconnect Stream?</h3>
                                <p className="text-white/20 text-[9px] uppercase font-bold tracking-[0.2em] leading-relaxed mb-10">
                                    Link "{savedLessons.find(l => l.id === lessonToDelete)?.title}" will be lost.
                                </p>
                                <div className="flex gap-4 justify-center">
                                    <button
                                        onClick={() => setLessonToDelete(null)}
                                        className="px-8 py-3 rounded-full border border-white/10 text-[8px] font-black uppercase tracking-widest text-white/30 hover:text-white transition-all"
                                    >
                                        Abort
                                    </button>
                                    <button
                                        onClick={confirmDeleteLesson}
                                        className="px-8 py-3 rounded-full border border-rose-500/30 text-[8px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/5 transition-all"
                                    >
                                        Confirm
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <KnowledgeGraph
                    isOpen={isGraphOpen}
                    onClose={ui.closeGraph}
                    {...(activeGraphNodeId ? { highlightNodeId: activeGraphNodeId } : {})}
                />
            </div>
        </DndContext>
    );
};
