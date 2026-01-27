import React from "react";

export const WireModel: React.FC<{
  current?: number;
  nodeName1?: string;
  nodeName2?: string;
}> = ({ current = 0 }) => {
  // Kleur verandert lichtjes op basis van stroom (heatmap effect)
  const intensity = Math.min(1, Math.abs(current) / 10);
  const color = intensity > 0.5 ? "#f87171" : "#94a3b8"; // Roodgloeiend bij hoge stroom

  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      {/* De Draad zelf */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.03, 0.03, 1, 16]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Connectoren aan de uiteinden */}
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.06]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <mesh position={[0, -0.5, 0]}>
        <sphereGeometry args={[0.06]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
    </group>
  );
};
