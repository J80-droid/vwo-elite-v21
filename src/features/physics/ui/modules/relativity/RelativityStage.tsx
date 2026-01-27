import { SafeOrbitControls } from "@features/threed-studio";
import { Grid, Line, PerspectiveCamera, Stars, Text } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { EventBuilderModal } from "./EventBuilderModal";
import { LengthContractionHUD } from "./LengthContractionHUD";
import { LorentzFactorHUD } from "./LorentzFactorHUD";
import { RelativitySidebar } from "./RelativitySidebar";
import { RelativityTheory } from "./RelativityTheory";
import { ScenarioLibraryModal } from "./ScenarioLibraryModal";
import { SpacetimeEventHUD } from "./SpacetimeEventHUD";
import { TimeDilationGraph } from "./TimeDilationGraph";
import {
  lorentzTransform,
  SpacetimeEvent,
  useRelativityEngine,
  Worldline,
} from "./useRelativityEngine";

// --- Scene Stabilizer ---
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

// --- Safe Effect Composer ---
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

// --- Light Cone Component ---
const LightCone: React.FC<{ visible: boolean }> = ({ visible }) => {
  if (!visible) return null;

  return (
    <group>
      {/* Future Light Cone (upward) */}
      <mesh position={[0, 5, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[5, 10, 32, 1, true]} />
        <meshBasicMaterial
          color="#fbbf24"
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          wireframe
        />
      </mesh>
      {/* Past Light Cone (downward) */}
      <mesh position={[0, -5, 0]}>
        <coneGeometry args={[5, 10, 32, 1, true]} />
        <meshBasicMaterial
          color="#fbbf24"
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          wireframe
        />
      </mesh>
      {/* Light Cone Edge Lines */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[
              new Float32Array([
                // Future cone edges
                0, 0, 0, 5, 10, 0, 0, 0, 0, -5, 10, 0, 0, 0, 0, 0, 10, 5, 0, 0,
                0, 0, 10, -5,
                // Past cone edges
                0, 0, 0, 5, -10, 0, 0, 0, 0, -5, -10, 0, 0, 0, 0, 0, -10, 5, 0,
                0, 0, 0, -10, -5,
              ]),
              3,
            ]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#fbbf24" transparent opacity={0.6} />
      </lineSegments>
    </group>
  );
};

// --- Lorentz Axes (Primed Frame S') ---
const LorentzAxes: React.FC<{ beta: number; visible: boolean }> = ({
  beta,
  visible,
}) => {
  if (!visible || Math.abs(beta) < 0.01) return null;

  // The angle of the primed axes relative to the unprimed axes
  // x' axis makes angle arctan(β) with x axis
  // t' axis makes angle arctan(β) with t axis
  const angle = Math.atan(beta);

  return (
    <group>
      {/* x' axis (rotated x axis) */}
      <group rotation={[0, 0, -angle]}>
        <mesh position={[5, 0, 0]}>
          <boxGeometry args={[10, 0.02, 0.02]} />
          <meshBasicMaterial color="#f43f5e" />
        </mesh>
        <Text
          position={[10, 0.3, 0]}
          fontSize={0.4}
          color="#f43f5e"
          anchorX="left"
        >
          x'
        </Text>
      </group>
      {/* ct' axis (rotated t axis) */}
      <group rotation={[0, 0, angle]}>
        <mesh position={[0, 5, 0]}>
          <boxGeometry args={[0.02, 10, 0.02]} />
          <meshBasicMaterial color="#f43f5e" />
        </mesh>
        <Text
          position={[0.3, 10, 0]}
          fontSize={0.4}
          color="#f43f5e"
          anchorX="left"
        >
          ct'
        </Text>
      </group>
    </group>
  );
};

// --- Spacetime Events (Instanced) ---
const SpacetimeEvents: React.FC<{
  events: SpacetimeEvent[];
  beta: number;
  showTransformed: boolean;
}> = ({ events, beta, showTransformed }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    if (!meshRef.current) return;

    events.forEach((event, i) => {
      // Position: x on x-axis, t on y-axis (vertical), z = 0
      dummy.position.set(event.x, event.t, 0);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);

      // Color from event
      const color = new THREE.Color(event.color);
      meshRef.current!.setColorAt(i, color);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, Math.max(events.length, 1)]}
      >
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      {/* Labels */}
      {events.map((event) => {
        const transformed = showTransformed
          ? lorentzTransform(event.x, event.t, beta)
          : null;

        return (
          <group key={event.id}>
            <Text
              position={[event.x + 0.4, event.t + 0.3, 0]}
              fontSize={0.3}
              color="#ffffff"
              anchorX="left"
            >
              {event.label}
            </Text>
            {transformed && (
              <Text
                position={[event.x + 0.4, event.t - 0.2, 0]}
                fontSize={0.2}
                color="#f43f5e"
                anchorX="left"
              >
                {`(${transformed.x.toFixed(1)}, ${transformed.t.toFixed(1)})'`}
              </Text>
            )}
          </group>
        );
      })}
    </group>
  );
};

