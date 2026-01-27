/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  LevelConfig,
  StructureOption,
  TrainingModule,
  Vec3,
} from "../../types";
import {
  generateStructure,
  GenerationMode,
  getProjection,
  mirrorStructure,
  rotateStructure90,
} from "./geometryUtils";

type Option = StructureOption;

// Standard Fisher-Yates Shuffle
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = temp;
  }
  return arr;
}

// Helper to identify unique structures
const getStructureHash = (s: Vec3[]): string => {
  // 1. Clone
  const clone: Vec3[] = s.map((v) => [v[0], v[1], v[2]]);
  // 2. Normalize by shifting to 0,0,0
  if (clone.length === 0) return "";

  // Find min bounds
  let minX = Infinity,
    minY = Infinity,
    minZ = Infinity;
  for (const v of clone) {
    if (!v) continue;
    if (v[0]! < minX) minX = v[0]!;
    if (v[1]! < minY) minY = v[1]!;
    if (v[2]! < minZ) minZ = v[2]!;
  }
  // Shift
  for (const v of clone) {
    if (!v) continue;
    v[0] = (v[0] ?? 0) - minX;
    v[1] = (v[1] ?? 0) - minY;
    v[2] = (v[2] ?? 0) - minZ;
  }

  // 3. Sort
  clone.sort((a, b) => {
    if (a[0] !== b[0]) return (a[0] ?? 0) - (b[0] ?? 0);
    if (a[1] !== b[1]) return (a[1] ?? 0) - (b[1] ?? 0);
    return (a[2] ?? 0) - (b[2] ?? 0);
  });

  // 4. Stringify
  return JSON.stringify(clone);
};

export const mutateStructure = (
  structure: Option["structure"],
): Option["structure"] => {
  if (!structure || structure.length <= 1) return structure;
  // Create a copy and remove one block (to keep count same, we remove 1 then add 1)
  const newStruct = structure.slice(0, structure.length - 1);

  // Attempt to add a block at a new location
  let attempts = 0;
  while (attempts < 20) {
    attempts++;
    const base = newStruct[Math.floor(Math.random() * newStruct.length)];
    if (!base) continue;
    const axis = Math.floor(Math.random() * 3);
    const dir = Math.random() > 0.5 ? 1 : -1;
    const next: Vec3 = [...base] as Vec3;
    next[axis]! += dir;

    // Check if occupied in newStruct
    const exists = newStruct.some(
      (p) => p[0] === next[0] && p[1] === next[1] && p[2] === next[2],
    );
    // Also ensure we didn't just recreate the original structure (simple check: if next == original removed block)
    // ideally we just ensure it's not in newStruct, the chance of exact recreation is handled by probability or acceptable

    if (!exists) {
      newStruct.push(next);
      return newStruct;
    }
  }
  return structure; // Fallback
};

