/**
 * Plan Executor
 * Handles complex, multi-step agentic tasks
 * Part of the 750% Elite Intelligence Upgrade
 */
import { aiGenerate } from "../aiCascadeService";

export interface PlanStep {
    id: string;
    title: string;
    description: string;
    toolName?: string;
    toolArgs?: Record<string, unknown>;
    dependencyIds: string[];
    status: "pending" | "executing" | "completed" | "failed" | "skipped";
    result?: unknown;
    error?: string;
    startTime?: number;
    endTime?: number;
}

export interface ExecutionPlan {
    id: string;
    goal: string;
    steps: PlanStep[];
    status: "planning" | "executing" | "completed" | "failed";
    createdAt: number;
    updatedAt: number;
}

/**
 * Generate a multi-step execution plan for a given goal
 */
export async function generatePlan(
    goal: string,
    availableTools: Array<{ name: string; description: string }>,
): Promise<ExecutionPlan> {
    console.log(`[PlanExecutor] Generating plan for goal: ${goal}`);

    const systemPrompt = `Je bent een Elite Planning Agent. Jouw taak is om een complex doel op te splitsen in logische, uitvoerbare stappen.
  Gebruik de beschikbare tools waar dat zinvol is.
  
  Beschikbare tools:
  ${availableTools.map((t) => `- ${t.name}: ${t.description}`).join("\n")}
  
  Antwoord ALLEEN in het volgende JSON formaat:
  {
    "id": "uniecke_id",
    "goal": "het doel",
    "steps": [
      {
        "id": "step_1",
        "title": "Titel van de stap",
        "description": "Wat er moet gebeuren",
        "toolName": "naam_van_tool_of_leeg",
        "toolArgs": {},
        "dependencyIds": []
      }
    ]
  }`;

    const response = await aiGenerate(
        `Maak een plan voor het volgende doel: "${goal}"`,
        {
            systemPrompt,
            jsonMode: true,
        },
    );

    try {
        const planData = typeof response === "string" ? JSON.parse(response) : response;

        return {
            id: planData.id || `plan_${Date.now()}`,
            goal: planData.goal || goal,
            steps: (planData.steps || []).map((s: Record<string, unknown>) => ({
                ...s,
                status: "pending" as const,
            })),
            status: "planning",
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
    } catch (e) {
        console.error("[PlanExecutor] Failed to parse plan:", e);
        throw new Error("Planning mislukt. Kon geen geldig plan genereren.");
    }
}

/**
 * Execute a single step in a plan
 * Note: Actual tool execution should be handled by the caller (aiBrain)
 */
export async function executePlanStep(
    plan: ExecutionPlan,
    stepId: string,
    toolExecutor: (name: string, args: Record<string, unknown>) => Promise<unknown>,
): Promise<ExecutionPlan> {
    const stepIndex = plan.steps.findIndex((s) => s.id === stepId);
    if (stepIndex === -1) throw new Error(`Step ${stepId} not found`);

    const step = plan.steps[stepIndex]!;

    // Clone plan for immutability
    const nextPlan: ExecutionPlan = {
        ...plan,
        updatedAt: Date.now(),
        status: "executing"
    };
    const nextSteps = [...nextPlan.steps];

    // Update step status
    nextSteps[stepIndex] = {
        ...step,
        status: "executing",
        startTime: Date.now(),
    };
    nextPlan.steps = nextSteps;

    try {
        let result: unknown;

        if (step.toolName) {
            console.log(`[PlanExecutor] Executing tool: ${step.toolName}`);
            result = await toolExecutor(step.toolName, (step.toolArgs as Record<string, unknown>) || {});
        } else {
            // Logic without tool (thought step)
            result = await aiGenerate(
                `Voer de volgende stap uit van het plan voor "${plan.goal}": ${step.description}`,
                { systemPrompt: "Je bent een uitvoerende agent in een multi-step plan." }
            );
        }

        nextSteps[stepIndex] = {
            ...nextSteps[stepIndex]!,
            status: "completed",
            result,
            endTime: Date.now(),
        };
    } catch (error) {
        console.error(`[PlanExecutor] Step ${stepId} failed:`, error);
        nextSteps[stepIndex] = {
            ...nextSteps[stepIndex]!,
            status: "failed",
            error: error instanceof Error ? error.message : String(error),
            endTime: Date.now(),
        };
        nextPlan.status = "failed";
    }

    // Check if all steps are done
    if (nextSteps.every((s) => s.status === "completed")) {
        nextPlan.status = "completed";
    } else if (nextSteps.some((s) => s.status === "failed")) {
        nextPlan.status = "failed";
    }

    return nextPlan;
}

/**
 * Get next executable steps (all dependencies met)
 */
export function getNextSteps(plan: ExecutionPlan): PlanStep[] {
    const completedIds = new Set(
        plan.steps.filter((s) => s.status === "completed").map((s) => s.id)
    );

    return plan.steps.filter(
        (s) =>
            s.status === "pending" &&
            s.dependencyIds.every((depId) => completedIds.has(depId))
    );
}

/**
 * Summarize plan progress
 */
export function getPlanSummary(plan: ExecutionPlan): string {
    const total = plan.steps.length;
    const completed = plan.steps.filter((s) => s.status === "completed").length;
    const failed = plan.steps.filter((s) => s.status === "failed").length;

    return `Plan Progress: ${completed}/${total} completed (${failed} failed). Goal: ${plan.goal}`;
}
