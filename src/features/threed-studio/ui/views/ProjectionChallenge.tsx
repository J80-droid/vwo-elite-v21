import { OrthographicCamera, PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useCanvasReady } from "@shared/hooks/useCanvasReady";
import { generateStructure, Vec3 } from "@shared/lib/voxelUtils";
import { Eye, Layers, Play, Volume2, VolumeX } from "lucide-react";
import React, { useCallback, useMemo, useRef, useState } from "react";

import { OPTION_COLORS } from "../../spatial/config";
import { SafeOrbitControls } from "../SafeOrbitControls";
import { SceneStabilizer } from "../SceneStabilizer";
interface Shape {
  id: string; // Unique ID
  voxels: Vec3[];
}

// --- Voxel Component ---
const Voxel = ({ position, color }: { position: Vec3; color: string }) => (
  <mesh position={position}>
    <boxGeometry args={[0.95, 0.95, 0.95]} />
    <meshStandardMaterial color={color} roughness={0.3} metalness={0.5} />
  </mesh>
);

// --- 2D Silhouette Voxel ---
const SilhouetteVoxel = ({ position }: { position: Vec3 }) => (
  <mesh position={position}>
    <boxGeometry args={[0.9, 0.9, 0.1]} />
    <meshBasicMaterial color="#1e293b" />
  </mesh>
);

// --- Shape Renderer ---
const ShapeRenderer = ({
  voxels,
  color,
}: {
  voxels: Vec3[];
  color: string;
}) => (
  <group>
    {voxels.map((pos, i) => (
      <Voxel key={i} position={pos} color={color} />
    ))}
  </group>
);

// --- 2D Projection View ---
const ProjectionView = ({
  voxels,
  view,
  label,
}: {
  voxels: Vec3[];
  view: "top" | "front" | "side";
  label: string;
}) => {
  // Get 2D projection
  const projection = useMemo(() => {
    const set = new Set<string>();
    voxels.forEach(([x, y, z]) => {
      if (view === "top") set.add(`${x},${z}`);
      else if (view === "front") set.add(`${x},${y}`);
      else set.add(`${z},${y}`);
    });
    return Array.from(set).map(
      (s) => s.split(",").map(Number) as [number, number],
    );
  }, [voxels, view]);

  const cameraPosition: [number, number, number] =
    view === "top" ? [1, 10, 1] : view === "front" ? [1, 1, 10] : [10, 1, 1];
  const rotation: [number, number, number] =
    view === "top"
      ? [-Math.PI / 2, 0, 0]
      : view === "side"
        ? [0, Math.PI / 2, 0]
        : [0, 0, 0];

  const { canvasReady } = useCanvasReady(150);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  return (
    <div className="relative bg-slate-900 rounded-xl overflow-hidden border border-white/10">
      <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 rounded text-xs font-bold uppercase z-10">
        {label}
      </div>
      <div ref={setContainer} className="aspect-square">
        {canvasReady && container && (
          <Canvas eventSource={container} key={`proj-${view}`}>
            <OrthographicCamera
              makeDefault
              position={cameraPosition}
              zoom={30} // Zoom out slightly for larger random shapes
              near={0.1}
              far={100}
            />
            <ambientLight intensity={0.8} />
            <group rotation={rotation}>
              {projection.map(([a, b], i) => (
                <SilhouetteVoxel
                  key={i}
                  position={[a! - 1.5, b! - 1.5, 0] as [number, number, number]}
                /> // Center offset attempt
              ))}
              <SceneStabilizer />
            </group>
          </Canvas>
        )}
      </div>
    </div>
  );
};

// --- Option 3D View ---
export const OptionView = ({
  shape,
  selected,
  correct,
  showResult,
  index,
}: {
  shape: Shape;
  selected: boolean;
  correct: boolean;
  showResult: boolean;
  index: number;
}) => {
  const { canvasReady } = useCanvasReady(150);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const color = OPTION_COLORS[index % OPTION_COLORS.length] || "#ffffff";

  return (
    <div
      style={{
        borderColor: showResult
          ? undefined
          : selected
            ? color
            : "rgba(255,255,255,0.1)",
        backgroundColor: showResult
          ? undefined
          : selected
            ? `${color}10`
            : undefined,
      }}
      className={`relative bg-slate-900 rounded-xl overflow-hidden border-2 transition-all group
            ${showResult && correct ? "border-green-500 bg-green-500/10" : ""}
            ${showResult && selected && !correct ? "border-red-500 bg-red-500/10" : ""}
        `}
    >
      {/* Index Label */}
      {!showResult && (
        <div
          className="absolute top-2 left-2 w-6 h-6 rounded-md border flex items-center justify-center text-xs font-bold z-10 bg-black/50 backdrop-blur-md transition-colors"
          style={{ borderColor: color, color: color }}
        >
          {String.fromCharCode(65 + index)}
        </div>
      )}

      <div ref={setContainer} className="aspect-square">
        {canvasReady && container && (
          <Canvas eventSource={container} key={`opt-${shape.id}`}>
            <PerspectiveCamera makeDefault position={[5, 4, 5]} />
            <ambientLight intensity={0.6} />
            <pointLight position={[5, 5, 5]} intensity={1} />
            <ShapeRenderer
              // Center the random shapes a bit better
              voxels={shape.voxels.map(
                (v) => [v[0]! - 1.5, v[1]! - 1.5, v[2]! - 1.5] as Vec3,
              )}
              color={
                showResult && correct
                  ? "#22c55e"
                  : showResult && selected
                    ? "#ef4444"
                    : color
              }
            />
            <SafeOrbitControls
              enableZoom={showResult}
              autoRotate={!showResult}
              autoRotateSpeed={2}
            >
              <SceneStabilizer />
            </SafeOrbitControls>
          </Canvas>
        )}
      </div>
      {showResult && correct && (
        <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 pointer-events-none">
          <span className="text-3xl">✓</span>
        </div>
      )}
    </div>
  );
};

