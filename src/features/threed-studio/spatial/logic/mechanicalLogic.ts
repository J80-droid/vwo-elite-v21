/* eslint-disable @typescript-eslint/no-explicit-any */
import { StructureOption } from "../../types";

export const generateMechanicalRound = (
  correctIdx: number,
): {
  options: StructureOption[];
  gears: any[];
  belts: any[];
  correctDir: number;
} => {
  // Gear Chain with Belts, Cross-Belts (Pulleys), and Bevel Gears
  const gearList: any[] = [
    { x: 0, y: 0, z: 0, radius: 0.8, speed: 1, axis: "z", color: "#94a3b8" },
  ];
  const beltList: any[] = [];
  let currentDir = 1;
  let currentAxis: "x" | "y" | "z" = "z";
  const options: StructureOption[] = [];

  const numGears = 4;
  for (let i = 1; i < numGears; i++) {
    const prev = gearList[i - 1];
    const r = Math.random();
    const next: any = {
      x: prev.x,
      y: prev.y,
      z: prev.z,
      radius: 0.8,
      speed: 1,
      axis: currentAxis as "x" | "y" | "z",
      color: "#94a3b8",
      connectionToPrev: "mesh",
    };
    let connType: "mesh" | "belt" | "belt-cross" | "bevel" = "mesh";

    if (r < 0.4) connType = "mesh";
    else if (r < 0.7) connType = "belt";
    else if (r < 0.85) connType = "belt-cross";
    else connType = "bevel";

    if (connType === "bevel") {
      const newAxis: "x" | "y" | "z" =
        currentAxis === "z" ? (Math.random() > 0.5 ? "x" : "y") : "z";
      next.x += 1.4;
      next.axis = newAxis;
      currentAxis = newAxis;
      currentDir *= -1;
      next.connectionToPrev = "mesh"; // Bevel acts like mesh for speed
    } else {
      const dist = connType === "mesh" ? 1.6 : 3.0;
      next.x += dist;
      next.connectionToPrev = connType;

      if (connType === "mesh" || connType === "belt-cross") currentDir *= -1;

      if (connType === "belt" || connType === "belt-cross") {
        beltList.push({ from: i - 1, to: i, type: connType });
      }
    }

    next.speed = currentDir;
    if (i === numGears - 1) next.color = "#fbbf24"; // Yellow for the target gear
    gearList.push(next);
  }

  // Generate Options
  const correctSpeed = gearList[gearList.length - 1].speed;
  for (let i = 0; i < 2; i++) {
    const val = i === correctIdx ? correctSpeed : -correctSpeed;
    options.push({ structure: [], gearDir: val });
  }

  return {
    options,
    gears: gearList,
    belts: beltList,
    correctDir: correctSpeed,
  };
};
