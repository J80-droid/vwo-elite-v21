/**
 * Shared Planner Types
 * Moved from entities/planner to resolve FSD violations
 */

export type DutchRegion = "noord" | "midden" | "zuid";

export interface DutchHoliday {
  id: string;
  name: string;
  nameNl: string;
  start: string;
  end: string;
  region: DutchRegion | "all";
  type: "vacation" | "public_holiday" | "exam_period";
}
