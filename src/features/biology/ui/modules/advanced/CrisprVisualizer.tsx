import { SafeOrbitControls, SceneStabilizer } from "@features/threed-studio";
import { Float, PerspectiveCamera, Stars } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Scissors, ShieldCheck, Zap } from "lucide-react";
import React, { useRef, useState } from "react";
import * as THREE from "three";

const DnaSegment = ({
  position,
  active,
  cutIndex,
}: {
  position: [number, number, number];
  active: boolean;
  cutIndex: number;
}) => {
  const sequence = "ATCGATCGATCG".split("");
  const helixRadius = 1;
  const helixStep = 0.4;

  return (
    <group position={position}>
      {sequence.map((base, i) => {
        const angle = i * 0.5;
        const x = Math.cos(angle) * helixRadius;
        const z = Math.sin(angle) * helixRadius;
        const y = i * helixStep - (sequence.length * helixStep) / 2;

        // If cut, move fragments apart
        const cutOffset = active && i > cutIndex ? 2 : 0;

        return (
          <group key={i} position={[0, y + cutOffset, 0]}>
            <mesh position={[x, 0, z]}>
              <boxGeometry args={[0.3, 0.1, 0.3]} />
              <meshStandardMaterial
                color={
                  base === "A"
                    ? "#ef4444"
                    : base === "T"
                      ? "#3b82f6"
                      : base === "C"
                        ? "#22c55e"
                        : "#eab308"
                }
              />
            </mesh>
            <mesh position={[-x, 0, -z]}>
              <boxGeometry args={[0.3, 0.1, 0.3]} />
              <meshStandardMaterial
                color={
                  base === "A"
                    ? "#3b82f6"
                    : base === "T"
                      ? "#ef4444"
                      : base === "C"
                        ? "#eab308"
                        : "#22c55e"
                }
              />
            </mesh>
            {/* Hydrogen bond */}
            {(!active || i !== cutIndex) && (
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.02, 0.02, x * 2]} />
                <meshStandardMaterial color="white" transparent opacity={0.3} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
};

const Cas9Enzyme = ({ active }: { active: boolean }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    if (active) {
      meshRef.current.position.y = Math.sin(t * 2) * 0.2;
    } else {
      meshRef.current.position.y = 5 + Math.sin(t) * 0.5;
    }
  });

  return (
    <mesh ref={meshRef}>
      <torusGeometry args={[1.5, 0.4, 16, 100]} />
      <meshStandardMaterial
        color="#7c3aed"
        emissive="#7c3aed"
        emissiveIntensity={0.5}
        transparent
        opacity={0.7}
      />
    </mesh>
  );
};

export const CrisprVisualizer: React.FC = () => {
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState("STANDBY");
  const containerRef = useRef<HTMLDivElement>(null);

  const handleCut = () => {
    setStatus("SCANNING...");
    setTimeout(() => {
      setStatus("TARGET FOUND!");
      setTimeout(() => {
        setActive(true);
        setStatus("GENE EDIT COMPLETE");
      }, 1500);
    }, 2000);
  };

  return (
    <div
      ref={containerRef}
      className="h-full w-full relative bg-obsidian-950 rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
    >
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
        <div className="text-[10px] font-mono text-purple-400 uppercase tracking-[0.2em] font-black mb-1">
          Gene Editing Simulation
        </div>
        <div className="text-2xl font-black text-white uppercase tracking-tighter">
          CRISPR-Cas9 Visualisator
        </div>
      </div>

      <div className="absolute top-6 right-6 z-10 flex flex-col items-end gap-2">
        <div
          className={`px-3 py-1 rounded-full text-[10px] font-black border transition-colors ${active ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "bg-purple-500/20 border-purple-500/50 text-purple-400"}`}
        >
          STATUS: {status}
        </div>
        <button
          onClick={handleCut}
          disabled={active || status !== "STANDBY"}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all ${active ? "bg-emerald-600 text-white cursor-not-allowed" : "bg-purple-600 hover:bg-purple-500 text-white hover:scale-105 active:scale-95 shadow-lg shadow-purple-600/30"}`}
        >
          {active ? <ShieldCheck size={16} /> : <Scissors size={16} />}
          {active ? "SEQUENTIE AANGEPAST" : "START GEN-EDITING"}
        </button>
      </div>

      <Canvas
        eventSource={containerRef as React.RefObject<HTMLElement>}
        shadows
      >
        <SceneStabilizer />
        <PerspectiveCamera makeDefault position={[8, 5, 8]} fov={40} />
        <SafeOrbitControls enablePan={false} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        <Stars
          radius={100}
          depth={50}
          count={5000}
          factor={4}
          saturation={0}
          fade
          speed={1}
        />

        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <DnaSegment position={[0, 0, 0]} active={active} cutIndex={5} />
          <Cas9Enzyme active={status !== "STANDBY"} />
        </Float>
      </Canvas>

      <div className="absolute bottom-6 left-6 right-6 z-10 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-4 flex items-start gap-4">
        <div className="p-2 bg-purple-500/20 rounded-lg">
          <Zap className="text-purple-400" size={20} />
        </div>
        <div>
          <h4 className="text-xs font-black text-white uppercase mb-1 tracking-wider">
            Hoe het werkt
          </h4>
          <p className="text-[10px] text-slate-400 leading-relaxed max-w-xl">
            Het Cas9-eiwit (paarse torus) gebruikt een gids-RNA om een
            specifieke DNA-sequentie te vinden. Eenmaal gevonden, fungeert het
            als een "moleculaire schaar" die beide strengen van het DNA
            doorknipt, waardoor het gen wordt uitgeschakeld of kan worden
            aangepast.
          </p>
        </div>
      </div>
    </div>
  );
};
