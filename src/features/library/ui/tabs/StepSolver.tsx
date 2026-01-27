/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Step Solver Component
 * AI-powered step-by-step problem solver for exact sciences
 */

import {
  checkSolution,
  getHint,
  solveProblemFromImage,
  solveProblemStepByStep,
  StepSolution,
} from "@shared/api/stepSolverService";
import { useSettings } from "@shared/hooks/useSettings";
import {
  AlertTriangle,
  Calculator,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Lightbulb,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import React, { useCallback, useRef, useState } from "react";

import { SUBJECT_THEME_CONFIG } from "../../types/library.types";

interface StepSolverProps {
  subjectName: string;
  themeKey: string;
}

type SolverMode = "input" | "solving" | "result" | "check";

export const StepSolver: React.FC<StepSolverProps> = ({
  subjectName,
  themeKey,
}) => {
  const theme = SUBJECT_THEME_CONFIG[themeKey] ??
    SUBJECT_THEME_CONFIG.default ?? {
      bg: "bg-slate-500/20",
      text: "text-slate-400",
      border: "border-slate-500/30",
    };
  const { settings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [mode, setMode] = useState<SolverMode>("input");
  const [problemText, setProblemText] = useState("");
  const [showAnswers, setShowAnswers] = useState(false); // Hint-only mode by default
  const [solution, setSolution] = useState<StepSolution | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([0]));
  const [isLoading, setIsLoading] = useState(false);
  const [currentHint, setCurrentHint] = useState<{
    step: number;
    text: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check mode state
  const [studentSolution, setStudentSolution] = useState("");
  const [checkResult, setCheckResult] = useState<any>(null);

  // Solve problem
  const solve = useCallback(async () => {
    if (!problemText.trim()) return;
    setIsLoading(true);
    setError(null);
    setMode("solving");

    try {
      const result = await solveProblemStepByStep(
        problemText,
        subjectName,
        showAnswers,
        settings?.aiConfig,
      );
      setSolution(result);
      setExpandedSteps(new Set([0]));
      setMode("result");
    } catch (err: any) {
      setError(err.message || "Kon het probleem niet oplossen");
      setMode("input");
    } finally {
      setIsLoading(false);
    }
  }, [problemText, subjectName, showAnswers, settings]);

  // Solve from image
  const solveFromImage = useCallback(
    async (file: File) => {
      setIsLoading(true);
      setError(null);
      setMode("solving");

      try {
        // Convert to base64
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64 = (e.target?.result as string)?.split(",")[1];
          if (!base64) throw new Error("Kon afbeelding niet laden");

          const result = await solveProblemFromImage(
            base64,
            subjectName,
            showAnswers,
            settings?.aiConfig,
          );
          setSolution(result);
          setProblemText(result.problem);
          setExpandedSteps(new Set([0]));
          setMode("result");
          setIsLoading(false);
        };
        reader.onerror = () => {
          throw new Error("Kon afbeelding niet lezen");
        };
        reader.readAsDataURL(file);
      } catch (err: any) {
        setError(err.message || "Kon de afbeelding niet verwerken");
        setMode("input");
        setIsLoading(false);
      }
    },
    [subjectName, showAnswers, settings],
  );

  // Get hint for step
  const requestHint = useCallback(
    async (stepNumber: number) => {
      if (!solution) return;
      setIsLoading(true);

      try {
        const hint = await getHint(
          solution.problem,
          stepNumber,
          subjectName,
          settings?.aiConfig,
        );
        setCurrentHint({ step: stepNumber, text: hint });
      } catch (err) {
        console.error("Failed to get hint:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [solution, subjectName, settings],
  );

  // Check student solution
  const checkStudentSolution = useCallback(async () => {
    if (!solution || !studentSolution.trim()) return;
    setIsLoading(true);

    try {
      const result = await checkSolution(
        solution.problem,
        studentSolution,
        subjectName,
        settings?.aiConfig,
      );
      setCheckResult(result);
    } catch (err) {
      console.error("Failed to check solution:", err);
    } finally {
      setIsLoading(false);
    }
  }, [solution, studentSolution, subjectName, settings]);

  // Toggle step expansion
  const toggleStep = useCallback((stepNumber: number) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepNumber)) {
        next.delete(stepNumber);
      } else {
        next.add(stepNumber);
      }
      return next;
    });
  }, []);

  // Reset
  const reset = useCallback(() => {
    setMode("input");
    setProblemText("");
    setSolution(null);
    setCurrentHint(null);
    setError(null);
    setStudentSolution("");
    setCheckResult(null);
  }, []);

  // Handle file input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) solveFromImage(file);
    e.target.value = "";
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${theme.bg}`}>
            <Calculator size={24} className={theme.text} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">
              Stap-voor-Stap Oplosser
            </h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              AI Tutor • {subjectName}
            </p>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAnswers(!showAnswers)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              showAnswers
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
            }`}
          >
            {showAnswers ? <Eye size={14} /> : <EyeOff size={14} />}
            {showAnswers ? "Antwoorden" : "Alleen Hints"}
          </button>
          {mode !== "input" && (
            <button
              onClick={reset}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
            >
              <RefreshCw size={18} />
            </button>
          )}
        </div>
      </div>

      {/* INPUT MODE */}
      {mode === "input" && (
        <div className="flex-1 flex flex-col gap-4">
          <textarea
            value={problemText}
            onChange={(e) => setProblemText(e.target.value)}
            placeholder="Typ of plak hier je opgave... (bijv. 'Los op: 3x² + 5x - 2 = 0')"
            className="flex-1 bg-white/[0.02] border border-white/10 rounded-xl p-4 text-white placeholder-slate-600 resize-none focus:outline-none focus:border-blue-500/50 transition-all"
          />

          <div className="flex gap-3">
            <button
              onClick={solve}
              disabled={!problemText.trim()}
              className={`flex-1 py-4 rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all ${
                problemText.trim()
                  ? `${theme.bg} ${theme.text} hover:brightness-110`
                  : "bg-white/5 text-slate-600 cursor-not-allowed"
              }`}
            >
              <Sparkles size={18} /> Oplossen
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all flex items-center gap-2"
            >
              <Camera size={18} /> Foto
            </button>
          </div>

          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
              {error}
            </div>
          )}
        </div>
      )}

      {/* SOLVING MODE */}
      {mode === "solving" && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={40} className={`animate-spin ${theme.text}`} />
            <p className="text-slate-400">Probleem analyseren...</p>
          </div>
        </div>
      )}

      {/* RESULT MODE */}
      {mode === "result" && solution && (
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
          {/* Problem */}
          <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                Opgave
              </span>
              {solution.topic && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-black ${theme.bg} ${theme.text}`}
                >
                  {solution.topic}
                </span>
              )}
            </div>
            <p className="text-white font-medium">{solution.problem}</p>
          </div>

          {/* Methodology */}
          {solution.methodology && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-xs text-blue-300">
                <strong>Aanpak:</strong> {solution.methodology}
              </p>
            </div>
          )}

          {/* Steps */}
          <div className="space-y-2">
            {solution.steps.map((step, idx) => (
              <div
                key={idx}
                className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => toggleStep(idx)}
                  className="w-full p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black ${theme.bg} ${theme.text}`}
                    >
                      {step.stepNumber}
                    </div>
                    <span className="text-white font-medium text-left">
                      {step.description}
                    </span>
                  </div>
                  {expandedSteps.has(idx) ? (
                    <ChevronUp size={18} className="text-slate-500" />
                  ) : (
                    <ChevronDown size={18} className="text-slate-500" />
                  )}
                </button>

                {expandedSteps.has(idx) && (
                  <div className="px-4 pb-4 space-y-3 animate-in slide-in-from-top-2">
                    {step.calculation && (
                      <div className="p-3 bg-black/40 rounded-lg font-mono text-sm text-emerald-400">
                        {step.calculation}
                      </div>
                    )}
                    {step.explanation && (
                      <p className="text-sm text-slate-400">
                        {step.explanation}
                      </p>
                    )}
                    {step.hint && !showAnswers && (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        <p className="text-xs text-amber-300 flex items-start gap-2">
                          <Lightbulb size={14} className="shrink-0 mt-0.5" />
                          {step.hint}
                        </p>
                      </div>
                    )}

                    {/* Request additional hint */}
                    {!showAnswers && (
                      <button
                        onClick={() => requestHint(step.stepNumber)}
                        disabled={isLoading}
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        <Lightbulb size={12} />
                        Meer hulp nodig?
                      </button>
                    )}

                    {currentHint?.step === step.stepNumber && (
                      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <p className="text-xs text-blue-300">
                          {currentHint.text}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Final Answer */}
          <div className={`p-4 rounded-xl border ${theme.border} ${theme.bg}`}>
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">
              {showAnswers ? "Eindantwoord" : "Probeer Zelf"}
            </div>
            <p className={`font-bold text-lg ${theme.text}`}>
              {solution.finalAnswer}
            </p>
          </div>

          {/* Common Mistakes */}
          {solution.commonMistakes && solution.commonMistakes.length > 0 && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
              <h4 className="text-rose-400 text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                <AlertTriangle size={14} /> Let Op
              </h4>
              <ul className="space-y-1">
                {solution.commonMistakes.map((m, i) => (
                  <li key={i} className="text-xs text-rose-200">
                    • {m}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Check Your Work Button */}
          <button
            onClick={() => setMode("check")}
            className="py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={16} /> Controleer Mijn Uitwerking
          </button>
        </div>
      )}

      {/* CHECK MODE */}
      {mode === "check" && solution && (
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
          <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl">
            <p className="text-sm text-slate-400 mb-2">Opgave:</p>
            <p className="text-white">{solution.problem}</p>
          </div>

          <textarea
            value={studentSolution}
            onChange={(e) => setStudentSolution(e.target.value)}
            placeholder="Typ hier je eigen uitwerking..."
            className="flex-1 min-h-[150px] bg-white/[0.02] border border-white/10 rounded-xl p-4 text-white placeholder-slate-600 resize-none focus:outline-none focus:border-blue-500/50 transition-all"
          />

          <button
            onClick={checkStudentSolution}
            disabled={isLoading || !studentSolution.trim()}
            className={`py-4 rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all ${
              studentSolution.trim()
                ? `${theme.bg} ${theme.text} hover:brightness-110`
                : "bg-white/5 text-slate-600 cursor-not-allowed"
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Controleren...
              </>
            ) : (
              <>
                <CheckCircle2 size={18} /> Controleer
              </>
            )}
          </button>

          {checkResult && (
            <div
              className={`p-4 rounded-xl border ${
                checkResult.isCorrect
                  ? "bg-emerald-500/10 border-emerald-500/20"
                  : "bg-amber-500/10 border-amber-500/20"
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-black ${
                    checkResult.isCorrect
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-amber-500/20 text-amber-400"
                  }`}
                >
                  {checkResult.score}
                </div>
                <div>
                  <h4
                    className={`font-bold ${checkResult.isCorrect ? "text-emerald-400" : "text-amber-400"}`}
                  >
                    {checkResult.isCorrect ? "Correct!" : "Bijna goed"}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {checkResult.feedback}
                  </p>
                </div>
              </div>

              {checkResult.errors?.length > 0 && (
                <div className="mt-3">
                  <h5 className="text-rose-400 text-xs font-bold mb-1">
                    Fouten:
                  </h5>
                  <ul className="text-xs text-rose-200 space-y-1">
                    {checkResult.errors.map((e: string, i: number) => (
                      <li key={i}>• {e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => setMode("result")}
            className="py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all font-bold uppercase tracking-widest text-xs"
          >
            ← Terug naar Oplossing
          </button>
        </div>
      )}
    </div>
  );
};
