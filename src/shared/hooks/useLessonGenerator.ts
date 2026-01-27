/* eslint-disable react-hooks/exhaustive-deps */
/**
 * useLessonGenerator Hook (Refactored)
 *
 * This hook is now a composition of specialized sub-hooks:
 * - useLessonState: Manages core state, materials, and ordering.
 * - useLessonFiles: Handles file uploads and processing.
 * - useLessonActions: Core lesson generation, exports, and media.
 * - useLessonQuiz: Exam generation and quiz logic.
 */

import { useLessonProgressStore } from "@shared/model/lessonProgressStore";
import { useCallback, useMemo, useRef, useState } from "react";

import { useLessonActions } from "./lesson/useLessonActions";
import { useLessonFiles } from "./lesson/useLessonFiles";
import { useLessonState } from "./lesson/useLessonState";
import { useSettings } from "./useSettings";
import { useTranslations } from "./useTranslations";

export interface UseLessonGeneratorProps {
  subject: string;
}

export function useLessonGenerator({ subject }: UseLessonGeneratorProps) {
  const { t, lang } = useTranslations();
  const lessonT = (t as Record<string, Record<string, string | undefined>>).lesson || {};
  const { settings } = useSettings();
  const { logLessonGenerated } = useLessonProgressStore();

  // 1. Core State
  const state = useLessonState({ subject });

  // 2. File Handling
  const { processFiles } = useLessonFiles({
    subject,
    setError: state.setError,
    refetchMaterials: state.refetchMaterials,
  });

  // 3. Actions
  const actions = useLessonActions({
    subject,
    lang,
    settings,
    lessonT,
    selectedMaterials: state.selectedMaterials,
    orderedMaterialIds: state.orderedMaterialIds,
    materials: state.materials,
    setLoading: state.setLoading,
    loading: state.loading,
    setError: state.setError,
    setProgress: state.setProgress,
    setProgressStatus: state.setProgressStatus,
    setGenStage: state.setGenStage,
    setPodcastLoading: (id) => setPodcastLoadingInternal(id),
    addLesson: state.addLesson,
    updateLesson: state.updateLesson,
    setExpandedLessonId: state.setExpandedLessonId,
    logLessonGenerated,
    refetchMaterials: state.refetchMaterials,
    setSelectedMaterials: state.setSelectedMaterials,
    savedLessons: state.savedLessons,
  });


  // Refs
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Local state that wasn't moved yet (podcast loading, editing)
  const [podcastLoading, setPodcastLoadingInternal] = useState<string | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [highlightedConcepts, setHighlightedConcepts] = useState<Set<string>>(new Set());


  // Combined Handlers (Stabilized)
  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;
      await processFiles(Array.from(files));
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [processFiles],
  );

  const handleFileDrop = useCallback(
    async (files: FileList) => {
      await processFiles(Array.from(files));
    },
    [processFiles],
  );

  const toggleSelection = useCallback((id: string) => {
    state.setSelectedMaterials((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const confirmDeleteLesson = useCallback(() => {
    if (state.lessonToDelete) {
      state.deleteLesson(state.lessonToDelete);
      if (state.expandedLessonId === state.lessonToDelete) {
        state.setExpandedLessonId(null);
      }
      state.setLessonToDelete(null);
    }
  }, [state.lessonToDelete, state.deleteLesson, state.expandedLessonId, state.setExpandedLessonId, state.setLessonToDelete]);

  const handleRenameLesson = useCallback(
    (lessonId: string, newTitle: string) => {
      if (!newTitle.trim()) return;
      state.updateLesson(lessonId, { title: newTitle.trim() });
      setEditingLessonId(null);
      setEditingTitle("");
    },
    [state.updateLesson],
  );

  const clearError = useCallback(() => state.setError(null), [state.setError]);


  // ELITE FIX: Memoize the entire return object to prevent down-stream thrashing
  return useMemo(() => ({
    subject,
    ...state,
    ...actions,
    genStage: state.genStage,

    // Remaining local state
    podcastLoading,
    editingLessonId,
    setEditingLessonId,
    editingTitle,
    setEditingTitle,
    highlightedConcepts,
    setHighlightedConcepts,

    // Refs
    fileInputRef,
    sectionRefs,

    // Translation access
    t,
    lessonT,
    lang,
    settings,

    // Composed Handlers
    handleFileUpload,
    handleFileDrop,
    toggleSelection,
    confirmDeleteLesson,
    handleRenameLesson,
    clearError,
  }), [
    subject, state, actions, podcastLoading, editingLessonId, editingTitle,
    highlightedConcepts, t, lessonT, lang, settings, handleFileUpload, handleFileDrop,
    toggleSelection, confirmDeleteLesson, handleRenameLesson, clearError
  ]);
}

export type UseLessonGeneratorReturn = ReturnType<typeof useLessonGenerator>;
