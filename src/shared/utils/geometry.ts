// Utility for 3D geometry operations and validation
// Supports VWO 3D Inzicht training

type Point3D = { x: number; y: number; z: number };
type VoxelGrid = { x: number; y: number; z: number }[];

/**
 * 3D Rotation Matrix helpers
 * A cube has 24 valid 90-degree rotations (isometries).
 * We can generate them by combining rotations around X, Y, Z axes.
 */

const rotateX = (p: Point3D): Point3D => ({ x: p.x, y: -p.z, z: p.y });
const rotateY = (p: Point3D): Point3D => ({ x: p.z, y: p.y, z: -p.x });
const rotateZ = (p: Point3D): Point3D => ({ x: -p.y, y: p.x, z: p.z });

// Generate all 24 orientations of a point

// Normalize a voxel grid: shift so min bounds are at (0,0,0) logic or centered?
// For comparison, likely best to shift such that the "min corner" is (0,0,0)

const normalizeGridToSet = (grid: VoxelGrid): Set<string> => {
  if (grid.length === 0) return new Set();
  const minX = Math.min(...grid.map((p) => p.x));
  const minY = Math.min(...grid.map((p) => p.y));
  const minZ = Math.min(...grid.map((p) => p.z));

  return new Set(grid.map((p) => `${p.x - minX},${p.y - minY},${p.z - minZ}`));
};

/**
 * Checks if 'submission' matches 'target' regardless of rotation.
 * Returns detailed match statistics for the BEST matching rotation.
 */
export const checkRotationMatch = (
  submission: VoxelGrid,
  target: VoxelGrid,
): {
  matched: boolean;
  correct: number;
  extra: number;
  missing: number;
  rotationIndex: number;
} => {
  // Base 24 transforms
  const basicRotations = [
    (p: Point3D) => p, // Identity
    (p: Point3D) => rotateZ(p),
    (p: Point3D) => rotateZ(rotateZ(p)),
    (p: Point3D) => rotateZ(rotateZ(rotateZ(p))),
  ];

  const faceRotations = [
    (p: Point3D) => p, // Top
    (p: Point3D) => rotateX(rotateX(p)), // Bottom
    (p: Point3D) => rotateX(p), // Front
    (p: Point3D) => rotateX(rotateX(rotateX(p))), // Back
    (p: Point3D) => rotateY(p), // Left
    (p: Point3D) => rotateY(rotateY(rotateY(p))), // Right
  ];

  const targetSet = normalizeGridToSet(target);
  const targetSize = target.length;

  let bestResult = {
    matched: false,
    correct: -1,
    extra: 1000,
    missing: 1000,
    rotationIndex: -1,
  };
  let bestScore = -Infinity; // Higher is better (correct - extra - missing)

  let rotIdx = 0;

  // Check all 24 rotations
  for (const faceRot of faceRotations) {
    for (const basicRot of basicRotations) {
      // Apply rotation to submission
      const transformedGrid = submission.map((p) => basicRot(faceRot(p)));
      const subSet = normalizeGridToSet(transformedGrid);

      // Compare sets
      let correct = 0;
      let extra = 0;
      let missing = 0;

      subSet.forEach((s) => {
        if (targetSet.has(s)) correct++;
        else extra++;
      });

      targetSet.forEach((s) => {
        if (!subSet.has(s)) missing++;
      });

      const score = correct - extra - missing;

      if (score > bestScore) {
        bestScore = score;
        bestResult = {
          matched: extra === 0 && missing === 0 && correct === targetSize,
          correct,
          extra,
          missing,
          rotationIndex: rotIdx,
        };
      }
      rotIdx++;
    }
  }

  return bestResult;
};
