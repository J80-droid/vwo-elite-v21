/* eslint-disable simple-import-sort/imports */
import "katex/dist/katex.min.css";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  Lightbulb,
  RefreshCw,
  Trophy,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { BlockMath, InlineMath } from "react-katex";
import { useGodSlayer } from "@shared/hooks/useGodSlayer";
import { useGymProgress } from "@shared/hooks/useGymProgress";
import {
  CircuitEngine,
  DecayEngine,
  FlashcardEngine,
  GraphEngine,
  IsolatorEngine,
  PhysVectorEngine,
  SigFigEngine,
  UnitEngine,
  useGymSound,
  useTutor,
} from "@features/physics";
import { DerivEngine } from "./engines/DerivEngine";
import { DomainEngine } from "./engines/DomainEngine";
import { ExponentEngine } from "./engines/ExponentEngine";
import { FormulaEngine } from "./engines/FormulaEngine";
import { FractionEngine } from "./engines/FractionEngine";
import { GeometryEngine } from "./engines/GeometryEngine";
import { IntegraalEngine } from "./engines/IntegraalEngine";
import { LimitEngine } from "./engines/LimitEngine";
import { TrigEngine } from "./engines/TrigEngine";
import { VectorEngine as MathVectorEngine } from "./engines/VectorEngine";
import { createMixEngine } from "./engines/createMixEngine";
import { Difficulty, GymEngine, GymProblem } from "./types";

// Registry of engines available
const ENGINES_FOR_MIX: Record<string, GymEngine> = {
  fractions: {
    ...FractionEngine,
    id: "fractions",
    name: "Breuken",
    description: "Fraction drills",
  },
  exponents: {
    ...ExponentEngine,
    id: "exponents",
    name: "Machten",
    description: "Exponent drills",
  },
  trig: {
    ...TrigEngine,
    id: "trig",
    name: "Goniometrie",
    description: "Trigonometry drills",
  },
  derivs: {
    ...DerivEngine,
    id: "derivs",
    name: "Afgeleiden",
    description: "Derivative drills",
  },
  formulas: {
    ...FormulaEngine,
    id: "formulas",
    name: "Formules",
    description: "Formula identification",
  },
  vectors: {
    ...MathVectorEngine,
    id: "vectors",
    name: "Vectoren (Wiskunde)",
    description: "Math vector operations",
  },
  integraal: {
    ...IntegraalEngine,
    id: "integraal",
    name: "Integralen",
    description: "Integration drills",
  },
  limits: {
    ...LimitEngine,
    id: "limits",
    name: "Limieten",
    description: "Limit drills",
  },
  domain: {
    ...DomainEngine,
    id: "domain",
    name: "Domein & Bereik",
    description: "Domain/Range drills",
  },
  geometry: {
    ...GeometryEngine,
    id: "geometry",
    name: "Meetkunde",
    description: "Geometry recall",
  },
  units: {
    ...UnitEngine,
    id: "units",
    name: "Eenheden",
    description: "Unit conversion",
  },
  isolator: {
    ...IsolatorEngine,
    id: "isolator",
    name: "Isolator",
    description: "Formula isolation",
  },
  sigfig: {
    ...SigFigEngine,
    id: "sigfig",
    name: "Significantie",
    description: "SigFig drills",
  },
  "phys-vectors": {
    ...PhysVectorEngine,
    id: "phys-vectors",
    name: "Vectoren (Natuurkunde)",
    description: "Physics vector drills",
  },
  decay: {
    ...DecayEngine,
    id: "decay",
    name: "Verval",
    description: "Nuclear decay drills",
  },
  circuits: {
    ...CircuitEngine,
    id: "circuits",
    name: "Schakelingen",
    description: "Circuit calculation",
  },
  graphs: {
    ...GraphEngine,
    id: "graphs",
    name: "Grafieken",
    description: "Graph reading",
  },
  flashcards: {
    ...FlashcardEngine,
    id: "flashcards",
    name: "Flashcards",
    description: "Concept recall",
  },
};

