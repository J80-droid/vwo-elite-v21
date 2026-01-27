/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef } from "react";
import * as THREE from "three";

import { Vec3 } from "../../types";

// --- 3D Shape Component (Voxel-based) ---
export const Shape = ({
  structure,
  rotation = [0, 0, 0],
  color = "#4ADE80",
  scale = 1,
  wireframe = false,
  opacity = 1,
  position = [0, 0, 0],
  ...props
}: any) => {
  const group = useRef<THREE.Group>(null);
  return (
    <group
      ref={group}
      rotation={rotation}
      scale={scale}
      position={position}
      {...props}
    >
      {(structure || []).map((pos: Vec3, i: number) => (
        <mesh key={i} position={pos}>
          <boxGeometry args={[0.95, 0.95, 0.95]} />
          <meshStandardMaterial
            color={color}
            roughness={0.2}
            metalness={0.8}
            wireframe={wireframe}
            transparent={opacity < 1}
            opacity={opacity}
            emissive={color}
            emissiveIntensity={0.1}
          />
        </mesh>
      ))}
    </group>
  );
};
