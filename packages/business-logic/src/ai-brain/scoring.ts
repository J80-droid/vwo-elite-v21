import type { AIModel, TaskIntent } from "@vwo/shared-types";

/**
 * Scores a model based on intent and user preferences
 */
export function scoreModel(
  model: AIModel,
  intent: TaskIntent,
  options?: {
    preferFast?: boolean;
    preferQuality?: boolean;
  },
): number {
  let score = model.priority || 50;

  // Capability matching
  const hasVision = model.capabilities.includes("vision");
  const hasReasoning = model.capabilities.includes("reasoning");

  if (intent === "vision_task" && !hasVision) return 0;
  if (
    (intent === "math_problem" || intent === "complex_reasoning") &&
    hasReasoning
  ) {
    score += 20;
  }

  // Health check
  if (!model.enabled) return 0;
  if (model.metrics.successRate < 0.5) score -= 40;

  // Speed preference
  if (options?.preferFast) {
    if (model.metrics.avgResponseMs > 5000) score -= 20;
    if (model.metrics.avgResponseMs < 1000) score += 15;
  }

  // Quality preference
  if (options?.preferQuality) {
    if (hasReasoning) score += 10;
    if (model.capabilities.includes("long_context")) score += 5;
  }

  // Local model bonus
  if (["ollama", "lm_studio", "gpt4all"].includes(model.provider)) {
    score += 5;
  }

  // Penalize models with recent errors
  if (model.metrics.lastErrorAt) {
    const hoursSinceError = (Date.now() - model.metrics.lastErrorAt) / 3600000;
    if (hoursSinceError < 1) score -= 30;
    else if (hoursSinceError < 24) score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Generates a human-readable reason for why a model was selected
 */
export function generateRoutingReason(
  model: AIModel,
  intent: TaskIntent,
  options?: { preferFast?: boolean; preferQuality?: boolean },
): string {
  const parts: string[] = [];
  parts.push(`Intent: ${intent}`);

  if (options?.preferFast) parts.push("Fast mode");
  else if (options?.preferQuality) parts.push("Quality mode");

  if (model.priority > 70) parts.push("High priority");
  if (model.metrics.successRate > 0.95) parts.push("Reliable");

  return parts.join(" | ");
}
