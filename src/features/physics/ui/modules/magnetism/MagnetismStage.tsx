import { SafeOrbitControls, SceneStabilizer } from "@features/threed-studio";
import { Grid, PerspectiveCamera, Stars } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { MagnetismOverlay } from "./MagnetismOverlay";
import {
  MagnetismParticle,
  MAX_TRAIL_LENGTH,
  useMagnetismEngine,
} from "./useMagnetismEngine";

// Imported from @features/threed-studio

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

  return (
    <EffectComposer multisampling={0}>
      {children as React.ReactElement}
    </EffectComposer>
  );
};

// --- 1. DEELTJES VISUALISATIE (GLOW EFFECT) ---
const ParticleInstances: React.FC<{ particles: MagnetismParticle[] }> = ({
  particles,
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    if (!meshRef.current) return;

    if (particles.length === 0) {
      meshRef.current.count = 0;
      return;
    }

    particles.forEach((p, i) => {
      dummy.position.set(p.position[0], p.position[1], p.position[2]);
      // Laat deeltjes naar de camera kijken (billboarding) als je textures zou gebruiken,
      // maar voor bollen is dit niet nodig.
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);

      color.set(p.color);
      meshRef.current!.setColorAt(i, color);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor)
      meshRef.current.instanceColor.needsUpdate = true;

    meshRef.current.count = particles.length;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, 1000]}>
      {/* GROTERE RADIUS: 0.2 -> 0.5 voor betere zichtbaarheid */}
      <sphereGeometry args={[0.5, 16, 16]} />
      {/* BASIC MATERIAL: Altijd zichtbaar, negeert licht, perfect voor 'neon' effect */}
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
};

// --- 2. TRAILS (DIKKER EN DUIDELIJKER) ---
const Trail: React.FC<{
  points: [number, number, number][];
  color: string;
}> = ({ points, color }) => {
  const lineRef = useRef<THREE.Line>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(MAX_TRAIL_LENGTH * 3);
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  const material = useMemo(
    // Opacity verhoogd naar 0.8
    () =>
      new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.8,
        linewidth: 2,
      }),
    [color],
  );

  useFrame(() => {
    if (!lineRef.current) return;
    const posAttr = lineRef.current.geometry.attributes.position;
    if (!posAttr) return;

    if (!points || points.length === 0) {
      lineRef.current.geometry.setDrawRange(0, 0);
      return;
    }
    const positions = posAttr.array as Float32Array;
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      if (p) {
        positions[i * 3] = p[0];
        positions[i * 3 + 1] = p[1];
        positions[i * 3 + 2] = p[2];
      }
    }
    lineRef.current.geometry.setDrawRange(0, points.length);
    posAttr.needsUpdate = true;
  });

  return (
    <primitive
      object={useMemo(
        () => new THREE.Line(geometry, material),
        [geometry, material],
      )}
      ref={lineRef}
      frustumCulled={false}
    />
  );
};

const ParticleTrails: React.FC<{ particles: MagnetismParticle[] }> = ({
  particles,
}) => {
  return (
    <group>
      {particles.map((p) => (
        <Trail key={p.id} points={p.trail} color={p.color} />
      ))}
    </group>
  );
};

// --- 3. VELD VISUALISATIE (FELLER) ---
interface FieldGridProps {
  showBField: boolean;
  bField: number;
  showEField: boolean;
  eField: number;
}

