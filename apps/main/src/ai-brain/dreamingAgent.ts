import { getSyncLog } from "@vwo/business-logic";
import { EventEmitter } from "events";

import { safeLog } from "../utils/safe-logger";
import { getOrchestrator } from "./orchestrator";

export class DreamingAgent extends EventEmitter {
  private isDreaming: boolean = false;
  private idleThresholdMs: number = 30000; // 30 seconds idle
  private lastActivity: number = Date.now();
  private dreamInterval: NodeJS.Timeout | null = null;
  private backoffUntil: number = 0;

  constructor() {
    super();
    this.startWatching();

    // Safety cleanup if running in main process
    if (typeof process !== "undefined" && process.on) {
      process.on("beforeExit", () => this.destroy());
    }
  }

  private startWatching() {
    this.dreamInterval = setInterval(() => {
      const now = Date.now();
      if (now < this.backoffUntil) return;

      if (!this.isDreaming && now - this.lastActivity > this.idleThresholdMs) {
        this.startDreaming();
      }
    }, 10000); // Check every 10s
  }

  notifyActivity() {
    this.lastActivity = Date.now();
    if (this.isDreaming) {
      this.stopDreaming();
    }
  }

  private async startDreaming() {
    this.isDreaming = true;
    this.emit("dream_started");
    safeLog.log(
      "[DreamingAgent] System idle. Starting proactive reflections...",
    );

    try {
      // 1. Get recent weak points
      const syncLog = getSyncLog();
      // In real scenario: const weakPoints = syncLog.getRecentWeakPoints();
      // Mocking weak point context for now
      const mockContext =
        "User struggled with Centripetal Force in Physics Lab yesterday.";

      // 2. Ask AI for a suggestion
      const orchestrator = getOrchestrator();

      // Check for model availability before executing
      // We use a safe check here. If execute throws, the catch block handles it.
      // But we want to avoid the "Error while dreaming" log if it's just "No models available".

      const prompt = `Context: ${mockContext}. Generate a short, encouraging 1-sentence study tip or challenge for the student.`;

      const aiSuggestion = await orchestrator.execute(prompt, {
        intent: "education_help",
        preferFast: true, // Dreaming should be cheap
      });

      // 3. Log the suggestion
      if (syncLog) {
        syncLog.append("proactive_suggestion", {
          type: "weak_point_focus",
          title: "Verdieping: Natuurkunde Krachten",
          description: aiSuggestion, // Real AI output
          action: "open_physics_lab",
        });
        safeLog.log("[DreamingAgent] Generated suggestion:", aiSuggestion);
      }
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes("No model available")) {
        safeLog.log(
          "[DreamingAgent] No models available for dreaming. Backing off for 1 minute.",
        );
        this.backoffUntil = Date.now() + 60000;
      } else {
        safeLog.error("[DreamingAgent] Error while dreaming:", error);
      }
    } finally {
      this.isDreaming = false;
    }
  }

  private stopDreaming() {
    this.isDreaming = false;
    this.emit("dream_stopped");
    safeLog.log("[DreamingAgent] Activity detected. Stopping dreams.");
  }

  destroy() {
    if (this.dreamInterval) {
      clearInterval(this.dreamInterval);
    }
  }
}

// Singleton
let instance: DreamingAgent | null = null;
export function getDreamingAgent() {
  if (!instance) instance = new DreamingAgent();
  return instance;
}
