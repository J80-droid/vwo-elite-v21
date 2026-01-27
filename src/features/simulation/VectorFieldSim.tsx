import "katex/dist/katex.min.css";

import { PerspectiveCamera, Stars } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useCanvasReady } from "@shared/hooks/useCanvasReady";
import { Info, RefreshCcw } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { InlineMath } from "react-katex";
import * as THREE from "three";

import { useModuleState } from "../physics";
import { SafeOrbitControls, SceneStabilizer } from "../threed-studio";

// --- CONFIGURATION ---
const SOLENOID_CONFIG = {
  loops: 12,
  radius: 2,
  length: 8,
};

interface Charge {
  id: string;
  position: [number, number, number];
  q: number; // in Coulombs
}

interface VectorItem {
  position: THREE.Vector3;
  direction: THREE.Vector3;
  magnitude: number;
  isInduction?: boolean;
}

// --- SCENE STABILIZER ---
// --- SAFE EFFECT COMPOSER ---
const SafeEffectComposer = ({ children }: { children: React.ReactNode }) => {
  const { gl } = useThree();
  const [isLost, setIsLost] = React.useState(false);

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

  return (
    <EffectComposer multisampling={0}>
      {children as React.ReactElement}
    </EffectComposer>
  );
};

// --- HELPER: SOLENOID B-FIELD CALCULATION ---
const calculateSolenoidField = (pos: THREE.Vector3): THREE.Vector3 => {
  const field = new THREE.Vector3(0, 0, 0);
  const { loops, radius, length } = SOLENOID_CONFIG;
  const startY = -length / 2;
  const stepY = length / (loops - 1);

  for (let i = 0; i < loops; i++) {
    const loopY = startY + i * stepY;
    const ry = pos.y - loopY;
    const r_xz = Math.sqrt(pos.x * pos.x + pos.z * pos.z);

    const distSq = pos.x * pos.x + ry * ry + pos.z * pos.z;
    if (distSq < 0.25) continue;

    const denom = Math.pow(radius * radius + ry * ry, 1.5);
    const factor = 150 / (denom * (1 + r_xz * 0.5));

    const By = factor * (radius * radius);
    const Br = (factor * (ry * r_xz * 0.8)) / (radius * radius + ry * ry);

    if (r_xz > 0.01) {
      const radialVec = new THREE.Vector3(pos.x, 0, pos.z)
        .normalize()
        .multiplyScalar(Br);
      field.add(new THREE.Vector3(radialVec.x, By, radialVec.z));
    }
  }
  return field.multiplyScalar(0.05);
};

