// Atomic numbers for Priority (Simplified CIP)
const ATOMIC_NUMBERS: Record<string, number> = {
  H: 1,
  C: 6,
  N: 7,
  O: 8,
  F: 9,
  S: 16,
  Cl: 17,
  Br: 35,
  I: 53,
};

// Layout positions in Fischer
export type FischerPos = "top" | "bottom" | "left" | "right";

export interface GroupData {
  id: number; // Atom index or unique ID
  element: string;
  label: string;
  priority?: number; // 1 (Highest) to 4 (Lowest)
}

/**
 * Calculates priority of a group based on element.
 * Implements deep recursion for tie-breaking on complex groups (e.g. Ethyl vs Methyl).
 * CIP Priority: Higher atomic number = Higher priority
 */
export const calculatePriority = (
  element: string,
  label: string,
  depth: number = 0,
): number => {
  // Prevent infinite recursion
  if (depth > 3) return ATOMIC_NUMBERS[element] || 0;

  // 1. Base: Atomic Number Check
  const z = ATOMIC_NUMBERS[element] || 0;

  // 2. Deep recursion for Carbon groups (CIP tie-breaking)
  if (element === "C") {
    // Parse the label to identify attached atoms
    const upperLabel = label.toUpperCase();

    // Count attached atoms and their priorities
    let attachedPriority = 0;

    // Check for oxygen-containing groups (highest priority for organics)
    if (upperLabel.includes("COOH") || upperLabel.includes("COO")) {
      // Carboxylic acid: C attached to O,O,O (virtual triple oxygen)
      attachedPriority = 8 * 3; // O * 3
    } else if (upperLabel.includes("CHO") || upperLabel.includes("CO")) {
      // Aldehyde/Ketone: C attached to O,O (virtual double oxygen)
      attachedPriority = 8 * 2;
    } else if (
      upperLabel.includes("OH") ||
      upperLabel.includes("CH2OH") ||
      upperLabel.includes("CHOH")
    ) {
      // Alcohol: C attached to O
      attachedPriority = 8 * 1.5;
    } else if (upperLabel.includes("NH2") || upperLabel.includes("NH")) {
      // Amine: C attached to N
      attachedPriority = 7;
    } else if (upperLabel.includes("SH") || upperLabel.includes("S")) {
      // Thiol: C attached to S
      attachedPriority = 16;
    } else if (upperLabel.includes("Cl")) {
      // Halogen
      attachedPriority = 17;
    } else if (upperLabel.includes("Br")) {
      attachedPriority = 35;
    } else if (upperLabel.includes("I")) {
      attachedPriority = 53;
    } else if (upperLabel.includes("F")) {
      attachedPriority = 9;
    }

    // Carbon chain length for tie-breaking (Ethyl > Methyl)
    const ch3Count = (upperLabel.match(/CH3/g) || []).length;
    const ch2Count = (upperLabel.match(/CH2/g) || []).length;
    const chainLength = ch3Count + ch2Count;

    // Priority formula: base + attached priority + chain bonus
    // Scale to maintain proper ordering
    return z + attachedPriority * 0.01 + chainLength * 0.001;
  }

  return z;
};

/**
 * Returns 'R' or 'S' configuration for a given Fischer arrangement.
 *
 * Fischer Rules for 2D:
 * 1. Rank priorities 1 (High) -> 4 (Low).
 * 2. If Lowest Priority (4) is on VERTICAL (Top/Bottom):
 *    - Arc 1 -> 2 -> 3
 *    - Clockwise = R
 *    - Counter-Clockwise = S
 * 3. If Lowest Priority (4) is on HORIZONTAL (Left/Right):
 *    - Arc 1 -> 2 -> 3
 *    - Clockwise = S (Inverted!)
 *    - Counter-Clockwise = R (Inverted!)
 */
