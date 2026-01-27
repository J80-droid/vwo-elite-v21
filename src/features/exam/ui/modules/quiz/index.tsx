/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  ChatPickerModal,
  ExamTimer,
  FileUploadModal,
  LibraryPickerModal,
  QuizAnswerResult,
  QuizInputSource,
  QuizRenderer,
  QuizResults,
  StudyMaterial,
  TestLabQuestion,
} from "@features/quiz";
import { INITIAL_SUBJECTS } from "@shared/assets/data/initialSubjects";
import { useSettings } from "@shared/hooks/useSettings";
import { useQuizProgressStore } from "@shared/model/quizProgressStore";
import {
  BookOpen,
  ChevronDown,
  Library,
  Loader2,
  MessageCircle,
  Sparkles,
  Upload,
  Zap,
} from "lucide-react";
import React, { useRef, useState } from "react";

import { useExamContext } from "../../../hooks/ExamContext";

// --- TYPES & STATE ---

type ViewState = "config" | "quiz" | "results" | "progress" | "repair";

interface QuizModuleData {
  viewState: ViewState;
  topic: string;
  selectedSubjects: string[];
  inputSources: QuizInputSource[];
  questionCount: number;
  timerMode: boolean;
  timerMinutes: number;
  quizType:
    | "mixed"
    | "multiple_choice"
    | "error_spotting"
    | "ordering"
    | "fill_blank"
    | "open_question";
  shuffleQuestions: boolean;

  // Runtime
  isGenerating: boolean;
  questions: TestLabQuestion[];
  currentIndex: number;
  results: QuizAnswerResult[];
  error: string | null;
  repairQuestions: TestLabQuestion[];

  // Selection Data
  selectedLibraryMaterials: StudyMaterial[];
  selectedChatMaterials: StudyMaterial[];
  uploadedContent: string;

  // Modals
  showLibraryPicker: boolean;
  showUploadModal: boolean;
  showChatPicker: boolean;
}

const DEFAULT_QUIZ_DATA: QuizModuleData = {
  viewState: "config",
  topic: "",
  selectedSubjects: [],
  inputSources: ["curriculum"],
  questionCount: 20,
  timerMode: true,
  timerMinutes: 160,
  quizType: "mixed",
  shuffleQuestions: true,
  isGenerating: false,
  questions: [],
  currentIndex: 0,
  results: [],
  error: null,
  repairQuestions: [],
  selectedLibraryMaterials: [],
  selectedChatMaterials: [],
  uploadedContent: "",
  showLibraryPicker: false,
  showUploadModal: false,
  showChatPicker: false,
};

// Benchmark minutes per question for 6 VWO
const SUBJECT_BENCHMARKS: Record<string, number> = {
  "1": 10.2, // Wiskunde B
  "2": 7.2, // Natuurkunde
  "3": 7.4, // Scheikunde
  Biologie: 4.5, // Biologie (ID might be string name in data)
  "5": 4.7, // Nederlands
  "6": 3.75, // Engels
  "7": 3.75, // Frans
  "8": 7.8, // Filosofie
  default: 6.0,
};

const useQuizState = () => {
  const { examData, updateExamData } = useExamContext();
  const data: QuizModuleData = { ...DEFAULT_QUIZ_DATA, ...examData.quiz };

  const update = (partial: Partial<QuizModuleData>) => {
    updateExamData("quiz", partial);
  };

  // Helper to get benchmark for current subject
  const getSubjectBenchmark = (): number => {
    if (data.selectedSubjects.length === 0) return SUBJECT_BENCHMARKS.default!;
    const subjectId = data.selectedSubjects[0];
    const subject = INITIAL_SUBJECTS.find((s) => s.id === subjectId);

    // Check by ID or fallback to legacyName contains "Biologie" etc
    if (subjectId && SUBJECT_BENCHMARKS[subjectId] !== undefined)
      return SUBJECT_BENCHMARKS[subjectId]!;
    if (subject?.legacyName?.includes("Biologie"))
      return SUBJECT_BENCHMARKS.Biologie!;

    return SUBJECT_BENCHMARKS.default!;
  };

  return { data, update, getSubjectBenchmark };
};

