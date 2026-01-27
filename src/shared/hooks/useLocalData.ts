import {
  deleteGeneratedMediaSQL,
  deletePWSProjectSQL,
  deleteSavedQuestionSQL,
  deleteStudyMaterialSQL,
  getAllFlashcardsSQL,
  getAllGeneratedMediaSQL,
  getAllPWSProjectsSQL,
  getAllQuizHistorySQL,
  getAllSavedQuestionsSQL,
  getAllStudyMaterialsSQL,
  getDueFlashcardsSQL,
  getMaterialsBySubjectSQL,
  getStudyMaterialsByIdsSQL,
  saveFlashcardSQL,
  saveGeneratedMediaSQL,
  savePWSProjectSQL,
  saveQuestionSQL,
  saveQuizHistorySQL,
  saveStudyMaterialSQL,
} from "@shared/api/sqliteService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// Study Materials Hooks
export const useStudyMaterials = () => {
  return useQuery({
    queryKey: ["studyMaterials"],
    queryFn: getAllStudyMaterialsSQL,
  });
};

export const useMaterialsBySubject = (subject: string) => {
  return useQuery({
    queryKey: ["studyMaterials", "subject", subject],
    queryFn: () => getMaterialsBySubjectSQL(subject),
    enabled: !!subject,
  });
};

export const useSaveStudyMaterial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveStudyMaterialSQL,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studyMaterials"] });
    },
  });
};

export const useDeleteStudyMaterial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteStudyMaterialSQL,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studyMaterials"] });
    },
  });
};

export const useStudyMaterialsByIds = (ids: string[]) => {
  return useQuery({
    queryKey: ["studyMaterials", "ids", ...ids],
    queryFn: () => getStudyMaterialsByIdsSQL(ids),
    enabled: ids.length > 0,
  });
};

// Flashcard Hooks
export const useFlashcards = () => {
  return useQuery({
    queryKey: ["flashcards"],
    queryFn: getAllFlashcardsSQL,
  });
};

export const useDueFlashcards = () => {
  return useQuery({
    queryKey: ["flashcards", "due"],
    queryFn: getDueFlashcardsSQL,
  });
};

export const useSaveFlashcard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveFlashcardSQL,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flashcards"] });
    },
  });
};

// PWS Project Hooks
export const usePWSProjects = () => {
  return useQuery({
    queryKey: ["pwsProjects"],
    queryFn: getAllPWSProjectsSQL,
  });
};

export const useSavePWSProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: savePWSProjectSQL,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pwsProjects"] });
    },
  });
};

export const useDeletePWSProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePWSProjectSQL,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pwsProjects"] });
    },
  });
};

// Generated Media Hooks
export const useGeneratedMedia = () => {
  return useQuery({
    queryKey: ["generatedMedia"],
    queryFn: getAllGeneratedMediaSQL,
  });
};

export const useSaveGeneratedMedia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveGeneratedMediaSQL,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["generatedMedia"] });
    },
  });
};

export const useDeleteGeneratedMedia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteGeneratedMediaSQL,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["generatedMedia"] });
    },
  });
};

// Quiz History Hooks
export const useQuizHistory = () => {
  return useQuery({
    queryKey: ["quizHistory"],
    queryFn: getAllQuizHistorySQL,
  });
};

export const useSaveQuizResult = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveQuizHistorySQL,
    onSuccess: async (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["quizHistory"] });
      // Track weak point via API (Moved from sqliteService to prevent circular dependency)
      const vars = variables as { subject: string; topic: string; score: number; total?: number };
      if (vars.subject && vars.topic) {
        try {
          const trackerModule = await import("@shared/api/ai-brain/weakPointTracker");
          const tracker = trackerModule.getWeakPointTracker();
          await tracker.trackQuizResult(
            vars.subject,
            vars.topic,
            vars.score,
            vars.total || 0,
          );
        } catch (e) {
          console.error("Failed to track weak point:", e);
        }
      }
    },
  });
};

// Saved Questions Hooks
export const useSavedQuestions = () => {
  return useQuery({
    queryKey: ["savedQuestions"],
    queryFn: getAllSavedQuestionsSQL,
  });
};

export const useSaveQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      question,
      savedAt,
    }: {
      id: string;
      question: unknown;
      savedAt: number;
    }) => saveQuestionSQL(id, question, savedAt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedQuestions"] });
    },
  });
};

export const useDeleteSavedQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSavedQuestionSQL,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedQuestions"] });
    },
  });
};
