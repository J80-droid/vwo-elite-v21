import { Sparkles } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import React, { useRef } from "react";
import * as THREE from "three";

export const ShortCircuitFX: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);

  // Laat het licht en de vonken pulseren voor een chaotisch effect
  useFrame(({ clock }) => {
    if (groupRef.current) {
      const intensity = 1 + Math.sin(clock.elapsedTime * 50) * 0.5; // 50Hz flikkering
      groupRef.current.scale.setScalar(intensity);
    }
  });

  return (
    <group ref={groupRef}>
      {/* 1. De Vonken */}
      <Sparkles
        count={40}
        scale={1.5}
        size={6}
        speed={2.5}
        opacity={1}
        color="#FFFF00"
        noise={1} // Chaotische beweging
      />

      {/* 2. De Gloed (Plasma effect) */}
      <mesh>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial
          color="#ffaa00"
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 3. Het Licht (Belicht de omgeving) */}
      <pointLight color="#ff5500" intensity={5} distance={3} decay={2} />
    </group>
  );
};
