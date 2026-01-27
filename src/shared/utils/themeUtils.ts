/**
 * Calculates a color from Red to Green/Cyan based on a grade (1-10).
 * Used for heatmaps and visual feedback.
 */
export const getGradeColor = (grade: number): string => {
  // Map 1.0 - 10.0 to Hue 0 (Red) - 140 (Green/Cyan)
  const hue = Math.min(Math.max((grade - 1) * 14, 0), 140);
  return `hsl(${hue}, 90%, 60%)`;
};
