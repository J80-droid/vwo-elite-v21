import {
  Float,
  OrbitControls,
  PerspectiveCamera,
  Stars,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import React, { useMemo, useRef } from "react";

interface CrystalLatticeProps {
  type?:
    | "BCC"
    | "FCC"
    | "HCP"
    | "Diamond"
    | "BCT"
    | "Orthorhombic"
    | "Monoclinic"
    | "Triclinic"
    | "Trigonal";
  color?: string;
  size?: number | string;
}

const LatticeAtom: React.FC<{
  position: [number, number, number];
  color?: string;
}> = ({ position, color }) => (
  <mesh position={position}>
    <sphereGeometry args={[0.25, 32, 32]} />
    <meshStandardMaterial
      color={color || "#38bdf8"}
      roughness={0.1}
      metalness={0.8}
    />
  </mesh>
);

export const CrystalLattice: React.FC<CrystalLatticeProps> = ({
  type = "BCC",
  color,
  size = 200,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const atoms = useMemo(() => {
    // ... (logic skipped)
    const pts: [number, number, number][] = [];
    const dim = 1.5; // Scale of the unit cell

    if (type === "BCC") {
      // Body Centered Cubic: Corners + Center
      for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
          for (let z = -1; z <= 1; z++) {
            pts.push([x * dim, y * dim, z * dim]);
            if (x < 1 && y < 1 && z < 1) {
              pts.push([(x + 0.5) * dim, (y + 0.5) * dim, (z + 0.5) * dim]);
            }
          }
        }
      }
    } else if (type === "FCC") {
      // Face Centered Cubic: Corners + Face Centers
      for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
          for (let z = -1; z <= 1; z++) {
            pts.push([x * dim, y * dim, z * dim]);
            if (x < 1 && y < 1)
              pts.push([(x + 0.5) * dim, (y + 0.5) * dim, z * dim]);
            if (y < 1 && z < 1)
              pts.push([x * dim, (y + 0.5) * dim, (z + 0.5) * dim]);
            if (x < 1 && z < 1)
              pts.push([(x + 0.5) * dim, y * dim, (z + 0.5) * dim]);
          }
        }
      }
    } else if (type === "HCP") {
      // Hexagonal Close Packed (Simplified)
      for (let layer = -1; layer <= 1; layer++) {
        const y = layer * dim * 0.816;
        const offset = layer % 2 === 0 ? 0 : 0.5;
        for (let q = -1; q <= 1; q++) {
          for (let r = -1; r <= 1; r++) {
            const x = (q + r * 0.5 + offset) * dim;
            const z = r * 0.866 * dim;
            pts.push([x, y, z]);
          }
        }
      }
    } else if (type === "Diamond") {
      // Diamond Cubic: Two interpenetrating FCC lattices offset by (1/4, 1/4, 1/4)
      // Basis FCC
      for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
          for (let z = -1; z <= 1; z++) {
            // Main FCC points
            pts.push([x * dim, y * dim, z * dim]);
            if (x < 1 && y < 1)
              pts.push([(x + 0.5) * dim, (y + 0.5) * dim, z * dim]);
            if (y < 1 && z < 1)
              pts.push([x * dim, (y + 0.5) * dim, (z + 0.5) * dim]);
            if (x < 1 && z < 1)
              pts.push([(x + 0.5) * dim, y * dim, (z + 0.5) * dim]);

            // Offset FCC points (Tetrahedral holes)
            // Only add if within bounds to keep density reasonable
            if (x < 1 && y < 1 && z < 1) {
              pts.push([(x + 0.25) * dim, (y + 0.25) * dim, (z + 0.25) * dim]);
              pts.push([(x + 0.75) * dim, (y + 0.75) * dim, (z + 0.25) * dim]);
              pts.push([(x + 0.75) * dim, (y + 0.25) * dim, (z + 0.75) * dim]);
              pts.push([(x + 0.25) * dim, (y + 0.75) * dim, (z + 0.75) * dim]);
            }
          }
        }
      }
    } else if (type === "BCT") {
      // Body-Centered Tetragonal (Like BCC but stretched Z)
      const cRatio = 1.6;
      for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
          for (let z = -1; z <= 1; z++) {
            pts.push([x * dim, y * dim, z * dim * cRatio]);
            if (x < 1 && y < 1 && z < 1) {
              pts.push([
                (x + 0.5) * dim,
                (y + 0.5) * dim,
                (z + 0.5) * dim * cRatio,
              ]);
            }
          }
        }
      }
    } else if (type === "Orthorhombic") {
      // Simple Orthorhombic (a != b != c)
      // Using ratios approx 0.8 : 1.0 : 1.2
      for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
          for (let z = -1; z <= 1; z++) {
            pts.push([x * dim * 0.8, y * dim, z * dim * 1.2]);
          }
        }
      }
    } else if (type === "Monoclinic") {
      // Simple Monoclinic (beta != 90deg)
      // Shear X based on Y
      const shear = 0.3;
      for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
          for (let z = -1; z <= 1; z++) {
            pts.push([(x + y * shear) * dim, y * dim, z * dim]);
          }
        }
      }
    } else if (type === "Triclinic") {
      // Triclinic (a != b != c, alpha != beta != gamma)
      // Heavy shear in multiple directions
      for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
          for (let z = -1; z <= 1; z++) {
            const sx = x + y * 0.2 + z * 0.3;
            const sy = y + z * 0.2;
            const sz = z;
            pts.push([sx * dim, sy * dim, sz * dim]);
          }
        }
      }
    } else if (type === "Trigonal") {
      // Trigonal / Rhombohedral
      // Skew along diagonal
      for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
          for (let z = -1; z <= 1; z++) {
            // Transform to rhombohedral axes
            const rx = (x - y) * 0.7;
            const ry = (x + y - 2 * z) * 0.4;
            const rz = (x + y + z) * 0.6;
            pts.push([rx * dim, ry * dim, rz * dim]);
          }
        }
      }
    }
    return pts;
  }, [type]);

  return (
    <div
      ref={containerRef}
      className="relative rounded-xl overflow-hidden bg-slate-950/50 border border-white/10"
      style={{ width: size, height: size }}
    >
      <Canvas
        eventSource={
          containerRef as React.RefObject<HTMLElement> as unknown as HTMLElement
        }
      >
        <PerspectiveCamera makeDefault position={[5, 5, 5]} />
        <OrbitControls enableZoom={true} autoRotate autoRotateSpeed={0.5} />
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <Stars
          radius={100}
          depth={50}
          count={1000}
          factor={4}
          saturation={0}
          fade
          speed={1}
        />

        <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
          <group scale={0.6}>
            {atoms.map((pos, i) => (
              <LatticeAtom key={i} position={pos} color={color} />
            ))}
          </group>
        </Float>
      </Canvas>

      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] text-white font-bold tracking-wider">
        {type}
      </div>

      <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-xl shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]" />
    </div>
  );
};
