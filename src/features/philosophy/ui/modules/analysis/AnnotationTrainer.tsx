import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Brain,
  CheckCircle2,
  Eye,
  Highlighter,
  Info,
  Quote,
  RefreshCw,
} from "lucide-react";
import React, { useState } from "react";

// --- TYPES ---
interface SourceFragment {
  id: string;
  author: string;
  source: string;
  text: string;
  targetConcept: string;
  solutionIndices: number[]; // Indices of sentences that match the concept
}

const FRAGMENTS: SourceFragment[] = [
  {
    id: "f1",
    author: "Plato",
    source: "Phaedrus",
    text: "De ziel is in alle opzichten onsterfelijk. Want wat altijd in beweging is, is onsterfelijk. Dat wat een ander beweegt en zelf door weer een ander wordt bewogen, houdt op te leven zodra het ophoudt te bewegen. Alleen dat wat zichzelf beweegt, houdt nooit op te bewegen, omdat het zichzelf nooit verlaat.",
    targetConcept: "Zelfbeweging als bewijs voor onsterfelijkheid",
    solutionIndices: [3, 4], // "Alleen dat wat zichzelf beweegt..."
  },
  {
    id: "f2",
    author: "René Descartes",
    source: "Meditaties",
    text: "Ik merkte dat, terwijl ik wilde denken dat alles onwaar was, het noodzakelijk was dat ik, die dit dacht, iets was. En toen ik merkte dat deze waarheid – ik denk, dus ik ben – zo vast en zeker was dat zelfs de meest buitensporige veronderstellingen van de sceptici haar niet konden wankelen, oordeelde ik dat ik haar zonder aarzelen kon aanvaarden als het eerste beginsel van de filosofie die ik zocht.",
    targetConcept: "De onbetwijfelbaarheid van het denkende subject",
    solutionIndices: [1, 2],
  },
];

