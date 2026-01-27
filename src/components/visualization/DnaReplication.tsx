/* eslint-disable react-hooks/exhaustive-deps */
import { useFrame } from "@react-three/fiber";
import React, { useMemo, useRef } from "react";
import * as THREE from "three";

interface DnaReplicationProps {
  sequence: string;
  active: boolean;
}

export const DnaReplication: React.FC<DnaReplicationProps> = ({
  sequence,
  active,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const helixRadius = 1.5;
  const helixStep = 0.5;

  const baseColors: Record<string, string> = {
    A: "#ef4444",
    T: "#3b82f6",
    C: "#22c55e",
    G: "#eab308",
  };

  const complementary: Record<string, string> = {
    A: "T",
    T: "A",
    C: "G",
    G: "C",
  };

  const bases = useMemo(() => {
    return sequence.split("").map((base, i) => ({
      base,
      comp: complementary[base] || "A",
      y: i * helixStep - (sequence.length * helixStep) / 2,
      angle: i * 0.5,
    }));
  }, [sequence]);

  useFrame((state) => {
    if (!groupRef.current || !active) return;
    const t = state.clock.getElapsedTime();

    groupRef.current.children.forEach((child, i) => {
      const index = Math.floor(i / 2);
      const isComp = i % 2 === 1;

      // Helicase effect: Unzipping based on time
      const unzipProgress = ((t % 10) / 10) * sequence.length;
      const separation =
        index < unzipProgress ? (unzipProgress - index) * 0.5 : 0;
      const limitedSeparation = Math.min(separation, 4);

      const baseItem = bases[index];
      if (!baseItem) return;

      const angle = baseItem.angle + t * 0.2;
      const x = Math.cos(angle) * helixRadius;
      const z = Math.sin(angle) * helixRadius;

      if (!isComp) {
        child.position.set(
          x + limitedSeparation * Math.cos(angle),
          baseItem.y,
          z + limitedSeparation * Math.sin(angle),
        );
      } else {
        child.position.set(
          -x - limitedSeparation * Math.cos(angle),
          baseItem.y,
          -z - limitedSeparation * Math.sin(angle),
        );
      }
    });
  });

  return (
    <group ref={groupRef}>
      {bases.map((b, i) => (
        <React.Fragment key={i}>
          {/* Template Strand Base */}
          <mesh>
            <boxGeometry args={[0.4, 0.2, 0.4]} />
            <meshStandardMaterial color={baseColors[b.base] || "#ccc"} />
          </mesh>
          {/* Complementary Strand Base */}
          <mesh>
            <boxGeometry args={[0.4, 0.2, 0.4]} />
            <meshStandardMaterial
              color={baseColors[b.comp] || "#ccc"}
              transparent
              opacity={active ? 1 : 0.2}
            />
          </mesh>
        </React.Fragment>
      ))}

      {/* Helicase Representation */}
      {active && (
        <mesh position={[0, -2, 0]}>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshStandardMaterial
            color="#7c3aed"
            emissive="#7c3aed"
            emissiveIntensity={0.5}
            transparent
            opacity={0.6}
          />
        </mesh>
      )}
    </group>
  );
};
