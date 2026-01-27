import type { AITask } from "@vwo/shared-types";
import { BrowserWindow } from "electron";
import { EventEmitter } from "events";

import { getLMStudioRunner } from "../../../../src/shared/api/model-runners/lmStudioRunner";
import { getOllamaRunner } from "../../../../src/shared/api/model-runners/ollamaRunner";
import { aiModelDao } from "../db/sqlite";

const TIMEOUT_MS = 60000;

class TaskQueueManager extends EventEmitter {
  private localQueue: AITask[] = [];
  private cloudQueue: AITask[] = [];
  private isLocalRunning = false;
  private mainWindow: BrowserWindow | null = null;

  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  private syncFrontend() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send("queue:update", {
        localQueue: this.localQueue,
        cloudQueue: this.cloudQueue,
        isLocalRunning: this.isLocalRunning,
      });
    }
  }

  addTask(
    taskData: Omit<AITask, "id" | "status" | "createdAt"> & { id?: string },
  ): string {
    const id =
      taskData.id ||
      `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const task: AITask = {
      ...taskData,
      id,
      status: "pending",
      createdAt: Date.now(),
    };

    if (task.isLocal) {
      this.localQueue.push(task);
      this.localQueue.sort((a, b) => b.priority - a.priority);
    } else {
      this.cloudQueue.push(task);
      this.cloudQueue.sort((a, b) => b.priority - a.priority);
    }

    this.syncFrontend();
    this.processLocalQueue(); // Auto-start
    return id;
  }

  async processLocalQueue() {
    if (this.isLocalRunning) return;
    this.isLocalRunning = true;
    this.syncFrontend();

    try {
      while (true) {
        const nextTask = this.localQueue.find((t) => t.status === "pending");
        if (!nextTask) break;

        // Update status to running
        nextTask.status = "running";
        nextTask.startedAt = Date.now();
        this.syncFrontend();

        try {
          const output = await this.executeTask(nextTask);
          nextTask.status = "completed";
          nextTask.completedAt = Date.now();
          nextTask.output = output;
        } catch (error) {
          nextTask.status = "failed";
          nextTask.error =
            error instanceof Error ? error.message : "Unknown error";
        }

        this.syncFrontend();
      }
    } finally {
      this.isLocalRunning = false;
      this.syncFrontend();
    }
  }

  private async executeTask(task: AITask): Promise<string> {
    // Retrieve model config from DB (Backend Safe)
    const model = task.modelId ? aiModelDao.get(task.modelId) : undefined;

    if (!model) throw new Error(`Model ${task.modelId} not found`);

    const executionPromise = (async () => {
      if (model.provider === "ollama") {
        const runner = getOllamaRunner(model.endpoint || undefined);
        const res = await runner.generate({
          model: model.modelId,
          prompt: task.prompt,
          system: task.systemPrompt,
        });
        return res.response;
      } else if (model.provider === "lm_studio") {
        const runner = getLMStudioRunner(model.endpoint || undefined);
        return await runner.generate(task.prompt, task.systemPrompt);
      } else {
        throw new Error(`Unsupported provider: ${model.provider}`);
      }
    })();

    const timeoutPromise = new Promise<string>((_, reject) => {
      setTimeout(() => reject(new Error("Task timed out")), TIMEOUT_MS);
    });

    return Promise.race([executionPromise, timeoutPromise]);
  }

  // Helper to clear completed
  clearCompleted() {
    this.localQueue = this.localQueue.filter(
      (t) => t.status === "pending" || t.status === "running",
    );
    this.cloudQueue = this.cloudQueue.filter(
      (t) => t.status === "pending" || t.status === "running",
    );
    this.syncFrontend();
  }
}

export const taskQueueManager = new TaskQueueManager();
