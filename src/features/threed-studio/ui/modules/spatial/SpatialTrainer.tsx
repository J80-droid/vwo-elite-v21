/* eslint-disable react-hooks/exhaustive-deps */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useTranslations } from "@shared/hooks/useTranslations";
import { useVoiceCoachContext } from "@shared/lib/contexts/VoiceCoachContext";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Binary,
  Bone,
  Box,
  CheckCircle2,
  ChevronRight,
  Clock,
  Cpu,
  Eye,
  Fingerprint,
  GitMerge,
  LayoutTemplate,
  MonitorPlay,
  PackageOpen,
  Rotate3D,
  Route,
  Search,
  Settings,
  Slice,
  Sun,
  Trophy,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useThreeDLabContext } from "../../../hooks/useThreeDLabContext";
import { Confetti } from "../../../spatial/components/Confetti";
import {
  DIFFICULTY_CONFIG,
  LEVEL_MATRIX,
  MAX_ROUNDS,
  OPTION_COLORS,
} from "../../../spatial/config";
import { useSpatialGame } from "../../../spatial/hooks/useSpatialGame";
import { useSpatialProgress } from "../../../spatial/hooks/useSpatialProgress";
import { OptionCard, QuestionCard } from "../../../spatial/SpatialRenderers";
import { Difficulty, MatrixLevel } from "../../../types";
// Removed invalid import

// --- Quantum Components ---