const FieldVectors: React.FC<{
  type: "electric" | "magnetic" | "solenoid";
  charges: Charge[];
  showInduction?: boolean;
  sliceZ: number | null;
  strengthMultiplier: number;
}> = ({ type, charges, showInduction, sliceZ, strengthMultiplier }) => {
  const gridCount = 10;
  const spacing = 1.6;
  const arrowRef = useRef<THREE.InstancedMesh>(null);

  const vectors = useMemo(() => {
    const items: VectorItem[] = [];
    const start = -(gridCount * spacing) / 2;

    for (let x = 0; x < gridCount; x++) {
      for (let y = 0; y < gridCount; y++) {
        for (let z = 0; z < gridCount; z++) {
          const pos = new THREE.Vector3(
            start + x * spacing,
            start + y * spacing,
            start + z * spacing,
          );

          if (sliceZ !== null && Math.abs(pos.z - sliceZ) > 1) continue;

          const field = new THREE.Vector3(0, 0, 0);

          if (type === "electric") {
            charges.forEach((c) => {
              const cPos = new THREE.Vector3(...c.position);
              const rVec = new THREE.Vector3().subVectors(pos, cPos);
              const distance = rVec.length();
              if (distance < 0.5) return;

              const E_mag = (c.q * 10) / (distance * distance);
              field.add(rVec.normalize().multiplyScalar(E_mag));
            });
          } else if (type === "magnetic") {
            const r_xz = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
            if (r_xz < 0.4) continue;
            field
              .set(-pos.z, 0, pos.x)
              .normalize()
              .multiplyScalar(8 / r_xz);
          } else if (type === "solenoid") {
            const distanceFromAxis = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
            if (distanceFromAxis > 5.5) continue;
            field.copy(calculateSolenoidField(pos));
          }

          field.multiplyScalar(strengthMultiplier);
          const mag = field.length();

          if (mag > 0.05) {
            items.push({
              position: pos,
              direction: field.clone().normalize(),
              magnitude: mag,
            });

            if (type === "solenoid" && showInduction) {
              const tangential = new THREE.Vector3(-pos.z, 0, pos.x)
                .normalize()
                .multiplyScalar(1.5 * strengthMultiplier);
              items.push({
                position: pos.clone().add(new THREE.Vector3(0.05, 0.05, 0.05)),
                direction: tangential,
                magnitude: 0.8 * strengthMultiplier,
                isInduction: true,
              });
            }
          }
        }
      }
    }
    return items;
  }, [type, charges, showInduction, sliceZ, strengthMultiplier]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    if (!arrowRef.current || !vectors) return;
    const time = Date.now() * 0.002;

    vectors.forEach((v, i) => {
      dummy.position.copy(v.position);
      const target = new THREE.Vector3().addVectors(v.position, v.direction);
      dummy.lookAt(target);

      const magLog = Math.log10(v.magnitude * 4 + 1);
      const scaleLen = Math.min(Math.max(magLog * 1.2, 0.3), 1.8);
      const scaleWid = Math.min(Math.max(magLog * 0.8, 0.3), 1.0);

      const pulse =
        1 + Math.sin(time + v.position.x * 0.5 + v.position.y * 0.5) * 0.1;
      dummy.scale.set(scaleWid * pulse, scaleWid * pulse, scaleLen * pulse);
      dummy.updateMatrix();

      arrowRef.current!.setMatrixAt(i, dummy.matrix);

      if (v.isInduction) {
        color.set("#f59e0b");
      } else {
        const t = Math.min(Math.log10(v.magnitude * 3 + 1) / 2, 1);
        const hue = 0.66 * (1 - t);
        color.setHSL(hue, 1.0, 0.5);
      }
      arrowRef.current!.setColorAt(i, color);
    });

    arrowRef.current.instanceMatrix.needsUpdate = true;
    if (arrowRef.current.instanceColor)
      arrowRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh
      key={`${type}-${vectors.length}`}
      ref={arrowRef}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      args={[undefined as any, undefined as any, vectors?.length ?? 0]}
    >
      <coneGeometry args={[0.1, 0.4, 8]} />
      <meshBasicMaterial color="#ffffff" toneMapped={false} />
    </instancedMesh>
  );
};

// --- STANDALONE MOVING PARTICLE COMPONENT ---
interface ParticleData {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  q: number;
  m: number;
  active: boolean;
  id?: string;
}

