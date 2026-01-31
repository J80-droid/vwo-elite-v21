/**
 * Bootstrap Service
 *
 * Centralizes app initialization to ensure proper startup sequence:
 * 1. Initialize database (SQLite)
 * 2. Run any pending migrations
 * 3. Load settings and initialize stores
 *
 * This ensures the app is fully ready before rendering.
 */

import { useAchievementStore } from "../model/achievementStore";
import { logger } from "../model/debugStore";
import { useModelsStore } from "../model/modelsStore";
import { usePlannerEliteStore } from "../model/plannerStore";
import { useQuizProgressStore } from "../model/quizProgressStore";
import { useUserStatsStore } from "../model/userStatsStore";
import { runPersistenceMigration } from "./persistenceMigration";
import { pruneDatabase } from "./pruningService";
import { somtodayService } from "./somtodayService";
import {
  getAllQuizHistorySQL,
  getAllSavedQuestionsSQL,
  getSettingsSQL,
  initDatabase,
  saveFlashcardSQL,
  saveQuestionSQL,
  saveQuizHistorySQL,
} from "./sqliteService";

let initialized = false;
let criticalPromise: Promise<BootstrapResult> | null = null;
let deferredPromise: Promise<void> | null = null;

export interface BootstrapResult {
  success: boolean;
  error?: string;
  duration: number;
}

/**
 * Step 1: Critical Initialization
 * Must complete before the app shell renders to avoid data mismatches.
 * Focused on local DB and core settings.
 */
export async function bootstrapCritical(): Promise<BootstrapResult> {
  if (initialized) return { success: true, duration: 0 };
  if (criticalPromise) return criticalPromise;

  criticalPromise = (async () => {
    const startTime = performance.now();
    try {
      // 1. Initialize database (SQLite)
      await initDatabase();
      logger.info("Bootstrap: Database connection established");

      // 2. Load settings
      const settings = await getSettingsSQL();
      logger.info("Bootstrap: Settings loaded from SQLite");

      // 3. Hydrate Core Stores (Stats & Achievements)
      if (settings) {
        useAchievementStore
          .getState()
          .setInitialState(
            settings.xp || 0,
            settings.level || 1,
            settings.unlockedAchievements || [],
          );

        useUserStatsStore.getState().setStats({
          xp: {
            current: settings.xp || 0,
            total: settings.xp || 0,
            level: settings.level || 1,
            nextLevelThreshold: (settings.level || 1) * 1000,
          },
          streak: {
            current: settings.streak || 0,
            best: settings.streak || 0,
            lastLoginDate: new Date().toISOString().split("T")[0] || "",
          },
        });
      }

      const duration = performance.now() - startTime;
      return { success: true, duration };
    } catch (error) {
      console.error("[Bootstrap] ✗ Critical init failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Critical init error",
        duration: performance.now() - startTime,
      };
    } finally {
      // Keep criticalPromise if it succeeded to prevent re-runs, 
      // but we check 'initialized' anyway.
    }
  })();

  return criticalPromise;
}

/**
 * Step 2: Deferred Initialization
 * Can run while the app shell is visible.
 * Handles network-dependent services and heavy migrations.
 */
export async function bootstrapDeferred(): Promise<void> {
  if (initialized) return;
  if (deferredPromise) return deferredPromise;

  deferredPromise = (async () => {
    const startTime = performance.now();
    try {
      // 1. Migrations & Pruning (Background)
      await runPersistenceMigration();
      await runZustandMigration();
      await pruneDatabase();
      logger.info("Bootstrap: Background migrations and pruning complete");

      // 2. Load History for Quiz Store (potentially large)
      const quizHistory = await getAllQuizHistorySQL();
      const savedQuestions = await getAllSavedQuestionsSQL();
      useQuizProgressStore.getState().setInitialState({
        history: quizHistory,
        savedQuestions: savedQuestions,
      });

      // 3. Network Services (Async)
      const settings = await getSettingsSQL();

      // Fire-and-forget session refresh
      somtodayService.initialize().catch(console.error);

      // Initialize Planner (usually involves fetching latest tasks)
      await usePlannerEliteStore.getState().initialize();

      // Initialize AI configuration if available
      if (settings?.aiConfig) {
        // 🚀 ELITE BOOTSTRAP: Initialize Tool Registry
        const { initializeAIBrain } = await import("./ai-brain/bootstrap");
        await initializeAIBrain();

        await useModelsStore.getState().initialize(settings);
        logger.info("Bootstrap: AI Registry and Models initialized");
      }

      initialized = true;
      logger.info("Bootstrap: Finalized successfully", { duration: performance.now() - startTime });
    } catch (error) {
      console.error("[Bootstrap] ✗ Deferred init failed:", error);
    } finally {
      // Keep deferredPromise to prevent re-runs
    }
  })();

  return deferredPromise;
}

/**
 * Legacy wrapper for backward compatibility
 */
export async function bootstrapApp(): Promise<BootstrapResult> {
  const crit = await bootstrapCritical();
  if (crit.success) {
    // Start deferred in background but don't block
    bootstrapDeferred();
  }
  return crit;
}

/**
 * Check if the app has been bootstrapped
 */
export function isBootstrapped(): boolean {
  return initialized;
}

/**
 * Reset bootstrap state (for testing only)
 */
export function resetBootstrap(): void {
  initialized = false;
}
/**
 * Migrate legacy Zustand stores from LocalStorage to SQLite.
 */
async function runZustandMigration(): Promise<void> {
  const legacyFlashcardsKey = "vwo-flashcard-store";
  const legacyAchievementsKey = "vwo-elite-achievements";
  const legacyQuizProgressKey = "quiz-progress-store";

  const hasLegacyData =
    localStorage.getItem(legacyFlashcardsKey) ||
    localStorage.getItem(legacyAchievementsKey) ||
    localStorage.getItem(legacyQuizProgressKey);

  if (!hasLegacyData) return;

  console.log("[Bootstrap] Legacy Zustand data found, migrating to SQLite...");
  // Dynamic import removed to fix build warning (conflicting static/dynamic imports)
  // const { saveFlashcardSQL, saveQuizHistorySQL, saveQuestionSQL } = await import('./sqliteService');

  try {
    // Flashcards Migration
    const fcData = localStorage.getItem(legacyFlashcardsKey);
    if (fcData) {
      const parsed = JSON.parse(fcData);
      const cards = parsed.state?.cards || [];
      for (const card of cards) {
        await saveFlashcardSQL(card);
      }
    }

    // Quiz Progress Migration
    const qpData = localStorage.getItem(legacyQuizProgressKey);
    if (qpData) {
      const parsed = JSON.parse(qpData);
      const state = parsed.state || {};

      const history = state.history || [];
      for (const entry of history) {
        await saveQuizHistorySQL(entry);
      }

      const saved = state.savedQuestions || [];
      for (const s of saved) {
        await saveQuestionSQL(s.id, s.question, s.savedAt);
      }
    }

    // Achievements Migration (Settings already handles the fields, but let's clear the old key)
    localStorage.removeItem(legacyFlashcardsKey);
    localStorage.removeItem(legacyAchievementsKey);
    localStorage.removeItem(legacyQuizProgressKey);

    console.log("[Bootstrap] ✓ Zustand migration complete");
  } catch (error) {
    console.error("[Bootstrap] ✗ Zustand migration failed:", error);
  }
}
