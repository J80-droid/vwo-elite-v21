
/* eslint-disable @typescript-eslint/no-explicit-any */
import { GapModal } from "@features/lesson/modals/GapModal";
import { MainGeneratorView } from "@features/lesson/views/MainGeneratorView";
import { INITIAL_SUBJECTS } from "@shared/assets/data/initialSubjects";
import { LessonProvider } from "@shared/hooks/lesson/LessonGeneratorContext";
import { useLessonGeneratorUI } from "@shared/hooks/lesson/useLessonGeneratorUI";
import { useGapAnalysis } from "@shared/hooks/useGapAnalysis";
import { useLessonGenerator } from "@shared/hooks/useLessonGenerator";
import { useLessonProgressStore } from "@shared/model/lessonProgressStore";
import { DidacticConfig, UploadedMaterial } from "@shared/types/index";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";

export const LessonGenerator: React.FC = () => {
  const { subject: rawSubject = "" } = useParams<{ subject: string }>();
  const navigate = useNavigate();

  // Normalize Subject
  const subjectData = INITIAL_SUBJECTS.find(
    (s) => s.id === rawSubject || s.legacyName === rawSubject || s.name === rawSubject,
  );
  const subject = subjectData?.legacyName || rawSubject;

  // Safety Check
  React.useEffect(() => {
    if (!rawSubject) navigate("/dashboard", { replace: true });
  }, [rawSubject, navigate]);

  // 1. Data & Actions
  const lessonData = useLessonGenerator({ subject });

  // 2. UI State
  const ui = useLessonGeneratorUI();

  // 3. Logic Extraction
  const safeMaterials = React.useMemo(() => {
    const isUploadedMaterial = (m: any): m is UploadedMaterial => {
      return m && typeof m.id === "string" && (typeof m.content === "string" || m.content instanceof Blob);
    };
    return (lessonData.materials || []).filter(isUploadedMaterial);
  }, [lessonData.materials]);

  const { runAnalysis } = useGapAnalysis(
    subject,
    safeMaterials,
    lessonData.selectedMaterials,
  );

  const { getSubjectMastery, getWeakestTopics } = useLessonProgressStore();
  const mastery = getSubjectMastery(subject);
  const weakTopics = getWeakestTopics(subject);

  // --- Handlers ---

  const performGapAnalysis = () => {
    const gaps = runAnalysis();
    if (gaps.length > 0) {
      ui.setMissingConcepts(gaps);
      ui.setShowGapModal(true);
      return false;
    }
    return true;
  };

  const onGenerateClick = async (config?: Partial<DidacticConfig>, intent?: any, sourceCheck?: any) => {
    if (lessonData.selectedMaterials.size === 0) return;

    const isComplete = performGapAnalysis();
    if (isComplete) {
      // Configuration is passed directly from LearningCockpit
      if (config) {
        try {
          await lessonData.handleGenerateLesson(config as DidacticConfig, intent, sourceCheck);
        } catch {
          // Error handled in hook state
        }
      }
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      lessonData.reorderMaterials(active.id as string, over.id as string);
    }
  };


  // 3. Main Generator View
  return (
    <LessonProvider value={lessonData}>
      <MainGeneratorView
        data={lessonData}
        ui={ui}
        metrics={{ mastery, weakTopics }}
        onGenerateClick={onGenerateClick}
        onDragEnd={handleDragEnd}
      />

      <GapModal
        isOpen={ui.showGapModal}
        onClose={() => ui.setShowGapModal(false)}
        missingConcepts={ui.missingConcepts}
        onConfirm={() => {
          ui.setShowGapModal(false);
          // With intent modal gone, we might want to trigger generation here 
          // but we don't have the cockpit config. 
          // User will just see the gaps and then can click normally.
        }}
      />
    </LessonProvider>
  );
};
