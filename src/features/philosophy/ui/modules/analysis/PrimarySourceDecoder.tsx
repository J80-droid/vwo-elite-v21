import { useTranslations } from "@shared/hooks/useTranslations";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Filter,
  HelpCircle,
  Highlighter,
  Info,
  Search,
  X,
} from "lucide-react";
import React, { useState } from "react";

// --- THEORY HUD ---
const AnalysisTheoryHUD = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        />
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 h-full w-full max-w-sm bg-black/95 border-l border-white/10 p-8 z-50 overflow-y-auto shadow-2xl"
        >
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-2">
              <Filter className="text-violet-400" />
              <span className="text-sm font-black text-white uppercase tracking-widest">
                Examenlezen
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-8">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/10">
              <div className="flex items-center gap-2 mb-3">
                <Filter size={16} className="text-violet-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white">
                  Focus: Examenlezen
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-light">
                Onderscheid maken tussen{" "}
                <span className="text-white font-bold italic">
                  instrumentele
                </span>{" "}
                en{" "}
                <span className="text-amber-400 font-bold italic">
                  ontologische
                </span>{" "}
                opvattingen is cruciaal voor het techniek-onderwerp.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-black/40 border border-white/5 flex items-start gap-3">
              <Search size={20} className="text-fuchsia-400 shrink-0 mt-1" />
              <div>
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-1">
                  Citeren is Weten
                </h4>
                <p className="text-[10px] text-slate-500 leading-relaxed font-light">
                  Gebruik de X-Ray om de diepere betekenis achter archaïsch
                  taalgebruik te begrijpen. Klik op gemarkeerde termen voor
                  uitleg.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-white/10 pb-2">
                Examenthema 2025: Heidegger
              </h4>
              <div className="space-y-2">
                <div className="text-[10px] text-amber-500 font-bold uppercase">
                  Gestell
                </div>
                <p className="text-sm text-slate-300">
                  Het "bestel": de moderne techniek dwingt de natuur om energie
                  als voorraad te leveren.
                </p>
              </div>
              <div className="space-y-2">
                <div className="text-[10px] text-amber-500 font-bold uppercase">
                  Techne vs Poiesis
                </div>
                <p className="text-sm text-slate-300">
                  Instrumentele vs ontologische techniek: maken/beheersen vs
                  laten verschijnen.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

// --- TYPES ---
interface TermDefinition {
  term: string;
  definition: string;
  context: string;
}

interface TextSegment {
  id: string;
  text: string;
  isTerm?: boolean;
  termData?: TermDefinition;
  isTargetAnswer?: boolean;
}

// --- MOCK DATA: Martin Heidegger (Examenthema 2025) ---
const PRIMARY_TEXT: TextSegment[] = [
  {
    id: "s1",
    text: "Het wezen van de techniek is in geen enkel opzicht iets technisch. ",
  },
  {
    id: "s2",
    text: "Zolang wij de techniek slechts instrumenteel opvatten – als een middel tot een doel – blijven wij ",
  },
  {
    id: "s3",
    text: "gevangen in de wil tot beheersing",
    isTerm: true,
    termData: {
      term: "Wil tot beheersing",
      definition:
        "De menselijke drang om de natuur en omgeving te controleren.",
      context:
        "Bij Heidegger: De moderne techniek dwingt de natuur om energie te leveren (Bestand), in plaats van haar te laten verschijnen (Poiesis).",
    },
  },
  {
    id: "s4",
    text: ". Wij menen de meesters te zijn, maar zijn in werkelijkheid slechts functionarissen van het ",
  },
  {
    id: "s5",
    text: "Gestell",
    isTerm: true,
    termData: {
      term: "Gestell",
      definition: "Het raamwerk / Het bestel.",
      context:
        "Hét kernbegrip van Heidegger. De manier waarop de moderne techniek de wereld aan ons toont: als een voorraadschuur van grondstoffen die op afroep beschikbaar moet zijn.",
    },
  },
  {
    id: "s6",
    text: ". De ware aard van de techniek openbaart zich niet in machines, maar in de wijze waarop wij de werkelijkheid ontbergen.",
  },
  {
    id: "s7",
    text: " De techniek is dus geen neutraal instrument, maar een manier van waarheid-onthulling.",
    isTargetAnswer: true,
  },
];

