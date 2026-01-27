/* eslint-disable @typescript-eslint/no-explicit-any */
import { useBox, usePlane } from "@react-three/cannon";
import { useMemo } from "react";
import * as THREE from "three";

// --- Physics Components ---

const StaticBlock = ({
  position,
  args,
  color,
}: {
  position: [number, number, number];
  args: [number, number, number];
  color: string;
}) => (
  <mesh position={position}>
    <boxGeometry args={args} />
    <meshStandardMaterial color={color} />
  </mesh>
);

export const PhysicsBlock = ({
  position,
  args,
  color,
  active,
  mass = 1,
}: {
  position: [number, number, number];
  args: [number, number, number];
  color: string;
  active: boolean;
  mass?: number;
}) => {
  // Only use cannon if active
  if (!active)
    return <StaticBlock position={position} args={args} color={color} />;

  return (
    <DynamicBlock position={position} args={args} color={color} mass={mass} />
  );
};

const DynamicBlock = ({
  position,
  args,
  color,
  mass,
}: {
  position: [number, number, number];
  args: [number, number, number];
  color: string;
  mass: number;
}) => {
  const [ref] = useBox(() => ({
    mass,
    position,
    args,
    material: { friction: 0.5, restitution: 0.1 }, // Standard cardboard/wood friction
  }));
  return (
    <mesh ref={ref as any}>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
};

export const Floor = ({ physics = true }: { physics?: boolean }) => {
  if (!physics) {
    return (
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#333" transparent opacity={0.5} />
      </mesh>
    );
  }
  return <DynamicFloor />;
};

const DynamicFloor = () => {
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, -3, 0],
  }));
  return (
    <mesh ref={ref as any}>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial color="#333" transparent opacity={0.5} />
    </mesh>
  );
};

// --- Platonic Solid Types ---
export type PlatonicType =
  | "tetrahedron"
  | "octahedron"
  | "icosahedron"
  | "dodecahedron";

export const PlatonicShape = ({
  type,
  rotation = [0, 0, 0],
  color = "#4ADE80",
  scale = 1,
  wireframe = false,
}: {
  type: PlatonicType;
  rotation?: [number, number, number];
  color?: string;
  scale?: number;
  wireframe?: boolean;
}) => {
  const geometry = useMemo(() => {
    switch (type) {
      case "tetrahedron":
        return new THREE.TetrahedronGeometry(1);
      case "octahedron":
        return new THREE.OctahedronGeometry(1);
      case "icosahedron":
        return new THREE.IcosahedronGeometry(1);
      case "dodecahedron":
        return new THREE.DodecahedronGeometry(1);
      default:
        return new THREE.BoxGeometry(1, 1, 1);
    }
  }, [type]);

  return (
    <mesh rotation={rotation} scale={scale}>
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial
        color={color}
        roughness={0.2}
        metalness={0.8}
        wireframe={wireframe}
        emissive={color}
        emissiveIntensity={0.2}
      />
    </mesh>
  );
};