const MovingParticle: React.FC<{
  particle: ParticleData | null;
  fieldType: "electric" | "magnetic" | "solenoid";
  charges: Charge[];
  strengthMultiplier: number;
  onUpdateMetrics: (metrics: {
    force: [number, number, number];
    velocity: [number, number, number];
    active: boolean;
  }) => void;
  onDeactivate: () => void;
}> = ({
  particle,
  fieldType,
  charges,
  strengthMultiplier,
  onUpdateMetrics,
  onDeactivate,
}) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const trailLine = useMemo(() => new THREE.Line(), []);
    const trailPositions = useMemo(() => new Float32Array(300), []);
    const trailIndex = useRef(0);
    const { gl } = useThree();

    const pRef = useRef<ParticleData | null>(null);

    useEffect(() => {
      if (particle && particle.active) {
        pRef.current = {
          ...particle,
          pos: new THREE.Vector3().copy(particle.pos),
          vel: new THREE.Vector3().copy(particle.vel),
        };
        trailIndex.current = 0;
        trailPositions.fill(0);
      } else {
        pRef.current = null;
      }
    }, [particle, particle?.active, particle?.id, trailPositions]);

    useFrame((_, delta) => {
      if (!pRef.current || !pRef.current.active || !meshRef.current) return;
      if (gl.getContext() && gl.getContext().isContextLost()) return;

      const p = pRef.current;
      const dt = Math.min(delta, 0.032);

      const F = new THREE.Vector3(0, 0, 0);
      const pos = p.pos;

      if (fieldType === "electric") {
        charges.forEach((c: Charge) => {
          const cPos = new THREE.Vector3(...c.position);
          const rVec = new THREE.Vector3().subVectors(pos, cPos);
          const distSq = rVec.lengthSq();
          if (distSq > 0.1) {
            const E_mag = (c.q * 10 * strengthMultiplier) / distSq;
            F.add(rVec.normalize().multiplyScalar(E_mag * p.q));
          }
        });
      } else if (fieldType === "magnetic") {
        const rxz = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
        if (rxz > 0.1) {
          const B = new THREE.Vector3(-pos.z, 0, pos.x)
            .normalize()
            .multiplyScalar((2 * strengthMultiplier) / rxz);
          const vxB = new THREE.Vector3().crossVectors(p.vel, B);
          F.add(vxB.multiplyScalar(p.q));
        }
      } else if (fieldType === "solenoid") {
        const B = calculateSolenoidField(pos).multiplyScalar(
          strengthMultiplier * 20,
        );
        const vxB = new THREE.Vector3().crossVectors(p.vel, B);
        F.add(vxB.multiplyScalar(p.q));
      }

      const oldSpeed = p.vel.length();
      const a = F.multiplyScalar(1 / p.m);
      p.vel.add(a.multiplyScalar(dt));

      if (fieldType !== "electric" && oldSpeed > 0.001) {
        const newSpeed = p.vel.length();
        const correction = oldSpeed / newSpeed;
        p.vel.multiplyScalar(correction);
      }

      p.pos.add(p.vel.clone().multiplyScalar(dt));
      if (meshRef.current) meshRef.current.position.copy(p.pos);

      if (p.pos.length() > 25) {
        p.active = false;
        onDeactivate();
      }

      if (Date.now() % 10 < 2) {
        onUpdateMetrics({
          force: [F.x, F.y, F.z],
          velocity: [p.vel.x, p.vel.y, p.vel.z],
          active: p.active,
        });
      }
    });

    if (!particle?.active) return null;

    return (
      <group>
        <mesh ref={meshRef} position={particle.pos}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial
            color={particle.q > 0 ? "#ef4444" : "#3b82f6"}
            toneMapped={false}
            emissive={particle.q > 0 ? "#ef4444" : "#3b82f6"}
            emissiveIntensity={1}
          />
        </mesh>
        <primitive object={trailLine} frustumCulled={false}>
          <bufferGeometry attach="geometry">
            <bufferAttribute
              attach="attributes-position"
              count={100}
              args={[trailPositions, 3]}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial
            attach="material"
            color="#facc15"
            opacity={0.6}
            transparent
            linewidth={2}
          />
        </primitive>
      </group>
    );
  };

interface VectorFieldSimProps {
  mode?: "sidebar" | "main" | "all" | "parameters" | "analysis";
}

