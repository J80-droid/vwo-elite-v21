/* eslint-disable react-hooks/exhaustive-deps */
import { SafeOrbitControls, SceneStabilizer } from "@features/threed-studio";
import { Grid, PerspectiveCamera, Stars } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useTranslations } from "@shared/hooks/useTranslations";
import React, { useMemo, useRef } from "react";
import * as THREE from "three";

import { useModuleState } from "../../../hooks/useBiologyLabContext";
import { defaultEcologyState, EcologyState } from "../../../types";

const Entity = ({
  position,
  color,
  size,
  type,
}: {
  position: [number, number, number];
  color: string;
  size: number;
  type: "prey" | "predator";
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    meshRef.current.position.y += Math.sin(t + position[0]) * 0.005;
    if (type === "predator") {
      meshRef.current.rotation.y += 0.05;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      {type === "predator" ? (
        <octahedronGeometry args={[size]} />
      ) : (
        <sphereGeometry args={[size, 16, 16]} />
      )}
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.5}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
};

const SimulationEngine = () => {
  const [state, setState] = useModuleState<EcologyState>(
    "ecology",
    defaultEcologyState,
  );

  // Update simulation
  useFrame((_, delta) => {
    const alpha = state.growthRatePrey;
    const beta = state.consumptionRate;
    const gamma = state.mortalityRatePredator;
    const delta_lv = state.growthRatePredator;
    const K = state.carryingCapacity;

    const x = state.preyCount;
    const y = state.predatorCount;

    // Logistic growth for prey (with carrying capacity)
    const dx = alpha * x * (1 - x / K) - beta * x * y;
    const dy = delta_lv * x * y - gamma * y;

    const newX = Math.max(0, x + dx * delta * 5);
    const newY = Math.max(0, y + dy * delta * 5);

    // Slow updates to prevent jitter
    if (Math.abs(newX - x) > 0.01 || Math.abs(newY - y) > 0.01) {
      setState((prev) => ({
        ...prev,
        preyCount: newX,
        predatorCount: newY,
      }));
    }
  });

  return null;
};

export const EcologyStage: React.FC = () => {
  const [state] = useModuleState<EcologyState>("ecology", defaultEcologyState);
  const { t } = useTranslations();
  const containerRef = useRef<HTMLDivElement>(null);

  const preyEntities = useMemo(() => {
    return [...Array(Math.min(200, Math.floor(state.preyCount)))].map(
      (_, i) => ({
        id: i,
        position: [
          (Math.random() - 0.5) * 20,
          0.2,
          (Math.random() - 0.5) * 20,
        ] as [number, number, number],
      }),
    );
  }, [Math.floor(state.preyCount / 10)]); // Only update list occasionally

  const predatorEntities = useMemo(() => {
    return [...Array(Math.min(50, Math.floor(state.predatorCount)))].map(
      (_, i) => ({
        id: i,
        position: [
          (Math.random() - 0.5) * 20,
          0.5,
          (Math.random() - 0.5) * 20,
        ] as [number, number, number],
      }),
    );
  }, [Math.floor(state.predatorCount / 2)]);

  return (
    <div ref={containerRef} className="h-full w-full relative bg-obsidian-950">
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
        <div className="text-[10px] font-mono text-emerald-500 uppercase tracking-[0.2em] font-black mb-1">
          {t("biology.ecology.stage.subtitle")}
        </div>
        <div className="text-2xl font-black text-white uppercase tracking-tighter">
          {t("biology.ecology.stage.title")}
        </div>
      </div>

      <Canvas
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        eventSource={containerRef as any}
        shadows
        gl={{ antialias: true }}
      >
        <SimulationEngine />
        <PerspectiveCamera makeDefault position={[15, 15, 15]} fov={45} />
        <SceneStabilizer />
        <SafeOrbitControls enablePan={true} />
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 20, 10]} intensity={1.5} />
        <Stars
          radius={100}
          depth={50}
          count={5000}
          factor={4}
          saturation={0}
          fade
          speed={1}
        />

        <Grid
          infiniteGrid
          fadeDistance={30}
          cellColor="#10b981"
          sectionColor="#059669"
          sectionThickness={1.5}
          cellSize={1}
          sectionSize={5}
        />

        <group>
          {preyEntities.map((e) => (
            <Entity
              key={`prey-${e.id}`}
              position={e.position}
              color="#10b981"
              size={0.15}
              type="prey"
            />
          ))}
          {predatorEntities.map((e) => (
            <Entity
              key={`pred-${e.id}`}
              position={e.position}
              color="#ef4444"
              size={0.25}
              type="predator"
            />
          ))}
        </group>
      </Canvas>

      <div className="absolute bottom-6 right-6 z-10 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {t("biology.ecology.analysis.prey")} (x):{" "}
              <span className="text-white font-mono ml-2">
                {state.preyCount.toFixed(0)}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-red-500 rotate-45" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {t("biology.ecology.analysis.predator")} (y):{" "}
              <span className="text-white font-mono ml-2">
                {state.predatorCount.toFixed(0)}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
