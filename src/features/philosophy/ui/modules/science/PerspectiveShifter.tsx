/* eslint-disable @typescript-eslint/no-explicit-any */
import { geminiGenerate } from "@shared/api/geminiBase";
import { useTranslations } from "@shared/hooks/useTranslations";
import { motion } from "framer-motion";
import {
  Binary,
  BrainCircuit,
  Eye,
  Fingerprint,
  Loader2,
  Maximize2,
  Microscope,
  RefreshCw,
  Send,
} from "lucide-react";
import React, { useState } from "react";

// --- TYPES ---
type ScientificLens = "behaviorism" | "umwelt" | "situated";

interface LensConfig {
  id: ScientificLens;
  title: string;
  philosopher: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
}

const getLensesConfig = (t: any): Record<ScientificLens, LensConfig> => ({
  behaviorism: {
    id: "behaviorism",
    title: t("philosophy.science.lenses.behaviorism.title"),
    philosopher: t("philosophy.science.lenses.behaviorism.philosopher"),
    description: t("philosophy.science.lenses.behaviorism.description"),
    icon: Binary,
    color: "text-slate-400",
    bgColor: "bg-slate-500/10",
    borderColor: "border-slate-500/20",
  },
  umwelt: {
    id: "umwelt",
    title: t("philosophy.science.lenses.umwelt.title"),
    philosopher: t("philosophy.science.lenses.umwelt.philosopher"),
    description: t("philosophy.science.lenses.umwelt.description"),
    icon: Fingerprint,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
  },
  situated: {
    id: "situated",
    title: t("philosophy.science.lenses.situated.title"),
    philosopher: t("philosophy.science.lenses.situated.philosopher"),
    description: t("philosophy.science.lenses.situated.description"),
    icon: Maximize2,
    color: "text-teal-400",
    bgColor: "bg-teal-500/10",
    borderColor: "border-teal-500/20",
  },
});