export const VectorFieldSim: React.FC<VectorFieldSimProps> = ({
  mode = "all",
}) => {
  const { t } = useTranslation("physics");
  const { canvasReady } = useCanvasReady(150);
  const [moduleState, setModuleState] = useModuleState("vectors");

  const sliceZ = moduleState.sliceZ ?? null;
  const polarity = moduleState.polarity ?? 1;
  const strengthMultiplier = moduleState.strengthMultiplier ?? 1.0;
  const fieldType = moduleState.fieldType ?? "electric";
  const showInduction = moduleState.showInduction ?? false;
  const charges = moduleState.charges ?? [];
  const particle = (moduleState.particle as ParticleData) ?? null;

  const updateState = useCallback(
    (updates: Partial<typeof moduleState>) =>
      setModuleState((prev) => ({ ...prev, ...updates })),
    [setModuleState],
  );

  useEffect(() => {
    if (fieldType === "electric" && (charges?.length ?? 0) === 0) {
      updateState({
        charges: [
          { id: "1", position: [-3, 0, 0], q: 1 },
          { id: "2", position: [3, 0, 0], q: -1 },
        ],
      });
    }
  }, [fieldType, charges?.length, updateState]);

  const shootParticle = () => {
    const startPos =
      fieldType === "solenoid"
        ? new THREE.Vector3(-8, 0, 2)
        : new THREE.Vector3(-8, 2, 0);

    updateState({
      particle: {
        pos: startPos,
        vel: new THREE.Vector3(5, 0, 0),
        q: polarity,
        m: 1,
        active: true,
        id: Math.random().toString(36).substr(2, 9),
      },
    });
  };

  const resetParticle = () => {
    updateState({ particle: null, metrics: null });
  };

  // Use state instead of ref to ensure re-render when container is available
  const [container, setContainer] = React.useState<HTMLDivElement | null>(null);

  if (mode === "sidebar") {
    return (
      <div className="flex flex-row items-center gap-6">
        <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/10">
          <button
            onClick={() => updateState({ fieldType: "electric" })}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${fieldType === "electric" ? "border-emerald-500 bg-emerald-500/10 text-emerald-400" : "border-white/5 text-slate-500 hover:text-white"}`}
          >
            {t("vector_field.e_field")}
          </button>
          <button
            onClick={() => updateState({ fieldType: "magnetic" })}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${fieldType === "magnetic" ? "border-blue-500 bg-blue-500/10 text-blue-400" : "border-white/5 text-slate-500 hover:text-white"}`}
          >
            {t("vector_field.b_wire")}
          </button>
          <button
            onClick={() => updateState({ fieldType: "solenoid" })}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${fieldType === "solenoid" ? "border-purple-500 bg-purple-500/10 text-purple-400" : "border-white/5 text-slate-500 hover:text-white"}`}
          >
            {t("vector_field.b_solenoid")}
          </button>
        </div>
        <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/10">
          <span className="text-[9px] font-black text-slate-500">
            {t("vector_field.slice") as string}
          </span>
          <input
            type="range"
            min="-8"
            max="8"
            step="1"
            className="w-16 accent-emerald-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
            onChange={(e) =>
              updateState({ sliceZ: parseFloat(e.target.value) })
            }
            value={sliceZ ?? 0}
          />
          <button
            onClick={() => updateState({ sliceZ: sliceZ === null ? 0 : null })}
            className={`text-[9px] px-2 py-0.5 rounded border ${sliceZ !== null ? "border-emerald-500 text-emerald-400" : "border-white/5 text-slate-600"}`}
          >
            {sliceZ !== null ? "ON" : "OFF"}
          </button>
        </div>
        <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/10">
          <span className="text-[9px] font-black text-slate-500">
            {t("vector_field.power") as string}
          </span>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            className="w-16 accent-emerald-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
            onChange={(e) =>
              updateState({ strengthMultiplier: parseFloat(e.target.value) })
            }
            value={strengthMultiplier}
          />
          <span className="text-[9px] font-mono text-emerald-400 min-w-[20px]">
            {strengthMultiplier.toFixed(1)}x
          </span>
        </div>
        <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/10">
          <div className="flex rounded-lg overflow-hidden border border-white/5">
            <button
              onClick={() => updateState({ polarity: 1 })}
              className={`px-2 py-1 text-[10px] font-black ${polarity === 1 ? "bg-red-500/20 text-red-400" : "bg-black/20 text-slate-600"}`}
            >
              +
            </button>
            <button
              onClick={() => updateState({ polarity: -1 })}
              className={`px-2 py-1 text-[10px] font-black ${polarity === -1 ? "bg-blue-500/20 text-blue-400" : "bg-black/20 text-slate-600"}`}
            >
              -
            </button>
          </div>
          <button
            onClick={shootParticle}
            className="btn-elite-neon btn-elite-neon-amber !py-1.5 !px-3 !text-[10px]"
          >
            {t("vector_field.shoot") as string}
          </button>
          <button
            onClick={resetParticle}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <RefreshCcw size={14} />
          </button>
        </div>
        {fieldType === "solenoid" && (
          <button
            onClick={() => updateState({ showInduction: !showInduction })}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${showInduction ? "border-amber-500 bg-amber-500/10 text-amber-400" : "border-white/5 text-slate-500 hover:text-white"}`}
          >
            <RefreshCcw
              size={12}
              className={showInduction ? "animate-spin" : ""}
            />
            {t("vector_field.induction") as string}
          </button>
        )}
      </div>
    );
  }

  if (mode === "parameters") {
    return (
      <div className="bg-black/20 backdrop-blur-md p-4 rounded-3xl border border-white/10 space-y-4 shadow-2xl">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-lg bg-blue-500/20 border border-blue-500/20">
            <Info className="text-blue-400" size={14} />
          </div>
          <span className="text-blue-400 font-black text-[10px] uppercase tracking-widest">
            {t("vector_field.status") as string}
          </span>
        </div>
        <div className="space-y-3 text-[10px]">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <span className="text-slate-500 font-bold uppercase tracking-wider">
              {t("vector_field.field_type") as string}
            </span>
            <span className="text-white font-mono uppercase bg-white/5 px-2 py-0.5 rounded text-[9px]">
              {
                t(
                  `vector_field.b_${fieldType}`,
                  fieldType === "electric"
                    ? t("vector_field.e_field")
                    : fieldType,
                ) as string
              }
            </span>
          </div>
          {fieldType === "electric" && (
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-slate-500 font-bold uppercase tracking-wider">
                {t("vector_field.field_strength") as string}
              </span>
              <span className="text-white font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[9px]">
                {(charges?.length ?? 0) > 0
                  ? (
                    (charges?.length ?? 0) *
                    8.98e8 *
                    strengthMultiplier
                  ).toExponential(1)
                  : "0.0e+0"}{" "}
                N/C
              </span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-bold uppercase tracking-wider">
              {t("vector_field.particle_active") as string}
            </span>
            <span
              className={`font-mono text-[9px] ${particle?.active ? "text-emerald-400" : "text-slate-500"}`}
            >
              {particle?.active
                ? (t("common.yes", "YES") as string)
                : (t("common.no", "NO") as string)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "analysis") {
    const metrics = moduleState.metrics || {
      force: [0, 0, 0],
      velocity: [0, 0, 0],
      active: false,
    };
    const F = new THREE.Vector3(...(metrics.force || [0, 0, 0]));
    const V = new THREE.Vector3(...(metrics.velocity || [0, 0, 0]));

    return (
      <div className="flex flex-col gap-4">
        <div className="bg-black/20 backdrop-blur-md p-4 rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <Info size={40} className="text-emerald-500" />
          </div>
          <div className="flex items-center gap-2 mb-3 relative z-10">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/20">
              <Info className="text-emerald-400" size={14} />
            </div>
            <span className="text-emerald-400 font-black text-[10px] uppercase tracking-[0.2em]">
              {t("vector_field.telemetry") as string}
            </span>
          </div>
          <div className="text-[9px] text-slate-400 leading-relaxed font-bold uppercase tracking-wider relative z-10 mb-4 px-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
              <span>{t("vector_field.legend_weak") as string}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
              <span>{t("vector_field.legend_medium") as string}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
              <span>{t("vector_field.legend_strong") as string}</span>
            </div>
          </div>
          {(particle?.active || metrics.active) && (
            <div className="animate-in slide-in-from-top duration-500 space-y-4 pt-4 border-t border-white/5 relative z-10">
              <div className="bg-yellow-500/5 p-3 rounded-2xl border border-yellow-500/10">
                <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">
                  <span>
                    {t("vector_field.force") as string} (
                    <InlineMath math="\vec{F}" />)
                  </span>
                  <span className="text-yellow-400 font-mono">
                    {F.length().toFixed(2)} N
                  </span>
                </div>
                <div className="font-mono text-[9px] text-yellow-500/60 break-all bg-black/40 p-2 rounded-xl flex justify-around">
                  <span>{F.x.toFixed(1)}x</span>
                  <span>{F.y.toFixed(1)}y</span>
                  <span>{F.z.toFixed(1)}z</span>
                </div>
              </div>
              <div className="bg-blue-500/5 p-3 rounded-2xl border border-blue-500/10">
                <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">
                  <span>
                    {t("vector_field.velocity") as string} (
                    <InlineMath math="\vec{v}" />)
                  </span>
                  <span className="text-blue-400 font-mono">
                    {V.length().toFixed(2)} m/s
                  </span>
                </div>
                <div className="font-mono text-[9px] text-blue-500/60 break-all bg-black/40 p-2 rounded-xl flex justify-around">
                  <span>{V.x.toFixed(1)}x</span>
                  <span>{V.y.toFixed(1)}y</span>
                  <span>{V.z.toFixed(1)}z</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setContainer}
      className="w-full h-full bg-black relative flex flex-col overflow-hidden"
    >
      {canvasReady && container && (
        <Canvas
          shadows
          className="flex-1"
          eventSource={container}
          gl={{ powerPreference: "high-performance", antialias: false }}
          dpr={[1, 2]}
        >
          <SceneStabilizer />
          <PerspectiveCamera makeDefault position={[10, 10, 15]} fov={50} />
          <SafeOrbitControls makeDefault enableDamping dampingFactor={0.05} />
          <Stars
            radius={100}
            depth={50}
            count={5000}
            factor={4}
            saturation={0}
            fade
            speed={1}
          />
          <ambientLight intensity={1.5} />
          <pointLight
            position={[10, 10, 10]}
            intensity={2.0}
            color="#ffffff"
            castShadow
          />
          <FieldVectors
            type={fieldType}
            charges={charges}
            showInduction={showInduction}
            sliceZ={sliceZ}
            strengthMultiplier={strengthMultiplier}
          />
          {fieldType === "electric" &&
            (charges || []).map((c: Charge) => (
              <mesh key={c.id} position={c.position}>
                <sphereGeometry args={[0.3, 32, 32]} />
                <meshStandardMaterial
                  color={c.q > 0 ? "#ef4444" : "#06b6d4"}
                  emissive={c.q > 0 ? "#b91c1c" : "#0891b2"}
                  emissiveIntensity={3}
                  toneMapped={false}
                />
              </mesh>
            ))}
          {fieldType === "magnetic" && (
            <mesh rotation={[0, 0, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 20, 16]} />
              <meshStandardMaterial
                color="#cbd5e1"
                emissive="#94a3b8"
                emissiveIntensity={0.5}
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>
          )}
          {fieldType === "solenoid" && (
            <group>
              {Array.from({ length: SOLENOID_CONFIG.loops }).map((_, i) => (
                <mesh
                  key={i}
                  position={[
                    0,
                    -SOLENOID_CONFIG.length / 2 +
                    i *
                    (SOLENOID_CONFIG.length / (SOLENOID_CONFIG.loops - 1)),
                    0,
                  ]}
                  rotation={[Math.PI / 2, 0, 0]}
                >
                  <torusGeometry
                    args={[SOLENOID_CONFIG.radius, 0.05, 16, 30]}
                  />
                  <meshStandardMaterial
                    color="#fbbf24"
                    emissive="#d97706"
                    emissiveIntensity={2}
                    metalness={0.6}
                    roughness={0.2}
                  />
                </mesh>
              ))}
            </group>
          )}
          <MovingParticle
            particle={particle}
            fieldType={fieldType}
            charges={charges}
            strengthMultiplier={strengthMultiplier}
            onUpdateMetrics={(m) => updateState({ metrics: m })}
            onDeactivate={() =>
              updateState({ particle: { ...particle!, active: false } })
            }
          />
          <gridHelper
            args={[20, 20, "#475569", "#334155"]}
            position={[0, -5, 0]}
          />
          <SafeEffectComposer>
            <Bloom luminanceThreshold={0.5} intensity={1.5} radius={0.5} />
          </SafeEffectComposer>
        </Canvas>
      )}
    </div>
  );
};
