// --- LOB / CAREER TYPES ---
export interface OpenDay {
  id: string;
  institution: string;
  date: string; // YYYY-MM-DD
  time: string;
  type: "On-Campus" | "Online";
  description: string;
  link: string;
}

export interface UniversityStudy {
  id: string;
  name: string;
  institution: string;
  description?: string;
  profiles: string[];
  requirements: string[];
  sectors: string[];
  stats: Record<string, unknown>;
}

export interface LOBResult {
  id?: string;
  type: string;
  scores: Record<string, number> | Record<string, unknown>;
  date: string;
}
