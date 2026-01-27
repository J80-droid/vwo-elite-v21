import {
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  HelpCircle,
  XCircle,
} from "lucide-react";
import React, { useState } from "react";
import { InlineMath } from "react-katex";

interface Step {
  id: string;
  content: string;
  isError: boolean;
  explanation?: string;
}

interface Problem {
  id: string;
  title: string;
  steps: Step[];
  correctStepId: string; // The ID of the ERROR step
  hint: string;
}

const PROBLEMS: Problem[] = [
  {
    id: "1",
    title: "De Verdwenen Kettingregel",
    hint: "Differentieer je antwoord eens. Wat komt eruit?",
    correctStepId: "step-2",
    steps: [
      { id: "intro", content: "f(x) = \\sin(3x)", isError: false },
      {
        id: "step-1",
        content: "F(x) = \\int \\sin(3x) \\, dx",
        isError: false,
      },
      {
        id: "step-2",
        content: "F(x) = -\\cos(3x) + C",
        isError: true,
        explanation:
          "Fout! Bij primitiveren moet je corrigeren voor de kettingregel: vermenigvuldig met 1/3.",
      },
      {
        id: "step-3",
        content: "Controle: F'(x) = -(-\\sin(3x)) = \\sin(3x)",
        isError: false,
      },
    ],
  },
  {
    id: "2",
    title: "De Productregel Hallucinatie",
    hint: "Bestaat er een productregel voor integralen zoals bij differentiëren?",
    correctStepId: "step-2",
    steps: [
      { id: "intro", content: "\\int x \\cdot e^x \\, dx", isError: false },
      {
        id: "step-1",
        content: "= \\int x \\, dx \\cdot \\int e^x \\, dx",
        isError: true,
        explanation:
          "FATALE FOUT! De integraal van een product is NIET het product van integralen. Gebruik partiële integratie.",
      },
      {
        id: "step-2",
        content: "= \\frac{1}{2}x^2 \\cdot e^x + C",
        isError: false,
      },
    ],
  },
  {
    id: "3",
    title: "Het Wortel Bedrog",
    hint: "Vul eens x=3 in. Klopt het dan nog?",
    correctStepId: "step-2",
    steps: [
      { id: "intro", content: "f(x) = \\sqrt{x^2 + 16}", isError: false },
      {
        id: "step-1",
        content: "= \\sqrt{x^2} + \\sqrt{16}",
        isError: true,
        explanation:
          "Algebraïsche doodzonde! Wortels mag je niet splitsen bij optellen. √(9+16) is 5, niet 3+4.",
      },
      { id: "step-2", content: "= x + 4", isError: false },
    ],
  },
];