export const PerspectiveShifter: React.FC = () => {
  const { t } = useTranslations();
  const LENSES = getLensesConfig(t);
  const [phase, setPhase] = useState<
    "setup" | "generating" | "observation" | "analysis" | "feedback"
  >("setup");
  const [activeLens, setActiveLens] = useState<ScientificLens>("behaviorism");
  const [animalEvent, setAnimalEvent] = useState<{
    animal: string;
    event: string;
  } | null>(null);
  const [userAnalysis, setUserAnalysis] = useState("");
  const [aiFeedback, setAiFeedback] = useState<{
    score: number;
    comment: string;
    tip: string;
  } | null>(null);

  // --- AI ACTIONS ---
  const generateScenario = async () => {
    setPhase("generating");
    setAnimalEvent(null);
    setAiFeedback(null);
    setUserAnalysis("");

    try {
      const prompt = `
                Genereer een kort, boeiend ethologisch scenario (max 2 zinnen) waarin een dier (geen huisdier) intelligent gedraagt.
                Het moet ambigu genoeg zijn voor filosofische interpretatie.
                Format JSON: { "animal": "Diersoort", "event": "Beschrijving van de gebeurtenis..." }
            `;
      const result = await geminiGenerate(prompt, "", { jsonMode: true });
      if (!result || !result.content) throw new Error("No response generated");
      const data = JSON.parse(result.content.replace(/```json|```/g, ""));

      setAnimalEvent(data);
      setPhase("observation");
    } catch (e) {
      console.error(e);
      // Fallback
      setAnimalEvent({
        animal: "Octopus",
        event:
          "De octopus verandert plotseling van kleur en textuur terwijl hij slaapt, alsof hij reageert op een droom.",
      });
      setPhase("observation");
    }
  };

  const submitAnalysis = async () => {
    if (!animalEvent) return;
    setPhase("generating"); // Re-use loading state

    try {
      const prompt = `
                Scenario: "${animalEvent.event}"
                Gekozen Lens: "${LENSES[activeLens].title}" (${LENSES[activeLens].description})
                Student Analyse: "${userAnalysis}"

                Beoordeel de analyse.
                - Voor Behaviorism: Straf elk gebruik van mentale termen ("wil", "denkt", "voelt"). Het moet mechanisch zijn.
                - Voor Umwelt: Beloon speculatie over zintuiglijke ervaring (echolocatie, geur, etc.).
                - Voor Situated: Beloon reflectie op de observeerder-relatie.
                
                Geef JSON: { "score": 0-100, "comment": "Korte feedback", "tip": "Filosofische tip" }
            `;
      const result = await geminiGenerate(prompt, "", { jsonMode: true });
      if (!result || !result.content) throw new Error("No feedback generated");
      const feedbackData = JSON.parse(
        result.content.replace(/```json|```/g, ""),
      );

      setAiFeedback(feedbackData);
      setPhase("feedback");
    } catch (e) {
      console.error(e);
      setAiFeedback({
        score: 70,
        comment: t("philosophy.science.fallback_comment"),
        tip: t("philosophy.science.fallback_tip"),
      });
      setPhase("feedback");
    }
  };

  return (
    <div className="w-full h-full flex flex-col p-8 gap-8 bg-black overflow-y-auto font-sans">
      {/* HEADER */}
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
            <Microscope size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">
              {t("philosophy.science.title")}
            </h2>
            <p className="text-slate-500 text-xs font-black uppercase tracking-widest mt-1 italic">
              {t("philosophy.science.subtitle")}
            </p>
          </div>
        </div>

        {phase !== "setup" && phase !== "generating" && (
          <button
            onClick={() => setPhase("setup")}
            className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} /> {t("philosophy.science.reset")}
          </button>
        )}
      </header>

      <main className="flex-1 flex flex-col items-center justify-center relative">
        {/* SETUP PHASE */}
        {phase === "setup" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {(Object.keys(LENSES) as ScientificLens[]).map((lens) => (
              <button
                key={lens}
                onClick={() => {
                  setActiveLens(lens);
                  generateScenario();
                }}
                className={`
                                    relative p-8 rounded-[2rem] border transition-all duration-300 group text-left h-full flex flex-col
                                    ${activeLens === lens ? `${LENSES[lens].bgColor} ${LENSES[lens].borderColor}` : "bg-white/5 border-white/10 hover:border-white/20"}
                                `}
              >
                <div
                  className={`mb-6 p-4 rounded-2xl w-fit ${LENSES[lens].bgColor} ${LENSES[lens].color}`}
                >
                  {React.createElement(LENSES[lens].icon, { size: 32 })}
                </div>
                <h3
                  className={`text-2xl font-black uppercase italic mb-2 ${LENSES[lens].color}`}
                >
                  {LENSES[lens].title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-8 flex-1">
                  {LENSES[lens].description}
                </p>
                <div
                  className={`text-[10px] font-black uppercase tracking-widest opacity-50 ${LENSES[lens].color}`}
                >
                  {LENSES[lens].philosopher}
                </div>

                <div className="absolute inset-0 border-2 border-white/0 group-hover:border-white/10 rounded-[2rem] transition-colors" />
              </button>
            ))}
          </motion.div>
        )}

        {/* GENERATING / LOADING */}
        {phase === "generating" && (
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-teal-500/20 blur-xl rounded-full animate-pulse" />
              <Loader2 className="w-16 h-16 text-teal-400 animate-spin relative z-10" />
            </div>
            <p className="text-teal-400 font-bold uppercase tracking-widest animate-pulse">
              {t("philosophy.science.loading")}
            </p>
          </div>
        )}

        {/* OBSERVATION & ANALYSIS */}
        {(phase === "observation" || phase === "analysis") && animalEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-5xl flex flex-col md:flex-row gap-8 h-full min-h-[500px]"
          >
            {/* LEFT: THE OBSERVATION */}
            <div className="flex-1 bg-white/5 rounded-[3rem] border border-white/10 p-10 flex flex-col justify-center relative overflow-hidden group">
              <div
                className={`absolute inset-0 opacity-10 ${
                  activeLens === "behaviorism"
                    ? "bg-slate-500 mix-blend-saturation"
                    : activeLens === "umwelt"
                      ? "bg-amber-500 mix-blend-overlay"
                      : "bg-teal-500 mix-blend-screen"
                }`}
              />

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-black/40 text-white/60 text-[10px] font-black uppercase tracking-widest mb-6">
                  <Eye size={12} /> {t("philosophy.science.observation")}:{" "}
                  {animalEvent.animal}
                </div>
                <h3 className="text-4xl md:text-5xl font-black text-white leading-tight italic tracking-tighter mb-8">
                  "{animalEvent.event}"
                </h3>

                <div
                  className={`p-6 rounded-2xl border ${LENSES[activeLens].bgColor} ${LENSES[activeLens].borderColor}`}
                >
                  <div
                    className={`text-[10px] font-black uppercase tracking-widest mb-2 ${LENSES[activeLens].color}`}
                  >
                    {t("philosophy.science.your_lens")}:{" "}
                    {LENSES[activeLens].title}
                  </div>
                  <p className="text-slate-300 text-sm">
                    {LENSES[activeLens].description}
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT: THE ANALYSIS */}
            <div className="flex-1 flex flex-col gap-4 min-w-[300px]">
              <div className="flex-1 bg-black/40 rounded-[2.5rem] border border-white/10 p-8 flex flex-col min-h-[300px]">
                <label className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4 block">
                  {t("philosophy.science.logbook")}
                </label>
                <textarea
                  value={userAnalysis}
                  onChange={(e) => {
                    setUserAnalysis(e.target.value);
                    if (phase === "observation") setPhase("analysis");
                  }}
                  placeholder={t("philosophy.science.placeholder")}
                  className="flex-1 w-full bg-white/5 border border-white/10 rounded-xl p-4 text-lg text-white placeholder-slate-600 resize-none focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20 leading-relaxed font-serif italic min-h-[200px]"
                />
              </div>

              <button
                onClick={submitAnalysis}
                disabled={userAnalysis.length < 10}
                className={`
                                    w-full py-6 rounded-2xl font-black text-lg uppercase tracking-widest flex items-center justify-center gap-3 transition-all border
                                    ${
                                      userAnalysis.length >= 10
                                        ? "bg-teal-500/10 text-teal-400 border-teal-500/30 hover:bg-teal-500/20 hover:border-teal-500/50 hover:scale-[1.02] shadow-xl hover:shadow-teal-500/20"
                                        : "bg-white/5 text-slate-600 border-white/5 cursor-not-allowed"
                                    }
                                `}
              >
                <Send size={20} /> {t("philosophy.science.submit")}
              </button>
            </div>
          </motion.div>
        )}

        {/* FEEDBACK PHASE */}
        {phase === "feedback" && aiFeedback && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-12 text-center"
          >
            <div className="mb-8 flex justify-center">
              <div
                className={`
                                w-32 h-32 rounded-full flex items-center justify-center border-4 text-5xl font-black
                                ${aiFeedback.score >= 70 ? "border-emerald-500 text-emerald-400 bg-emerald-500/10" : "border-amber-500 text-amber-500 bg-amber-500/10"}
                            `}
              >
                {aiFeedback.score}
              </div>
            </div>

            <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-4">
              {aiFeedback.score >= 70
                ? t("philosophy.science.validation_success")
                : t("philosophy.science.hypothesis_rejected")}
            </h3>

            <p className="text-lg text-slate-300 leading-relaxed mb-8">
              {aiFeedback.comment}
            </p>

            <div className="bg-white/5 rounded-2xl p-6 border border-white/5 text-left flex gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 h-fit">
                <BrainCircuit size={24} />
              </div>
              <div>
                <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">
                  {t("philosophy.science.coach_tip")}
                </div>
                <p className="text-slate-400 text-sm">{aiFeedback.tip}</p>
              </div>
            </div>

            <button
              onClick={() => setPhase("setup")}
              className="mt-12 w-full py-5 rounded-2xl bg-white text-black font-black uppercase tracking-widest hover:bg-slate-200 transition-colors"
            >
              {t("philosophy.science.next")}
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
};
