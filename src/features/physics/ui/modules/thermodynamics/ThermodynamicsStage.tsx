import { SafeOrbitControls, SceneStabilizer } from "@features/threed-studio";
import {
  ContactShadows,
  Environment,
  Float,
  Grid,
  Stars,
} from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { useThermodynamicsEngine } from "./useThermodynamicsEngine";

const Particles = () => {
  const { state, particles } = useThermodynamicsEngine();
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Reactive Color based on T (Blue [240] to Red [0])
  const hue = Math.max(0, Math.min(240, 240 - (state.T - 200) * 0.4));
  let particleColor = `hsl(${hue}, 80%, 60%)`;

  if (state.simMode === "hydrogen") {
    particleColor = "#10b981"; // Emerald
  } else if (state.simMode === "wind_turbine") {
    particleColor = "#ffffff"; // White for air
  }

  useFrame(() => {
    if (!meshRef.current) return;

    particles.current.forEach((p, i) => {
      dummy.position.set(p.x, p.y, p.z);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, state.n]}>
      <sphereGeometry
        args={[state.simMode === "hydrogen" ? 0.05 : 0.08, 8, 8]}
      />
      <meshBasicMaterial color={particleColor} toneMapped={false} />
    </instancedMesh>
  );
};

const WindTurbine = () => {
  const { state } = useThermodynamicsEngine();
  const turbineRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (turbineRef.current && state.simMode === "wind_turbine") {
      // Rotation based on temperature/speed of particles (abstracted as energy)
      const rotationSpeed = (state.T / 300) * 2;
      turbineRef.current.rotation.y += rotationSpeed * delta;
    }
  });

  if (state.simMode !== "wind_turbine") return null;

  return (
    <group ref={turbineRef} position={[0, state.containerHeight / 2, 0]}>
      {/* Turbine Hub */}
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshPhysicalMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Turbine Blades */}
      {[0, 1, 2].map((i) => (
        <group key={i} rotation={[0, (i * Math.PI * 2) / 3, 0]}>
          <mesh position={[2, 0, 0]} rotation={[Math.PI / 4, 0, 0]}>
            <boxGeometry args={[4, 0.1, 1]} />
            <meshPhysicalMaterial
              transparent
              opacity={0.8}
              color="#38bdf8"
              transmission={0.5}
              thickness={0.5}
            />
          </mesh>
        </group>
      ))}
      {/* Turbine Column */}
      <mesh position={[0, -5, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 10]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
    </group>
  );
};

const Container = () => {
  const { state, pistonYRef } = useThermodynamicsEngine();
  const pistonRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (pistonRef.current) {
      // Fix piston at top in wind turbine mode
      const py =
        state.simMode === "wind_turbine"
          ? state.containerHeight
          : pistonYRef.current;
      pistonRef.current.position.y = py;
    }
  });

  const visualHeight = state.containerHeight * 1.5;

  return (
    <group>
      {/* Glass Box Walls - Increased height for V=1.5 */}
      <mesh position={[0, visualHeight / 2, 0]}>
        <boxGeometry
          args={[state.containerWidth, visualHeight, state.containerDepth]}
        />
        <meshPhysicalMaterial
          transparent
          opacity={0.1}
          transmission={0.9}
          thickness={0.5}
          roughness={0}
          color="#ffffff"
        />
      </mesh>

      {/* Wireframe Outline */}
      <mesh position={[0, visualHeight / 2, 0]}>
        <boxGeometry
          args={[state.containerWidth, visualHeight, state.containerDepth]}
        />
        <meshBasicMaterial
          wireframe
          opacity={0.2}
          transparent
          color="#0ea5e9"
        />
      </mesh>

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[state.containerWidth, state.containerDepth]} />
        <meshPhysicalMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Piston */}
      <group ref={pistonRef}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry
            args={[state.containerWidth - 0.1, state.containerDepth - 0.1]}
          />
          <meshPhysicalMaterial
            color="#334155"
            metalness={0.9}
            roughness={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Piston Rod */}
        <mesh position={[0, 10, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 20]} />
          <meshPhysicalMaterial color="#64748b" metalness={0.8} />
        </mesh>
      </group>

      {/* Heat Source Visual (Bottom) */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh position={[0, -1, 0]}>
          <cylinderGeometry args={[2, 2, 0.5, 32]} />
          <meshStandardMaterial
            emissive={state.targetT > 300 ? "#f43f5e" : "#0ea5e9"}
            emissiveIntensity={Math.abs(state.targetT - 300) / 100}
            color="#0f172a"
          />
        </mesh>
      </Float>

      {/* Isothermal Heat Flux Indicator */}
      {state.processMode === "isothermal" && (
        <IsothermalIndicator
          width={state.containerWidth}
          depth={state.containerDepth}
          targetT={state.targetT}
        />
      )}
    </group>
  );
};

const IsothermalIndicator = ({
  width,
  depth,
  targetT,
}: {
  width: number;
  depth: number;
  targetT: number;
}) => {
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.opacity =
        0.1 + Math.sin(clock.getElapsedTime() * 5) * 0.05;
    }
  });

  return (
    <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[width - 0.2, depth - 0.2]} />
      <meshBasicMaterial
        ref={matRef}
        color={targetT > 300 ? "#f43f5e" : "#0ea5e9"}
        transparent
        opacity={0.1}
      />
    </mesh>
  );
};

const GasGlow = () => {
  const { state, pistonYRef } = useThermodynamicsEngine();
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.opacity =
        0.03 + Math.sin(clock.getElapsedTime() * 2) * 0.02;
    }
    if (meshRef.current && state.simMode !== "wind_turbine") {
      const h = pistonYRef.current;
      meshRef.current.scale.y = h / state.containerHeight;
      meshRef.current.position.y = h / 2;
    }
  });

  if (!state.showGasGlow) return null;

  const color =
    state.T > 400 ? "#f43f5e" : state.T < 200 ? "#0ea5e9" : "#fbbf24";
  const height =
    state.simMode === "wind_turbine" ? state.containerHeight : state.pistonY;

  return (
    <mesh ref={meshRef} position={[0, height / 2, 0]}>
      <boxGeometry
        args={[
          state.containerWidth - 0.2,
          state.containerHeight - 0.1,
          state.containerDepth - 0.2,
        ]}
      />
      <meshBasicMaterial
        ref={matRef}
        color={color}
        transparent
        opacity={0.03}
      />
    </mesh>
  );
};

export const ThermodynamicsStage = () => {
  const { state } = useThermodynamicsEngine();
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="w-full h-full bg-[#020617] relative">
      <Canvas
        eventSource={
          containerRef as React.RefObject<HTMLElement> as unknown as HTMLElement
        }
        shadows
        dpr={[1, 2]}
        camera={{ position: [15, 10, 15], fov: 45 }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} castShadow />
        <pointLight position={[-10, 5, -10]} intensity={0.5} color="#0ea5e9" />

        {state.showParticles && <Particles />}
        <GasGlow />
        <WindTurbine />
        <Container />

        <Grid
          position={[0, -0.1, 0]}
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
          scale={20}
          blur={2}
          opacity={0.6}
          far={10}
          color="#000000"
        />
        <Environment preset="city" />
        <SceneStabilizer />
        <SafeOrbitControls makeDefault />
      </Canvas>
    </div>
  );
};
