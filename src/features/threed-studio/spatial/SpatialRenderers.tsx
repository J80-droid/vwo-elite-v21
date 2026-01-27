/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Environment, Html, PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { CheckCircle2, Rotate3D, RotateCcw } from "lucide-react";
import React, { Suspense, useEffect, useState } from "react";
import * as THREE from "three";

import { StructureOption, TrainingModule } from "../types";
import { SafeOrbitControls } from "../ui/SafeOrbitControls";
import { CubeNet3D } from "./components/CubeNet3D";
// Physics components moved to lazy imports below
import { FoldablePaper } from "./components/FoldablePaper";
import { Belt, Gear } from "./components/MechanicalComponents";
import { Shape } from "./components/Shape";

// Lazy load Physics engine and its components
const Physics = React.lazy(() =>
  import("@react-three/cannon").then((mod) => ({ default: mod.Physics })),
);
const PhysicsBlock = React.lazy(() =>
  import("./components/PhysicsComponents").then((mod) => ({
    default: mod.PhysicsBlock,
  })),
);
const Floor = React.lazy(() =>
  import("./components/PhysicsComponents").then((mod) => ({
    default: mod.Floor,
  })),
);

interface OptionCardProps {
  option: StructureOption;
  index: number;
  round: number;
  activeModule: TrainingModule;
  feedback: "correct" | "wrong" | null;
  correctIndex: number;
  handleGuess?: (i: number) => void;
  color: string;
  isSelected: boolean;
  onSelect?: (i: number) => void;
  revealed: boolean;
  onInvestigate?: (index: number) => void;
}