export const generateStandardRound = (
  mod: TrainingModule,
  levelConfig: LevelConfig,
  score: number,
  t: any,
  previousHashes?: Set<string>,
): { options: Option[]; correctIdx: number; questionData: any } => {
  const { complexity, blocks } = levelConfig;
  const correctIdx = Math.floor(Math.random() * 4);
  const newOptions: Option[] = [];
  const questionData: any = {};

  const size = Math.min(blocks + Math.floor(score / 1000), 12);

  // Archetype Selection Strategy
  const modes: GenerationMode[] = [
    "snake",
    "snake",
    "compact",
    "flat",
    "random",
  ];
  const mode = modes[Math.floor(Math.random() * modes.length)];

  // Generate Unique Base Structure
  let baseStructure: Vec3[] = [];
  let baseHash = "";
  let attempts = 0;

  while (attempts < 10) {
    attempts++;
    baseStructure = generateStructure(size, mode);
    baseHash = getStructureHash(baseStructure);
    if (!previousHashes || !previousHashes.has(baseHash)) break;
  }

  questionData.structure = baseStructure;
  questionData.hash = baseHash; // Return hash so hook can update history
  questionData.mode = mode; // For debugging or analytics

  // ======== ROTATION ========
  if (mod === "rotation") {
    const usedHashes = new Set<string>();
    // Add base structure hash (even though we rotate it, we want distractor to be different SHAPE basically)
    // Actually, distractors are DIFFERENT shapes, correct is SAME shape rotated.
    // So we just ensure distractors are distinct from each other.

    // Wait, correct answer is ROTATED base. Distractors are MUTATED base.
    // We want to ensure all distractors are unique among themselves.

    for (let i = 0; i < 4; i++) {
      if (i === correctIdx) {
        let s = baseStructure;
        const rotations = [];

        // Difficulty Scaling for Rotation
        // Complexity 1: Single Axis (Y)
        // Complexity 2: Chance of Dual Axis
        // Complexity 3+: Dual Axis Force or Z-axis enabled

        // Base rotation (always at least one)
        s = rotateStructure90(s, "y", 1);
        rotations.push("90° Y");

        // Dual Axis Logic
        let allowDual = false;
        if (complexity >= 2) allowDual = Math.random() > 0.4; // 60% chance at level 2
        if (complexity >= 3) allowDual = Math.random() > 0.2; // 80% chance at level 3
        if (complexity >= 4) allowDual = true; // 100% chance at level 4

        if (allowDual) {
          s = rotateStructure90(s, "x", 1);
          rotations.push("90° X");
        }

        newOptions.push({
          structure: s,
          rotation: [Math.random() * 0.5, Math.random() * 0.5, 0],
          explanation: t(
            "studio_3d.spatial.explanations.rotation_correct_detailed",
            { details: rotations.join(" + ") },
          ),
        });
      } else {
        // Distractor: Mutate the structure so it is physically different
        let s: Vec3[] = [];
        let attempts = 0;
        let hash = "";

        // Find a unique distractor
        while (attempts < 20) {
          attempts++;
          s = mutateStructure(baseStructure);
          hash = getStructureHash(s);

          // Check collision with previously generated options (distractors)
          // We also should probably check against baseStructure to be sure, although mutation guarantees removal of one block so it HAS to be different from baseStructure count-wise?
          // Wait, mutateStructure removes 1 adds 1. Count is same.
          // So we must check hash against baseStructure too.

          if (
            !usedHashes.has(hash) &&
            hash !== getStructureHash(baseStructure)
          ) {
            break;
          }
        }
        usedHashes.add(hash);

        // Randomly rotate the wrong answer too
        if (Math.random() > 0.5) s = rotateStructure90(s, "y", 1);

        newOptions.push({
          structure: s,
          rotation: [Math.random() * 0.5, Math.random() * 0.5, 0],
          explanation: t("studio_3d.spatial.explanations.rotation_incorrect"),
        });
      }
    }
  }
  // ======== COUNTING ========
  else if (mod === "counting") {
    const correctCount = baseStructure.length;
    questionData.correctCount = correctCount;

    const usedCounts = new Set<number>();
    usedCounts.add(correctCount);

    for (let i = 0; i < 4; i++) {
      let count;

      if (i === correctIdx) {
        count = correctCount;
      } else {
        let attempts = 0;
        // Try to find a unique distractor count close to the real answer
        do {
          attempts++;
          // Generate offset between -3 and +3 (excluding 0)
          const offset = Math.floor(Math.random() * 7) - 3;
          count = correctCount + offset;

          // Fallback if stuck loop: force uniqueness by stepping out
          if (attempts > 10) {
            count = correctCount + (i + 1);
            while (usedCounts.has(count)) count++;
          }
        } while (count <= 0 || usedCounts.has(count));

        usedCounts.add(count);
      }

      newOptions.push({
        structure: [],
        twoDData: { count },
        explanation:
          i === correctIdx
            ? t("studio_3d.spatial.explanations.counting_correct", { count })
            : t("studio_3d.spatial.explanations.counting_incorrect", { count }),
      });
    }
  }
  // ======== POV (Point of View) ========
  else if (mod === "pov") {
    const views = ["top", "front", "side"] as const;
    const correctView = views[Math.floor(Math.random() * 3)]!;
    const correctProj = getProjection(baseStructure, correctView);
    questionData.view = correctView;
    questionData.projection = correctProj;

    // Helper to serialize projection for uniqueness check
    const projHash = (p: { u: number; v: number }[]) =>
      JSON.stringify(p.sort((a, b) => a.u - b.u || a.v - b.v));
    const usedProjs = new Set<string>();
    usedProjs.add(projHash(correctProj));

    for (let i = 0; i < 4; i++) {
      if (i === correctIdx) {
        newOptions.push({
          structure: [],
          twoDData: { projection: correctProj, view: correctView },
        });
      } else {
        let attempts = 0;
        let distractorProj;

        // Generate unique distractor projection from SAME view but different structure
        while (attempts < 20) {
          attempts++;
          // Mutate structure 1-3 times to get a distinct look
          let s = [...baseStructure];
          const mutations = 1 + Math.floor(Math.random() * 3);
          for (let m = 0; m < mutations; m++) s = mutateStructure(s); // Use imported mutate

          distractorProj = getProjection(s, correctView);
          const hash = projHash(distractorProj);

          if (!usedProjs.has(hash)) {
            usedProjs.add(hash);
            break;
          }
          // Fallback: fully random structure if mutation is stuck
          if (attempts > 15) {
            distractorProj = getProjection(
              generateStructure(size),
              correctView,
            );
          }
        }

        if (!distractorProj)
          distractorProj = getProjection(generateStructure(size), correctView); // Fallback

        newOptions.push({
          structure: [],
          twoDData: { projection: distractorProj, view: correctView },
        });
      }
    }
  }
  // ======== SPOT (Find the Match) ========
  else if (mod === "spot") {
    const usedHashes = new Set<string>();
    usedHashes.add(getStructureHash(baseStructure));

    for (let i = 0; i < 4; i++) {
      if (i === correctIdx) {
        newOptions.push({ structure: baseStructure, rotation: [0.3, 0.5, 0] });
      } else {
        let s: Vec3[] = [];
        let h = "";
        let attempts = 0;
        while (attempts < 20) {
          attempts++;
          s = generateStructure(size);
          h = getStructureHash(s);
          if (!usedHashes.has(h)) break;
        }
        usedHashes.add(h);
        newOptions.push({ structure: s, rotation: [0.3, 0.5, 0] });
      }
    }
  }
  // ======== SEQUENCE ========
  else if (mod === "sequence") {
    const sequence: { axis: "x" | "y" | "z"; dir: 1 | -1 }[] = [];
    for (let k = 0; k < 2 + Math.floor(complexity / 2); k++) {
      sequence.push({
        axis: ["x", "y", "z"][Math.floor(Math.random() * 3)] as any,
        dir: Math.random() > 0.5 ? 1 : -1,
      });
    }
    let result = baseStructure;
    sequence.forEach((s) => {
      result = rotateStructure90(result, s.axis, s.dir);
    });
    questionData.sequence = sequence;

    for (let i = 0; i < 4; i++) {
      if (i === correctIdx) {
        newOptions.push({ structure: result, rotation: [0.4, 0.6, 0] });
      } else {
        let wrong = baseStructure;
        wrong = rotateStructure90(
          wrong,
          ["x", "y", "z"][i % 3] as any,
          i % 2 === 0 ? 1 : -1,
        );
        newOptions.push({ structure: wrong, rotation: [0.4, 0.6, 0] });
      }
    }
  }
  // ======== SHADOWS ========
  else if (mod === "shadows") {
    const shadow = getProjection(baseStructure, "top");
    questionData.shadow = shadow;

    // Helper to serialize projection/shadow for uniqueness check
    const projHash = (p: { u: number; v: number }[]) =>
      JSON.stringify(p.sort((a, b) => a.u - b.u || a.v - b.v));
    const usedShadowHashes = new Set<string>();
    usedShadowHashes.add(projHash(shadow));

    for (let i = 0; i < 4; i++) {
      if (i === correctIdx) {
        newOptions.push({
          structure: baseStructure,
          twoDData: { shadow },
          rotation: [0.5, 0.5, 0],
        });
      } else {
        let s: Vec3[] = [];
        let sh: { u: number; v: number }[] = [];
        let h = "";
        let attempts = 0;

        while (attempts < 20) {
          attempts++;
          // Mutate base structure to get a similar but distinct shadow
          s = [...baseStructure];
          const mutations = 1 + Math.floor(Math.random() * 2);
          for (let m = 0; m < mutations; m++) s = mutateStructure(s);

          sh = getProjection(s, "top");
          h = projHash(sh);
          if (!usedShadowHashes.has(h)) break;

          // Fallback to random if stuck
          if (attempts > 15) {
            s = generateStructure(size);
            sh = getProjection(s, "top");
            h = projHash(sh);
          }
        }

        usedShadowHashes.add(h);
        newOptions.push({
          structure: s,
          twoDData: { shadow: sh },
          rotation: [0.5, 0.5, 0],
          explanation: t("studio_3d.spatial.explanations.shadows_incorrect"),
        });
      }
    }
  }
  // ======== PROJECTION ========
  else if (mod === "projection") {
    const proj = getProjection(baseStructure, "front");
    questionData.projection = proj;

    const projHash = (p: { u: number; v: number }[]) =>
      JSON.stringify(p.sort((a, b) => a.u - b.u || a.v - b.v));
    const usedProjHashes = new Set<string>();
    usedProjHashes.add(projHash(proj));

    for (let i = 0; i < 4; i++) {
      if (i === correctIdx) {
        newOptions.push({
          structure: [],
          twoDData: { projection: proj },
          explanation: t("studio_3d.spatial.explanations.projection_correct"),
        });
      } else {
        let s: Vec3[] = [];
        let p: { u: number; v: number }[] = [];
        let h = "";
        let attempts = 0;

        while (attempts < 20) {
          attempts++;
          // Mutate base structure
          s = [...baseStructure];
          const mutations = 1 + Math.floor(Math.random() * 2);
          for (let m = 0; m < mutations; m++) s = mutateStructure(s);

          p = getProjection(s, "front");
          h = projHash(p);
          if (!usedProjHashes.has(h)) break;

          if (attempts > 15) {
            s = generateStructure(size);
            p = getProjection(s, "front");
            h = projHash(p);
          }
        }
        usedProjHashes.add(h);
        newOptions.push({
          structure: [],
          twoDData: { projection: p },
          explanation: t("studio_3d.spatial.explanations.projection_incorrect"),
        });
      }
    }
  }
  // ======== CROSS-SECTION ========
  else if (mod === "cross-section") {
    const primitives = ["cube", "sphere", "cylinder", "cone"] as const;
    // 1. Select Random Primitive
    const shapeType = primitives[Math.floor(Math.random() * primitives.length)];
    // 2. Select Cut Direction
    const cutTypes = ["horizontal", "vertical"] as const;
    const cutType = cutTypes[Math.floor(Math.random() * cutTypes.length)];

    questionData.shapeType = shapeType;
    questionData.cutType = cutType;
    questionData.rotation = [Math.random() * 0.5, Math.random() * 0.5, 0]; // Gentle rotation

    // 3. Determine Correct 2D Shape
    let correctShape = "Unknown";
    if (shapeType === "sphere") correctShape = "Cirkel";
    else if (shapeType === "cube")
      correctShape = "Vierkant"; // Assuming axis-aligned for now
    else if (shapeType === "cylinder")
      correctShape = cutType === "horizontal" ? "Cirkel" : "Rechthoek";
    else if (shapeType === "cone")
      correctShape = cutType === "horizontal" ? "Cirkel" : "Driehoek";

    // 4. Distractors
    const allShapes = [
      "Cirkel",
      "Vierkant",
      "Rechthoek",
      "Driehoek",
      "Hexagon",
      "Ellips",
    ];
    const shuffledDistractors = shuffle(
      allShapes.filter((s) => s !== correctShape),
    );

    for (let i = 0; i < 4; i++) {
      if (i === correctIdx) {
        newOptions.push({
          structure: [],
          twoDData: { shape: correctShape },
          explanation: t(
            "studio_3d.spatial.explanations.cross_section_correct",
            { shape: correctShape },
          ),
        });
      } else {
        const wrongShape = shuffledDistractors.pop() || "Vierkant";
        newOptions.push({
          structure: [],
          twoDData: { shape: wrongShape },
          explanation: t(
            "studio_3d.spatial.explanations.cross_section_incorrect",
            { shape: wrongShape },
          ),
        });
      }
    }
  }
  // ======== PATHFINDING ========
  else if (mod === "pathfinding") {
    // Generate random path
    const pathLen = 5 + Math.floor(score / 1000);
    const path: Vec3[] = [[0, 0, 0]];
    let curr = [0, 0, 0];
    for (let k = 0; k < pathLen; k++) {
      const axis = Math.floor(Math.random() * 3);
      const dir = Math.random() > 0.5 ? 1 : -1;
      const next = [...curr] as Vec3;
      next[axis]! += dir;
      // Simple check to avoid immediate backtrack
      const prev = path[k - 1];
      if (
        k > 0 &&
        prev &&
        next[0] === prev[0] &&
        next[1] === prev[1] &&
        next[2] === prev[2]
      ) {
        next[axis]! -= 2 * dir;
      }
      curr = next as any;
      path.push(curr as Vec3);
    }
    questionData.path = path;

    for (let i = 0; i < 4; i++) {
      if (i === correctIdx) {
        newOptions.push({
          structure: path,
          path,
          rotation: [0.5, 0.5, 0],
          explanation: t("studio_3d.spatial.explanations.pathfinding_correct"),
        });
      } else {
        // Mutate path slightly
        const wrongPath = [...path.map((p) => [...p] as Vec3)];
        const mutIdx = Math.floor(Math.random() * (wrongPath.length - 1)) + 1;
        wrongPath[mutIdx]![0] += 1;
        newOptions.push({
          structure: wrongPath,
          path: wrongPath,
          rotation: [0.5, 0.5, 0],
          explanation: t(
            "studio_3d.spatial.explanations.pathfinding_incorrect",
          ),
        });
      }
    }
  }
  // ======== CHIRALITY ========
  else if (mod === "chirality") {
    const mirrored = mirrorStructure(baseStructure, "x");
    for (let i = 0; i < 4; i++) {
      if (i === correctIdx) {
        newOptions.push({
          structure: baseStructure,
          rotation: [0.3, 0.5, 0],
          explanation: t("studio_3d.spatial.explanations.chirality_correct"),
        });
      } else if (i === 1) {
        newOptions.push({
          structure: mirrored,
          rotation: [0.3, 0.5, 0],
          explanation: t(
            "studio_3d.spatial.explanations.chirality_incorrect_mirror",
          ),
        });
      } else {
        const distractor = generateStructure(size);
        newOptions.push({
          structure: distractor,
          rotation: [0.3, 0.5, 0],
          explanation: t(
            "studio_3d.spatial.explanations.chirality_incorrect_random",
          ),
        });
      }
    }
  }
  // ======== NETS ========
  else if (mod === "nets") {
    // Force base structure to single cube for nets module
    baseStructure = [[0, 0, 0]];
    questionData.structure = baseStructure;

    // Full catalog of 11 valid nets
    const ALL_VALID_NETS = [
      {
        net: [
          { x: 1, y: 0 },
          { x: 0, y: 1 },
          { x: 1, y: 1 },
          { x: 2, y: 1 },
          { x: 3, y: 1 },
          { x: 1, y: 2 },
        ],
        explanation:
          "Dit is een 'T-vormige' uitslag: de centrale 4 vlakken vormen de wanden, en de boven/onderkant klappen perfect dicht.",
      },
      {
        net: [
          { x: 1, y: 0 },
          { x: 1, y: 1 },
          { x: 1, y: 2 },
          { x: 1, y: 3 },
          { x: 0, y: 1 },
          { x: 2, y: 1 },
        ],
        explanation:
          "Dit is een 'Kruis-uitslag': een klassieke vorm waarbij elk zijvlak direct verbonden is aan het bodemvlak.",
      },
      {
        net: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 1, y: 1 },
          { x: 2, y: 1 },
          { x: 2, y: 2 },
          { x: 3, y: 2 },
        ],
        explanation:
          "Deze 'Trap-uitslag' verdeelt de vlakken zo dat ze elkaar bij het vouwen nergens overlappen en de kubus sluiten.",
      },
      {
        net: [
          { x: 0, y: 0 },
          { x: 0, y: 1 },
          { x: 1, y: 1 },
          { x: 1, y: 2 },
          { x: 2, y: 2 },
          { x: 2, y: 3 },
        ],
        explanation:
          "Het 'Z-patroon' vouwt compact in elkaar waarbij elk vlak precies één unieke zijde van de kubus bedekt.",
      },
      {
        net: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 },
          { x: 3, y: 0 },
          { x: 1, y: 1 },
          { x: 1, y: 2 },
        ],
        explanation:
          "Deze uitslag heeft een lange zijde van 4; de andere twee flapjes zitten op de juiste plek voor boven- en onderkant.",
      },
      {
        net: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 },
          { x: 2, y: 1 },
          { x: 3, y: 1 },
          { x: 3, y: 2 },
        ],
        explanation:
          "Een versprongen patroon dat ondanks de vreemde vorm precies 6 unieke zijden vormt zonder gaten.",
      },
      {
        net: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 1, y: 1 },
          { x: 2, y: 1 },
          { x: 2, y: 2 },
          { x: 2, y: 3 },
        ],
        explanation:
          "Dit 'Slang-patroon' lijkt complex, maar de vouwlijnen komen precies uit om de kubus volledig te omhullen.",
      },
      {
        net: [
          { x: 1, y: 0 },
          { x: 2, y: 0 },
          { x: 0, y: 1 },
          { x: 1, y: 1 },
          { x: 2, y: 1 },
          { x: 1, y: 2 },
        ],
        explanation:
          "Hier vormen de verbonden vlakken een stevige basis die bij het roteren alle 6 richtingen afsluit.",
      },
      {
        net: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 },
          { x: 0, y: 1 },
          { x: 1, y: 1 },
          { x: 3, y: 0 },
        ],
        explanation:
          "De positie van de twee 'vleugels' zorgt ervoor dat ze de open uiteinden van de 4-vlakken ring sluiten.",
      },
      {
        net: [
          { x: 0, y: 0 },
          { x: 0, y: 1 },
          { x: 1, y: 1 },
          { x: 2, y: 1 },
          { x: 2, y: 2 },
          { x: 3, y: 2 },
        ],
        explanation:
          "Dit patroon benut de hoeken zo dat elke zijde exact één keer bedekt wordt.",
      },
      {
        net: [
          { x: 1, y: 0 },
          { x: 2, y: 0 },
          { x: 2, y: 1 },
          { x: 3, y: 1 },
          { x: 0, y: 2 },
          { x: 1, y: 2 },
        ],
        explanation:
          "Een zig-zag uitslag: hoewel verspreid, vouwen de paren vlakken zich om elkaar heen tot een cube.",
      },
    ];

    // Catalog of Plausible but INVALID connected nets (usually faces that will overlap)
    const ALL_INVALID_NETS = [
      {
        net: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 },
          { x: 3, y: 0 },
          { x: 4, y: 0 },
          { x: 1, y: 1 },
        ],
        explanation:
          "Fout: Een rij van 5 vlakken is onmogelijk voor een kubus; twee vlakken zullen op dezelfde plek eindigen.",
      },
      {
        net: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 },
          { x: 3, y: 0 },
          { x: 0, y: 1 },
          { x: 1, y: 1 },
        ],
        explanation:
          "Fout: De twee onderste flapjes zitten aan dezelfde kant; ze zullen over elkaar heen klappen (overlap).",
      },
      {
        net: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 },
          { x: 3, y: 0 },
          { x: 1, y: 1 },
          { x: 2, y: 1 },
        ],
        explanation:
          "Fout: Bij het vouwen van de ring van 4, komen de 2 zijflapjes op exact dezelfde plek terecht.",
      },
      {
        net: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 0, y: 1 },
          { x: 1, y: 1 },
          { x: 2, y: 1 },
          { x: 3, y: 1 },
        ],
        explanation:
          "Fout: Het 2x2 blok in de hoek zorgt voor dubbele vlakken, waardoor de andere kant van de kubus open blijft.",
      },
      {
        net: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 },
          { x: 0, y: 1 },
          { x: 1, y: 1 },
          { x: 2, y: 1 },
        ],
        explanation:
          "Fout: Een 3x2 blok vormt een dubbele wand zonder dat je een 3D resultaat kunt vouwen (geen sluiting).",
      },
      {
        net: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 },
          { x: 2, y: 1 },
          { x: 1, y: 1 },
          { x: 0, y: 1 },
        ],
        explanation:
          "Fout: Deze 'O-vorm' vouwt alleen op zichzelf terug; er zijn geen flapjes om de zijkanten te dichten.",
      },
      {
        net: [
          { x: 1, y: 0 },
          { x: 1, y: 1 },
          { x: 1, y: 2 },
          { x: 0, y: 2 },
          { x: 0, y: 1 },
          { x: 1, y: 3 },
        ],
        explanation:
          "Fout: Meerdere vlakken rond één punt creëren een gat elders en een overlap bij de hoek.",
      },
      {
        net: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 },
          { x: 1, y: 1 },
          { x: 1, y: 2 },
          { x: 2, y: 2 },
        ],
        explanation:
          "Fout: De asymmetrische plaatsing van de flapjes laat de bovenkant van de kubus open liggen.",
      },
    ];

    const shuffledValid = shuffle(ALL_VALID_NETS);
    const shuffledInvalid = shuffle(ALL_INVALID_NETS);

    for (let i = 0; i < 4; i++) {
      if (i === correctIdx) {
        const item = shuffledValid.pop()!;
        newOptions.push({
          structure: [],
          twoDData: { isNet: true, valid: true, net: item.net, type: "cube" },
          explanation: item.explanation,
        });
      } else {
        const item = shuffledInvalid.pop()!;
        newOptions.push({
          structure: [],
          twoDData: { isNet: true, valid: false, net: item.net, type: "cube" },
          explanation: item.explanation,
        });
      }
    }
  }
  // ======== STABILITY ========
  else if (mod === "stability") {
    const generateTower = (unstable: boolean) => {
      let attempt = 0;
      while (attempt < 50) {
        attempt++;
        // 1. Generate random stack
        const tower = [];
        let y = -3;
        // Base is fixed
        tower.push({
          x: 0,
          y: y,
          z: 0,
          w: 2 + Math.random(),
          h: 1,
          d: 2 + Math.random(),
          mass: 100,
        });
        y += 1;

        // Stack 3-4 blocks
        const count = 3 + Math.floor(Math.random() * 2);
        for (let k = 0; k < count; k++) {
          const w = 0.8 + Math.random() * 1.2;
          const d = 0.8 + Math.random() * 1.2;
          const xOffset = (Math.random() - 0.5) * 1.5;
          tower.push({ x: xOffset, y: y, z: 0, w, h: 1, d, mass: w * d }); // Mass proportional to volume (h=1)
          y += 1;
        }

        // 2. Calculate Center of Mass for sub-stacks to check stability
        // For a stack to be stable, the CoM of all blocks ABOVE block i must fall within the width of block i.
        // We check from top down? No, we check from bottom up.
        // For each block i (support), the composite CoM of everything above it must be within its bounds.

        let isStable = true;
        // Check every interface
        for (let i = 0; i < tower.length - 1; i++) {
          const support = tower[i]!;
          // Calculate CoM of all blocks above i
          let totalMass = 0;
          let weightedX = 0;
          for (let j = i + 1; j < tower.length; j++) {
            const block = tower[j]!;
            weightedX += block.x * block.mass;
            totalMass += block.mass;
          }
          const comX = weightedX / totalMass;

          // Check if CoM is within support bounds (with slight margin for error)
          const halfW = support.w / 2;
          if (comX < support.x - halfW || comX > support.x + halfW) {
            isStable = false;
            break;
          }
        }

        if (isStable === !unstable) return tower; // Found matching configuration
      }
      // Fallback if failing to find specific state
      return [
        { x: 0, y: -3, z: 0, w: 2, h: 1, d: 2, mass: 10 },
        { x: 0, y: -2, z: 0, w: 1, h: 1, d: 1, mass: 1 },
        { x: unstable ? 2 : 0, y: -1, z: 0, w: 1, h: 1, d: 1, mass: 1 },
      ];
    };

    for (let i = 0; i < 4; i++) {
      const isUnstable = i === correctIdx;
      const tower = generateTower(isUnstable);
      newOptions.push({
        structure: [],
        tower,
        unstable: isUnstable,
        rotation: [0, 0, 0],
        explanation: isUnstable
          ? t("studio_3d.spatial.explanations.stability_correct")
          : t("studio_3d.spatial.explanations.stability_incorrect"),
      });
    }
  }
  // ======== XRAY ========
  else if (mod === "xray") {
    const outer = generateStructure(8);
    const inner = generateStructure(3);
    questionData.outer = outer;
    questionData.inner = inner;

    for (let i = 0; i < 4; i++) {
      if (i === correctIdx) {
        newOptions.push({
          structure: outer,
          innerStructure: inner,
          rotation: [0.3, 0.3, 0],
        } as any);
      } else {
        const wrongInner = generateStructure(3);
        newOptions.push({
          structure: outer,
          innerStructure: wrongInner,
          rotation: [0.3, 0.3, 0],
        } as any);
      }
    }
  }
  // ======== DEFAULT FALLBACK ========
  else {
    for (let i = 0; i < 4; i++) {
      newOptions.push({ structure: baseStructure, rotation: [0.3, 0.5, 0] });
    }
  }

  return { options: newOptions, correctIdx, questionData };
};
