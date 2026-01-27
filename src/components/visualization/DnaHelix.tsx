import { SafeOrbitControls } from "@features/threed-studio/ui/SafeOrbitControls";
import { Float, PerspectiveCamera, Stars } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useCanvasReady } from "@shared/hooks/useCanvasReady";
import { WebGLErrorBoundary } from "@shared/ui/WebGLErrorBoundary";
import React, { useEffect, useState } from "react";
import * as THREE from "three";

interface DnaHelixProps {
  sequence: string;
}

const BASE_COLORS: Record<string, string> = {
  A: "#ef4444", // Red
  T: "#3b82f6", // Blue
  C: "#22c55e", // Green
  G: "#eab308", // Yellow
};

const PAIRS: Record<string, string> = {
  A: "T",
  T: "A",
  C: "G",
  G: "C",
};

const NucleotidePair = ({
  base,
  index,
  total,
  onClick,
  isSelected,
}: {
  base: string;
  index: number;
  total: number;
  onClick: (idx: number) => void;
  isSelected: boolean;
}) => {
  const angle = index * 0.5;
  const y = (index - total / 2) * 0.8;
  const radius = 2;

  const x1 = Math.cos(angle) * radius;
  const z1 = Math.sin(angle) * radius;

  const x2 = Math.cos(angle + Math.PI) * radius;
  const z2 = Math.sin(angle + Math.PI) * radius;

  const color1 = BASE_COLORS[base] || "#888888";
  const pairBase = PAIRS[base] || "N";
  const color2 = BASE_COLORS[pairBase] || "#888888";

  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        onClick(index);
      }}
    >
      {/* Selection Highlight */}
      {isSelected && (
        <mesh position={[0, y, 0]}>
          <cylinderGeometry args={[radius + 0.5, radius + 0.5, 0.6, 16]} />
          <meshStandardMaterial
            color="#ffffff"
            transparent
            opacity={0.15}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Backbone Spheres */}
      <mesh position={[x1, y, z1]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial
          color={isSelected ? "#ffffff" : "#cccccc"}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      <mesh position={[x2, y, z2]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial
          color={isSelected ? "#ffffff" : "#cccccc"}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Base Connector 1 */}
      <mesh position={[x1 / 2, y, z1 / 2]} rotation={[0, -angle, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, radius, 8]} />
        <meshStandardMaterial
          color={color1}
          emissive={color1}
          emissiveIntensity={isSelected ? 0.8 : 0.5}
        />
      </mesh>

      {/* Base Connector 2 */}
      <mesh position={[x2 / 2, y, z2 / 2]} rotation={[0, -angle, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, radius, 8]} />
        <meshStandardMaterial
          color={color2}
          emissive={color2}
          emissiveIntensity={isSelected ? 0.8 : 0.5}
        />
      </mesh>
    </group>
  );
};

export const DnaHelix: React.FC<
  DnaHelixProps & {
    onBaseClick?: (idx: number) => void;
    selectedIndex?: number | null;
  }
> = ({ sequence, onBaseClick, selectedIndex }) => {
  const { canvasReady } = useCanvasReady(150);
  const [remountKey, setRemountKey] = useState(0);
  const [isRecovering, setIsRecovering] = React.useState(false);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleLost = () => {
      console.warn(
        "DNA Helix: WebGL Context Lost. Performing silent recovery...",
      );
      setIsRecovering(true);
      setTimeout(() => {
        setRemountKey((prev) => prev + 1);
        setIsRecovering(false);
      }, 150);
    };
    window.addEventListener("mathlab-webgl-lost", handleLost);
    return () => window.removeEventListener("mathlab-webgl-lost", handleLost);
  }, []);

  return (
    <div
      ref={setContainer}
      className="w-full h-96 relative bg-obsidian-950/20 rounded-2xl border border-white/5 overflow-hidden group"
    >
      {isRecovering && (
        <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center backdrop-blur-sm animate-in fade-in">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">
              Stabilizing...
            </span>
          </div>
        </div>
      )}

      <div className="absolute top-4 left-4 z-10 pointer-events-none transition-opacity group-hover:opacity-100 opacity-40">
        <div className="text-[10px] font-mono text-emerald-500 uppercase tracking-[0.2em] font-black">
          Genomic Architecture
        </div>
      </div>

      {canvasReady && !isRecovering && (
        <WebGLErrorBoundary
          fallback={
            <div className="w-full h-96 bg-obsidian-900 rounded-2xl border border-white/10 flex items-center justify-center text-slate-500 text-xs font-mono uppercase tracking-widest">
              DNA Engine Offline
            </div>
          }
        >
          <Canvas
            eventSource={container as unknown as HTMLElement}
            key={remountKey}
            shadows
            dpr={1}
            gl={{
              antialias: false,
              powerPreference: "default",
              preserveDrawingBuffer: true,
            }}
            camera={{ position: [0, 0, 25], fov: 45 }}
            onCreated={({ gl }) => {
              if (gl?.domElement) {
                gl.domElement.addEventListener(
                  "webglcontextlost",
                  (event) => {
                    event.preventDefault();
                    window.dispatchEvent(new CustomEvent("mathlab-webgl-lost"));
                  },
                  false,
                );
              }
            }}
          >
            <PerspectiveCamera makeDefault position={[0, 0, 15]} />
            <SafeOrbitControls
              enableZoom={true}
              autoRotate={!selectedIndex}
              autoRotateSpeed={0.5}
            />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1.5} />
            <pointLight position={[-10, -10, -10]} intensity={0.5} />
            <Stars
              radius={100}
              depth={50}
              count={5000}
              factor={4}
              saturation={0}
              fade
              speed={1}
            />

            <Float
              speed={selectedIndex ? 0.5 : 2}
              rotationIntensity={selectedIndex ? 0.1 : 0.5}
              floatIntensity={0.5}
            >
              <group>
                {sequence.split("").map((base, i) => (
                  <NucleotidePair
                    key={i}
                    base={base}
                    index={i}
                    total={sequence.length}
                    onClick={onBaseClick || (() => { })}
                    isSelected={selectedIndex === i}
                  />
                ))}
              </group>
            </Float>
          </Canvas>
        </WebGLErrorBoundary>
      )}
    </div>
  );
};
