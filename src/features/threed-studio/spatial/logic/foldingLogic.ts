/* eslint-disable @typescript-eslint/no-explicit-any */
import { LevelConfig, StructureOption } from "../../types";
import { reflectPointAcrossLine } from "./geometryUtils";

export function generateFoldingRound(
  levelConfig: LevelConfig,
  correctIdx: number,
): { options: StructureOption[]; folds: any[]; punches: any[] } {
  // Generate Random Folds
  const numFolds = Math.min(3, Math.floor(levelConfig.complexity / 1.5) + 1);
  const generatedFolds: any[] = [];
  const types = ["h", "v", "d"] as const;

  for (let i = 0; i < numFolds; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    generatedFolds.push({ type, pos: 0.5 });
  }

  // Generate Initial Punches (on the fully folded packet)
  const initialPunches: { x: number; y: number }[] = [];
  const punchCount = 1 + Math.floor(Math.random() * 2);
  for (let i = 0; i < punchCount; i++) {
    initialPunches.push({
      x: 0.4 + Math.random() * 0.2,
      y: 0.4 + Math.random() * 0.2,
    });
  }

  // Algorithm to calculate the unfolded state
  const calculateUnfoldedPunches = (
    startPunches: { x: number; y: number }[],
    folds: any[],
  ) => {
    let currentPunches = [...startPunches];
    for (let i = folds.length - 1; i >= 0; i--) {
      const f = folds[i];
      const newPunches = [];
      for (const p of currentPunches) {
        newPunches.push(p);
        newPunches.push(reflectPointAcrossLine(p, f.type, f.pos));
      }
      currentPunches = newPunches;
    }
    return currentPunches;
  };

  const correctPunches = calculateUnfoldedPunches(
    initialPunches,
    generatedFolds,
  );

  // Generate Options
  const options: StructureOption[] = [];
  const usedHashes = new Set<string>();

  // Hash helper
  const getPunchHash = (punches: { x: number; y: number }[]) => {
    return punches
      .map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)
      .sort()
      .join("|");
  };

  const correctHash = getPunchHash(correctPunches);
  usedHashes.add(correctHash);

  for (let i = 0; i < 4; i++) {
    if (i === correctIdx) {
      options.push({
        structure: [],
        twoDData: {
          punches: correctPunches,
          folds: generatedFolds,
          correct: true,
        },
      });
    } else {
      let wrongPunches: { x: number; y: number }[] = [];
      let attempts = 0;

      while (attempts < 10) {
        attempts++;
        let currentWrong = [...correctPunches];
        const strategy = Math.random();

        if (strategy < 0.2) {
          // Remove a random punch
          if (currentWrong.length > 1) {
            const idx = Math.floor(Math.random() * currentWrong.length);
            currentWrong.splice(idx, 1);
          } else {
            currentWrong.push({
              x: (currentWrong[0]!.x + 0.3) % 1,
              y: (currentWrong[0]!.y + 0.3) % 1,
            });
          }
        } else if (strategy < 0.4) {
          // Add an extra random punch
          currentWrong.push({
            x: 0.2 + Math.random() * 0.6,
            y: 0.2 + Math.random() * 0.6,
          });
        } else if (strategy < 0.6) {
          // Shift all punches
          const dx = Math.random() > 0.5 ? 0.2 : -0.2;
          currentWrong = currentWrong.map((p) => ({
            x: Math.max(0.1, Math.min(0.9, p.x + dx)),
            y: p.y,
          }));
        } else if (strategy < 0.8) {
          // Mirror incorrectly
          currentWrong = currentWrong.map((p) => ({ x: 1 - p.x, y: p.y }));
        } else {
          // Rotate incorrectly
          currentWrong = currentWrong.map((p) => ({ x: p.y, y: 1 - p.x }));
        }

        const hash = getPunchHash(currentWrong);
        if (!usedHashes.has(hash)) {
          wrongPunches = currentWrong;
          usedHashes.add(hash);
          break;
        }
      }

      // Fallback if no unique distractor found
      if (wrongPunches.length === 0) {
        // Completely random garbage pattern
        wrongPunches = [
          { x: 0.25, y: 0.25 },
          { x: 0.75, y: 0.75 },
        ].slice(0, 1 + Math.floor(Math.random() * 2));
        usedHashes.add(getPunchHash(wrongPunches));
      }

      options.push({
        structure: [],
        twoDData: {
          punches: wrongPunches,
          folds: generatedFolds,
          correct: false,
        },
      });
    }
  }

  return { options, folds: generatedFolds, punches: initialPunches };
}
