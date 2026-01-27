/* eslint-disable no-case-declarations */
/* eslint-disable react-hooks/purity */
/* eslint-disable @typescript-eslint/no-explicit-any -- THREE.js and transient state updates */
// Zorg dat je deze library hebt: npm install @react-three/csg
import { Base, Geometry, Subtraction } from "@react-three/csg";
import { Edges, PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useCanvasReady } from "@shared/hooks/useCanvasReady";
import {
  ArrowUpRight,
  BrainCircuit,
  Check,
  Layers,
  MousePointer2,
  Play,
  RotateCcw,
  Scissors,
  Sliders,
} from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import * as THREE from "three";

import geometryExams from "../../data/geometryExams.json";
import { useSpatialStore } from "../../stores/spatialStore";

// --- Types ---
type ShapeType = "cube" | "pyramid" | "cylinder" | "prism";
type CrossSectionShape =
  | "square"
  | "rectangle"
  | "triangle"
  | "hexagon"
  | "circle"
  | "ellipse"
  | "pentagon";

const mapExamToChallenge = (exam: any): Challenge => {
  // Map JSON objectType to internal ShapeType
  let shape: ShapeType = "cube";
  if (exam.objectType === "pyramid") shape = "pyramid";
  if (exam.objectType === "cylinder") shape = "cylinder"; // JSON might use 'cylinder'
  if (exam.objectType === "prism") shape = "prism";

  // Determine target cross section based on difficulty or description logic
  // For now, we manually map specific exam IDs to known correct answers if they aren't explicit in JSON
  let target: CrossSectionShape = "square";
  let hint = exam.description;

  if (exam.id === "vwo2018-II-4") {
    target = "hexagon";
    hint = "Tip: Het vlak gaat door 3 punten, snijd flink schuin.";
  } else if (exam.id === "vwo2021-I-12") {
    target = "triangle";
    hint = "Tip: Een vlak door de top en het grondvlak.";
  } else if (exam.objectType === "cube") {
    target = "square";
  }

  return {
    shapeType: shape,
    targetCrossSection: target,
    hint: hint,
  };
};

interface Challenge {
  shapeType: ShapeType;
  targetCrossSection: CrossSectionShape;
  hint: string;
}

import { SafeOrbitControls } from "../SafeOrbitControls";

const SHAPE_COLORS = {
  cube: "#3b82f6",
  pyramid: "#f59e0b",
  cylinder: "#10b981",
  prism: "#8b5cf6",
};

// --- SUB-COMPONENT: RealSlicer (CSG) ---
const RealSlicerShape = ({
  shapeType,
  rotation,
  position,
  showCut,
}: {
  shapeType: ShapeType;
  rotation: [number, number, number];
  position: number;
  showCut: boolean;
}) => {
  // Basis geometrie selectie
  const getBaseGeometry = () => {
    switch (shapeType) {
      case "cube":
        return <boxGeometry args={[2, 2, 2]} />;
      case "cylinder":
        return <cylinderGeometry args={[1, 1, 2.5, 32]} />;
      case "pyramid":
        return <coneGeometry args={[1.5, 2.5, 4]} />;
      case "prism":
        const shape = new THREE.Shape();
        shape.moveTo(-1, -1);
        shape.lineTo(1, -1);
        shape.lineTo(0, 1);
        shape.closePath();
        return (
          <extrudeGeometry args={[shape, { depth: 2, bevelEnabled: false }]} />
        );
      default:
        return <boxGeometry args={[2, 2, 2]} />;
    }
  };

  // Correctie rotatie om figuren rechtop te zetten
  const baseRotation: [number, number, number] =
    shapeType === "prism"
      ? [Math.PI / 2, 0, 0]
      : shapeType === "pyramid"
        ? [0, Math.PI / 4, 0]
        : [0, 0, 0];

  return (
    <mesh castShadow receiveShadow rotation={baseRotation}>
      <Geometry useGroups>
        <Base>{getBaseGeometry()}</Base>
        {showCut && (
          <Subtraction position={[0, position + 2.5, 0]} rotation={rotation}>
            <boxGeometry args={[8, 5, 8]} />
          </Subtraction>
        )}
      </Geometry>
      {/* Materiaal 0: Buitenkant */}
      <meshStandardMaterial
        color={SHAPE_COLORS[shapeType]}
        transparent
        opacity={0.8}
        roughness={0.1}
        metalness={0.1}
      />
      {/* Materiaal 1: Snijvlak (Glow) */}
      <meshStandardMaterial
        attach="material-1"
        color="#fbbf24"
        emissive="#fbbf24"
        emissiveIntensity={0.6}
        roughness={0.5}
      />
      <Edges threshold={15} color="white" opacity={0.5} />
    </mesh>
  );
};

