import { ToolResponse } from "@vwo/shared-types";

import { safeLog } from "../../lib/safe-logger";
import type { ToolCallRequest } from "../../types/ai-brain";
import { sqliteInsert } from "../sqliteService";
import { getToolRegistry } from "./ToolRegistry";

export class ToolRunner {
  /**
   * Main entry point to execute a tool
   * 
   * SECURITY: Dynamic code execution via `new Function` has been REMOVED.
   * All tools must be registered via ToolRegistry at startup.
   */
  async executeTool(request: ToolCallRequest): Promise<ToolResponse> {
    const startTime = Date.now();
    const { toolName, parameters } = request;

    console.log(`[ToolRunner] Executing ${toolName}...`);

    try {
      // 1. LOOKUP: Get handler from Registry
      const handler = getToolRegistry().get(toolName);

      if (!handler) {
        // Fallback to legacy internal execution for backward compatibility
        const result = await this.executeInternalLegacy(toolName, parameters as Record<string, unknown>);
        const durationMs = Date.now() - startTime;
        await this.logUsage(toolName, this.scrubParameters(parameters as Record<string, unknown>), result, durationMs, true);
        return {
          success: true,
          data: result,
          metadata: { durationMs, toolName, timestamp: Date.now(), category: "Legacy" },
        };
      }

      // 2. VALIDATION: Use the tool's own Zod schema
      if (handler.schema) {
        const validation = handler.schema.safeParse(parameters);
        if (!validation.success) {
          throw new Error(`Validation failed for ${toolName}: ${validation.error.message}`);
        }
      }

      // 3. EXECUTION: Delegate to the registered handler
      console.log(`[ToolRunner] Delegating to ${handler.category}/${handler.name}`);
      const result = await handler.execute(parameters as Record<string, unknown>);

      const durationMs = Date.now() - startTime;
      await this.logUsage(toolName, this.scrubParameters(parameters as Record<string, unknown>), result, durationMs, true);

      return {
        success: true,
        data: result,
        metadata: {
          durationMs,
          toolName,
          timestamp: Date.now(),
          category: handler.category,
        },
      };
    } catch (error: unknown) {
      const err = error as Error;
      const durationMs = Date.now() - startTime;
      safeLog.error(`[ToolRunner] Error executing ${toolName}:`, err);

      await this.logUsage(toolName, this.scrubParameters(parameters as Record<string, unknown>), null, durationMs, false, err.message);

      return {
        success: false,
        data: null,
        error: err.message || "Unknown tool execution error",
        metadata: {
          durationMs,
          toolName,
          timestamp: Date.now(),
        },
      };
    }
  }

  /**
   * Legacy internal execution for backward compatibility
   * @deprecated Tools should be registered via ToolRegistry instead
   */
  private async executeInternalLegacy(
    name: string,
    params: Record<string, unknown>,
  ): Promise<unknown> {
    // Education Tools
    const eduTools = ["generate_lesson", "generate_study_plan", "generate_flashcards", "generate_quiz",
      "analyze_weak_points", "generate_mind_map", "explain_concept", "socratic_coach"];
    if (eduTools.includes(name)) {
      const { handleEducationTool } = await import("./tools/educationTools.legacy");
      return handleEducationTool(name, params);
    }

    // Math & Python Tools
    const mathTools = ["solve_math_problem", "graph_function", "solve_calculus", "check_solution",
      "get_hint", "image_to_formula", "graph_to_function", "execute_python"];
    if (mathTools.includes(name)) {
      const { handleMathTool } = await import("./tools/mathTools");
      return handleMathTool(name, params);
    }

    // Natural Science Tools
    const scienceTools = ["balance_equation", "lookup_periodic_table", "lookup_binas",
      "physics_formula_helper", "simulate_physics", "molecule_visualizer", "biology_diagram"];
    if (scienceTools.includes(name)) {
      const { handleScienceTool } = await import("./tools/scienceTools");
      return handleScienceTool(name, params);
    }

    // Language Tools
    const langTools = ["grammar_check", "translate_contextual", "pronunciation_coach",
      "generate_idiom_exercise", "text_to_speech", "speech_to_text", "language_feedback",
      "debate_simulator", "analyze_emotion"];
    if (langTools.includes(name)) {
      const { handleLanguageTool } = await import("./tools/languageTools");
      return handleLanguageTool(name, params);
    }

    // Research Tools
    const researchTools = ["find_academic_sources", "summarize_paper", "check_apa_citations",
      "check_originality", "generate_literature_matrix", "evaluate_source",
      "research_design_check", "analyze_pws_sources"];
    if (researchTools.includes(name)) {
      const { handleResearchTool } = await import("./tools/researchTools");
      return handleResearchTool(name, params);
    }

    // Planning Tools
    const planningTools = ["sync_somtoday", "get_schedule", "create_task", "get_deadlines",
      "optimize_schedule", "sync_calendar", "track_progress", "proactive_reminder"];
    if (planningTools.includes(name)) {
      const { handlePlanningTool } = await import("./tools/planningTools");
      return handlePlanningTool(name, params);
    }

    // Media Tools
    const mediaTools = ["generate_diagram", "generate_image", "analyze_image", "analyze_video",
      "extract_youtube_transcript", "render_3d_model", "generate_3d_model", "audio_to_notes"];
    if (mediaTools.includes(name)) {
      const { handleMediaTool } = await import("./tools/mediaTools");
      return handleMediaTool(name, params);
    }

    // External Tools
    const externalTools = ["search_wikipedia", "search_library", "get_weather",
      "web_search", "fetch_url_content", "lookup_dutch_holidays"];
    if (externalTools.includes(name)) {
      const { handleExternalTool } = await import("./tools/externalTools");
      return handleExternalTool(name, params);
    }

    // Built-in utilities
    switch (name) {
      case "internal_get_time":
        return { time: new Date().toLocaleTimeString(), date: new Date().toLocaleDateString() };
      default:
        throw new Error(`Tool ${name} not found in registry or legacy handlers.`);
    }
  }

  /**
   * Log tool usage to SQLite
   */
  private async logUsage(
    name: string,
    params: Record<string, unknown>,
    response: unknown,
    duration: number,
    success: boolean,
    error?: string,
  ) {
    try {
      await sqliteInsert("mcp_tool_usage_logs", {
        id: crypto.randomUUID(),
        tool_name: name,
        call_params: JSON.stringify(params),
        response: response ? JSON.stringify(response) : null,
        duration_ms: duration,
        success: success ? 1 : 0,
        error: error || null,
        timestamp: Math.floor(Date.now() / 1000),
      });
    } catch (e) {
      safeLog.error(`[ToolRunner] Failed to log usage for ${name}:`, e);
    }
  }

  /**
   * Scrub sensitive parameters before logging
   */
  private scrubParameters(params: Record<string, unknown>): Record<string, unknown> {
    const sensitiveKeys = ["apiKey", "api_key", "password", "token", "secret", "auth"];
    const scrubbed = { ...params };

    for (const key in scrubbed) {
      if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
        scrubbed[key] = "******** [SCRUBBED]";
      } else if (typeof scrubbed[key] === "object" && scrubbed[key] !== null) {
        scrubbed[key] = this.scrubParameters(scrubbed[key] as Record<string, unknown>);
      }
    }
    return scrubbed;
  }
}

let toolRunnerInstance: ToolRunner | null = null;

export const getToolRunner = (): ToolRunner => {
  if (!toolRunnerInstance) {
    toolRunnerInstance = new ToolRunner();
  }
  return toolRunnerInstance;
};
