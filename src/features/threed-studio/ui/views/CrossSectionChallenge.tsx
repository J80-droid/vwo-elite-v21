/* eslint-disable react-hooks/purity */
/* eslint-disable @typescript-eslint/no-explicit-any -- game state and THREE types */
import { Base, Geometry, Subtraction } from "@react-three/csg";
import {
  ContactShadows,
  Edges,
  Grid,
  PerspectiveCamera,
} from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useCanvasReady } from "@shared/hooks/useCanvasReady";
import { AnimatePresence, motion } from "framer-motion";
import {
  BrainCircuit,
  CheckCircle2,
  Sliders,
  Trophy,
  XCircle,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

import { useSpatialStore } from "../../stores/spatialStore";
import { SafeOrbitControls } from "../SafeOrbitControls";

// --- Types ---
type ShapeType = "cube" | "cylinder" | "cone" | "pyramid" | "sphere";
type SliceType = "horizontal" | "vertical" | "diagonal";
type AnswerShape =
  | "square"
  | "rectangle"
  | "triangle"
  | "circle"
  | "ellipse"
  | "trapezoid"
  | "hexagon"
  | "pentagon"
  | "racket"
  | "point"
  | "parabola"
  | "sector"
  | "diamond";

interface Level {
  id: number;
  shape: ShapeType;
  slice: SliceType;
  correctAnswer: AnswerShape;
  angle: [number, number, number];
  defaultOffset: number;
  difficulty: "easy" | "medium" | "hard";
  options: AnswerShape[];
}

// --- Data: Levels ---
const LEVELS: Level[] = [
  {
    id: 1,
    shape: "cube",
    slice: "horizontal",
    correctAnswer: "square",
    angle: [Math.PI / 2, 0, 0],
    defaultOffset: 0,
    difficulty: "easy",
    options: ["square", "triangle", "circle", "rectangle"],
  },
  {
    id: 2,
    shape: "cylinder",
    slice: "horizontal",
    correctAnswer: "circle",
    angle: [Math.PI / 2, 0, 0],
    defaultOffset: 0,
    difficulty: "easy",
    options: ["circle", "ellipse", "rectangle", "square"],
  },
  {
    id: 3,
    shape: "cone",
    slice: "horizontal",
    correctAnswer: "circle",
    angle: [Math.PI / 2, 0, 0],
    defaultOffset: -0.5,
    difficulty: "easy",
    options: ["circle", "triangle", "ellipse", "point"],
  },
  {
    id: 4,
    shape: "cube",
    slice: "diagonal",
    correctAnswer: "rectangle",
    angle: [Math.PI / 4, 0, 0],
    defaultOffset: 0,
    difficulty: "medium",
    options: ["square", "rectangle", "triangle", "trapezoid"],
  },
  {
    id: 5,
    shape: "cylinder",
    slice: "diagonal",
    correctAnswer: "ellipse",
    angle: [Math.PI / 4, 0, 0],
    defaultOffset: 0,
    difficulty: "medium",
    options: ["circle", "ellipse", "parabola", "rectangle"],
  },
  {
    id: 6,
    shape: "cube",
    slice: "diagonal",
    correctAnswer: "hexagon",
    angle: [Math.atan(1 / Math.sqrt(2)), Math.PI / 4, 0],
    defaultOffset: 0,
    difficulty: "hard",
    options: ["square", "rectangle", "hexagon", "diamond"],
  },
];

// --- 2D Icon Helper ---
const ShapeIcon = ({
  shape,
  className,
  style,
}: {
  shape: AnswerShape;
  className?: string;
  style?: React.CSSProperties;
}) => {
  return (
    <div
      className={`w-8 h-8 flex items-center justify-center font-bold border-2 border-current rounded ${className}`}
      style={style}
    >
      {shape[0]!.toUpperCase()}
    </div>
  );
};

// --- 3D Scene Components ---

const SlicedMesh = ({
  level,
  sliceOffset,
  showCut,
}: {
  level: Level;
  sliceOffset: number;
  showCut: boolean;
}) => {
  // Geometrie basisvormen
  const getBaseGeometry = () => {
    switch (level.shape) {
      case "cube":
        return <boxGeometry args={[2, 2, 2]} />;
      case "cylinder":
        return <cylinderGeometry args={[1, 1, 2.5, 32]} />;
      case "cone":
        return <coneGeometry args={[1.2, 2.5, 32]} />;
      case "pyramid":
        return <coneGeometry args={[1.5, 2.5, 4]} />;
      case "sphere":
        return <sphereGeometry args={[1.2, 32, 32]} />;
      default:
        return <boxGeometry args={[1, 1, 1]} />;
    }
  };

  return (
    <mesh castShadow receiveShadow>
      {/* If showCut is true, we render the sliced geometry. If false, we render normal geometry. 
                 BUT we want to "ghost" the cut part optimally. 
                 Let's stick to simple CSG logic: Main object is solid. 
                 If showCut, we subtract. 
             */}
      <Geometry>
        <Base rotation={[0, Math.PI / 4, 0]}>{getBaseGeometry()}</Base>

        {showCut && (
          <Subtraction
            position={[0, sliceOffset + 2.5, 0]}
            rotation={level.angle}
          >
            <boxGeometry args={[8, 5, 8]} />
          </Subtraction>
        )}
      </Geometry>

      {/* Materiaal Buitenkant */}
      <meshStandardMaterial
        color="#6366f1"
        roughness={0.4}
        metalness={0.1}
        transparent
        opacity={0.9}
        side={THREE.DoubleSide}
      />

      {/* Materiaal Snijvlak (Binnenkant) - Fel oplichtend */}
      {showCut && (
        <meshStandardMaterial
          attach="material-1"
          color="#f43f5e"
          emissive="#f43f5e"
          emissiveIntensity={0.8}
          roughness={0.2}
        />
      )}

      <Edges threshold={15} color="#312e81" />
    </mesh>
  );
};

// De "Ghost" van het weggesneden stuk (optioneel voor didactische context)
const GhostPart = ({
  level,
  sliceOffset: _sliceOffset,
  visible,
}: {
  level: Level;
  sliceOffset: number;
  visible: boolean;
}) => {
  if (!visible) return null;

  // Simpele truck: Render de bovenkant van de slice?
  // Of gewoon het hele object in wireframe?
  // Laten we het hele object in wireframe renderen over de cut.

  /* 
       Complex CSG to show ONLY the cut part is heavy.
       Rendering the full object as wireframe is cheap and gives context.
    */

  const getBaseGeometry = () => {
    switch (level.shape) {
      case "cube":
        return <boxGeometry args={[2, 2, 2]} />;
      case "cylinder":
        return <cylinderGeometry args={[1, 1, 2.5, 32]} />;
      case "cone":
        return <coneGeometry args={[1.2, 2.5, 32]} />;
      case "pyramid":
        return <coneGeometry args={[1.5, 2.5, 4]} />;
      case "sphere":
        return <sphereGeometry args={[1.2, 32, 32]} />;
      default:
        return <boxGeometry args={[1, 1, 1]} />;
    }
  };

  return (
    <mesh rotation={[0, Math.PI / 4, 0]}>
      {getBaseGeometry()}
      <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.1} />
    </mesh>
  );
};

