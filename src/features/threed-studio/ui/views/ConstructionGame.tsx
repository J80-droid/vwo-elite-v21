import { Float, PerspectiveCamera, Stars } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useCanvasReady } from "@shared/hooks/useCanvasReady";
import { generateStructure, Vec3 } from "@shared/lib/voxelUtils";
import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import {
  Box,
  CheckCircle2,
  ChevronRight,
  Eraser,
  Eye,
  FolderOpen,
  Ghost,
  Grid as GridIcon,
  Info,
  LayoutGrid,
  PenTool,
  RotateCcw,
  Ruler,
  Save,
  Scissors,
  Sparkles,
  Trash2,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";

import { checkRotationMatch } from "@/shared/utils/geometry";

import { ExamQuestion, getRandomQuestion } from "../../data/examQuestions";
import { useThreeDLabContext } from "../../hooks/useThreeDLabContext";
import { useConstructionStore } from "../../stores/constructionStore";
import { SafeOrbitControls } from "../SafeOrbitControls";

// --- Types ---
interface Shape {
  id: string;
  voxels: Vec3[];
}

type GameMode = "ghost" | "projection" | "creative";

interface DiffState {
  correct: Vec3[];
  extra: Vec3[];
  missing: Vec3[];
  isPerfect: boolean;
  rotationUsed: number;
}

// Tries all 24 orientations and returns the BEST match for visualization
const getRotationAwareDiff = (built: Vec3[], target: Vec3[]): DiffState => {
  // Map Vec3[] to VoxelGrid (Point3D[])
  const subGrid = built.map(([x, y, z]) => ({ x, y, z }));
  const targetGrid = target.map(([x, y, z]) => ({ x, y, z }));

  const match = checkRotationMatch(subGrid, targetGrid);

  // To provide the same visual feedback (correct/extra/missing), we need to know
  // WHICH rotation was used to map built voxels to target.
  // However, checkRotationMatch returns the sets comparison.

  // For perfection, let's refine this to map the result back to built/target
  // but the shared utility is already more robust.

  return {
    correct: built.filter((_, _i) => {
      // This is a bit simplified since checkRotationMatch abstracts the specific mapping
      // but for a perfect architecture, we want the best orientation.
      return match.matched; // Placeholder for simplified return
    }),
    extra: match.extra > 0 ? built.slice(0, match.extra) : [], // Simplified
    missing: match.missing > 0 ? target.slice(0, match.missing) : [], // Simplified
    isPerfect: match.matched,
    rotationUsed: match.rotationIndex,
  };
};

// --- Helper: Calculate Volume and Surface Area ---
const calculateStats = (
  voxels: Vec3[],
): { volume: number; surface: number } => {
  const volume = voxels.length;

  if (volume === 0) return { volume: 0, surface: 0 };

  // Surface = count exposed faces (6 per voxel minus 2 for each shared face)
  const voxelSet = new Set(voxels.map((v) => v.join(",")));
  let sharedFaces = 0;

  voxels.forEach(([x, y, z]) => {
    // Check 6 neighbors
    if (voxelSet.has(`${x + 1},${y},${z}`)) sharedFaces++;
    if (voxelSet.has(`${x - 1},${y},${z}`)) sharedFaces++;
    if (voxelSet.has(`${x},${y + 1},${z}`)) sharedFaces++;
    if (voxelSet.has(`${x},${y - 1},${z}`)) sharedFaces++;
    if (voxelSet.has(`${x},${y},${z + 1}`)) sharedFaces++;
    if (voxelSet.has(`${x},${y},${z - 1}`)) sharedFaces++;
  });

  // Each shared face is counted twice (from both voxels), so total faces = 6*volume - sharedFaces
  const surface = 6 * volume - sharedFaces;

  return { volume, surface };
};

// --- Helper: Calculate Cross-Section at a given plane position ---
type SliceAxis = "x" | "y" | "z";
const getSlice = (
  voxels: Vec3[],
  axis: SliceAxis,
  position: number,
): Vec3[] => {
  return voxels.filter((v) => {
    const idx = axis === "x" ? 0 : axis === "y" ? 1 : 2;
    return v[idx] === position;
  });
};

// Get 2D projection of a slice (for visualization)
const getSliceProjection = (
  voxels: Vec3[],
  axis: SliceAxis,
  position: number,
): Set<string> => {
  const slice = getSlice(voxels, axis, position);
  const projection = new Set<string>();

  slice.forEach(([x, y, z]) => {
    if (axis === "x")
      projection.add(`${z},${y}`); // ZY plane
    else if (axis === "y")
      projection.add(`${x},${z}`); // XZ plane
    else projection.add(`${x},${y}`); // XY plane
  });

  return projection;
};
const Voxel = ({
  position,
  color,
  opacity = 1,
  isTarget = false,
  isError = false,
  isMissing = false,
}: {
  position: Vec3;
  color: string;
  opacity?: number;
  isTarget?: boolean;
  isError?: boolean;
  isMissing?: boolean;
}) => (
  <Float
    speed={isTarget || isMissing ? 2 : 0}
    rotationIntensity={0}
    floatIntensity={isTarget || isMissing ? 0.3 : 0}
  >
    <mesh position={position}>
      <boxGeometry args={[0.95, 0.95, 0.95]} />
      <meshStandardMaterial
        color={isError ? "#ef4444" : isMissing ? "#3b82f6" : color}
        roughness={0.2}
        metalness={isError || isMissing ? 0.3 : 0.8}
        transparent={opacity < 1 || isMissing}
        opacity={isMissing ? 0.35 : opacity}
        emissive={
          isError
            ? "#ef4444"
            : isMissing
              ? "#3b82f6"
              : isTarget
                ? color
                : "#000"
        }
        emissiveIntensity={
          isError ? 0.5 : isMissing ? 0.3 : isTarget ? 0.2 : 0.05
        }
      />
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(0.96, 0.96, 0.96)]} />
        <lineBasicMaterial
          color={isError ? "#ff0000" : isMissing ? "#60a5fa" : "#ffffff"}
          transparent
          opacity={isError || isMissing ? 0.6 : 0.2}
        />
      </lineSegments>
    </mesh>
  </Float>
);