export const PrimarySourceDecoder: React.FC = () => {
  const { t } = useTranslations();
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);
  const [mode, setMode] = useState<"read" | "annotate">("read");
  const [selection, setSelection] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const [showTheory, setShowTheory] = useState(false);

  const handleTermClick = (segment: TextSegment) => {
    if (mode === "annotate") return;
    if (segment.isTerm && segment.termData) {
      setSelectedConcept(segment.termData.term);
    } else {
      setSelectedConcept(null);
    }
  };

  const handleSegmentClick = (segment: TextSegment) => {
    if (mode !== "annotate") return;
    setSelection(segment.id);
    if (segment.isTargetAnswer) {
      setFeedback("success");
    } else {
      setFeedback("error");
    }
  };

  return (
    <div className="w-full h-full flex flex-col p-8 gap-8 bg-black overflow-y-auto font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400">
            <BookOpen size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">
              Source Decoder
            </h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
              Martin Heidegger: Die Frage nach der Technik
            </p>
          </div>
        </div>

        {/* Theory Button + Mode Switcher */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTheory(true)}
            className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-all border border-violet-500/20"
            title="Open Theorie"
          >
            <BookOpen size={18} />
          </button>
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
            <button
              onClick={() => {
                setMode("read");
                setFeedback("idle");
                setSelection(null);
              }}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                mode === "read"
                  ? "bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 shadow-[0_0_15px_rgba(232,121,249,0.2)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Search size={14} /> X-Ray
            </button>
            <button
              onClick={() => {
                setMode("annotate");
                setSelectedConcept(null);
              }}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                mode === "annotate"
                  ? "bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 shadow-[0_0_15px_rgba(232,121,249,0.2)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Highlighter size={14} /> Analyseer
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0">
        {/* Left: Primary Text */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div
            className={`flex-1 bg-white/[0.03] rounded-[2.5rem] border p-12 overflow-y-auto leading-[1.8] text-xl font-serif relative transition-all duration-500
                        ${mode === "annotate" ? "border-fuchsia-500/30 shadow-[0_0_50px_rgba(232,121,249,0.05)]" : "border-white/10"}
                    `}
          >
            {PRIMARY_TEXT.map((segment) => {
              let bgClass = "";
              let textClass = "text-slate-300";
              let cursorClass = "cursor-text";

              if (mode === "read" && segment.isTerm) {
                textClass =
                  "text-fuchsia-200 border-b-2 border-fuchsia-500/30 border-dashed hover:border-fuchsia-500 transition-colors";
                cursorClass = "cursor-pointer hover:bg-fuchsia-500/10";
                if (selectedConcept === segment.termData?.term) {
                  bgClass = "bg-fuchsia-500/20 rounded-lg px-1 -mx-1";
                  textClass = "text-fuchsia-100 border-none";
                }
              }

              if (mode === "annotate") {
                cursorClass =
                  "cursor-pointer hover:bg-fuchsia-500/10 rounded-lg px-1 -mx-1 transition-all";
                if (selection === segment.id) {
                  if (feedback === "success") {
                    bgClass =
                      "bg-emerald-500/20 ring-1 ring-emerald-500/50 rounded-lg px-1 -mx-1";
                    textClass = "text-emerald-100";
                  } else if (feedback === "error") {
                    bgClass =
                      "bg-rose-500/20 ring-1 ring-rose-500/50 rounded-lg px-1 -mx-1";
                    textClass = "text-rose-100";
                  } else {
                    bgClass =
                      "bg-fuchsia-500/20 ring-1 ring-fuchsia-500/50 rounded-lg px-1 -mx-1";
                    textClass = "text-fuchsia-100";
                  }
                }
              }

              return (
                <span
                  key={segment.id}
                  onClick={() =>
                    mode === "read"
                      ? handleTermClick(segment)
                      : handleSegmentClick(segment)
                  }
                  className={`transition-all duration-300 ${cursorClass} ${bgClass} ${textClass}`}
                >
                  {segment.text}
                </span>
              );
            })}
          </div>
        </div>

        {/* Right: Decoder / Assignment */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <AnimatePresence mode="wait">
            {mode === "read" ? (
              <motion.div
                key="read-pane"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="h-full"
              >
                <div className="bg-white/[0.03] backdrop-blur-3xl rounded-[2.5rem] border border-white/10 p-10 h-full relative overflow-hidden flex flex-col">
                  {!selectedConcept ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-center space-y-4 opacity-40">
                      <div className="bg-fuchsia-500/10 rounded-2xl p-6 border border-fuchsia-500/20 text-center animate-pulse">
                        <Search size={40} />
                      </div>
                      <p className="text-sm font-bold uppercase tracking-widest max-w-[200px]">
                        {t("philosophy.analysis.select_concept")}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      <div className="mb-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-fuchsia-500 mb-2 block">
                          {t("philosophy.analysis.xray_concept")}
                        </span>
                        <h3 className="text-3xl font-black text-white italic">
                          {selectedConcept}
                        </h3>
                      </div>

                      <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-white/5 border-l-4 border-slate-600">
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                            Definitie
                          </h4>
                          <p className="text-slate-300 italic text-lg leading-relaxed font-serif">
                            "
                            {
                              PRIMARY_TEXT.find(
                                (s) => s.termData?.term === selectedConcept,
                              )?.termData?.definition
                            }
                            "
                          </p>
                        </div>

                        <div className="p-6 rounded-2xl bg-fuchsia-500/5 border border-fuchsia-500/20 border-l-4 border-fuchsia-500 shadow-xl shadow-fuchsia-500/5">
                          <h4 className="text-[10px] font-black text-fuchsia-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Info size={14} /> Examen Focus
                          </h4>
                          <p className="text-fuchsia-100/90 leading-relaxed font-medium">
                            {
                              PRIMARY_TEXT.find(
                                (s) => s.termData?.term === selectedConcept,
                              )?.termData?.context
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="annotate-pane"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="h-full flex flex-col"
              >
                <div className="bg-fuchsia-900/10 backdrop-blur-3xl rounded-[2.5rem] border border-fuchsia-500/20 p-10 h-full flex flex-col shadow-2xl">
                  <div className="flex items-center gap-3 text-fuchsia-400 font-black mb-6 uppercase text-[10px] tracking-[0.3em]">
                    <HelpCircle size={16} /> Analyse Opdracht
                  </div>

                  <div className="bg-black/40 p-8 rounded-3xl border border-white/5 mb-8">
                    <h3 className="text-2xl font-black text-white leading-snug">
                      Markeer de zin waarin Heidegger stelt dat techniek een{" "}
                      <span className="text-fuchsia-400 italic font-serif">
                        ontologisch
                      </span>{" "}
                      effect heeft op de werkelijkheid.
                    </h3>
                  </div>

                  <div className="mt-auto">
                    <AnimatePresence mode="wait">
                      {feedback === "idle" && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="p-6 rounded-2xl bg-white/5 border border-white/5 text-slate-500 text-xs font-bold uppercase tracking-widest text-center"
                        >
                          Klik op een zin in de brontekst...
                        </motion.div>
                      )}

                      {feedback === "success" && (
                        <motion.div
                          initial={{ scale: 0.95, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="p-8 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 shadow-xl shadow-emerald-500/5"
                        >
                          <div className="flex items-center gap-3 text-emerald-400 font-black mb-3 uppercase text-xs tracking-widest">
                            <CheckCircle2 size={24} /> Elite Analyse
                          </div>
                          <p className="text-emerald-100/80 text-sm leading-relaxed mb-6 font-medium">
                            Correct. "Waarheid-onthulling" (Aletheia) is de kern
                            van Heideggers ontologische techniekfilosofie.
                          </p>
                          <button className="w-full py-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/50 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 group">
                            Volgende Fragment{" "}
                            <ArrowRight
                              size={18}
                              className="group-hover:translate-x-1 transition-transform"
                            />
                          </button>
                        </motion.div>
                      )}

                      {feedback === "error" && (
                        <motion.div
                          initial={{ x: [-10, 10, -10, 10, 0], opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          className="p-8 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-center"
                        >
                          <div className="text-rose-400 font-black uppercase text-xs tracking-widest mb-2">
                            Herstel Nodig
                          </div>
                          <p className="text-rose-100/80 text-sm leading-relaxed font-medium">
                            Deze zin beschrijft een actie of instrument, niet
                            het 'zijn' of de 'waarheid' van de techniek.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <AnalysisTheoryHUD
        isOpen={showTheory}
        onClose={() => setShowTheory(false)}
      />
    </div>
  );
};
