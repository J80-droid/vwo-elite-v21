import { SafeOrbitControls } from "@features/threed-studio";
import { Grid, PerspectiveCamera, Stars } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { BindingEnergyGraph } from "./BindingEnergyGraph";
import { BiologicalRangeHUD } from "./BiologicalRangeHUD";
import { DecayEquation } from "./DecayEquation";
import { DecaySchemeHUD } from "./DecaySchemeHUD";
import { IsotopeBuilderModal } from "./IsotopeBuilderModal";
import { IsotopeLibraryModal } from "./IsotopeLibraryModal";
import { SHIELDING_MATERIALS } from "./isotopes";
import { NuclearLab } from "./NuclearLab";
import {
  EmittedParticle,
  NuclearParticle,
  NuclearState,
  useNuclearEngine,
} from "./useNuclearEngine";

// --- SCENE STABILIZER ---
const SceneStabilizer = () => {
  const { gl } = useThree();
  useEffect(() => {
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      console.warn("WebGL Context Lost detected by Stabilizer");
    };
    const dom = gl.domElement;
    if (dom) {
      dom.addEventListener("webglcontextlost", handleContextLost);
      return () =>
        dom.removeEventListener("webglcontextlost", handleContextLost);
    }
    return undefined;
  }, [gl]);
  return null;
};

// --- SAFE EFFECT COMPOSER ---
const SafeEffectComposer = ({ children }: { children: React.ReactNode }) => {
  const { gl } = useThree();
  const [isLost, setIsLost] = useState(false);

  useEffect(() => {
    const ctx = gl.getContext();
    if (ctx && ctx.isContextLost()) {
      setTimeout(() => setIsLost(true), 0);
    }

    const onLost = () => setIsLost(true);
    const onRestored = () => setIsLost(false);

    const dom = gl.domElement;
    if (dom) {
      dom.addEventListener("webglcontextlost", onLost);
      dom.addEventListener("webglcontextrestored", onRestored);
    }

    return () => {
      if (dom) {
        dom.removeEventListener("webglcontextlost", onLost);
        dom.removeEventListener("webglcontextrestored", onRestored);
      }
    };
  }, [gl]);

  if (isLost) return null;

  return <EffectComposer>{children as React.ReactElement}</EffectComposer>;
};

// --- INSTANCED MESH COMPONENTS (PERFORMANCE CORE) ---

