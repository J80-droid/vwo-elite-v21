/* eslint-disable react-hooks/purity */
/* eslint-disable react-refresh/only-export-components */
import { Stars } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useVoiceCoachContext } from "@shared/lib/contexts/VoiceCoachContext";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import * as THREE from "three";
import { create } from "zustand";

import { SafeOrbitControls } from "../threed-studio";

// --- State Management for Quantum Numbers ---
interface OrbitalState {
  n: number;
  l: number;
  m: number;
  showPhase: boolean;
  setN: (n: number) => void;
  setL: (l: number) => void;
  setM: (m: number) => void;
  togglePhase: () => void;
}

export const useOrbitalStore = create<OrbitalState>((set) => ({
  n: 1,
  l: 0,
  m: 0,
  showPhase: true,
  setN: (n) => set((s) => ({ n, l: Math.min(s.l, n - 1), m: 0 })),
  setL: (l) =>
    set((s) => ({ l, m: Math.min(Math.abs(s.m), l) * Math.sign(s.m) || 0 })),
  setM: (m) => set({ m }),
  togglePhase: () => set((s) => ({ showPhase: !s.showPhase })),
}));

// --- Math Helpers for Wavefunctions ---
const getWavefunction = (n: number, l: number, m: number) => {
  return (x: number, y: number, z: number) => {
    const r = Math.sqrt(x * x + y * y + z * z);
    const theta = Math.acos(z / (r || 0.0001));
    const phi = Math.atan2(y, x);

    let R = 0;
    if (n === 1 && l === 0) R = 2 * Math.exp(-r);
    else if (n === 2 && l === 0) R = (2 - r) * Math.exp(-r / 2);
    else if (n === 2 && l === 1) R = r * Math.exp(-r / 2);
    else if (n === 3 && l === 0)
      R = (27 - 18 * r + 2 * r * r) * Math.exp(-r / 3);
    else if (n === 3 && l === 1) R = (6 - r) * r * Math.exp(-r / 3);
    else if (n === 3 && l === 2) R = r * r * Math.exp(-r / 3);
    else R = Math.pow(r, l) * Math.exp(-r / n) * (1 - r / (n * 2));

    let Y = 0;
    if (l === 0) Y = 1 / Math.sqrt(4 * Math.PI);
    else if (l === 1) {
      if (m === 0) Y = Math.sqrt(3 / (4 * Math.PI)) * Math.cos(theta);
      else if (m === 1)
        Y = Math.sqrt(3 / (4 * Math.PI)) * Math.sin(theta) * Math.cos(phi);
      else if (m === -1)
        Y = Math.sqrt(3 / (4 * Math.PI)) * Math.sin(theta) * Math.sin(phi);
    } else if (l === 2) {
      if (m === 0)
        Y = Math.sqrt(5 / (16 * Math.PI)) * (3 * Math.cos(theta) ** 2 - 1);
      else if (m === 1)
        Y =
          Math.sqrt(15 / (4 * Math.PI)) *
          Math.sin(theta) *
          Math.cos(theta) *
          Math.cos(phi);
      else if (m === -1)
        Y =
          Math.sqrt(15 / (4 * Math.PI)) *
          Math.sin(theta) *
          Math.cos(theta) *
          Math.sin(phi);
      else if (m === 2)
        Y =
          Math.sqrt(15 / (16 * Math.PI)) *
          Math.sin(theta) ** 2 *
          Math.cos(2 * phi);
      else if (m === -2)
        Y =
          Math.sqrt(15 / (16 * Math.PI)) *
          Math.sin(theta) ** 2 *
          Math.sin(2 * phi);
    } else {
      Y = Math.pow(Math.sin(theta), l) * Math.cos(m * phi);
    }
    return R * Y;
  };
};