// --- Sound Hook ---
const useSound = () => {
  const audioContext = useRef<AudioContext | null>(null);
  const playTone = useCallback(
    (freq: number, dur: number, type: OscillatorType = "sine") => {
      if (!audioContext.current) {
        const AudioContextClass =
          window.AudioContext ||
          (window as { webkitAudioContext?: typeof AudioContext })
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
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + dur);
    },
    [],
  );
  return {
    playCorrect: useCallback(() => {
      playTone(523, 0.1);
      setTimeout(() => playTone(659, 0.1), 100);
      setTimeout(() => playTone(784, 0.2), 200);
    }, [playTone]),
    playWrong: useCallback(() => playTone(200, 0.3, "sawtooth"), [playTone]),
  };
};

// --- Generate Question ---
const generateQuestion = (
  difficulty: number = 4,
): { target: Shape; options: Shape[] } => {
  // Generate 4 unique random shapes
  const shapes: Shape[] = Array.from({ length: 4 }).map((_, i) => ({
    id: `shape-${Date.now()}-${i}`,
    voxels: generateStructure(difficulty + Math.floor(Math.random() * 2)), // Random size variation
  }));

  const target = shapes[0]!;
  const options = shapes.sort(() => Math.random() - 0.5); // Shuffle options

  return { target, options };
};

