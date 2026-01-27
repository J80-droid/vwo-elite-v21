import {
  BIG_FIVE_QUESTIONS,
  Question,
} from "@shared/assets/data/bigFiveQuestions";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  RefreshCw,
  Settings,
} from "lucide-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

import { BigFiveScores, useLOBContext } from "./LOBContext";

// Back Button Component
const BackButton = () => (
  <Link
    to="/research/career"
    className="fixed top-24 left-8 z-50 p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-slate-400 hover:text-white transition-all"
  >
    <ArrowLeft size={24} />
  </Link>
);

export const BigFiveTest: React.FC = () => {
  const { t } = useTranslation("career");
  const { saveBigFiveScores, bigFiveScores, resetLOBData } = useLOBContext();
  const navigate = useNavigate();

  // Setup State
  const [isSetup, setIsSetup] = useState(true);
  const [questionCount, setQuestionCount] = useState(20); // Default 20
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);

  // Test State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isCompleted, setIsCompleted] = useState(false);

  // Initialize Test with randomized questions
  const startTest = () => {
    // Shuffle questions and take n
    const shuffled = [...BIG_FIVE_QUESTIONS].sort(() => 0.5 - Math.random());
    setActiveQuestions(shuffled.slice(0, questionCount));
    setIsSetup(false);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setIsCompleted(false);
  };

  const handleAnswer = (score: number) => {
    const currentQ = activeQuestions[currentQuestionIndex];
    if (!currentQ) return;
    const qId = currentQ.id;
    const newAnswers = { ...answers, [qId]: score };
    setAnswers(newAnswers);

    if (currentQuestionIndex < activeQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      calculateResults(newAnswers);
    }
  };

  const calculateResults = (finalAnswers: Record<number, number>) => {
    const scores: Record<string, number> = {
      extraversion: 0,
      agreeableness: 0,
      conscientiousness: 0,
      neuroticism: 0,
      openness: 0,
    };

    const counts: Record<string, number> = {
      extraversion: 0,
      agreeableness: 0,
      conscientiousness: 0,
      neuroticism: 0,
      openness: 0,
    };

    activeQuestions.forEach((q) => {
      let score = finalAnswers[q.id];
      if (score === undefined) return;
      if (q.reverse) score = 6 - score; // Reverse score (1-5 scale)

      if (scores[q.trait] !== undefined) {
        scores[q.trait] = (scores[q.trait] || 0) + score;
      }
      if (counts[q.trait] !== undefined) {
        counts[q.trait] = (counts[q.trait] || 0) + 1;
      }
    });

    // Normalize to 0-100 based on max possible score per trait
    Object.keys(scores).forEach((key) => {
      const maxScore = counts[key]! * 5;
      if (maxScore > 0) {
        scores[key] = Math.round((scores[key]! / maxScore) * 100);
      } else {
        scores[key] = 0;
      }
    });

    saveBigFiveScores(scores as unknown as BigFiveScores);
    setIsCompleted(true);
  };

  // --- SETUP VIEW ---
  if (isSetup && !isCompleted && !bigFiveScores) {
    return (
      <div className="w-full max-w-2xl mx-auto p-8 font-outfit text-white flex flex-col items-center justify-center min-h-[60vh]">
        <BackButton />
        <div className="text-center space-y-6 mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-500/20 text-purple-400 mb-4">
            <Settings size={40} />
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tight">
            Configureer Test
          </h1>
          <p className="text-slate-400 max-w-md mx-auto">
            Bepaal hoeveel vragen je wilt beantwoorden. Meer vragen zorgen voor
            een nauwkeuriger resultaat.
          </p>
        </div>

        <div className="w-full bg-white/5 border border-white/10 p-8 rounded-2xl space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <label className="text-sm font-bold uppercase tracking-widest text-slate-400">
                Aantal Vragen
              </label>
              <span className="text-3xl font-black text-purple-400">
                {questionCount}
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400 transition-all"
            />
            <div className="flex justify-between text-xs text-slate-500 font-mono">
              <span>10 (Snel)</span>
              <span>100 (Grondig)</span>
            </div>
          </div>

          <button
            onClick={startTest}
            className="w-full py-4 bg-transparent border border-purple-500 text-purple-400 hover:bg-purple-500/10 rounded-xl font-bold uppercase tracking-widest transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]"
          >
            Start Test <ArrowRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  // --- RESULTS VIEW ---
  if (isCompleted || (!isSetup && bigFiveScores)) {
    // If we have scores but no active session or completed, show results.
    // If user wants to retry, they reset to setup.

    // Ensure we display current scores context if available
    const displayedScores = bigFiveScores || {
      extraversion: 0,
      agreeableness: 0,
      conscientiousness: 0,
      neuroticism: 0,
      openness: 0,
    };

    return (
      <div className="flex-1 w-full max-w-4xl mx-auto p-8 font-outfit text-white">
        <BackButton />
        <div className="space-y-12">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-500/20 text-purple-400 mb-4 animate-pulse">
              <Check size={40} />
            </div>
            <h2 className="text-3xl font-black uppercase text-white">
              {t("bigfive.results_title")}
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              {t("bigfive.results_subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {Object.entries(displayedScores).map(([trait, score], index) => (
              <div
                key={trait}
                className="bg-white/5 border border-white/10 p-6 rounded-2xl"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold capitalize text-white">
                    {t(`bigfive.traits.${trait}_title`) || trait}
                  </h3>
                  <span className="text-2xl font-black text-emerald-400">
                    {score}%
                  </span>
                </div>
                <div className="h-4 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                    className={`h-full rounded-full ${getTraitColor(trait)}`}
                  />
                </div>
                <p className="mt-4 text-sm text-slate-400 leading-relaxed">
                  {t(`bigfive.descriptions.${trait}`)}
                </p>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-4 pt-8">
            <button
              onClick={() => navigate("/research/career")}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold uppercase tracking-widest transition-colors"
            >
              {t("bigfive.back_dashboard")}
            </button>
            <button
              onClick={() => {
                setIsSetup(true);
                setIsCompleted(false);
                resetLOBData();
              }}
              // Note: resetting context here might not be desired if we want to keep history,
              // but UI needs to clear to show setup. Ideally we just clear local 'isCompleted'.
              // But since useLOBContext persists, we might want a 'startNewSession' local state.
              className="px-6 py-3 bg-purple-500/10 border border-purple-500/50 hover:bg-purple-500/20 text-purple-400 rounded-xl font-bold uppercase tracking-widest transition-all text-sm flex items-center gap-2"
            >
              <RefreshCw size={16} /> {t("bigfive.retry")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- QUESTION VIEW ---
  const currentQ = activeQuestions[currentQuestionIndex]!;

  return (
    <div className="flex-1 w-full h-full flex flex-col items-center justify-center p-8 font-outfit text-white">
      <BackButton />
      <div className="text-center max-w-2xl w-full space-y-12">
        <div className="space-y-4">
          <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-slate-400">
            {t("bigfive.question_prefix")} {currentQuestionIndex + 1} /{" "}
            {activeQuestions.length}
          </span>
          <AnimatePresence mode="wait">
            <motion.h2
              key={currentQ.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-3xl md:text-5xl font-black leading-tight text-white"
            >
              {currentQ?.text || ""}
            </motion.h2>
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-5 gap-2 md:gap-4">
          {[1, 2, 3, 4, 5].map((score) => (
            <button
              key={score}
              onClick={() => currentQ && handleAnswer(score)}
              className="group flex flex-col items-center gap-4"
            >
              <div
                className={`
                                w-12 h-12 md:w-16 md:h-16 rounded-2xl border-2 transition-all flex items-center justify-center text-xl font-bold
                                ${score === 1 ? "border-red-500/30 text-red-500 hover:border-red-500 hover:bg-red-500/10 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)]" : ""}
                                ${score === 2 ? "border-orange-500/30 text-orange-500 hover:border-orange-500 hover:bg-orange-500/10 hover:shadow-[0_0_15px_rgba(249,115,22,0.4)]" : ""}
                                ${score === 3 ? "border-slate-500/30 text-slate-500 hover:border-slate-500 hover:bg-slate-500/10 hover:shadow-[0_0_15px_rgba(100,116,139,0.4)]" : ""}
                                ${score === 4 ? "border-lime-500/30 text-lime-500 hover:border-lime-500 hover:bg-lime-500/10 hover:shadow-[0_0_15px_rgba(132,204,22,0.4)]" : ""}
                                ${score === 5 ? "border-emerald-500/30 text-emerald-500 hover:border-emerald-500 hover:bg-emerald-500/10 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]" : ""}
                            `}
              >
                {score}
              </div>
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                {getLabel(score)}
              </span>
            </button>
          ))}
        </div>

        <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-600 px-4">
          <span>{t("bigfive.agree_min")}</span>
          <span>{t("bigfive.agree_max")}</span>
        </div>
      </div>
    </div>
  );
};

function getTraitColor(trait: string) {
  switch (trait) {
    case "extraversion":
      return "bg-yellow-400";
    case "agreeableness":
      return "bg-green-400";
    case "conscientiousness":
      return "bg-blue-400";
    case "neuroticism":
      return "bg-red-400";
    case "openness":
      return "bg-purple-400";
    default:
      return "bg-white";
  }
}

function getLabel(score: number) {
  switch (score) {
    case 1:
      return "Oneens";
    case 5:
      return "Eens";
    default:
      return "";
  }
}
