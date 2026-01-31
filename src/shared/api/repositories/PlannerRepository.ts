import { executeQuery } from "../sqliteService";

export interface PlannerTask {
  id: string;
  title: string;
  date: number;
  type: "study" | "exam" | "personal" | "deadline";
  completed: boolean;
  related_id?: string; // e.g. Open Day ID
}

export const PlannerRepository = {
  /**
   * Adds a task to the planner.
   */
  addTask: async (task: PlannerTask) => {
    try {

      await executeQuery(
        `
                INSERT INTO planner_tasks (id, title, date, type, completed, related_id)
                VALUES (?, ?, ?, ?, ?, ?)
            `,
        [
          task.id,
          task.title,
          task.date,
          task.type,
          (task.completed ? 1 : 0) as number,
          (task.related_id ?? null) as string | null,
        ],
      );

      return true;
    } catch (e) {
      console.error("Failed to add task:", e);
      return false;
    }
  },

  /**
   * Checks if a related item (e.g. Open Day) is already in the planner.
   */
  hasRelatedTask: async (relatedId: string) => {
    try {

      const result = (await executeQuery(
        `
                SELECT id FROM planner_tasks WHERE related_id = ?
            `,
        [relatedId],
      )) as { id: string }[];
      return result.length > 0;
    } catch {
      return false;
    }
  },

  /**
   * Fetches tasks from the planner.
   */
  getTasks: async (
    filters: { type?: string; minDate?: number; maxDate?: number } = {},
  ) => {
    try {
      let query = "SELECT * FROM planner_tasks WHERE 1=1";
      const params: (string | number)[] = [];

      if (filters.type) {
        query += " AND type = ?";
        params.push(filters.type);
      }
      if (filters.minDate) {
        query += " AND date >= ?";
        params.push(filters.minDate);
      }
      if (filters.maxDate) {
        query += " AND date <= ?";
        params.push(filters.maxDate);
      }

      query += " ORDER BY date ASC";

      return (await executeQuery(query, params)) as PlannerTask[];
    } catch (e) {
      console.error("Failed to fetch tasks:", e);
      return [];
    }
  },
};
