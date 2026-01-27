import type { Grade } from "@vwo/shared-types";

const roundToPrecision = (num: number, decimals: number = 1): number => {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
};

export interface SubjectAverage {
  subject: string;
  average: number;
  count: number;
  totalWeight: number;
}

export interface GradeStats {
  overallAverage: number;
  totalGrades: number;
  subjectAverages: SubjectAverage[];
  bestSubject?: { subject: string; average: number } | undefined;
}

/**
 * Calculates detailed statistics from a list of grades.
 */
export const calculateGradeStats = (grades: Grade[]): GradeStats => {
  if (!grades || grades.length === 0) {
    return {
      overallAverage: 0,
      totalGrades: 0,
      subjectAverages: [],
      bestSubject: undefined,
    };
  }

  const subjectMap: Record<
    string,
    { total: number; weight: number; count: number }
  > = {};
  let globalTotalWeighted = 0;
  let globalTotalWeight = 0;

  grades.forEach((g) => {
    const subj = g.subject.trim();

    if (!subjectMap[subj]) {
      subjectMap[subj] = { total: 0, weight: 0, count: 0 };
    }

    const gradeVal = g.grade;
    const weightVal = g.weight;

    if (!isNaN(gradeVal) && !isNaN(weightVal)) {
      subjectMap[subj].total += gradeVal * weightVal;
      subjectMap[subj].weight += weightVal;
      subjectMap[subj].count += 1;

      globalTotalWeighted += gradeVal * weightVal;
      globalTotalWeight += weightVal;
    }
  });

  const subjectAverages: SubjectAverage[] = Object.entries(subjectMap)
    .map(([subject, data]) => ({
      subject,
      average: data.weight > 0 ? roundToPrecision(data.total / data.weight) : 0,
      count: data.count,
      totalWeight: data.weight,
    }))
    .sort((a, b) => b.average - a.average);

  const overallAverage =
    globalTotalWeight > 0
      ? roundToPrecision(globalTotalWeighted / globalTotalWeight)
      : 0;
  const bestSubject =
    subjectAverages.length > 0
      ? {
          subject: subjectAverages[0]!.subject,
          average: subjectAverages[0]!.average,
        }
      : undefined;

  return {
    overallAverage,
    totalGrades: grades.length,
    subjectAverages,
    bestSubject,
  };
};
