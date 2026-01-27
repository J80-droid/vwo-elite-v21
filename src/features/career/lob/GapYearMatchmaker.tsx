import { GAP_PROGRAMS, GAP_QUIZ } from "@shared/assets/data/gapYearData";
import { motion } from "framer-motion";
import { ArrowRight, Brain, Compass, Sparkles, Trophy } from "lucide-react";
import React, { useState } from "react";

// --- Types ---
type Archetype = "academic" | "adventure" | "career" | "personal";

interface Scores {
  academic: number;
  adventure: number;
  career: number;
  personal: number;
}

export const GapYearMatchmaker: React.FC<{ onClose: () => void }> = ({
  onClose,
}) => {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState<Scores>({
    academic: 0,
    adventure: 0,
    career: 0,
    personal: 0,
  });
  const [result, setResult] = useState<Archetype | null>(null);

  const handleAnswer = (optionScores: Partial<Scores>) => {
    const newScores = { ...scores };
    (Object.keys(optionScores) as Archetype[]).forEach((key) => {
      if (optionScores[key]) {
        newScores[key] += optionScores[key] || 0;
      }
    });
    setScores(newScores);

    if (step < GAP_QUIZ.length - 1) {
      setStep((prev) => prev + 1);
    } else {
      finishQuiz(newScores);
    }
  };

  const finishQuiz = (finalScores: Scores) => {
    // Determine winner
    let maxScore = -1;
    let winner: Archetype = "personal";

    (Object.keys(finalScores) as Archetype[]).forEach((key) => {
      if (finalScores[key] > maxScore) {
        maxScore = finalScores[key];
        winner = key;
      }
    });
    setResult(winner);
  };

  const getArchetypeDetails = (type: Archetype) => {
    switch (type) {
      case "academic":
        return {
          title: "De Academicus",
          desc: "Jij wilt je intellectueel blijven uitdagen. Een tussenjaar is voor jou een springplank naar je studie.",
          icon: <Brain size={48} className="text-purple-400" />,
          color: "purple",
          matches: GAP_PROGRAMS.filter(
            (p) => p.type === "academic" || p.type === "study",
          ),
        };
      case "adventure":
        return {
          title: "De Wereldburger",
          desc: "Vrijheid, reizen en nieuwe culturen ontdekken. Jij wilt de wereld zien!",
          icon: <Compass size={48} className="text-emerald-400" />,
          color: "emerald",
          matches: GAP_PROGRAMS.filter(
            (p) => p.type === "travel" || p.type === "work",
          ),
        };
      case "career":
        return {
          title: "De Professional",
          desc: "Ondernemend en doelgericht. Jij gebruikt dit jaar om skills te bouwen voor je CV.",
          icon: <Trophy size={48} className="text-blue-400" />,
          color: "blue",
          matches: GAP_PROGRAMS.filter(
            (p) =>
              p.type === "work" ||
              p.type === "program" ||
              p.id.includes("team"),
          ),
        };
      case "personal":
        return {
          title: "De Levenskunstenaar",
          desc: "Persoonlijke groei en rust staan centraal. Ontdekken wie je bent.",
          icon: <Sparkles size={48} className="text-pink-400" />,
          color: "pink",
          matches: GAP_PROGRAMS.filter(
            (p) => p.type === "volunteer" || p.type === "program",
          ),
        };
    }
  };

  // --- Render Logic ---

  // Result Screen
  if (result) {
    const details = getArchetypeDetails(result);
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-black/90 border border-white/10 rounded-3xl p-8 max-w-2xl w-full mx-auto shadow-2xl relative overflow-hidden"
      >
        {/* Background Glow */}
        <div
          className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-${details.color}-500 to-${details.color}-300`}
        />

        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">{details.icon}</div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400 mb-2">
            {details.title}
          </h2>
          <p className="text-slate-400 text-lg">{details.desc}</p>
        </div>

        <div className="space-y-4 mb-8">
          <h3 className="text-sm font-bold uppercase text-slate-500 tracking-widest">
            Jouw Top Matches
          </h3>
          <div className="grid gap-3">
            {details.matches.slice(0, 3).map((p) => (
              <div
                key={p.id}
                className="bg-white/5 border border-white/10 p-4 rounded-xl flex justify-between items-center group hover:bg-white/10 transition-colors"
              >
                <div>
                  <div className="font-bold text-white">{p.title}</div>
                  <div className="text-xs text-slate-400">{p.organization}</div>
                </div>
                <ArrowRight
                  className="text-slate-500 group-hover:text-white transition-colors"
                  size={20}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={onClose}
            className={`px-8 py-3 bg-${details.color}-600/20 text-${details.color}-400 border border-${details.color}-500/50 rounded-xl font-bold hover:bg-${details.color}-600/30 transition-all`}
          >
            Opslaan & Sluiten
          </button>
        </div>
      </motion.div>
    );
  }

  // Question Screen
  const question = GAP_QUIZ[step];

  return (
    <div className="bg-black/80 backdrop-blur-md border border-white/10 rounded-3xl p-8 max-w-xl w-full mx-auto relative overflow-hidden">
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 h-1 bg-blue-900 w-full">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${((step + 1) / GAP_QUIZ.length) * 100}%` }}
          className="h-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"
        />
      </div>

      <div className="mb-8 mt-4">
        <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">
          Vraag {step + 1} van {GAP_QUIZ.length}
        </span>
        <h2 className="text-2xl font-bold text-white mt-2 leading-tight">
          {question?.question || ""}
        </h2>
      </div>

      <div className="space-y-3">
        {question?.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => handleAnswer(opt.scores)}
            className="w-full text-left p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-blue-500/50 hover:scale-[1.02] transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center group-hover:border-blue-400">
                <div className="w-2 h-2 rounded-full bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="text-slate-300 group-hover:text-white font-medium">
                {opt.text}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