const ENGINES = {
  ...ENGINES_FOR_MIX,

  // MIXED ENGINES (Milkshake)
  "mix-math": createMixEngine(
    "mix-math",
    "Math Milkshake",
    "Een mix van alle Wiskunde drills.",
    ENGINES_FOR_MIX,
    [
      "fractions",
      "exponents",
      "trig",
      "derivs",
      "formulas",
      "vectors",
      "integraal",
      "limits",
      "domain",
      "geometry",
    ],
  ),
  "mix-physics": createMixEngine(
    "mix-physics",
    "Physics Milkshake",
    "Een mix van alle Natuurkunde drills.",
    ENGINES_FOR_MIX,
    [
      "units",
      "isolator",
      "sigfig",
      "phys-vectors",
      "decay",
      "circuits",
      "graphs",
      "flashcards",
    ],
  ),
};

// Math Error Boundary to prevent KaTeX crashes from killing the session
class MathErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <span className="text-red-400/50 font-mono text-[10px] bg-red-500/10 px-1 rounded">
          [LaTeX Syntax Error]
        </span>
      );
    }
    return this.props.children;
  }
}

const RenderContent = ({ content }: { content: string }) => {
  // Splits on LaTeX delimiters: $$...$$ (block) and $...$ (inline)
  // ALSO handles markdown bolding: **bold**
  const parts = content.split(/(\$\$.*?\$\$|\$.*?\$|\*\*.*?\*\*)/gs);

  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith("$$") && part.endsWith("$$")) {
          return (
            <MathErrorBoundary key={i}>
              <BlockMath math={part.slice(2, -2)} />
            </MathErrorBoundary>
          );
        }
        if (part.startsWith("$") && part.endsWith("$")) {
          return (
            <MathErrorBoundary key={i}>
              <InlineMath math={part.slice(1, -1)} />
            </MathErrorBoundary>
          );
        }
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-black text-amber-500">
              {part.slice(2, -2)}
            </strong>
          );
        }

        return (
          <span key={i} className="whitespace-pre-wrap">
            {part}
          </span>
        );
      })}
    </span>
  );
};

interface GymSessionProps {
  engineId: string;
  onExit: () => void;
  questionCount?: number;
}

// Session constants outside for stability
const TIME_LIMIT_MS = 60000;

