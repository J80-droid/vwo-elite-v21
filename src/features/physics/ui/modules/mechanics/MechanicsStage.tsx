import { SafeOrbitControls, SceneStabilizer } from "@features/threed-studio";
import {
  ContactShadows,
  Grid,
  PerspectiveCamera,
  Stars,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import React, { useRef } from "react";
import * as THREE from "three";

import { useMechanicsEngine } from "./useMechanicsEngine";

const ForceArrow: React.FC<{
  direction: THREE.Vector3;
  origin: THREE.Vector3;
  length: number;
  color: string;
}> = ({ direction, origin, length, color }) => {
  if (length < 0.1) return null;

  // Arrow Helper creates a new instance every render if we spread arguments,
  // so we construct it manually or use a primitive.
  // For simplicity and React-ness, let's use a Cylinder + Cone combination.

  const dirClipped = direction.clone().normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dirClipped,
  );

  return (
    <group position={origin}>
      <group quaternion={quaternion}>
        {/* Shaft */}
        <mesh position={[0, length / 2, 0]}>
          <cylinderGeometry args={[0.08, 0.08, length, 8]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={2}
            toneMapped={false}
          />
        </mesh>
        {/* Head */}
        <mesh position={[0, length, 0]}>
          <coneGeometry args={[0.2, 0.5, 16]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={2}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
};

const MechanicsScene = () => {
  const { state } = useMechanicsEngine();

  // Convert angle to radians
  const rad = state.angle * (Math.PI / 180);

  // Ramp Dimensions
  const rampLength = 10;
  const rampWidth = 3;
  const rampThickness = 0.2;

  // Block Dimensions
  const blockRef = useRef<THREE.Group>(null);
  const blockWidth = 1.6;
  const blockHeight = 1;
  const blockDepth = 1.6;

  // Block Position on Ramp (state.pos is distance from top)
  // We pivot the ramp at the start (left).
  // x extends along the ramp.

  return (
    <group>
      {/* LIGHTING */}
      <ambientLight intensity={0.5} />
      <pointLight
        position={[5, 10, 5]}
        intensity={2}
        castShadow
        color="#ffffff"
      />
      <spotLight
        position={[-5, 5, 5]}
        angle={0.5}
        penumbra={1}
        intensity={2}
        color="#0ea5e9"
        castShadow
      />

      {/* RAMP GROUP - Pivots naturally around (0,0,0) */}
      {/* 3D Pivot Logic:
                The group rotates around (0,0,0).
                To make it pivot from the "top left", we position the group at the desired world position (e.g., [0, 2, 0]).
                Inside the group, we offset the meshes so the pivot point aligns with (0,0,0).
                
                If we want the pivot at the top-start of the ramp:
                The ramp is length 10. Center is at 5.
                So we shift the ramp mesh by +5 in X (so its left edge is at 0).
             */}
      <group position={[-5, 2, 0]} rotation={[0, 0, -rad]}>
        {/* Visual Ramp - Left edge at local 0,0 */}
        <mesh
          position={[rampLength / 2, -rampThickness / 2, 0]}
          receiveShadow
          castShadow
        >
          <boxGeometry args={[rampLength, rampThickness, rampWidth]} />
          <meshStandardMaterial
            color="#1e293b"
            metalness={0.8}
            roughness={0.2}
            envMapIntensity={1}
          />
          <lineSegments>
            <edgesGeometry
              args={[
                new THREE.BoxGeometry(rampLength, rampThickness, rampWidth),
              ]}
            />
            <lineBasicMaterial color="#38bdf8" opacity={0.3} transparent />
          </lineSegments>
        </mesh>

        {/* THE BLOCK - Position moves along positive local X */}
        <group position={[state.pos, blockHeight / 2, 0]}>
          <mesh castShadow ref={blockRef}>
            <boxGeometry args={[blockWidth, blockHeight, blockDepth]} />
            <meshPhysicalMaterial
              color="#0ea5e9"
              transmission={0.2}
              opacity={0.9}
              metalness={0.5}
              roughness={0.1}
              clearcoat={1}
              emissive="#0ea5e9"
              emissiveIntensity={0.2}
            />
          </mesh>

          {/* FORCE VECTORS (Local Space - Aligned with ramp) */}

          {/* 1. Normal Force (Perpendicular Up Y) */}
          <ForceArrow
            direction={new THREE.Vector3(0, 1, 0)}
            origin={new THREE.Vector3(0, blockHeight / 2, 0)}
            length={Math.cos(rad) * state.mass * 0.15}
            color="#f59e0b"
          />

          {/* 2. Friction Force (Opposite to velocity - Up Ramp -X) */}
          {state.mu > 0 && (
            <ForceArrow
              direction={new THREE.Vector3(-1, 0, 0)}
              origin={
                new THREE.Vector3(
                  -blockWidth / 2,
                  -blockHeight / 2 + 0.1,
                  blockDepth / 2 + 0.2,
                )
              }
              length={state.mu * Math.cos(rad) * state.mass * 0.15}
              color="#10b981"
            />
          )}
        </group>

        {/* 3. Gravity Vector (Global Down transformed to Local)
                    Global Down is (0, -1, 0).
                    Inv Rotate by Z(-rad) -> Local Vector.
                    Local X: sin(rad), Local Y: -cos(rad)
                 */}
        <group position={[state.pos, 0, 0]}>
          <ForceArrow
            direction={new THREE.Vector3(Math.sin(rad), -Math.cos(rad), 0)}
            origin={new THREE.Vector3(0, 0, blockDepth / 2 + 0.2)}
            length={state.mass * 0.15}
            color="#ef4444"
          />
        </group>
      </group>

      {/* ENVIRONMENT */}
      <Grid
        position={[0, -2, 0]}
        args={[40, 40]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#334155"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#475569"
        fadeDistance={30}
        infiniteGrid
      />
      <Stars
        radius={100}
        depth={50}
        count={5000}
        factor={4}
        saturation={0}
        fade
        speed={1}
      />
      <ContactShadows
        resolution={1024}
        scale={50}
        blur={2}
        opacity={0.5}
        far={10}
        color="#000000"
      />
    </group>
  );
};

export const MechanicsStage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="w-full h-full bg-[#050914] relative">
      <Canvas
        shadows
        eventSource={
          containerRef as React.RefObject<HTMLElement> as unknown as HTMLElement
        }
        dpr={[1, 2]}
        gl={{
          antialias: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.5,
        }}
      >
        <PerspectiveCamera makeDefault position={[0, 5, 15]} fov={50} />
        <SceneStabilizer />
        <SafeOrbitControls
          enablePan={false}
          minDistance={5}
          maxDistance={30}
          maxPolarAngle={Math.PI / 2 - 0.1}
        />

        <MechanicsScene />

        <EffectComposer>
          <Bloom
            luminanceThreshold={1}
            mipmapBlur
            intensity={1.5}
            radius={0.6}
          />
        </EffectComposer>
      </Canvas>

      {/* Overlay UI for context */}
      <div className="absolute top-4 left-4 pointer-events-none">
        <h2 className="text-2xl font-black text-white italic tracking-tighter drop-shadow-lg">
          MECHANICA <span className="text-sky-400">3D</span>
        </h2>
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
          ELITE PHYSICS ENGINE
        </div>
      </div>
    </div>
  );
};
