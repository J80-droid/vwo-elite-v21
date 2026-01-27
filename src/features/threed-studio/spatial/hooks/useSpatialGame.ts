/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useTranslations } from "@shared/hooks/useTranslations";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  LevelConfig,
  MatrixLevel,
  StructureOption,
  TrainingModule,
} from "../../types";
import { generateFoldingRound } from "../logic/foldingLogic"; // Refreshing IDE
import { generateMechanicalRound } from "../logic/mechanicalLogic";
import { generateStandardRound } from "../logic/roundGenerators";

// import * as Tone from 'tone'; // Refactored to dynamic
let globalTone: any = null;

interface UseSpatialGameProps {
  initialModule?: TrainingModule;
  levelMatrix: Record<MatrixLevel, LevelConfig>;
  maxRounds?: number;
  soundEnabled?: boolean;
  initialLevel?: number;
}

export const useSpatialGame = ({
  initialModule = "rotation",
  levelMatrix,
  maxRounds = 10,
  soundEnabled = true,
  initialLevel = 1,
}: UseSpatialGameProps) => {
  const { t } = useTranslations();
  // Game State
  const [activeModule, setActiveModule] =
    useState<TrainingModule>(initialModule);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  // Level State
  // Validate initial level is within bounds (1-5)
  const validLevel = Math.max(1, Math.min(5, initialLevel)) as MatrixLevel;
  const [currentLevel, setCurrentLevel] = useState<MatrixLevel>(validLevel);
  const [lastLevel, setLastLevel] = useState<MatrixLevel>(validLevel);
  const [levelConfig, setLevelConfig] = useState<LevelConfig>(
    levelMatrix[validLevel],
  );

  // Round Data
  const [options, setOptions] = useState<StructureOption[]>([]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [investigateMode, setInvestigateMode] = useState(false); // Pause to let student investigate correct answer
  const [revealedOption, setRevealedOption] = useState<number | null>(null);
  const [highScore, setHighScore] = useState(0);
  const [streak, setStreak] = useState(0); // Track consecutive correct answers

  // Load High Score
  useEffect(() => {
    const stored = localStorage.getItem("spatial-highscore");
    if (stored) setHighScore(parseInt(stored));
  }, []);

  // Module Specific Data (Generic containers)
  const [questionData, setQuestionData] = useState<any>(null); // For Rotation structure, etc
  const [gears, setGears] = useState<any[]>([]); // Mechanical
  const [folds, setFolds] = useState<any[]>([]); // Folding
  const [punches, setPunches] = useState<any[]>([]); // Folding

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const historyRef = useRef<Set<string>>(new Set());

  // --- Core Logic ---

  const generateRound = useCallback(
    (mod: TrainingModule, cfg: LevelConfig) => {
      // Reset per round state
      setFeedback(null);
      setHintsUsed(0);
      setInvestigateMode(false);
      setRevealedOption(null);

      let newOptions: StructureOption[] = [];
      let newCorrectIdx =
        mod === "mechanical"
          ? Math.floor(Math.random() * 2)
          : Math.floor(Math.random() * 4);

      // Dispatch to logic modules
      if (mod === "mechanical") {
        const data = generateMechanicalRound(newCorrectIdx);
        newOptions = data.options;
        setGears(data.gears);
        // Mechanical usually implies direction question
        setQuestionData({
          correctDir: data.correctDir,
          gears: data.gears,
          belts: data.belts,
        });
      } else if (mod === "folding") {
        const data = generateFoldingRound(cfg, newCorrectIdx);
        newOptions = data.options;
        setFolds(data.folds);
        setPunches(data.punches);
        setQuestionData({ folds: data.folds, punches: data.punches });
      } else {
        // Standard / Placeholder for others
        const data = generateStandardRound(
          mod,
          cfg,
          score,
          t,
          historyRef.current,
        );
        newOptions = data.options;
        newCorrectIdx = data.correctIdx;
        setQuestionData(data.questionData);

        // Update History
        if (data.questionData?.hash) {
          historyRef.current.add(data.questionData.hash);
          // Keep history manageable
          if (historyRef.current.size > 50) {
            const first = historyRef.current.values().next().value;
            if (first) historyRef.current.delete(first);
          }
        }
      }

      setOptions(newOptions);
      setCorrectIndex(newCorrectIdx);
      setTimeLeft(cfg.timeLimit);
    },
    [score],
  );

  // Start Game
  const startGame = (mod: TrainingModule) => {
    setActiveModule(mod);
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setRound(1);
    setCurrentLevel(validLevel);
    setLevelConfig(levelMatrix[validLevel]);
    generateRound(mod, levelMatrix[validLevel]);
  };

  const synthRef = useRef<any>(null);
  const duoSynthRef = useRef<any>(null);

  // Sound Logic helpers
  const initAudio = useCallback(async () => {
    if (!soundEnabled) return null;
    if (!globalTone) {
      try {
        globalTone = await import("tone");
      } catch (e) {
        console.warn("Failed to load Tone.js", e);
        return null;
      }
    }
    const Tone = globalTone;
    if (Tone.context.state !== "running") {
      try {
        await Tone.start();
      } catch (e) {
        console.warn("Audio context start blocked", e);
      }
    }
    return Tone;
  }, [soundEnabled]);

  const playCorrect = useCallback(async () => {
    const Tone = await initAudio();
    if (!Tone) return;

    try {
      if (!synthRef.current) {
        synthRef.current = new Tone.Synth().toDestination();
      }
      if (synthRef.current) {
        synthRef.current.triggerAttackRelease("C5", "8n");
        setTimeout(
          () => synthRef.current?.triggerAttackRelease("G5", "8n"),
          100,
        );
      }
    } catch (e) {
      console.warn("Correct sound play failed", e);
    }
  }, [initAudio]);

  const playWrong = useCallback(async () => {
    const Tone = await initAudio();
    if (!Tone) return;

    try {
      if (!duoSynthRef.current) {
        duoSynthRef.current = new Tone.DuoSynth().toDestination();
      }
      if (duoSynthRef.current) {
        duoSynthRef.current.triggerAttackRelease("G2", "4n");
      }
    } catch (e) {
      console.warn("Wrong sound play failed", e);
    }
  }, [initAudio]);

  // Handle Guess
  const handleGuess = (idx: number) => {
    if (feedback) return; // Prevent double clicking

    const isCorrect = idx === correctIndex;
    if (isCorrect) {
      setFeedback("correct");
      playCorrect();

      // Update streak
      const newStreak = streak + 1;
      setStreak(newStreak);

      // Calc Score with actual streak bonus
      const timeBonus = Math.floor(timeLeft * (10 + currentLevel * 2));
      const streakBonus = Math.min(newStreak * 50, 500); // 50 points per streak, max 500
      const roundScore = levelConfig.points + timeBonus + streakBonus;
      setScore((s) => {
        const newScore = s + roundScore;
        if (newScore > highScore) {
          setHighScore(newScore);
          localStorage.setItem("spatial-highscore", newScore.toString());
        }
        return newScore;
      });

      // Level Up Check
      if (round % 2 === 0 && currentLevel < 5) {
        // Simple logic for now
        const nextLv = (currentLevel + 1) as MatrixLevel;
        setLastLevel(currentLevel);
        setCurrentLevel(nextLv);
        setLevelConfig(levelMatrix[nextLv]);
      }

      // Auto-advance after correct answer
      setTimeout(() => {
        if (round >= maxRounds) {
          setGameOver(true);
        } else {
          setRound((r) => r + 1);
          generateRound(activeModule, levelConfig);
        }
      }, 1500);
    } else {
      setFeedback("wrong");
      playWrong();
      setStreak(0); // Reset streak on wrong answer
      // Enable investigate mode - student can click correct answer to investigate
      setInvestigateMode(true);
      // Do NOT auto-advance - wait for student to click 'Volgende' or investigate
    }
  };

  // Handle clicking correct answer during investigate mode
  const handleInvestigate = (idx: number) => {
    if (!investigateMode || idx !== correctIndex) return;
    // Student clicked on correct answer to investigate - reveal it
    setRevealedOption(idx);
  };

  // Manual advance to next round (after wrong answer)
  const advanceRound = () => {
    if (round >= maxRounds) {
      setGameOver(true);
    } else {
      setRound((r) => r + 1);
      generateRound(activeModule, levelConfig);
    }
  };

  // Timer Logic
  useEffect(() => {
    if (gameStarted && !gameOver && !feedback && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0 && !feedback && gameStarted) {
      // Time Out treated as Wrong
      setFeedback("wrong");
      setTimeout(() => {
        if (round >= maxRounds) {
          setGameOver(true);
        } else {
          setRound((r) => r + 1);
          generateRound(activeModule, levelConfig);
        }
      }, 1500);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    timeLeft,
    gameStarted,
    gameOver,
    feedback,
    round,
    activeModule,
    levelConfig,
    generateRound,
  ]);

  return {
    // State
    activeModule,
    setActiveModule,
    round,
    score,
    timeLeft,
    gameStarted,
    gameOver,
    currentLevel,
    lastLevel,
    levelConfig,
    options,
    correctIndex,
    feedback,
    hintsUsed,
    setHintsUsed,
    investigateMode,
    revealedOption,
    highScore,

    // Data
    questionData,
    gears,
    folds,
    punches,

    // Actions
    startGame,
    handleGuess,
    handleInvestigate,
    advanceRound,
  };
};