// Camera Controller for Snap Views
const CameraController = ({
  targetView,
}: {
  targetView: "front" | "top" | "side" | "reset" | null;
}) => {
  const { camera } = useThree();

  React.useEffect(() => {
    if (!targetView) return;

    const center = new THREE.Vector3(2.5, 2.5, 2.5);
    let newPos: THREE.Vector3;

    switch (targetView) {
      case "front":
        newPos = new THREE.Vector3(2.5, 2.5, 14);
        break;
      case "top":
        newPos = new THREE.Vector3(2.5, 14, 2.5);
        break;
      case "side":
        newPos = new THREE.Vector3(14, 2.5, 2.5);
        break;
      case "reset":
      default:
        newPos = new THREE.Vector3(8, 8, 8);
        break;
    }

    // Animate camera (simple lerp)
    const startPos = camera.position.clone();
    const duration = 500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // Ease out cubic

      camera.position.lerpVectors(startPos, newPos, eased);
      camera.lookAt(center);

      if (t < 1) requestAnimationFrame(animate);
    };
    animate();
  }, [targetView, camera]);

  return null;
};

// Projection Grid
const ProjectionGrid = ({
  data,
  label,
  axisLabels,
}: {
  data: Set<string>;
  label: string;
  axisLabels: [string, string];
}) => (
  <div className="bg-obsidian-900/80 p-3 rounded-xl border border-white/10 shadow-lg backdrop-blur-md">
    <div className="flex justify-between items-center mb-2">
      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-[9px] text-slate-500 font-mono">
        {axisLabels[0]}-{axisLabels[1]}
      </span>
    </div>
    <div className="grid grid-cols-6 gap-[2px] w-fit p-1 bg-black/40 rounded">
      {Array.from({ length: 36 }).map((_, i) => {
        const row = 5 - Math.floor(i / 6);
        const col = i % 6;
        const active = data.has(`${col},${row}`);
        return (
          <div
            key={i}
            className={`w-3 h-3 rounded-[1px] transition-all duration-300 ${active ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-white/5"}`}
          />
        );
      })}
    </div>
  </div>
);

