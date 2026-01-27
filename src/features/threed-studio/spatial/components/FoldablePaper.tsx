/* eslint-disable react-hooks/set-state-in-effect */
import { Base, Geometry, Subtraction } from "@react-three/csg";
import { useFrame } from "@react-three/fiber";
import * as d3 from "d3-ease";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

export const FoldablePaper = ({
  folds,
  punches,
  flat = false,
}: {
  folds: { type: "h" | "v" | "d"; pos: number }[];
  punches: { x: number; y: number }[];
  flat?: boolean;
}) => {
  const [t, setT] = useState(0);
  const direction = useRef(1);

  useEffect(() => {
    setT(0);
    direction.current = 1;
  }, [folds]);

  useFrame((_state, delta) => {
    if (flat) return; // No animation for flat view
    const speed = 0.8 * delta;
    let nextT = t + speed * direction.current;
    if (nextT > 1.5) {
      direction.current = -1;
      nextT = 1.5;
    } else if (nextT < -0.5) {
      direction.current = 1;
      nextT = -0.5;
    }
    setT(nextT);
  });

  const animVal = Math.max(0, Math.min(1, t));
  const ease = d3.easeCubicInOut(animVal);
  const foldAngle = flat ? 0 : ease * Math.PI;

  const f = folds[0] || { type: "h", pos: 0.5 };
  const hasFolds = folds.length > 0 && !flat;

  // Determine Cut Angle (Rotation of Mask)
  const cutRotation = useMemo(() => {
    if (f.type === "v") return Math.PI / 2;
    if (f.type === "h") return 0;
    return Math.PI / 4; // Diagonal
  }, [f.type]);

  const maskPosition = useMemo(() => {
    // We want the edge of the mask box to lie exactly on the fold line (origin).
    // Since the box height is 10, the center should be at dist=5 from origin.
    const dist = 5;
    return {
      a: [-Math.sin(cutRotation) * dist, Math.cos(cutRotation) * dist, 0] as [
        number,
        number,
        number,
      ],
      b: [Math.sin(cutRotation) * dist, -Math.cos(cutRotation) * dist, 0] as [
        number,
        number,
        number,
      ],
    };
  }, [cutRotation]);

  const maskScale: [number, number, number] = [10, 10, 1]; // Large enough to cover any 4x4 rotation

  return (
    <group scale={flat ? 1 : 0.85} rotation={flat ? [0, 0, 0] : [0.4, 0, 0]}>
      {/* PIECE A: Stationary (Bottom/Left Part) */}
      <mesh>
        <Geometry>
          <Base>
            <boxGeometry args={[4, 4, 0.05]} />
          </Base>
          {/* Subtract the part that moves - ONLY IF FOLDING */}
          {hasFolds && (
            <Subtraction
              rotation={[0, 0, cutRotation]}
              position={maskPosition.a}
            >
              <boxGeometry args={maskScale} />
            </Subtraction>
          )}
          {/* Subtract Holes */}
          {punches.map((p, i) => (
            <Subtraction
              key={`punch-a-${i}`}
              position={[p.x * 4 - 2, 2 - p.y * 4, 0]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <cylinderGeometry args={[0.12, 0.12, 0.5, 16]} />
            </Subtraction>
          ))}
        </Geometry>
        <meshStandardMaterial
          color="#ffffff"
          side={THREE.DoubleSide}
          roughness={1}
          metalness={0}
        />
      </mesh>

      {/* PIECE B: Moving Part (The part that folds over) - ONLY IF FOLDING */}
      {hasFolds && (
        <group rotation={[0, 0, cutRotation]}>
          <group rotation={[foldAngle, 0, 0]}>
            <group rotation={[0, 0, -cutRotation]}>
              {/* Tiny Z-offset for the folding piece to prevent z-fighting when closed */}
              <group position={[0, 0, 0.06]}>
                <mesh>
                  <Geometry>
                    <Base>
                      <boxGeometry args={[4, 4, 0.05]} />
                    </Base>
                    {/* Subtract the part that stays stationary */}
                    <Subtraction
                      rotation={[0, 0, cutRotation]}
                      position={maskPosition.b}
                    >
                      <boxGeometry args={maskScale} />
                    </Subtraction>
                    {/* Subtract Holes */}
                    {punches.map((p, i) => (
                      <Subtraction
                        key={`punch-b-${i}`}
                        position={[p.x * 4 - 2, 2 - p.y * 4, 0]}
                        rotation={[Math.PI / 2, 0, 0]}
                      >
                        <cylinderGeometry args={[0.12, 0.12, 0.5, 16]} />
                      </Subtraction>
                    ))}
                  </Geometry>
                  <meshStandardMaterial
                    color="#f8fafc"
                    side={THREE.DoubleSide}
                    roughness={1}
                    metalness={0}
                  />
                </mesh>
              </group>
            </group>
          </group>
        </group>
      )}

      {/* Fold Line Indicator (Subtle) - ONLY IF FOLDING */}
      {hasFolds && (
        <mesh rotation={[0, 0, cutRotation]} position={[0, 0, 0.03]}>
          <boxGeometry args={[4, 0.015, 0.01]} />
          <meshBasicMaterial color="#94a3b8" transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
};