// --- Worldlines ---
const WorldlineVisual: React.FC<{
  worldline: Worldline;
  visible: boolean;
}> = ({ worldline, visible }) => {
  // Create points for worldline from t = -10 to t = 10
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let t = -10; t <= 10; t += 0.5) {
      const x = worldline.beta * t; // x = vt = βt (since c=1)
      pts.push(new THREE.Vector3(x, t, 0));
    }
    return pts;
  }, [worldline.beta]);

  if (!visible) return null;

  return (
    <group>
      <Line points={points} color={worldline.color} lineWidth={2} />
      <Text
        position={[worldline.beta * 8 + 0.5, 8, 0]}
        fontSize={0.25}
        color={worldline.color}
        anchorX="left"
      >
        {worldline.label}
      </Text>
    </group>
  );
};

// --- Main Scene ---
interface RelativitySceneProps {
  beta: number;
  events: SpacetimeEvent[];
  worldlines: Worldline[];
  showLightCone: boolean;
  showGrid: boolean;
  showLorentzAxes: boolean;
  showWorldlines: boolean;
}

const RelativityScene: React.FC<RelativitySceneProps> = ({
  beta,
  events,
  worldlines,
  showLightCone,
  showGrid,
  showLorentzAxes,
  showWorldlines,
}) => {
  return (
    <group>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
      <pointLight position={[-10, 5, -10]} intensity={0.5} color="#3b82f6" />

      {/* Reference Frame Axes (S) */}
      {showGrid && (
        <group>
          {/* x-axis */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[20, 0.03, 0.03]} />
            <meshBasicMaterial color="#94a3b8" />
          </mesh>
          <Text position={[10, 0.4, 0]} fontSize={0.4} color="#94a3b8">
            x
          </Text>

          {/* ct-axis (time) */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.03, 20, 0.03]} />
            <meshBasicMaterial color="#94a3b8" />
          </mesh>
          <Text position={[0.4, 10, 0]} fontSize={0.4} color="#94a3b8">
            ct
          </Text>
        </group>
      )}

      {/* Light Cone */}
      <LightCone visible={showLightCone} />

      {/* Primed Axes */}
      <LorentzAxes beta={beta} visible={showLorentzAxes} />

      {/* Worldlines */}
      {worldlines.map((wl) => (
        <WorldlineVisual key={wl.id} worldline={wl} visible={showWorldlines} />
      ))}

      {/* Events */}
      <SpacetimeEvents
        events={events}
        beta={beta}
        showTransformed={showLorentzAxes}
      />
    </group>
  );
};