const NucleiInstances: React.FC<{ particles: NuclearParticle[] }> = ({
  particles,
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorActive = useMemo(() => new THREE.Color("#fbbf24"), []); // Amber-400
  const colorDecayed = useMemo(() => new THREE.Color("#64748b"), []); // Slate-500

  useFrame(() => {
    if (!meshRef.current) return;

    // Update matrices en kleuren in één batch
    particles.forEach((p, i) => {
      dummy.position.set(p.x, p.y, p.z);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);

      // Kleur update op basis van status
      meshRef.current!.setColorAt(i, p.decayed ? colorDecayed : colorActive);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor)
      meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, particles.length]}
    >
      <sphereGeometry args={[0.15, 16, 16]} />
      {/* BASIC MATERIAL for visibility in dark lab */}
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
};

const RadiationInstances: React.FC<{
  particles: EmittedParticle[];
  type: "alpha" | "beta" | "gamma";
}> = ({ particles, type }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Config per type (Kleur, Grootte, Emissive)
  const config = useMemo(() => {
    if (type === "alpha")
      return { color: "#ef4444", size: 0.2, emissiveIntensity: 2 };
    if (type === "beta")
      return { color: "#3b82f6", size: 0.08, emissiveIntensity: 5 };
    return { color: "#ffffff", size: 0.1, emissiveIntensity: 10 }; // Gamma
  }, [type]);

  const relevantParticles = useMemo(() => {
    if (type === "beta") {
      return particles.filter(
        (p) => p.type === "beta_minus" || p.type === "beta_plus",
      );
    }
    return particles.filter((p) => p.type === type);
  }, [particles, type]);

  useFrame(() => {
    if (!meshRef.current) return;

    // Reset count om ghosting te voorkomen als aantal daalt
    meshRef.current.count = relevantParticles.length;

    relevantParticles.forEach((p, i) => {
      dummy.position.set(p.position[0], p.position[1], p.position[2]);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, 2000]}>
      <sphereGeometry args={[config.size, 8, 8]} />
      <meshBasicMaterial color={config.color} toneMapped={false} />
    </instancedMesh>
  );
};

// --- CLOUD CHAMBER TRAIL COMPONENT ---

const RadiationTrails: React.FC<{ particles: EmittedParticle[] }> = ({
  particles,
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const [trailData] = useState(() => ({
    positions: new Float32Array(3000 * 3), // Max 1000 spoorpunten
    colors: new Float32Array(3000 * 3),
    opacities: new Float32Array(1000),
  }));

  useFrame(() => {
    if (!pointsRef.current) return;
    const positions = pointsRef.current.geometry!.attributes.position!
      .array as Float32Array;
    const colors = pointsRef.current.geometry!.attributes.color!
      .array as Float32Array;

    particles.forEach((p, i) => {
      if (i >= 1000) return;
      const idx = i * 3;
      // Positie van het deeltje wordt een vastgelegd ionisatiepunt
      positions[idx] = p.position[0];
      positions[idx + 1] = p.position[1];
      positions[idx + 2] = p.position[2];

      // Kleur op basis van type (consistent met HUD)
      const color = new THREE.Color(
        p.type === "alpha"
          ? "#ef4444"
          : p.type === "gamma"
            ? "#fbbf24"
            : "#3b82f6",
      );
      colors[idx] = color.r;
      colors[idx + 1] = color.g;
      colors[idx + 2] = color.b;
    });

    pointsRef.current.geometry!.attributes.position!.needsUpdate = true;
    pointsRef.current.geometry!.attributes.color!.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={1000}
          array={trailData.positions}
          itemSize={3}
          args={[trailData.positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          count={1000}
          array={trailData.colors}
          itemSize={3}
          args={[trailData.colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.4}
        blending={THREE.AdditiveBlending}
        sizeAttenuation={true}
      />
    </points>
  );
};

// --- STATIC SCENE COMPONENTS ---

const Shield: React.FC<{
  materialId: string;
  thickness: number;
  distance: number;
}> = ({ materialId, thickness, distance }) => {
  const material =
    SHIELDING_MATERIALS[materialId] || SHIELDING_MATERIALS["lead"]!;
  const x = (1.5 + (distance - 1.0)) / 2;
  const visualThickness = Math.max(0.01, thickness * 0.01);

  if (thickness === 0) return null;

  return (
    <mesh position={[x, 0, 0]}>
      <boxGeometry args={[visualThickness, 6, 6]} />
      <meshBasicMaterial color={material.color} transparent opacity={0.6} />
    </mesh>
  );
};

const DetectorVisual: React.FC<{ distance: number }> = ({ distance }) => {
  return (
    <group position={[distance, 0, 0]}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.8, 0.8, 2, 16]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>
      <mesh position={[1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.2, 0.2, 1.5, 8]} />
        <meshBasicMaterial color="#334155" />
      </mesh>
      <mesh position={[-1, 0, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
    </group>
  );
};

// --- AUDIO (GEIGER - OPTIMIZED) ---

const GeigerAudio: React.FC<{ detectionCount: number }> = ({
  detectionCount,
}) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const prevCountRef = useRef(detectionCount);
  const lastClickTimeRef = useRef(0);
  const [audioEnabled, setAudioEnabled] = useState(false);

  useEffect(() => {
    const enableAudio = () => {
      if (!audioContextRef.current) {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        audioContextRef.current = new AudioContextClass();
      }
      if (audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume().catch(() => {});
      }
      setAudioEnabled(true);
    };
    window.addEventListener("click", enableAudio, { once: true });
    return () => window.removeEventListener("click", enableAudio);
  }, []);

  useEffect(() => {
    if (!audioEnabled || !audioContextRef.current) return;

    const diff = detectionCount - prevCountRef.current;
    prevCountRef.current = detectionCount;

    // Alleen afspelen als er nieuwe hits zijn
    if (diff <= 0) return;

    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    // THROTTLE: Maximaal 1 click per 40ms (25 clicks/sec) om distortion/crash te voorkomen.
    // Bij hoge activiteit (>1000 CPM) zorgt dit voor een stabiel "ratelend" geluid zonder de CPU te overbelasten.
    if (now - lastClickTimeRef.current < 0.04) return;

    lastClickTimeRef.current = now;

    if (ctx.state === "suspended") ctx.resume().catch(() => {});

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Audio Design:
    // Square wave voor het "scherpe" Geiger geluid.
    // Lichte random variatie in frequentie voor analoog realisme.
    const baseFreq = diff > 5 ? 180 : 150; // Hogere toon bij massive influx
    const randomOffset = (Math.random() - 0.5) * 40;

    osc.type = "square";
    osc.frequency.setValueAtTime(baseFreq + randomOffset, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.05);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }, [detectionCount, audioEnabled]);

  return null;
};

// --- SCENE WRAPPER (FIXED: Props i.p.v. Hook) ---
const NuclearScene: React.FC<{ state: NuclearState }> = ({ state }) => {
  return (
    <group>
      <ambientLight intensity={0.4} />
      <pointLight
        position={[10, 10, 10]}
        intensity={1.5}
        castShadow
        color="#ffffff"
      />
      <spotLight
        position={[-10, 10, 10]}
        angle={0.15}
        penumbra={1}
        intensity={2}
        color="#fbbf24"
        castShadow
      />

      {/* Optimized Instanced Rendering */}
      <NucleiInstances particles={state.particles} />
      <RadiationInstances particles={state.emittedParticles} type="alpha" />
      <RadiationInstances particles={state.emittedParticles} type="beta" />
      <RadiationInstances particles={state.emittedParticles} type="gamma" />

      {/* Cloud Chamber Tracks */}
      <RadiationTrails particles={state.emittedParticles} />

      <DetectorVisual distance={state.detectorDistance} />
      <Shield
        materialId={state.shieldMaterial}
        thickness={state.shieldThickness}
        distance={state.detectorDistance}
      />
    </group>
  );
};

export const NuclearStage: React.FC = () => {
  const { state, activity, addCustomIsotope, setParam } = useNuclearEngine();
  const containerRef = useRef<HTMLDivElement>(null);

  const stats = useMemo(() => {
    const total = state.particles.length;
    const decayed = state.particles.filter((p) => p.decayed).length;
    const remaining = total - decayed;
    return { total, decayed, remaining };
  }, [state.particles]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#0f1014] overflow-hidden font-sans select-none"
    >
      {/* 3D Scene */}
      <div className="absolute inset-0 z-0">
        <Canvas
          eventSource={
            containerRef as React.RefObject<HTMLElement> as unknown as HTMLElement
          }
          camera={{ position: [0, 5, 20], fov: 45 }}
          dpr={[1, 2]}
          gl={{
            antialias: true,
            toneMapping: THREE.NoToneMapping,
            outputColorSpace: THREE.SRGBColorSpace,
          }}
        >
          <SceneStabilizer />
          <color attach="background" args={["#0f1014"]} />
          <fog attach="fog" args={["#0f1014", 20, 90]} />

          <PerspectiveCamera makeDefault position={[0, 8, 25]} />
          <SafeOrbitControls
            makeDefault
            enablePan={false}
            maxPolarAngle={Math.PI / 1.8}
            minDistance={5}
            maxDistance={50}
            target={[0, 2, 0]}
          />

          <ambientLight intensity={0.2} />
          <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
          <pointLight
            position={[-10, 5, -10]}
            intensity={0.5}
            color="#3b82f6"
          />

          <Stars
            radius={100}
            depth={50}
            count={5000}
            factor={4}
            saturation={0}
            fade
            speed={0.5}
          />
          <Grid
            position={[0, -2, 0]}
            args={[100, 100]}
            cellSize={1}
            cellThickness={0.5}
            cellColor="#1e293b"
            sectionSize={5}
            sectionThickness={1}
            sectionColor="#334155"
            fadeDistance={50}
            infiniteGrid
          />

          <NuclearScene state={state} />

          <SafeEffectComposer>
            <Bloom
              luminanceThreshold={0.2}
              luminanceSmoothing={0.9}
              height={300}
              intensity={1.2}
              radius={0.4}
            />
          </SafeEffectComposer>
        </Canvas>
      </div>

      <GeigerAudio detectionCount={state.detectionCount} />

      {/* --- UI OVERLAY --- */}

      {/* 1. TOP CENTER: Equation (Subtle "Anchor" with no margin to let component handle it) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <DecayEquation isotopeId={state.isotopeId} />
      </div>

      {/* 2. TOP LEFT: Status & Activity (Inputs/Status) */}
      <div className="absolute top-6 left-6 flex flex-col gap-4 w-[280px] pointer-events-none z-20">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-black text-white italic tracking-tighter drop-shadow-lg leading-none">
            KERNFYSICA <span className="text-emerald-400">LAB</span>
          </h2>
          <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
            Elite Engine v2.0
          </span>
          {/* B-Field Indicator (Header integrated) */}
          <div className="flex items-center gap-2 mt-1 bg-blue-500/5 border border-blue-500/10 px-2 py-1 rounded-lg self-start pointer-events-auto">
            <div
              className={`w-1 h-3 rounded-full shadow-[0_0_5px_rgba(59,130,246,0.5)] transition-colors ${Math.abs(state.magneticField) > 0 ? "bg-blue-500 animate-pulse" : "bg-slate-700"}`}
            />
            <span className="text-[9px] font-mono text-blue-300 font-bold uppercase">
              B-Veld <span className="text-blue-500/50 mx-1">|</span>{" "}
              {Math.abs(state.magneticField).toFixed(1)} T
            </span>
          </div>
        </div>

        {/* Activity Status Activity & Hits */}
        <div className="p-3 bg-black/10 backdrop-blur-xl rounded-2xl border border-white/5 shadow-xl pointer-events-auto flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                Activiteit (A)
              </span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-tighter">
                  LIVE
                </span>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <div className="flex items-baseline gap-1">
                <span className="text-emerald-400 font-mono font-bold text-xl leading-none tracking-tighter">
                  {activity > 1000
                    ? (activity / 1000).toFixed(2)
                    : activity.toFixed(1)}
                </span>
                <span className="text-emerald-500/50 text-[9px] font-black uppercase tracking-widest">
                  {activity > 1000 ? "kBq" : "Bq"}
                </span>
              </div>

              {/* Hits Integration Here */}
              <div className="h-4 w-[1px] bg-white/10 mx-2" />

              <div className="flex items-baseline gap-1">
                <span
                  className={`text-xl font-mono font-bold leading-none tracking-tighter transition-colors ${state.detectionCount > 0 ? "text-white" : "text-slate-500"}`}
                >
                  {state.detectionCount}
                </span>
                <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest">
                  CPM
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex flex-col gap-2 border-t border-white/5 pt-2">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                Verval
              </span>
              <span className="text-yellow-400 font-mono font-bold text-[10px] tracking-tighter">
                {Math.round((1 - stats.remaining / stats.total) * 100)}%
              </span>
            </div>
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400/80 transition-all duration-500 shadow-[0_0_10px_rgba(250,204,21,0.3)]"
                style={{
                  width: `${(1 - stats.remaining / stats.total) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Binding Energy Graph (Moved to Left) */}
        <div className="pointer-events-auto w-full">
          <BindingEnergyGraph isotopeId={state.isotopeId} />
        </div>
      </div>

      {/* 3. RIGHT SIDE: Theory & Tools stack */}
      <div className="absolute top-6 right-6 flex flex-col gap-4 w-[280px] pointer-events-none items-end">
        {/* Bio Range (Subtle) */}
        <div className="pointer-events-auto w-full">
          <BiologicalRangeHUD isotopeId={state.isotopeId} />
        </div>

        {/* Decay Scheme */}
        <div className="pointer-events-auto w-full">
          <DecaySchemeHUD isotopeId={state.isotopeId} />
        </div>
      </div>

      {/* 4. SIDEBAR & POPUP */}
      <IsotopeBuilderModal
        isOpen={state.isBuilderOpen}
        onClose={() => setParam("isBuilderOpen", false)}
        onSave={(iso) => {
          addCustomIsotope(iso);
          setParam("isBuilderOpen", false);
        }}
      />

      <IsotopeLibraryModal
        isOpen={state.isLibraryOpen}
        onClose={() => setParam("isLibraryOpen", false)}
      />

      <NuclearLab />
    </div>
  );
};
