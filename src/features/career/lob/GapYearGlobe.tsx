import { SafeOrbitControls, SceneStabilizer } from "@features/threed-studio";
import { Stars } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { GAP_PROGRAMS, GapProgram } from "@shared/assets/data/gapYearData";
import { AnimatePresence, motion } from "framer-motion";
import { Globe, Info, MapPin, X } from "lucide-react";
import React, { useMemo, useRef, useState } from "react";
import * as THREE from "three";

// --- Globe Constants ---
const GLOBE_RADIUS = 5;

// --- Helper: Convert Lat/Lon to 3D Vector ---
const latLonToVector3 = (lat: number, lon: number, radius: number) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
};

// --- Hotspot Component ---
const GlobeHotspot = ({
  program,
  onSelect,
  selected,
}: {
  program: GapProgram;
  onSelect: (p: GapProgram) => void;
  selected: boolean;
}) => {
  const ref = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const position = useMemo(() => {
    if (!program.coordinates) return new THREE.Vector3(0, 0, 0);
    return latLonToVector3(
      program.coordinates[0],
      program.coordinates[1],
      GLOBE_RADIUS + 0.1,
    );
  }, [program]);

  useFrame((state) => {
    if (ref.current) {
      // Make label look at camera
      ref.current.lookAt(state.camera.position);

      // Pulsing Rings
      const scale = selected ? 1.5 : hovered ? 1.2 : 1;
      ref.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
    }
  });

  // Color logic (Neon)
  const color =
    program.visaDifficulty === "hard"
      ? "#ef4444"
      : program.visaDifficulty === "medium"
        ? "#f59e0b"
        : "#10b981";

  return (
    <group position={position} ref={ref}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onSelect(program);
        }}
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
          setHovered(true);
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
          setHovered(false);
        }}
      >
        {/* Core Dot */}
        <circleGeometry args={[0.08, 32]} />
        <meshBasicMaterial
          color={color}
          side={THREE.DoubleSide}
          toneMapped={false}
        />

        {/* Outer Glow Ring */}
        <mesh>
          <ringGeometry args={[0.12, 0.15, 32]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>

        {/* Pulsing Aura if Active */}
        {(hovered || selected) && (
          <mesh>
            <ringGeometry args={[0.2, 0.25, 32]} />
            <meshBasicMaterial
              color="white"
              transparent
              opacity={0.3}
              side={THREE.DoubleSide}
              toneMapped={false}
            />
          </mesh>
        )}
      </mesh>
    </group>
  );
};