const FieldGrid: React.FC<FieldGridProps> = React.memo(
  ({ showBField, bField, showEField, eField }) => {
    const positions = useMemo(() => {
      const arr = [];
      const count = 8; // Iets minder punten voor performance
      const spacing = 5; // Iets meer ruimte
      for (let x = -count; x <= count; x++) {
        for (let y = -count; y <= count; y++) {
          arr.push([x * spacing, y * spacing, 0] as [number, number, number]);
        }
      }
      return arr;
    }, []);

    if (!showBField && !showEField) return null;

    const bIsPositive = bField > 0;
    const eIsPositive = eField > 0;

    return (
      <group>
        {/* B-Field Indicators (Circles/Crosses) */}
        {showBField &&
          Math.abs(bField) > 0.05 &&
          positions.map((pos, i) => (
            <group key={`b-${i}`} position={pos}>
              {bIsPositive ? (
                <mesh>
                  <circleGeometry args={[0.15, 8]} />
                  <meshBasicMaterial
                    color="#22d3ee"
                    transparent
                    opacity={0.6}
                    side={THREE.DoubleSide}
                  />
                </mesh>
              ) : (
                <group rotation={[0, 0, Math.PI / 4]}>
                  <mesh>
                    <boxGeometry args={[0.6, 0.08, 0.02]} />
                    <meshBasicMaterial
                      color="#22d3ee"
                      transparent
                      opacity={0.6}
                    />
                  </mesh>
                  <mesh rotation={[0, 0, Math.PI / 2]}>
                    <boxGeometry args={[0.6, 0.08, 0.02]} />
                    <meshBasicMaterial
                      color="#22d3ee"
                      transparent
                      opacity={0.6}
                    />
                  </mesh>
                </group>
              )}
            </group>
          ))}

        {/* E-Field Indicators (Horizontal Arrows) */}
        {showEField &&
          Math.abs(eField) > 0.1 &&
          positions.map((pos, i) => (
            <group key={`e-${i}`} position={[pos[0], pos[1], pos[2] + 0.1]}>
              <group rotation={[0, 0, eIsPositive ? 0 : Math.PI]}>
                {/* Arrow Shaft */}
                <mesh position={[-0.3, 0, 0]}>
                  <boxGeometry args={[0.6, 0.04, 0.01]} />
                  <meshBasicMaterial
                    color="#e879f9"
                    transparent
                    opacity={0.5}
                  />
                </mesh>
                {/* Arrow Head */}
                <mesh position={[0, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
                  <coneGeometry args={[0.1, 0.3, 4]} />
                  <meshBasicMaterial
                    color="#e879f9"
                    transparent
                    opacity={0.7}
                  />
                </mesh>
              </group>
            </group>
          ))}
      </group>
    );
  },
);
FieldGrid.displayName = "FieldGrid";

// --- MAIN STAGE ---
export const MagnetismStage: React.FC = () => {
  const { state } = useMagnetismEngine();
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  return (
    <div
      ref={setContainer}
      className="relative w-full h-full bg-[#0f1014] overflow-hidden"
    >
      {container && (
        <Canvas
          shadows
          eventSource={container}
          dpr={[1, 2]}
          camera={{ position: [0, 0, 45], fov: 50 }} // Camera iets verder naar achteren en recht
          gl={{
            antialias: true,
            toneMapping: THREE.NoToneMapping, // Belangrijk voor felle kleuren
          }}
        >
          <SceneStabilizer />
          <color attach="background" args={["#050505"]} />

          <PerspectiveCamera makeDefault position={[0, 0, 50]} />
          <SafeOrbitControls
            enablePan={true}
            maxDistance={100}
            minDistance={10}
          />

          {/* VISUAL AID: Axes Helper (Rood=X, Groen=Y, Blauw=Z) - Zet dit uit als alles werkt */}
          <axesHelper args={[5]} />

          <Stars
            radius={100}
            depth={50}
            count={2000}
            factor={4}
            saturation={0}
            fade
            speed={0.5}
          />

          {state.showGrid && (
            <Grid
              position={[0, 0, -2]} // Grid iets naar achteren plaatsen
              args={[100, 100]}
              cellSize={5}
              cellThickness={0.6}
              cellColor="#1e293b"
              sectionSize={25}
              sectionThickness={1}
              sectionColor="#334155"
              fadeDistance={80}
              infiniteGrid
            />
          )}

          <group>
            <ParticleInstances particles={state.particles} />
            <ParticleTrails particles={state.particles} />
            <FieldGrid
              showBField={state.showBField}
              bField={state.bField}
              showEField={state.showEField}
              eField={state.eField}
            />
          </group>

          <SafeEffectComposer>
            {/* Bloom zorgt voor de 'glow' van de BasicMaterials */}
            <Bloom luminanceThreshold={0.2} intensity={1.5} radius={0.4} />
          </SafeEffectComposer>
        </Canvas>
      )}

      <MagnetismOverlay />
    </div>
  );
};
