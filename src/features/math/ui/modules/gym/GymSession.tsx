import "katex/dist/katex.min.css";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight, BookOpen, Check, Microscope,
  Trophy, X,
} from "lucide-react";
import React, { useRef, useEffect } from "react";
import { BlockMath, InlineMath } from "react-katex";

import { SolutionSteps } from "../../SolutionSteps";
import { GYM_CATALOG } from "./config/gymCatalog";
import { useGymSession } from "./hooks/useGymSession";
import { getEngine } from "./registry";
import { GymEngine } from "./types";
import { TIME_LIMIT_MS } from "./hooks/gymSessionReducer";
import { SolutionSkeleton } from "./components/SolutionSkeleton";

// --- HULP COMPONENTS (Ongewijzigd) ---

// Math Error Boundary
class MathErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return <span className="text-red-400/50 font-mono text-[10px] bg-red-500/10 px-1 rounded">[LaTeX Syntax Error]</span>;
    return this.props.children;
  }
}

const RenderContent = ({ content }: { content: string }) => {
  if (!content) return null;
  const parts = content.split(/(\$\$.*?\$\$|\$.*?\$|\*\*.*?\*\*)/gs);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith("$$") && part.endsWith("$$")) return <MathErrorBoundary key={i}><BlockMath math={part.slice(2, -2)} /></MathErrorBoundary>;
        if (part.startsWith("$") && part.endsWith("$")) return <MathErrorBoundary key={i}><InlineMath math={part.slice(1, -1)} /></MathErrorBoundary>;
        if (part.startsWith("**") && part.endsWith("**")) return <strong key={i} className="font-black text-amber-500"><RenderContent content={part.slice(2, -2)} /></strong>;

        const isImplicitMath = part.includes("\\text{") || part.includes("\\frac{") || part.includes("^{") || part.includes("_{") || part.includes("\\cdot");
        if (isImplicitMath) return <MathErrorBoundary key={i}><InlineMath math={part} /></MathErrorBoundary>;

        return <span key={i} className="whitespace-pre-wrap">{part}</span>;
      })}
    </span>
  );
};

// --- HOOFD COMPONENT ---

interface GymSessionProps {
  engineId: string;
  engine?: GymEngine;
  onExit: () => void;
  questionCount?: number;
}

