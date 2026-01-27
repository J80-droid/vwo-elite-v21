import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Briefcase, Heart, RefreshCw, X } from "lucide-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

import { RIASECScores, useLOBContext } from "./LOBContext";

// Back Button Component
const BackButton = () => (
  <Link
    to="/research/career"
    className="fixed top-24 left-8 z-50 p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-slate-400 hover:text-white transition-all"
  >
    <ArrowLeft size={24} />
  </Link>
);

export const RIASECTest: React.FC = () => {
  const { t } = useTranslation("career");
  const { saveRiasecScores, riasecScores } = useLOBContext();
  const navigate = useNavigate();
  const [currentCard, setCurrentCard] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({
    realistic: 0,
    investigative: 0,
    artistic: 0,
    social: 0,
    enterprising: 0,
    conventional: 0,
  });
  const [isCompleted, setIsCompleted] = useState(!!riasecScores);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);

  // Dynamic activities from translations would be better, but for now we map IDs to translation keys
  // OR we iterate 1 to 10 and get key 'riasec.activities.N'
  // To match current logic, we need to know the 'code' (trait) for each activity.
  // The previous hardcoded list had codes. We should preserve the structure but get text from t().
  const ACTIVITIES = [
    { id: 1, text: t("riasec.activities.1"), code: "realistic" },
    { id: 2, text: t("riasec.activities.2"), code: "investigative" },
    { id: 3, text: t("riasec.activities.3"), code: "artistic" },
    { id: 4, text: t("riasec.activities.4"), code: "social" },
    { id: 5, text: t("riasec.activities.5"), code: "enterprising" },
    { id: 6, text: t("riasec.activities.6"), code: "conventional" },
    { id: 7, text: t("riasec.activities.7"), code: "realistic" },
    { id: 8, text: t("riasec.activities.8"), code: "investigative" },
    { id: 9, text: t("riasec.activities.9"), code: "artistic" },
    { id: 10, text: t("riasec.activities.10"), code: "social" },
  ];

  const handleSwipe = (liked: boolean) => {
    setDirection(liked ? "right" : "left");
    const activity = ACTIVITIES[currentCard]!;

    // Update score if liked
    if (liked) {
      setScores((prev) => ({
        ...prev,
        [activity.code]: (prev[activity.code] || 0) + 1,
      }));
    }

    setTimeout(() => {
      if (currentCard < ACTIVITIES.length - 1) {
        setCurrentCard((prev) => prev + 1);
        setDirection(null);
      } else {
        finishTest();
      }
    }, 300);
  };

  const finishTest = () => {
    // Normalize (simple count for now, real app would percentage)
    saveRiasecScores(scores as unknown as RIASECScores);
    setIsCompleted(true);
  };

  if (isCompleted && riasecScores) {
    // Sort traits to find top 3
    const sortedTraits = Object.entries(riasecScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    const code = sortedTraits
      .map(([trait]) => trait.charAt(0).toUpperCase())
      .join("");

    return (
      <div className="flex-1 w-full max-w-4xl mx-auto p-8 font-outfit text-white">
        <BackButton />
        <div className="space-y-12 text-center">
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-500/20 text-blue-400 mb-4 animate-bounce-slow">
              <Briefcase size={40} />
            </div>
            <h2 className="text-4xl font-black uppercase">
              {t("riasec.title")}:{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                {code}
              </span>
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              {t("riasec.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sortedTraits.map(([trait], index) => (
              <div key={trait} className="relative group">
                <div className="absolute inset-0 bg-blue-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-blue-500/50 transition-colors">
                  <div className="text-6xl font-black text-white/10 absolute top-4 right-4">
                    {index + 1}
                  </div>
                  <div className="text-4xl mb-4">{getTraitIcon(trait)}</div>
                  <h3 className="text-xl font-bold capitalize mb-2">{trait}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {t(`riasec.descriptions.${trait}`)}
                  </p>
                </div>
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
                setIsCompleted(false);
                setCurrentCard(0);
                setScores({
                  realistic: 0,
                  investigative: 0,
                  artistic: 0,
                  social: 0,
                  enterprising: 0,
                  conventional: 0,
                });
              }}
              className="px-6 py-3 bg-blue-500/10 border border-blue-500/50 hover:bg-blue-500/20 text-blue-400 rounded-xl font-bold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(59,130,246,0.2)] hover:shadow-[0_0_25px_rgba(59,130,246,0.4)] flex items-center gap-2"
            >
              <RefreshCw size={16} /> {t("bigfive.retry")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentActivity = ACTIVITIES[currentCard]!;

  return (
    <div className="flex-1 w-full h-full flex flex-col items-center justify-center p-8 font-outfit text-white relative overflow-hidden">
      <BackButton />
      <div className="absolute inset-0 bg-gradient-to-bl from-blue-900/10 to-black z-0" />

      <div className="relative z-10 w-full max-w-sm aspect-[3/4]">
        <AnimatePresence>
          <motion.div
            key={currentActivity.id}
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{
              scale: 1,
              opacity: 1,
              y: 0,
              x: direction === "left" ? -200 : direction === "right" ? 200 : 0,
              rotate:
                direction === "left" ? -20 : direction === "right" ? 20 : 0,
            }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900 rounded-[2rem] border border-white/10 shadow-2xl flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-8">
              <span className="text-4xl">🤔</span>
            </div>
            <h3 className="text-2xl font-bold mb-4">{currentActivity.text}</h3>
            <p className="text-sm text-slate-500 uppercase tracking-widest font-bold">
              {t("riasec.like_question")}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Controls */}
        <div className="absolute -bottom-24 left-0 right-0 flex justify-center gap-8">
          <button
            onClick={() => handleSwipe(false)}
            className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/50 text-red-500 flex items-center justify-center hover:scale-110 hover:bg-red-500/20 hover:shadow-[0_0_30px_rgba(239,68,68,0.4)] transition-all"
          >
            <X size={32} />
          </button>
          <button
            onClick={() => handleSwipe(true)}
            className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/50 text-emerald-500 flex items-center justify-center hover:scale-110 hover:bg-emerald-500/20 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all"
          >
            <Heart size={32} fill="currentColor" />
          </button>
        </div>
      </div>
      <div className="absolute top-8 text-xs font-bold uppercase text-slate-500 tracking-widest">
        {t("riasec.activity_counter")} {currentCard + 1} / {ACTIVITIES.length}
      </div>
    </div>
  );
};

function getTraitIcon(trait: string) {
  switch (trait) {
    case "realistic":
      return "🔨";
    case "investigative":
      return "🔬";
    case "artistic":
      return "🎨";
    case "social":
      return "🤝";
    case "enterprising":
      return "💼";
    case "conventional":
      return "📂";
    default:
      return "";
  }
}
