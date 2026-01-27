// VectorGhost - Trail/Ghost Effect Component
import { useFrame } from "@react-three/fiber";
import React, { useRef, useState } from "react";

import { VectorArrow } from "./VectorArrow";

interface VectorGhostProps {
  vector: { id: string; x: number; y: number; z: number; color: string };
  active: boolean;
}

export const VectorGhost: React.FC<VectorGhostProps> = ({ vector, active }) => {
  const [ghosts, setGhosts] = useState<[number, number, number][]>([]);
  const lastPos = useRef<[number, number, number] | null>(null);

  useFrame(() => {
    if (!active) {
      if (ghosts.length > 0) setGhosts([]);
      return;
    }

    const currentPos: [number, number, number] = [vector.x, vector.y, vector.z];

    // Only record if moved significantly
    if (
      !lastPos.current ||
      Math.abs(currentPos[0] - lastPos.current[0]) > 0.05 ||
      Math.abs(currentPos[1] - lastPos.current[1]) > 0.05 ||
      Math.abs(currentPos[2] - lastPos.current[2]) > 0.05
    ) {
      setGhosts((prev) => [currentPos, ...prev].slice(0, 8));
      lastPos.current = currentPos;
    }
  });

  if (!active) return null;

  return (
    <group>
      {ghosts.map((pos, i) => (
        <VectorArrow
          key={`${vector.id}-ghost-${i}`}
          start={[0, 0, 0]}
          direction={pos}
          color={vector.color}
          scale={Math.sqrt(pos[0] ** 2 + pos[1] ** 2 + pos[2] ** 2)}
          opacity={0.5 * (1 - i / ghosts.length)}
          label=""
          isGhost
        />
      ))}
    </group>
  );
};
