import { createStore } from "@shared/lib/storeFactory";

export interface Skill {
  id: string;
  name: string;
  category: string;
  mastery: number; // 0-100
  ptaWeight: number; // Percentage weight in PTA
  prerequisites?: string[]; // IDs of required skills
  lastPracticed?: number;
}

interface SkillsState {
  skills: Record<string, Skill[]>; // Key = subject name

  // Actions
  updateSkill: (subject: string, id: string, updates: Partial<Skill>) => void;
  addSkill: (subject: string, skill: Skill) => void;
  deleteSkill: (subject: string, id: string) => void;
  getSkills: (subject: string) => Skill[];
  calculateOverallMastery: (subject: string) => number;
  resetSkills: (subject: string) => void;
}

// Initial default skills for key subjects (VWO level)
const DEFAULT_SKILLS: Record<string, Skill[]> = {
  "Wiskunde B": [
    {
      id: "diff",
      name: "Differentiëren",
      category: "Analyse",
      mastery: 0,
      ptaWeight: 15,
      prerequisites: ["alg"],
    },
    {
      id: "int",
      name: "Integreren",
      category: "Analyse",
      mastery: 0,
      ptaWeight: 15,
      prerequisites: ["diff"],
    },
    {
      id: "alg",
      name: "Algebraïsche Vaardigheden",
      category: "Basis",
      mastery: 0,
      ptaWeight: 10,
    },
    {
      id: "gonio",
      name: "Goniometrie",
      category: "Meetkunde",
      mastery: 0,
      ptaWeight: 12,
    },
    {
      id: "meet",
      name: "Meetkunde",
      category: "Meetkunde",
      mastery: 0,
      ptaWeight: 12,
    },
    {
      id: "kans",
      name: "Kansrekening",
      category: "Statistiek",
      mastery: 0,
      ptaWeight: 8,
    },
    {
      id: "rij",
      name: "Rijen & Reeksen",
      category: "Analyse",
      mastery: 0,
      ptaWeight: 10,
    },
    {
      id: "vec",
      name: "Vectoren",
      category: "Meetkunde",
      mastery: 0,
      ptaWeight: 10,
    },
  ],
  Natuurkunde: [
    {
      id: "mech",
      name: "Mechanica",
      category: "Klassiek",
      mastery: 0,
      ptaWeight: 20,
    },
    {
      id: "elec",
      name: "Elektriciteit",
      category: "Elektromagnetisme",
      mastery: 0,
      ptaWeight: 15,
    },
    {
      id: "golf",
      name: "Golven & Optica",
      category: "Golven",
      mastery: 0,
      ptaWeight: 12,
    },
    {
      id: "thermo",
      name: "Thermodynamica",
      category: "Energie",
      mastery: 0,
      ptaWeight: 10,
    },
    {
      id: "quant",
      name: "Quantummechanica",
      category: "Modern",
      mastery: 0,
      ptaWeight: 8,
    },
    {
      id: "kern",
      name: "Kernfysica",
      category: "Modern",
      mastery: 0,
      ptaWeight: 8,
    },
  ],
  Scheikunde: [
    {
      id: "org",
      name: "Organische Chemie",
      category: "Organisch",
      mastery: 0,
      ptaWeight: 18,
    },
    {
      id: "reac",
      name: "Reactievergelijkingen",
      category: "Basis",
      mastery: 0,
      ptaWeight: 12,
    },
    {
      id: "evenwicht",
      name: "Chemisch Evenwicht",
      category: "Evenwichten",
      mastery: 0,
      ptaWeight: 15,
    },
    {
      id: "zb",
      name: "Zuur-Base",
      category: "Evenwichten",
      mastery: 0,
      ptaWeight: 12,
    },
    {
      id: "redox",
      name: "Redoxreacties",
      category: "Elektrochemie",
      mastery: 0,
      ptaWeight: 12,
    },
    {
      id: "struct",
      name: "Structuurformules",
      category: "Organisch",
      mastery: 0,
      ptaWeight: 10,
    },
  ],
  Biologie: [
    {
      id: "cel",
      name: "Celbiologie",
      category: "Moleculair",
      mastery: 0,
      ptaWeight: 15,
    },
    {
      id: "stof",
      name: "Stofwisseling",
      category: "Moleculair",
      mastery: 0,
      ptaWeight: 12,
    },
    {
      id: "voort",
      name: "Voortplanting",
      category: "Organisme",
      mastery: 0,
      ptaWeight: 10,
    },
    {
      id: "eco",
      name: "Ecologie",
      category: "Systeem",
      mastery: 0,
      ptaWeight: 12,
    },
    {
      id: "gen",
      name: "Genetica",
      category: "Moleculair",
      mastery: 0,
      ptaWeight: 12,
    },
    {
      id: "evol",
      name: "Evolutie",
      category: "Systeem",
      mastery: 0,
      ptaWeight: 10,
    },
  ],
  Nederlands: [
    {
      id: "arg",
      name: "Argumentatie",
      category: "Schrijven",
      mastery: 0,
      ptaWeight: 15,
    },
    {
      id: "betoog",
      name: "Betogend Schrijven",
      category: "Schrijven",
      mastery: 0,
      ptaWeight: 12,
    },
    {
      id: "beschouwing",
      name: "Beschouwing",
      category: "Schrijven",
      mastery: 0,
      ptaWeight: 10,
    },
    {
      id: "samenvatten",
      name: "Samenvatten",
      category: "Lezen",
      mastery: 0,
      ptaWeight: 10,
    },
    {
      id: "tekstanalyse",
      name: "Tekstanalyse",
      category: "Lezen",
      mastery: 0,
      ptaWeight: 12,
    },
    {
      id: "lit_hist",
      name: "Literatuurgeschiedenis",
      category: "Mondeling",
      mastery: 0,
      ptaWeight: 15,
    },
    {
      id: "pres",
      name: "Presenteren",
      category: "Mondeling",
      mastery: 0,
      ptaWeight: 8,
    },
  ],
  Engels: [
    {
      id: "reading",
      name: "Reading Comprehension",
      category: "Receptive",
      mastery: 0,
      ptaWeight: 25,
    },
    {
      id: "listening",
      name: "Listening",
      category: "Receptive",
      mastery: 0,
      ptaWeight: 20,
    },
    {
      id: "speaking",
      name: "Speaking",
      category: "Productive",
      mastery: 0,
      ptaWeight: 15,
    },
    {
      id: "writing",
      name: "Writing",
      category: "Productive",
      mastery: 0,
      ptaWeight: 15,
    },
    {
      id: "vocab",
      name: "Vocabulary",
      category: "Knowledge",
      mastery: 0,
      ptaWeight: 15,
    },
    {
      id: "grammar",
      name: "Grammar",
      category: "Knowledge",
      mastery: 0,
      ptaWeight: 10,
    },
  ],
};

