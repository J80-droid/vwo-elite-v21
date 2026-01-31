

/* eslint-disable @typescript-eslint/no-explicit-any */
import { SafeOrbitControls, SceneStabilizer } from "@features/threed-studio";
import {
  Environment,
  Float,
  Html,
  PerspectiveCamera,
  Stars,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import {
  type Atom,
  ATOM_COLORS,
  ATOM_RADII,
  type Molecule,
  validateMolecule,
  type Vec3,
} from "@shared/assets/data/molecules";
import { useCanvasReady } from "@shared/hooks/useCanvasReady";
import { FischerProjection } from "@shared/ui/FischerProjection";
import {
  AnimatePresence,
  motion,
} from "framer-motion";
import {
  Atom as AtomIcon,
  ChevronRight,
  Eye,
  FlaskConical,
  PenTool,
  Play,
  Plus,
  RotateCcw,
  ScanEye,
  Sparkles,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as THREE from "three";

import { type GameMode, useStereoStore } from "../../../hooks/useStereoStore";

// --- Quantum Components ---
const QuantumParticles = () => {
  return (
    <group>
      <Stars
        radius={100}
        depth={50}
        count={2000}
        factor={4}
        saturation={0}
        fade
        speed={1}
      />
    </group>
  );
};

const GridOverlay = () => {
  const gridRef = useRef<THREE.GridHelper>(null!);
  useEffect(() => {
    if (gridRef.current) {
      const material = gridRef.current.material as THREE.LineBasicMaterial;
      material.transparent = true;
      material.opacity = 0.05;
    }
  }, []);

  return (
    <group position={[0, 0, -5]}>
      <gridHelper
        ref={gridRef}
        args={[100, 50, "#1fb6ff", "#0f172a"]}
        rotation={[Math.PI / 2, 0, 0]}
      />
    </group>
  );
};

// --- 3D Molecule Renderer ---
const AtomSphere = ({ atom }: { atom: Atom; index: number }) => {
  const color = new THREE.Color(ATOM_COLORS[atom.element]);
  const radius = ATOM_RADII[atom.element];

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh position={atom.position}>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial
          color={color}
          roughness={0.1}
          metalness={0.8}
          emissive={color}
          emissiveIntensity={0.8}
        />
        {/* Orbital Glow Ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius * 1.5, 0.01, 16, 100]} />
          <meshBasicMaterial color={color} transparent opacity={0.3} />
        </mesh>
      </mesh>
    </Float>
  );
};

const BondCylinder = ({
  from,
  to,
  type,
}: {
  from: Vec3;
  to: Vec3;
  type: "single" | "double" | "triple";
}) => {
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);
  const mid = start.clone().add(end).multiplyScalar(0.5);
  const direction = end.clone().sub(start);
  const length = direction.length();

  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.normalize(),
  );

  const bondRadius = type === "single" ? 0.05 : 0.04;
  const offset = type === "double" ? 0.1 : type === "triple" ? 0.12 : 0;

  const bonds = [];
  const count = type === "triple" ? 3 : type === "double" ? 2 : 1;

  for (let i = 0; i < count; i++) {
    const offsetX = count === 1 ? 0 : (i - (count - 1) / 2) * offset;
    bonds.push(
      <mesh
        key={i}
        position={[mid.x + offsetX, mid.y, mid.z]}
        quaternion={quaternion}
      >
        <cylinderGeometry args={[bondRadius, bondRadius, length * 0.9, 12]} />
        <meshStandardMaterial
          color="#0ea5e9"
          emissive="#0ea5e9"
          emissiveIntensity={0.5}
          transparent
          opacity={0.6}
        />
      </mesh>,
    );
  }

  return <>{bonds}</>;
};

const MoleculeModel = ({
  molecule,
  showLabels = false,
  showRSLabels = true,
}: {
  molecule: Molecule;
  showLabels?: boolean;
  showRSLabels?: boolean;
}) => {
  return (
    <group>
      {/* Atoms */}
      {molecule.atoms.map((atom, i) => (
        <AtomSphere key={`atom - ${i} `} atom={atom} index={i} />
      ))}

      {/* Bonds */}
      {molecule.bonds.map((bond, i) => (
        <BondCylinder
          key={`bond - ${i} `}
          from={molecule.atoms[bond.from]!.position}
          to={molecule.atoms[bond.to]!.position}
          type={bond.type}
        />
      ))}

      {/* Chiral center highlight */}
      {molecule.chiralCenters?.map((idx) => (
        <mesh key={`chiral - ${idx} `} position={molecule.atoms[idx]!.position}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshBasicMaterial
            color="#fbbf24"
            transparent
            opacity={0.2}
            wireframe
          />
        </mesh>
      ))}

      {/* R/S Configuration Labels */}
      {showRSLabels &&
        molecule.rsConfiguration &&
        molecule.chiralCenters?.map((idx) => {
          const config = molecule.rsConfiguration?.[idx];
          if (!config) return null;
          const pos = molecule.atoms[idx]!.position;
          return (
            <Html
              key={`rs - ${idx} `}
              position={[pos[0], pos[1] + 0.8, pos[2]]}
              center
            >
              <span
                className={`text - xs font - bold px - 1.5 py - 0.5 rounded ${config === "R"
                  ? "bg-blue-500 text-white"
                  : "bg-purple-500 text-white"
                  } `}
              >
                ({config})
              </span>
            </Html>
          );
        })}

      {/* Element labels */}
      {showLabels &&
        molecule.atoms.map((atom, i) => (
          <Html key={`label - ${i} `} position={atom.position} center>
            <span className="text-[10px] font-bold text-white bg-black/50 px-1 rounded">
              {atom.element}
            </span>
          </Html>
        ))}
    </group>
  );
};

// --- Sound Hook ---
const useSound = () => {
  const audioContext = useRef<AudioContext | null>(null);
  const playTone = useCallback(
    (freq: number, dur: number, type: OscillatorType = "sine") => {
      if (!audioContext.current)
        audioContext.current = new (
          window.AudioContext || (window as any).webkitAudioContext
        )();
      const ctx = audioContext.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
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

// --- Game Modes ---

// --- Main Component ---
export const StereoTrainer: React.FC<{
  t?: any;
  onNavigate?: (view: any) => void;
  mode?: "stage" | "controls";
}> = ({ onNavigate, mode: viewMode }) => {
  const { submodule } = useParams();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    mode, setMode,
    question,
    score,
    round,
    feedback,
    gameOver,
    gameStarted,
    difficulty, setDifficulty,
    soundEnabled, setSoundEnabled,
    showLabels,
    userRS, setUserRS,
    fischerChallengeMol,
    userMolecules, setUserMolecules,
    selectedUserMolecule, setSelectedUserMolecule,
    showMyMolecules, setShowMyMolecules,
    startGame, handleAnswer, checkFischer, advanceRound,
    setGameStarted
  } = useStereoStore();

  const { canvasReady } = useCanvasReady(150);
  const { playCorrect, playWrong } = useSound();

  // Trigger sounds on feedback change
  useEffect(() => {
    if (feedback === "correct" && soundEnabled) playCorrect();
    if (feedback === "wrong" && soundEnabled) playWrong();
  }, [feedback, soundEnabled, playCorrect, playWrong]);

  useEffect(() => {
    const stored = localStorage.getItem("vwo_user_molecules");
    if (stored) {
      try {
        setUserMolecules(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to load user molecules", e);
      }
    }
  }, [setUserMolecules]);

  useEffect(() => {
    const mol =
      mode === "identifier"
        ? selectedUserMolecule || question?.targetMolecule
        : selectedUserMolecule || fischerChallengeMol;
    if (mol) {
      validateMolecule(mol);
    }
  }, [question, fischerChallengeMol, mode, selectedUserMolecule]);

  // Sync URL -> State (Legacy fallback for direct navigation)
  useEffect(() => {
    if (submodule) {
      const newMode = submodule === "fischerbouwer" ? "fischer-builder" : "identifier";
      if (newMode !== mode) setMode(newMode);
    }
  }, [submodule, mode, setMode]);

  const switchMode = (newMode: GameMode) => {
    const path = newMode === "fischer-builder" ? "fischerbouwer" : "herkenning";
    navigate(`/chemistry/stereo/${path}`);
  };

  const MAX_ROUNDS = mode === "identifier" ? 10 : 5;

  if (viewMode === "controls") {
    return (
      <div className="flex flex-row items-center gap-4">
        {gameStarted && !gameOver ? (
          <>
            <div className="flex items-center gap-2 bg-black/40 border border-white/5 p-1 rounded-xl">
              <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest px-2">Mode</span>
              <div className="flex gap-0.5">
                <button
                  onClick={() => switchMode("identifier")}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${mode === "identifier" ? "bg-emerald-500/20 text-emerald-400" : "text-slate-600 hover:text-white"}`}
                >
                  Herkenning
                </button>
                <button
                  onClick={() => switchMode("fischer-builder")}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${mode === "fischer-builder" ? "bg-emerald-500/20 text-emerald-400" : "text-slate-600 hover:text-white"}`}
                >
                  Fischer
                </button>
              </div>
            </div>

            {mode === "identifier" && (
              <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                <button
                  onClick={() => handleAnswer("same")}
                  disabled={!!feedback}
                  className="px-4 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-black text-emerald-400 hover:bg-emerald-500/20 transition-all uppercase"
                >
                  Hetzelfde
                </button>
                <button
                  onClick={() => handleAnswer("enantiomer")}
                  disabled={!!feedback}
                  className="px-4 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-[10px] font-black text-purple-400 hover:bg-purple-500/20 transition-all uppercase"
                >
                  Enantiomeer
                </button>
              </div>
            )}

            {mode === "fischer-builder" && (
              <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                <button
                  onClick={() => setUserRS("R")}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${userRS === "R" ? "bg-blue-500/20 text-blue-400 border border-blue-500/50" : "text-slate-600 border border-transparent"}`}
                >
                  (R)
                </button>
                <button
                  onClick={() => setUserRS("S")}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${userRS === "S" ? "bg-purple-500/20 text-purple-400 border border-purple-500/50" : "text-slate-600 border border-transparent"}`}
                >
                  (S)
                </button>
                <button
                  onClick={checkFischer}
                  disabled={!userRS || !!feedback}
                  className="ml-2 px-4 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-[10px] font-black text-emerald-400 hover:bg-emerald-500/30 transition-all uppercase"
                >
                  Check
                </button>
              </div>
            )}

            <div className="ml-auto flex items-center gap-3 bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl">
              <div className="flex flex-col items-end">
                <span className="text-[8px] font-black text-slate-500 uppercase leading-none">Score</span>
                <span className="text-[10px] font-black text-emerald-400 leading-tight uppercase">{score} PTS / Ronde {round}</span>
              </div>
            </div>
          </>
        ) : (
          <button
            onClick={startGame}
            className="px-6 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all shadow-[0_0_20px_rgba(16,185,129,0.1)]"
          >
            Systeem Kalibratie Starten
          </button>
        )}
      </div>
    );
  }

  // --- Start Screen ---
  if (!gameStarted) {
    return (
      <div className="h-full flex flex-col bg-obsidian-950 text-white overflow-hidden">
        <div className="flex-1 flex max-w-6xl mx-auto w-full p-4 gap-6">
          {/* Left Panel: Settings & Game Start */}
          <div className="flex-1 flex items-center justify-center">
            <div className="max-w-md w-full space-y-6">
              <div className="text-center">
                <FlaskConical className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                <h1 className="text-3xl font-bold mb-2">Stereo-Isomerie</h1>
                <p className="text-slate-400">
                  Train chiraliteit en enantiomeer herkenning
                </p>
              </div>

              {/* Mode Selection */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-1 flex gap-1">
                <button
                  onClick={() => switchMode("identifier")}
                  className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 uppercase tracking-wide ${mode === "identifier" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]" : "text-slate-500 hover:text-white hover:bg-white/5 border border-transparent"} `}
                >
                  <ScanEye size={16} /> Herkenning
                </button>
                <button
                  onClick={() => switchMode("fischer-builder")}
                  className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 uppercase tracking-wide ${mode === "fischer-builder" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]" : "text-slate-500 hover:text-white hover:bg-white/5 border border-transparent"} `}
                >
                  <PenTool size={16} /> Fischer Bouwer
                </button>
              </div>

              {/* User Molecule Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Jouw Moleculen
                  </label>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded border border-emerald-500/20">
                    Kies training
                  </span>
                </div>

                {userMolecules.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    <button
                      onClick={() => setSelectedUserMolecule(null)}
                      className={`p-3 rounded-xl border text-xs text-center transition-all font-medium ${!selectedUserMolecule
                        ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                        : "border-white/5 bg-white/5 text-slate-500 hover:border-white/20 hover:text-slate-300"
                        } `}
                    >
                      Willekeurig
                    </button>
                    {userMolecules.map((m) => (
                      <button
                        key={m.name}
                        onClick={() => setSelectedUserMolecule(m)}
                        className={`p-3 rounded-xl border text-xs truncate transition-all font-medium ${selectedUserMolecule?.name === m.name
                          ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.1)]"
                          : "border-white/5 bg-white/5 text-slate-500 hover:border-white/20 hover:text-slate-300"
                          } `}
                      >
                        {m.nameDutch || m.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-xl border border-dashed border-white/10 text-center bg-white/5">
                    <p className="text-xs text-slate-500">
                      Nog geen eigen moleculen
                    </p>
                  </div>
                )}

                <button
                  onClick={() => onNavigate?.("MOLECULE_BUILDER")}
                  className="w-full py-3.5 rounded-xl border border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 text-purple-300 font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 group text-xs hover:border-purple-500/50 hover:shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                >
                  <Plus
                    size={16}
                    className="group-hover:rotate-90 transition-transform"
                  />{" "}
                  Bouw Nieuw Molecuul
                </button>
              </div>

              {/* Difficulty (Only if no user molecule) */}
              {!selectedUserMolecule && (
                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Moeilijkheid
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["easy", "medium", "hard"] as const).map((d) => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={`p-3 rounded-xl border transition-all ${difficulty === d
                          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                          : "border-white/5 bg-white/5 text-slate-500 hover:border-white/20 hover:text-slate-300"
                          } `}
                      >
                        <div className="font-bold text-xs">
                          {d === "easy"
                            ? "Instap"
                            : d === "medium"
                              ? "Normaal"
                              : "Expert"}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* START BUTTON - Premium AI Style */}
              <button
                onClick={startGame}
                className="w-full py-4 mt-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-300 font-bold tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-3 group hover:border-emerald-500/60 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:text-emerald-200"
              >
                <Play
                  size={20}
                  className="fill-current opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all"
                />
                Start {mode === "identifier" ? "Training" : "Bouwen"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Game Screen ---
  // --- Game Screen ---
  return (
    <div
      ref={containerRef}
      className="h-full flex flex-col bg-obsidian-950 text-white relative overflow-hidden font-outfit"
    >
      {/* --- HUD --- */}
      <div
        className={`absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-30 pointer-events-none transition-all duration-300 ${mode === "fischer-builder" ? "lg:right-[450px]" : "lg:right-[320px]"}`}
      >
        <div className="flex items-center gap-6 pointer-events-auto">
          <div className="flex items-center gap-4 bg-obsidian-950/40 backdrop-blur-3xl border border-white/5 px-6 py-4 rounded-[32px] shadow-2xl group transition-all hover:bg-white/5 active:scale-95 cursor-pointer">
            <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/30 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <FlaskConical
                className="text-emerald-400 group-hover:animate-pulse"
                size={24}
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-wide leading-none font-outfit uppercase">
                Stereo<span className="text-emerald-400">Quantum</span>
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-1 h-1 rounded-full bg-emerald-400 animate-ping"></div>
                <span className="text-[10px] font-black text-emerald-500/80 uppercase tracking-[0.2em]">
                  Neural Engine Active
                </span>
              </div>
            </div>
          </div>
          {/* Toggle My Molecules */}
          <button
            onClick={() => setShowMyMolecules(!showMyMolecules)}
            className={`pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-[32px] border transition-all ${showMyMolecules ? "bg-purple-500/20 border-purple-500/50 text-purple-300" : "bg-obsidian-950/40 border-white/5 text-slate-400 hover:text-white hover:bg-white/5"} `}
          >
            <Zap size={20} className={showMyMolecules ? "animate-pulse" : ""} />
            <span className="text-xs font-bold uppercase tracking-wider">
              Mijn Moleculen
            </span>
          </button>
        </div>

        <div className="flex items-center gap-4 pointer-events-auto">
          <div className="bg-obsidian-950/40 backdrop-blur-3xl border border-white/5 p-2 rounded-[32px] shadow-2xl flex items-center gap-2">
            <div className="px-6 py-3 flex flex-col items-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 leading-none text-center font-space">
                Vector
              </span>
              <span className="text-xl font-bold text-white font-mono tracking-tight">
                {round}
                <span className="text-slate-600">/</span>
                {MAX_ROUNDS}
              </span>
            </div>
            <div className="w-px h-8 bg-white/10"></div>
            <div className="px-6 py-3 flex flex-col items-center">
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1 leading-none text-center font-space">
                Sync Efficiency
              </span>
              <span className="text-xl font-bold text-emerald-400 font-mono tracking-tight drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">
                {Math.round((score / Math.max(1, round - 1)) * 100) || 100}%
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-4 rounded-[24px] bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-all hover:scale-110 active:scale-90 text-slate-300 hover:text-emerald-400"
            >
              {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
            <button
              onClick={() => setGameStarted(false)}
              className="px-6 py-3 rounded-[24px] bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all hover:scale-110 active:scale-95 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-red-500/10"
            >
              Abort
            </button>
          </div>
        </div>
      </div>

      {/* --- Main Content --- */}
      <div className="flex-1 flex flex-col lg:flex-row h-full">
        {/* --- MODE: IDENTIFIER --- */}
        {mode === "identifier" && (
          <div className="flex-1 flex flex-col lg:flex-row relative">
            {/* 3D Viewport Group */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-px bg-white/5">
              {/* Target Molecule */}
              <div className="relative group bg-obsidian-900/50 flex-1 min-h-0">
                <div className="absolute top-32 left-6 z-20">
                  <div className="bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-[10px] font-bold text-emerald-400 uppercase tracking-widest backdrop-blur-md shadow-xl flex items-center gap-2 font-space">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                    Origineel
                  </div>
                </div>

                {question && canvasReady && (
                  <Canvas
                    eventSource={containerRef as any}
                    className="w-full h-full"
                    gl={{ antialias: true }}
                    dpr={[1, 2]}
                  >
                    <PerspectiveCamera makeDefault position={[0, 0, 8]} />
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={2.5} />
                    <pointLight position={[-10, -10, 10]} intensity={1.5} />
                    <Environment preset="night" />
                    <QuantumParticles />
                    <SceneStabilizer />
                    <GridOverlay />
                    <MoleculeModel
                      molecule={question.targetMolecule}
                      showLabels={showLabels}
                    />
                    <SafeOrbitControls makeDefault enableZoom={true} />
                  </Canvas>
                )}

                {question && (
                  <div className="absolute bottom-6 left-6 z-20 max-w-xs animate-in slide-in-from-bottom-5 duration-700">
                    <div className="bg-black/40 backdrop-blur-2xl p-5 rounded-3xl border border-white/5 shadow-2xl">
                      <p className="font-black text-white text-xl leading-tight mb-1">
                        {question.targetMolecule.nameDutch ||
                          question.targetMolecule.name}
                      </p>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 font-mono text-xs tracking-wider uppercase bg-white/5 px-2 py-0.5 rounded-lg">
                          {question.targetMolecule.formula}
                        </span>
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                          <span className="text-[10px] font-black text-emerald-400 uppercase">
                            Valide
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Option Molecule */}
              <div className="relative group bg-obsidian-900/50 flex-1 min-h-0">
                <div className="absolute top-32 left-6 z-20">
                  <div className="bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 rounded-xl text-[10px] font-bold text-amber-400 uppercase tracking-widest backdrop-blur-md shadow-xl flex items-center gap-2 font-space">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></div>
                    Vergelijking
                  </div>
                </div>

                {question && canvasReady && (
                  <Canvas
                    eventSource={containerRef as any}
                    className="w-full h-full"
                    gl={{ antialias: true }}
                    dpr={[1, 2]}
                  >
                    <PerspectiveCamera makeDefault position={[0, 0, 8]} />
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={2.5} />
                    <pointLight position={[-10, -10, 10]} intensity={1.5} />
                    <Environment preset="night" />
                    <QuantumParticles />
                    <SceneStabilizer />
                    <GridOverlay />
                    <MoleculeModel
                      molecule={question.optionMolecule}
                      showLabels={showLabels}
                    />
                    <SafeOrbitControls makeDefault enableZoom={true} />
                  </Canvas>
                )}
              </div>
            </div>

            {/* Interaction Panel */}
            <div className="w-full lg:w-[320px] bg-obsidian-950/95 backdrop-blur-[50px] border-l border-white/10 p-8 pt-24 lg:pt-32 flex flex-col items-center justify-center gap-8 relative z-20">
              <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
                <Plus
                  className="text-emerald-500 animate-spin-slow"
                  size={150}
                />
              </div>
              <div className="text-center space-y-4 w-full relative">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.3em] font-space">
                    Neural Bridge
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
                </div>
                <h3 className="text-4xl font-medium text-white tracking-tight leading-none uppercase font-outfit">
                  Analyze{" "}
                  <span className="text-emerald-400 font-bold">State</span>
                </h3>
                <p className="text-slate-500 text-[11px] max-w-[280px] mx-auto uppercase tracking-[0.2em] font-medium opacity-80 leading-relaxed font-space">
                  Comparing molecular wavefunctions for congruence
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => handleAnswer("same")}
                  disabled={!!feedback}
                  className={`w - full group p - 6 rounded - 2xl border - 2 transition - all duration - 300 text - left relative overflow - hidden
                                        ${feedback === "correct" && question?.correctAnswer === "same" ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.15)]" : ""}
                                        ${feedback === "wrong" && question?.correctAnswer === "same" ? "border-emerald-500/30 bg-emerald-500/5" : ""}
                                        ${feedback && question?.correctAnswer !== "same" ? "opacity-40 grayscale-[0.5]" : ""}
                                        ${!feedback ? "border-white/5 bg-white/[0.03] hover:border-emerald-500/50 hover:bg-emerald-500/5 hover:scale-[1.02] active:scale-95" : ""}
`}
                >
                  <div className="flex items-center gap-5 relative z-10">
                    <div
                      className={`p - 4 rounded - 2xl transition - colors ${!feedback ? "bg-white/5 group-hover:bg-emerald-500/20" : "bg-emerald-500/20"} `}
                    >
                      <RotateCcw className="text-emerald-400" size={32} />
                    </div>
                    <div>
                      <div className="font-black text-lg text-white">
                        Hetzelfde
                      </div>
                      <div className="text-xs text-slate-500 uppercase tracking-widest font-bold mt-1">
                        Slechts gedraaid
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <RotateCcw size={80} strokeWidth={1} />
                  </div>
                </button>

                <button
                  onClick={() => handleAnswer("enantiomer")}
                  disabled={!!feedback}
                  className={`w - full group p - 6 rounded - 2xl border - 2 transition - all duration - 300 text - left relative overflow - hidden
                                        ${feedback === "correct" && question?.correctAnswer === "enantiomer" ? "border-purple-500 bg-purple-500/10 shadow-[0_0_30px_rgba(168,85,247,0.15)]" : ""}
                                        ${feedback === "wrong" && question?.correctAnswer === "enantiomer" ? "border-purple-500/30 bg-purple-500/5" : ""}
                                        ${feedback && question?.correctAnswer !== "enantiomer" ? "opacity-40 grayscale-[0.5]" : ""}
                                        ${!feedback ? "border-white/5 bg-white/[0.03] hover:border-purple-500/50 hover:bg-purple-500/5 hover:scale-[1.02] active:scale-95" : ""}
`}
                >
                  <div className="flex items-center gap-5 relative z-10">
                    <div
                      className={`p - 4 rounded - 2xl transition - colors ${!feedback ? "bg-white/5 group-hover:bg-purple-500/20" : "bg-purple-500/20"} `}
                    >
                      <Eye className="text-purple-400" size={32} />
                    </div>
                    <div>
                      <div className="font-black text-lg text-white">
                        Enantiomeer
                      </div>
                      <div className="text-xs text-slate-500 uppercase tracking-widest font-bold mt-1">
                        Spiegelbeeld
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Sparkles size={80} strokeWidth={1} />
                  </div>
                </button>
              </div>

              {/* Continue Button (If Feedback is Present) */}
              {feedback && (
                <button
                  onClick={advanceRound}
                  className="w-full py-4 mt-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl font-bold text-white uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 animate-in fade-in slide-in-from-bottom-2"
                >
                  {round >= MAX_ROUNDS ? "Afronden" : "Volgende Vraag"}{" "}
                  <ChevronRight size={20} />
                </button>
              )}

              {/* Legend (Clean) */}
              <div className="mt-auto bg-black/60 backdrop-blur-3xl border border-white/5 p-6 rounded-[32px] shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="text-[10px] text-slate-500 uppercase font-black tracking-[0.3em] mb-5 flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]"></div>
                  Particle Matrix
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(ATOM_COLORS)
                    .slice(0, 6)
                    .map(([el, col]) => (
                      <div
                        key={el}
                        className="flex flex-col items-center gap-2 bg-white/[0.03] p-3 rounded-2xl border border-white/5 hover:bg-white/[0.07] transition-all hover:scale-105 active:scale-95"
                      >
                        <div
                          className="w-4 h-4 rounded-full shadow-lg border border-white/20 blur-[0.5px]"
                          style={{
                            backgroundColor: col as string,
                            boxShadow: `0 0 12px ${col as string} 40`,
                          }}
                        ></div>
                        <span className="text-[10px] font-black text-slate-400 font-mono">
                          {el}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Feedback Toast */}
              {feedback && (
                <div
                  className={`absolute bottom - 8 left - 8 right - 8 p - 6 rounded - [32px] text - center font - black animate -in fade -in slide -in -from - bottom - 5 duration - 500 shadow - 2xl backdrop - blur - [40px] border
                                    ${feedback === "correct" ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-100" : "bg-red-500/20 border-red-500/40 text-red-100"} `}
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                  {feedback === "correct" ? (
                    <div className="flex flex-col gap-1 items-center justify-center">
                      <div className="flex items-center gap-2 text-emerald-400 text-sm italic italic tracking-tighter uppercase mb-1">
                        <Sparkles size={16} /> Phase Alignment Positive
                      </div>
                      <span className="text-2xl tracking-tighter uppercase font-outfit italic">
                        Quantum Sync Confirmed
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1 items-center justify-center">
                      <div className="flex items-center gap-2 text-red-400 text-sm italic italic tracking-tighter uppercase mb-1">
                        Interference Detected
                      </div>
                      <span className="text-2xl tracking-tighter uppercase font-outfit italic">
                        De-coherence Event
                      </span>
                      <span className="text-[10px] uppercase opacity-60 mt-2 tracking-[0.2em]">
                        Expected{" "}
                        {question?.correctAnswer === "enantiomer"
                          ? "Mirror"
                          : "Rotation"}{" "}
                        state
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- MODE: FISCHER BUILDER --- */}
        {mode === "fischer-builder" && fischerChallengeMol && (
          <div className="flex-1 flex flex-col lg:flex-row relative">
            {/* 3D Model Card */}
            <div className="flex-1 relative bg-obsidian-900/50">
              <div className="absolute top-24 left-6 z-20 flex flex-col gap-2">
                <div className="bg-purple-500/20 border border-purple-500/30 px-3 py-1.5 rounded-xl text-[10px] font-black text-purple-400 uppercase tracking-widest backdrop-blur-md shadow-xl flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></div>
                  Spectral Signature
                </div>
                <div className="bg-black/40 backdrop-blur-xl p-4 rounded-2xl border border-white/5 shadow-2xl flex flex-col gap-1">
                  <p className="font-black text-white text-lg leading-tight uppercase tracking-tight">
                    {fischerChallengeMol.nameDutch || fischerChallengeMol.name}
                  </p>
                  <div className="flex flex-col gap-1 mt-1">
                    <span className="text-slate-500 font-mono text-xs w-fit bg-white/5 px-2 py-0.5 rounded-lg">
                      {fischerChallengeMol.formula}
                    </span>
                    {fischerChallengeMol.smiles && (
                      <span className="text-emerald-500/80 font-mono text-[10px] w-fit bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg tracking-wider">
                        {fischerChallengeMol.smiles}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {canvasReady && (
                <Canvas
                  eventSource={containerRef as any}
                  className="w-full h-full"
                  gl={{ antialias: true }}
                  dpr={[1, 2]}
                >
                  <PerspectiveCamera makeDefault position={[0, 0, 8]} />
                  <ambientLight intensity={0.5} />
                  <pointLight position={[10, 10, 10]} intensity={2.5} />
                  <Environment preset="night" />
                  <QuantumParticles />
                  <GridOverlay />
                  <MoleculeModel
                    molecule={fischerChallengeMol}
                    showLabels={true}
                    showRSLabels={true}
                  />
                  <SafeOrbitControls makeDefault enableZoom={true} />
                </Canvas>
              )}
            </div>

            {/* Fischer Interaction Panel */}
            <div className="w-full lg:w-[450px] bg-obsidian-950/90 backdrop-blur-3xl border-l border-white/10 p-10 flex flex-col items-center justify-center gap-10 relative z-20">
              <div className="absolute top-0 left-0 p-10 opacity-10 pointer-events-none">
                <Plus
                  className="text-purple-500 animate-spin-slow rotate-45"
                  size={150}
                />
              </div>
              <div className="text-center space-y-4 w-full relative">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
                  <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em]">
                    Configuration Link
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
                </div>
                <h3 className="text-4xl font-black text-white tracking-tighter leading-none uppercase italic font-outfit">
                  Projection <span className="text-purple-400">Array</span>
                </h3>
                <p className="text-slate-500 text-[11px] max-w-[280px] mx-auto uppercase tracking-[0.2em] font-black opacity-80 leading-relaxed">
                  Mapping spatial coordinates to 2D manifold
                </p>
              </div>

              <div className="relative p-8 bg-white/[0.02] rounded-[40px] border border-white/5 shadow-inner group">
                <div className="absolute -inset-1 bg-gradient-to-tr from-emerald-500/5 to-electric/5 rounded-[40px] blur opacity-60"></div>
                <div className="relative">
                  <FischerProjection
                    molecule={fischerChallengeMol}
                    size={320}
                    showLabels={true}
                    showRSLabel={true}
                    interactive={!feedback}
                    onConfigChange={setUserRS}
                  />

                  {/* RS Overlay */}
                  {userRS && (
                    <div className="absolute -right-12 top-1/2 -translate-y-1/2 animate-in zoom-in duration-300">
                      <div
                        className={`w - 16 h - 16 flex items - center justify - center rounded - 2xl text - 3xl font - black shadow - 2xl border - 2 backdrop - blur - 2xl
                                                    ${userRS === "R" ? "bg-blue-500/20 border-blue-500/40 text-blue-400" : "bg-purple-500/20 border-purple-500/40 text-purple-400"} `}
                      >
                        {userRS}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full max-w-sm flex flex-col gap-4 text-center">
                <button
                  onClick={checkFischer}
                  disabled={!!feedback || !userRS}
                  className={`w-full py-5 rounded-2xl font-black text-lg tracking-[0.2em] uppercase transition-all duration-300 border backdrop-blur-md
                                            ${feedback === "correct"
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                      : feedback === "wrong"
                        ? "bg-red-500/10 border-red-500 text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.3)]"
                        : !userRS
                          ? "border-white/5 text-slate-600 cursor-not-allowed"
                          : "bg-transparent border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:scale-[1.02] active:scale-95"
                    }
                                `}
                >
                  {feedback === "correct"
                    ? "Co-ordinatie Correct"
                    : feedback === "wrong"
                      ? "Configuratie Fout"
                      : "Controleren"}
                </button>

                {feedback && (
                  <button
                    onClick={advanceRound}
                    className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl font-bold text-white uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 animate-in fade-in slide-in-from-bottom-2"
                  >
                    {round >= MAX_ROUNDS ? "Afronden" : "Volgende Vraag"}{" "}
                    <ChevronRight size={20} />
                  </button>
                )}

                {feedback === "wrong" && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-xs text-amber-300 leading-relaxed animate-in fade-in slide-in-from-top-2">
                    <span className="font-black text-amber-400">
                      TUTOR TIP:
                    </span>{" "}
                    Onthoud de prioriteitsvolgorde (Z, Atoomnummer). Houd de
                    laagste prioriteit achter of pas de 'omdraai-regel' toe.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- Game Over Overlay --- */}
      {gameOver && (
        <div className="absolute inset-0 z-[100] bg-obsidian-950/95 backdrop-blur-[100px] flex flex-col items-center justify-center p-10 animate-in fade-in duration-1000">
          <div className="relative text-center max-w-xl w-full">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-emerald-500/20 via-blue-500/10 to-purple-500/20 blur-[150px] rounded-full -z-10 animate-pulse"></div>

            <div className="relative mb-12 flex justify-center scale-150">
              <div className="absolute inset-0 bg-emerald-500/40 blur-3xl rounded-full"></div>
              <FlaskConical
                className="text-white relative z-10"
                size={80}
                strokeWidth={1}
              />
            </div>

            <div className="space-y-4 mb-16">
              <h2 className="text-7xl font-black text-white tracking-tighter uppercase italic leading-none">
                Mission <span className="text-emerald-400">Complete</span>
              </h2>
              <p className="text-slate-400 tracking-[0.4em] font-black uppercase text-xs opacity-60">
                Neural pathways successfully reconfigured
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[48px] p-12 mb-16 shadow-2xl relative overflow-hidden group hover:bg-white/[0.07] transition-all">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
              <div className="text-[10px] text-slate-500 uppercase font-black tracking-[.3em] mb-6">
                Synchronization Efficiency
              </div>
              <div className="flex items-baseline justify-center gap-4">
                <span className="text-9xl font-black text-emerald-400 drop-shadow-[0_0_40px_rgba(52,211,153,0.4)] font-outfit italic tracking-tighter">
                  {Math.round((score / MAX_ROUNDS) * 100)}
                </span>
                <span className="text-4xl font-black text-slate-500 font-mono italic">
                  %
                </span>
              </div>
              <div className="mt-8 flex justify-center gap-8">
                <div className="text-center">
                  <div className="text-[10px] font-black text-slate-600 uppercase mb-1">
                    Raw Sync
                  </div>
                  <div className="text-2xl font-black text-white font-mono italic">
                    {score}/{MAX_ROUNDS}
                  </div>
                </div>
                <div className="w-px h-10 bg-white/10"></div>
                <div className="text-center">
                  <div className="text-[10px] font-black text-slate-600 uppercase mb-1">
                    Time Index
                  </div>
                  <div className="text-2xl font-black text-white font-mono italic">
                    NORMAL
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button
                onClick={startGame}
                className="group relative px-12 py-6 bg-emerald-500 rounded-[28px] overflow-hidden transition-all hover:scale-105 active:scale-95"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="relative z-10 text-obsidian-950 font-black text-xl tracking-tighter italic uppercase">
                  Recalibrate System
                </span>
              </button>
              <button
                onClick={() => setGameStarted(false)}
                className="px-12 py-6 bg-white/5 border border-white/10 text-white font-black rounded-[28px] hover:bg-white/10 hover:scale-105 active:scale-95 transition-all uppercase tracking-tighter italic text-xl"
              >
                Abort
              </button>
            </div>
          </div>
        </div>
      )}
      {/* --- Mijn Moleculen Side Panel --- */}
      <AnimatePresence>
        {showMyMolecules && (
          <motion.div
            initial={{ x: 320 }}
            animate={{ x: 0 }}
            exit={{ x: 320 }}
            className="fixed top-0 bottom-0 right-0 w-80 bg-obsidian-950/95 backdrop-blur-2xl border-l border-white/10 z-[60] flex flex-col pt-20"
          >
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
              <div>
                <h3 className="text-xs font-black text-purple-500 uppercase tracking-[0.2em] mb-4">
                  Bibliotheek
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setSelectedUserMolecule(null);
                      setShowMyMolecules(false);
                    }}
                    className={`w - full text - left p - 4 rounded - 2xl border transition - all ${!selectedUserMolecule ? "bg-emerald-500/10 border-emerald-500/30" : "bg-white/5 border-transparent hover:border-white/10"} `}
                  >
                    <div className="font-bold text-sm text-white">
                      Willekeurig
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">
                      Altijd iets nieuws
                    </div>
                  </button>

                  {userMolecules.length > 0 ? (
                    userMolecules.map((mol) => (
                      <button
                        key={mol.name}
                        onClick={() => {
                          setSelectedUserMolecule(mol);
                          setShowMyMolecules(false);
                        }}
                        className={`w - full text - left p - 4 rounded - 2xl border transition - all ${selectedUserMolecule?.name === mol.name ? "bg-purple-500/10 border-purple-500/30" : "bg-white/5 border-transparent hover:border-white/10"} `}
                      >
                        <div className="font-bold text-sm text-white truncate">
                          {mol.nameDutch || mol.name}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] text-slate-500 font-mono">
                            {mol.formula}
                          </span>
                          <span className="text-[9px] text-purple-400 font-bold px-1.5 py-0.5 rounded bg-purple-400/10">
                            {mol.atoms.length}A
                          </span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-12 px-6 border border-dashed border-white/10 rounded-3xl">
                      <AtomIcon className="w-12 h-12 text-slate-700 mx-auto mb-4 opacity-20" />
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        Nog geen gebouwde moleculen gevonden.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => onNavigate?.("MOLECULE_BUILDER")}
                className="mt-auto group bg-gradient-to-r from-purple-500 to-pink-500 p-[1px] rounded-2xl hover:scale-[1.02] transition-all"
              >
                <div className="bg-obsidian-950 rounded-2xl p-4 flex items-center justify-between text-white group-hover:bg-transparent transition-colors">
                  <span className="text-sm font-bold">Nieuw Bouwen</span>
                  <Plus size={18} />
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
