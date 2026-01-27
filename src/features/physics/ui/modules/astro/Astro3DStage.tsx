import { SafeOrbitControls, SceneStabilizer } from "@features/threed-studio";
import { Grid, Line, Stars } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import React, { useMemo, useRef } from "react";
import * as THREE from "three";

import { calculateHohmannTransfer, CelestialBody } from "./astroMath";
import { useAstroEngine } from "./useAstroEngine";

// --- Components ---

const CentralStar = ({ radius, color }: { radius: number; color: string }) => {
  // Visual scale: Radius depends on mass/temp relative to solar
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      // Pulse effect
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.02;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group>
      <pointLight intensity={2} decay={2} distance={1000} color={color} />
      <mesh ref={meshRef}>
        <sphereGeometry args={[radius * 5, 32, 32]} />
        <meshStandardMaterial
          emissive={color}
          emissiveIntensity={2}
          color={color}
        />
      </mesh>
    </group>
  );
};

const Planet = ({ body }: { body: CelestialBody }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { x, y } = body.position;

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.set(x, 0, y);
      meshRef.current.rotation.y += 0.01;
    }
  });

  // Trail needs points. The trail in state is 2D {x,y}. We map to {x,0,y}.
  const trailPoints = useMemo(() => {
    return body.trail.map((p) => new THREE.Vector3(p.x, 0, p.y));
  }, [body.trail]);

  return (
    <group>
      <mesh ref={meshRef} position={[x, 0, y]}>
        <sphereGeometry args={[body.radius, 16, 16]} />
        <meshStandardMaterial color={body.color} roughness={0.7} />
      </mesh>
      {trailPoints.length > 1 && (
        <Line
          points={trailPoints}
          color={body.color}
          lineWidth={2}
          opacity={0.6}
          transparent
        />
      )}
    </group>
  );
};

const HohmannTransfer3D = () => {
  const { orbitingBodies, centralMass, showHohmann } = useAstroEngine();

  const transferData = useMemo(() => {
    if (!showHohmann || orbitingBodies.length < 2) return null;

    const sorted = [...orbitingBodies].sort(
      (a, b) =>
        Math.hypot(a.position.x, a.position.y) -
        Math.hypot(b.position.x, b.position.y),
    );
    const inner = sorted[0];
    const outer = sorted[sorted.length - 1];

    if (!inner || !outer) return null;

    const r1 = Math.hypot(inner.position.x, inner.position.y);
    const r2 = Math.hypot(outer.position.x, outer.position.y);

    if (r1 >= r2) return null;

    const hohmann = calculateHohmannTransfer(r1, r2, centralMass);

    // Ellipse params
    const a = (r1 + r2) / 2;
    const c = (r2 - r1) / 2; // Linear eccentricity
    const b = Math.sqrt(a * a - c * c);

    // Angle of inner planet (periapsis start)
    const angle = Math.atan2(inner.position.y, inner.position.x);

    // Generate ellipse points
    const points = [];
    const segments = 64;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * 2 * Math.PI;
      // Standard ellipse centered at 0: x = a cos t, y = b sin t
      // Shifted center: x = a cos t - c
      const ex = a * Math.cos(theta) - c;
      const ey = b * Math.sin(theta);
      points.push(new THREE.Vector3(ex, 0, ey));
    }

    return { points, angle, hohmann, r1, r2 };
  }, [orbitingBodies, centralMass, showHohmann]);

  if (!transferData) return null;

  return (
    <group rotation={[0, -transferData.angle, 0]}>
      {/* Dashed Transfer Orbit */}
      <Line
        points={transferData.points}
        color="#eab308"
        lineWidth={1.5}
        dashed
        dashScale={10}
        dashSize={1}
        gapSize={1}
        opacity={0.8}
        transparent
      />
    </group>
  );
};

const Astro3DScene = () => {
  const { orbitingBodies, starRadiusRelative, stepPhysics, isPlaying } =
    useAstroEngine();

  // Physics Loop in 3D frame
  useFrame(() => {
    if (isPlaying) {
      stepPhysics();
    }
  });

  return (
    <>
      <ambientLight intensity={0.1} />
      <Stars
        radius={500}
        depth={50}
        count={3000}
        factor={4}
        saturation={0}
        fade
        speed={1}
      />

      <CentralStar
        radius={Math.sqrt(starRadiusRelative) * 5} // Visual scale
        color="#fbbf24"
      />

      {orbitingBodies.map((body) => (
        <Planet key={body.id} body={body} />
      ))}

      <HohmannTransfer3D />

      <Grid
        args={[2000, 2000]}
        sectionSize={100}
        cellSize={20}
        sectionColor="#1e293b"
        cellColor="#0f172a"
        position={[0, -10, 0]}
        fadeDistance={1000}
      />

      <SceneStabilizer />
      <SafeOrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
      />
    </>
  );
};

export const Astro3DStage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="absolute inset-0 bg-[#020408]">
      {/* 3D Label */}
      <div className="absolute top-4 right-4 z-10 px-3 py-1 bg-cyan-500/20 text-cyan-400 text-xs font-bold rounded border border-cyan-500/50">
        3D VIEW
      </div>

      <Canvas
        eventSource={
          containerRef as React.RefObject<HTMLElement> as unknown as HTMLElement
        }
        camera={{ position: [0, 100, 200], fov: 45 }}
      >
        <Astro3DScene />
      </Canvas>
    </div>
  );
};
