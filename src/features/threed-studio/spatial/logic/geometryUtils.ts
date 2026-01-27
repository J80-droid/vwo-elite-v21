import { Vec3 } from "../../types";

// --- Geometry Utils ---

// Archetype modes for diverse shape generation
export type GenerationMode = "snake" | "compact" | "flat" | "random";

export const generateStructure = (
  size: number,
  mode: GenerationMode = "random",
): Vec3[] => {
  // Start with center block
  const structure: Vec3[] = [[0, 0, 0]];
  const used = new Set<string>();
  used.add("0,0,0");

  // Helper to check existence
  const isFree = (x: number, y: number, z: number) =>
    !used.has(`${x},${y},${z}`);

  // Mode-specific constraints
  const flatAxis = mode === "flat" ? Math.floor(Math.random() * 3) : -1; // 0=X, 1=Y, 2=Z fixed

  for (let i = 0; i < size; i++) {
    let attempts = 0;
    let added = false;

    while (attempts < 50 && !added) {
      attempts++;

      // Selection Strategy
      let base: Vec3;
      if (mode === "snake") {
        // Prefer last added (70% chance)
        if (Math.random() > 0.3) base = structure[structure.length - 1]!;
        else base = structure[Math.floor(Math.random() * structure.length)]!;
      } else if (mode === "compact") {
        // Prefer center-ish blocks, weighted by index (older blocks are more central typically)
        // or just pure random from existing, which naturally forms cluster
        // To force compact, we should pick a base that has many neighbors?
        // Simple approximation: standard random walk tends to cluster.
        // Let's force it to attach to a block that keeps the bounding box small? Too complex.
        // Reverting to strict random for compact, but maybe filter candidates?
        base = structure[Math.floor(Math.random() * structure.length)]!;
      } else {
        // Random / Flat
        base = structure[Math.floor(Math.random() * structure.length)]!;
      }

      const axis = Math.floor(Math.random() * 3);
      const dir = Math.random() > 0.5 ? 1 : -1;

      // Flat constraint
      if (mode === "flat" && axis === flatAxis) continue;

      const next: Vec3 = [...base] as Vec3;
      next[axis]! += dir;

      if (isFree(next[0], next[1], next[2])) {
        structure.push(next);
        used.add(`${next[0]},${next[1]},${next[2]}`);
        added = true;
      }
    }
  }
  return structure;
};

export const rotateStructure90 = (
  structure: Vec3[],
  axis: "x" | "y" | "z",
  dir: 1 | -1,
): Vec3[] => {
  return structure.map(([x, y, z]) => {
    let nx = x,
      ny = y,
      nz = z;
    if (axis === "x") {
      // Rotate around X: Y->Z, Z->-Y
      ny = z * dir;
      nz = -y * dir;
    } else if (axis === "y") {
      // Rotate around Y: Z->X, X->-Z
      nx = z * dir;
      nz = -x * dir;
    } else if (axis === "z") {
      // Rotate around Z: X->Y, Y->-X
      nx = -y * dir;
      ny = x * dir;
    }
    return [nx, ny, nz];
  });
};

export const mirrorStructure = (
  structure: Vec3[],
  axis: "x" | "y" | "z",
): Vec3[] => {
  return structure.map(([x, y, z]) => {
    if (axis === "x") return [-x, y, z];
    if (axis === "y") return [x, -y, z];
    return [x, y, -z];
  });
};

export const getProjection = (
  structure: Vec3[],
  view: "top" | "front" | "side",
) => {
  // Project 3D voxel to 2D grid
  const projection = new Set<string>();
  const result: { u: number; v: number }[] = [];

  structure.forEach(([x, y, z]) => {
    let u = 0,
      v = 0;
    if (view === "top") {
      u = x;
      v = z;
    } // XZ plane
    else if (view === "front") {
      u = x;
      v = y;
    } // XY plane
    else if (view === "side") {
      u = z;
      v = y;
    } // ZY plane

    const key = `${u},${v}`;
    if (!projection.has(key)) {
      projection.add(key);
      result.push({ u, v });
    }
  });
  return result;
};

// --- New Math for Elite Folding ---

export const reflectPointAcrossLine = (
  point: { x: number; y: number },
  lineType: "h" | "v" | "d",
  linePos: number,
) => {
  // linePos is 0..1 relative to unit square
  // In our 3D paper model, we use 0..1 coordinate space as well for punches.

  const { x, y } = point;

  if (lineType === "h") {
    // Horizontal line at y = linePos
    // Reflect Y: newY = linePos - (y - linePos) = 2*linePos - y
    return { x, y: 2 * linePos - y };
  } else if (lineType === "v") {
    // Vertical line at x = linePos
    return { x: 2 * linePos - x, y };
  } else if (lineType === "d") {
    // Diagonal: Assuming y = x (simplest diagonal for punch cards)
    // If line is y = x, reflect (x,y) -> (y,x)
    // If line is y = -x + 1 (other diagonal), reflect (x,y) -> (1-y, 1-x)

    // For MVP, lets assume standard diagonal y=x
    return { x: y, y: x };
  }
  return { x, y };
};
