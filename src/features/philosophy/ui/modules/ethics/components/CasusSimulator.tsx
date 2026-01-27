/* eslint-disable @typescript-eslint/no-explicit-any */
import { geminiGenerate } from "@shared/api/geminiBase";
import { useTranslations } from "@shared/hooks/useTranslations";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  BookOpen,
  Brain,
  CheckCircle2,
  Newspaper,
  RefreshCw,
  Send,
  ShieldCheck,
} from "lucide-react";
import React, { useState } from "react";

// --- TYPES ---
interface CaseStudy {
  id: string;
  category: "Techniek" | "Samenleving" | "Individu";
  title: string;
  description: string;
  source: string;
  question: string;
  requiredKeywords: string[];
}

const GENERATE_CASE_PROMPT = (category: string) => `
    Genereer een unieke, complexe ethische casus voor VWO filosofie leerlingen.
    Categorie: ${category}
    
    Format (JSON):
    {
        "id": "uuid",
        "category": "${category}",
        "title": "Korte pakkende titel",
        "description": "Een gedetailleerde situatieschets van 3-4 zinnen. Moet een moreel dilemma bevatten.",
        "source": "Fictieve maar realistische bron (bijv. 'De Groene Amsterdammer, 2026')",
        "question": "Een filosofische hoofdvraag die toepasbaar is op deze casus.",
        "requiredKeywords": ["3-4 verplichte filosofische begrippen die relevant zijn"]
    }
`;

