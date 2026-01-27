import { KinematicsGraphs } from "@features/simulation";
import { SafeOrbitControls, SceneStabilizer } from "@features/threed-studio";
import {
  ContactShadows,
  Grid,
  PerspectiveCamera,
  Stars,
  Trail,
} from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import React, { useRef } from "react";
import * as THREE from "three";

import { useKinematicsEngine } from "./useKinematicsEngine";

// 3D Vector Arrow Component
const VectorArrow = ({
  position,
  direction,
  length,
  color,
}: {
  position: [number, number, number];
  direction: [number, number, number];
  length: number;
  color: string;
}) => {
  if (length < 0.1) return null; // Hide if too small

  const dir = new THREE.Vector3(...direction).normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir,
  );

  return (
    <group position={position}>
      <group quaternion={quaternion}>
        <mesh position={[0, length / 2, 0]}>
          <cylinderGeometry args={[0.08, 0.08, length, 8]} />
          <meshBasicMaterial
            color={color}
            toneMapped={false}
            transparent
            opacity={0.8}
          />
        </mesh>
        <mesh position={[0, length + 0.2, 0]}>
          <coneGeometry args={[0.2, 0.4, 8]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
};

const KinematicsScene = () => {
  const { state } = useKinematicsEngine();
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const vehicleRef = useRef<THREE.Group>(null);

  // Follow Cam Logic
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  // Follow Cam Logic
  useFrame((_, _delta) => {
    if (vehicleRef.current && cameraRef.current) {
      const carPos = vehicleRef.current.position;
      const isReversing = state.v < -0.1;

      // Smart Camera:
      // Forward: Camera trails (-12), looks forward (+5)
      // Reverse: Camera leads (+12) or trails movement, looks backward (-5)
      // Let's make it orbit to the "front" (relative to motion)

      const targetOffset = isReversing ? 12 : -12;
      const lookOffset = isReversing ? -5 : 5;

      const targetCamPos = new THREE.Vector3(
        carPos.x + targetOffset,
        carPos.y + 6,
        carPos.z + 8,
      );

      cameraRef.current.position.lerp(targetCamPos, 0.05); // Slightly smoother
      cameraRef.current.lookAt(carPos.x + lookOffset, carPos.y, 0);
    }
  });

  // Ghost Car Logic: Linear Interpolation for smoothness
  let ghostPos = null;
  if (
    state.ghostMode &&
    state.previousHistory &&
    state.previousHistory.length > 1
  ) {
    const hist = state.previousHistory;
    const t = state.time;

    // Find segment
    // Assuming sorted history
    const idx = hist.findIndex((p) => p.t >= t);
    const firstHist = hist[0];
    const lastHist = hist[hist.length - 1];

    if (idx === 0 && firstHist) {
      ghostPos = firstHist.x;
    } else if (idx !== -1) {
      const p1 = hist[idx - 1];
      const p2 = hist[idx];
      if (p1 && p2) {
        const factor = (t - p1.t!) / (p2.t! - p1.t! || 1);
        ghostPos = lerp(p1.x!, p2.x!, factor);
      }
    } else if (lastHist && t > lastHist.t) {
      // End of history
      ghostPos = lastHist.x;
    }
  }

  return (
    <group>
      {/* LIGHTING */}
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#0ea5e9" />
      <pointLight
        position={[state.x, 2, 0]}
        intensity={3}
        color="#f43f5e"
        distance={15}
      />

      {/* TRACK */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[500, -0.05, 0]}>
        <planeGeometry args={[1200, 14]} />
        <meshStandardMaterial color="#020617" roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Track Glow Edges */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[500, -0.04, 7]}>
        <planeGeometry args={[1200, 0.5]} />
        <meshBasicMaterial color="#0ea5e9" toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[500, -0.04, -7]}>
        <planeGeometry args={[1200, 0.5]} />
        <meshBasicMaterial color="#0ea5e9" toneMapped={false} />
      </mesh>

      {/* Distance Markers */}
      {Array.from({ length: 41 }).map((_, i) => (
        <group key={i} position={[i * 25, 0, 0]}>
          <mesh position={[0, 0.05, -8]}>
            <boxGeometry args={[0.2, 0.1, 4]} />
            <meshBasicMaterial color="#ffffff" opacity={0.3} transparent />
          </mesh>
          {/* Add subtle markers on floor too */}
          <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.5, 12]} />
            <meshBasicMaterial color="#ffffff" opacity={0.05} transparent />
          </mesh>
        </group>
      ))}

      {/* GHOST VEHICLE */}
      {ghostPos !== null && ghostPos !== undefined && (
        <group position={[ghostPos, 0, 0]}>
          <mesh position={[0, 0.8, 0]}>
            <boxGeometry args={[4.5, 1.2, 1.8]} />
            <meshBasicMaterial
              color="#ffffff"
              wireframe
              transparent
              opacity={0.2}
            />
          </mesh>
        </group>
      )}

      {/* VEHICLE - TRON LIGHT CYCLE STYLE */}
      <group ref={vehicleRef} position={[state.x, 0, 0]}>
        {/* Main Body - Streamlined */}
        <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.5, 1.2, 1.8]} />
          {/* In a real app we'd load a GLTF, but here we sculpt with primitives */}
          <meshPhysicalMaterial
            color="#1e293b"
            metalness={1.0}
            roughness={0.15}
            clearcoat={1}
          />
        </mesh>

        {/* Cockpit / Engine Glow - Top */}
        <mesh position={[-0.5, 1.41, 0]}>
          <boxGeometry args={[2.5, 0.1, 1.2]} />
          <meshBasicMaterial color="#f43f5e" />
        </mesh>

        {/* Rear Engine Glow */}
        <mesh position={[-2.3, 0.8, 0]}>
          <boxGeometry args={[0.2, 0.8, 1.4]} />
          <meshBasicMaterial color="#f43f5e" toneMapped={false} />
        </mesh>

        {/* Trail Effect */}
        {state.isPlaying && (
          <Trail
            width={1.8}
            length={20}
            color="#f43f5e"
            attenuation={(t) => t * t}
          >
            <mesh position={[-2.3, 0.8, 0]}>
              <boxGeometry args={[0.1, 0.8, 1.4]} />
              <meshBasicMaterial color="#f43f5e" transparent opacity={0} />
            </mesh>
          </Trail>
        )}

        {/* Side Stripes */}
        <mesh position={[0, 0.8, 0.91]}>
          <planeGeometry args={[3, 0.2]} />
          <meshBasicMaterial color="#0ea5e9" toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.8, -0.91]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[3, 0.2]} />
          <meshBasicMaterial color="#0ea5e9" toneMapped={false} />
        </mesh>

        {/* WHEELS - 4 Corner Configuration */}
        {/* Positions: Front/Rear +/- 1.5, Left/Right +/- 1.0 */}
        {[
          [1.5, 0.5, 1.0], // Front Left
          [1.5, 0.5, -1.0], // Front Right
          [-1.5, 0.5, 1.0], // Rear Left
          [-1.5, 0.5, -1.0], // Rear Right
        ].map((pos, i) => (
          <group key={i} position={[pos[0]!, pos[1]!, pos[2]!]}>
            {/* Tire - Neon Ring (Vertical) */}
            <mesh>
              <torusGeometry args={[0.45, 0.15, 16, 32]} />
              <meshBasicMaterial color="#bef264" toneMapped={false} />
            </mesh>
            {/* Rim/Hub */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.35, 0.35, 0.4, 24]} />
              <meshPhysicalMaterial
                color="#0f172a"
                metalness={0.9}
                roughness={0.1}
              />
            </mesh>
          </group>
        ))}

        {/* VECTOR VISUALIZATION */}
        {state.showVectors && (
          <group position={[0, 2.5, 0]}>
            {/* Velocity Vector (Green, Forward/Backward) */}
            <VectorArrow
              position={[0, 0, 0]}
              direction={[Math.sign(state.v) || 1, 0, 0]}
              length={Math.abs(state.v) * 0.1}
              color="#34d399"
            />
            {/* Acceleration Vector (Amber, Forward/Backward) */}
            <VectorArrow
              position={[0, 0.5, 0]}
              direction={[Math.sign(state.a), 0, 0]}
              length={Math.abs(state.a) * 0.5} // Scale factor
              color="#fbbf24"
            />
          </group>
        )}
      </group>

      {/* ENVIRONMENT */}
      <Grid
        position={[0, -0.1, 0]}
        args={[2000, 100]}
        cellSize={2}
        cellThickness={0.8}
        cellColor="#1e293b"
        sectionSize={20}
        sectionThickness={1.5}
        sectionColor="#334155"
        fadeDistance={150}
        infiniteGrid
      />
      <Stars
        radius={100}
        depth={50}
        count={6000}
        factor={4}
        saturation={0}
        fade
        speed={0.5}
      />
      <ContactShadows
        resolution={1024}
        scale={50}
        blur={2}
        opacity={0.6}
        far={10}
        color="#000000"
      />

      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        position={[-10, 5, 10]}
        fov={55}
      />
      <SceneStabilizer />
      <SafeOrbitControls makeDefault />
    </group>
  );
};

