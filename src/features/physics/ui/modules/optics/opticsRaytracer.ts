export interface TraceLens {
  x: number;
  f: number;
  h: number; // aperture height (lens radius)
}

export const calculateRayPath = (
  start: { x: number; y: number },
  dir: { x: number; y: number }, // Direction vector (normalized)
  lenses: TraceLens[],
  limitX: number,
): { x: number; y: number }[] => {
  const points = [{ ...start }];
  let currX = start.x;
  let currY = start.y;

  // Normalize direction (dx, dy)
  const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
  let dx = dir.x / len;
  let dy = dir.y / len;

  // Sort lenses
  const sortedLenses = [...lenses].sort((a, b) => a.x - b.x);

  for (const lens of sortedLenses) {
    if (lens.x <= currX + 0.001) continue; // Skip lenses behind/at start point

    // Check for parallel ray to lens plane
    if (Math.abs(dx) < 1e-6) break;

    // Distance to lens
    const distToLens = (lens.x - currX) / dx;
    const hitY = currY + dy * distToLens;

    // Aperture Check (does the ray hit the lens?)
    if (Math.abs(hitY) > lens.h) {
      // Misses lens -> continues straight.
      // We update pos to lens plane for visualization consistency, but slope (direction) does not change.
      currX = lens.x;
      currY = hitY;
      points.push({ x: currX, y: currY });
      continue;
    }

    // Hits lens: Update position
    currX = lens.x;
    currY = hitY;
    points.push({ x: currX, y: currY });

    // Calculate new direction (Thin Lens Approximation)
    // Old slope = dy / dx
    const currentSlope = dy / dx;

    // Lens formula deviation: delta_slope = -y / f
    const newSlope = currentSlope - hitY / lens.f;

    // Reconstruct vector from slope (assuming paraxial)
    // Correct approach: normalize vector (1, newSlope)
    const vLen = Math.sqrt(1 + newSlope * newSlope);
    dx = 1 / vLen;
    dy = newSlope / vLen;
  }

  // Last segment to limit
  if (dx > 0) {
    const distEnd = (limitX - currX) / dx;
    points.push({ x: limitX, y: currY + dy * distEnd });
  } else {
    // Ray goes backwards? (Not fully supported in this specialized setup, but for robustness)
    points.push({ x: currX + dx * 1000, y: currY + dy * 1000 });
  }

  return points;
};
