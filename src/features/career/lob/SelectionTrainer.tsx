import { getSJTScenariosSQL } from "@shared/api/sqliteService";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Brain,
  CheckCircle,
  GraduationCap,
  Heart,
} from "lucide-react";
import React, { useEffect, useState } from "react";

interface Scenario {
  id: number;
  question: string;
  context: string;
  options: string[];
  bestIndex: number;
  rationale: string;
}

export const SelectionTrainer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"info" | "sjt">("info");
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [currentScenario, setCurrentScenario] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const load = async () => {
      const data = await getSJTScenariosSQL();
      setScenarios(data);
    };
    load();
  }, []);

  const handleAnswer = (index: number) => {
    setSelectedOption(index);
    setShowFeedback(true);
    if (
      scenarios.length > 0 &&
      index === scenarios[currentScenario]!.bestIndex
    ) {
      setScore((prev) => prev + 1);
    }
  };

  const nextScenario = () => {
    if (currentScenario < scenarios.length - 1) {
      setCurrentScenario((prev) => prev + 1);
      setSelectedOption(null);
      setShowFeedback(false);
    } else {
      // End of test
      alert(`Test Klaar! Je score: ${score}/${scenarios.length}`);
      // Reset for demo purposes
      setCurrentScenario(0);
      setSelectedOption(null);
      setShowFeedback(false);
      setScore(0);
    }
  };

  return (
    <div className="min-h-screen bg-black/90 font-outfit text-white p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-500 to-pink-600 bg-clip-text text-transparent flex items-center justify-center gap-3">
            <Activity className="text-red-500" size={40} />
            Selectie Bootcamp
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Numerus Fixus? Decentrale Selectie? Bereid je voor op de zwaarste
            toelatingseisen. Train je CV, motivatie en{" "}
            <span className="text-white font-bold">non-cognitieve skills</span>.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setActiveTab("info")}
            className={`px-6 py-3 rounded-xl font-bold transition-all border ${
              activeTab === "info"
                ? "bg-red-500/10 border-red-500/50 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                : "bg-white/5 border-white/10 hover:bg-white/10 text-slate-400"
            }`}
          >
            ℹ️ Hoe werkt het?
          </button>
          <button
            onClick={() => setActiveTab("sjt")}
            className={`px-6 py-3 rounded-xl font-bold transition-all border ${
              activeTab === "sjt"
                ? "bg-red-500/10 border-red-500/50 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                : "bg-white/5 border-white/10 hover:bg-white/10 text-slate-400"
            }`}
          >
            🧠 Doe de Skills Test (SJT)
          </button>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === "info" ? (
            <motion.div
              key="info"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/5 border border-white/10 rounded-3xl p-8 grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <Brain size={24} />
                </div>
                <h3 className="text-xl font-bold">Cognitief</h3>
                <p className="text-slate-400 text-sm">
                  Kennis-toetsen (Biologie, Natuurkunde) en logisch redeneren.
                  Dit leer je op school.
                  <em> Tip: Begin 3 maanden van tevoren met stof herhalen.</em>
                </p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center text-pink-400">
                  <Heart size={24} />
                </div>
                <h3 className="text-xl font-bold">Non-Cognitief</h3>
                <p className="text-slate-400 text-sm">
                  Wie ben jij? Empathie, samenwerken en integriteit. Vaak getest
                  via
                  <strong> Situational Judgment Tests (SJT)</strong>.
                </p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <GraduationCap size={24} />
                </div>
                <h3 className="text-xl font-bold">Motivatie</h3>
                <p className="text-slate-400 text-sm">
                  Waarom jij? Waarom hier? Wees specifiek. "Ik wil mensen
                  helpen" is te vaag. Vertel over jouw ervaringen in de zorg of
                  stages.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="sjt"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto"
            >
              {scenarios.length > 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-white/10">
                    <motion.div
                      className="h-full bg-red-500"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${((currentScenario + 1) / scenarios.length) * 100}%`,
                      }}
                    />
                  </div>

                  <div className="mb-6">
                    <span className="text-red-400 text-xs font-bold uppercase tracking-wider mb-2 block">
                      Scenario {currentScenario + 1} / {scenarios.length}
                    </span>
                    <h4 className="text-slate-400 font-bold mb-2">
                      {scenarios[currentScenario]!.context}
                    </h4>
                    <h3 className="text-xl font-bold text-white">
                      {scenarios[currentScenario]!.question}
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {scenarios[currentScenario]!.options.map((opt, idx) => (
                      <button
                        key={idx}
                        disabled={showFeedback}
                        onClick={() => handleAnswer(idx)}
                        className={`w-full p-4 rounded-xl text-left text-sm transition-all border ${
                          showFeedback
                            ? idx === scenarios[currentScenario]!.bestIndex
                              ? "bg-emerald-500/20 border-emerald-500 text-white"
                              : idx === selectedOption
                                ? "bg-red-500/20 border-red-500 text-white"
                                : "bg-white/5 border-transparent opacity-50"
                            : "bg-white/5 border-transparent hover:bg-white/10 hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                              showFeedback &&
                              idx === scenarios[currentScenario]!.bestIndex
                                ? "border-emerald-500 bg-emerald-500 text-black"
                                : "border-slate-500"
                            }`}
                          >
                            {showFeedback &&
                              idx === scenarios[currentScenario]!.bestIndex && (
                                <CheckCircle size={12} />
                              )}
                          </div>
                          {opt}
                        </div>
                      </button>
                    ))}
                  </div>

                  {showFeedback && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 p-4 bg-blue-500/20 border border-blue-500/30 rounded-xl"
                    >
                      <h4 className="font-bold text-blue-400 mb-1 flex items-center gap-2">
                        <Brain size={16} /> Expert Feedback
                      </h4>
                      <p className="text-sm text-slate-300">
                        {scenarios[currentScenario]!.rationale}
                      </p>
                      <button
                        onClick={nextScenario}
                        className="mt-4 px-6 py-2 bg-blue-500/10 border border-blue-500/50 hover:bg-blue-500/20 text-blue-400 rounded-lg font-bold text-sm transition-all shadow-[0_0_15px_rgba(59,130,246,0.1)] hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] flex items-center gap-2"
                      >
                        Volgende Scenario <ArrowRight size={16} />
                      </button>
                    </motion.div>
                  )}
                </div>
              ) : (
                <div className="text-center text-slate-400 py-12">
                  Scenarios laden...
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