export const OptionCard = ({
  option,
  index,
  activeModule,
  feedback,
  correctIndex,
  handleGuess: _handleGuess,
  color,
  isSelected,
  onSelect,
  revealed,
  onInvestigate,
}: OptionCardProps) => {
  // Visual State Logic
  const isCorrect = index === correctIndex;

  const handleClick = () => {
    if (feedback === "wrong" && isCorrect && !revealed) {
      onInvestigate && onInvestigate(index);
    } else if (!feedback && onSelect) {
      onSelect(index);
    }
  };

  // Style classes
  let wrapperClass = `relative transition-all duration-300 rounded-3xl overflow-hidden bg-slate-900/40 backdrop-blur-md flex flex-col cursor-pointer group h-full border border-white/5 `;
  if (isSelected && !feedback)
    wrapperClass +=
      "ring-2 ring-sky-500 border-sky-500/50 bg-sky-500/10 shadow-[0_0_30px_rgba(14,165,233,0.15)] ";
  if (feedback === "correct" && isCorrect)
    wrapperClass +=
      "ring-2 ring-emerald-500 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)] ";
  if (feedback === "wrong" && isSelected)
    wrapperClass += "ring-2 ring-red-500 bg-red-500/10 border-red-500/20 ";
  if (feedback === "wrong" && isCorrect && !revealed)
    wrapperClass +=
      "ring-2 ring-emerald-500/50 border-emerald-500/30 opacity-60 ";
  if (feedback === "wrong" && isCorrect && revealed)
    wrapperClass +=
      "ring-2 ring-emerald-500 border-emerald-500 shadow-2xl z-30 ";
  if (feedback && !isCorrect && !isSelected)
    wrapperClass += "opacity-30 grayscale pointer-events-none ";
  if (!feedback && !isSelected)
    wrapperClass += "hover:bg-slate-800/60 hover:border-white/20 ";

  const [mounted, setMounted] = useState(false);
  const [physicsReady, setPhysicsReady] = useState(false);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
    // Delay Physics initialization to ensure DOM and WebGL context are ready
    const timer = setTimeout(() => setPhysicsReady(true), 200);
    return () => clearTimeout(timer);
  }, []);

  if (!option)
    return <div className="bg-white/5 rounded-xl animate-pulse h-full" />;

  return (
    <div
      onClick={handleClick}
      className={wrapperClass}
      style={{
        borderLeft: `2px solid ${color}`,
        boxShadow:
          feedback === "correct" && isCorrect
            ? `0 20px 40px -10px ${color}15`
            : "none",
      }}
    >
      {/* Label */}
      <span
        className="absolute top-5 left-5 z-20 font-bold w-10 h-10 flex items-center justify-center rounded-xl text-sm border backdrop-blur-xl shadow-2xl transition-all duration-300 group-hover:scale-110"
        style={{
          backgroundColor: "rgba(15, 23, 42, 0.8)",
          color: color,
          borderColor: `${color}30`,
        }}
      >
        {String.fromCharCode(65 + index)}
      </span>

      {/* Answer Overlay */}
      {feedback === "wrong" && isCorrect && !revealed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-slate-950/30 backdrop-blur-[2px]">
          <span className="text-emerald-400 font-bold text-sm tracking-widest uppercase bg-slate-900/90 px-5 py-2.5 rounded-full border border-emerald-500/30 shadow-2xl mb-3">
            ✓ Oplossing
          </span>
          <span className="text-emerald-300/80 text-xs bg-slate-900/80 px-3 py-1.5 rounded-full border border-emerald-500/20">
            Klik om te onderzoeken
          </span>
        </div>
      )}

      {/* Educational Feedback Overlay - Focused on error analysis for wrong options */}
      {((feedback && isSelected) || (revealed && isCorrect)) &&
        !isCorrect &&
        option.explanation && (
          <div className="absolute bottom-4 left-4 right-4 z-[60] p-4 bg-slate-950/95 backdrop-blur-xl border border-rose-500/30 rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-300 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
            <p className="text-xs md:text-sm font-bold leading-relaxed text-center text-rose-400">
              {option.explanation}
            </p>
          </div>
        )}

      {/* Solution Prompt - High visibility when user is wrong */}
      {feedback === "wrong" && isCorrect && !revealed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-slate-950/20 backdrop-blur-[1px] animate-in fade-in duration-500">
          <div className="bg-emerald-500 text-slate-950 font-black text-[10px] px-3 py-1 rounded-md mb-2 animate-pulse uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.4)]">
            Dit is het antwoord
          </div>
          <div className="bg-slate-900/90 border border-emerald-500/30 px-4 py-2 rounded-xl flex items-center gap-2 shadow-2xl group/btn hover:scale-105 transition-transform cursor-pointer">
            <Rotate3D
              size={14}
              className="text-emerald-400 animate-spin-slow"
            />
            <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
              Bekijk animatie
            </span>
          </div>
        </div>
      )}

      {/* Subtle solution tag for correct card - keeps the center clear for animation */}
      {((feedback && isSelected) || revealed) && isCorrect && (
        <div className="absolute inset-x-0 bottom-4 flex flex-col items-center gap-2 z-[60] pointer-events-none">
          <div className="px-4 py-1.5 bg-emerald-500/10 backdrop-blur-md border border-emerald-500/30 rounded-full animate-in fade-in slide-in-from-bottom-2 duration-500 shadow-lg flex items-center gap-2">
            <CheckCircle2 size={12} className="text-emerald-400" />
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] whitespace-nowrap">
              Correcte Vorm
            </span>
          </div>
          <div className="flex items-center gap-2 text-[9px] font-bold text-white/40 uppercase tracking-widest animate-pulse">
            <Rotate3D size={10} /> Sleep om te draaien
          </div>
        </div>
      )}

      <div ref={setContainer} className="flex-1 w-full relative min-h-0">
        {mounted && container && (
          <Canvas
            eventSource={container}
            // Use a stable key that is unique per option but doesn't change on interaction
            key={`canvas-${index}`}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: "high-performance",
              preserveDrawingBuffer: true,
            }}
          >
            <Suspense fallback={null}>
              <PerspectiveCamera makeDefault position={[0, 0, 9]} />
              <ambientLight intensity={1.5} />
              <pointLight position={[5, 5, 5]} intensity={2} />
              <pointLight position={[-5, -5, 5]} intensity={1} />
              <Environment preset="sunset" />

              {/* 2D HTML Overlays - Reduced to only essential UI text */}
              {option.twoDData && (
                <Html position={[0, 0, 0]} center>
                  <>
                    {activeModule === "folding" && (
                      <div className="flex flex-col items-center gap-2 mt-40">
                        <span className="text-[12px] font-black text-white/30 uppercase tracking-[0.4em]">
                          Resultaat
                        </span>
                      </div>
                    )}
                    {activeModule === "counting" &&
                      option.twoDData.count !== undefined && (
                        <div className="bg-obsidian-900/90 border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-xl">
                          <div className="text-center">
                            <span
                              className="text-5xl font-black"
                              style={{ color }}
                            >
                              {option.twoDData.count}
                            </span>
                            <div className="text-xs text-slate-400 mt-2">
                              blokken
                            </div>
                          </div>
                        </div>
                      )}
                  </>
                </Html>
              )}

              {/* 3D Content Dispatcher */}
              {(() => {
                // 1. Folding Module (Needs 3D even if it has twoDData for labels)
                if (activeModule === "folding" && option.twoDData?.punches) {
                  return (
                    <group scale={0.9}>
                      <FoldablePaper
                        folds={[]}
                        punches={option.twoDData.punches}
                        flat
                      />
                    </group>
                  );
                }

                // 2. Stability Module (Physics)
                if (activeModule === "stability" && option.tower) {
                  return (
                    <Physics gravity={[0, -9.81, 0]}>
                      <group scale={0.5} position={[0, -1, 0]}>
                        <Floor />
                        {option.tower.map((b: any, bi: number) => (
                          <PhysicsBlock
                            key={bi}
                            position={[b.x, b.y, b.z]}
                            args={[b.w, b.h, b.d]}
                            color={b.w === 2 ? "#333" : color}
                            active={!!(feedback && physicsReady)}
                            mass={b.mass}
                          />
                        ))}
                      </group>
                    </Physics>
                  );
                }

                // 3. Net Module (Cube Folding)
                if (activeModule === "nets" && option.twoDData?.net) {
                  return (
                    <CubeNet3D
                      net={option.twoDData.net}
                      isFolding={!!(revealed || (feedback && isSelected))}
                      color={color}
                      scale={1.4}
                    />
                  );
                }

                // 3. Cross-Section Module (3D Shapes)
                if (
                  activeModule === "cross-section" &&
                  option.twoDData?.shape
                ) {
                  const shape = option.twoDData.shape;
                  return (
                    <group scale={1.2} rotation={[0, 0, 0]}>
                      <mesh>
                        {shape === "Cirkel" && (
                          <circleGeometry args={[0.8, 32]} />
                        )}
                        {(shape === "Vierkant" || shape === "Rechthoek") && (
                          <planeGeometry args={[1.5, 1]} />
                        )}
                        {shape === "Driehoek" && (
                          <circleGeometry args={[0.8, 3, Math.PI]} />
                        )}{" "}
                        {/* Triangle approx */}
                        {shape === "Hexagon" && (
                          <circleGeometry args={[0.8, 6]} />
                        )}
                        {shape === "Ellips" && (
                          <circleGeometry
                            args={[0.8, 32]}
                            scale={[1.5, 0.8, 1]}
                          />
                        )}
                        <meshStandardMaterial
                          color={color}
                          side={THREE.DoubleSide}
                          transparent
                          opacity={0.9}
                        />
                      </mesh>
                      {/* Text Label */}
                      <Html position={[0, -1.5, 0]} center transform>
                        <div className="text-white text-xs font-bold uppercase tracking-wider whitespace-nowrap bg-black/50 px-2 py-1 rounded">
                          {shape}
                        </div>
                      </Html>
                    </group>
                  );
                }

                // 4. Grid-based Modules (POV, Projection, Shadows) - 3D Plane Grid
                if (
                  (activeModule === "pov" ||
                    activeModule === "projection" ||
                    activeModule === "shadows") &&
                  (option.twoDData?.projection || option.twoDData?.shadow)
                ) {
                  const gridData =
                    option.twoDData.projection || option.twoDData.shadow;
                  return (
                    <group scale={0.6}>
                      {/* Render Grid Cells as 3D Planes */}
                      {gridData.map((cell: any, i: number) => (
                        <mesh
                          key={i}
                          position={[cell.u - 0.5, -(cell.v - 0.5), 0]}
                        >
                          <planeGeometry args={[0.95, 0.95]} />
                          <meshStandardMaterial
                            color={color}
                            side={THREE.DoubleSide}
                          />
                        </mesh>
                      ))}
                      {/* Optional Grid Background */}
                      <gridHelper
                        args={[8, 8, 0x444444, 0x222222]}
                        rotation={[Math.PI / 2, 0, 0]}
                        position={[0, 0, -0.1]}
                      />

                      {activeModule === "pov" && option.twoDData.view && (
                        <Html position={[0, -4.5, 0]} center transform>
                          <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest bg-black/50 px-2 py-1 rounded whitespace-nowrap">
                            {option.twoDData.view === "top"
                              ? "Bovenaanzicht"
                              : option.twoDData.view === "side"
                                ? "Zijaanzicht"
                                : "Vooraanzicht"}
                          </span>
                        </Html>
                      )}
                    </group>
                  );
                }

                // 5. Structure Modules (Rotation, etc)
                if (!option.twoDData && activeModule !== "mechanical") {
                  const structure = option.structure || [];
                  let dynamicScale = 1.3;

                  if (activeModule === "chirality") {
                    return (
                      <group
                        rotation={
                          option.rotation
                            ? new THREE.Euler(...option.rotation)
                            : new THREE.Euler(0, 0, 0)
                        }
                        scale={0.7}
                      >
                        {/* Render Atoms (Spheres) */}
                        {structure.map((pos: any, i: number) => (
                          <group key={i} position={[pos[0], pos[1], pos[2]]}>
                            <mesh>
                              <sphereGeometry args={[0.4, 32, 32]} />
                              <meshStandardMaterial
                                color={color}
                                roughness={0.3}
                                metalness={0.8}
                              />
                            </mesh>
                          </group>
                        ))}

                        {/* Render Bonds (Cylinders) */}
                        {structure.map((p1: any, i: number) =>
                          structure.slice(i + 1).map((p2: any, j: number) => {
                            const dist = Math.sqrt(
                              Math.pow(p1[0] - p2[0], 2) +
                                Math.pow(p1[1] - p2[1], 2) +
                                Math.pow(p1[2] - p2[2], 2),
                            );
                            // Check if neighbors (distance approx 1.0)
                            if (dist < 1.1) {
                              const mid = [
                                (p1[0] + p2[0]) / 2,
                                (p1[1] + p2[1]) / 2,
                                (p1[2] + p2[2]) / 2,
                              ];

                              const dx = p1[0] - p2[0],
                                dz = p1[2] - p2[2];
                              let rot = [0, 0, 0];

                              // Determine rotation for bond based on axis alignment
                              if (Math.abs(dx) > 0.5) rot = [0, 0, Math.PI / 2];
                              else if (Math.abs(dz) > 0.5)
                                rot = [Math.PI / 2, 0, 0];
                              // For y-axis (default cylinder orientation), rot remains [0,0,0]

                              return (
                                <mesh
                                  key={`bond-${i}-${j}`}
                                  position={[mid[0]!, mid[1]!, mid[2]!]}
                                  rotation={rot as any}
                                >
                                  <cylinderGeometry args={[0.15, 0.15, 1, 8]} />
                                  <meshStandardMaterial color="white" />
                                </mesh>
                              );
                            }
                            return null;
                          }),
                        )}
                      </group>
                    );
                  }

                  if (activeModule === "pathfinding") {
                    const tubeRadius = 0.35;
                    return (
                      <group
                        rotation={
                          option.rotation
                            ? new THREE.Euler(...option.rotation)
                            : new THREE.Euler(0, 0, 0)
                        }
                        scale={0.7}
                      >
                        {/* Render Joints (Spheres) */}
                        {structure.map((pos: any, i: number) => (
                          <group key={i} position={[pos[0], pos[1], pos[2]]}>
                            <mesh>
                              <sphereGeometry args={[tubeRadius, 32, 32]} />
                              <meshStandardMaterial
                                color={color}
                                roughness={0.4}
                                metalness={0.6}
                              />
                            </mesh>
                          </group>
                        ))}

                        {/* Render Tube Segments (Cylinders) */}
                        {structure.map((p1: any, i: number) =>
                          structure.slice(i + 1).map((p2: any, j: number) => {
                            const dist = Math.sqrt(
                              Math.pow(p1[0] - p2[0], 2) +
                                Math.pow(p1[1] - p2[1], 2) +
                                Math.pow(p1[2] - p2[2], 2),
                            );
                            if (dist < 1.1) {
                              const mid = [
                                (p1[0] + p2[0]) / 2,
                                (p1[1] + p2[1]) / 2,
                                (p1[2] + p2[2]) / 2,
                              ];
                              const dx = p1[0] - p2[0],
                                dz = p1[2] - p2[2];
                              let rot = [0, 0, 0];
                              if (Math.abs(dx) > 0.5) rot = [0, 0, Math.PI / 2];
                              else if (Math.abs(dz) > 0.5)
                                rot = [Math.PI / 2, 0, 0];
                              return (
                                <mesh
                                  key={`pipe-${i}-${j}`}
                                  position={[mid[0]!, mid[1]!, mid[2]!]}
                                  rotation={rot as any}
                                >
                                  <cylinderGeometry
                                    args={[tubeRadius, tubeRadius, 1, 16]}
                                  />
                                  <meshStandardMaterial
                                    color={color}
                                    roughness={0.4}
                                    metalness={0.6}
                                  />
                                </mesh>
                              );
                            }
                            return null;
                          }),
                        )}
                      </group>
                    );
                  }

                  if (structure.length > 0) {
                    const xs = structure.map((p: any) => p[0]);
                    const ys = structure.map((p: any) => p[1]);
                    const zs = structure.map((p: any) => p[2]);
                    const maxSpan = Math.max(
                      Math.max(...xs) - Math.min(...xs) + 1,
                      Math.max(...ys) - Math.min(...ys) + 1,
                      Math.max(...zs) - Math.min(...zs) + 1,
                    );
                    dynamicScale = Math.max(0.5, Math.min(1.5, 4 / maxSpan));
                  }
                  return (
                    <Shape
                      structure={structure}
                      rotation={option.rotation || [0, 0, 0]}
                      color={color}
                      scale={dynamicScale}
                      opacity={activeModule === "xray" ? 0.3 : 1}
                    />
                  );
                }

                return null;
              })()}

              {/* Mechanical Answer */}
              {option.gearDir !== undefined && (
                <Html position={[0, 0, 0]} center>
                  <div className="flex flex-col items-center gap-2">
                    <RotateCcw
                      className={`text-white transition-transform ${option.gearDir === -1 ? "scale-x-[-1]" : ""}`}
                      size={32}
                    />
                    <span className="text-white font-black text-xl">
                      {option.gearDir === 1 ? "RECHTS" : "LINKS"}
                    </span>
                  </div>
                </Html>
              )}

              {/* Safe Controls - Locally defined robust version */}
              {/* Safe Controls - Shared component */}
              <SafeOrbitControls
                makeDefault
                enableZoom={true}
                enablePan={true}
                autoRotate={!!(revealed || (feedback && isSelected))}
                autoRotateSpeed={isSelected ? 3 : 1}
                minDistance={4}
                maxDistance={20}
              />
            </Suspense>
          </Canvas>
        )}
      </div>
    </div>
  );
};