export const AnnotationTrainer: React.FC = () => {
  const [activeFragment, setActiveFragment] = useState<SourceFragment>(
    FRAGMENTS[0]!,
  );
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [showSolution, setShowSolution] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const sentences = activeFragment.text.split(/(?<=[.!?])\s+/);

  const toggleSentence = (index: number) => {
    if (showSolution) return;
    if (selectedIndices.includes(index)) {
      setSelectedIndices(selectedIndices.filter((i) => i !== index));
    } else {
      setSelectedIndices([...selectedIndices, index]);
    }
  };

  const checkAnalysis = () => {
    const sortedSelected = [...selectedIndices].sort();
    const sortedSolution = [...activeFragment.solutionIndices].sort();
    const correct =
      JSON.stringify(sortedSelected) === JSON.stringify(sortedSolution);
    setIsCorrect(correct);
    setShowSolution(true);
  };

  const reset = () => {
    setSelectedIndices([]);
    setShowSolution(false);
    setIsCorrect(null);
  };

  return (
    <div className="w-full h-full p-8 flex flex-col gap-8 bg-black overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
            <Highlighter size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">
              Annotatie Trainer
            </h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
              Primaire Tekst Analyse (Lezen & Interpreteren)
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {FRAGMENTS.map((f, i) => (
            <button
              key={f.id}
              onClick={() => {
                setActiveFragment(f);
                reset();
              }}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border
                ${
                  activeFragment.id === f.id
                    ? "bg-white text-black border-white"
                    : "bg-white/5 text-slate-500 border-white/5 hover:border-white/10 hover:text-white"
                }`}
            >
              Tekst {i + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0">
        {/* Left: Instructions & Target */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="p-8 rounded-[2rem] bg-violet-950/20 border border-violet-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Quote size={80} />
            </div>
            <h3 className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Target size={14} /> Analyse Doel
            </h3>
            <div className="p-6 bg-black/40 rounded-2xl border border-white/5">
              <p className="text-white text-lg font-bold leading-relaxed">
                Markeer de zin(nen) die direct verwijzen naar:
              </p>
              <p className="text-violet-400 text-xl font-black mt-2 italic shadow-sm">
                "{activeFragment.targetConcept}"
              </p>
            </div>
          </div>

          <div className="bg-black/40 border border-white/5 p-6 rounded-2xl shadow-xl">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Info size={14} /> Broninformatie
            </h4>
            <div className="space-y-4">
              <div>
                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest block">
                  Auteur
                </span>
                <span className="text-sm text-white font-bold">
                  {activeFragment.author}
                </span>
              </div>
              <div>
                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest block">
                  Fragment uit
                </span>
                <span className="text-sm text-slate-300 italic">
                  {activeFragment.source}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-auto p-6 rounded-2xl bg-white/5 border border-white/5 flex items-start gap-3">
            <Brain size={20} className="text-indigo-400 shrink-0 mt-1" />
            <div>
              <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-1">
                Elite Tip
              </h4>
              <p className="text-[10px] text-slate-500 leading-relaxed font-light">
                Op het examen moet je vaak zinnen citeren om je antwoord te
                onderbouwen. Oefen hier met het isoleren van de kern van het
                argument.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Text Stage */}
        <div className="lg:col-span-8 flex flex-col gap-6 h-full">
          <div className="flex-1 bg-white/[0.03] border border-white/10 rounded-[2rem] p-12 relative overflow-hidden flex flex-col">
            <div className="flex-1 flex flex-wrap content-start gap-y-2 gap-x-1 font-serif text-2xl leading-[1.6] text-slate-300">
              {sentences.map((sentence, idx) => {
                const isSelected = selectedIndices.includes(idx);
                const isSolution = activeFragment.solutionIndices.includes(idx);
                const isCorrectMatch = isSelected && isSolution;
                const isWrongMatch = isSelected && !isSolution;
                const isMissed = !isSelected && isSolution && showSolution;

                return (
                  <span
                    key={idx}
                    onClick={() => toggleSentence(idx)}
                    className={`
                      cursor-pointer transition-all duration-300 px-1 rounded-md
                      ${isSelected ? "bg-indigo-500/40 text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]" : "hover:bg-white/5"}
                      ${showSolution && isSolution ? "underline decoration-violet-500 decoration-4 underline-offset-8" : ""}
                      ${showSolution && isCorrectMatch ? "bg-emerald-500/30 ring-1 ring-emerald-500/50" : ""}
                      ${showSolution && isWrongMatch ? "bg-rose-500/30 ring-1 ring-rose-500/50" : ""}
                      ${showSolution && isMissed ? "bg-amber-500/10" : ""}
                    `}
                  >
                    {sentence}
                  </span>
                );
              })}
            </div>

            <div className="mt-12 flex items-center justify-between pt-8 border-t border-white/5">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                {selectedIndices.length} zin(nen) geselecteerd
              </p>

              <div className="flex gap-4">
                <button
                  onClick={reset}
                  className="p-4 rounded-2xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                  title="Reset"
                >
                  <RefreshCw size={20} />
                </button>
                <button
                  onClick={checkAnalysis}
                  disabled={selectedIndices.length === 0 || showSolution}
                  className="px-10 h-14 rounded-2xl bg-violet-600 text-white font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 transition-all hover:bg-violet-500 hover:scale-105 shadow-lg shadow-violet-600/20 disabled:opacity-20"
                >
                  <Eye size={18} />
                  Analyseer
                </button>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {showSolution && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className={`p-8 rounded-[2rem] border shadow-2xl flex items-center gap-6 
                  ${isCorrect ? "bg-emerald-950/20 border-emerald-500/20" : "bg-rose-950/20 border-rose-500/20"}
                `}
              >
                <div
                  className={`p-4 rounded-2xl ${isCorrect ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}
                >
                  {isCorrect ? (
                    <CheckCircle2 size={32} />
                  ) : (
                    <AlertCircle size={32} />
                  )}
                </div>
                <div>
                  <h4 className="text-xl font-black text-white mb-1">
                    {isCorrect ? "Scherpe Observatie!" : "Niet Helemaal..."}
                  </h4>
                  <p className="text-sm text-slate-400 font-medium leading-relaxed">
                    {isCorrect
                      ? "Je hebt exact de zinnen geïsoleerd die de kern van het argument vormen. Dit is cruciaal voor een hoog cijfer op je PTA."
                      : "Kijk goed naar de onderstreepte zinnen. Hierin wordt direct de link gelegd tussen de onophoudelijke beweging en het onsterfelijke karakter van de ziel."}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const Target = ({ className, size }: { className?: string; size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size || 24}
    height={size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);
