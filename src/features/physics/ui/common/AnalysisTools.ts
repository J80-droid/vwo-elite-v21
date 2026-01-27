/**
 * Utility functions for analyzing Physics Lab graphs.
 */

export interface Point {
  x: number;
  y: number;
}

/**
 * Calculates the slope (tangent) at a specific point within a series of points.
 * Uses a small window around the index for smoothing.
 */
export const calculateTangent = (
  points: Point[],
  index: number,
): number | null => {
  if (points.length < 2 || index < 0 || index >= points.length) return null;

  const start = Math.max(0, index - 2);
  const end = Math.min(points.length - 1, index + 2);

  if (start === end) return null;

  const pStart = points[start];
  const pEnd = points[end];

  if (!pStart || !pEnd) return null;

  const dx = pEnd.x - pStart.x;
  const dy = pEnd.y - pStart.y;

  if (dx === 0) return null;
  return dy / dx;
};

/**
 * Calculates the definite integral (area under curve) between two indices
 * using the trapezoidal rule.
 */
export const calculateIntegral = (
  points: Point[],
  startIndex: number,
  endIndex: number,
): number => {
  if (points.length < 2) return 0;

  const start = Math.min(startIndex, endIndex);
  const end = Math.max(startIndex, endIndex);

  let area = 0;
  for (let i = start; i < end; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];

    if (!p1 || !p2) continue;

    const dx = p2.x - p1.x;
    const avgY = (p1.y + p2.y) / 2;
    area += avgY * dx;
  }

  return area;
};
