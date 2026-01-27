import {
  useGlobalSettings,
  useMathLabContext,
  useModuleState,
} from "@features/math/hooks/useMathLabContext";
import type {
  ModuleStageProps,
  VectorsModuleState,
} from "@features/math/types";
import { DeformableSpace } from "@features/math/ui/common/DeformableSpace";
import { PhysicsBall } from "@features/math/ui/common/PhysicsBall";
import { VectorArrow } from "@features/math/ui/common/VectorArrow";
import { VectorGhost } from "@features/math/ui/common/VectorGhost";
import { VectorTrace } from "@features/math/ui/common/VectorTrace";
import { LazyXR, SafeOrbitControls } from "@features/threed-studio";
import { Grid, PerspectiveCamera, Stars } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { getXrStoreAsync } from "@shared/model/xr";
import React, { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";

export const VectorsStage: React.FC<ModuleStageProps> = () => {
  const {
    computedVectors,
    resultantVector,
    crossProductVector,
    matrixValues,
    isMatrixActive,
  } = useMathLabContext();

  const [state] = useModuleState<VectorsModuleState>("vectors");
  const [globalSettings] = useGlobalSettings();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [xrStore, setXrStore] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initXR = async () => {
      const store = await getXrStoreAsync();
      setXrStore(store);
    };
    initXR();
  }, []);

  if (!xrStore) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-[#050505] text-cyan-400">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-xs font-mono uppercase tracking-widest">
            Initializing Graphics Engine...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="absolute inset-0 bg-[#050505]">
      <Canvas
        eventSource={
          containerRef as React.RefObject<HTMLElement> as unknown as HTMLElement
        }
        camera={{ position: [8, 8, 8], fov: 50 }}
        gl={{
          antialias: true,
          alpha: false,
          toneMapping: THREE.NoToneMapping,
        }}
        dpr={[1, 2]}
      >
        <color attach="background" args={["#050505"]} />

        {/* Use LazyXR to prevent eager loading of Three.js via @react-three/xr */}
        <LazyXR store={xrStore}>
          <Suspense fallback={null}>
            <PerspectiveCamera makeDefault position={[8, 8, 8]} />
            <SafeOrbitControls
              enableDamping
              dampingFactor={0.05}
              autoRotate={globalSettings.autoRotate}
              autoRotateSpeed={1}
            />

            {/* LIGHTING FIX: Veel feller om 'Neon' te faken op standaard materialen */}
            <ambientLight intensity={1.5} />
            <directionalLight position={[10, 10, 5]} intensity={2} />
            <pointLight
              position={[-10, -10, -10]}
              intensity={1}
              color="#22d3ee"
            />

            <Stars
              radius={100}
              depth={50}
              count={2000}
              factor={4}
              fade
              saturation={0}
            />

            {/* Grid - Consistent gemaakt met Magnetism */}
            {globalSettings.showGrid && (
              <Grid
                position={[0, -0.01, 0]}
                args={[40, 40]}
                cellSize={1}
                cellThickness={0.5}
                cellColor="#1e293b"
                sectionSize={5}
                sectionThickness={1}
                sectionColor="#334155"
                fadeDistance={50}
                infiniteGrid
              />
            )}

            {/* Axes */}
            {globalSettings.showAxes && (
              <group>
                <axesHelper args={[100]} />
              </group>
            )}

            {/* Deformable Space (Matrix Transform) */}
            {isMatrixActive && (
              <DeformableSpace
                matrixValues={matrixValues}
                active={isMatrixActive}
              >
                {null}
              </DeformableSpace>
            )}

            <group>
              {/* User Vectors */}
              {computedVectors.map((vec) => (
                <React.Fragment key={vec.id}>
                  <VectorArrow
                    start={[0, 0, 0]}
                    direction={[vec.x, vec.y, vec.z]}
                    color={vec.color}
                    label={vec.symbol}
                    scale={Math.sqrt(vec.x ** 2 + vec.y ** 2 + vec.z ** 2)}
                    showValues={state.showValues}
                  />
                  {state.showGhosting && (
                    <VectorGhost
                      vector={{
                        id: vec.id,
                        x: vec.x,
                        y: vec.y,
                        z: vec.z,
                        color: vec.color,
                      }}
                      active={state.showGhosting}
                    />
                  )}
                  {state.traceMode && (
                    <VectorTrace
                      vector={{ x: vec.x, y: vec.y, z: vec.z }}
                      active={state.traceMode}
                    />
                  )}
                </React.Fragment>
              ))}

              {/* Resultant Vector */}
              {resultantVector && (
                <VectorArrow
                  start={[0, 0, 0]}
                  direction={[
                    resultantVector.x,
                    resultantVector.y,
                    resultantVector.z,
                  ]}
                  color={resultantVector.color}
                  label={resultantVector.symbol}
                  scale={Math.sqrt(
                    resultantVector.x ** 2 +
                      resultantVector.y ** 2 +
                      resultantVector.z ** 2,
                  )}
                  showValues={state.showValues}
                />
              )}

              {/* Cross Product Vector */}
              {crossProductVector && (
                <VectorArrow
                  start={[0, 0, 0]}
                  direction={[
                    crossProductVector.x,
                    crossProductVector.y,
                    crossProductVector.z,
                  ]}
                  color={crossProductVector.color}
                  label={crossProductVector.symbol}
                  scale={Math.sqrt(
                    crossProductVector.x ** 2 +
                      crossProductVector.y ** 2 +
                      crossProductVector.z ** 2,
                  )}
                  showValues={state.showValues}
                />
              )}
            </group>

            {/* Physics Ball */}
            {state.showPhysics && computedVectors.length > 0 && (
              <PhysicsBall
                force={{
                  x: computedVectors[0]?.x || 0,
                  y: computedVectors[0]?.y || 0,
                  z: computedVectors[0]?.z || 0,
                }}
                active={state.showPhysics}
              />
            )}
          </Suspense>

          {/* POST PROCESSING: Dit zorgt voor de 'Glow' */}
          <EffectComposer multisampling={0}>
            <Bloom luminanceThreshold={0.5} intensity={1.5} radius={0.5} />
          </EffectComposer>
        </LazyXR>
      </Canvas>
    </div>
  );
};