export const GymSession: React.FC<GymSessionProps> = ({
  engineId,
  onExit,
  questionCount = 10,
}) => {
  const engine = ENGINES[engineId as keyof typeof ENGINES];
  const { recordSuccess, getLevel } = useGymProgress();
  const { playCorrect, playWrong, playLevelUp } = useGymSound();
  const { sendMessage, triggerIntervention } = useTutor();

  // Final Audit: Ensure XR Buttons die here too
  useGodSlayer();

  // --- STATE ---
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [maxUnlockedLevel, setMaxUnlockedLevel] = useState<number>(1);
  const [problem, setProblem] = useState<GymProblem | null>(null);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState(0); // Track repeated failures

  // Session Management
  const [questionNumber, setQuestionNumber] = useState(1);
  const [sessionScore, setSessionScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isRetry, setIsRetry] = useState(false);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);

  // Timer & Scoring State
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_MS);
  const [startTime, setStartTime] = useState(() => Date.now());

  const calculateScore = useCallback(
    (timeTaken: number) => {
      if (isRetry) return 0; // Anti-exploit: No XP on retry

      const remainingSec = Math.max(
        0,
        Math.floor((TIME_LIMIT_MS - timeTaken) / 1000),
      );
      let score = 100 + remainingSec;
      if (timeTaken < 10000) score = Math.floor(score * 1.5);
      return score;
    },
    [isRetry],
  );

  // Use a ref to track current level for generation without triggering callback updates
  const levelRef = useRef(currentLevel);
  useEffect(() => {
    levelRef.current = currentLevel;
  }, [currentLevel]);

  const nextProblem = useCallback(
    async (initialLoad = false) => {
      if (!engine) return;

      // Check for session end - use functional update or ref to avoid questionNumber dependency
      // but here we are in a callback called after 1.5s, usually safe.
      // Still, let's use a local check if needed.

      let levelToUse: number;
      if (initialLoad) {
        const unlocked = await getLevel(engineId);
        levelToUse = unlocked;
        setCurrentLevel(unlocked);
        setMaxUnlockedLevel(unlocked);
        setQuestionNumber(1); // Reset for new engine
      } else {
        levelToUse = levelRef.current;
        setQuestionNumber((prev) => prev + 1);
      }

      const newProb = engine.generate(levelToUse as Difficulty);
      setProblem(newProb);
      setInput("");
      setStatus("idle");
      setFeedback(null);
      setIsRetry(false);
      setShowSolution(false);
      setTimeLeft(TIME_LIMIT_MS);
      setStartTime(Date.now());

      // Focus input
      setTimeout(() => inputRef.current?.focus(), 100);
    },
    [engine, engineId, getLevel],
  );

  const changeLevel = useCallback(
    async (newLevel: number) => {
      if (newLevel < 1 || newLevel > maxUnlockedLevel || !engine) return;

      setCurrentLevel(newLevel);

      // Reset session state for new level
      const newProb = engine.generate(newLevel as Difficulty);
      setProblem(newProb);
      setQuestionNumber(1);
      setSessionScore(0);
      setInput("");
      setStatus("idle");
      setFeedback(null);
      setIsRetry(false);
      setShowSolution(false);
      setTimeLeft(TIME_LIMIT_MS);
      setStartTime(Date.now());

      setTimeout(() => inputRef.current?.focus(), 100);
    },
    [engine, maxUnlockedLevel],
  );

  const insertAtCursor = (sym: string) => {
    const el = inputRef.current;
    if (!el) {
      setInput((prev) => prev + sym);
      return;
    }

    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const text = input;

    // Insert symbol at cursor
    const newText = text.substring(0, start) + sym + text.substring(end);

    setInput(newText);

    // Restore focus and position cursor after new symbol
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + sym.length, start + sym.length);
    }, 0);
  };

  const handleSubmit = useCallback(
    async (e?: React.FormEvent, isTimeout = false) => {
      if (e && e.preventDefault) e.preventDefault();
      if (!problem || !engine) return;

      const timeTaken = Date.now() - startTime;
      let result: { correct: boolean; feedback: string } = {
        correct: false,
        feedback: "Time's up!",
      };

      if (!isTimeout) {
        const rawResult = engine.validate(input, problem);
        result = {
          correct: rawResult.correct,
          feedback:
            rawResult.feedback ||
            (rawResult.correct ? "Correct!" : "Probeer het nog eens."),
        };
      }

      if (result.correct) {
        const score = calculateScore(timeTaken);
        setStatus("correct");
        setFeedback(isRetry ? `Correct! (0 XP)` : `+${score} XP`);

        // Sound
        if (isRetry) playCorrect();
        // Level up logic handled below

        // Record result and check for level promotion
        const dbResult = await recordSuccess(engineId, true, timeTaken, score);
        setSessionScore((prev) => prev + score);

        if (dbResult?.newBox && dbResult.newBox > maxUnlockedLevel) {
          // Sound: Level Up
          playLevelUp();
          setMaxUnlockedLevel(dbResult.newBox);
          setCurrentLevel(dbResult.newBox);
        } else if (!isRetry) {
          playCorrect();
        }

        setTimeout(() => {
          // If we've reached the last question, finish the session
          // We use a closure-safe check or use the state from the render where this was created
          if (questionNumber >= questionCount) {
            setIsFinished(true);
          } else {
            nextProblem();
          }
        }, 1000);
      } else {
        setStatus("wrong");
        setFeedback(result.feedback || "Probeer het nog eens.");
        setWrongAttempts((prev) => prev + 1);
        playWrong();
        recordSuccess(engineId, false, timeTaken, 0);

        // Cross-linking logic: If failing 'vectors' engine, suggest Mechanics Lab
        if (engineId === "phys-vectors" && wrongAttempts >= 2) {
          setFeedback(
            "Moeite met vectoren? Overweeg de Mechanics Lab simulatie.",
          );
        } else if (engineId === "decay" && wrongAttempts >= 2) {
          setFeedback("Moeite met verval? Bekijk de Nuclear Lab simulatie.");
        } else if (engineId === "circuits" && wrongAttempts >= 2) {
          setFeedback("Snap je serie/parallel niet? Bouw het in Circuits Lab.");
        }
      }
    },
    [
      problem,
      engine,
      startTime,
      calculateScore,
      isRetry,
      recordSuccess,
      engineId,
      maxUnlockedLevel,
      nextProblem,
      input,
      questionNumber,
      playCorrect,
      playLevelUp,
      playWrong,
      wrongAttempts,
      questionCount,
    ],
  );

  // Timer Effect
  useEffect(() => {
    if (status !== "idle" || isFinished) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 100) {
          clearInterval(timer);
          handleSubmit(undefined, true);
          return 0;
        }
        return prev - 100;
      });
    }, 100);
    return () => clearInterval(timer);
  }, [status, isFinished, handleSubmit]);

  // --- REFINED INITIAL LOAD ---
  // Only triggers when engineId changes
  useEffect(() => {
    let active = true;
    const init = async () => {
      if (active) await nextProblem(true);
    };
    init();
    return () => {
      active = false;
    };
  }, [engineId, nextProblem]);

  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center animate-in zoom-in duration-500 max-w-xl mx-auto">
        <div className="w-24 h-24 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(245,158,11,0.1)]">
          <Trophy size={48} className="text-amber-400" />
        </div>
        <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">
          Sessie Voltooid!
        </h2>
        <p className="text-slate-400 mb-12 uppercase tracking-[0.2em] text-[10px] font-bold">
          Geweldig gedaan. Je prestaties zijn opgeslagen.
        </p>

        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-10 w-full mb-12 shadow-inner">
          <div className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black mb-2">
            Verdiende Ervaring
          </div>
          <div className="text-6xl font-black text-emerald-400 tabular-nums">
            {sessionScore} XP
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => window.location.reload()}
            className="btn-elite-neon btn-elite-neon-slate !px-8 !py-4"
          >
            Nieuwe Sessie
          </button>
          <button
            onClick={onExit}
            className="btn-elite-neon btn-elite-neon-emerald !px-8 !py-4 active"
          >
            Terug naar Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!engine)
    return <div className="text-white p-4">Engine not found: {engineId}</div>;
  if (!problem) return <div className="text-white p-4">Loading...</div>;

  const timeProgress = (timeLeft / TIME_LIMIT_MS) * 100;

  return (
    <div className="h-full w-full overflow-y-auto overflow-x-hidden relative custom-scrollbar bg-obsidian-950/20 isolate">
      {/* Timer Bar (Sticky) */}
      <div className="sticky top-0 left-0 w-full h-0.5 bg-white/10 z-50">
        <div
          className={`h-full transition-all duration-100 ease-linear ${
            timeProgress < 20
              ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"
              : "bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
          }`}
          style={{ width: `${timeProgress}%` }}
        />
      </div>

      <div className="flex flex-col items-center justify-start min-h-full w-full max-w-2xl mx-auto p-6 md:p-12 pb-40 animate-in fade-in duration-500">
        {/* Header: Level & Context compact */}
        <div className="w-full flex justify-between items-center mb-4 md:mb-6 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">
          {/* Interactive Level Selector */}
          <div className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-amber-500/20 group-hover:border-amber-500/30 transition-all">
              <Trophy size={14} className="text-amber-400" />
            </div>

            <div className="flex items-center bg-white/5 rounded-lg p-0.5 border border-white/5 ml-2">
              <button
                disabled={currentLevel <= 1}
                onClick={() => changeLevel(currentLevel - 1)}
                className="p-1 hover:bg-white/10 rounded-md transition-colors disabled:opacity-20 disabled:cursor-not-allowed text-white"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-3 min-w-[70px] text-center select-none text-white">
                Level {currentLevel}
              </span>
              <button
                disabled={currentLevel >= maxUnlockedLevel}
                onClick={() => changeLevel(currentLevel + 1)}
                className="p-1 hover:bg-white/10 rounded-md transition-colors disabled:opacity-20 disabled:cursor-not-allowed text-white"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <span className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
            <span className="text-emerald-400">
              {questionNumber} / {questionCount}
            </span>
            <span className="text-slate-800">|</span>
            <span className="text-slate-300">{problem.context}</span>
          </span>
          <button
            onClick={onExit}
            className="hover:text-red-400 transition-colors uppercase tracking-[0.3em] font-black opacity-50 hover:opacity-100"
          >
            Stop
          </button>
        </div>

        {/* The Question compact */}
        <div
          key={problem.id} // Key change triggers the enter animation
          className="mb-4 md:mb-8 select-none animate-in elite-question-enter w-full"
        >
          <div
            className={`
                    p-4 md:p-8 bg-white/[0.02] border border-white/5 rounded-[24px] md:rounded-[32px] shadow-2xl relative group
                    transition-all duration-700 ease-out min-h-[120px] md:min-h-[160px] flex items-center justify-center
                `}
          >
            {/* Dynamic Rendering: Math vs Text */}
            {/* Dynamic Rendering: Uses RenderContent for mixed LaTeX/Text support */}
            <div className="elite-question-text text-xl md:text-2xl text-white font-medium text-center leading-relaxed">
              <RenderContent content={problem.question} />
            </div>

            {/* Elite "Alive" Background Glow compact */}
            <div className="absolute -inset-2 bg-white/[0.03] rounded-[32px] blur-xl opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none elite-alive-glow" />
          </div>
        </div>

        {/* Input Section compact */}
        <form onSubmit={handleSubmit} className="w-full relative px-2">
          <div
            className={`
                    relative group transition-all duration-400
                    ${status === "wrong" ? "animate-shake" : ""}
                `}
          >
            <input
              ref={inputRef}
              type="text"
              // Dynamic inputMode: "text" for symbolic/concept engines, "decimal" for calculation
              inputMode={
                [
                  "isolator",
                  "flashcards",
                  "formulas",
                  "domain",
                  "geometry",
                  "decay",
                ].includes(engineId)
                  ? "text"
                  : "decimal"
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Voer antwoord in..."
              autoFocus
              autoComplete="off"
              className={`
                            w-full bg-obsidian-900 border-2 rounded-xl py-3 md:py-4 px-6 text-center text-lg md:text-xl font-mono text-white outline-none
                            placeholder:text-slate-800 transition-all duration-300 shadow-inner
                            ${status === "idle" ? "border-white/5 focus:border-cyan-500/30" : ""}
                            ${status === "correct" ? "border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.1)]" : ""}
                            ${status === "wrong" ? "border-red-500/50 bg-red-500/5 shadow-[0_0_20px_rgba(239,68,68,0.1)]" : ""}
                        `}
            />

            {/* Status Icon */}
            <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {status === "idle" && (
                <button
                  type="submit"
                  className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 text-cyan-400 transition-all cursor-pointer flex items-center justify-center opacity-0 group-focus-within:opacity-100 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                >
                  <ArrowRight size={20} />
                </button>
              )}
              {status === "correct" && (
                <Check className="text-emerald-400 scale-150 drop-shadow-[0_0_8px_#10b981]" />
              )}
              {status === "wrong" && (
                <X className="text-red-400 scale-150 drop-shadow-[0_0_8px_#ef4444]" />
              )}
            </div>
          </div>

          {/* Feedback Message compact */}
          {feedback && (
            <div
              className={`mt-4 text-center font-black uppercase tracking-[0.2em] text-[10px] animate-in fade-in slide-in-from-top-2 ${status === "correct" ? "text-emerald-400" : "text-red-400"}`}
            >
              {feedback}
            </div>
          )}

          {/* Action Buttons for Wrong Answers */}
          {status === "wrong" && (
            <div className="mt-10 flex gap-4 justify-center flex-wrap animate-in fade-in slide-in-from-bottom-4">
              <button
                type="button"
                onClick={() => setShowSolution(!showSolution)}
                className={`btn-elite-neon !py-4 ${showSolution ? "btn-elite-neon-purple active" : "btn-elite-neon-purple"}`}
              >
                {showSolution ? (
                  <>
                    <EyeOff size={14} /> Verberg
                  </>
                ) : (
                  <>
                    <Lightbulb size={14} /> Uitleg
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatus("idle");
                  setFeedback(null);
                  setInput("");
                  setIsRetry(true);
                  setTimeLeft(TIME_LIMIT_MS);
                  setStartTime(Date.now());
                  setShowSolution(false);
                  setTimeout(() => inputRef.current?.focus(), 10);
                }}
                className="btn-elite-neon btn-elite-neon-amber !py-4"
              >
                <RefreshCw size={14} /> Opnieuw
              </button>

              {/* AI Tutor Hook */}
              {wrongAttempts >= 3 && (
                <button
                  type="button"
                  onClick={() => {
                    if (!problem) return;
                    triggerIntervention(
                      `User is stuck on problem: ${problem.question}`,
                    );
                    sendMessage(
                      `Ik kom er niet uit. De vraag is: "${problem.question}". Context: ${problem.context || "Geen"}.`,
                    );
                  }}
                  className="btn-elite-neon btn-elite-neon-indigo !py-4 active animate-in fade-in zoom-in"
                >
                  <Lightbulb size={14} className="animate-pulse" /> Vraag AI
                  Tutor
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowSolution(false);
                  nextProblem();
                }}
                className="btn-elite-neon btn-elite-neon-slate !py-4"
              >
                <ChevronRight size={14} /> Volgende
              </button>
            </div>
          )}

          {/* Solution Steps Panel */}
          {showSolution && problem?.solutionSteps && (
            <div className="mt-10 p-8 bg-black/40 backdrop-blur-3xl border border-white/5 rounded-3xl animate-in fade-in slide-in-from-top-4 shadow-2xl">
              <h4 className="text-violet-400 font-black text-[10px] uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                <div className="w-6 h-6 rounded bg-violet-500/20 flex items-center justify-center">
                  <BookOpen size={12} />
                </div>
                Stapsgewijze Oplossing
              </h4>
              <ol className="space-y-4 text-left">
                {problem.solutionSteps.map((step, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-4 text-sm text-slate-400"
                  >
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/5 text-slate-500 flex items-center justify-center text-[10px] font-black">
                      {idx + 1}
                    </span>
                    <span className="mt-0.5 leading-relaxed">
                      {step.includes("\\") ||
                      step.includes("^") ||
                      step.includes("_") ? (
                        <div className="math-step-container">
                          <MathErrorBoundary>
                            <BlockMath math={step} />
                          </MathErrorBoundary>
                        </div>
                      ) : (
                        <span>{step}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ol>
              <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">
                  Correct Antwoord
                </span>
                <span className="text-emerald-400 font-bold text-lg">
                  {(problem.displayAnswer || problem.answer).includes("\\") ||
                  (problem.displayAnswer || problem.answer).includes("^") ? (
                    <MathErrorBoundary>
                      <BlockMath
                        math={problem.displayAnswer || problem.answer}
                      />
                    </MathErrorBoundary>
                  ) : (
                    <span>{problem.displayAnswer || problem.answer}</span>
                  )}
                </span>
              </div>
            </div>
          )}
        </form>

        {/* Math Helper Buttons */}
        <div className="mt-12 flex gap-3 justify-center flex-wrap">
          {["/", "^", "√", "(", ")"].map((sym) => (
            <button
              key={sym}
              type="button"
              onClick={() => insertAtCursor(sym)}
              className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-slate-400 font-mono text-lg flex items-center justify-center transition-all active:scale-90"
            >
              {sym}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
