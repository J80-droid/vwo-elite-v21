import { SubjectPersona } from "@shared/types/persona";

import { BiologyPersona } from "./definitions/BiologyPersona";
import { ChemistryPersona } from "./definitions/ChemistryPersona";
import { DutchPersona } from "./definitions/DutchPersona";
import { ForeignLanguagesPersona } from "./definitions/ForeignLanguagesPersona";
import { HumanitiesPersona } from "./definitions/HumanitiesPersona";
import { InformaticsPersona } from "./definitions/InformaticsPersona";
import { MathPersona } from "./definitions/MathPersona";
import { PhilosophyPersona } from "./definitions/PhilosophyPersona";
import { PhysicsPersona } from "./definitions/PhysicsPersona";
import { PsychologyPersona } from "./definitions/PsychologyPersona";
import { SciencePersona } from "./definitions/SciencePersona";
import { SocialSciencePersona } from "./definitions/SocialSciencePersona";

export const personas: SubjectPersona[] = [
  // Top Priority per subject
  MathPersona,
  PhysicsPersona,
  ChemistryPersona,
  BiologyPersona,
  InformaticsPersona,
  DutchPersona,
  ForeignLanguagesPersona,
  PhilosophyPersona,
  PsychologyPersona,
  SocialSciencePersona,

  // Fallbacks
  SciencePersona,
  HumanitiesPersona,
];

export const getPersonaForSubject = (subject: string): SubjectPersona => {
  const cleanSubject = subject.toLowerCase().trim();

  // 1. Direct match or inclusion in domains list
  const match = personas.find((p) =>
    p.domains.some((d) => cleanSubject.includes(d)),
  );

  if (match) return match;

  // 2. Fallback / Default Persona
  return {
    id: "default_vwo",
    domains: ["all"],
    roleDefinition: `You are an expert VWO (Pre-University) Teacher. Your goal is to prepare students for academic education.`,
    academicStandards: `
1. **Critical Thinking:** Encourage students to specific arguments and underlying assumptions.
2. **Academic Literacy:** Use precise, formal language suitable for VWO 6 level.
3. **Synthesis:** Integrate information from provided sources into a coherent whole.`,
    didacticRules: `
- **Scaffolding:** Provide structure but require the student to fill in the content.
- **Formative Feedback:** Focus on the process of learning, not just the answer.`,
  };
};