// --- SUB-COMPONENT: VectorControls ---
const VectorControls = ({
  rotation,
  onUpdate,
}: {
  rotation: [number, number, number];
  onUpdate: (rot: [number, number, number]) => void;
}) => {
  // We converteren de huidige rotatie terug naar een normaalvector voor weergave
  const normal = useMemo(() => {
    const euler = new THREE.Euler(...rotation);
    const vec = new THREE.Vector3(0, 1, 0).applyEuler(euler);
    return vec;
  }, [rotation]);

  const handleChange = (axis: "x" | "y" | "z", val: string) => {
    const num = parseFloat(val) || 0;
    const newVec = normal.clone();
    if (axis === "x") newVec.x = num;
    if (axis === "y") newVec.y = num;
    if (axis === "z") newVec.z = num;

    // Convert back to Euler
    newVec.normalize();
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      newVec,
    );
    const e = new THREE.Euler().setFromQuaternion(quaternion);
    onUpdate([e.x, e.y, e.z]);
  };

  return (
    <div className="bg-black/40 p-4 rounded-xl border border-white/10 space-y-3">
      <h4 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
        <ArrowUpRight size={14} className="text-purple-400" /> Vlak
        Normaalvector
      </h4>
      <div className="grid grid-cols-3 gap-2">
        {["x", "y", "z"].map((axis) => (
          <div key={axis}>
            <label className="text-[9px] text-slate-500 uppercase font-bold pl-1">
              n_{axis}
            </label>
            <input
              type="number"
              step="0.1"
              max="1"
              min="-1"
              value={normal[axis as "x" | "y" | "z"].toFixed(2)}
              onChange={(e) =>
                handleChange(axis as "x" | "y" | "z", e.target.value)
              }
              className="w-full bg-black/60 border border-white/10 rounded px-2 py-1 text-xs text-white font-mono focus:border-purple-500 outline-none"
            />
          </div>
        ))}
      </div>
      <div className="text-[9px] text-slate-500 italic">
        Definieer het vlak via{" "}
        {"$\\vec{n} = \\begin{pmatrix} a \\\\ b \\\\ c \\end{pmatrix}$"}
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: Blueprint 2D View ---
const BlueprintView = ({ currentShape }: { currentShape: string }) => {
  // Simpele visualisatie van de gedetecteerde vorm op "millimeterpapier"
  const getPath = () => {
    const style = {
      stroke: "#10b981",
      strokeWidth: 1.5,
      fill: "rgba(16, 185, 129, 0.2)",
    };
    switch (currentShape) {
      case "square":
        return <rect x="30" y="30" width="40" height="40" {...style} />;
      case "rectangle":
        return <rect x="20" y="35" width="60" height="30" {...style} />;
      case "circle":
        return <circle cx="50" cy="50" r="30" {...style} />;
      case "ellipse":
        return <ellipse cx="50" cy="50" rx="35" ry="20" {...style} />;
      case "triangle":
        return <polygon points="50,20 80,80 20,80" {...style} />;
      case "hexagon":
        return (
          <polygon points="50,20 80,35 80,65 50,80 20,65 20,35" {...style} />
        );
      default:
        return (
          <text x="50" y="55" textAnchor="middle" fill="white" fontSize="10">
            ?
          </text>
        );
    }
  };

  return (
    <div className="w-full h-32 bg-slate-900 rounded-xl border border-white/10 overflow-hidden relative mt-4">
      {/* Grid Background */}
      <svg width="100%" height="100%" className="absolute inset-0 opacity-20">
        <defs>
          <pattern
            id="grid"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="white"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      <div className="absolute top-2 left-2 text-[9px] font-bold text-slate-400 uppercase bg-black/50 px-2 py-1 rounded">
        Ware Grootte (2D)
      </div>
      <svg viewBox="0 0 100 100" className="w-full h-full p-4">
        {getPath()}
      </svg>
    </div>
  );
};

// --- Detection Logic ---
const detectCrossSection = (
  shape: ShapeType,
  rotX: number,
  rotY: number,
  pos: number,
): CrossSectionShape => {
  const absX = Math.abs(rotX);
  const absY = Math.abs(rotY);

  // Basis logica (kan verder verfijnd worden met echte wiskunde)
  if (shape === "cube") {
    if (absX < 0.1 && absY < 0.1) return "square";
    if (absX > 0.6 && absY > 0.6 && Math.abs(pos) < 0.2) return "hexagon";
    return "rectangle";
  }
  if (shape === "pyramid") {
    if (absX < 0.2 && pos < 0.5) return "square";
    if (absX > 1.0) return "triangle";
    return "rectangle"; // Trapezium
  }
  if (shape === "cylinder") {
    if (absX < 0.1) return "circle";
    if (absX > 1.2) return "rectangle";
    return "ellipse";
  }
  if (shape === "prism") {
    if (absX < 0.1) return "rectangle";
    if (absX > 1.2) return "triangle";
    return "rectangle";
  }
  return "square";
};

// --- MAIN COMPONENT ---
export const DynamicSlicer: React.FC = () => {
  const { canvasReady } = useCanvasReady(150);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  // Store Connection
  const { logSlicerAttempt } = useSpatialStore();

  // Game State
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [gameStarted, setGameStarted] = useState(false);

  // Controls
  const [rotation, setRotation] = useState<[number, number, number]>([0, 0, 0]); // Nu 3D!
  const [planePos, setPlanePos] = useState(0);
  const [mode, setMode] = useState<"sliders" | "vectors">("sliders"); // Toggle
  const [showCut, setShowCut] = useState(false); // Voor de 'reveal'

  // Metrics
  const [startTime, setStartTime] = useState(Date.now());

  const currentShape = useMemo(
    () =>
      challenge
        ? detectCrossSection(
            challenge.shapeType,
            rotation[0],
            rotation[1],
            planePos,
          )
        : null,
    [challenge, rotation, planePos],
  );

  const generateChallenge = useCallback(() => {
    // Mix of hardcoded basics and real exams
    const useRealExam = Math.random() > 0.5;

    if (useRealExam) {
      const randomExam =
        geometryExams[Math.floor(Math.random() * geometryExams.length)];
      setChallenge(mapExamToChallenge(randomExam));
    } else {
      // Fallback to basic training
      const validChallenges: Challenge[] = [
        {
          shapeType: "cube",
          targetCrossSection: "square",
          hint: "Snijd recht (horizontaal).",
        },
        {
          shapeType: "cube",
          targetCrossSection: "hexagon",
          hint: "Snijd door het midden, schuin door alle vlakken.",
        },
        {
          shapeType: "cylinder",
          targetCrossSection: "ellipse",
          hint: "Snijd schuin door de cilinder.",
        },
        {
          shapeType: "pyramid",
          targetCrossSection: "square",
          hint: "Snijd horizontaal onder de top.",
        },
        {
          shapeType: "prism",
          targetCrossSection: "triangle",
          hint: "Snijd loodrecht op de lengte-as.",
        },
      ];
      setChallenge(
        validChallenges[Math.floor(Math.random() * validChallenges.length)]!,
      );
    }

    setRotation([0, 0, 0]);
    setPlanePos(0);
    setFeedback(null);
    setShowCut(false);
    setStartTime(Date.now());
  }, []);

  const startGame = () => {
    setGameStarted(true);
    setScore(0);
    setRound(1);

    generateChallenge();
  };

  const checkAnswer = () => {
    if (!challenge || feedback) return;

    const isCorrect = currentShape === challenge.targetCrossSection;
    const timeSpent = (Date.now() - startTime) / 1000;

    logSlicerAttempt({
      shapeType: challenge.shapeType,
      targetShape: challenge.targetCrossSection,
      achievedShape: currentShape || "unknown",
      correct: isCorrect,
      timeTaken: timeSpent,
      rotations: { x: rotation[0], y: rotation[1] },
    });

    if (isCorrect) {
      setFeedback("correct");
      setScore((s) => s + 100);
      setShowCut(true); // REVEAL! Snijd het object door
    } else {
      setFeedback("wrong");
    }

    setTimeout(() => {
      if (round >= 5) {
        // Return to menu or similar
        setGameStarted(false);
      } else {
        setRound((r) => r + 1);
        generateChallenge();
      }
    }, 3000); // Iets langer wachten om de cut te bewonderen
  };

  // Helper voor sliders (update alleen X en Y van de rotation array)
  const handleSliderChange = (axis: 0 | 1 | 2, val: number) => {
    const newRot = [...rotation] as [number, number, number];
    newRot[axis] = val;
    setRotation(newRot);
  };

  if (!gameStarted)
    return (
      <div className="h-full flex items-center justify-center bg-obsidian-950 text-white">
        <div className="text-center space-y-6">
          <Scissors className="w-20 h-20 text-cyan-400 mx-auto" />
          <h1 className="text-4xl font-bold">Slicer Challenge</h1>
          <p className="text-slate-400">
            VWO Niveau: Gebruik vectoren of sliders.
          </p>
          <button
            onClick={startGame}
            className="px-8 py-4 mt-2 rounded-xl border border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-400 font-bold tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-3 mx-auto group hover:border-cyan-500/60 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:text-cyan-300"
          >
            <Play
              className="fill-current opacity-80 group-hover:scale-110 transition-all"
              size={20}
            />{" "}
            Start Training
          </button>
        </div>
      </div>
    );

  return (
    <div
      ref={setContainer}
      className="h-full flex flex-col bg-obsidian-950 text-white relative"
    >
      {/* Header Stats */}
      <div className="absolute top-4 left-4 right-4 flex justify-between z-10 pointer-events-none">
        <div className="bg-black/50 px-4 py-2 rounded-full border border-white/10 font-bold backdrop-blur-md">
          Ronde <span className="text-cyan-400">{round}/5</span>
        </div>
        <div className="bg-black/50 px-4 py-2 rounded-full border border-white/10 font-bold backdrop-blur-md">
          Score: <span className="text-emerald-400">{score}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row pt-16">
        {/* 3D View */}
        <div className="flex-1 relative">
          {challenge && canvasReady && container && (
            <Canvas eventSource={container} shadows dpr={[1, 2]}>
              <PerspectiveCamera makeDefault position={[5, 4, 5]} />
              <ambientLight intensity={0.5} />
              <directionalLight
                position={[10, 10, 5]}
                intensity={1.5}
                castShadow
              />

              {/* De echte CSG Slicer */}
              <RealSlicerShape
                shapeType={challenge.shapeType}
                rotation={rotation}
                position={planePos}
                showCut={showCut}
              />

              {/* Het snijvlak (alleen zichtbaar als we niet snijden) */}
              {!showCut && (
                <group position={[0, planePos, 0]} rotation={rotation}>
                  <mesh>
                    <planeGeometry args={[5, 5]} />
                    <meshBasicMaterial
                      color="#06b6d4"
                      transparent
                      opacity={0.2}
                      side={THREE.DoubleSide}
                    />
                    <Edges color="#06b6d4" />
                  </mesh>
                  <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.02, 0.02, 1]} />
                    <meshBasicMaterial color="#06b6d4" />
                  </mesh>
                </group>
              )}

              <SafeOrbitControls enableZoom={true} />
            </Canvas>
          )}

          {/* Controls Overlay */}
          <div className="absolute bottom-6 left-6 right-6 lg:w-96 bg-black/70 backdrop-blur-md p-4 rounded-xl border border-white/10 space-y-4 animate-in slide-in-from-bottom">
            {/* Toggle Mode */}
            <div className="flex bg-black/40 p-1 rounded-lg border border-white/5 mb-2">
              <button
                onClick={() => setMode("sliders")}
                className={`flex-1 text-xs font-bold py-1.5 rounded flex items-center justify-center gap-2 ${mode === "sliders" ? "bg-cyan-600 text-white" : "text-slate-400"}`}
              >
                <Sliders size={12} /> Sliders
              </button>
              <button
                onClick={() => setMode("vectors")}
                className={`flex-1 text-xs font-bold py-1.5 rounded flex items-center justify-center gap-2 ${mode === "vectors" ? "bg-purple-600 text-white" : "text-slate-400"}`}
              >
                <MousePointer2 size={12} /> Vectoren
              </button>
            </div>

            {mode === "sliders" ? (
              <>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400 uppercase font-bold">
                    <span>Kantelen X</span>{" "}
                    <span>{(rotation[0] * 57.29).toFixed(0)}°</span>
                  </div>
                  <input
                    type="range"
                    min={-1.6}
                    max={1.6}
                    step={0.1}
                    value={rotation[0]}
                    onChange={(e) =>
                      handleSliderChange(0, parseFloat(e.target.value))
                    }
                    className="w-full accent-cyan-400"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400 uppercase font-bold">
                    <span>Kantelen Y</span>{" "}
                    <span>{(rotation[1] * 57.29).toFixed(0)}°</span>
                  </div>
                  <input
                    type="range"
                    min={-1.6}
                    max={1.6}
                    step={0.1}
                    value={rotation[1]}
                    onChange={(e) =>
                      handleSliderChange(1, parseFloat(e.target.value))
                    }
                    className="w-full accent-cyan-400"
                  />
                </div>
              </>
            ) : (
              <VectorControls rotation={rotation} onUpdate={setRotation} />
            )}

            <div className="space-y-1 pt-2 border-t border-white/10">
              <div className="flex justify-between text-xs text-slate-400 uppercase font-bold">
                <span className="flex items-center gap-1">
                  <Layers size={12} /> Hoogte (Z)
                </span>
                <span>{planePos.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min={-1.5}
                max={1.5}
                step={0.1}
                value={planePos}
                onChange={(e) => setPlanePos(parseFloat(e.target.value))}
                className="w-full accent-emerald-400"
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-80 bg-obsidian-900 border-l border-white/10 p-6 flex flex-col">
          <div className="mb-4">
            <h3 className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-2">
              Opdracht
            </h3>
            <p className="text-xl font-bold leading-tight">
              Maak een{" "}
              <span className="text-cyan-400 block text-2xl mt-1">
                {challenge?.targetCrossSection}
              </span>
            </p>
            <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/5 text-xs text-slate-300">
              <BrainCircuit className="inline w-3 h-3 mr-2 text-amber-400" />
              {challenge?.hint}
            </div>
          </div>

          <BlueprintView currentShape={currentShape || ""} />

          <div className="mt-auto space-y-4 pt-4">
            <div className="text-center p-3 bg-black/30 rounded-xl border border-white/5">
              <div className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider">
                Huidige Detectie
              </div>
              <div
                className={`text-lg font-mono font-bold ${currentShape === challenge?.targetCrossSection ? "text-emerald-400" : "text-slate-400"}`}
              >
                {currentShape || "?"}
              </div>
            </div>

            <button
              onClick={checkAnswer}
              disabled={!!feedback}
              className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all uppercase tracking-widest
                                ${
                                  feedback === "correct"
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                                    : feedback === "wrong"
                                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/50"
                                      : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                                }
                            `}
            >
              {feedback === "correct" ? (
                <Check size={20} />
              ) : feedback === "wrong" ? (
                <RotateCcw size={20} />
              ) : (
                <Scissors size={20} />
              )}
              {feedback === "correct"
                ? "Correct!"
                : feedback === "wrong"
                  ? "Helaas..."
                  : "Snijd Nu"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
