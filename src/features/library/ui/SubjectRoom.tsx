import { KnowledgeStage as KnowledgeGraph } from "@features/brainstorm";
import { INITIAL_SUBJECTS } from "@shared/assets/data/initialSubjects";
import { LessonProvider } from "@shared/hooks/lesson/LessonGeneratorContext";
import { useCelebration } from "@shared/hooks/useCelebration";
import { useLessonGenerator } from "@shared/hooks/useLessonGenerator";
import { useTranslations } from "@shared/hooks/useTranslations";
import { useLessonProgressStore } from "@shared/model/lessonProgressStore";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Loader2,
  Mic,
  Target,
  X,
} from "lucide-react";
import React, { useMemo } from "react";

import { useContentManager } from "../hooks/useContentManager";
import { useSubjectActions } from "../hooks/useSubjectActions";
import { useSubjectRoomState } from "../hooks/useSubjectRoomState";
import { SUBJECT_THEME_CONFIG } from "../types/library.types";
import { LessonViewerOverlay } from "./components/LessonViewerOverlay";
import { SubjectHeader } from "./components/SubjectHeader";
import { SubjectMetrics } from "./components/SubjectMetrics";
import { SubjectModals } from "./components/SubjectModals";
import { LiteratureList } from "./tabs/LiteratureList";
import { MondelingSimulator } from "./tabs/MondelingSimulator";
import { SkillsTracker } from "./tabs/SkillsTracker";
import { StepSolver } from "./tabs/StepSolver";
import { SubjectOverviewTab } from "./tabs/SubjectOverviewTab";

interface SubjectRoomProps {
  subjectId: string;
  onBack: () => void;
}