export const GymSession: React.FC<GymSessionProps> = ({ engineId, engine: propEngine, onExit, questionCount = 10 }) => {
  const engine = propEngine || getEngine(engineId);
  const gymConfig = GYM_CATALOG.find(g => g.id === engineId);
  const inputRef = useRef<HTMLInputElement>(null);

  // 1. Gebruik de nieuwe hook
  const { state, actions } = useGymSession(engineId, engine, gymConfig, questionCount);

  // 2. Destructure de geneste state voor leesbaarheid in de render
  const {
    status, // Global status: loading, idle, finished
    level,
    session,
    activeProblem,
    ui
  } = state;

  const {
    setInput, handleSubmit, handleShowSolution, handleFeedbackSubmit, nextProblem
  } = actions;

  // Auto-focus logic
  useEffect(() => {
    if (status === "idle" && !ui.showSolution) {
      // Kleine timeout om te zorgen dat DOM klaar is bij transities
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [activeProblem.data, status, ui.showSolution]);

  const insertAtCursor = (sym: string) => {
    const el = inputRef.current;
    if (!el) { setInput(activeProblem.input + sym); return; }
    const start = el.selectionStart || 0, end = el.selectionEnd || 0;
    const newText = activeProblem.input.substring(0, start) + sym + activeProblem.input.substring(end);
    setInput(newText);
    setTimeout(() => { el.focus(); el.setSelectionRange(start + sym.length, start + sym.length); }, 0);
  };

  // --- VIEW: RESULTATEN SCHERM ---
  if (status === "finished") {
    const acc = Math.round((session.results.filter(r => r.isCorrect).length / (session.results.length || 1)) * 100);
    const avg = Math.round(session.results.reduce((a, b) => a + b.timeTaken, 0) / (session.results.length || 1) / 1000 * 10) / 10;

    return (
      <div className="flex flex-col items-center justify-start h-full w-full max-w-4xl mx-auto p-4 md:p-8 overflow-y-auto custom-scrollbar">
        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="w-full text-center mb-12">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_50px_rgba(245,158,11,0.15)]"><Trophy size={40} className="text-amber-400" /></div>
          <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-2">Sessie <span className="text-amber-500">Voltooid!</span></h2>
          <p className="text-slate-500 uppercase tracking-[0.3em] text-[10px] font-bold">Data-sync: Gearchiveerd in Elite Registry</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-12">
          {[
            { label: "Totaal Score", value: `${session.score}`, sub: "XP Verdiend", color: "text-emerald-400", bg: "bg-emerald-500/5" },
            { label: "Nauwkeurigheid", value: `${acc}%`, sub: `${session.results.filter(r => r.isCorrect).length} / ${session.results.length}`, color: "text-cyan-400", bg: "bg-cyan-500/5" },
            { label: "Gem. Snelheid", value: `${avg}s`, sub: "per vraag", color: "text-purple-400", bg: "bg-purple-500/5" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }} className={`${s.bg} border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col items-center`}>
              <span className="text-[9px] text-slate-500 uppercase tracking-[0.2em] font-black mb-1">{s.label}</span>
              <span className={`text-4xl font-black ${s.color} mb-1`}>{s.value}</span>
              <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">{s.sub}</span>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="w-full bg-white/[0.02] border border-white/5 rounded-[32px] overflow-hidden">
          <div className="p-6 border-b border-white/5 bg-white/[0.02] flex justify-between items-center"><h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Sessie Transcript</h3><span className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">{new Date().toLocaleTimeString()}</span></div>
          <div className="divide-y divide-white/5">
            {session.results.map((r, i) => (
              <div key={i} className="p-6 flex flex-col md:flex-row gap-6 hover:bg-white/[0.01] transition-colors">
                <div className="flex-shrink-0"><div className={`w-8 h-8 rounded-lg flex items-center justify-center ${r.isCorrect ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>{r.isCorrect ? <Check size={16} /> : <X size={16} />}</div></div>
                <div className="flex-grow space-y-3">
                  <div className="text-sm md:text-md text-slate-200 font-medium"><RenderContent content={r.question} /></div>
                  <div className="flex flex-wrap gap-4 text-[10px] uppercase font-bold tracking-widest">
                    <div className="flex flex-col gap-1"><span className="text-slate-600">Jouw antwoord</span><span className={r.isCorrect ? 'text-emerald-400' : 'text-red-500'}><RenderContent content={r.userAnswer || '[Leeg]'} /></span></div>
                    {!r.isCorrect && <div className="flex flex-col gap-1"><span className="text-slate-600">Correct antwoord</span><span className="text-emerald-400"><RenderContent content={r.correctAnswer} /></span></div>}
                    <div className="flex flex-col gap-1 ml-auto text-right"><span className="text-slate-600">Timing</span><span className="text-slate-400">{(r.timeTaken / 1000).toFixed(1)}s</span></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-4 mt-12 mb-20 w-full sm:w-auto">
          <button onClick={() => window.location.reload()} className="px-6 py-3 bg-slate-800 rounded-xl text-white font-bold hover:bg-slate-700 transition-colors">Nog een keer</button>
          <button onClick={onExit} className="px-6 py-3 bg-emerald-600 rounded-xl text-white font-bold hover:bg-emerald-500 transition-colors">Terug naar Dashboard</button>
        </div>
      </div>
    );
  }

  // --- VIEW: LOADING STATE ---
  if (!engine || status === "loading" || !activeProblem.data) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white gap-4">
        <div className="w-12 h-12 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <div className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse text-slate-500">
          Neural Engine: Genereren...
        </div>
      </div>
    );
  }

  // Derived waarden voor render
  const problem = activeProblem.data;
  const inputMode = gymConfig?.inputMode || "text";
  const timeProgress = (session.timeLeft / TIME_LIMIT_MS) * 100;

  // Is de vraag 'klaar' (beantwoord)?
  const isQuestionDone = activeProblem.submissionStatus === "correct" || activeProblem.submissionStatus === "wrong";
  // Is de input 'interactief'?
  const isInputDisabled = isQuestionDone && activeProblem.submissionStatus !== "wrong";

  // --- VIEW: ACTIVE SESSION ---
  return (
    <div className="h-full w-full overflow-y-auto overflow-x-hidden relative custom-scrollbar bg-obsidian-950/20 isolate text-white">
      {/* Timer Bar */}
      <div className="sticky top-0 left-0 w-full h-0.5 bg-white/10 z-50">
        <div
          className={`h-full transition-all duration-100 linear ${timeProgress < 20 ? "bg-red-500" : "bg-purple-500"}`}
          style={{ width: `${timeProgress}%` }}
        />
      </div>

      <div className="flex flex-col items-center justify-start min-h-full w-full max-w-2xl mx-auto p-6 md:p-12 pb-40">
        {/* Header: Level & Progress */}
        <div className="w-full flex justify-between items-center mb-6 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">
          <div className="flex items-center gap-2">
            <span className="bg-white/5 px-3 py-1 rounded">Level {level.current}</span>
          </div>
          <span className="text-emerald-400">{session.questionNumber} / {questionCount}</span>
          <button onClick={onExit} className="hover:text-red-400">Stop</button>
        </div>

        {/* Question Card */}
        <div className="mb-8 w-full p-8 bg-white/[0.02] border border-white/5 rounded-[32px] flex items-center justify-center min-h-[160px] relative">
          <div className="text-2xl font-medium text-center"><RenderContent content={problem.question} /></div>
          {/* Ambient Glow */}
          <div className="absolute -inset-2 bg-white/[0.03] rounded-[32px] blur-xl opacity-50 pointer-events-none" />
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="w-full px-2">
          <div className={`${activeProblem.submissionStatus === "wrong" ? "animate-shake" : ""}`}>
            {problem.type === "multiple-choice" && problem.options ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                {problem.options.map((opt) => (
                  <button key={opt} type="button" onClick={() => setInput(opt)}
                    disabled={isInputDisabled}
                    className={`p-4 rounded-xl border-2 text-left transition-all 
                        ${activeProblem.input === opt ? "border-purple-500 bg-purple-500/20" : "border-white/10 hover:bg-white/5"}
                        ${isInputDisabled ? "opacity-50 cursor-not-allowed" : ""}
                    `}>
                    <RenderContent content={opt} />
                  </button>
                ))}
              </div>
            ) : (
              <input
                ref={inputRef}
                type="text"
                inputMode={inputMode === 'decimal' ? 'decimal' : 'text'}
                autoFocus autoComplete="off"
                value={activeProblem.input}
                onChange={e => setInput(e.target.value)}
                disabled={isInputDisabled}
                className={`w-full bg-white/[0.03] border-2 rounded-2xl px-6 py-8 text-3xl font-black text-center transition-all 
                    ${activeProblem.submissionStatus === "idle" ? "border-white/10 focus:border-purple-500" :
                    activeProblem.submissionStatus === "correct" ? "border-emerald-500 bg-emerald-500/10" : "border-red-500 bg-red-500/10"}
                `}
                placeholder="Antwoord..."
              />
            )}
          </div>

          {/* Controls & Tools */}
          <div className="mt-8 flex flex-col md:flex-row gap-4 justify-between items-center">
            {/* Math Symbol Toolbar */}
            <div className="flex gap-2">
              {(engine.symbols || (gymConfig?.category === 'english' || gymConfig?.category === 'philosophy' || gymConfig?.category === 'french' ? [] : ["/", "^", "√", "(", ")"])).map(s => (
                <button key={s} type="button" onClick={() => insertAtCursor(s)} className="px-4 py-2 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 font-mono"><RenderContent content={s} /></button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button type="button" onClick={handleShowSolution} className="p-4 bg-white/5 rounded-2xl text-slate-400 hover:text-amber-400"><BookOpen size={24} /></button>

              {activeProblem.submissionStatus === "idle" || activeProblem.submissionStatus === "wrong" ? (
                <button type="submit" disabled={!activeProblem.input.trim()} className="px-8 py-4 bg-purple-600 rounded-2xl font-black uppercase tracking-widest hover:bg-purple-500 disabled:opacity-50 transition-colors">
                  {activeProblem.submissionStatus === "wrong" ? "Opnieuw" : <Check size={28} />}
                </button>
              ) : (
                // Als correct -> Next knop (wordt ook auto-triggered door timer, maar voor UX fijn)
                <button type="button" onClick={() => nextProblem()} className="px-8 py-4 bg-emerald-600 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-500 flex items-center gap-2">
                  Volgende <ArrowRight size={20} />
                </button>
              )}
            </div>
          </div>

          {/* Feedback Message */}
          <AnimatePresence>
            {activeProblem.feedback && !ui.showErrorFeedback && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className={`mt-8 text-center font-bold uppercase text-xs ${activeProblem.submissionStatus === "correct" ? "text-emerald-400" : "text-red-400"}`}>
                {activeProblem.feedback}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Analysis Form (Na fout antwoord) */}
          {ui.showErrorFeedback && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-8 p-6 bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20"><Microscope size={20} className="text-red-400" /></div>
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-widest">Fouten Analyse</h4>
                  <p className="text-[10px] text-slate-400">Wat ging er mis?</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {["Conceptueel", "Slordigheid", "Leesfout", "Tijdnood"].map((type) => (
                  <button key={type} type="button" onClick={() => handleFeedbackSubmit(type.toLowerCase(), "neutral")}
                    className="px-4 py-3 rounded-xl border border-white/10 text-slate-300 text-xs font-bold uppercase tracking-wider hover:border-red-400/50 hover:text-red-400 hover:bg-white/5 transition-all">
                    {type}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Solution & Explanation Area */}
          {ui.showSolution && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-6 p-6 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
              <div className="text-[10px] text-amber-500 font-black uppercase mb-4">Oplossing & Analyse</div>

              {ui.isSolvingAI ? (
                // NIEUW: De Skeleton Loader i.p.v. alleen een spinner
                <div className="py-2">
                  <SolutionSkeleton />
                  <div className="flex items-center justify-center gap-2 mt-4 text-[10px] text-amber-500/50 uppercase font-bold tracking-widest">
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
                    AI Genereert stappenplan...
                  </div>
                </div>
              ) : problem.stepSolverResult ? (
                <div className="mb-4"><SolutionSteps solution={problem.stepSolverResult} /></div>
              ) : (
                // ... fallback voor statische oplossingen ...
                <>
                  <div className="text-white text-lg font-medium mb-4">Juiste antwoord: <span className="text-amber-400"><RenderContent content={problem.displayAnswer || problem.answer} /></span></div>
                  {problem.explanation && (
                    <div className="text-slate-300 text-sm mb-4 bg-black/20 p-4 rounded-xl border border-white/5">
                      <strong className="text-amber-400 block text-[10px] uppercase mb-1">Uitleg</strong>
                      <RenderContent content={problem.explanation} />
                    </div>
                  )}
                </>
              )}

              <button type="button" onClick={() => nextProblem()}
                className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase hover:bg-white/10 transition-all mt-4">
                Nu zelf proberen (Volgende Vraag)
              </button>
            </motion.div>
          )}
        </form>
      </div>
    </div>
  );
};