// Het visuele snijvlak (Plane) - Alleen zichtbaar als we NIET snijden, of als gids
const SlicePlane = ({
  level,
  offset,
  visible,
}: {
  level: Level;
  offset: number;
  visible: boolean;
}) => {
  return (
    <mesh
      rotation={new THREE.Euler(...level.angle)}
      position={[0, offset, 0]}
      visible={visible}
    >
      <planeGeometry args={[5, 5]} />
      <meshBasicMaterial
        color="#f43f5e"
        transparent
        opacity={0.2}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
      <Edges color="#be123c" />
    </mesh>
  );
};

// Camera Controller (Proof View)
const CameraController = ({
  shouldAlign,
  level,
}: {
  shouldAlign: boolean;
  level: Level;
}) => {
  const { camera, controls } = useThree();
  const targetPosRef = useRef<THREE.Vector3 | null>(null);

  useEffect(() => {
    if (shouldAlign) {
      const euler = new THREE.Euler(...level.angle);
      const normal = new THREE.Vector3(0, 1, 0).applyEuler(euler);
      targetPosRef.current = normal.multiplyScalar(6);
    } else {
      targetPosRef.current = null;
    }
  }, [shouldAlign, level]);

  useFrame((_state, delta) => {
    if (targetPosRef.current && controls) {
      camera.position.lerp(targetPosRef.current, 3 * delta);
      const ctrl = controls as any;
      ctrl.target.lerp(new THREE.Vector3(0, 0, 0), 3 * delta);
      ctrl.update();
    }
  });

  return null;
};