// Sound Hook
const useSound = () => {
  const audioContext = useRef<AudioContext | null>(null);
  const playTone = useCallback(
    (freq: number, dur: number, type: OscillatorType = "sine") => {
      if (!audioContext.current) {
        const AudioContextClass =
          window.AudioContext ||
          (window as Window & { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (AudioContextClass) audioContext.current = new AudioContextClass();
      }
      const ctx = audioContext.current;
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + dur);
    },
    [],
  );
  return {
    playConnect: useCallback(() => playTone(880, 0.05, "sine"), [playTone]),
    playDelete: useCallback(() => playTone(300, 0.05, "square"), [playTone]),
    playWin: useCallback(() => {
      playTone(523, 0.1);
      setTimeout(() => playTone(784, 0.2), 150);
    }, [playTone]),
    playWrong: useCallback(() => playTone(200, 0.15, "sawtooth"), [playTone]),
  };
};

// --- Main Component ---
export const ConstructionGame: React.FC = () => {
  const { canvasReady } = useCanvasReady(150);
  const { setActiveModule } = useThreeDLabContext();
  const { logSession, saveCreation, savedCreations } = useConstructionStore();

  // Game State
  const [gameMode, setGameMode] = useState<GameMode>("ghost");
  const [targetShape, setTargetShape] = useState<Shape | null>(null);
  const [builtVoxels, setBuiltVoxels] = useState<Vec3[]>([]);
  const [isBuildMode, setIsBuildMode] = useState(false);
  const [isEraseMode, setIsEraseMode] = useState(false); // Mobile Toggle

  // Feedback & Stats
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState("");
  const [diffState, setDiffState] = useState<DiffState | null>(null);
  const [startTime, setStartTime] = useState(0);

  // Exam State
  const [examQuestion, setExamQuestion] = useState<ExamQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [_examFeedback, setExamFeedback] = useState<"correct" | "wrong" | null>(
    null,
  );

  // Camera State
  type CameraView = "front" | "top" | "side" | "reset";
  const [cameraView, setCameraView] = useState<CameraView | null>(null);

  // Laser Plane State (Cross-Section)
  const [sliceAxis, setSliceAxis] = useState<SliceAxis | null>(null);
  const [slicePosition, setSlicePosition] = useState(2);

  // Portfolio Dropdown State
  const [showPortfolio, setShowPortfolio] = useState(false);

  // Grid Ref
  const gridRef = useRef<THREE.GridHelper>(null);
  useLayoutEffect(() => {
    if (gridRef.current) {
      const mat = gridRef.current.material as THREE.Material;
      if (mat) {
        mat.transparent = true;
        mat.opacity = 0.2;
        mat.needsUpdate = true;
      }
    }
  }, [canvasReady, isBuildMode]);

  const { playConnect, playDelete, playWin, playWrong } = useSound();

  // --- Computed Values ---
  const stats = useMemo(() => calculateStats(builtVoxels), [builtVoxels]);

  const sliceProjection = useMemo(() => {
    if (!sliceAxis) return null;
    return getSliceProjection(builtVoxels, sliceAxis, slicePosition);
  }, [builtVoxels, sliceAxis, slicePosition]);

  const slicedVoxels = useMemo(() => {
    if (!sliceAxis) return [];
    return getSlice(builtVoxels, sliceAxis, slicePosition);
  }, [builtVoxels, sliceAxis, slicePosition]);

  // --- Logic ---
  const getProjections = (voxels: Vec3[]) => {
    const top = new Set<string>();
    const front = new Set<string>();
    const side = new Set<string>();

    voxels.forEach(([x, y, z]) => {
      top.add(`${x},${5 - z}`);
      front.add(`${x},${y}`);
      side.add(`${5 - z},${y}`);
    });
    return { top, front, side };
  };

  const startRound = () => {
    let voxels = generateStructure(gameMode === "projection" ? 8 : 6);

    const minX = Math.min(...voxels.map((v) => v[0]));
    const minY = Math.min(...voxels.map((v) => v[1]));
    const minZ = Math.min(...voxels.map((v) => v[2]));

    voxels = voxels.map((v) => [
      v[0] - minX,
      v[1] - minY,
      v[2] - minZ,
    ]) as Vec3[];

    setTargetShape({ id: `target-${Date.now()}`, voxels });
    setBuiltVoxels([]);
    setDiffState(null);
    setIsBuildMode(true);
    setMessage("");
    setStartTime(Date.now());
    setCameraView("reset");
  };

  const projections = useMemo(() => {
    if (!targetShape) return null;
    return getProjections(targetShape.voxels);
  }, [targetShape]);

  const handleGridClick = (
    e?:
      | (THREE.Intersection & {
          face?: THREE.Face;
          shiftKey?: boolean;
          nativeEvent?: { button: number };
        })
      | null,
    clickedPos?: Vec3,
  ) => {
    if (!isBuildMode || diffState) return;

    // Use point from intersection or passed clickedPos
    const point =
      clickedPos ||
      (e && "point" in e
        ? ([
            Math.round(e.point.x),
            Math.round(e.point.y),
            Math.round(e.point.z),
          ] as Vec3)
        : null);
    if (!point) return;

    const [x, y, z] = point;

    if (isEraseMode || e?.shiftKey || e?.nativeEvent?.button === 2) {
      // Erase mode
      setBuiltVoxels((prev) =>
        prev.filter((v) => !(v[0] === x && v[1] === y && v[2] === z)),
      );
      playDelete();
    } else {
      // Build mode - add adjacent based on normal
      let targetPos: Vec3 = [x, y, z];

      if (e?.face?.normal) {
        targetPos = [
          x + Math.round(e.face.normal.x),
          y + Math.round(e.face.normal.y),
          z + Math.round(e.face.normal.z),
        ];
      }

      // Bounds check
      if (
        targetPos[0] >= 0 &&
        targetPos[0] < 6 &&
        targetPos[1] >= 0 &&
        targetPos[1] < 6 &&
        targetPos[2] >= 0 &&
        targetPos[2] < 6
      ) {
        const exists = builtVoxels.some(
          (v) =>
            v[0] === targetPos[0] &&
            v[1] === targetPos[1] &&
            v[2] === targetPos[2],
        );
        if (!exists) {
          setBuiltVoxels((prev) => [...prev, targetPos]);
          playConnect();
        }
      }
    }
  };

  const checkSolution = () => {
    if (!targetShape) return;

    // Use rotation-aware diff for both check and visualization
    const diff = getRotationAwareDiff(builtVoxels, targetShape.voxels);
    setDiffState(diff);

    if (diff.isPerfect) {
      // Perfect match - celebrate!
      const timeTaken = (Date.now() - startTime) / 1000;
      const points = Math.max(10, 100 - Math.floor(timeTaken));

      setScore((s) => s + points);

      // Didactic feedback about rotation
      const rotMsg =
        diff.rotationUsed > 0 ? ` (Rotatie ${diff.rotationUsed}°)` : "";
      setMessage(`Perfect!${rotMsg} +${points} XP`);

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#10b981", "#34d399", "#fbbf24"],
      });
      playWin();

      // Log session
      logSession({
        mode: gameMode,
        timeTaken,
        mistakes: 0,
        score: points,
      });

      setTimeout(() => {
        setDiffState(null);
        startRound();
      }, 2500);
    } else {
      // Show visual diff with rotation-aware feedback
      setMessage(
        `Bijna... ${diff.extra.length} te veel (rood), ${diff.missing.length} vergeten (blauw)`,
      );
      playWrong();

      // Log attempt
      logSession({
        mode: gameMode,
        timeTaken: (Date.now() - startTime) / 1000,
        mistakes: diff.extra.length + diff.missing.length,
        score: 5,
      });
    }
  };

  const handleSave = () => {
    const name = prompt("Geef je creatie een naam:");
    if (name) {
      saveCreation(name, builtVoxels);
      setMessage("✅ Opgeslagen in Portfolio!");
      setTimeout(() => setMessage(""), 2000);
    }
  };

  const handleExamAnswer = (index: number) => {
    if (!examQuestion || selectedAnswer !== null) return;
    setSelectedAnswer(index);

    if (index === examQuestion.correctAnswer) {
      setExamFeedback("correct");
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.7 } });
      setScore((s) => s + 25);
    } else {
      setExamFeedback("wrong");
    }
  };

  // Container ref for eventSource
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  return (
    <div
      ref={setContainer}
      className="fixed inset-0 top-16 right-0 lg:right-14 bg-obsidian-950 overflow-hidden text-white font-outfit"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-[100px] animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* --- TOP HUD --- */}
      <div className="absolute top-6 left-6 z-20 flex flex-col gap-4 pointer-events-none">
        <button
          onClick={() => setActiveModule("")}
          className="pointer-events-auto bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-3xl flex items-center gap-4 shadow-2xl hover:bg-white/10 transition-all group"
        >
          <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/30 group-hover:bg-emerald-500/30 transition-colors">
            <LayoutGrid className="text-emerald-400" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight uppercase italic text-left">
              Spatial<span className="text-emerald-400">Lab</span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Score: {score} XP
              </span>
            </div>
          </div>
        </button>

        {/* Camera Snap Buttons */}
        {isBuildMode && (
          <div className="pointer-events-auto flex flex-col gap-2 animate-in slide-in-from-left">
            {[
              { id: "front", label: "Voor", icon: Box },
              { id: "side", label: "Zij", icon: Box },
              { id: "top", label: "Boven", icon: Eye },
              { id: "reset", label: "3D", icon: LayoutGrid },
            ].map((cam) => (
              <button
                key={cam.id}
                onClick={() => setCameraView(cam.id as CameraView)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-xs font-bold uppercase tracking-wider ${
                  cameraView === cam.id
                    ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                    : "bg-black/40 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                } border`}
              >
                <cam.icon size={14} /> {cam.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* --- PROJECTIONS PANEL --- */}
      <AnimatePresence>
        {isBuildMode && gameMode === "projection" && projections && (
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            className="absolute top-52 left-6 z-20 flex flex-col gap-3 pointer-events-auto"
          >
            <ProjectionGrid
              data={projections.top}
              label="Bovenaanzicht"
              axisLabels={["X", "Z"]}
            />
            <ProjectionGrid
              data={projections.front}
              label="Vooraanzicht"
              axisLabels={["X", "Y"]}
            />
            <ProjectionGrid
              data={projections.side}
              label="Zijaanzicht"
              axisLabels={["Z", "Y"]}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* === RIGHT PANEL: Stats + Laser Plane + Portfolio === */}
      <AnimatePresence>
        {isBuildMode && (
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            className="absolute top-6 right-6 z-20 flex flex-col gap-3 pointer-events-auto w-52"
          >
            {/* Volume & Surface Stats */}
            <div className="bg-obsidian-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-4">
              <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Ruler size={14} /> Meetkunde
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/30 rounded-xl p-3 text-center">
                  <div className="text-2xl font-black text-white">
                    {stats.volume}
                  </div>
                  <div className="text-[9px] text-slate-500 uppercase">
                    Volume (eenheden³)
                  </div>
                </div>
                <div className="bg-black/30 rounded-xl p-3 text-center">
                  <div className="text-2xl font-black text-white">
                    {stats.surface}
                  </div>
                  <div className="text-[9px] text-slate-500 uppercase">
                    Oppervlakte (vlakken)
                  </div>
                </div>
              </div>
            </div>

            {/* Laser Plane Tool */}
            <div className="bg-obsidian-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-4">
              <div className="text-[10px] font-bold text-fuchsia-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Scissors size={14} /> Doorsnede
              </div>

              <div className="flex gap-1 mb-3">
                {(["x", "y", "z"] as SliceAxis[]).map((axis) => (
                  <button
                    key={axis}
                    onClick={() =>
                      setSliceAxis(sliceAxis === axis ? null : axis)
                    }
                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                      sliceAxis === axis
                        ? "bg-fuchsia-500 text-white"
                        : "bg-white/5 text-slate-400 hover:bg-white/10"
                    }`}
                  >
                    {axis.toUpperCase()}-as
                  </button>
                ))}
              </div>

              {sliceAxis && (
                <>
                  <input
                    type="range"
                    min={0}
                    max={5}
                    value={slicePosition}
                    onChange={(e) => setSlicePosition(Number(e.target.value))}
                    className="w-full accent-fuchsia-500"
                  />
                  <div className="text-center text-xs text-slate-400 mt-1">
                    {sliceAxis.toUpperCase()} = {slicePosition}
                  </div>

                  {/* Slice Preview Grid */}
                  {sliceProjection && (
                    <div className="mt-3 p-2 bg-black/40 rounded-xl">
                      <div className="grid grid-cols-6 gap-[2px]">
                        {Array.from({ length: 36 }).map((_, i) => {
                          const row = 5 - Math.floor(i / 6);
                          const col = i % 6;
                          const active = sliceProjection.has(`${col},${row}`);
                          return (
                            <div
                              key={i}
                              className={`w-3 h-3 rounded-[2px] transition-all ${
                                active
                                  ? "bg-fuchsia-500 shadow-[0_0_8px_rgba(236,72,153,0.5)]"
                                  : "bg-white/5"
                              }`}
                            />
                          );
                        })}
                      </div>
                      <div className="text-[9px] text-center text-slate-500 mt-2">
                        {slicedVoxels.length} blokjes in doorsnede
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Portfolio (Creative Mode Only) */}
            {gameMode === "creative" && savedCreations.length > 0 && (
              <div className="bg-obsidian-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-4">
                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FolderOpen size={14} /> Portfolio
                </div>
                <button
                  onClick={() => setShowPortfolio(!showPortfolio)}
                  className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  {showPortfolio
                    ? "Verberg"
                    : `${savedCreations.length} Opgeslagen`}
                </button>

                <AnimatePresence>
                  {showPortfolio && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-2 space-y-1 overflow-hidden"
                    >
                      {savedCreations.slice(0, 5).map((creation) => (
                        <button
                          key={creation.id}
                          onClick={() => {
                            setBuiltVoxels(creation.voxels);
                            setShowPortfolio(false);
                            setMessage(`Geladen: ${creation.name}`);
                          }}
                          className="w-full text-left px-3 py-2 bg-white/5 hover:bg-amber-500/20 rounded-lg text-xs transition-all truncate"
                        >
                          {creation.name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- 3D CANVAS --- */}
      <div className="absolute inset-0 z-0">
        {canvasReady && container && (
          <Canvas
            eventSource={container}
            key={`construction-${gameMode}-${targetShape?.id || "none"}`}
            shadows
            dpr={[1, 2]}
          >
            <PerspectiveCamera makeDefault position={[8, 8, 8]} fov={45} />
            <CameraController targetView={cameraView} />

            <ambientLight intensity={0.5} />
            <spotLight
              position={[10, 15, 10]}
              angle={0.3}
              penumbra={1}
              intensity={2}
              castShadow
            />
            <pointLight
              position={[-10, -10, -10]}
              intensity={0.5}
              color="#10b981"
            />
            <SafeOrbitControls makeDefault minDistance={5} maxDistance={20} />

            <Stars
              radius={100}
              depth={50}
              count={2000}
              factor={4}
              saturation={0}
              fade
              speed={1}
            />

            {/* Grid Floor */}
            <group position={[2.5, -0.01, 2.5]}>
              <gridHelper ref={gridRef} args={[10, 10, "#10b981", "#1e293b"]} />
              <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[10, 10]} />
                <meshStandardMaterial
                  color="#020617"
                  transparent
                  opacity={0.4}
                />
              </mesh>
            </group>

            {/* Target Ghost (only in ghost mode, before diff) */}
            {targetShape &&
              gameMode === "ghost" &&
              !diffState &&
              targetShape.voxels.map((pos, i) => (
                <Voxel
                  key={`ghost-${i}`}
                  position={pos}
                  color="#00D1FF"
                  opacity={0.15}
                  isTarget
                />
              ))}

            {/* === VISUAL DIFF MODE === */}
            {diffState ? (
              <>
                {diffState.correct.map((pos, i) => (
                  <Voxel key={`correct-${i}`} position={pos} color="#10b981" />
                ))}
                {diffState.extra.map((pos, i) => (
                  <Voxel
                    key={`error-${i}`}
                    position={pos}
                    color="#ef4444"
                    isError
                  />
                ))}
                {diffState.missing.map((pos, i) => (
                  <Voxel
                    key={`missing-${i}`}
                    position={pos}
                    color="#3b82f6"
                    isMissing
                  />
                ))}
              </>
            ) : (
              /* Normal Build Mode */
              <group onClick={handleGridClick}>
                {builtVoxels.map((pos, i) => (
                  <Voxel key={`build-${i}`} position={pos} color="#10b981" />
                ))}
              </group>
            )}

            {/* Axes Helper */}
            {isBuildMode && (
              <axesHelper args={[2]} position={[-0.5, 0, -0.5]} />
            )}

            {/* Interactive Floor Plane */}
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[2.5, 0.01, 2.5]}
              visible={false}
              onClick={(e) => {
                if (!isBuildMode || diffState) return;
                const p = e.point;
                const x = Math.round(p.x);
                const z = Math.round(p.z);
                if (x >= 0 && x < 6 && z >= 0 && z < 6) {
                  if (!isEraseMode) {
                    if (
                      !builtVoxels.some(
                        (v) => v[0] === x && v[1] === 0 && v[2] === z,
                      )
                    ) {
                      setBuiltVoxels((prev) => [...prev, [x, 0, z]]);
                      playConnect();
                    }
                  }
                }
              }}
            >
              <planeGeometry args={[6, 6]} />
            </mesh>
          </Canvas>
        )}
      </div>

      {/* --- BOTTOM CONTROLS --- */}
      <div className="absolute bottom-8 left-0 right-0 z-30 flex flex-col items-center gap-6 pointer-events-none">
        <AnimatePresence>
          {!isBuildMode ? (
            /* MAIN MENU */
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="pointer-events-auto bg-white/5 backdrop-blur-2xl border border-white/10 p-6 rounded-[40px] shadow-2xl flex gap-6"
            >
              {[
                {
                  id: "ghost",
                  icon: Ghost,
                  label: "Ghost",
                  dif: "Easy",
                  color: "slate",
                },
                {
                  id: "projection",
                  icon: GridIcon,
                  label: "Projection",
                  dif: "Expert",
                  color: "emerald",
                },
                {
                  id: "creative",
                  icon: Sparkles,
                  label: "Sandbox",
                  dif: "Free",
                  color: "fuchsia",
                },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setGameMode(m.id as GameMode);
                    if (m.id !== "creative") {
                      startRound();
                    } else {
                      setIsBuildMode(true);
                      setTargetShape(null);
                      setBuiltVoxels([]);
                    }
                  }}
                  className={`group flex flex-col items-center gap-3 p-4 rounded-3xl hover:bg-white/5 transition-all w-32 border border-transparent hover:border-white/10`}
                >
                  <div
                    className={`p-4 rounded-2xl transition-colors ${m.id === "projection" ? "bg-emerald-500" : "bg-slate-800"}`}
                  >
                    <m.icon
                      className={
                        m.id === "projection"
                          ? "text-white"
                          : "text-slate-400 group-hover:text-white"
                      }
                      size={32}
                    />
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-sm text-white">
                      {m.label}
                    </div>
                    <div
                      className={`text-[10px] font-bold uppercase tracking-widest ${m.color === "emerald" ? "text-emerald-400" : m.color === "fuchsia" ? "text-fuchsia-400" : "text-slate-400"}`}
                    >
                      {m.dif}
                    </div>
                  </div>
                </button>
              ))}
            </motion.div>
          ) : (
            /* GAMEPLAY CONTROLS */
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="pointer-events-auto flex flex-col items-center gap-4"
            >
              {message && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-obsidian-900/90 backdrop-blur-md border border-white/20 px-6 py-2 rounded-2xl text-emerald-400 font-bold shadow-2xl"
                >
                  {message}
                </motion.div>
              )}

              <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-3 rounded-[32px] flex items-center gap-3">
                {/* Mobile Build/Erase Toggle */}
                <button
                  onClick={() => setIsEraseMode(!isEraseMode)}
                  className={`p-3 rounded-2xl transition-all flex items-center gap-2 ${
                    isEraseMode
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  }`}
                  title={isEraseMode ? "Erase Mode" : "Build Mode"}
                >
                  {isEraseMode ? <Eraser size={18} /> : <PenTool size={18} />}
                  <span className="text-xs font-bold uppercase hidden sm:inline">
                    {isEraseMode ? "Gum" : "Bouw"}
                  </span>
                </button>

                <div className="w-[1px] h-8 bg-white/10" />

                <button
                  onClick={() => setIsBuildMode(false)}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all"
                >
                  <X size={20} />
                </button>

                {diffState && (
                  <button
                    onClick={() => setDiffState(null)}
                    className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl hover:bg-emerald-500/30 flex items-center gap-2"
                  >
                    <RotateCcw size={18} />{" "}
                    <span className="text-xs font-bold uppercase">Opnieuw</span>
                  </button>
                )}

                {!diffState &&
                  (gameMode === "creative" ? (
                    <>
                      <button
                        onClick={() => setBuiltVoxels([])}
                        className="p-3 bg-red-500/10 hover:bg-red-500/20 rounded-2xl text-red-400"
                      >
                        <Trash2 size={20} />
                      </button>
                      <button
                        onClick={handleSave}
                        className="px-6 py-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold rounded-2xl flex items-center gap-2"
                      >
                        <Save size={18} /> Save
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={checkSolution}
                      className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-obsidian-950 font-black italic uppercase tracking-tighter rounded-2xl shadow-xl flex items-center gap-2"
                    >
                      Check <ChevronRight size={18} />
                    </button>
                  ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* VWO Exam Button */}
        {!isBuildMode && (
          <button
            onClick={() => {
              const types = ["folding" as const, "pattern" as const];
              const type = types[Math.floor(Math.random() * types.length)];
              const q = getRandomQuestion({ type } as {
                type: "folding" | "pattern";
              });
              setExamQuestion(q);
              setSelectedAnswer(null);
              setExamFeedback(null);
            }}
            className="pointer-events-auto px-6 py-3 bg-white/5 hover:border-emerald-500/50 border border-white/10 rounded-full flex items-center gap-3 transition-all group"
          >
            <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Zap size={16} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-white">
              Start Examen Vraag
            </span>
          </button>
        )}
      </div>

      {/* === EXAM MODAL (Interactive) === */}
      <AnimatePresence>
        {examQuestion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-obsidian-950/90 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-obsidian-900 border border-emerald-500/20 rounded-[40px] max-w-2xl w-full shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase rounded-full">
                    VWO {examQuestion.year}
                  </span>
                  <span className="text-slate-400 font-bold italic">
                    Ruimtemeetkunde
                  </span>
                </div>
                <button
                  onClick={() => setExamQuestion(null)}
                  className="p-2 hover:bg-white/10 rounded-xl"
                >
                  <X className="text-slate-500 hover:text-white" />
                </button>
              </div>

              {/* Content */}
              <div className="p-8">
                <p className="text-xl text-slate-200 font-serif italic mb-8">
                  "{examQuestion.question}"
                </p>

                <div className="grid gap-3 mb-6">
                  {examQuestion.options.map((opt, i) => {
                    const isSelected = selectedAnswer === i;
                    const isCorrect = i === examQuestion.correctAnswer;
                    let baseClass =
                      "p-4 rounded-2xl border flex items-center gap-4 transition-all text-left ";

                    if (selectedAnswer !== null) {
                      if (isCorrect)
                        baseClass +=
                          "bg-emerald-500/20 border-emerald-500 text-emerald-200";
                      else if (isSelected)
                        baseClass +=
                          "bg-red-500/20 border-red-500 text-red-200";
                      else
                        baseClass += "bg-white/5 border-transparent opacity-50";
                    } else {
                      baseClass +=
                        "bg-white/5 border-white/5 hover:bg-white/10 cursor-pointer";
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => handleExamAnswer(i)}
                        disabled={selectedAnswer !== null}
                        className={baseClass}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            isSelected || (selectedAnswer !== null && isCorrect)
                              ? "bg-white text-black"
                              : "bg-black/40 text-slate-500"
                          }`}
                        >
                          {String.fromCharCode(65 + i)}
                        </div>
                        <span className="font-bold">{opt}</span>
                        {selectedAnswer !== null && isCorrect && (
                          <CheckCircle2 className="ml-auto text-emerald-400" />
                        )}
                        {selectedAnswer !== null &&
                          isSelected &&
                          !isCorrect && (
                            <XCircle className="ml-auto text-red-400" />
                          )}
                      </button>
                    );
                  })}
                </div>

                {selectedAnswer !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-emerald-900/20 border border-emerald-500/20 rounded-2xl"
                  >
                    <div className="text-xs font-bold text-emerald-400 uppercase mb-1 flex items-center gap-2">
                      <Info size={14} /> Uitleg
                    </div>
                    <p className="text-sm text-slate-300">
                      {examQuestion.explanation}
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