// --- OVERLAYS ---
const TheoryHUD = ({
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
              <ShieldCheck className="text-emerald-400" />
              <span className="text-sm font-black text-white uppercase tracking-widest">
                Morele Kaders
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <CheckCircle2 className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-8">
            <div className="space-y-2">
              <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest">
                1. Utilisme (Gevolgs)
              </h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                "Het grootste geluk voor het grootste aantal."
                <br />
                <em className="text-slate-600 block mt-1">
                  Focus: Kosten-baten analyse, welzijn maximaliseren.
                </em>
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-black text-sky-400 uppercase tracking-widest">
                2. Plichtethiek (Deontologie)
              </h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                "Handel alleen volgens die regel waarvan je tegelijk kunt willen
                dat het een algemene wet wordt." (Kant)
                <br />
                <em className="text-slate-600 block mt-1">
                  Focus: Principes, rechten, autonomie, geen mensen als middel
                  gebruiken.
                </em>
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-black text-rose-400 uppercase tracking-widest">
                3. Deugdethiek
              </h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                "Wat zou een voortreffelijk (deugdzaam) mens doen?"
                <br />
                <em className="text-slate-600 block mt-1">
                  Focus: Karakter, het juiste midden, Eudaimonia.
                </em>
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 mt-8">
              <div className="flex items-center gap-2 mb-2">
                <Brain size={14} className="text-indigo-400" />
                <span className="text-[10px] font-black uppercase text-indigo-400">
                  Examenaanpak
                </span>
              </div>
              <p className="text-[10px] text-slate-400 italic">
                Bij elke casus: identificeer eerst de betrokken waarden. Pas dan
                systematisch één van de drie kaders toe om tot een oordeel te
                komen. Vermijd de "naturalistic fallacy" (is = moet).
              </p>
            </div>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

export const CasusSimulator: React.FC = () => {
  const { t } = useTranslations();
  const [activeCase, setActiveCase] = useState<CaseStudy | null>(null);
  const [showTheory, setShowTheory] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [geminiFeedback, setGeminiFeedback] = useState<{
    score: number;
    points: string[];
    missingKeywords: string[];
    geminiFeedback: string;
  } | null>(null);

  const generateCase = async (
    category: "Techniek" | "Samenleving" | "Individu",
  ) => {
    setIsLoading(true);
    setActiveCase(null);
    setGeminiFeedback(null);
    setUserAnswer("");

    try {
      const result = await geminiGenerate(GENERATE_CASE_PROMPT(category), "", {
        jsonMode: true,
      });
      if (!result || !result.content) return;
      const newCase = JSON.parse(result.content.replace(/```json|```/g, ""));
      setActiveCase(newCase);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!userAnswer || isAnalyzing || !activeCase) return;
    setIsAnalyzing(true);
    setGeminiFeedback(null);

    try {
      const prompt = `
        Context: VWO Filosofie Examen Voorbereiding.
        Casus: ${activeCase.description}
        Opdracht: ${activeCase.question}
        Vereiste trefwoorden: ${activeCase.requiredKeywords.join(", ")}
        
        Antwoord van de student: "${userAnswer}"
        
        Taak:
        1. Controleer of de student de vereiste trefwoorden heeft gebruikt en CORRECT heeft toegepast.
        2. Geef een score van 0 tot 10, waarbij trefwoorden cruciaal zijn.
        3. Noem welke termen ontbreken of foutief gebruikt zijn.
        4. Geef een constructieve 'Elite' feedback in de stijl van een strenge maar rechtvaardige examinator.
        
        Return JSON format:
        {
          "score": number,
          "points": string[],
          "missingKeywords": string[],
          "geminiFeedback": string
        }
      `;

      const result = await geminiGenerate(prompt, "", { jsonMode: true });
      if (!result || !result.content) return;
      const data = JSON.parse(result.content.replace(/```json|```/g, ""));
      setGeminiFeedback(data);
    } catch (error) {
      console.error(error);
      alert("Er ging iets mis bij de analyse.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setUserAnswer("");
    setUserAnswer("");
    setGeminiFeedback(null);
  };

  return (
    <div className="w-full h-full flex flex-col p-8 gap-8 bg-black overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Newspaper size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">
              {t("philosophy.ethics.casus.title")}
            </h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
              {t("philosophy.ethics.casus.subtitle")}
            </p>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <button
            onClick={() => setShowTheory(true)}
            className="p-3 mr-2 rounded-xl bg-white/5 border border-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 text-slate-400 transition-all group"
            title="Open Theorieboek"
          >
            <BookOpen
              size={20}
              className="group-hover:scale-110 transition-transform"
            />
          </button>
          <div className="flex gap-2">
            {["Techniek", "Samenleving", "Individu"].map((cat) => (
              <button
                key={cat}
                onClick={() => generateCase(cat as any)}
                disabled={isLoading}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border
                            ${
                              activeCase?.category === cat
                                ? "bg-white text-black border-white"
                                : "bg-white/5 text-slate-500 border-white/5 hover:border-white/10 hover:text-white"
                            }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
        {/* Left: The Source */}
        {/* Left: The Source */}
        <div className="flex flex-col gap-6">
          <div className="flex-1 bg-white/[0.03] border border-white/10 rounded-[2rem] p-8 relative overflow-hidden group min-h-[500px]">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <BookOpen size={120} />
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <RefreshCw
                  className="animate-spin text-emerald-500"
                  size={48}
                />
                <p className="text-sm font-black uppercase tracking-widest text-emerald-500">
                  {t("philosophy.ethics.casus.generate")}
                </p>
                <p className="text-xs text-slate-500">
                  {t("philosophy.ethics.casus.generating_subtitle")}
                </p>
              </div>
            ) : activeCase ? (
              <div className="relative z-10 h-full flex flex-col">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest w-fit mb-4">
                  {activeCase.category}
                </span>
                <h3 className="text-2xl font-black text-white mb-2">
                  {activeCase.title}
                </h3>
                <p className="text-[10px] text-slate-500 font-mono mb-6 italic">
                  {activeCase.source}
                </p>

                <div className="flex-1 text-slate-300 leading-relaxed font-serif text-lg">
                  "{activeCase.description}"
                </div>

                <div className="mt-8 p-6 bg-black/40 rounded-2xl border border-white/5 border-l-4 border-l-amber-500">
                  <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest mb-2">
                    {t("philosophy.ethics.casus.exam_assignment")}
                  </h4>
                  <p className="text-white text-sm font-bold leading-relaxed">
                    {activeCase.question}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-40">
                <Newspaper size={48} />
                <p className="text-sm font-black uppercase tracking-widest">
                  {t("philosophy.ethics.casus.select_category")}
                </p>
              </div>
            )}
          </div>

          {activeCase && (
            <div className="bg-emerald-950/20 border border-emerald-500/20 p-6 rounded-2xl">
              <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <ShieldCheck size={14} />{" "}
                {t("philosophy.ethics.casus.required_terms")}
              </h4>
              <div className="flex flex-wrap gap-2">
                {activeCase.requiredKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-[10px] text-emerald-300 font-mono transition-colors hover:bg-emerald-500/20"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Answer & Feedback */}
        <div className="flex flex-col gap-6">
          <div className="flex-1 flex flex-col relative">
            <textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder={t("philosophy.ethics.casus.placeholder")}
              className="flex-1 w-full bg-white/5 border border-white/10 rounded-[2rem] p-8 text-white placeholder:text-slate-600 focus:border-emerald-500/50 focus:outline-none transition-all resize-none shadow-2xl font-light text-lg"
            />

            <div className="absolute bottom-6 right-6 flex gap-3">
              <button
                onClick={reset}
                className="p-4 rounded-2xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                title="Schoon tekstveld"
              >
                <RefreshCw size={20} />
              </button>
              <button
                onClick={handleAnalyze}
                disabled={!userAnswer || isAnalyzing}
                className={`
                  px-10 h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 transition-all
                  ${isAnalyzing ? "bg-emerald-900/50 text-emerald-300" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:scale-105 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20"}
                  disabled:opacity-20 disabled:cursor-not-allowed
                `}
              >
                {isAnalyzing ? (
                  <RefreshCw className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
                {isAnalyzing
                  ? t("philosophy.ethics.casus.analyze_button")
                  : t("philosophy.ethics.casus.submit_button")}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {geminiFeedback && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className="bg-black/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-8 shadow-2xl space-y-6"
              >
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-3 rounded-xl ${geminiFeedback.score >= 5.5 ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}
                    >
                      {geminiFeedback.score >= 5.5 ? (
                        <CheckCircle2 />
                      ) : (
                        <AlertCircle />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">
                        {t("philosophy.ethics.casus.result")}
                      </h4>
                      <p className="text-2xl font-black text-white">
                        {geminiFeedback.score}/10
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Brain className="text-indigo-400" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                      {t("philosophy.ethics.casus.ai_examiner")}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-slate-300 leading-relaxed font-medium italic border-l-2 border-emerald-500/30 pl-4 py-1">
                    "{geminiFeedback.geminiFeedback}"
                  </p>

                  {geminiFeedback.missingKeywords.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2">
                        {t("philosophy.ethics.casus.missed_points")}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {geminiFeedback.missingKeywords.map((kw) => (
                          <span
                            key={kw}
                            className="text-[10px] text-rose-300 font-bold line-through opacity-60"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <TheoryHUD isOpen={showTheory} onClose={() => setShowTheory(false)} />
    </div>
  );
};