const OrbitalCloud: React.FC<{
  n: number;
  l: number;
  m: number;
  showPhase: boolean;
}> = ({ n, l, m, showPhase }) => {
  const points = useMemo(() => {
    const psi = getWavefunction(n, l, m);
    const pts: number[] = [];
    const colors: number[] = [];
    const count = 30000;
    const bound = 5 + n * 4;

    for (let i = 0; i < count; i++) {
      let x, y, z, p, prob;
      let attempts = 0;
      do {
        x = (Math.random() - 0.5) * 2 * bound;
        y = (Math.random() - 0.5) * 2 * bound;
        z = (Math.random() - 0.5) * 2 * bound;
        const val = psi(x, y, z);
        prob = val * val;
        const maxProb = 0.2 / (n * n);
        p = Math.random() * maxProb;

        if (p < prob) {
          pts.push(x, y, z);
          if (showPhase) {
            if (val > 0) colors.push(0.2, 0.6, 1);
            else colors.push(1, 0.4, 0.4);
          } else {
            const intensity = Math.min(1, prob * 50);
            colors.push(intensity, intensity, 1);
          }
          break;
        }
        attempts++;
      } while (attempts < 50);
    }
    return {
      positions: new Float32Array(pts),
      colors: new Float32Array(colors),
    };
  }, [n, l, m, showPhase]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[points.positions, 3]}
        />
        <bufferAttribute attach="attributes-color" args={[points.colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export const OrbitalVisualizer: React.FC<{
  n: number;
  l: number;
  m: number;
  showPhase?: boolean;
}> = ({ n, l, m, showPhase = true }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  return (
    <div ref={containerRef} className="w-full h-full">
      <Canvas
        eventSource={
          containerRef as React.RefObject<HTMLElement> as unknown as HTMLElement
        }
        camera={{ position: [5 + n * 2, 5 + n * 2, 5 + n * 2], fov: 45 }}
      >
        <color attach="background" args={["#000000"]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={2} />
        <OrbitalCloud n={n} l={l} m={m} showPhase={showPhase} />
        <SafeOrbitControls
          autoRotate
          autoRotateSpeed={0.5}
          enableZoom={true}
          makeDefault
        />
      </Canvas>
    </div>
  );
};

export const OrbitalSim: React.FC<{ mode?: "sidebar" | "main" }> = ({
  mode,
}) => {
  const { t } = useTranslation("chemistry");
  const { n, l, m, setN, showPhase } = useOrbitalStore();
  const containerRef = React.useRef<HTMLDivElement>(null);

  useVoiceCoachContext(
    "ChemistryLab",
    `Analyse van de kwantumtoestand n=${n}, l=${l}, m=${m}. Dit beschrijft de waarschijnlijkheidsverdeling van een elektron.`,
    { activeModule: "orbitals", n, l, m },
  );

  if (mode === "sidebar") {
    // ... (keep sidebar logic implies we don't modify it here)

    return (
      <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-left-4 duration-500 overflow-y-auto custom-scrollbar h-full pb-20 px-1">
        {/* ... */}
        {/* We are only replacing the top part so we need to be careful with cutoff */}
        <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-4">
            {t("periodic_table.quantum_n")}
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="5"
              value={n}
              onChange={(e) => setN(parseInt(e.target.value))}
              className="flex-1 accent-cyan-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-2xl font-mono text-cyan-400 font-bold w-8">
              {n}
            </span>
          </div>
        </div>
        {/* ... Rest of sidebar ... */}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full relative bg-black">
      {/* Watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none select-none z-0">
        <h1 className="text-[12rem] font-black tracking-tighter text-white">
          VWO ELITE
        </h1>
      </div>

      <Canvas
        eventSource={
          containerRef as React.RefObject<HTMLElement> as unknown as HTMLElement
        }
        camera={{ position: [5 + n * 2, 5 + n * 2, 5 + n * 2], fov: 45 }}
      >
        <color attach="background" args={["#000"]} />
        <Stars
          radius={100}
          depth={50}
          count={2000}
          factor={4}
          saturation={0}
          fade
          speed={1}
        />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={2} />
        <OrbitalCloud n={n} l={l} m={m} showPhase={showPhase} />
        <SafeOrbitControls autoRotate autoRotateSpeed={0.5} makeDefault />
      </Canvas>

      <div className="absolute bottom-10 left-10 pointer-events-none group">
        <div className="text-6xl font-black text-white/5 font-mono select-none group-hover:text-cyan-500/10 transition-colors duration-1000">
          ψ({n},{l},{m})
        </div>
      </div>
    </div>
  );
};
