/**
 * Subject Persona Types
 * Defines the structure for domain-specific AI personas.
 */

export interface SubjectPersona {
  /** Unique identifier for the persona (e.g., 'science_nt', 'humanities') */
  id: string;

  /** List of subject names this persona applies to (lowercase) */
  domains: string[];

  /** The core role definition ("You are a...") */
  roleDefinition: string;

  /** Specific academic standards (WV requirements) */
  academicStandards: string;

  /** Didactic rules for lesson construction */
  didacticRules: string;

  /** Optional: Specific output format instructions */
  outputFormat?: string;
}

export type PersonaId =
  | "science_nt"
  | "humanities"
  | "philosophy"
  | "social_science"
  | "physics"
  | "chemistry"
  | "biology"
  | "math"
  | "dutch"
  | "foreign_languages"
  | "informatics"
  | "psychology"
  | "default";
