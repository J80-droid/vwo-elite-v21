/* eslint-disable @typescript-eslint/no-explicit-any */
import studiesData from "../assets/data/studies.json";
import { sqliteDelete, sqliteInsert, sqliteSelect } from "./sqliteService";

export const saveStudyReflection = async (
  studyId: string,
  studyName: string,
  reflection: string,
  tags: string[],
) => {
  await sqliteInsert("saved_studies", {
    id: crypto.randomUUID(),
    study_id: studyId,
    study_name: studyName,
    reflection,
    tags: JSON.stringify(tags),
    liked_at: Date.now(),
  });
};

export const getSavedStudies = async () => {
  const studies = await sqliteSelect<any>("saved_studies");
  return studies.map((s) => ({
    ...s,
    tags: typeof s.tags === "string" ? JSON.parse(s.tags) : s.tags,
  }));
};

export const removeSavedStudy = async (id: string) => {
  await sqliteDelete("saved_studies", id);
};

export interface Study {
  id: string;
  name: string;
  institution: string;
  type: string;
  language: string;
  profiles: string[];
  requirements: string[]; // Legacy
  admissionRequirements?: {
    minGrades?: Record<string, number>;
    mandatorySubjects?: string[];
  };
  description: string;
  sectors: string[];
  city: string;
  numerusFixus?: boolean;
  stats?: {
    startingSalary?: number;
    roa?: string;
    studentSatisfaction?: number;
  };
}

export const getAllStudies = (): Study[] => {
  return studiesData as Study[];
};

export const searchStudies = (query: string): Study[] => {
  const q = query.toLowerCase();
  return studiesData.filter(
    (study) =>
      study.name.toLowerCase().includes(q) ||
      study.institution.toLowerCase().includes(q) ||
      study.description.toLowerCase().includes(q) ||
      study.sectors.some((s) => s.toLowerCase().includes(q)),
  ) as Study[];
};

export const filterStudiesByProfile = (profile: string): Study[] => {
  // profile: 'NT', 'NG', 'EM', 'CM'
  return studiesData.filter((study) =>
    study.profiles.includes(profile.toUpperCase()),
  ) as Study[];
};

export const getStudiesBySector = (sector: string): Study[] => {
  return studiesData.filter((study) =>
    study.sectors.includes(sector),
  ) as Study[];
};

export const checkCompatibility = (
  study: Study,
  userProfile?: string,
  userGrades?: Record<string, number>,
): { compatible: boolean; reason?: string } => {
  if (!userProfile) return { compatible: true, reason: "Geen profiel bekend" };

  // 1. Check Profile (NT, NG, etc.)
  const normalizedProfile = userProfile.toUpperCase();
  if (!study.profiles.includes(normalizedProfile)) {
    // Some studies allow other profiles IF extra subjects are taken.
    // For VWO Elite, we keep it strict for now unless "admissionRequirements" specifies otherwise.
    return {
      compatible: false,
      reason: `Vereist profiel: ${study.profiles.join(" of ")} (Jij hebt: ${userProfile})`,
    };
  }

  // 2. Check Specific Subjects & Grades (if userGrades are provided)
  if (study.admissionRequirements?.minGrades && userGrades) {
    for (const [subject, minGrade] of Object.entries(
      study.admissionRequirements.minGrades,
    )) {
      const userGrade = userGrades[subject];
      // Normalize case for subject matching if needed, but for now exact match
      if (userGrade && userGrade < minGrade) {
        return {
          compatible: false,
          reason: `${subject} vereist een ${minGrade} (Jij hebt: ${userGrade})`,
        };
      }
    }
  }

  return { compatible: true };
};
