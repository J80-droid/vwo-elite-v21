export type Language = "nl" | "en" | "es" | "fr";

export type Subject =
  | "wiskunde"
  | "natuurkunde"
  | "scheikunde"
  | "biologie"
  | "economie"
  | "geschiedenis"
  | "aardrijkskunde"
  | "engels"
  | "nederlands"
  | "frans";

export interface Grade {
  id: string;
  subject: string;
  grade: number;
  weight: number;
  date: string;
  description?: string;
  type?: string;
}
