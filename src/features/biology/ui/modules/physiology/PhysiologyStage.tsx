import { SafeOrbitControls, SceneStabilizer } from "@features/threed-studio";
import {
  ContactShadows,
  Float,
  PerspectiveCamera,
  Stars,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useTranslations } from "@shared/hooks/useTranslations";
import { Heart } from "lucide-react";
import React, { useRef } from "react";

import { useModuleState } from "../../../hooks/useBiologyLabContext";
import { defaultPhysiologyState, PhysiologyState } from "../../../types";

// HumanBody component
const HumanBody = ({
  activeSystem,
  heartRate: _heartRate,
}: {
  activeSystem: string | null;
  heartRate: number;
}) => {
  return (
    <group>
      <mesh>
        <capsuleGeometry args={[1, 3, 4, 16]} />
        <meshStandardMaterial color="#3b82f6" transparent opacity={0.3} />
      </mesh>
      {/* Visual representation based on system */}
      {activeSystem === "circulatory" && (
        <mesh position={[0, 0.5, 0]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial
            color="#ef4444"
            emissive="#ef4444"
            emissiveIntensity={0.5}
          />
        </mesh>
      )}
    </group>
  );
};

export const PhysiologyStage: React.FC = () => {
  const [state] = useModuleState<PhysiologyState>(
    "physiology",
    defaultPhysiologyState,
  );
  const { t } = useTranslations();
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className="h-full w-full relative bg-obsidian-950 overflow-hidden"
    >
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
        <div className="text-[10px] font-mono text-red-500 uppercase tracking-[0.2em] font-black mb-1">
          {t("biology.physiology.stage.subtitle")}
        </div>
        <div className="text-2xl font-black text-white uppercase tracking-tighter">
          {state.activeSystem
            ? `${state.activeSystem.charAt(0).toUpperCase() + state.activeSystem.slice(1)} System`
            : t("biology.physiology.stage.select_system")}
        </div>
      </div>

      {}
      <Canvas
        eventSource={containerRef as React.RefObject<HTMLElement>}
        shadows
        gl={{ antialias: true }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={45} />
        <SceneStabilizer />
        <SafeOrbitControls enablePan={true} />
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

        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.2}>
          <HumanBody
            activeSystem={state.activeSystem}
            heartRate={state.heartRate}
          />
        </Float>

        <ContactShadows
          position={[0, -4, 0]}
          opacity={0.4}
          scale={10}
          blur={2.5}
          far={4}
        />
      </Canvas>

      {/* Biometric HUD Overlay */}
      <div className="absolute top-24 left-6 z-10 space-y-4">
        <div className="bg-black/40 backdrop-blur-md border border-white/5 p-3 rounded-lg flex items-center gap-4">
          <Heart className="text-red-500 animate-pulse" size={20} />
          <div>
            <div className="text-[8px] font-black text-slate-500 uppercase">
              {t("biology.physiology.stage.heart_rate")}
            </div>
            <div className="text-lg font-mono font-bold text-white tabular-nums">
              {state.heartRate}{" "}
              <span className="text-[10px] text-slate-400">BPM</span>
            </div>
          </div>
        </div>
      </div>

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]" />
    </div>
  );
};
