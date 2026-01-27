// DeformableSpace - Matrix Transformation Wrapper Component
import { Line as DreiLine } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import React, { useRef, useState } from "react";
import * as THREE from "three";

import { MatrixValues } from "../../types";

interface DeformableSpaceProps {
  children: React.ReactNode;
  matrixValues: MatrixValues;
  active: boolean;
}

export const DeformableSpace: React.FC<DeformableSpaceProps> = ({
  children,
  matrixValues,
  active,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [progress, setProgress] = useState(0);

  // Animation Loop
  useFrame((_state, delta) => {
    const target = active ? 1 : 0;
    if (Math.abs(progress - target) > 0.001) {
      const step = delta * 1.5; // Speed
      const newProgress =
        progress < target
          ? Math.min(target, progress + step)
          : Math.max(target, progress - step);
      setProgress(newProgress);
    }

    if (groupRef.current) {
      // Interpolate Matrix
      const p = progress;
      const ease = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);
      const t = ease(p);

      const m = new THREE.Matrix4();
      m.set(
        1 + (matrixValues.m11 - 1) * t,
        0 + (matrixValues.m12 - 0) * t,
        0 + (matrixValues.m13 - 0) * t,
        0,
        0 + (matrixValues.m21 - 0) * t,
        1 + (matrixValues.m22 - 1) * t,
        0 + (matrixValues.m23 - 0) * t,
        0,
        0 + (matrixValues.m31 - 0) * t,
        0 + (matrixValues.m32 - 0) * t,
        1 + (matrixValues.m33 - 1) * t,
        0,
        0,
        0,
        0,
        1,
      );

      groupRef.current.matrixAutoUpdate = false;
      groupRef.current.matrix.copy(m);
      groupRef.current.updateMatrixWorld(true);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Transformed Grid */}
      <gridHelper
        args={[20, 20, 0x444444, 0x222222]}
        rotation={[Math.PI / 2, 0, 0]}
      />

      {/* Basis Vectors (if active) */}
      {progress > 0.1 && (
        <group>
          {/* i-hat (Red) */}
          <DreiLine
            points={[
              [0, 0, 0],
              [1, 0, 0],
            ]}
            color="#f87171"
            lineWidth={4}
          />
          {/* j-hat (Green) */}
          <DreiLine
            points={[
              [0, 0, 0],
              [0, 1, 0],
            ]}
            color="#4ade80"
            lineWidth={4}
          />
          {/* k-hat (Blue) */}
          <DreiLine
            points={[
              [0, 0, 0],
              [0, 0, 1],
            ]}
            color="#60a5fa"
            lineWidth={4}
          />
        </group>
      )}

      {children}
    </group>
  );
};