export const QuestionCard = ({
  data,
  activeModule,
  color = "#10b981", // Emerald default for target
  revealed = false,
}: {
  data: any;
  activeModule: TrainingModule;
  color?: string;
  revealed?: boolean;
}) => {
  const [mounted, setMounted] = useState(false);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      ref={setContainer}
      className="relative w-full h-full rounded-3xl overflow-hidden bg-slate-950 shadow-inner"
    >
      <div className="w-full h-full">
        {mounted && container && (
          <Canvas
            eventSource={container}
            key="question-canvas"
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: "high-performance",
            }}
          >
            <Suspense fallback={null}>
              <PerspectiveCamera makeDefault position={[0, 0, 9]} />
              <ambientLight intensity={1.5} />
              <pointLight position={[5, 5, 5]} intensity={2} />
              <Environment preset="sunset" />

              {/* 3D Content Dispatcher */}
              {(() => {
                if (activeModule === "mechanical") {
                  if (!data.gears) return null;
                  return (
                    <group scale={0.4}>
                      <ambientLight intensity={1} />
                      <directionalLight position={[5, 5, 5]} intensity={1} />
                      {data.gears.map((g: any, gi: number) => (
                        <Gear
                          key={gi}
                          position={[g.x, g.y, g.z || 0]}
                          radius={g.radius}
                          speed={g.speed}
                          axis={g.axis}
                          color={g.color}
                          showArrows={revealed}
                        />
                      ))}
                      {data.belts?.map((b: any, bi: number) => (
                        <Belt
                          key={bi}
                          from={data.gears[b.from]}
                          to={data.gears[b.to]}
                          type={b.type}
                        />
                      ))}
                    </group>
                  );
                }

                if (activeModule === "folding") {
                  // Use data.folds if it exists (for QuestionCard)
                  const foldingData = data.folds ? data : data.twoDData || {};
                  if (!foldingData.folds || foldingData.folds.length === 0)
                    return null;
                  return (
                    <group>
                      <ambientLight intensity={0.8} />
                      <pointLight
                        position={[5, 10, 5]}
                        intensity={1.5}
                        castShadow
                      />
                      <pointLight position={[-5, 5, 2]} intensity={0.5} />
                      <FoldablePaper
                        folds={foldingData.folds}
                        punches={foldingData.punches}
                      />
                    </group>
                  );
                }

                if (activeModule === "cross-section") {
                  const { shapeType } = data;
                  return (
                    <group rotation={data.rotation || [0, 0, 0]} scale={1.5}>
                      {shapeType === "sphere" && (
                        <mesh>
                          <sphereGeometry args={[1, 32, 32]} />
                          <meshStandardMaterial
                            color={color}
                            transparent
                            opacity={0.6}
                          />
                        </mesh>
                      )}
                      {shapeType === "cube" && (
                        <mesh>
                          <boxGeometry args={[1.5, 1.5, 1.5]} />
                          <meshStandardMaterial
                            color={color}
                            transparent
                            opacity={0.6}
                          />
                        </mesh>
                      )}
                      {shapeType === "cylinder" && (
                        <mesh>
                          <cylinderGeometry args={[1, 1, 2, 32]} />
                          <meshStandardMaterial
                            color={color}
                            transparent
                            opacity={0.6}
                          />
                        </mesh>
                      )}
                      {shapeType === "cone" && (
                        <mesh>
                          <coneGeometry args={[1, 2, 32]} />
                          <meshStandardMaterial
                            color={color}
                            transparent
                            opacity={0.6}
                          />
                        </mesh>
                      )}

                      {/* Section Plane Indicator */}
                      <mesh
                        rotation={
                          data.cutType === "horizontal"
                            ? [Math.PI / 2, 0, 0]
                            : [0, Math.PI / 2, 0]
                        }
                      >
                        <planeGeometry args={[3, 3]} />
                        <meshStandardMaterial
                          color="#ffffff"
                          transparent
                          opacity={0.2}
                          side={THREE.DoubleSide}
                        />
                      </mesh>
                    </group>
                  );
                }

                if (activeModule === "stability") {
                  // Stability Reference: Render the tower but keep it static (active={false})
                  // This ensures the user sees the 'initial state' of the tower to judge.
                  if (!data.tower)
                    return (
                      <Html center>
                        <div className="text-white/50">Geen toren data</div>
                      </Html>
                    );
                  return (
                    <Physics gravity={[0, -9.81, 0]}>
                      <group position={[0, -1, 0]} scale={0.6}>
                        <Floor />
                        {data.tower.map((b: any, bi: number) => (
                          <PhysicsBlock
                            key={bi}
                            position={[b.x, b.y, b.z]}
                            args={[b.w, b.h, b.d]}
                            mass={b.mass}
                            active={false} // Static reference
                            color={bi === 0 ? "#4ADE80" : "#F87171"} // Example: Green base, Red unstable parts? Or just consistent coloring.
                          />
                        ))}
                      </group>
                    </Physics>
                  );
                }

                // Default: Structure modules
                const structure = data.structure || [];

                if (activeModule === "chirality") {
                  // Chirality: Use Distinct Amber Color for Reference to avoid confusion with answers
                  const chiralityColor = "#F59E0B";
                  return (
                    <group
                      rotation={
                        data.rotation
                          ? new THREE.Euler(...data.rotation)
                          : new THREE.Euler(0, 0, 0)
                      }
                      scale={0.7}
                    >
                      {/* Render Atoms (Spheres) */}
                      {structure.map((pos: any, i: number) => (
                        <group key={i} position={[pos[0], pos[1], pos[2]]}>
                          <mesh>
                            <sphereGeometry args={[0.4, 32, 32]} />
                            <meshStandardMaterial
                              color={chiralityColor}
                              roughness={0.3}
                              metalness={0.8}
                            />
                          </mesh>
                        </group>
                      ))}

                      {/* Render Bonds (Cylinders) */}
                      {structure.map((p1: any, i: number) =>
                        structure.slice(i + 1).map((p2: any, j: number) => {
                          const dist = Math.sqrt(
                            Math.pow(p1[0] - p2[0], 2) +
                              Math.pow(p1[1] - p2[1], 2) +
                              Math.pow(p1[2] - p2[2], 2),
                          );
                          if (dist < 1.1) {
                            const mid = [
                              (p1[0] + p2[0]) / 2,
                              (p1[1] + p2[1]) / 2,
                              (p1[2] + p2[2]) / 2,
                            ] as [number, number, number];
                            const dx = p1[0] - p2[0],
                              dz = p1[2] - p2[2];
                            let rot = [0, 0, 0];
                            if (Math.abs(dx) > 0.5) rot = [0, 0, Math.PI / 2];
                            else if (Math.abs(dz) > 0.5)
                              rot = [Math.PI / 2, 0, 0];

                            return (
                              <mesh
                                key={`bond-q-${i}-${j}`}
                                position={mid}
                                rotation={rot as any}
                              >
                                <cylinderGeometry args={[0.15, 0.15, 1, 8]} />
                                <meshStandardMaterial color="white" />
                              </mesh>
                            );
                          }
                          return null;
                        }),
                      )}
                    </group>
                  );
                }

                if (activeModule === "pathfinding") {
                  const tubeRadius = 0.35;
                  return (
                    <group
                      rotation={
                        data.rotation
                          ? new THREE.Euler(...data.rotation)
                          : new THREE.Euler(0, 0, 0)
                      }
                      scale={0.7}
                    >
                      {/* Render Joints (Spheres) */}
                      {structure.map((pos: any, i: number) => (
                        <group key={i} position={[pos[0], pos[1], pos[2]]}>
                          <mesh>
                            <sphereGeometry args={[tubeRadius, 32, 32]} />
                            <meshStandardMaterial
                              color={color}
                              roughness={0.4}
                              metalness={0.6}
                            />
                          </mesh>
                        </group>
                      ))}

                      {/* Render Tube Segments (Cylinders) */}
                      {structure.map((p1: any, i: number) =>
                        structure.slice(i + 1).map((p2: any, j: number) => {
                          const dist = Math.sqrt(
                            Math.pow(p1[0] - p2[0], 2) +
                              Math.pow(p1[1] - p2[1], 2) +
                              Math.pow(p1[2] - p2[2], 2),
                          );
                          if (dist < 1.1) {
                            const mid = [
                              (p1[0] + p2[0]) / 2,
                              (p1[1] + p2[1]) / 2,
                              (p1[2] + p2[2]) / 2,
                            ] as [number, number, number];
                            const dx = p1[0] - p2[0],
                              dz = p1[2] - p2[2];
                            let rot = [0, 0, 0];
                            if (Math.abs(dx) > 0.5) rot = [0, 0, Math.PI / 2];
                            else if (Math.abs(dz) > 0.5)
                              rot = [Math.PI / 2, 0, 0];

                            return (
                              <mesh
                                key={`bond-q-${i}-${j}`}
                                position={mid}
                                rotation={rot as any}
                              >
                                <cylinderGeometry
                                  args={[tubeRadius, tubeRadius, 1, 16]}
                                />
                                <meshStandardMaterial
                                  color={color}
                                  roughness={0.4}
                                  metalness={0.6}
                                />
                              </mesh>
                            );
                          }
                          return null;
                        }),
                      )}
                    </group>
                  );
                }

                return (
                  <Shape
                    structure={structure}
                    rotation={data.rotation || [0, 1, 0]} // Slight Y rotation for depth
                    color={color}
                    scale={1.3}
                  />
                );
              })()}
              {/* Enable Zoom & Pan for detailed inspection of reference figure */}
              <SafeOrbitControls
                autoRotate
                autoRotateSpeed={2}
                enableZoom={true}
                enablePan={true}
                minDistance={4}
                maxDistance={20}
              />
            </Suspense>
          </Canvas>
        )}
      </div>
    </div>
  );
};
