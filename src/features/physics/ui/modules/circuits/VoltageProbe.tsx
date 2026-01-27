import { Float, Html } from "@react-three/drei";
import React from "react";

export const VoltageProbe: React.FC<{
  position: [number, number, number];
  nodeName: string;
}> = ({ position, nodeName }) => {
  return (
    <group position={position}>
      <Float speed={5} rotationIntensity={0.5} floatIntensity={0.5}>
        {/* De Pen (Rood plastic) */}
        <mesh rotation={[Math.PI, 0, 0]} position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.04, 0.02, 0.6]} />
          <meshStandardMaterial color="#dc2626" roughness={0.2} />
        </mesh>

        {/* De Tip (Metaal) */}
        <mesh rotation={[Math.PI, 0, 0]} position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.005, 0.04, 0.2]} />
          <meshStandardMaterial color="#e5e7eb" metalness={1} roughness={0.1} />
        </mesh>

        {/* Kabeltje (Visueel detail) */}
        <mesh position={[0, 0.8, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.4]} />
          <meshStandardMaterial color="#1f2937" />
        </mesh>
      </Float>

      {/* Label dat meedraait */}
      <Html position={[0, 1, 0]} center pointerEvents="none">
        <div className="bg-slate-900/90 text-white px-2 py-1 rounded text-xs font-mono border border-red-500 shadow-lg whitespace-nowrap">
          PROBE: {nodeName}
        </div>
      </Html>
    </group>
  );
};
