export type Vec3 = [number, number, number];

/**
 * Generates a random connected structure of voxels using a random walk.
 * @param size Number of voxels to generate
 * @returns Array of [x,y,z] coordinates
 */
export const generateStructure = (size: number): Vec3[] => {
  const voxels: Vec3[] = [[0, 0, 0]];
  // Safety break loop to prevent infinite loops if trapped
  let attempts = 0;
  const maxAttempts = size * 5;

  while (voxels.length < size && attempts < maxAttempts) {
    attempts++;
    const last = voxels[Math.floor(Math.random() * voxels.length)];
    const axis = Math.floor(Math.random() * 3);
    const dir = Math.random() > 0.5 ? 1 : -1;

    const next: Vec3 = [...(last as Vec3)] as Vec3;
    next[axis]! += dir;

    // Check if occupied
    if (
      !voxels.some(
        (v) => v[0] === next[0] && v[1] === next[1] && v[2] === next[2],
      )
    ) {
      voxels.push(next);
    }
  }

  // Normalize to start at 0,0,0 or center?
  // For now, raw random walk is fine, caller can center if needed.
  return voxels;
};

/**
 * Compares two voxel structures for equality (order independent).
 */
export const compareStructures = (
  built: Vec3[],
  target: Vec3[],
): { correct: number; extra: number; missing: number } => {
  const builtSet = new Set(built.map((v) => v.join(",")));
  const targetSet = new Set(target.map((v) => v.join(",")));

  let correct = 0;
  let extra = 0;
  let missing = 0;

  builtSet.forEach((v) => {
    if (targetSet.has(v)) correct++;
    else extra++;
  });

  targetSet.forEach((v) => {
    if (!builtSet.has(v)) missing++;
  });

  return { correct, extra, missing };
};

/**
 * Converts array of Vec3 to a Set of strings for easy lookup
 */
export const toVoxelSet = (voxels: Vec3[]): Set<string> => {
  return new Set(voxels.map((v) => v.join(",")));
};

/**
 * Shifting voxels so the structure aligns with 0,0,0 (min bounds).
 * This makes the check position-independent.
 */
export const normalizeStructure = (voxels: Vec3[]): Vec3[] => {
  if (voxels.length === 0) return [];

  let minX = Infinity,
    minY = Infinity,
    minZ = Infinity;
  voxels.forEach((v) => {
    if (v[0]! < minX) minX = v[0]!;
    if (v[1]! < minY) minY = v[1]!;
    if (v[2]! < minZ) minZ = v[2]!;
  });

  return voxels.map((v) => [v[0] - minX, v[1] - minY, v[2] - minZ]);
};

/**
 * Rotates voxels 90 degrees around Y axis.
 */
export const rotateStructureY = (voxels: Vec3[]): Vec3[] => {
  return voxels.map(([x, y, z]) => [z, y, -x]);
};

/**
 * Mirrors voxels across an axis plane (X=0).
 */
export const mirrorStructureX = (voxels: Vec3[]): Vec3[] => {
  return voxels.map(([x, y, z]) => [-x, y, z]);
};

/**
 * Checks if built structure matches target, trying all 4 cardinal rotations.
 * Returns the result of the BEST matching rotation.
 */
export const checkFlexibleMatch = (
  built: Vec3[],
  target: Vec3[],
): { correct: number; extra: number; missing: number; rotation: number } => {
  const normTarget = normalizeStructure(target);
  const normTargetSet = toVoxelSet(normTarget);

  let bestResult = { correct: -1, extra: 1000, missing: 1000, rotation: 0 };
  let bestScore = -Infinity; // Higher is better

  // Try 4 rotations: 0, 90, 180, 270
  // THEN try mirroring + 4 rotations
  let currentBuilt = [...built];

  for (let mirror = 0; mirror < 2; mirror++) {
    let rotated = [...currentBuilt];
    for (let i = 0; i < 4; i++) {
      // Normalize current rotation to compare shape only
      const normBuilt = normalizeStructure(rotated);
      const normBuiltSet = toVoxelSet(normBuilt);

      // Compare
      let correct = 0;
      let extra = 0;
      let missing = 0;

      normBuiltSet.forEach((vKey) => {
        if (normTargetSet.has(vKey)) correct++;
        else extra++;
      });

      normTargetSet.forEach((vKey) => {
        if (!normBuiltSet.has(vKey)) missing++;
      });

      const score = correct - extra - missing;

      if (score > bestScore) {
        bestScore = score;
        bestResult = {
          correct,
          extra,
          missing,
          rotation: (mirror === 1 ? -1 : 1) * i * 90,
        };
      }

      rotated = rotateStructureY(rotated);
    }
    currentBuilt = mirrorStructureX(currentBuilt);
  }

  return bestResult;
};

/**
 * Checks if two structures are identical (rotation invariant? No, current implementation is exact match)
 */
export const areStructuresEqual = (a: Vec3[], b: Vec3[]): boolean => {
  if (a.length !== b.length) return false;
  const aSet = toVoxelSet(a);
  return b.every((v) => aSet.has(v.join(",")));
};
