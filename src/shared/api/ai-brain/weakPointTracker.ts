import type { WeakPoint } from "../../types/ai-brain";
import { sqliteInsert, sqliteRun, sqliteSelect } from "../sqliteService";

interface WeakPointRow {
  id: string;
  subject: string;
  topic: string;
  error_count: number;
  attempt_count: number;
  error_rate: number;
  common_mistakes: string | null;
  suggested_focus: string | null;
  improvement_score: number;
  last_error_at: number | null;
  last_practice_at: number | null;
  created_at: number;
  updated_at: number;
}

export class WeakPointTracker {
  /**
   * Track a quiz result and update weak points
   */
  async trackQuizResult(
    subject: string,
    topic: string,
    score: number,
    total: number,
  ): Promise<void> {
    const errorCount = total - score;
    const isCorrect = errorCount === 0;

    await this.updateWeakPoint(subject, topic, errorCount, total, isCorrect);
  }

  /**
   * Update or create a weak point record
   */
  private async updateWeakPoint(
    subject: string,
    topic: string,
    newErrors: number,
    newAttempts: number,
    _isSuccess: boolean,
  ): Promise<void> {
    // 1. Fetch existing
    const existing = await sqliteSelect<WeakPointRow>(
      "weak_points",
      "subject = ? AND topic = ?",
      [subject, topic],
    );

    const now = Math.floor(Date.now() / 1000);

    if (existing.length > 0) {
      const row = existing[0];
      if (!row) return;

      const updatedErrorCount = row.error_count + newErrors;
      const updatedAttemptCount = row.attempt_count + newAttempts;
      const errorRate =
        updatedAttemptCount > 0 ? updatedErrorCount / updatedAttemptCount : 0;

      // Calculate improvement (very basic: comparing new rate to old)
      const oldRate = row.error_rate;
      const improvementShift = oldRate - newErrors / newAttempts;
      const improvementScore = Math.max(
        -1,
        Math.min(1, (row.improvement_score || 0) + improvementShift * 0.1),
      );

      await sqliteRun(
        `UPDATE weak_points SET 
                    error_count = ?, 
                    attempt_count = ?, 
                    error_rate = ?, 
                    improvement_score = ?,
                    last_practice_at = ?,
                    last_error_at = ?,
                    updated_at = ?
                WHERE id = ?`,
        [
          updatedErrorCount,
          updatedAttemptCount,
          errorRate,
          improvementScore,
          now,
          newErrors > 0 ? now : row.last_error_at,
          now,
          row.id,
        ],
      );
    } else {
      // Create new
      const errorRate = newAttempts > 0 ? newErrors / newAttempts : 0;
      const id = crypto.randomUUID();

      await sqliteInsert("weak_points", {
        id,
        subject,
        topic,
        error_count: newErrors,
        attempt_count: newAttempts,
        error_rate: errorRate,
        improvement_score: 0.0,
        last_practice_at: now,
        last_error_at: newErrors > 0 ? now : null,
        created_at: now,
        updated_at: now,
      });
    }
  }

  /**
   * Get all weak points for a subject, sorted by error rate desc
   */
  async getWeakPoints(subject?: string): Promise<WeakPoint[]> {
    let rows: WeakPointRow[];
    if (subject) {
      rows = await sqliteSelect<WeakPointRow>(
        "weak_points",
        "subject = ? ORDER BY error_rate DESC",
        [subject],
      );
    } else {
      rows = await sqliteSelect<WeakPointRow>(
        "weak_points",
        "1=1 ORDER BY error_rate DESC",
      );
    }

    return rows.map(this.mapRowToWeakPoint);
  }

  /**
   * Get a specific weak point
   */
  async getWeakPoint(
    subject: string,
    topic: string,
  ): Promise<WeakPoint | null> {
    const rows = await sqliteSelect<WeakPointRow>(
      "weak_points",
      "subject = ? AND topic = ?",
      [subject, topic],
    );

    if (rows.length === 0) return null;
    return this.mapRowToWeakPoint(rows[0]!);
  }

  /**
   * Map database row to WeakPoint interface
   */
  private mapRowToWeakPoint(row: WeakPointRow): WeakPoint {
    return {
      id: row.id,
      subject: row.subject,
      topic: row.topic,
      errorCount: row.error_count,
      attemptCount: row.attempt_count,
      errorRate: row.error_rate,
      commonMistakes: row.common_mistakes
        ? JSON.parse(row.common_mistakes)
        : [],
      suggestedFocus: row.suggested_focus || "",
      improvementScore: row.improvement_score || 0,
      lastErrorAt: row.last_error_at || undefined,
      lastPracticeAt: row.last_practice_at || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

// Singleton
let trackerInstance: WeakPointTracker | null = null;

export function getWeakPointTracker(): WeakPointTracker {
  if (!trackerInstance) {
    trackerInstance = new WeakPointTracker();
  }
  return trackerInstance;
}