export const Kinematics3DStage: React.FC = () => {
  const { state } = useKinematicsEngine();
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="w-full h-full bg-[#020617] relative">
      <Canvas
        shadows
        eventSource={
          containerRef as React.RefObject<HTMLElement> as unknown as HTMLElement
        }
        dpr={[1, 2]}
        gl={{
          antialias: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
      >
        <KinematicsScene />
        <EffectComposer>
          <Bloom
            luminanceThreshold={1}
            mipmapBlur
            intensity={1.8}
            radius={0.7}
          />
        </EffectComposer>
      </Canvas>

      {/* Overlay UI for context */}
      <div className="absolute top-4 left-4 pointer-events-none z-10">
        <h2
          className="text-3xl font-black text-white italic tracking-tighter drop-shadow-lg"
          style={{ fontFamily: "Orbitron, sans-serif" }}
        >
          KINEMATICS <span className="text-rose-500">ELITE</span>
        </h2>
        <div className="text-[10px] text-sky-400 font-bold uppercase tracking-[0.3em] mt-1 pl-1">
          Hyper-Simulation
        </div>

        {/* Telemetry HUD */}
        <div className="mt-8 flex flex-col gap-3 pl-1">
          <div>
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">
              Time
            </div>
            <div className="text-2xl font-mono text-white leading-none drop-shadow-lg">
              {state.time.toFixed(2)}
              <span className="text-xs text-slate-500 ml-1">s</span>
            </div>
          </div>

          <div className="flex gap-6 mt-2">
            <div>
              <div className="text-[8px] font-black text-slate-500 uppercase tracking-wider mb-0.5">
                Pos
              </div>
              <div className="text-sm font-mono text-sky-400 leading-none">
                {state.x.toFixed(1)}
                <span className="text-[9px] text-slate-600 ml-0.5">m</span>
              </div>
            </div>
            <div>
              <div className="text-[8px] font-black text-slate-500 uppercase tracking-wider mb-0.5">
                Vel
              </div>
              <div className="text-sm font-mono text-emerald-400 leading-none">
                {state.v.toFixed(1)}
                <span className="text-[9px] text-slate-600 ml-0.5">m/s</span>
              </div>
            </div>
            <div>
              <div className="text-[8px] font-black text-slate-500 uppercase tracking-wider mb-0.5">
                Acc
              </div>
              <div className="text-sm font-mono text-amber-400 leading-none">
                {state.a.toFixed(1)}
                <span className="text-[9px] text-slate-600 ml-0.5">m/s²</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HUD: Graphs (Top Right) */}
      <div className="absolute top-4 right-4 z-10 w-80 pointer-events-auto">
        <KinematicsGraphs />
      </div>
    </div>
  );
};
