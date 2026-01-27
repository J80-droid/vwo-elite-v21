import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

// --- Mechanical Components ---

export const Gear = ({
  position,
  radius,
  speed,
  axis = "z",
  color = "#94a3b8",
  isBevel = false,
  showArrows = false,
}: {
  position: [number, number, number];
  radius: number;
  speed: number;
  axis?: "x" | "y" | "z";
  color?: string;
  // Added prop for visual distinction
  isBevel?: boolean;
  showArrows?: boolean;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((_state, delta) => {
    if (meshRef.current) {
      if (axis === "z") meshRef.current.rotation.z += delta * speed * 2;
      if (axis === "x") meshRef.current.rotation.x += delta * speed * 2;
      if (axis === "y") meshRef.current.rotation.y += delta * speed * 2;
    }
  });

  const rotation: [number, number, number] =
    axis === "x"
      ? [0, Math.PI / 2, 0]
      : axis === "y"
        ? [Math.PI / 2, 0, 0]
        : [0, 0, 0];

  return (
    <group position={position} rotation={rotation}>
      <mesh ref={meshRef}>
        {isBevel ? (
          // Bevel Gear: Cone shape
          <cylinderGeometry args={[radius * 0.4, radius, 0.4, 12]} />
        ) : (
          // Standard Gear: Cylinder
          <cylinderGeometry args={[radius, radius, 0.2, 12]} />
        )}
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
        {!isBevel &&
          [...Array(12)].map((_, i) => (
            <mesh
              key={i}
              rotation={[0, 0, (i / 12) * Math.PI * 2]}
              position={[
                Math.cos((i / 12) * Math.PI * 2) * radius,
                Math.sin((i / 12) * Math.PI * 2) * radius,
                0,
              ]}
            >
              <boxGeometry args={[0.2, 0.2, 0.2]} />
              <meshStandardMaterial
                color={color}
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>
          ))}
        {isBevel && (
          // Simple visual teeth for bevel
          <mesh position={[0, -0.1, 0]}>
            <cylinderGeometry args={[radius, radius * 0.8, 0.1, 12]} />
            <meshStandardMaterial
              color={color}
              metalness={0.6}
              roughness={0.5}
            />
          </mesh>
        )}
      </mesh>

      {showArrows && (
        <group rotation={[0, 0, speed > 0 ? 0 : Math.PI]}>
          <ForceArrow
            radius={radius + 0.3}
            color={speed > 0 ? "#4ADE80" : "#F87171"}
          />
        </group>
      )}
    </group>
  );
};

const ForceArrow = ({ radius, color }: { radius: number; color: string }) => {
  return (
    <group>
      {/* Curved shaft */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.04, 8, 32, Math.PI / 2]} />
        <meshStandardMaterial color={color} transparent opacity={0.6} />
      </mesh>
      {/* Arrow head */}
      <mesh position={[radius, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.1, 0.25, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
};

export const Belt = ({
  from,
  to,
  type,
}: {
  from: { x: number; y: number; radius: number };
  to: { x: number; y: number; radius: number };
  type: "belt" | "belt-cross";
}) => {
  const r = 0.8; // Radius assumed constant for now or use prop
  const color = "#555";

  if (type === "belt") {
    return (
      <group>
        <ProjectedLine
          start={[from.x, from.y + r, 0]}
          end={[to.x, to.y + r, 0]}
          color={color}
        />
        <ProjectedLine
          start={[from.x, from.y - r, 0]}
          end={[to.x, to.y - r, 0]}
          color={color}
        />
      </group>
    );
  } else {
    return (
      <group>
        <ProjectedLine
          start={[from.x, from.y + r, 0]}
          end={[to.x, to.y - r, 0]}
          color={color}
        />
        <ProjectedLine
          start={[from.x, from.y - r, 0]}
          end={[to.x, to.y + r, 0]}
          color={color}
        />
        <ProjectedLine
          start={[0, 0, 0]}
          end={[0, 0, 0]}
          color={color}
          transparent
          opacity={0}
        />
      </group>
    );
  }
};

export const ProjectedLine = ({
  start,
  end,
  color,
  transparent = false,
  opacity = 1,
}: {
  start: number[];
  end: number[];
  color: string;
  transparent?: boolean;
  opacity?: number;
}) => {
  const dx = (end[0] ?? 0) - (start[0] ?? 0);
  const dy = (end[1] ?? 0) - (start[1] ?? 0);
  const len = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);
  const mid = [
    (start[0] ?? 0) + (end[0] ?? 0),
    (start[1] ?? 0) + (end[1] ?? 0),
    0,
  ].map((v) => v / 2) as [number, number, number];
  return (
    <mesh position={mid} rotation={[0, 0, angle]}>
      <boxGeometry args={[len, 0.1, 0.05]} />
      <meshStandardMaterial
        color={color}
        transparent={transparent}
        opacity={opacity}
      />
    </mesh>
  );
};