export const calculateFischerRS = (
  groups: Record<FischerPos, GroupData>,
): "R" | "S" | null => {
  const list: (GroupData & { pos: FischerPos })[] = [
    { ...groups.top, pos: "top" },
    { ...groups.right, pos: "right" },
    { ...groups.bottom, pos: "bottom" },
    { ...groups.left, pos: "left" },
  ];

  // Sort by priority (High score > Low score)
  // We assign Rank 1 to Highest Score
  const sorted = [...list].sort((a, b) => {
    const pA = calculatePriority(a.element, a.label);
    const pB = calculatePriority(b.element, b.label);
    return pB - pA; // Descending
  });

  // Map ranks: 0=High(1), 3=Low(4)
  const rankMap = new Map<string, number>();
  sorted.forEach((g, i) => rankMap.set(g.pos, i + 1));

  const lowestGroup = sorted[3];
  if (!lowestGroup) return null;
  const lowestGroupPos = lowestGroup.pos; // The position of rank 4

  // Get positions of 1, 2, 3
  // We only care about the sequence 1 -> 2 -> 3 in the circle
  // Circle order: Top -> Right -> Bottom -> Left -> Top

  // Find where 1, 2, 3 are in the circle sequence (ignoring 4)
  const activeGroups = list.filter((g) => {
    const r = rankMap.get(g.pos);
    return r !== undefined && r < 4;
  });

  // Sort them by Rank (1, then 2, then 3) to see their vector/sequence
  const p1 = activeGroups.find((g) => rankMap.get(g.pos) === 1);
  const p2 = activeGroups.find((g) => rankMap.get(g.pos) === 2);
  const p3 = activeGroups.find((g) => rankMap.get(g.pos) === 3);

  if (!p1 || !p2 || !p3) return null;

  // Determine direction 1 -> 2 -> 3 on the clock face
  // Top(0), Right(1), Bottom(2), Left(3)

  // Calculate signed Steps: (i2 - i1), (i3 - i2)
  // Normalize to -1 (CCW) or +1 (CW)
  // Actually, simpler: check geometric relation.
  // cw check: (1->2)

  // Let's use the explicit positions to calculate signed area or cross product logic is overkill.
  // Fixed positions: Top(0,1), Right(1,0), Bottom(0,-1), Left(-1,0)
  // Just map indices 0,1,2,3.
  // Distance (b - a + 4) % 4.
  // If dist is 1 -> CW. If dist is 3 (equivalent to -1) -> CCW. If dist 2 -> Across.

  // But we need the sequence 1 -> 2 -> 3.
  // It's defined by the path.

  // Let's just define the "Answer" if lowest is Vertical vs Horizontal
  const isVertical = lowestGroupPos === "top" || lowestGroupPos === "bottom";

  // Determine Clockwise vs CCW of 1->2->3
  // We remove the 4th, so we have 3 items in a circle of 4 slots.
  // e.g. Top(1), Right(2), Left(3). 1->2 is CW. 2->3 is Across(CW-ish).
  // Valid patterns for CW: T-R-B, R-B-L, B-L-T, L-T-R (consecutive)
  // T-B-L (1-2-3 across)? No, 1->2->3.

  // Robust way: (val2 - val1 + 4) % 4.
  // If it's 1, it's CW step. If 3, CCW step.

  // Easier: Just look at the array of values [i1, i2, i3].
  // Count how many "CW steps" vs "CCW steps".
  // (i2-i1) and (i3-i2) and (i1-i3) to close loop? No.

  // Let's use a determinant method (2D cross product sum)
  // Coords: T(0,1), R(1,0), B(0,-1), L(-1,0)
  const coords: Record<FischerPos, { x: number; y: number }> = {
    top: { x: 0, y: 1 },
    right: { x: 1, y: 0 },
    bottom: { x: 0, y: -1 },
    left: { x: -1, y: 0 },
  };

  const c1 = coords[p1.pos];
  const c2 = coords[p2.pos];
  const c3 = coords[p3.pos];

  // Sum of cross products (Shoelace formula basic)
  // (x2-x1)(y2+y1) ...
  // Or just (x1*y2 - y1*x2) + ...
  // Z-component of cross prod:
  const crossSum =
    c1.x * c2.y -
    c1.y * c2.x +
    (c2.x * c3.y - c2.y * c3.x) +
    (c3.x * c1.y - c3.y * c1.x);

  // If crossSum < 0 -> Clockwise (in standard math with Y up? Wait, SVG Y is down... careful)
  // Standard coord system (Y up): T(0,1), R(1,0). 1*0 - 1*1 = -1.
  // My coords above assume Y up.
  // T->R is CW. Cross = -1. So Negative is CW.

  const isClockwise = crossSum < 0;

  if (isVertical) {
    // Vertical line (Top/Bottom) means Backwards.
    // Lowest priority Backwards = Normal view.
    // CW = R, CCW = S.
    return isClockwise ? "R" : "S";
  } else {
    // Horizontal line (Left/Right) means Forwards.
    // Lowest priority Forwards = Inverted view.
    // CW = S, CCW = R.
    return isClockwise ? "S" : "R";
  }
};
