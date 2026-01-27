/* eslint-disable react-hooks/set-state-in-effect */
import {
  analyzePerformance,
  PerformanceAnalysis,
} from "@shared/api/didacticEngine";
import { generateCrashCourse } from "@shared/api/microLearningService";
import { useSettings } from "@shared/hooks/useSettings";
import { usePlannerEliteStore } from "@shared/model/plannerStore";
import {
  AlertTriangle,
  BrainCircuit,
  Calendar,
  Check,
  RefreshCw,
  Trophy,
  Video,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";

import { QuizAnswerResult, TestLabQuestion } from "../types";

interface QuizResultsProps {
  questions: TestLabQuestion[];
  results: QuizAnswerResult[];
  topic?: string; // Added: topic for crash course and video lab
  onRetry: () => void;
  onStartRepair?: (() => void) | undefined;
  isRepairSession?: boolean;
}

export const QuizResults: React.FC<QuizResultsProps> = ({
  questions,
  results,
  topic,
  onRetry,
  onStartRepair,
  isRepairSession,
}) => {
  const navigate = useNavigate();

  // Calculate basic score
  const incorrectCount = results.filter((r) => !r.isCorrect).length;
  const correctCount = results.length - incorrectCount;
  const score = results.length > 0 ? (correctCount / results.length) * 10 : 0;

  // Didactic Analysis State
  const [analysis, setAnalysis] = useState<PerformanceAnalysis | null>(null);
  const [crashCourse, setCrashCourse] = useState<string | null>(null);
  const [isGeneratingCC, setIsGeneratingCC] = useState(false);
  const { settings } = useSettings();

  // Run Analysis on Mount
  useEffect(() => {
    if (questions.length > 0 && results.length > 0) {
      const result = analyzePerformance(results, questions);
      setAnalysis(result);
    }
  }, [questions, results]);

  const handleGenerateCrashCourse = async () => {
    if (!analysis || isGeneratingCC) return;

    setIsGeneratingCC(true);
    // Find weak topics/types
    const weakPoints = [];
    if (analysis.factScore < 60) weakPoints.push("Feitenkennis");
    if (analysis.applicationScore < 60) weakPoints.push("Toepassing");

    const content = await generateCrashCourse(
      topic || "Huidig Onderwerp", // Use passed topic or fallback
      weakPoints.length > 0 ? weakPoints : ["Algemene verbetering"],
      settings.aiConfig,
    );

    setCrashCourse(content);
    setIsGeneratingCC(false);
  };

  const [showPlanningModal, setShowPlanningModal] = useState(false);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [weakAreas, setWeakAreas] = useState<
    { id: string; label: string; score: number }[]
  >([]);

  useEffect(() => {
    if (analysis) {
      const areas = [
        {
          id: "facts",
          label: "Feitenkennis & Begrippen",
          score: analysis.factScore,
        },
        {
          id: "application",
          label: "Toepassing & Inzicht",
          score: analysis.applicationScore,
        },
      ];
      // Filter only relevant areas or keep all but mark recommended?
      // For now, let's keep both basic categories
      setWeakAreas(areas);

      // Auto-select weak ones (< 6.0)
      const recommendations = areas
        .filter((a) => a.score < 60)
        .map((a) => a.id);
      if (recommendations.length > 0) {
        setSelectedAreas(recommendations);
      } else {
        setSelectedAreas(["application"]); // Default to application if all good
      }
    }
  }, [analysis]);

  const handleOpenPlanner = () => {
    setShowPlanningModal(true);
  };

  const handleConfirmSchedule = () => {
    const addTask = usePlannerEliteStore.getState().addTask;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    selectedAreas.forEach((areaId) => {
      const area = weakAreas.find((a) => a.id === areaId);
      if (!area) return;

      // Stagger times: 1st task at 14:00, 2nd at 16:00
      // (Simplified date logic for now)
      const dateStr = tomorrow.toISOString().split("T")[0] || "";

      addTask({
        id: crypto.randomUUID(),
        title: `Herstel: ${topic || "Quiz"} - ${area.label}`,
        description: `Gerichte oefensessie voor ${area.label} (Score: ${area.score.toFixed(0)}%)`,
        date: dateStr,
        duration: 45,
        type: "repair",
        priority: area.score < 55 ? "high" : "medium",
        energyRequirement: "medium",
        completed: false,
        status: "todo",
        isFixed: false,
        isAllDay: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: "ai",
      });
    });

    // Optional: Visual feedback could be added here (toast)
    // alert("Oefensessies ingepland voor morgen!");
    setShowPlanningModal(false);
  };

  // --- RENDER HELPERS ---
  const renderPlanningModal = () => {
    if (!showPlanningModal) return null;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div
          className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-8 space-y-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-white">
                  Plan Herstelsessies
                </h3>
                <p className="text-gray-400 text-sm">
                  Selecteer de gebieden waar je extra aandacht aan wilt
                  besteden.
                </p>
              </div>
              <button
                onClick={() => setShowPlanningModal(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-3">
              {weakAreas.map((area) => {
                const isSelected = selectedAreas.includes(area.id);
                const isWeak = area.score < 60;

                return (
                  <div
                    key={area.id}
                    onClick={() => {
                      if (isSelected)
                        setSelectedAreas((prev) =>
                          prev.filter((id) => id !== area.id),
                        );
                      else setSelectedAreas((prev) => [...prev, area.id]);
                    }}
                    className={`group cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 flex items-center justify-between ${
                      isSelected
                        ? "bg-blue-500/10 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                        : "bg-white/5 border-transparent hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
                          isSelected
                            ? "bg-blue-500 border-blue-500"
                            : "border-gray-600 group-hover:border-gray-400"
                        }`}
                      >
                        {isSelected && (
                          <Check size={14} className="text-white" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-white text-base">
                          {area.label}
                        </div>
                        <div
                          className={`text-xs font-mono mt-1 ${
                            isWeak ? "text-rose-400" : "text-emerald-400"
                          }`}
                        >
                          Score: {area.score.toFixed(0)}%
                        </div>
                      </div>
                    </div>
                    {isWeak && (
                      <div className="px-3 py-1 bg-rose-500/20 text-rose-300 text-[10px] font-bold uppercase tracking-wider rounded-full border border-rose-500/20">
                        Advies
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-4 flex gap-3">
              <button
                onClick={() => setShowPlanningModal(false)}
                className="flex-1 py-4 rounded-xl font-bold text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleConfirmSchedule}
                disabled={selectedAreas.length === 0}
                className="flex-[2] py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                <Calendar size={18} />
                Inplannen ({selectedAreas.length})
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in p-4 pb-20">
      {/* Header Section */}
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          {isRepairSession
            ? score === 10
              ? "Volledig Hersteld!"
              : score >= 5.5
                ? "Goed Herpakt"
                : "Blijf Oefenen"
            : score >= 8
              ? "Missie Geslaagd"
              : score >= 5.5
                ? "Voldoende"
                : "Training Vereist"}
        </h2>
        <div className="inline-flex items-center justify-center p-4 bg-gray-800 rounded-2xl border-2 border-gray-700 shadow-xl">
          <span
            className={`text-5xl font-black ${
              score >= 8
                ? "text-emerald-400"
                : score >= 5.5
                  ? "text-amber-400"
                  : "text-red-400"
            }`}
          >
            {score.toFixed(1)}
          </span>
        </div>
      </div>

      {/* 1. ELITE DIDACTIC DASHBOARD */}
      {analysis && (
        <div
          className={`p-6 rounded-2xl border relative overflow-hidden ${analysis.score >= 5.5 ? "bg-gray-900 border-gray-700" : "bg-red-900/10 border-red-500/30"}`}
        >
          {/* Background Glow */}
          <div
            className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-b ${analysis.score >= 5.5 ? "from-emerald-500/5" : "from-red-500/5"} to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2`}
          />

          <div className="flex items-start gap-5 relative z-10">
            {/* Diagnosis Icon */}
            <div
              className={`p-3 rounded-xl flex-shrink-0 ${analysis.score >= 5.5 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}
            >
              {analysis.score >= 8 ? (
                <Trophy className="w-8 h-8" />
              ) : analysis.score >= 5.5 ? (
                <BrainCircuit className="w-8 h-8" />
              ) : (
                <AlertTriangle className="w-8 h-8" />
              )}
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  {analysis.score < 5.5
                    ? "⚠️ Analyse: Basiskennis vs Toepassing"
                    : "Resultaat Analyse"}
                </h3>
                <p className="text-gray-300 mt-1 leading-relaxed">
                  {analysis.diagnosis}
                </p>
              </div>

              {/* Strategy Tags */}
              {analysis.strategy === "application_focus" && (
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-xs font-bold border border-red-500/30 flex items-center gap-2">
                    <AlertTriangle size={12} />
                    MCQ Tijdelijk Geblokkeerd (3 dagen)
                  </span>
                  <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30">
                    Focus: Casus Training
                  </span>
                </div>
              )}

              {/* Score Breakdown */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/50">
                  <div className="text-xs text-gray-400 mb-1">
                    Parate Kennis
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-500"
                      style={{ width: `${analysis.factScore}%` }}
                    />
                  </div>
                  <div className="text-right text-xs text-sky-400 mt-1 font-mono">
                    {analysis.factScore.toFixed(0)}%
                  </div>
                </div>
                <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/50">
                  <div className="text-xs text-gray-400 mb-1">
                    Toepassing & Inzicht
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500"
                      style={{ width: `${analysis.applicationScore}%` }}
                    />
                  </div>
                  <div className="text-right text-xs text-purple-400 mt-1 font-mono">
                    {analysis.applicationScore.toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. ACTION GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* REPAIR BUTTON (Primary Action if mistakes exist) */}
        {incorrectCount > 0 && onStartRepair && (
          <button
            onClick={onStartRepair}
            className="group p-5 bg-amber-900/20 hover:bg-amber-900/30 border border-amber-500/30 rounded-2xl text-left transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-amber-900/10"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-amber-500/20 rounded-xl group-hover:rotate-12 transition-transform">
                <Wrench className="w-6 h-6 text-amber-500" />
              </div>
              <span className="font-bold text-amber-100 text-lg">
                Mistake Repair
              </span>
            </div>
            <p className="text-sm text-amber-400/70">
              Train je {incorrectCount} fouten opnieuw met{" "}
              <strong>Scaffolding</strong> & <strong>Reflection</strong>.
            </p>
          </button>
        )}

        {/* CRASH COURSE (Micro-Learning) */}
        <button
          onClick={handleGenerateCrashCourse}
          disabled={isGeneratingCC}
          className="group p-5 bg-emerald-900/20 hover:bg-emerald-900/30 border border-emerald-500/30 rounded-2xl text-left transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-900/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-emerald-500/20 rounded-xl group-hover:rotate-12 transition-transform">
              <Zap className="w-6 h-6 text-emerald-500" />
            </div>
            <span className="font-bold text-emerald-100 text-lg">
              {isGeneratingCC ? "Genereren..." : "Genereer Crash Course"}
            </span>
          </div>
          <p className="text-sm text-emerald-400/70">
            Maak direct een <strong>Stappenplan</strong> of{" "}
            <strong>Tijdlijn</strong> van 3 minuten.
          </p>
        </button>

        {/* PLAN PRACTICE SESSION */}
        <button
          onClick={handleOpenPlanner}
          className="group p-5 bg-blue-900/20 hover:bg-blue-900/30 border border-blue-500/30 rounded-2xl text-left transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-900/10"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-blue-500/20 rounded-xl group-hover:rotate-12 transition-transform">
              <Calendar className="w-6 h-6 text-blue-500" />
            </div>
            <span className="font-bold text-blue-100 text-lg">
              Inplannen in Agenda
            </span>
          </div>
          <p className="text-sm text-blue-400/70">
            Plan automatisch een <strong>Oefensessie</strong> van 45 min voor
            morgen.
          </p>
        </button>

        {/* VIDEO LAB LINK */}
        <button
          onClick={() =>
            navigate("/videolab", { state: { searchQuery: topic } })
          }
          className="group p-5 bg-indigo-900/20 hover:bg-indigo-900/30 border border-indigo-500/30 rounded-2xl text-left transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-900/10 md:col-span-2"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-indigo-500/20 rounded-xl group-hover:rotate-12 transition-transform">
              <Video className="w-6 h-6 text-indigo-500" />
            </div>
            <span className="font-bold text-indigo-100 text-lg">
              Visualiseer in Video Lab
            </span>
          </div>
          <p className="text-sm text-indigo-400/70">
            Moeite met processen? Bekijk een AI-gecureerde video over dit
            onderwerp.
          </p>
        </button>
      </div>

      {/* CRASH COURSE DISPLAY */}
      {crashCourse && (
        <div className="mt-8 p-6 bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-emerald-500/30 animate-in slide-in-from-bottom-4 fade-in duration-500 shadow-2xl">
          <div className="flex items-center gap-2 mb-6 border-b border-gray-700 pb-4">
            <Zap className="w-5 h-5 text-emerald-400" />
            <h3 className="text-emerald-400 font-bold uppercase tracking-widest text-sm">
              Jouw Persoonlijke Samenvatting
            </h3>
          </div>
          <div className="prose prose-invert prose-emerald max-w-none prose-headings:text-white prose-p:text-gray-300 prose-li:text-gray-300">
            <ReactMarkdown>{crashCourse}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Standard Retry / Overview Buttons */}
      <div className="flex justify-center pt-8 border-t border-gray-800">
        <button
          onClick={onRetry}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors py-2 px-4 rounded-lg hover:bg-gray-800"
        >
          <RefreshCw className="w-5 h-5" />
          Opnieuw Testen (Reset)
        </button>
      </div>

      {renderPlanningModal()}
    </div>
  );
};
