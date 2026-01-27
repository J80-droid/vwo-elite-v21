/* eslint-disable react-hooks/purity */
/* eslint-disable @typescript-eslint/no-explicit-any -- dynamic building logic and THREE types */
import { Grid, PerspectiveCamera, View } from "@react-three/drei";
import { Canvas, ThreeEvent } from "@react-three/fiber";
import { useTranslations } from "@shared/hooks/useTranslations";
import confetti from "canvas-confetti";
import {
  Box,
  Check,
  Eye,
  Grid as GridIcon,
  Play,
  Trash2,
  Trophy,
  X,
} from "lucide-react";
import React, { useRef, useState } from "react";
import * as THREE from "three";

import { useThreeDLabContext } from "../../hooks/useThreeDLabContext";
import { useSpatialStore } from "../../stores/spatialStore";
import { SafeOrbitControls } from "../SafeOrbitControls";

// --- Types ---
type Vec3 = [number, number, number];
type Difficulty = "easy" | "medium" | "hard";

interface VoxelData {
  x: number;
  y: number;
  z: number;
  color: string;
  id: string;
}

const DIFFICULTY_CONFIG = {
  easy: { size: 3, time: 120 },
  medium: { size: 5, time: 180 },
  hard: { size: 7, time: 300 },
};

// --- Helper: Genereer willekeurige doel-vorm ---
const generateTargetShape = (size: number): VoxelData[] => {
  const voxels: VoxelData[] = [];
  // Startpunt (midden onder)
  const center = Math.floor(size / 2);
  voxels.push({ x: center, y: 0, z: center, color: "#3b82f6", id: "start" });

  const count = size * 2 + Math.floor(Math.random() * size); // Aantal blokjes

  // Random Walk algoritme voor aaneengesloten vorm
  let current = { x: center, y: 0, z: center };

  for (let i = 0; i < count; i++) {
    const axis = Math.floor(Math.random() * 3); // 0=x, 1=y, 2=z
    const dir = Math.random() > 0.5 ? 1 : -1;

    const next = { ...current };
    if (axis === 0) next.x += dir;
    if (axis === 1) next.y += dir;
    if (axis === 2) next.z += dir;

    // Blijf binnen bounds
    if (
      next.x >= 0 &&
      next.x < size &&
      next.y >= 0 &&
      next.y < size &&
      next.z >= 0 &&
      next.z < size
    ) {
      // Check of plek vrij is
      if (
        !voxels.some((v) => v.x === next.x && v.y === next.y && v.z === next.z)
      ) {
        voxels.push({
          ...next,
          color: Math.random() > 0.5 ? "#3b82f6" : "#ef4444",
          id: crypto.randomUUID(),
        });
        current = next;
      }
    }
  }
  return voxels;
};

// --- Smart Validation Algorithm ---
// Normaliseert coördinaten naar (0,0,0) om relatieve vorm te checken
const normalizeShape = (voxels: VoxelData[]) => {
  if (voxels.length === 0) return [];

  // Vind minimale bounds
  const minX = Math.min(...voxels.map((v) => v.x));
  const minY = Math.min(...voxels.map((v) => v.y));
  const minZ = Math.min(...voxels.map((v) => v.z));

  // Shift alles naar 0
  return voxels
    .map((v) => ({
      x: v.x - minX,
      y: v.y - minY,
      z: v.z - minZ,
      color: v.color, // Kleur moet ook kloppen? (Optioneel)
    }))
    .sort((a, b) => {
      // Sorteer voor makkelijke vergelijking stringify
      if (a.x !== b.x) return a.x - b.x;
      if (a.y !== b.y) return a.y - b.y;
      return a.z - b.z;
    });
};

// --- Voxel Component (geoptimaliseerd) ---
const VoxelMesh = ({
  position,
  color,
  opacity = 1,
}: {
  position: Vec3;
  color: string;
  opacity?: number;
}) => (
  <mesh position={position}>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial
      color={color}
      transparent={opacity < 1}
      opacity={opacity}
      roughness={0.2}
      metalness={0.1}
    />
    <lineSegments>
      <edgesGeometry args={[new THREE.BoxGeometry(1, 1, 1)]} />
      <lineBasicMaterial
        color="black"
        linewidth={2}
        opacity={0.2 * opacity}
        transparent
      />
    </lineSegments>
  </mesh>
);

