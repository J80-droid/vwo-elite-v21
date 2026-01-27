import { AIConfig } from "@vwo/shared-types";
import { pipeline } from "@xenova/transformers";
import { app } from "electron";
import path from "path";

import { safeLog } from "../utils/safe-logger";

export class AIService {
  private static instance: AIService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractor: any | null = null;
  private modelId = AIConfig.embedding.modelId;

  private initPromise: Promise<void> | null = null;
  private idleTimer: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  private async init() {
    if (this.extractor) return;

    // Return existing promise if initialization is in progress
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        safeLog.log(`[AIService] Loading model: ${this.modelId}`);

        // STRATEGY: Hybrid Offline/Online
        // 1. Check for bundled model (Production/Offline priority)
        // 2. Fallback to userData cache (Dev/Online priority)

        const bundledPath = path.join(process.resourcesPath, "models"); // In prod: resources/models
        const userDataPath = path.join(app.getPath("userData"), "ai-models");

        // Default to downloading/caching in userData
        let cacheDir = userDataPath;

        // In production, we expect models to be unpacked in resources/models
        if (app.isPackaged) {
          safeLog.log(
            `[AIService] Production mode: Checking bundled models at ${bundledPath}`,
          );
          // Simple heuristic: set cacheDir to bundledPath.
          // If files exist, transformers will use them.
          // NOTE: Proper implementation requires filesystem check, but for now we set intent.
          cacheDir = bundledPath;
          // We could force localFilesOnly = true to prevent accidental downloads if bundle is corrupt
          // localFilesOnly = true;
        } else {
          safeLog.log(
            `[AIService] Dev mode: Using userData cache at ${userDataPath}`,
          );
        }

        process.env.TRANSFORMERS_CACHE = cacheDir;

        this.extractor = await pipeline("feature-extraction", this.modelId, {
          quantized: true, // Use quantized model for performance/size
          // cache_dir: cacheDir // Xenova transformers usually uses env var or default
          // local_files_only: localFilesOnly
        });
        safeLog.log(`[AIService] Model loaded successfully.`);
      } catch (error) {
        safeLog.error(`[AIService] Failed to load model:`, error);
        // Reset promise on failure so we can retry
        this.initPromise = null;
        throw error;
      }
    })();

    return this.initPromise;
  }

  /**
   * Memory Optimization:
   * Release model from memory after 30 minutes of inactivity.
   */
  private resetIdleTimer() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }

    // 30 minutes = 30 * 60 * 1000 = 1800000 ms
    this.idleTimer = setTimeout(
      () => {
        safeLog.log("[AIService] Idle timer expired. Releasing model memory.");
        this.dispose();
      },
      30 * 60 * 1000,
    );
  }

  private dispose() {
    if (this.extractor) {
      // Transformers.js pipeline doesn't have a direct 'dispose' method,
      // but setting it to null allows GC to reclaim memory.
      this.extractor = null;
      this.initPromise = null;
      if (global.gc) {
        global.gc(); // Force GC if available (requires --expose-gc)
      }
    }
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  /**
   * Generates an embedding vector for the given text.
   * Returns a Float32Array (zero-copy) for all-MiniLM-L6-v2.
   */
  async embed(text: string): Promise<Float32Array> {
    await this.init();
    this.resetIdleTimer(); // Reset timer on activity

    if (!this.extractor) {
      throw new Error("Model failed to initialize");
    }

    // Clean text
    const cleanText = text.replace(/\n/g, " ").trim();
    if (!cleanText)
      return new Float32Array(AIConfig.embedding.dimensions).fill(0);

    const output = await this.extractor(cleanText, {
      pooling: "mean",
      normalize: true,
    });

    // Optimization: Return Float32Array directly to avoid copy
    return output.data as Float32Array;
  }
}