export const useSkillsStore = createStore<SkillsState>(
  (set, get) => ({
    skills: DEFAULT_SKILLS,

    updateSkill: (subject, id, updates) => {
      set((state) => {
        const subjectSkills = state.skills[subject];
        if (!subjectSkills) return state;

        return {
          skills: {
            ...state.skills,
            [subject]: subjectSkills.map((skill) =>
              skill.id === id
                ? { ...skill, ...updates, lastPracticed: Date.now() }
                : skill,
            ),
          },
        };
      });
    },

    addSkill: (subject, skill) => {
      set((state) => ({
        skills: {
          ...state.skills,
          [subject]: [...(state.skills[subject] || []), skill],
        },
      }));
    },

    deleteSkill: (subject, id) => {
      set((state) => ({
        skills: {
          ...state.skills,
          [subject]: (state.skills[subject] || []).filter((s) => s.id !== id),
        },
      }));
    },

    getSkills: (subject) => {
      const state = get();
      return state.skills[subject] || [];
    },

    calculateOverallMastery: (subject) => {
      const skills = get().skills[subject] || [];
      if (skills.length === 0) return 0;

      const totalWeight = skills.reduce((acc, s) => acc + s.ptaWeight, 0);
      if (totalWeight === 0) return 0;

      const weightedSum = skills.reduce(
        (acc, s) => acc + s.mastery * s.ptaWeight,
        0,
      );
      return Math.round(weightedSum / totalWeight);
    },

    resetSkills: (subject) => {
      set((state) => ({
        skills: {
          ...state.skills,
          [subject]: DEFAULT_SKILLS[subject] || [],
        },
      }));
    },
  }),
  { name: "skills-storage" }
);
