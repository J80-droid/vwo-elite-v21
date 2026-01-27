/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { geminiGenerate } from "@shared/api/geminiBase";
import { useTranslations } from "@shared/hooks/useTranslations";
import { AnimatePresence, motion } from "framer-motion";
import {
  BrainCircuit,
  Flame,
  Loader2,
  RefreshCw,
  Swords,
  Timer,
  Trophy,
  Zap,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

// --- TYPES ---
interface Concept {
  id: string;
  term: string;
  definition: string;
  philosopher: string;
}

// Fallback data for offline/initial load
const INITIAL_CONCEPTS: Concept[] = [
  {
    id: "1",
    term: "Qualia",
    definition: "De subjectieve, fenomenale ervaring van hoe dingen voelen.",
    philosopher: "Nagel / Chalmers",
  },
  {
    id: "2",
    term: "Bestand",
    definition:
      "De wereld als voorraadschuur van grondstoffen die op afroep beschikbaar is.",
    philosopher: "Heidegger",
  },
  {
    id: "3",
    term: "Eudaimonia",
    definition:
      "Het floreren of gelukkig zijn door het leiden van een deugdzaam leven.",
    philosopher: "Aristoteles",
  },
  {
    id: "4",
    term: "Chinese Room",
    definition: "Gedachte-experiment dat stelt dat syntax geen semantiek is.",
    philosopher: "Searle",
  },
  {
    id: "5",
    term: "Categorisch Imperatief",
    definition:
      "Handel alleen volgens maximes die algemene wetten kunnen worden.",
    philosopher: "Kant",
  },
  {
    id: "6",
    term: "Turing Test",
    definition:
      "Een test om te bepalen of een machine intelligent gedrag kan vertonen.",
    philosopher: "Turing",
  },
];

export const BattleArena: React.FC = () => {
  const { t } = useTranslations();
  const [gameState, setGameState] = useState<
    "idle" | "loading" | "playing" | "result"
  >("idle");
  const [concepts, setConcepts] = useState<Concept[]>(INITIAL_CONCEPTS);
  const [currentConcept, setCurrentConcept] = useState<Concept | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

  // --- AI GENERATION ---
  const fetchNewBatch = async () => {
    try {
      const prompt = `
                Genereer een JSON lijst van 10 filosofische begrippen voor VWO niveau.
                Focus op: Ethiek, Kennisleer, Antropologie en Techniekfilosofie.
                De definities moeten moeilijk/uitdagend zijn.
                Format:
                [
                  { "id": "uuid", "term": "Begrip", "definition": "Korte, scherpe definitie...", "philosopher": "Naam" }
                ]
            `;

      const result = await geminiGenerate(prompt, "", { jsonMode: true });
      if (!result || !result.content) return [];
      const data = JSON.parse(result.content.replace(/```json|```/g, ""));

      // Add unique ID prefix to avoid collisions
      const newConcepts = data.map((c: any) => ({
        ...c,
        id: Date.now() + "-" + Math.random(),
      }));
      return newConcepts;
    } catch (e) {
      console.error("Failed to fetch batch", e);
      return []; // Fallback to existing
    }
  };

  const startGame = async () => {
    setGameState("loading");

    // Try to fetch fresh concepts first
    const newBatch = await fetchNewBatch();
    if (newBatch.length > 0) {
      setConcepts(newBatch);
    }

    setScore(0);
    setStreak(0);
    setTimeLeft(30);
    setGameState("playing");
    nextRound(newBatch.length > 0 ? newBatch : concepts);
  };

  const nextRound = useCallback(
    (activePool: Concept[] = concepts) => {
      if (activePool.length === 0) return;

      const concept =
        activePool[Math.floor(Math.random() * activePool.length)]!;
      setCurrentConcept(concept);

      // Pick 2 random wrong options from the SAME pool for coherence
      const others = activePool
        .filter((c) => c.id !== concept.id)
        .map((c) => c.definition);
      const shuffled = others.sort(() => 0.5 - Math.random()).slice(0, 2);
      const allOptions = [...shuffled, concept.definition].sort(
        () => 0.5 - Math.random(),
      );

      setOptions(allOptions);
      setFeedback(null);
    },
    [concepts],
  );

  const handleAnswer = (option: string) => {
    if (!currentConcept || feedback) return;

    if (option === currentConcept.definition) {
      setScore((s) => s + 100 + streak * 10);
      setStreak((s) => s + 1);
      setFeedback("correct");
      // Bonus time for correct answer
      setTimeLeft((t) => Math.min(t + 2, 30));

      setTimeout(() => nextRound(), 600);
    } else {
      setStreak(0);
      setFeedback("wrong");
      setTimeLeft((t) => Math.max(t - 5, 0)); // Penalty

      setTimeout(() => nextRound(), 800);
    }
  };

  // --- GAME LOOP ---
  useEffect(() => {
    let timer: any;
    if (gameState === "playing" && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0 && gameState === "playing") {
      setGameState("result");
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  // Background fetch for infinite play?
  // Simplified: Just fetch at start for now.
  // Future: Fetch when roundCount % 8 === 0

  return (
    <div className="w-full h-full p-8 flex flex-col items-center justify-center bg-black overflow-y-auto">
      <AnimatePresence mode="wait">
        {/* IDLE SCREEN */}
        {gameState === "idle" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center space-y-8"
          >
            <div className="w-32 h-32 rounded-full bg-rose-500/10 border-2 border-rose-500/20 flex items-center justify-center mx-auto relative">
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 bg-rose-500/20 rounded-full blur-xl"
              />
              <Swords size={64} className="text-rose-500 relative z-10" />
            </div>
            <div>
              <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter mb-4">
                {t("philosophy.battle.title")}
              </h2>
              <p className="text-slate-500 text-lg max-w-sm mx-auto leading-relaxed">
                {t("philosophy.battle.subtitle")}
              </p>
            </div>
            <button
              onClick={startGame}
              className="px-12 py-5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:border-rose-500/50 rounded-2xl font-black text-xl uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(244,63,94,0.1)] hover:shadow-[0_0_50px_rgba(244,63,94,0.2)] flex items-center gap-3 mx-auto group"
            >
              <BrainCircuit
                size={24}
                className="drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]"
              />
              <span className="drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]">
                {t("philosophy.battle.start")}
              </span>
            </button>
          </motion.div>
        )}

        {/* LOADING SCREEN */}
        {gameState === "loading" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <Loader2 className="w-12 h-12 text-rose-500 animate-spin" />
            <h3 className="text-xl font-black text-white uppercase tracking-widest">
              {t("philosophy.battle.loading")}
            </h3>
          </motion.div>
        )}

        {/* GAMEPLAY SCREEN */}
        {gameState === "playing" && currentConcept && (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-4xl flex flex-col gap-12"
          >
            {/* Status Bar */}
            <div className="flex justify-between items-end">
              <div className="flex gap-8">
                <div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                    <Trophy size={12} className="text-amber-400" />{" "}
                    {t("philosophy.battle.score")}
                  </div>
                  <div className="text-3xl font-black text-white">{score}</div>
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                    <Flame size={12} className="text-orange-500" />{" "}
                    {t("philosophy.battle.combo")}
                  </div>
                  <div className="text-3xl font-black text-orange-500">
                    x{streak}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Timer size={12} /> {t("philosophy.battle.time")}
                </div>
                <div
                  className={`text-4xl font-black ${timeLeft < 10 ? "text-rose-500 animate-pulse" : "text-white"}`}
                >
                  {timeLeft}s
                </div>
              </div>
            </div>

            {/* Progression Bar */}
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: `${(timeLeft / 30) * 100}%` }}
                className="h-full bg-rose-500"
              />
            </div>

            {/* The Question Card */}
            <div className="relative flex flex-col items-center">
              <motion.div
                key={currentConcept.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-16 w-full text-center relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <span className="text-xs font-black text-rose-500 uppercase tracking-[0.4em] mb-4 block">
                  {t("philosophy.battle.define_prompt")}
                </span>
                <h1 className="text-6xl font-black text-white uppercase tracking-tighter italic">
                  {currentConcept.term}
                </h1>
                <div className="mt-4 text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                  {t("philosophy.battle.philosopher")}:{" "}
                  {currentConcept.philosopher}
                </div>
              </motion.div>

              {/* Floating Feedback */}
              <AnimatePresence>
                {feedback && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0, y: 0 }}
                    animate={{ scale: 1.5, opacity: 1, y: -50 }}
                    exit={{ opacity: 0 }}
                    className={`absolute z-20 font-black text-4xl uppercase italic ${feedback === "correct" ? "text-emerald-400" : "text-rose-500"}`}
                  >
                    {feedback === "correct" ? "PERFECT!" : "FOUT!"}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 gap-4">
              {options.map((option, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.01, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAnswer(option)}
                  disabled={!!feedback}
                  className={`
                                        p-6 rounded-2xl border text-left transition-all duration-200 group relative overflow-hidden
                                        ${
                                          feedback === "correct" &&
                                          option === currentConcept.definition
                                            ? "bg-emerald-500/20 border-emerald-500 text-white"
                                            : feedback === "wrong" &&
                                                option ===
                                                  currentConcept.definition
                                              ? "bg-emerald-500/10 border-emerald-500/50 text-slate-300"
                                              : feedback === "wrong" &&
                                                  option !==
                                                    currentConcept.definition
                                                ? "bg-rose-500/20 border-rose-500 text-white opacity-40"
                                                : "bg-white/5 border-white/10 text-slate-400 hover:border-white/30 hover:bg-white/10"
                                        }
                                    `}
                >
                  <div className="relative z-10 flex justify-between items-center">
                    <span className="text-lg font-medium leading-relaxed">
                      {option}
                    </span>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Zap size={20} className="text-rose-500" />
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* RESULT SCREEN */}
        {gameState === "result" && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center space-y-8 bg-white/5 backdrop-blur-3xl p-16 rounded-[4rem] border border-white/10"
          >
            <Trophy size={80} className="text-amber-400 mx-auto" />
            <div>
              <h2 className="text-4xl font-black text-white uppercase italic mb-2 tracking-tighter">
                {t("philosophy.battle.result")}
              </h2>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                {t("philosophy.battle.final_score")}
              </p>
            </div>

            <div className="text-8xl font-black text-white tracking-widest mb-12">
              {score}
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={startGame}
                className="px-10 py-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:border-rose-500/50 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(244,63,94,0.1)] hover:shadow-[0_0_50px_rgba(244,63,94,0.2)] flex items-center gap-2 group"
              >
                <RefreshCw
                  size={16}
                  className="drop-shadow-[0_0_5px_rgba(244,63,94,0.5)]"
                />
                <span className="drop-shadow-[0_0_5px_rgba(244,63,94,0.5)]">
                  {t("philosophy.battle.replay")}
                </span>
              </button>
              <button
                onClick={() => setGameState("idle")}
                className="px-10 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest border border-white/10 transition-all"
              >
                {t("philosophy.battle.menu")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
