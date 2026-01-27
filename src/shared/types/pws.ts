// --- PWS (PROFIELWERKSTUK) & RESEARCH TYPES ---
export type PWSPhase =
  | "Oriëntatie"
  | "Onderzoek"
  | "Verwerking"
  | "Presentatie";

export interface PWSProject {
  id: string;
  title: string;
  subject: string;
  researchQuestion?: string;
  sources: string[]; // Array of StudyMaterial IDs
  currentPhase?: PWSPhase;
  status?: "planning" | "research" | "writing" | "review" | "completed";
  deadline?: string;
  logbook?: PWSLogEntry[];
  literature?: LiteratureMatrixEntry[];
  checklistProgress?: Record<string, boolean>;
  citations?: string[]; // APA strings
  hypotheses?: {
    id: string;
    claim: string;
    counter: string;
    arguments: string;
    formula: string;
    createdAt: number;
  }[];
  createdAt: number;
  updatedAt: number;
}

export interface PWSLogEntry {
  id: string;
  timestamp: number;
  date?: string;
  action: "source" | "write" | "research" | "chat";
  activity?: string;
  details: string;
  duration: number;
  hours?: number;
  mood?: "good" | "neutral" | "bad";
}

export interface LiteratureMatrixEntry {
  id: string;
  title: string;
  author?: string;
  year: string;
  type?: "book" | "article" | "web";
  method: string;
  results: string;
  conclusion: string;
  findings?: string;
  relevance: string | number;
  // AI Specific Fields (Harmonization)
  source?: string;
  mainFindings?: string;
  methodology?: string;
}

export interface AcademicSearchResult {
  title: string;
  url?: string;
  snippet?: string;
  source?: string;
  // AI Specific Fields
  authors?: string[];
  year?: number;
  journal?: string;
  relevance?: "high" | "medium" | "low" | string;
  abstract?: string;
}

export interface MindMapData {
  nodes: { id: string; label: string; level: number }[];
  edges: { from: string; to: string }[];
}

// De Constante Checklist
export interface PWSChecklistItem {
  id: string;
  label: string;
}

export const PWS_CHECKLISTS: Record<PWSPhase, PWSChecklistItem[]> = {
  Oriëntatie: [
    { id: "topic", label: "Onderwerp kiezen & afbakenen" },
    { id: "main_q", label: "Hoofdvraag & deelvragen formuleren" },
    { id: "pva", label: "Plan van Aanpak inleveren" },
  ],
  Onderzoek: [
    { id: "lit", label: "Literatuuronderzoek (min. 5 bronnen)" },
    { id: "field", label: "Veldwerk / Experiment uitvoeren" },
    { id: "interview", label: "Expert interview afnemen" },
  ],
  Verwerking: [
    { id: "intro", label: "Inleiding & Theoriekader" },
    { id: "results", label: "Resultaten verwerken" },
    { id: "conclusion", label: "Conclusie & Discussie schrijven" },
  ],
  Presentatie: [
    { id: "apa", label: "APA Bronvermelding checken" },
    { id: "spelling", label: "Taalcontrole" },
    { id: "layout", label: "Definitieve opmaak" },
  ],
};
export interface SourceEvaluation {
  score: number;
  reliability: "Low" | "Medium" | "High";
  bias: string;
  fallacies: {
    name: string;
    description: string;
    textExample?: string;
    simpleExample?: string;
  }[];
  authorIntent: string;
  analysis: string;
}