// --- Atmosphere Shader Material ---
// Simple custom shader for atmospheric glow
const vertexShader = `
varying vec3 vNormal;
void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
const fragmentShader = `
varying vec3 vNormal;
void main() {
    float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 4.0);
    gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity * 1.5;
}
`;

// --- Main Globe Component ---
const GlobeModel = ({ onSelect }: { onSelect: (p: GapProgram) => void }) => {
  const globeRef = useRef<THREE.Mesh>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useFrame(() => {
    if (globeRef.current && !selectedId) {
      globeRef.current.rotation.y += 0.0008; // Smooth idle
    }
  });

  const handleSelect = (p: GapProgram) => {
    setSelectedId(p.id);
    onSelect(p);
  };

  return (
    <group>
      {/* The Main Sphere */}
      <mesh ref={globeRef}>
        <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
        <meshPhysicalMaterial
          color="#050510" // Deep space black/blue
          emissive="#101030"
          emissiveIntensity={0.5}
          roughness={0.4}
          metalness={0.6}
          clearcoat={0.3}
        />

        {/* Tech Grid Overlay */}
        <mesh scale={[1.001, 1.001, 1.001]}>
          <sphereGeometry args={[GLOBE_RADIUS, 32, 32]} />
          <meshBasicMaterial
            color="#3b82f6"
            wireframe
            transparent
            opacity={0.08}
          />
        </mesh>
      </mesh>

      {/* Atmospheric Glow (Shader) */}
      <mesh scale={[1.2, 1.2, 1.2]}>
        <sphereGeometry args={[GLOBE_RADIUS, 32, 32]} />
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          transparent
        />
      </mesh>

      {/* Lights */}
      <pointLight
        position={[-20, 10, 20]}
        intensity={2}
        color="#4f46e5"
        distance={100}
        decay={2}
      />
      <ambientLight intensity={0.1} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1.5}
        color="#60a5fa"
      />

      {/* Stars Background */}
      <Stars
        radius={100}
        depth={50}
        count={5000}
        factor={4}
        saturation={0}
        fade
        speed={1}
      />

      {/* Hotspots */}
      {GAP_PROGRAMS.filter((p) => p.coordinates).map((p) => (
        <GlobeHotspot
          key={p.id}
          program={p}
          onSelect={handleSelect}
          selected={selectedId === p.id}
        />
      ))}
    </group>
  );
};

// --- Container & UI ---
export const GapYearGlobe: React.FC = () => {
  const [selectedProgram, setSelectedProgram] = useState<GapProgram | null>(
    null,
  );
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[700px] bg-black rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(30,58,138,0.3)]"
    >
      {/* Background Gradient Fallback */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/20 to-black pointer-events-none" />

      {/* Header Overlay */}
      <div className="absolute top-8 left-8 z-10 pointer-events-none">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-2xl backdrop-blur-md">
            <Globe className="text-blue-400" size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight uppercase">
              Wereldkaart 2026
            </h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-emerald-400 text-xs font-bold tracking-widest uppercase">
                Live Data
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Legend - Elite Style */}
      <div className="absolute bottom-8 left-8 z-10">
        <div className="bg-black/60 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-2xl space-y-4 min-w-[240px]">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-white/10 pb-2 mb-2">
            Visum Complexiteit
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between group cursor-default">
              <div className="flex items-center gap-3 text-sm font-bold text-slate-300 group-hover:text-white transition-colors">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                Easy Access
              </div>
              <span className="text-[10px] text-emerald-500/80 font-mono">
                EU / None
              </span>
            </div>
            <div className="flex items-center justify-between group cursor-default">
              <div className="flex items-center gap-3 text-sm font-bold text-slate-300 group-hover:text-white transition-colors">
                <span className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                Documentation
              </div>
              <span className="text-[10px] text-amber-500/80 font-mono">
                Docs Req
              </span>
            </div>
            <div className="flex items-center justify-between group cursor-default">
              <div className="flex items-center gap-3 text-sm font-bold text-slate-300 group-hover:text-white transition-colors">
                <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                Strict Rules
              </div>
              <span className="text-[10px] text-red-500/80 font-mono">
                Quota/Age
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Info Card - Animated Glass Panel */}
      <AnimatePresence>
        {selectedProgram && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute right-8 top-8 bottom-8 z-20 w-96 pointer-events-none flex flex-col justify-center"
          >
            <div className="pointer-events-auto bg-black/80 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
              {/* Decorative Glow */}
              <div
                className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-[80px] opacity-40 transition-colors duration-500 ${selectedProgram.type === "travel" ? "bg-blue-500" : "bg-purple-500"}`}
              />

              <div className="relative z-10">
                <button
                  onClick={() => setSelectedProgram(null)}
                  className="absolute -top-2 -right-2 p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all"
                >
                  <X size={20} />
                </button>

                <div className="mb-6">
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border mb-3 ${selectedProgram.visaDifficulty === "hard" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}`}
                  >
                    {selectedProgram.visaDifficulty === "hard"
                      ? "Let op: Strict Visum"
                      : "Visum Vrij / Eenvoudig"}
                  </div>
                  <h3 className="text-3xl font-black text-white leading-tight mb-2">
                    {selectedProgram.title}
                  </h3>
                  <div className="text-blue-400 font-bold uppercase tracking-wide text-xs">
                    {selectedProgram.organization}
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">
                        Locatie
                      </div>
                      <div className="text-white font-bold">
                        {selectedProgram.locations.join(", ")}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400">
                      <Info size={18} />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">
                        Kosten Index
                      </div>
                      <div className="flex gap-1.5 mt-1">
                        {[1, 2, 3].map((i) => {
                          const active =
                            (selectedProgram.costIndex === "low" && i === 1) ||
                            (selectedProgram.costIndex === "medium" &&
                              i <= 2) ||
                            selectedProgram.costIndex === "high";
                          return (
                            <div
                              key={i}
                              className={`w-6 h-1.5 rounded-full transition-all duration-500 ${active ? "bg-gradient-to-r from-blue-400 to-cyan-400 shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-white/10"}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-slate-300 text-sm leading-relaxed mb-8">
                  {selectedProgram.description}
                </p>

                {selectedProgram.link && (
                  <a
                    href={selectedProgram.link}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center py-4 bg-white text-black font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] uppercase tracking-widest text-xs"
                  >
                    Bekijk Volledig Programma
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Canvas
        eventSource={containerRef as React.RefObject<HTMLElement>}
        camera={{ position: [0, 0, 14], fov: 40 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
      >
        <color attach="background" args={["#000000"]} />
        <fog attach="fog" args={["#000000", 10, 50]} />
        <SceneStabilizer />
        <SafeOrbitControls
          enableZoom={true}
          minDistance={8}
          maxDistance={25}
          enablePan={false}
          autoRotate={!selectedProgram}
          autoRotateSpeed={0.8}
          dampingFactor={0.05}
        />
        <GlobeModel onSelect={setSelectedProgram} />
      </Canvas>
    </div>
  );
};