// --- 2D View Component (Mini Grid) ---
const ProjectionView = ({
  voxels,
  axis,
  size,
}: {
  voxels: VoxelData[];
  axis: "top" | "front" | "side";
  size: number;
}) => {
  const { t } = useTranslations();
  // Maak 2D grid
  const grid = Array(size)
    .fill(null)
    .map(() => Array(size).fill(false));

  voxels.forEach((v) => {
    let row = 0,
      col = 0;
    // Projectie logica
    if (axis === "top") {
      col = v.x;
      row = size - 1 - v.z;
    } // X-Z vlak
    if (axis === "front") {
      col = v.x;
      row = size - 1 - v.y;
    } // X-Y vlak
    if (axis === "side") {
      col = v.z;
      row = size - 1 - v.y;
    } // Z-Y vlak

    if (row >= 0 && row < size && col >= 0 && col < size) {
      grid[row]![col] = true; // Er is 'iets' op deze diepte
    }
  });

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] text-slate-400 uppercase tracking-wider">
        {t.build.projection[axis]}
      </span>
      <div
        className="grid gap-[1px] bg-slate-800 p-[1px] border border-white/10"
        style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
      >
        {grid.map((row, r) =>
          row.map((filled, c) => (
            <div
              key={`${r}-${c}`}
              className={`w-3 h-3 ${filled ? "bg-electric" : "bg-black/40"}`}
            />
          )),
        )}
      </div>
    </div>
  );
};

