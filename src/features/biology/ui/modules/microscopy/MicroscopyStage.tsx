import { SafeOrbitControls, SceneStabilizer } from "@features/threed-studio";
import {
  ContactShadows,
  Float,
  PerspectiveCamera,
  Stars,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useTranslations } from "@shared/hooks/useTranslations";
import { Info } from "lucide-react";
import React, { useRef } from "react";

import { useModuleState } from "../../../hooks/useBiologyLabContext";
import { defaultMicroscopyState, MicroscopyState } from "../../../types";

const PlantCell = ({ zoom }: { zoom: number }) => {
  return (
    <group scale={zoom / 40}>
      {/* Cell Wall */}
      <mesh>
        <boxGeometry args={[4, 5, 4]} />
        <meshStandardMaterial
          color="#22c55e"
          transparent
          opacity={0.3}
          wireframe
        />
      </mesh>
      <mesh>
        <boxGeometry args={[3.8, 4.8, 3.8]} />
        <meshStandardMaterial color="#14532d" transparent opacity={0.1} />
      </mesh>

      {/* Large Vacuole */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2, 3, 2]} />
        <meshStandardMaterial
          color="#60a5fa"
          transparent
          opacity={0.4}
          roughness={0.1}
        />
      </mesh>

      {/* Nucleus */}
      <mesh position={[1, 1.5, 1]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color="#7c3aed"
          emissive="#7c3aed"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Chloroplasts */}
      {[...Array(8)].map((_, i) => (
        <mesh
          key={i}
          position={[Math.cos(i) * 1.5, (i - 4) * 0.5, Math.sin(i) * 1.5]}
        >
          <capsuleGeometry args={[0.2, 0.4, 4, 8]} />
          <meshStandardMaterial color="#4ade80" />
        </mesh>
      ))}
    </group>
  );
};

const AnimalCell = ({ zoom }: { zoom: number }) => {
  return (
    <group scale={zoom / 40}>
      {/* Cell Membrane */}
      <mesh>
        <sphereGeometry args={[2.5, 32, 32]} />
        <meshStandardMaterial color="#f472b6" transparent opacity={0.2} />
      </mesh>
      <mesh>
        <sphereGeometry args={[2.5, 32, 32]} />
        <meshStandardMaterial
          color="#f472b6"
          wireframe
          opacity={0.1}
          transparent
        />
      </mesh>

      {/* Nucleus */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial
          color="#7c3aed"
          emissive="#7c3aed"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Mitochondria */}
      {[...Array(5)].map((_, i) => (
        <mesh
          key={i}
          position={[
            Math.cos(i * 1.5) * 1.5,
            Math.sin(i * 2) * 1.2,
            Math.cos(i * 0.5) * 1.5,
          ]}
          rotation={[Math.sin(i * 2.5), Math.cos(i * 3.1), 0]}
        >
          <capsuleGeometry args={[0.15, 0.3, 4, 8]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
      ))}
    </group>
  );
};

export const MicroscopyStage: React.FC = () => {
  const [state] = useModuleState<MicroscopyState>(
    "microscopy",
    defaultMicroscopyState,
  );
  const { t } = useTranslations();
  const containerRef = useRef<HTMLDivElement>(null);

  const getSpecimenTitle = () => {
    if (state.selectedSlide === "plant")
      return t("biology.microscopy.stage.plant_cell");
    if (state.selectedSlide === "animal")
      return t("biology.microscopy.stage.animal_cell");
    return t("biology.microscopy.stage.select_specimen");
  };

  const getSpecimenDescription = () => {
    if (state.selectedSlide === "plant")
      return t("biology.microscopy.stage.plant_description");
    if (state.selectedSlide === "animal")
      return t("biology.microscopy.stage.animal_description");
    return t("biology.microscopy.stage.no_specimen");
  };

  return (
    <div
      ref={containerRef}
      className="h-full w-full relative bg-obsidian-950 group"
    >
      {/* HUD Overlays */}
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
        <div className="text-[10px] font-mono text-blue-500 uppercase tracking-[0.2em] font-black mb-1">
          {t("biology.microscopy.stage.subtitle")}
        </div>
        <div className="text-2xl font-black text-white uppercase tracking-tighter">
          {getSpecimenTitle()}
        </div>
      </div>

      <div className="absolute top-6 right-6 z-10 hidden group-hover:block transition-all animate-in fade-in slide-in-from-right-4">
        <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-4 w-64 shadow-2xl">
          <h4 className="text-[10px] font-black text-blue-400 uppercase mb-2 flex items-center gap-2">
            <Info size={12} /> {t("biology.microscopy.stage.specimen_info")}
          </h4>
          <p className="text-[11px] text-slate-300 leading-relaxed font-outfit">
            {getSpecimenDescription()}
          </p>
        </div>
      </div>

      {/* Controls Preview */}
      <div className="absolute bottom-6 left-6 z-10">
        <div className="flex gap-4">
          <div className="bg-black/40 backdrop-blur p-2 rounded border border-white/5 text-[9px] font-mono text-slate-500">
            {t("biology.microscopy.stage.magnification")}:{" "}
            <span className="text-blue-400 font-bold">{state.zoom}X</span>
          </div>
          <div className="bg-black/40 backdrop-blur p-2 rounded border border-white/5 text-[9px] font-mono text-slate-500">
            {t("biology.microscopy.stage.light")}:{" "}
            <span className="text-blue-400 font-bold">{state.brightness}%</span>
          </div>
        </div>
      </div>

      <Canvas
        eventSource={containerRef as React.RefObject<HTMLElement>}
        shadows
        gl={{ antialias: true }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={45} />
        <SceneStabilizer />
        <SafeOrbitControls
          enablePan={true}
          enableZoom={false}
          autoRotate={!state.selectedSlide}
          autoRotateSpeed={0.5}
        />
        <ambientLight intensity={(state.brightness / 100) * 0.5 + 0.1} />
        <pointLight
          position={[10, 10, 10]}
          intensity={(state.brightness / 100) * 2}
        />
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
          {state.selectedSlide === "plant" && <PlantCell zoom={state.zoom} />}
          {state.selectedSlide === "animal" && <AnimalCell zoom={state.zoom} />}
        </Float>

        <ContactShadows
          position={[0, -4, 0]}
          opacity={0.4}
          scale={10}
          blur={2.5}
          far={4}
        />
      </Canvas>

      {/* Vignette Effect */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]" />
      <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/10" />

      {/* Grid Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#fff 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />
    </div>
  );
};