// --- Safe Orbit Controls ---

// --- Main Component ---
export const CrossSectionChallenge: React.FC = () => {
  const { canvasReady } = useCanvasReady(150);
  const { logAttempt, getWeaknesses } = useSpatialStore();
  const containerRef = useRef<HTMLDivElement>(null);

  // Game State
  const [levelIndex, setLevelIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<
    "playing" | "correct" | "wrong" | "finished"
  >("playing");
  const [feedback, setFeedback] = useState("");

  // Interactive State
  const [sliceOffset, setSliceOffset] = useState(0);
  const [showCut, setShowCut] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());

  const currentLevel = LEVELS[levelIndex] || LEVELS[0]!;

  useEffect(() => {
    setSliceOffset(currentLevel.defaultOffset);
    setShowCut(false);
    setGameState("playing");
    setFeedback("");
    setStartTime(Date.now());
  }, [levelIndex, currentLevel]);

  const handleAnswer = (shape: AnswerShape) => {
    if (gameState !== "playing") return;

    const isCorrect = shape === currentLevel.correctAnswer;
    const timeSpent = (Date.now() - startTime) / 1000;

    logAttempt({
      levelId: currentLevel.id,
      shape: currentLevel.shape,
      sliceType: currentLevel.slice,
      answerGiven: shape,
      timeTaken: timeSpent,
      correct: isCorrect,
    });

    if (isCorrect) {
      setScore((s) => s + 100);
      setGameState("correct");
      setFeedback("Correct! Kijk hoe het snijvlak exact overeenkomt.");
      setShowCut(true);
    } else {
      setGameState("wrong");
      setFeedback(
        `Helaas. De juiste doorsnede is een ${currentLevel.correctAnswer}.`,
      );
    }
  };

  const nextLevel = () => {
    if (levelIndex < LEVELS.length - 1) {
      setLevelIndex((prev) => prev + 1);
    } else {
      setGameState("finished");
    }
  };

  const restart = () => {
    setLevelIndex(0);
    setScore(0);
    setGameState("playing");
    setFeedback("");
    setStartTime(Date.now());
  };

  const weaknesses = getWeaknesses();

  return (
    <div className="h-[calc(100vh-6rem)] w-full flex flex-col md:flex-row gap-6 p-4 md:p-8 relative">
      {/* 3D Viewport */}
      <div
        ref={containerRef}
        className="flex-1 bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col"
      >
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
          <div className="flex gap-2">
            <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs font-mono text-slate-400">
              LEVEL {levelIndex + 1}/{LEVELS.length}
            </div>
            <div className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-bold uppercase">
              {currentLevel.difficulty}
            </div>
          </div>
          {weaknesses.length > 0 &&
            gameState === "playing" &&
            weaknesses.includes(currentLevel.slice) && (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-2 rounded-xl text-xs flex items-center gap-2 animate-in slide-in-from-left">
                <BrainCircuit size={14} />
                <span>
                  Tip: Je hebt moeite met {currentLevel.slice} snedes.
                </span>
              </div>
            )}
        </div>

        <div className="absolute top-4 right-4 z-10">
          <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-3">
            <Trophy size={18} className="text-yellow-400" />
            <span className="text-xl font-bold font-mono text-white">
              {score}
            </span>
          </div>
        </div>

        {/* SLIDER CONTROL - Always active for exploration */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 w-64 bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col gap-2">
          <div className="flex justify-between text-xs text-slate-400 font-bold uppercase">
            <span className="flex items-center gap-1">
              <Sliders size={12} /> Hoogte Snijvlak
            </span>
            <span>{sliceOffset.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="-1.5"
            max="1.5"
            step="0.1"
            value={sliceOffset}
            onChange={(e) => setSliceOffset(parseFloat(e.target.value))}
            className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        {canvasReady && containerRef.current && (
          <Canvas
            eventSource={containerRef.current}
            shadows
            gl={{ antialias: true }}
            dpr={[1, 2]}
          >
            <PerspectiveCamera makeDefault position={[4, 3, 5]} />
            <SafeOrbitControls
              makeDefault
              minPolarAngle={0}
              maxPolarAngle={Math.PI}
            />
            <CameraController
              shouldAlign={gameState === "correct"}
              level={currentLevel}
            />

            <ambientLight intensity={0.5} />
            <directionalLight
              position={[10, 10, 5]}
              intensity={1.5}
              castShadow
            />

            <group>
              <SlicedMesh
                level={currentLevel}
                sliceOffset={sliceOffset}
                showCut={showCut}
              />

              {/* Show ghost wireframe when cut is active to maintain context */}
              <GhostPart
                level={currentLevel}
                sliceOffset={sliceOffset}
                visible={showCut}
              />

              {/* Show plane helper when NOT cut (or make it subtle when cut) */}
              <SlicePlane
                level={currentLevel}
                offset={sliceOffset}
                visible={!showCut}
              />
            </group>

            <Grid
              infiniteGrid
              fadeDistance={20}
              sectionColor="#4f46e5"
              cellColor="#6366f1"
              position={[0, -2, 0]}
            />
            <ContactShadows
              opacity={0.5}
              scale={10}
              blur={2}
              far={4}
              resolution={256}
              color="#000000"
            />
          </Canvas>
        )}
      </div>

      {/* Sidebar Controls */}
      <div className="w-full md:w-96 flex flex-col gap-6">
        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <BrainCircuit size={24} className="text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold text-white">
              Doorsnede Challenge
            </h2>
          </div>
          <p className="text-slate-400 text-sm">
            Beweeg de slider om het snijvlak te verplaatsen. Welke vorm ontstaat
            er?
          </p>
        </div>

        {/* Options Grid */}
        <div className="flex-1">
          {gameState === "finished" ? (
            <div className="text-center p-8 bg-slate-900/50 rounded-3xl border border-white/5">
              <Trophy size={48} className="text-emerald-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white">Voltooid!</h3>
              <div className="text-4xl font-mono font-bold text-emerald-400 my-4">
                {score} XP
              </div>
              <button
                onClick={restart}
                className="w-full py-3 bg-white/10 rounded-xl font-bold"
              >
                Opnieuw
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {currentLevel.options.map((shape) => {
                const isCorrect = shape === currentLevel.correctAnswer;
                return (
                  <motion.button
                    key={shape}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAnswer(shape)}
                    disabled={gameState !== "playing"}
                    className={`
                                            p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all
                                            ${
                                              gameState === "playing"
                                                ? "border-white/5 bg-slate-900/40 hover:bg-slate-800 hover:border-white/20"
                                                : isCorrect
                                                  ? "border-emerald-500 bg-emerald-500/20 text-emerald-100"
                                                  : "border-white/5 opacity-50"
                                            }
                                        `}
                  >
                    <ShapeIcon shape={shape} />
                    <span className="text-xs font-bold uppercase">{shape}</span>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* Feedback */}
        <AnimatePresence>
          {gameState !== "playing" && gameState !== "finished" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl border ${gameState === "correct" ? "bg-emerald-500/10 border-emerald-500/20" : "bg-rose-500/10 border-rose-500/20"}`}
            >
              <div className="flex gap-3">
                {gameState === "correct" ? (
                  <CheckCircle2 className="text-emerald-400" />
                ) : (
                  <XCircle className="text-rose-400" />
                )}
                <div className="flex-1">
                  <p className="font-bold text-sm mb-1">{feedback}</p>
                  <button
                    onClick={nextLevel}
                    className="w-full mt-3 py-2 bg-white/10 rounded hover:bg-white/20 text-xs font-bold transition-colors"
                  >
                    Volgende Vraag →
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