export default function SpatialTrainer() {
  const { t } = useTranslations();
  const { setActiveModule } = useThreeDLabContext();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { level, submodule } = useParams();
  const navigate = useNavigate();
  // Parse level from URL (format "level-X" or just "X")
  const initialLevel = level ? parseInt(level.replace("level-", "")) || 1 : 1;

  // Pass initialLevel to useSpatialGame (requires updating useSpatialGame hook first if it doesn't support it)
  // For now, we'll manually set it via effect if the hook exposes a setter, or modify the hook.
  // Checking useSpatialGame hook signature... it accepts config object.

  // Let's assume we need to modify the hook or use a useEffect to jump to level.
  const game = useSpatialGame({
    levelMatrix: LEVEL_MATRIX,
    maxRounds: MAX_ROUNDS,
    soundEnabled,
    initialLevel,
    initialModule: (submodule as any) || "rotation", // Casting as any to bypass strict TrainingModule check for now, validation happens in hook
  });

  // Auto-start game if submodule is present in URL
  useEffect(() => {
    if (submodule && !game.gameStarted) {
      game.startGame(submodule as any);
    }
  }, [submodule]);
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<Difficulty>("medium");
  const [canvasReady, setCanvasReady] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const { updateProgress, progress } = useSpatialProgress();

  // Voice Coach Context - spatial reasoning with FULL screen details
  const screenContext = useMemo(
    () => ({
      module: game.activeModule,
      difficulty: selectedDifficulty,
      score: game.score,
      round: game.round,
      maxRounds: MAX_ROUNDS,
      timeLeft: game.timeLeft,
      gameStarted: game.gameStarted,
      gameOver: game.gameOver,
      feedback: game.feedback,
      currentLevel: game.currentLevel,
      investigateMode: game.investigateMode,
      // Answer options visible to student
      optionsCount: game.options?.length || 0,
      correctIndex: game.correctIndex,
      // Module-specific data
      questionData: game.questionData,
      gearsCount: game.gears?.length || 0,
      foldsCount: game.folds?.length || 0,
    }),
    [game, selectedDifficulty],
  );

  useVoiceCoachContext(
    "SpatialTrainer",
    `Je bent een Socratische tutor voor ruimtelijk inzicht en mentale rotatie.
De student ziet nu PRECIES dit op het scherm:

MODULE: ${game.activeModule}
MOEILIJKHEID: ${selectedDifficulty}
NIVEAU: ${game.currentLevel}/5
VOORTGANG: Ronde ${game.round} van ${MAX_ROUNDS}, Score: ${game.score}
TIJD OVER: ${game.timeLeft} seconden
${game.feedback ? `FEEDBACK: Student antwoordde ${game.feedback === "correct" ? "GOED ✓" : "FOUT ✗"}` : ""}
${game.investigateMode ? "ONDERZOEKSMODUS: Student bekijkt het correcte antwoord" : ""}

SOORT OPDRACHT: ${
      game.activeModule === "rotation"
        ? "3D rotatie matching"
        : game.activeModule === "mechanical"
          ? "Tandwiel richting bepalen"
          : game.activeModule === "folding"
            ? "Papier vouwen en perforeren"
            : game.activeModule === "nets"
              ? "Uitvouwen van dozen"
              : "Ruimtelijk redeneren"
    }

ANTWOORDOPTIES: ${game.options?.length || 4} keuzes zichtbaar
${game.gears?.length ? `TANDWIELEN: ${game.gears.length} zichtbaar` : ""}
${game.folds?.length ? `VOUWEN: ${game.folds.length} vouwlijnen` : ""}

COACHING INSTRUCTIES:
- Vraag HOE de student de transformatie visualiseert
- Vraag welke stappen ze in gedachten doen
- Bij tandwielen: vraag naar de draairichting logica
- Bij vouwen: vraag wat ze verwachten na elke vouw
- Geef NOOIT het antwoord, stel alleen vragen`,
    screenContext,
  );

  // SRS Wrapper
  const handleGuessWithProgress = (index: number) => {
    if (!game.feedback) {
      const isCorrect = index === game.correctIndex;
      updateProgress(game.activeModule, isCorrect);
      game.handleGuess(index);
    }
  };

  // Reset selection on new round
  useEffect(() => {
    setSelectedIdx(null);
  }, [game.round, game.gameStarted]);

  useEffect(() => {
    // Delay for canvas readiness
    const timer = setTimeout(() => setCanvasReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleStartGame = async (modId: any) => {
    // Use the level from the selected difficulty card
    const config = DIFFICULTY_CONFIG[selectedDifficulty];
    if (!config) return;

    const startLevel = config.startLevel;
    // Navigate to URL - the useEffect above will trigger the start
    navigate(`/3d-studio/spatial/${modId}/${startLevel}`);
  };

  // Key Listener
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!game.gameStarted || game.gameOver || game.feedback) return;
      if (["a", "b", "c", "d"].includes(e.key.toLowerCase())) {
        const key = e.key.toLowerCase();
        const map: Record<string, number> = { a: 0, b: 1, c: 2, d: 3 };
        if (key in map) {
          const idx = map[key];
          if (idx !== undefined) handleGuessWithProgress(idx);
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [game.gameStarted, game.gameOver, game.feedback, game.handleGuess]);

  // --- Instructions ---
  const INSTRUCTION_MAP: Record<string, string> = {
    rotation: t("studio_3d.spatial.instructions.rotation"),
    counting: t("studio_3d.spatial.instructions.counting"),
    pov: t("studio_3d.spatial.instructions.pov"),
    spot: t("studio_3d.spatial.instructions.spot"),
    sequence: t("studio_3d.spatial.instructions.sequence"),
    xray: t("studio_3d.spatial.instructions.xray"),
    shadows: t("studio_3d.spatial.instructions.shadows"),
    projection: t("studio_3d.spatial.instructions.projection"),
    pathfinding: t("studio_3d.spatial.instructions.pathfinding"),
    chirality: t("studio_3d.spatial.instructions.chirality"),
    nets: t("studio_3d.spatial.instructions.nets"),
    folding: t("studio_3d.spatial.instructions.folding"),
    mechanical: t("studio_3d.spatial.instructions.mechanical"),
    "cross-section": t("studio_3d.spatial.instructions.cross_section"),
    stability: t("studio_3d.spatial.instructions.stability"),
  };

  // --- Renders ---

  if (!game.gameStarted || game.gameOver) {
    return (
      <div className="h-full bg-obsidian-950 flex items-center justify-center p-8 overflow-y-auto font-outfit relative">
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-6xl w-full text-center relative z-10">
          <div className="mb-12 flex items-center justify-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
              <Cpu className="text-emerald-400 animate-pulse" size={24} />
            </div>
            <span className="text-emerald-500/60 text-xs font-bold tracking-[0.4em] uppercase font-space">
              Neural Architecture v2.0
            </span>
          </div>
          <h1 className="text-8xl font-bold mb-12 mt-12 tracking-tight text-white uppercase leading-none font-outfit">
            Master the <span className="text-emerald-400">Dimensions</span>
          </h1>
          {/* Button Removed as per request */}
          <div className="mb-24" /> {/* Spacer */}
          {/* Difficulty Select */}
          <div className="grid grid-cols-4 gap-6 mb-16 px-4">
            {(
              Object.entries(DIFFICULTY_CONFIG) as [
                Difficulty,
                { startLevel: MatrixLevel; label: string; color: string },
              ][]
            ).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setSelectedDifficulty(key)}
                className={`p-6 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-3 group relative overflow-hidden ${
                  selectedDifficulty === key
                    ? "bg-white/5 border-white/20 shadow-[0_0_40px_rgba(255,255,255,0.05)] scale-105"
                    : "bg-black/20 border-white/5 hover:border-white/10 opacity-70 hover:opacity-100"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full mb-1 transition-transform group-hover:scale-125`}
                  style={{ backgroundColor: cfg.color }}
                />
                <div className="font-bold text-lg tracking-tight font-outfit">
                  {t(cfg.label)}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold font-space">
                  Level {cfg.startLevel}
                </div>
                {selectedDifficulty === key && (
                  <motion.div
                    layoutId="diff-active"
                    className="absolute bottom-0 left-0 right-0 h-1"
                    style={{ backgroundColor: cfg.color }}
                  />
                )}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3 max-w-5xl mx-auto">
            {[
              {
                id: "rotation",
                label: "Rotatie",
                color: "#6366f1",
                icon: Rotate3D,
              },
              {
                id: "folding",
                label: "Vouwen",
                color: "#f43f5e",
                icon: PackageOpen,
              },
              {
                id: "mechanical",
                label: "Mechanica",
                color: "#f59e0b",
                icon: Settings,
              },
              {
                id: "nets",
                label: "Uitslagen",
                color: "#10b981",
                icon: LayoutTemplate,
              },
              {
                id: "stability",
                label: "Stabiliteit",
                color: "#8b5cf6",
                icon: Box,
              },
              {
                id: "counting",
                label: "Tellen",
                color: "#06b6d4",
                icon: Binary,
              },
              { id: "pov", label: "Perspectief", color: "#f97316", icon: Eye },
              {
                id: "spot",
                label: "Herkenning",
                color: "#84cc16",
                icon: Search,
              },
              {
                id: "sequence",
                label: "Sequentie",
                color: "#ec4899",
                icon: GitMerge,
              },
              { id: "xray", label: "Röntgen", color: "#4f46e5", icon: Bone },
              {
                id: "shadows",
                label: "Schaduwen",
                color: "#94a3b8",
                icon: Sun,
              },
              {
                id: "projection",
                label: "Projectie",
                color: "#3b82f6",
                icon: MonitorPlay,
              },
              {
                id: "cross-section",
                label: "Doorsnede",
                color: "#ef4444",
                icon: Slice,
              },
              {
                id: "pathfinding",
                label: "Pad",
                color: "#14b8a6",
                icon: Route,
              },
              {
                id: "chirality",
                label: "Chiraliteit",
                color: "#d946ef",
                icon: Fingerprint,
              },
            ].map((mod) => (
              <button
                key={mod.id}
                onClick={() => handleStartGame(mod.id as any)}
                className="group relative px-4 py-8 bg-obsidian-900/40 hover:bg-white/5 border border-white/5 hover:border-emerald-500/30 rounded-3xl transition-all duration-500 flex flex-col items-center gap-4 overflow-hidden shadow-xl"
              >
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-10 transition-opacity">
                  <ChevronRight size={40} />
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20 transition-all">
                  <mod.icon
                    style={{ color: mod.color }}
                    className="group-hover:scale-110 transition-all opacity-80 group-hover:opacity-100"
                    size={28}
                  />
                </div>
                <div className="space-y-1">
                  <p className="font-black text-slate-400 group-hover:text-white uppercase tracking-tighter transition-all">
                    {mod.label}
                  </p>
                  <div className="h-0.5 w-0 bg-emerald-500 group-hover:w-full transition-all mx-auto" />
                  {/* Mastery Bar */}
                  <div className="w-12 h-1 bg-black/50 rounded-full mt-2 overflow-hidden mx-auto">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500"
                      style={{
                        width: `${progress[mod.id as any]?.mastery || 0}%`,
                      }}
                    />
                  </div>
                </div>
              </button>
            ))}
          </div>
          {game.gameOver && (
            <div className="mt-16 animate-in fade-in zoom-in duration-500">
              <h2 className="text-4xl font-black text-white mb-4 uppercase italic italic tracking-tighter">
                {t("studio_3d.spatial.mission_accomplished")}
              </h2>
              <div className="text-8xl font-black text-emerald-400 mb-8 tracking-tighter italic drop-shadow-[0_0_20px_rgba(52,211,153,0.5)]">
                {game.score}{" "}
                <span className="text-2xl text-slate-500 uppercase tracking-widest ml-2">
                  {t("studio_3d.spatial.units")}
                </span>
              </div>
              <Confetti />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-obsidian-950 relative font-sans select-none text-slate-200 overflow-hidden">
      {/* Header */}
      <div className="relative h-16 border-b border-white/10 bg-obsidian-950/50 backdrop-blur-md grid grid-cols-3 items-center px-6 z-20">
        {/* LEFT: Logo & Level */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setActiveModule("");
              navigate("/3d-studio");
            }}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group shrink-0"
          >
            <div className="p-1 rounded-md group-hover:bg-white/10 transition-colors">
              <Box
                size={20}
                className="group-hover:text-cyan-400 transition-colors"
              />
            </div>
            <span className="font-bold tracking-wider group-hover:text-cyan-400 transition-colors hidden sm:block">
              {t("studio_3d.spatial.title")}
            </span>
          </button>
          <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />
          <div className="flex items-center gap-2 text-[10px] md:text-xs bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 text-blue-300 whitespace-nowrap">
            Lvl {game.currentLevel}
          </div>
        </div>

        {/* CENTER: High Score */}
        <div className="flex flex-col items-center">
          <span className="text-[9px] font-bold text-slate-500 tracking-[0.2em] uppercase">
            {t("studio_3d.spatial.high_score")}
          </span>
          <div className="flex items-center gap-2">
            <Trophy size={14} className="text-yellow-500" />
            <span className="text-lg font-black text-white/90 font-mono leading-none">
              {game.highScore || 0}
            </span>
          </div>
        </div>

        {/* RIGHT: Time & Score */}
        <div className="flex items-center justify-end gap-3 md:gap-6">
          <div
            className={`flex items-center gap-2 font-mono text-lg font-bold ${game.timeLeft < 5 ? "text-red-500 animate-pulse" : "text-slate-200"}`}
          >
            <Clock size={16} /> <span>{game.timeLeft}s</span>
          </div>
          <div className="bg-white/5 px-3 py-1 rounded-full border border-white/10 font-mono text-sm hidden xs:flex">
            <span className="text-sky-400 font-bold">{game.score}</span>
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
      </div>

      {/* Main Area - Fills remaining space below header */}
      <div className="flex-1 w-full h-full p-4 md:p-6 overflow-y-auto flex flex-col items-center justify-start pt-4 md:pt-6">
        <div className="flex flex-col gap-4 w-full max-w-7xl mx-auto">
          {/* Instruction Header */}
          <div className="text-center space-y-2 mb-4">
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              {INSTRUCTION_MAP[game.activeModule] ||
                "Select the correct option"}
            </h2>
          </div>

          {/* NEW SPLIT LAYOUT: Options Left (2x2), Question Right (Big) */}
          <div className="flex flex-col xl:flex-row gap-6 w-full h-[620px]">
            {/* LEFT COLUMN: Options Grid + Answer Buttons */}
            <div className="flex-1 flex flex-col gap-4">
              {/* 1. Options Grid (2x2 or 1x2 depending on module) */}
              <div
                className={`flex-1 grid gap-4 bg-slate-900/40 rounded-[32px] p-4 border border-white/5 shadow-2xl backdrop-blur-sm relative overflow-hidden ${game.options.length <= 2 ? "grid-cols-2 lg:max-w-2xl mx-auto w-full" : "grid-cols-2"}`}
              >
                {canvasReady
                  ? game.options.map((opt, i) => (
                      <OptionCard
                        key={i}
                        index={i}
                        round={game.round}
                        option={opt}
                        activeModule={game.activeModule}
                        feedback={game.feedback}
                        correctIndex={game.correctIndex}
                        handleGuess={handleGuessWithProgress}
                        color={OPTION_COLORS[i] || "#ffffff"}
                        isSelected={selectedIdx === i}
                        onSelect={setSelectedIdx}
                        revealed={game.revealedOption === i}
                        onInvestigate={game.handleInvestigate}
                      />
                    ))
                  : // Fallback loaders
                    Array.from({
                      length: game.activeModule === "mechanical" ? 2 : 4,
                    }).map((_, i) => (
                      <div
                        key={i}
                        className="bg-white/5 rounded-3xl animate-pulse flex flex-col items-center justify-center border border-white/5"
                      >
                        <div className="w-10 h-10 rounded-xl bg-white/10 mb-4" />
                        <div className="w-1/2 h-4 rounded bg-white/5" />
                      </div>
                    ))}
              </div>

              {/* 2. Answer Buttons (aligned width) */}
              <div
                className={`grid gap-4 h-16 md:h-20 shrink-0 ${game.options.length <= 2 ? "grid-cols-2 max-w-2xl mx-auto w-full" : "grid-cols-4"}`}
              >
                {game.options.map((_, i) => {
                  const color = OPTION_COLORS[i];
                  const isSelected = selectedIdx === i;
                  return (
                    <button
                      key={i}
                      onClick={() => handleGuessWithProgress(i)}
                      disabled={!!game.feedback}
                      style={{
                        borderColor: isSelected ? color : `${color}40`,
                        backgroundColor: isSelected ? color : `${color}10`,
                        color: isSelected ? "#ffffff" : color,
                        boxShadow: isSelected ? `0 0 20px ${color}60` : "none",
                      }}
                      className={`
                                                rounded-2xl font-black text-2xl tracking-wider transition-all duration-300 border flex items-center justify-center gap-2 group
                                                ${isSelected && !game.feedback ? "scale-[1.02]" : "hover:scale-[1.02]"}
                                                ${game.feedback ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                                            `}
                    >
                      <span className="">{String.fromCharCode(65 + i)}</span>
                    </button>
                  );
                })}
              </div>

              {/* 3. Integrated Feedback (Appears below Answer Buttons) */}
              {game.feedback && (
                <div className="p-4 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-between animate-in slide-in-from-bottom-2 duration-300 backdrop-blur-md">
                  <div className="flex flex-col">
                    <div
                      className={`font-black text-lg flex items-center gap-2 ${game.feedback === "correct" ? "text-emerald-400" : "text-rose-400"}`}
                    >
                      {game.feedback === "correct" ? (
                        <CheckCircle2 size={20} />
                      ) : (
                        <AlertCircle size={20} />
                      )}
                      {game.feedback === "correct"
                        ? t("studio_3d.spatial.feedback.correct")
                        : t("studio_3d.spatial.feedback.incorrect")}
                    </div>
                    {game.feedback === "wrong" && (
                      <div className="text-rose-300/50 text-[10px] font-black uppercase tracking-[0.2em] mt-0.5 ml-7">
                        Correct: Optie{" "}
                        {String.fromCharCode(65 + game.correctIndex)}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={game.advanceRound}
                    className="px-6 py-2 bg-transparent border border-emerald-500/50 text-emerald-400 font-bold rounded-xl hover:bg-emerald-500/10 hover:border-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center gap-2 active:scale-95 group"
                  >
                    <span className="tracking-widest uppercase text-xs">
                      {t("studio_3d.spatial.feedback.next")}
                    </span>
                    <ChevronRight
                      size={18}
                      className="group-hover:translate-x-0.5 transition-transform text-emerald-500"
                    />
                  </button>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Reference Card */}
            <div className="w-full xl:w-[400px] bg-slate-900/40 rounded-[32px] border border-white/5 shadow-2xl backdrop-blur-sm flex flex-col relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-10 bg-gradient-to-b from-black/60 to-transparent">
                <div className="px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                  <Box size={14} /> DOEL FIGUUR
                </div>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center relative min-h-[100px]">
                {/* Background Grid for Reference */}
                <div
                  className="absolute inset-0 opacity-[0.03]"
                  style={{
                    backgroundImage:
                      "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                ></div>

                {game.questionData && canvasReady ? (
                  <div className="w-full h-full p-4 relative z-0">
                    <QuestionCard
                      data={game.questionData}
                      activeModule={game.activeModule}
                      revealed={game.feedback !== null}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 opacity-50">
                    <div className="w-16 h-16 rounded-xl bg-white/10 animate-pulse" />
                    <div className="text-slate-600 font-mono text-sm animate-pulse">
                      Initializing...
                    </div>
                  </div>
                )}
              </div>

              {/* Helper Hint or Solution Panel */}
              <div className="p-6 bg-white/5 border-t border-white/10 shrink-0">
                {game.feedback ? (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase tracking-widest">
                        <Search size={14} /> Correcte Oplossing
                      </div>
                      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-slate-100 text-sm leading-relaxed">
                          <span className="text-emerald-400 font-black block mb-1">
                            Het juiste antwoord is Optie{" "}
                            {String.fromCharCode(65 + game.correctIndex)}:
                          </span>
                          {game.options[game.correctIndex]?.explanation ||
                            t(
                              "studio_3d.spatial.default_explanation",
                              "Dit is het enige figuur dat exact overeenkomt met het doel.",
                            )}
                        </p>
                      </div>
                    </div>

                    {/* Pro-Tip section for educational value */}
                    <div className="pt-3 border-t border-white/5 space-y-2">
                      <div className="flex items-center gap-2 text-cyan-400 font-black text-[10px] uppercase tracking-[0.2em]">
                        <Sun size={12} /> Elite Leerpunt
                      </div>
                      <p className="text-slate-400 text-xs leading-relaxed italic">
                        {game.activeModule === "nets" &&
                          "Tip: Kijk altijd of er een 'O-vorm' van 4 vlakken is. Zonder deze basis kan een uitslag nooit een kubus sluiten."}
                        {game.activeModule === "mechanical" &&
                          "Tip: Tandwielen die elkaar direct raken draaien altijd in tegengestelde richting. Een riem behoudt de richting."}
                        {game.activeModule === "cross-section" &&
                          "Tip: Een doorsnede door het dikste punt van een bol is altijd een cirkel met de maximale straal."}
                        {game.activeModule === "stability" &&
                          "Tip: Zorg dat het zwaartepunt van een blok altijd bovenop een ander blok rust, anders valt de toren om."}
                        {game.activeModule === "counting" &&
                          "Tip: Vergeet de onzichtbare blokken niet die de structuren erboven ondersteunen!"}
                        {game.activeModule === "pov" &&
                          "Tip: Probeer in gedachten om het object heen te lopen naar de aangegeven positie."}
                        {game.activeModule === "projection" &&
                          "Tip: Stel je voor dat je het object platdrukt tegen de muur erachter."}
                        {game.activeModule === "shadows" &&
                          "Tip: Het licht komt van boven; welke delen steken uit en blokkeren het licht?"}
                        {game.activeModule === "rotation" &&
                          "Tip: Focus op één uniek detail (zoals een uitstekend blokje) en volg waar dat heen gaat."}
                        {game.activeModule === "chirality" &&
                          "Tip: Let op 'Handigheid'. Een spiegelbeeld (enantiomeer) kan nooit door draaien exact hetzelfde worden als het origineel."}
                        {game.activeModule === "pathfinding" &&
                          "Tip: Volg de route stap voor stap. 'Links' hangt af van de kijkrichting in de buis."}
                        {game.activeModule === "xray" &&
                          "Tip: De binnenkern moet precies passen in de holtes van de buitenkant. Let op uitsteeksels."}
                        {game.activeModule === "folding" &&
                          "Tip: Werk in gedachten terug: Vouw het papier stap voor stap open en spiegel de gaten."}
                        {![
                          "nets",
                          "mechanical",
                          "cross-section",
                          "stability",
                          "counting",
                          "pov",
                          "projection",
                          "shadows",
                          "rotation",
                          "chirality",
                          "pathfinding",
                          "xray",
                          "folding",
                        ].includes(game.activeModule) &&
                          "Tip: Neem de tijd om het figuur vanuit alle hoeken te analyseren."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 text-slate-400 text-xs leading-relaxed italic">
                    <div className="mt-0.5">
                      <AlertCircle size={14} className="text-sky-400/50" />
                    </div>
                    <p>
                      {t(
                        "studio_3d.spatial.hint_text",
                        "Vergelijk het doelfiguur met de opties. Let op oriëntatie en structuur.",
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