export const SubjectRoom: React.FC<SubjectRoomProps> = ({
  subjectId,
  onBack,
}) => {
  const { t, lang } = useTranslations();
  const { celebrate } = useCelebration();
  const { getSubjectMastery, getWeakestTopics } = useLessonProgressStore();

  // 1. Core Data Logic
  const subjects = INITIAL_SUBJECTS;
  const subjectData = subjects.find(
    (s) => s.id === subjectId || s.legacyName === subjectId || s.name === subjectId,
  );
  const storeSubjectName = subjectData?.legacyName || "Unknown";
  const themeKey = (subjectData?.theme as string) || "default";
  const theme = SUBJECT_THEME_CONFIG[themeKey] || SUBJECT_THEME_CONFIG["default"]!;
  const subjectName = subjectData ? t(((subjectData as unknown) as { name: string }).name || "") : "Onbekend Vak";

  // 2. State & Managers
  const ui = useSubjectRoomState();
  const lessonData = useLessonGenerator({ subject: storeSubjectName });
  const contentManager = useContentManager({
    subject: storeSubjectName,
    setError: (err) => console.error(err),
    refetchMaterials: () => { },
  });

  // 3. Actions Controller (The modularized logic)
  const {
    fileInputRef,
    folderInputRef,
    zipInputRef,
    handleDockAction,
    handleModalSubmit,
    handleStartModule
  } = useSubjectActions({
    ui,
    lessonData,
    contentManager,
    storeSubjectName,
  });

  // 4. Memoized Filters & Metrics
  const filteredMaterials = useMemo(() => {
    return lessonData.materials.filter(
      (m) =>
        (m.name || "").toLowerCase().includes(ui.searchQuery.toLowerCase()) ||
        (m.type || "").toLowerCase().includes(ui.searchQuery.toLowerCase()),
    );
  }, [lessonData.materials, ui.searchQuery]);

  const subjectLessons = useMemo(() => {
    return lessonData.savedLessons.filter((l) => l.subject === storeSubjectName);
  }, [lessonData.savedLessons, storeSubjectName]);

  const filteredLessons = useMemo(() => {
    return subjectLessons.filter(
      (l) =>
        l.title.toLowerCase().includes(ui.lessonSearchQuery.toLowerCase()) ||
        (l.summary || "").toLowerCase().includes(ui.lessonSearchQuery.toLowerCase()),
    );
  }, [subjectLessons, ui.lessonSearchQuery]);

  const masteryValue = useMemo(() => getSubjectMastery(storeSubjectName), [getSubjectMastery, storeSubjectName]);
  const weakTopicsValue = useMemo(() => getWeakestTopics(storeSubjectName), [getWeakestTopics, storeSubjectName]);

  const canStart = (lessonData.materials.length > 0 && lessonData.selectedMaterials.size > 0) || ui.topic.length > 0;
  const isLanguageSubject = ["Nederlands", "Engels", "Frans", "Duits"].includes(storeSubjectName);
  const isExactSubject = ["Wiskunde B", "Wiskunde A", "Natuurkunde", "Scheikunde", "Biologie"].includes(storeSubjectName);

  return (
    <LessonProvider value={lessonData}>
      <div className="h-full flex flex-col relative bg-[#02040a] overflow-hidden">
        {/* BACKGROUND AMBIANCE */}
        <div className={`fixed -top-20 -right-20 w-[600px] h-[600px] ${theme.bg.replace("/5", "/10")} opacity-5 blur-[150px] rounded-full pointer-events-none`} />
        <div className="fixed -bottom-40 -left-40 w-[600px] h-[600px] bg-blue-500/5 blur-[150px] rounded-full pointer-events-none" />

        {/* MODALS MANAGER */}
        <SubjectModals
          ui={ui}
          theme={theme}
          actions={{
            handleDockAction,
            handleModalSubmit,
            handleStartModule,
            handleDeleteMaterial: lessonData.handleDeleteMaterial,
            handleFileUpload: lessonData.handleFileUpload,
            confirmDeleteLesson: lessonData.confirmDeleteLesson,
            setLessonToDelete: lessonData.setLessonToDelete
          }}
          data={{
            materials: lessonData.materials,
            selectedMaterials: lessonData.selectedMaterials,
            toggleSelection: lessonData.toggleSelection,
            storeSubjectName,
            lessonToDelete: lessonData.lessonToDelete,
            loading: lessonData.loading,
            progress: lessonData.progress,
            progressStatus: lessonData.progressStatus,
            canStart
          }}
        />

        {/* HIDDEN INPUTS */}
        <input type="file" multiple ref={fileInputRef} className="hidden" onChange={lessonData.handleFileUpload} />
        <input
          type="file"
          multiple
          // @ts-expect-error - webkitdirectory is non-standard
          webkitdirectory=""
          ref={folderInputRef}
          className="hidden"
          onChange={(e) => {
            const files = e.target.files;
            if (files) contentManager.handleUpload(Array.from(files)).then(() => celebrate());
          }}
        />
        <input
          type="file"
          accept=".zip"
          ref={zipInputRef}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) contentManager.handleZipUpload(file).then(() => celebrate());
          }}
        />

        {/* LOADING INDICATOR */}
        <AnimatePresence>
          {lessonData.loading && lessonData.progress > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              className="mb-8 z-20"
            >
              <div className="bg-obsidian-900/60 border border-white/10 rounded-[2rem] p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                <div className="absolute inset-x-0 bottom-0 h-1 bg-white/5">
                  <motion.div
                    className={`h-full ${theme.bg} shadow-[0_0_20px_white]`}
                    initial={{ width: 0 }}
                    animate={{ width: `${lessonData.progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                      <Loader2 className="text-white animate-spin" size={24} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-wider">{lessonData.progressStatus || "Bezig met verwerken..."}</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Jouw materiaal wordt geanalyseerd</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-white tabular-nums">{Math.round(lessonData.progress)}%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <SubjectHeader
          subjectName={subjectName}
          onBack={onBack}
          themeKey={themeKey}
          storeSubjectName={storeSubjectName}
        />

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 pt-8 space-y-8">
          <SubjectMetrics
            themeKey={themeKey}
            masteryValue={masteryValue}
            weakTopicsValue={weakTopicsValue}
          />

          {/* TABS NAVIGATION */}
          <div className="flex items-center gap-8 mb-8 border-b border-white/5 relative z-10 px-2 overflow-x-auto custom-scrollbar">
            {(["overview", "literature", "skills", "mondeling", "solver"] as const).map((tabId) => {
              if (tabId === "mondeling" && !isLanguageSubject) return null;
              if (tabId === "solver" && !isExactSubject) return null;
              const isActive = ui.activeTab === tabId;
              return (
                <button
                  key={tabId}
                  onClick={() => ui.setActiveTab(tabId)}
                  className={`pb-4 text-xs font-black uppercase tracking-[0.2em] transition-all relative whitespace-nowrap flex items-center gap-2 ${isActive ? "text-white" : "text-slate-500 hover:text-slate-300"}`}
                >
                  {tabId === "mondeling" && <Mic size={14} />}
                  {tabId === "solver" && <Target size={14} />}
                  {t(`library.tabs.${tabId}`)}
                  {isActive && <div className={`absolute bottom-0 left-0 right-0 h-1 ${theme.bg} rounded-full animate-in slide-in-from-bottom-2 duration-300 shadow-[0_0_10px_currentColor]`} />}
                </button>
              );
            })}
          </div>

          {/* TABS CONTENT */}
          <div className="relative z-10">
            {ui.activeTab === "overview" && (
              <SubjectOverviewTab
                subjectName={subjectName}
                theme={theme}
                ui={ui}
                filteredMaterials={filteredMaterials}
                filteredLessons={filteredLessons}
                masteryValue={masteryValue}
                handleDeleteMaterial={lessonData.handleDeleteMaterial}
                setExpandedLessonId={lessonData.setExpandedLessonId}
              />
            )}
            {ui.activeTab === "literature" && (
              <div className="h-[600px]"><LiteratureList subjectName={subjectName} themeKey={themeKey} /></div>
            )}
            {ui.activeTab === "skills" && (
              <div className="h-[600px]"><SkillsTracker subjectName={subjectName} themeKey={themeKey} /></div>
            )}
            {ui.activeTab === "mondeling" && (
              <div className="h-[700px]"><MondelingSimulator subjectName={subjectName} themeKey={themeKey} /></div>
            )}
            {ui.activeTab === "solver" && (
              <div className="h-[700px]"><StepSolver subjectName={subjectName} themeKey={themeKey} /></div>
            )}
          </div>
        </div>

        {/* ERROR TOAST */}
        {lessonData.error && (
          <div className="fixed bottom-10 left-10 max-w-md z-[100] bg-rose-500/10 border border-rose-500/50 backdrop-blur-xl rounded-2xl p-6 flex items-start gap-4 animate-in slide-in-from-left-8 shadow-3xl group">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center shrink-0"><AlertTriangle size={24} className="text-rose-500" /></div>
            <div className="flex-1">
              <div className="text-sm font-black text-white uppercase tracking-tight mb-1">Neurale Storing</div>
              <p className="text-xs text-rose-200 font-medium leading-relaxed">{lessonData.error}</p>
            </div>
            <button onClick={lessonData.clearError} className="p-1 text-slate-500 hover:text-white transition-all"><X size={18} /></button>
          </div>
        )}

        {/* GRAPH OVERLAY */}
        <KnowledgeGraph isOpen={ui.isGraphOpen} onClose={() => { ui.setIsGraphOpen(false); ui.setActiveGraphNodeId(undefined); }} highlightNodeId={ui.activeGraphNodeId || ""} />

        {/* LESSON VIEWER OVERLAY */}
        <LessonViewerOverlay
          lessonData={lessonData}
          subjectLessons={subjectLessons}
          ui={ui}
          theme={theme}
          lang={lang}
        />

        {/* IMAGE PREVIEW OVERLAY */}
        {ui.selectedImage && (
          <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-10 animate-in fade-in" onClick={() => ui.setSelectedImage(null)}>
            <button className="absolute top-10 right-10 p-4 bg-white/10 rounded-2xl text-white"><X size={24} /></button>
            <img src={ui.selectedImage} alt="Preview" className="max-w-full max-h-full rounded-2xl shadow-3xl border border-white/10 animate-in zoom-in" />
          </div>
        )}
      </div>
    </LessonProvider>
  );
};
