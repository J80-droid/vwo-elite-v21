import type { ProactiveSuggestion } from "../../types/ai-brain";
import { PlannerRepository } from "../repositories/PlannerRepository";
import { getWeakPointTracker } from "./weakPointTracker";

export class ProactiveEngine {
  /**
   * Check for all types of suggestions
   */
  async getSuggestions(): Promise<ProactiveSuggestion[]> {
    const suggestions: ProactiveSuggestion[] = [];

    // 1. Check for upcoming exams
    const examSuggestions = await this.checkUpcomingExams();
    suggestions.push(...examSuggestions);

    // 2. Check for weak points that need practice
    const weakPointSuggestions = await this.checkWeakPoints();
    suggestions.push(...weakPointSuggestions);

    // Sort by priority (Urgent -> High -> Medium -> Low)
    return suggestions.sort((a, b) => {
      const priorityMap: Record<string, number> = {
        urgent: 4,
        high: 3,
        medium: 2,
        low: 1,
      };
      return (priorityMap[b.priority] || 0) - (priorityMap[a.priority] || 0);
    });
  }

  /**
   * Look for exams in the next 7 days
   */
  private async checkUpcomingExams(): Promise<ProactiveSuggestion[]> {
    const suggestions: ProactiveSuggestion[] = [];
    const now = Date.now();
    const nextWeek = now + 7 * 24 * 60 * 60 * 1000;

    const tasks = await PlannerRepository.getTasks({
      type: "exam",
      minDate: now,
      maxDate: nextWeek,
    });

    for (const task of tasks) {
      const daysUntil = Math.ceil((task.date - now) / (24 * 60 * 60 * 1000));
      suggestions.push({
        id: `exam-${task.id}`,
        type: "exam_prep",
        title: `Voorbereiden op ${task.title}`,
        description: `Je hebt over ${daysUntil} ${daysUntil === 1 ? "dag" : "dagen"} een toets over ${task.title}. Wil je wat flashcards oefenen of een nieuwe les genereren?`,
        priority: daysUntil <= 2 ? "urgent" : "high",
        action: "generate_prep",
        actionLabel: "Voorbereiden",
        createdAt: now,
        metadata: {
          taskId: task.id,
          daysUntil,
        },
      });
    }

    return suggestions;
  }

  /**
   * Look for weak points with high error rate and old practice date
   */
  private async checkWeakPoints(): Promise<ProactiveSuggestion[]> {
    const suggestions: ProactiveSuggestion[] = [];
    const tracker = getWeakPointTracker();
    const weakPoints = await tracker.getWeakPoints();

    const now = Math.floor(Date.now() / 1000);
    const threeDaysAgo = now - 3 * 24 * 60 * 60;

    for (const wp of weakPoints) {
      if (wp.errorRate > 0.4 && (wp.lastPracticeAt || 0) < threeDaysAgo) {
        suggestions.push({
          id: `wp-${wp.id}`,
          type: "weak_point_focus",
          title: `${wp.topic} verbeteren`,
          description: `Je hebt ${wp.topic} al even niet meer geoefend. Je foutpercentage is ${(wp.errorRate * 100).toFixed(0)}%. Wil je een korte oefensessie doen?`,
          priority: "medium",
          action: "start_practice",
          actionLabel: "Oefenen",
          createdAt: now * 1000,
          metadata: {
            weakPointId: wp.id,
            subject: wp.subject,
            topic: wp.topic,
          },
        });
      }
    }

    return suggestions;
  }
}

// Singleton
let engineInstance: ProactiveEngine | null = null;

export function getProactiveEngine(): ProactiveEngine {
  if (!engineInstance) {
    engineInstance = new ProactiveEngine();
  }
  return engineInstance;
}
