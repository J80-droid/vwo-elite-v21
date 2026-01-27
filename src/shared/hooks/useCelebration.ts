/* eslint-disable @typescript-eslint/no-explicit-any -- canvas-confetti opts spread */
/**
 * Celebration Hook
 * Provides confetti and celebration effects for achievements
 */

import confetti from "canvas-confetti";
import { useCallback } from "react";

interface CelebrationOptions {
  particleCount?: number;
  spread?: number;
  origin?: { x: number; y: number };
  colors?: string[];
}

interface UseCelebrationReturn {
  celebrate: (options?: CelebrationOptions) => void;
  celebrateMastery: () => void;
  celebrateCompletion: () => void;
  celebrateStreak: (streak: number) => void;
  fireworks: () => void;
}

export function useCelebration(): UseCelebrationReturn {
  const celebrate = useCallback((options: CelebrationOptions = {}) => {
    const {
      particleCount = 100,
      spread = 70,
      origin = { x: 0.5, y: 0.6 },
      colors = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b"],
    } = options;

    confetti({
      particleCount,
      spread,
      origin,
      colors,
      disableForReducedMotion: true,
    });
  }, []);

  const celebrateMastery = useCallback(() => {
    // Double burst for 100% mastery
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      colors: ["#10b981", "#059669", "#34d399"], // Emerald tones
    };

    function fire(particleRatio: number, opts: any) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
        disableForReducedMotion: true,
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  }, []);

  const celebrateCompletion = useCallback(() => {
    // Gentle celebration for lesson completion
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.65 },
      colors: ["#3b82f6", "#60a5fa", "#93c5fd"],
      disableForReducedMotion: true,
    });
  }, []);

  const celebrateStreak = useCallback((streak: number) => {
    // Scaled celebration based on streak
    const intensity = Math.min(streak / 7, 1); // Max intensity at 7-day streak

    confetti({
      particleCount: Math.floor(30 + intensity * 100),
      spread: 50 + intensity * 50,
      origin: { y: 0.6 },
      colors: ["#f59e0b", "#fbbf24", "#fcd34d"],
      disableForReducedMotion: true,
    });
  }, []);

  const fireworks = useCallback(() => {
    // Fireworks effect for major achievements
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = {
      startVelocity: 30,
      spread: 360,
      ticks: 60,
      zIndex: 9999,
    };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      // Random positions
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ["#ff6b6b", "#feca57", "#48dbfb", "#1dd1a1", "#ff9ff3"],
        disableForReducedMotion: true,
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ["#ff6b6b", "#feca57", "#48dbfb", "#1dd1a1", "#ff9ff3"],
        disableForReducedMotion: true,
      });
    }, 250);
  }, []);

  return {
    celebrate,
    celebrateMastery,
    celebrateCompletion,
    celebrateStreak,
    fireworks,
  };
}
