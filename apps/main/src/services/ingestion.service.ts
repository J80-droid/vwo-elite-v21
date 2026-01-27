import { DocumentChunk, DocumentMeta } from "@vwo/shared-types";
import path from "path";
import { Worker } from "worker_threads";

import { DocumentRepository } from "../repositories/document.repository";
import { safeLog } from "../utils/safe-logger";
import { AIService } from "./ai.service";

interface IngestionTask {
  filePath: string;
  meta: DocumentMeta;
}

export class IngestionService {
  private static instance: IngestionService;
  private queue: IngestionTask[] = [];
  private activeWorkers: number = 0;
  private maxWorkers: number = 2; // Concurrent file files

  private worker: Worker | null = null; // Persistent Worker

  private constructor() {}

  static getInstance(): IngestionService {
    if (!IngestionService.instance) {
      IngestionService.instance = new IngestionService();
    }
    return IngestionService.instance;
  }

  // Initialize/Get Persistent Worker
  private getWorker(): Worker {
    if (!this.worker) {
      // Path to build output of worker.
      // In both dev and prod, ingestion.worker.js is in the same folder as index.js (out/main/)
      const workerPath = path.join(__dirname, "ingestion.worker.js");

      safeLog.log(`[Ingestion] Initializing worker at: ${workerPath}`);
      // RESOURCE LIMIT INCREASED FOR 4GB
      this.worker = new Worker(workerPath, {
        resourceLimits: {
          maxOldGenerationSizeMb: 4096, // 4GB
        },
      });

      this.worker.on("error", (err) => {
        safeLog.error("[Ingestion] Worker Error:", err);
        // We should probably restart the worker here if it crashes
        this.worker?.terminate();
        this.worker = null;
      });

      this.worker.on("exit", (code) => {
        if (code !== 0) {
          safeLog.error(`[Ingestion] Worker exited with code ${code}`);
          this.worker = null;
        }
      });
      safeLog.log("[Ingestion] Worker Pool Initialized.");
    }
    return this.worker;
  }

  async addFile(filePath: string, meta: DocumentMeta): Promise<void> {
    this.queue.push({ filePath, meta });
    this.processQueue();
  }

  /**
   * Immediate ingestion flow. Used when the caller needs to wait for completion.
   */
  async ingest(
    filePath: string,
    meta: DocumentMeta,
    onProgress?: (
      stage: string,
      current: number,
      total: number,
      etr: number,
    ) => void,
  ): Promise<boolean> {
    safeLog.log(`[Ingestion] Starting immediate ingestion: ${meta.title}`);
    try {
      // 1. Parse File (Off-thread via Persistent Worker)
      if (onProgress) onProgress("parsing", 0, 100, 0);
      const chunks = await this.parseInWorker(filePath, meta.id);
      if (onProgress) onProgress("parsing", 100, 100, 0);

      // 2. Vectorize (Main Thread / GPU)
      const ai = AIService.getInstance();
      const total = chunks.length;
      let processed = 0;
      const startTime = Date.now();

      for (const chunk of chunks) {
        const vectorArray = await ai.embed(chunk.text);
        chunk.vector = Array.from(vectorArray);

        processed++;

        // Progress & ETR Calculation
        if (onProgress && processed % 2 === 0) {
          // Emit every 2 chunks to effectively throttle
          const elapsed = Date.now() - startTime;
          const avgTimePerChunk = elapsed / processed;
          const remaining = total - processed;
          const etrSeconds = Math.ceil((remaining * avgTimePerChunk) / 1000);

          onProgress("vectorizing", processed, total, etrSeconds);
        }
      }

      // 3. Store (LanceDB + SQLite)
      const repo = new DocumentRepository();
      await repo.addDocument(meta, chunks);

      safeLog.log(`[Ingestion] Completed immediate ingestion: ${meta.title}`);
      return true;
    } catch (error) {
      safeLog.error(
        `[Ingestion] Immediate ingestion failed ${meta.title}:`,
        error,
      );
      throw error;
    }
  }

  private async parseInWorker(
    filePath: string,
    documentId: string,
  ): Promise<DocumentChunk[]> {
    // ... (existing Implementation)
    return new Promise((resolve, reject) => {
      const worker = this.getWorker();
      const taskId = Math.random().toString(36).substring(7);

      // Handlers
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const messageHandler = (msg: any) => {
        if (msg.id !== taskId) return;
        cleanup();
        if (msg.type === "success") {
          resolve(msg.data.chunks);
        } else {
          reject(new Error(msg.error));
        }
      };

      const errorHandler = (err: Error) => {
        cleanup();
        reject(
          new Error(`Worker crashed processing ${filePath}: ${err.message}`),
        );
      };

      const exitHandler = (code: number) => {
        if (code !== 0) {
          cleanup();
          reject(
            new Error(`Worker process exited unexpectedly with code ${code}`),
          );
        }
      };

      const cleanup = () => {
        worker.off("message", messageHandler);
        worker.off("error", errorHandler);
        worker.off("exit", exitHandler);
      };

      worker.on("message", messageHandler);
      worker.on("error", errorHandler);
      worker.on("exit", exitHandler);

      worker.postMessage({ type: "parse", id: taskId, filePath, documentId });
    });
  }

  private async processQueue() {
    if (this.queue.length === 0 || this.activeWorkers >= this.maxWorkers)
      return;

    const task = this.queue.shift();
    if (!task) return;

    this.activeWorkers++;
    try {
      await this.ingest(task.filePath, task.meta);
    } catch {
      // Error already logged in ingest()
    } finally {
      this.activeWorkers--;
      this.processQueue();
    }
  }
}