export const ErrorAnalysis: React.FC = () => {
  const [activeProblemIndex, setActiveProblemIndex] = useState(0);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [hasChecked, setHasChecked] = useState(false);

  const problem = PROBLEMS[activeProblemIndex]!;

  const handleStepClick = (stepId: string) => {
    if (hasChecked && stepId !== selectedStepId) return; // Prevent changing after check, unless resetting? Let's allow changing before check.
    if (hasChecked) return;
    setSelectedStepId(stepId);
  };

  const checkAnswer = () => {
    if (!selectedStepId) return;
    setHasChecked(true);
  };

  const nextProblem = () => {
    setActiveProblemIndex((prev) => prev + 1);
    setSelectedStepId(null);
    setHasChecked(false);
  };

  if (activeProblemIndex >= PROBLEMS.length) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
          <CheckCircle size={48} className="text-emerald-400" />
        </div>
        <h2 className="text-4xl font-black text-emerald-400 uppercase tracking-tighter mb-4">
          Case Closed!
        </h2>
        <p className="text-slate-400 max-w-md mb-8">
          Geweldig speurwerk. Alle fouten zijn opgespoord en gecorrigeerd. De
          wiskunde is weer veilig.
        </p>
        <button
          onClick={() => setActiveProblemIndex(0)}
          className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold uppercase tracking-widest transition-all"
        >
          Opnieuw Beginnen
        </button>
      </div>
    );
  }

  const isCorrect = selectedStepId === problem.correctStepId;

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto w-full font-outfit text-white">
      {/* Context Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-rose-500 uppercase tracking-tighter flex items-center gap-3">
            <AlertTriangle size={32} className="text-rose-500" />
            Primitieve Politie
          </h2>
          <p className="text-slate-400 font-medium mt-2">
            De AI heeft een grove fout gemaakt.{" "}
            <span className="text-white font-bold">
              Wijs de foute stap aan.
            </span>
          </p>
        </div>
        <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 font-mono text-rose-400 font-bold">
          Casus {activeProblemIndex + 1} / {PROBLEMS.length}
        </div>
      </div>

      <div className="flex gap-8 flex-1 overflow-hidden">
        {/* Steps List */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          {problem.steps.map((step, index) => {
            const isSelected = selectedStepId === step.id;

            let stateStyle = "bg-white/5 border-white/10 hover:bg-white/10";
            if (isSelected && !hasChecked) {
              stateStyle =
                "bg-cyan-500/20 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.2)]";
            } else if (hasChecked && isSelected) {
              if (step.isError) {
                stateStyle =
                  "bg-emerald-500/20 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]";
              } else {
                stateStyle =
                  "bg-rose-500/20 border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.2)]";
              }
            } else if (hasChecked && step.isError && !isSelected) {
              // Reveal the error if they missed it
              stateStyle =
                "bg-rose-500/10 border-rose-500/30 opacity-70 border-dashed";
            }

            return (
              <button
                key={step.id}
                onClick={() => handleStepClick(step.id)}
                disabled={hasChecked}
                className={`w-full text-left p-6 rounded-2xl border transition-all duration-300 relative group ${stateStyle}`}
              >
                <div className="absolute top-4 left-4 text-[10px] uppercase font-black tracking-widest text-slate-500">
                  Stap {index + 1}
                </div>
                <div className="mt-2 text-lg font-medium text-slate-200 pl-4 border-l-2 border-white/10 group-hover:border-white/30 transition-colors">
                  <InlineMath math={step.content} />
                </div>

                {hasChecked && isSelected && step.isError && (
                  <div className="absolute top-4 right-4 text-emerald-400">
                    <CheckCircle size={24} />
                  </div>
                )}
                {hasChecked && isSelected && !step.isError && (
                  <div className="absolute top-4 right-4 text-rose-400">
                    <XCircle size={24} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Feedback Panel */}
        <div className="w-80 flex flex-col gap-6">
          <div className="p-6 bg-black/20 rounded-3xl border border-white/5 backdrop-blur-md">
            <h4 className="text-violet-400 font-bold uppercase tracking-widest text-xs mb-3 flex items-center gap-2">
              <HelpCircle size={14} /> Recherche Tip
            </h4>
            <p className="text-sm text-slate-400 leading-relaxed italic">
              "{problem.hint}"
            </p>
          </div>

          {hasChecked && (
            <div
              className={`p-6 rounded-3xl border backdrop-blur-md animate-in slide-in-from-right fade-in duration-500 ${isCorrect ? "bg-emerald-500/10 border-emerald-500/20" : "bg-rose-500/10 border-rose-500/20"}`}
            >
              <h4
                className={`font-black uppercase tracking-widest text-lg mb-4 ${isCorrect ? "text-emerald-400" : "text-rose-400"}`}
              >
                {isCorrect ? "Gearresteerd!" : "Verkeerde Verdachte"}
              </h4>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                {isCorrect
                  ? problem.steps.find((s) => s.isError)?.explanation
                  : "Dit is niet de fout. Kijk goed naar de regels voor primitiveren en algebra."}
              </p>

              <button
                onClick={nextProblem}
                className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-2"
              >
                Volgende Zaak <ChevronRight size={14} />
              </button>
            </div>
          )}

          {!hasChecked && (
            <button
              onClick={checkAnswer}
              disabled={!selectedStepId}
              className="mt-auto w-full py-4 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-black uppercase tracking-widest text-white shadow-[0_0_20px_rgba(244,63,94,0.3)] hover:shadow-[0_0_40px_rgba(244,63,94,0.5)] transition-all active:scale-95"
            >
              Verifieer Fout
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
