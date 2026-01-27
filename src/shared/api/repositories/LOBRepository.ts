import { executeQuery } from "@shared/api/sqliteService";
import {
  LOBResult,
  OpenDay,
  UniversityStudy,
} from "@shared/types/lob.types.ts";

export const LOBRepository = {
  getOpenDays: async (): Promise<OpenDay[]> => {
    try {
      const results = await executeQuery(
        "SELECT * FROM open_days ORDER BY date ASC",
      );
      return results as unknown as OpenDay[];
    } catch (e) {
      console.error("Error fetching open days:", e);
      return [];
    }
  },

  getUniversityStudies: async (): Promise<UniversityStudy[]> => {
    try {
      const rows = await executeQuery("SELECT * FROM university_studies");
      return rows.map((r: Record<string, unknown>) => ({
        id: r.id as string,
        name: r.name as string,
        institution: r.institution as string,
        description: r.description as string,
        profiles: r.profiles ? JSON.parse(r.profiles as string) : [],
        requirements: r.requirements
          ? JSON.parse(r.requirements as string)
          : [],
        sectors: r.sectors ? JSON.parse(r.sectors as string) : [],
        stats: r.stats ? JSON.parse(r.stats as string) : {},
      }));
    } catch (e) {
      console.error("Error fetching university studies:", e);
      return [];
    }
  },

  saveLOBResult: async (type: string, scores: Record<string, number>) => {
    try {
      await executeQuery(
        `
                INSERT INTO lob_results (id, type, scores, date)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    scores = excluded.scores,
                    date = excluded.date
            `,
        [type, type, JSON.stringify(scores), new Date().toISOString()],
      );
    } catch (e) {
      console.error("Error saving LOB result:", e);
    }
  },

  getLOBResult: async (
    type: string,
  ): Promise<Record<string, number> | null> => {
    try {
      const result = await executeQuery(
        "SELECT * FROM lob_results WHERE type = ?",
        [type],
      );
      return result[0]
        ? JSON.parse(
          (result[0] as unknown as LOBResult).scores as unknown as string,
        )
        : null;
    } catch (e) {
      console.error("Error fetching LOB result:", e);
      return null;
    }
  },
};