export const BuildMode: React.FC = () => {
  const { t } = useTranslations();
  const { setActiveModule } = useThreeDLabContext();
  const { logSession } = useSpatialStore();

  // Game State
  const [gameStarted, setGameStarted] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [userVoxels, setUserVoxels] = useState<VoxelData[]>([]);
  const [targetVoxels, setTargetVoxels] = useState<VoxelData[]>([]);

  // Stats & Hints
  const [startTime, setStartTime] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showGhost, setShowGhost] = useState(false);
  const [showProjections, setShowProjections] = useState(false);

  const [gameOver, setGameOver] = useState(false);

  const config = DIFFICULTY_CONFIG[difficulty];
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);

  const startGame = () => {
    const target = generateTargetShape(config.size);
    setTargetVoxels(target);
    setUserVoxels([]);
    setGameStarted(true);
    setGameOver(false);
    setStartTime(Date.now());
    setMistakes(0);
    setHintsUsed(0);
    setShowGhost(false);
  };

  // --- Interaction Handlers ---
  const handlePlaceVoxel = (e: ThreeEvent<MouseEvent>) => {
    if (!gameStarted || gameOver) return;
    e.stopPropagation();

    const intersection = e.intersections[0];
    if (!intersection || !intersection.face) return;

    const { point, face } = intersection;

    const pos = new THREE.Vector3().copy(point).add(face.normal);
    const x = Math.floor(pos.x);
    const y = Math.floor(pos.y);
    const z = Math.floor(pos.z);

    // Bounds check
    if (
      !config ||
      x < 0 ||
      x >= config.size ||
      y < 0 ||
      y >= 10 ||
      z < 0 ||
      z >= config.size
    )
      return;

    const newVoxel = {
      x,
      y,
      z,
      color: "#3b82f6", // Standaard blauw, kan later color picker toevoegen
      id: crypto.randomUUID(),
    };

    setUserVoxels((prev) => [...prev, newVoxel]);
  };

  const handleRemoveVoxel = (e: ThreeEvent<MouseEvent>, id: string) => {
    if (!gameStarted || gameOver) return;
    e.stopPropagation();
    setUserVoxels((prev) => prev.filter((v) => v.id !== id));
    setMistakes((m) => m + 1); // Verwijderen telt als 'foutje'
  };

  // --- Smart Check ---
  const checkSolution = () => {
    const normUser = normalizeShape(userVoxels);
    const normTarget = normalizeShape(targetVoxels);

    // Simpele check: lengte en JSON stringify van genormaliseerde data
    const isMatch = JSON.stringify(normUser) === JSON.stringify(normTarget);

    if (isMatch) {
      handleWin();
    } else {
      // Feedback (Shakelen of rood flitsen kan hier)
      alert(t.lesson.incorrect); // Using generic incorrect for now
    }
  };

  const handleWin = () => {
    setGameOver(true);
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#3b82f6", "#ef4444", "#eab308"],
    });

    // Save to Store
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    logSession({
      difficulty,
      timeTaken,
      mistakes,
      hintsUsed,
      score: 100, // Score logica zit in store, dit is placeholder
    });
  };

  // --- Scene Setup ---
  return (
    <div
      ref={mainContainerRef}
      className="relative w-full h-screen bg-obsidian-950 text-white overflow-hidden"
    >
      {/* UI Header */}
      <div className="absolute top-4 left-4 z-10 flex gap-4 pointer-events-none">
        <div className="pointer-events-auto">
          {!gameStarted ? (
            <div className="bg-obsidian-900/80 p-6 rounded-2xl border border-white/10 backdrop-blur-md relative">
              <button
                onClick={() => setActiveModule("")}
                className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              <h1 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Box className="text-electric" /> {t.build.title}
              </h1>
              <div className="flex gap-2 mb-6">
                {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                      difficulty === d
                        ? "bg-electric text-white"
                        : "bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    {t.build.difficulty[d]}
                  </button>
                ))}
              </div>
              <button
                onClick={startGame}
                className="w-full py-4 mt-2 rounded-xl border border-electric/30 bg-electric/5 hover:bg-electric/10 text-electric font-bold tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-3 group hover:border-electric/60 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:text-blue-300"
              >
                <Play
                  size={20}
                  className="fill-current opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all"
                />
                {t.build.start}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setActiveModule("")}
                className="bg-black/50 p-2 rounded-xl backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all text-slate-400 hover:text-white"
                title="Back to Hub"
              >
                <GridIcon size={20} />
              </button>

              <div className="bg-black/50 p-4 rounded-xl backdrop-blur-md border border-white/10">
                <h2 className="font-bold text-electric mb-2">{t.build.goal}</h2>
                {/* Kleine 3D preview van het doel */}
                <div
                  ref={previewContainerRef}
                  className="w-32 h-32 bg-white/5 rounded-lg overflow-hidden relative"
                />

                {/* Overlay knop voor views */}
                <button
                  onClick={() => {
                    setShowProjections(!showProjections);
                    setHintsUsed((h) => h + 1);
                  }}
                  className="absolute bottom-5 right-5 p-1 bg-black/60 rounded hover:bg-electric/80 transition-colors z-20"
                  title={t.build.views}
                >
                  <GridIcon size={14} />
                </button>
              </div>

              {/* 2D PROJECTIES (HINT SYSTEEM) */}
              {showProjections && (
                <div className="bg-black/50 p-3 rounded-xl backdrop-blur-md border border-white/10 flex gap-3 animate-in slide-in-from-left">
                  <ProjectionView
                    voxels={targetVoxels}
                    axis="top"
                    size={config.size}
                  />
                  <ProjectionView
                    voxels={targetVoxels}
                    axis="front"
                    size={config.size}
                  />
                  <ProjectionView
                    voxels={targetVoxels}
                    axis="side"
                    size={config.size}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Game Controls (Right Side) */}
      {gameStarted && !gameOver && (
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-3 pointer-events-none">
          <div className="pointer-events-auto flex flex-col gap-3">
            <button
              onClick={checkSolution}
              className="p-4 bg-emerald-600 rounded-xl hover:bg-emerald-500 shadow-lg shadow-emerald-900/20 transition-all active:scale-95"
            >
              <Check size={28} />
            </button>
            <button
              onClick={() => {
                setShowGhost(!showGhost);
                setHintsUsed((h) => h + 1);
              }}
              className={`p-3 rounded-xl transition-all ${showGhost ? "bg-amber-500 text-white" : "bg-white/10 hover:bg-white/20"}`}
              title={t.build.ghost}
            >
              <Eye size={24} />
            </button>
            <button
              onClick={() => {
                setUserVoxels([]);
                setMistakes((m) => m + 5);
              }}
              className="p-3 bg-white/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-all"
              title={t.build.reset}
            >
              <Trash2 size={24} />
            </button>
          </div>
        </div>
      )}

      {/* MAIN 3D CANVAS - Single Context */}
      <Canvas
        shadows
        className="absolute inset-0 z-0"
        eventSource={mainContainerRef as any}
      >
        <View index={1} track={mainContainerRef as any}>
          <color attach="background" args={["#0f172a"]} />
          <fog attach="fog" args={["#0f172a", 10, 30]} />

          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 20, 10]} intensity={1} castShadow />

          <group position={[-config.size / 2, -0.5, -config.size / 2]}>
            <Grid
              args={[config.size, config.size]}
              cellSize={1}
              cellThickness={1}
              cellColor="#1e293b"
              sectionSize={config.size}
              sectionThickness={1.5}
              sectionColor="#3b82f6"
              fadeDistance={30}
              infiniteGrid={false}
              position={[config.size / 2 - 0.5, 0, config.size / 2 - 0.5]}
            />

            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[config.size / 2 - 0.5, -0.01, config.size / 2 - 0.5]}
              onClick={handlePlaceVoxel}
            >
              <planeGeometry args={[config.size, config.size]} />
              <meshBasicMaterial visible={false} />
            </mesh>

            {userVoxels.map((v) => (
              <group
                key={v.id}
                position={[v.x, v.y + 0.5, v.z]}
                onClick={(e) => e.stopPropagation()}
                onContextMenu={(e) => handleRemoveVoxel(e, v.id)}
              >
                <VoxelMesh position={[0, 0, 0]} color={v.color} />
              </group>
            ))}

            {showGhost &&
              targetVoxels.map((v) => (
                <group key={`ghost-${v.id}`} position={[v.x, v.y + 0.5, v.z]}>
                  <VoxelMesh
                    position={[0, 0, 0]}
                    color={v.color}
                    opacity={0.3}
                  />
                </group>
              ))}
          </group>

          <SafeOrbitControls
            makeDefault
            minPolarAngle={0}
            maxPolarAngle={Math.PI / 2.1}
          />
          <PerspectiveCamera makeDefault position={[8, 8, 8]} fov={50} />
        </View>

        {/* Preview View - Rendered in the same canvas but tracked to the preview div */}
        {gameStarted && (
          <View index={2} track={previewContainerRef as any}>
            <color attach="background" args={["#0f172a"]} />
            <ambientLight intensity={0.8} />
            <pointLight position={[10, 10, 10]} />
            <group position={[-config.size / 2, 0, -config.size / 2]}>
              {targetVoxels.map((v) => (
                <VoxelMesh
                  key={v.id}
                  position={[v.x, v.y, v.z]}
                  color={v.color}
                />
              ))}
            </group>
            <SafeOrbitControls autoRotate enableZoom={false} />
            <PerspectiveCamera makeDefault position={[5, 5, 5]} fov={45} />
          </View>
        )}
      </Canvas>

      {/* Game Over Screen */}
      {gameOver && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in">
          <div className="bg-obsidian-900 border border-electric p-8 rounded-2xl text-center max-w-md shadow-2xl shadow-electric/20">
            <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-2">
              {t.build.excellent}
            </h2>
            <p className="text-slate-400 mb-6">{t.build.perfect}</p>

            <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
              <div className="bg-white/5 p-3 rounded-lg">
                <span className="block text-slate-500">{t.build.time}</span>
                <span className="text-xl font-mono text-white">
                  {(Date.now() - startTime) / 1000}s
                </span>
              </div>
              <div className="bg-white/5 p-3 rounded-lg">
                <span className="block text-slate-500">{t.build.mistakes}</span>
                <span className="text-xl font-mono text-rose-400">
                  {mistakes}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={startGame}
                className="flex-1 py-3 bg-electric text-black font-bold rounded-xl hover:bg-electric-400 transition-colors"
              >
                {t.build.next}
              </button>
              <button
                onClick={() => setGameStarted(false)}
                className="px-4 py-3 bg-white/10 rounded-xl hover:bg-white/20"
              >
                {t.build.menu}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