// --- Main Stage Component ---
export const RelativityStage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engine = useRelativityEngine();

  return (
    <div
      ref={containerRef}
      className="w-full flex flex-col bg-[#0f1014] font-sans select-none"
    >
      {/* HERO SECTION: 3D Scene + Overlays */}
      <div className="relative w-full h-[calc(100vh-4rem)] shrink-0 overflow-hidden">
        {/* 3D Scene */}
        <div className="absolute inset-0 z-0">
          <Canvas
            eventSource={containerRef as React.RefObject<HTMLElement>}
            camera={{ position: [0, 0, 25], fov: 50 }}
            dpr={[1, 2]}
            gl={{
              antialias: true,
              toneMapping: THREE.NoToneMapping,
              outputColorSpace: THREE.SRGBColorSpace,
            }}
          >
            <SceneStabilizer />
            <color attach="background" args={["#0f1014"]} />
            <fog attach="fog" args={["#0f1014", 30, 100]} />

            <PerspectiveCamera makeDefault position={[0, 0, 25]} />
            <SafeOrbitControls
              makeDefault
              enablePan={true}
              maxPolarAngle={Math.PI}
              minDistance={5}
              maxDistance={60}
              target={[0, 0, 0]}
            />

            <Stars
              radius={100}
              depth={50}
              count={3000}
              factor={4}
              saturation={0}
              fade
              speed={0.3}
            />

            <Grid
              position={[0, 0, -0.1]}
              args={[40, 40]}
              cellSize={1}
              cellThickness={0.5}
              cellColor="#1e293b"
              sectionSize={5}
              sectionThickness={1}
              sectionColor="#334155"
              fadeDistance={50}
              rotation={[0, 0, 0]}
            />

            <RelativityScene
              beta={engine.beta}
              events={engine.events}
              worldlines={engine.worldlines}
              showLightCone={engine.showLightCone}
              showGrid={engine.showGrid}
              showLorentzAxes={engine.showLorentzAxes}
              showWorldlines={engine.showWorldlines}
            />

            <SafeEffectComposer>
              <Bloom
                luminanceThreshold={0.3}
                luminanceSmoothing={0.9}
                height={300}
                intensity={0.8}
                radius={0.3}
              />
            </SafeEffectComposer>
          </Canvas>
        </div>

        {/* --- UI OVERLAY --- */}

        {/* TOP CENTER: Title */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="bg-black/30 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/10">
            <h1 className="text-lg font-black text-white tracking-tight">
              SPECIALE <span className="text-rose-400">RELATIVITEIT</span>
            </h1>
            <p className="text-[10px] text-slate-400 text-center uppercase tracking-widest">
              Minkowski Spacetime
            </p>
          </div>
        </div>

        {/* TOP LEFT: Status & Lorentz Factor */}
        <div className="absolute top-6 left-6 flex flex-col gap-4 w-[280px] pointer-events-none z-20">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-black text-white italic tracking-tighter drop-shadow-lg leading-none">
              RELATIVITEIT <span className="text-rose-400">LAB</span>
            </h2>
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
              Elite Engine v2.0
            </span>
          </div>

          {/* Lorentz Factor HUD */}
          <div className="pointer-events-auto w-full">
            <LorentzFactorHUD />
          </div>

          {/* Time Dilation Graph */}
          <div className="pointer-events-auto w-full">
            <TimeDilationGraph />
          </div>
        </div>

        {/* TOP RIGHT: Theory & Tools */}
        <div className="absolute top-6 right-6 flex flex-col gap-4 w-[280px] pointer-events-none items-end z-20">
          {/* Spacetime Event HUD */}
          <div className="pointer-events-auto w-full">
            <SpacetimeEventHUD />
          </div>

          {/* Length Contraction HUD */}
          <div className="pointer-events-auto w-full">
            <LengthContractionHUD />
          </div>
        </div>

        {/* Modals */}
        <EventBuilderModal
          isOpen={engine.isEventBuilderOpen}
          onClose={() => engine.setParam("isEventBuilderOpen", false)}
        />
        <ScenarioLibraryModal
          isOpen={engine.isScenarioLibraryOpen}
          onClose={() => engine.setParam("isScenarioLibraryOpen", false)}
        />
      </div>

      {/* THEORY SECTION */}
      <RelativityTheory />

      {/* SHARED HUD OVERLAY / SIDEBAR */}
      <RelativitySidebar />
    </div>
  );
};

// Keep old export for backwards compatibility