// --- UI COMPONENTS ---
const CustomSelect: React.FC<{
  value: string;
  options: { label: string; value: string }[];
  onChange: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
}> = ({
  value,
  options,
  onChange,
  placeholder = "Select...",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel = options.find((o) => o.value === value)?.label || value;

  return (
    <div className="relative">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none transition-colors focus:border-emerald-500/50 ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-white/10"}`}
      >
        <span className={!value ? "text-slate-500" : ""}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown
          size={14}
          className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && !disabled && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-2 bg-obsidian-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
            <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
              {options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${value === opt.value ? "bg-emerald-500/20 text-emerald-300" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// --- COMPONENTS ---

// --- CONFIG COMPONENT (Unified) ---

const QuizConfigView: React.FC = () => {
  const { data, update, getSubjectBenchmark } = useQuizState();
  const { settings } = useSettings();
  const sessionIdRef = useRef<string | null>(null);

  // Generation Logic
  const handleGenerate = async () => {
    const hasContent =
      data.selectedLibraryMaterials.length > 0 ||
      !!data.uploadedContent ||
      data.selectedChatMaterials.length > 0;
    if (!data.topic.trim() && !hasContent) return;

    update({ isGenerating: true, error: null });

    try {
      const { generateQuizQuestions } = await import("@features/quiz");

      // Create Content Strings
      const libraryContent =
        data.selectedLibraryMaterials.length > 0
          ? data.selectedLibraryMaterials
              .map((m) => `## ${m.title} \n${m.content} `)
              .join("\n\n")
          : undefined;
      const chatContent =
        data.selectedChatMaterials.length > 0
          ? data.selectedChatMaterials
              .map((m) => `## ${m.title} \n${m.content} `)
              .join("\n\n")
          : undefined;

      const questions = await generateQuizQuestions({
        topic: data.topic,
        questionCount: data.questionCount,
        sources: data.inputSources,
        ...(settings.aiConfig ? { aiConfig: settings.aiConfig } : {}),
        ...(libraryContent ? { libraryContent } : {}),
        ...(data.uploadedContent
          ? { uploadedContent: data.uploadedContent }
          : {}),
        ...(chatContent ? { chatContext: chatContent } : {}),
        ...(data.quizType !== "mixed" ? { quizType: data.quizType } : {}),
        ...(data.selectedSubjects.length > 0
          ? { subjects: data.selectedSubjects }
          : {}),
      });

      const mappedQuestions = questions.map((q: Record<string, any>) => ({
        id: q.id || `q-${Math.random().toString(36).substr(2, 9)}`,
        text: q.question || q.text || "Missing text",
        type: q.type || "multiple-choice",
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        subject: "wiskunde",
        difficulty: "medium" as const,
        topic: data.topic || "General",
        tags: [],
      }));

      if (data.shuffleQuestions) {
        mappedQuestions.sort(() => Math.random() - 0.5);
      }

      update({
        questions: mappedQuestions,
        currentIndex: 0,
        results: [],
        viewState: "quiz",
        isGenerating: false,
      });
      sessionIdRef.current = `session-${Date.now()}`;
    } catch (e: unknown) {
      console.error(e);
      update({
        isGenerating: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  };

  const toggleSource = (source: QuizInputSource) => {
    let newSources = data.inputSources;
    const isAdding = !newSources.includes(source);

    if (!isAdding) {
      if (newSources.length > 1) {
        newSources = newSources.filter((s) => s !== source);
      }
      update({ inputSources: newSources });
    } else {
      newSources = [...newSources, source];
      const updates: Partial<QuizModuleData> = { inputSources: newSources };
      if (source === "library") updates.showLibraryPicker = true;
      if (source === "upload") updates.showUploadModal = true;
      if (source === "chat") updates.showChatPicker = true;
      update(updates);
    }
  };

  return (
    <>
      <div className="w-full h-full relative overflow-y-auto custom-scrollbar p-12 flex flex-col items-center animate-in fade-in duration-500">
        {/* Unified Config Machine */}
        <div className="w-full max-w-6xl bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col shrink-0">
          {/* Header & Topic Column */}
          <div className="p-10 md:p-14 border-b border-white/5 bg-gradient-to-br from-indigo-500/10 to-transparent">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-[0.2em]">
                  <Sparkles size={12} />
                  <span>AI Learning Core</span>
                </div>
                <h1 className="text-5xl font-black text-white uppercase tracking-tighter lg:text-7xl">
                  Quiz{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
                    Generator
                  </span>
                </h1>
                <p className="text-slate-400 text-lg max-w-2xl font-light leading-relaxed">
                  Configureer je sessie door een onderwerp te kiezen en je
                  bronnen te koppelen.
                </p>
              </div>

              {/* Subject Selection (Now prominent in header area) */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <div className="w-8 h-[1px] bg-slate-800" />
                  Selecteer je vakken
                </div>
                <div className="flex flex-wrap gap-2">
                  {INITIAL_SUBJECTS.map((subject) => {
                    const isSelected = data.selectedSubjects.includes(
                      subject.id,
                    );
                    const subjectThemes: Record<string, string> = {
                      blue: "bg-blue-500/20 border-blue-500 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.2)]",
                      red: "bg-rose-500/20 border-rose-500 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.2)]",
                      yellow:
                        "bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]",
                      orange:
                        "bg-orange-500/20 border-orange-500 text-orange-300 shadow-[0_0_15px_rgba(249,115,22,0.2)]",
                      purple:
                        "bg-violet-500/20 border-violet-500 text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.2)]",
                      cyan: "bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]",
                      pink: "bg-pink-500/20 border-pink-500 text-pink-300 shadow-[0_0_15px_rgba(236,72,153,0.2)]",
                      emerald:
                        "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]",
                    };
                    const activeClass =
                      subjectThemes[subject.theme] || subjectThemes.blue;

                    return (
                      <button
                        key={subject.id}
                        onClick={() => {
                          const isCurrentlySelected =
                            data.selectedSubjects.includes(subject.id);
                          // Enforce single selection as requested: fix
                          const newSubjects = isCurrentlySelected
                            ? []
                            : [subject.id];

                          // Auto-calculate timer when subject changes
                          const benchmark = getSubjectBenchmark();
                          const newMinutes = Math.round(
                            data.questionCount * benchmark,
                          );

                          update({
                            selectedSubjects: newSubjects,
                            timerMinutes: newMinutes,
                            timerMode: true,
                          });
                        }}
                        className={`px-4 py-2 rounded-xl text-[11px] font-black border transition-all duration-500 ${
                          isSelected
                            ? activeClass
                            : "bg-white/5 border-transparent text-slate-500 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {subject.legacyName}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="px-10 md:px-14 py-6 md:py-8 space-y-8">
            {/* Context Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Sources Column */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                    <Library size={20} />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">
                      Gekoppelde Data
                    </h3>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">
                      Bronnen Beheren
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    {
                      id: "curriculum",
                      label: "Landelijke Stof",
                      sub: "Curriculum",
                      icon: BookOpen,
                      color: "sky",
                    },
                    {
                      id: "library",
                      label: "Mijn Archief",
                      sub: "Bibliotheek",
                      icon: Library,
                      color: "indigo",
                    },
                    {
                      id: "chat",
                      label: "AI Geheugen",
                      sub: "Interacties",
                      icon: MessageCircle,
                      color: "fuchsia",
                    },
                    {
                      id: "upload",
                      label: "Eigen Bestanden",
                      sub: "PDF/OCR",
                      icon: Upload,
                      color: "emerald",
                    },
                  ].map((s) => {
                    const isSelected = data.inputSources.includes(
                      s.id as QuizInputSource,
                    );
                    const colorClasses = {
                      sky: "bg-sky-500/10 border-sky-500/30 text-sky-400 hover:bg-sky-500/20 shadow-[0_0_15px_rgba(14,165,233,0.1)]",
                      indigo:
                        "bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]",
                      fuchsia:
                        "bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-400 hover:bg-fuchsia-500/20 shadow-[0_0_15px_rgba(217,70,239,0.1)]",
                      emerald:
                        "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]",
                    };
                    const activeColorClasses = {
                      sky: "bg-sky-500/20 border-sky-500 text-sky-300 shadow-[0_0_40px_rgba(14,165,233,0.4)] -translate-y-1",
                      indigo:
                        "bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-[0_0_40px_rgba(99,102,241,0.4)] -translate-y-1",
                      fuchsia:
                        "bg-fuchsia-500/20 border-fuchsia-500 text-fuchsia-300 shadow-[0_0_40px_rgba(217,70,239,0.4)] -translate-y-1",
                      emerald:
                        "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_40px_rgba(16,185,129,0.4)] -translate-y-1",
                    };

                    return (
                      <button
                        key={s.id}
                        onClick={() => toggleSource(s.id as QuizInputSource)}
                        className={`group/btn relative p-6 rounded-[2rem] border flex flex-col items-center justify-center gap-3 transition-all duration-700 overflow-hidden ${
                          isSelected
                            ? activeColorClasses[
                                s.color as keyof typeof activeColorClasses
                              ]
                            : colorClasses[s.color as keyof typeof colorClasses]
                        }`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                        <s.icon
                          size={32}
                          className={`transition-all duration-700 ${isSelected ? "scale-110 drop-shadow-[0_0_10px_currentColor]" : "group-hover/btn:scale-125 opacity-40 group-hover/btn:opacity-100"}`}
                        />
                        <div className="text-center">
                          <div className="text-xs font-black uppercase tracking-[0.1em]">
                            {s.label}
                          </div>
                          <div className="text-[9px] opacity-40 font-bold uppercase tracking-widest">
                            {s.sub}
                          </div>
                        </div>
                        {isSelected && (
                          <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-white shadow-[0_0_100px_white]" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Content Indicators */}
                <div className="flex flex-wrap gap-3 pt-4">
                  {data.selectedLibraryMaterials.length > 0 && (
                    <div className="px-5 py-2.5 bg-indigo-500/20 text-indigo-300 rounded-2xl border border-indigo-500/30 text-[11px] font-black uppercase tracking-widest flex items-center gap-2 animate-in zoom-in-95 duration-500">
                      <Library size={14} />
                      {data.selectedLibraryMaterials.length} Archief Items
                    </div>
                  )}
                  {data.uploadedContent && (
                    <div className="px-5 py-2.5 bg-emerald-500/20 text-emerald-300 rounded-2xl border border-emerald-500/30 text-[11px] font-black uppercase tracking-widest flex items-center gap-2 animate-in zoom-in-95 duration-500">
                      <Upload size={14} />
                      Document Gekoppeld
                    </div>
                  )}
                </div>
              </div>

              {/* Settings Area */}
              <div className="space-y-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-400 border border-fuchsia-500/20">
                      <BookOpen size={20} />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-sm font-black text-white uppercase tracking-widest">
                        Configuratie
                      </h3>
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">
                        Onderwerp & Parameters
                      </span>
                    </div>
                  </div>

                  {/* Topic Input */}
                  <div className="group relative">
                    <input
                      type="text"
                      value={data.topic}
                      onChange={(e) => update({ topic: e.target.value })}
                      placeholder="Wat wil je vandaag leren? (Bijv. Quantummechanica)"
                      className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-5 text-lg text-white outline-none focus:border-fuchsia-500/50 transition-all shadow-inner group-hover:bg-white/[0.07] placeholder:text-slate-600"
                    />
                  </div>

                  {/* Row 1: Question Count & Timer (Swapped Type Quiz out) */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] ml-2">
                        Aantal Vragen
                      </label>
                      <div className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group-hover:border-emerald-500/20 transition-colors h-[64px]">
                        <span className="text-2xl font-black text-white">
                          {data.questionCount}
                        </span>
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => {
                              const newCount = Math.min(
                                45,
                                data.questionCount + 1,
                              );
                              const benchmark = getSubjectBenchmark();
                              update({
                                questionCount: newCount,
                                timerMinutes: Math.round(newCount * benchmark),
                              });
                            }}
                            className="hover:text-emerald-400 transition-colors"
                          >
                            <ChevronDown size={18} className="rotate-180" />
                          </button>
                          <button
                            onClick={() => {
                              const newCount = Math.max(
                                3,
                                data.questionCount - 1,
                              );
                              const benchmark = getSubjectBenchmark();
                              update({
                                questionCount: newCount,
                                timerMinutes: Math.round(newCount * benchmark),
                              });
                            }}
                            className="hover:text-emerald-400 transition-colors"
                          >
                            <ChevronDown size={18} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] ml-2">
                        Tijdslimiet (Min)
                      </label>
                      <div
                        className={`px-6 py-4 border rounded-2xl flex items-center justify-between transition-all duration-500 group h-[64px] ${data.timerMode ? "bg-amber-500/10 border-amber-500/30" : "bg-white/5 border-white/10"}`}
                      >
                        <input
                          type="number"
                          disabled={!data.timerMode}
                          value={data.timerMinutes}
                          onChange={(e) =>
                            update({ timerMinutes: Number(e.target.value) })
                          }
                          className={`w-16 bg-transparent text-2xl font-black outline-none transition-colors ${data.timerMode ? "text-amber-400" : "text-slate-600 cursor-not-allowed"}`}
                        />
                        <button
                          onClick={() => update({ timerMode: !data.timerMode })}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${data.timerMode ? "bg-amber-500/20 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]" : "bg-white/5 text-slate-600"}`}
                        >
                          <Loader2
                            size={16}
                            className={
                              data.timerMode
                                ? "animate-[spin_10s_linear_infinite]"
                                : ""
                            }
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Type Quiz (Previously where Timer was) */}
                  <div className="p-6 rounded-[2rem] border border-white/10 bg-white/5 group hover:border-violet-500/20 transition-colors">
                    <div className="flex items-center justify-between gap-6">
                      <div className="flex items-center gap-5">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 border border-violet-500/20">
                          <Zap size={20} />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs font-black text-white uppercase tracking-widest">
                            Type Beoordeling
                          </h4>
                          <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">
                            Selecteer je toetsvorm
                          </p>
                        </div>
                      </div>
                      <div className="w-48">
                        <CustomSelect
                          value={data.quizType}
                          onChange={(val) => update({ quizType: val as any })}
                          options={[
                            { value: "mixed", label: "Gemengd" },
                            { value: "multiple_choice", label: "Meerkeuze" },
                            { value: "open_question", label: "Open Vraag" },
                            {
                              value: "error_spotting",
                              label: "Error Spotting",
                            },
                            { value: "ordering", label: "Volgorde" },
                            { value: "fill_blank", label: "Invulvraag" },
                          ]}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ACTION BAR */}
          <div className="pt-6 pb-8 border-t border-white/5 flex flex-col items-center gap-8">
            <button
              onClick={handleGenerate}
              disabled={
                data.isGenerating ||
                (!data.topic && data.selectedLibraryMaterials.length === 0)
              }
              className="group relative px-20 py-8 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-2xl font-black rounded-[3rem] transition-all duration-700 shadow-[0_0_50px_rgba(16,185,129,0.2)] hover:shadow-[0_0_80px_rgba(16,185,129,0.5)] hover:bg-emerald-500/20 hover:scale-105 active:scale-95 flex items-center gap-6 disabled:opacity-20 disabled:grayscale disabled:scale-100 disabled:cursor-not-allowed overflow-hidden w-full max-w-2xl justify-center"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[1.5s] ease-in-out" />
              {data.isGenerating ? (
                <Loader2 className="animate-spin w-8 h-8" />
              ) : (
                <Sparkles
                  className={`w-8 h-8 transition-all duration-700 group-hover:rotate-12 group-hover:scale-110`}
                />
              )}
              <span className="uppercase tracking-[0.2em]">
                {data.isGenerating ? "Machine Draait..." : "Start Generatie"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {data.error && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-4 bg-rose-500/20 border border-rose-500/30 backdrop-blur-xl rounded-2xl text-rose-300 text-xs font-bold animate-in slide-in-from-bottom-4 duration-500 flex items-center gap-3 shadow-2xl">
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          Error: {data.error}
        </div>
      )}

      {/* MODALS */}
      <LibraryPickerModal
        isOpen={data.showLibraryPicker}
        onClose={() => update({ showLibraryPicker: false })}
        onSelect={(m) => update({ selectedLibraryMaterials: m })}
        materials={[
          {
            id: "lib-1",
            name: "Inleiding Differentiëren",
            type: "summary",
            subject: "Wiskunde B",
            content: "Samenvatting van hoofdstuk 1...",
            createdAt: Date.now(),
          },
          {
            id: "lib-2",
            name: "Newton's Wetten",
            type: "summary",
            subject: "Natuurkunde",
            content: "De drie wetten van Newton uitgelegd...",
            createdAt: Date.now(),
          },
          {
            id: "lib-3",
            name: "Franse Grammatica",
            type: "summary",
            subject: "Frans",
            content: "Overzicht van werkwoordstijden...",
            createdAt: Date.now(),
          },
          {
            id: "lib-4",
            name: "Chemische Bindingen",
            type: "summary",
            subject: "Scheikunde",
            content: "Ionbinding, atoombinding en metaalbinding...",
            createdAt: Date.now(),
          },
        ]}
      />
      <FileUploadModal
        isOpen={data.showUploadModal}
        onClose={() => update({ showUploadModal: false })}
        onUploadComplete={(content) =>
          update({ uploadedContent: content, showUploadModal: false })
        }
      />
      <ChatPickerModal
        isOpen={data.showChatPicker}
        onClose={() => update({ showChatPicker: false })}
        onSelect={(m) => update({ selectedChatMaterials: m })}
        materials={[
          {
            id: "chat-1",
            name: "Hulp bij Wiskunde",
            type: "chat",
            subject: "Wiskunde B",
            createdAt: Date.now() - 86400000,
            content: "Uitleg over kettingregel...",
          },
          {
            id: "chat-2",
            name: "Brainstorm PWS",
            type: "chat",
            subject: "Algemeen",
            createdAt: Date.now() - 172800000,
            content: "Ideeën voor duurzame energie...",
          },
        ]}
      />
    </>
  );
};

// --- STAGE COMPONENT (Container) ---

export const QuizStage: React.FC = () => {
  const { data, update } = useQuizState();
  const sessionIdRef = useRef<string>("");
  // const {addQuizResult} = useQuizProgressStore();

  // Quiz Handlers (for active state)
  const handleAnswer = (isCorrect: boolean, givenAnswer: any) => {
    const result: QuizAnswerResult = {
      questionId: data.questions[data.currentIndex]!.id,
      isCorrect,
      userAnswer: String(givenAnswer),
      timeSpent: 0,
    };

    const newResults = [
      ...data.results.filter((r) => r.questionId !== result.questionId),
      result,
    ];
    update({ results: newResults });
  };

  const handleNext = () => {
    if (data.currentIndex < data.questions.length - 1) {
      update({ currentIndex: data.currentIndex + 1 });
    } else {
      // Save results using SESSION ID logic if implemented
      // For now just swich view
      update({ viewState: "results" });
    }
  };

  // Save results when entering "results" view
  React.useEffect(() => {
    if (
      data.viewState === "results" &&
      !sessionIdRef.current?.includes("saved")
    ) {
      const { addQuizResult } = useQuizProgressStore.getState();

      const session = {
        id: sessionIdRef.current || `session-${Date.now()}`,
        questions: data.questions,
        currentIndex: data.questions.length,
        answers: data.results.reduce(
          (acc, r) => ({ ...acc, [r.questionId]: r.userAnswer }),
          {},
        ),
        startTime: Date.now() - 1000 * 60 * 20, // Approx (not tracked strictly yet)
        isFinished: true,
        subject:
          data.selectedSubjects.length > 0
            ? ({
                id: data.selectedSubjects[0],
                name: "Subject",
                theme: "blue",
                legacyName: "Subject",
              } as any)
            : ({
                id: "general",
                name: "Algemeen",
                theme: "blue",
                legacyName: "Algemeen",
              } as any),
        config: {
          mode: "practice" as const,
          timeLimit: data.timerMode ? data.timerMinutes : undefined,
        },
      };

      addQuizResult(session, data.results);
      sessionIdRef.current += "-saved";
    }
  }, [
    data.viewState,
    data.questions,
    data.results,
    data.selectedSubjects,
    data.timerMode,
    data.timerMinutes,
  ]);

  // RENDER BASED ON VIEW STATE
  if (data.viewState === "config") {
    return <QuizConfigView />;
  }

  if (data.viewState === "quiz" && data.questions.length > 0) {
    const currentQ = data.questions[data.currentIndex]!;
    const hasAnswered = data.results.some((r) => r.questionId === currentQ.id);

    return (
      <div className="w-full h-full p-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-8 pb-32">
          {data.timerMode && (
            <div className="fixed top-20 right-8 z-50">
              <ExamTimer
                minutes={data.timerMinutes}
                isActive={true}
                onTimeUp={() => {
                  // Auto submit remaining logic
                  update({ viewState: "results" });
                }}
              />
            </div>
          )}

          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <button
              onClick={() =>
                update({ viewState: "config", questions: [], results: [] })
              }
              className="hover:text-white transition-colors"
            >
              &larr; Stop & Exit
            </button>
            <span>
              {data.currentIndex + 1} / {data.questions.length}
            </span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
            <QuizRenderer question={currentQ} onAnswer={handleAnswer} />
          </div>

          {hasAnswered && (
            <div className="flex justify-end">
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/50 font-bold rounded-xl transition hover:bg-emerald-500/20"
              >
                {data.currentIndex < data.questions.length - 1
                  ? "Next Question"
                  : "Finish Quiz"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (data.viewState === "results") {
    return (
      <QuizResults
        questions={data.questions}
        results={data.results}
        topic={data.topic}
        onRetry={() =>
          update({ viewState: "config", questions: [], results: [] })
        }
      />
    );
  }

  return null;
};