// --- Main Component ---
export const ProjectionChallenge: React.FC<{
  t?: (key: string, fallback?: string) => string;
}> = () => {
  const [question, setQuestion] = useState<{
    target: Shape;
    options: Shape[];
  } | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const MAX_ROUNDS = 8;
  const { playCorrect, playWrong } = useSound();

  const generateRound = useCallback(() => {
    // Increase difficulty (size of shape) with rounds
    const size = 4 + Math.floor(round / 2); // 4, 4, 5, 5, 6, 6...
    setQuestion(generateQuestion(size));
    setSelectedIdx(null);
    setFeedback(null);
  }, [round]);

  const startGame = useCallback(() => {
    setGameStarted(true);
    setScore(0);
    setRound(1);
    setGameOver(false);
    generateRound();
  }, [generateRound]);

  const advanceRound = useCallback(() => {
    if (round >= MAX_ROUNDS) {
      setGameOver(true);
    } else {
      setRound((r) => r + 1);
      generateRound();
    }
  }, [round, MAX_ROUNDS, generateRound]);

  const handleSelect = useCallback(
    (idx: number) => {
      if (feedback || !question) return;

      setSelectedIdx(idx);
      const isCorrect = question.options[idx]!.id === question.target.id;

      if (isCorrect) {
        setFeedback("correct");
        setScore((s) => s + 1);
        if (soundEnabled) playCorrect();
        setTimeout(advanceRound, 1500);
      } else {
        setFeedback("wrong");
        if (soundEnabled) playWrong();
      }
    },
    [feedback, question, soundEnabled, playCorrect, playWrong, advanceRound],
  );

  // --- Start Screen ---
  if (!gameStarted) {
    return (
      <div className="h-full flex flex-col bg-obsidian-950 text-white">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <Layers className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h1 className="text-3xl font-bold mb-2">2D → 3D Challenge</h1>
              <p className="text-slate-400">
                Herken het 3D object uit de 2D projecties
              </p>
            </div>

            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 text-center flex items-center justify-center gap-2">
              <Eye size={16} className="text-purple-400" />
              <p className="text-purple-300 text-sm">
                Je ziet 3 aanzichten: bovenaanzicht, vooraanzicht en zijaanzicht
              </p>
            </div>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-white/10 hover:border-white/30"
            >
              <span className="flex items-center gap-2">
                {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                Geluid
              </span>
              <span
                className={`px-2 py-0.5 rounded text-xs ${soundEnabled ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}
              >
                {soundEnabled ? "AAN" : "UIT"}
              </span>
            </button>

            <button
              onClick={startGame}
              className="w-full py-4 mt-2 rounded-xl border border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 text-purple-300 font-bold tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-3 group hover:border-purple-500/60 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:text-purple-200"
            >
              <Play
                size={20}
                className="fill-current opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all"
              />
              Start Challenge
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Game Screen ---
  return (
    <div className="h-full flex flex-col bg-obsidian-950 text-white relative overflow-hidden">
      {/* HUD */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Layers className="text-purple-400" size={20} />
          <span className="hidden md:inline">2D → 3D</span>
        </h2>
        <div className="flex items-center gap-3">
          <div className="bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10 font-mono text-sm">
            Ronde <span className="text-purple-400">{round}</span>/{MAX_ROUNDS}
          </div>
          <div className="bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10 font-mono text-sm">
            Score: <span className="text-electric font-bold">{score}</span>
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-lg bg-black/40 border border-white/10 hover:bg-white/10"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row pt-16 p-4 gap-4">
        {/* 2D Projections */}
        <div className="lg:w-1/2 space-y-3">
          <div className="text-center text-sm text-slate-400 mb-2">
            <Eye className="inline mr-1" size={16} /> Welk 3D object hoort bij
            deze 3 aanzichten?
          </div>
          {question && (
            <div className="grid grid-cols-3 gap-3">
              <ProjectionView
                key={`top-${round}`}
                voxels={question.target.voxels}
                view="top"
                label="Boven"
              />
              <ProjectionView
                key={`front-${round}`}
                voxels={question.target.voxels}
                view="front"
                label="Voor"
              />
              <ProjectionView
                key={`side-${round}`}
                voxels={question.target.voxels}
                view="side"
                label="Zij"
              />
            </div>
          )}
        </div>

        {/* 3D Options */}
        <div className="lg:w-1/2">
          <div className="text-center text-sm text-slate-400 mb-3">
            Kies het juiste 3D object:
          </div>
          {question && (
            <div className="grid grid-cols-2 gap-3">
              {question.options.map((shape, idx) => (
                <OptionView
                  key={idx}
                  shape={shape}
                  selected={selectedIdx === idx}
                  correct={shape.id === question.target.id}
                  showResult={feedback !== null}
                  index={idx}
                />
              ))}
            </div>
          )}

          {/* Answer Buttons */}
          {question && (
            <div className="grid grid-cols-4 gap-3 mt-4">
              {[0, 1, 2, 3].map((i) => {
                const color = OPTION_COLORS[i % OPTION_COLORS.length];
                const isSelected = selectedIdx === i;
                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(i)}
                    disabled={!!feedback}
                    style={{
                      borderColor: isSelected ? color : `${color}40`,
                      backgroundColor: isSelected ? color : `${color}10`,
                      color: isSelected ? "#ffffff" : color,
                      boxShadow: isSelected ? `0 0 20px ${color}60` : "none",
                    }}
                    className={`
                                            py-3 rounded-xl font-black text-xl tracking-wider transition-all duration-300 border flex items-center justify-center gap-2 group
                                            ${isSelected && !feedback ? "scale-[1.02]" : "hover:scale-[1.02]"}
                                            ${feedback ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                                        `}
                  >
                    <span>{String.fromCharCode(65 + i)}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={`absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl font-bold flex items-center gap-4 shadow-xl z-20 ${
            feedback === "correct"
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          <span>
            {feedback === "correct"
              ? "✓ Correct!"
              : "✗ Fout, kijk goed waarom!"}
          </span>
          {feedback === "wrong" && (
            <button
              onClick={advanceRound}
              className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-sm font-bold flex items-center gap-1 transition-colors"
            >
              Volgende <Play size={12} fill="currentColor" />
            </button>
          )}
        </div>
      )}

      {/* Game Over */}
      {gameOver && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">
              {score >= 7 ? "🏆" : score >= 5 ? "👁️" : "💪"}
            </div>
            <h2 className="text-4xl font-bold text-white mb-2">
              Challenge Voltooid!
            </h2>
            <p className="text-3xl mb-6">
              <span className="text-electric font-bold">{score}</span>
              <span className="text-slate-400"> / {MAX_ROUNDS}</span>
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={startGame}
                className="px-8 py-3 rounded-xl border border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 text-purple-300 font-bold tracking-widest uppercase transition-all flex items-center gap-2 hover:border-purple-500/60 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]"
              >
                🔄 Opnieuw
              </button>
              <button
                onClick={() => setGameStarted(false)}
                className="px-8 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 font-bold tracking-widest uppercase transition-all flex items-center gap-2 hover:border-white/20"
              >
                ⚙️ Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
