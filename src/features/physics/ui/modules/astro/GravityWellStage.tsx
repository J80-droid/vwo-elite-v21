import { SafeOrbitControls, SceneStabilizer } from "@features/threed-studio";
import { Billboard, shaderMaterial, Stars, Text } from "@react-three/drei";
import { Canvas, extend, useFrame } from "@react-three/fiber";
import React from "react";
import * as THREE from "three";

import {
  calculateHohmannTransfer,
  CelestialBody,
  kelvinToColor,
  Vector2,
} from "./astroMath";
import { useAstroEngine } from "./useAstroEngine";

// --- Shaders ---

const GravityGridMaterial = shaderMaterial(
  {
    uTime: 0,
    uCentralMass: 10000,
    uColor: new THREE.Color("#4ade80"),
  },
  // Vertex Shader
  `
    uniform float uCentralMass;
    varying vec2 vUv;
    varying float vDepth;

    void main() {
        vUv = uv;
        vec3 pos = position;
        
        // Calculate distance from center
        float r = length(pos.xy);
        
        // Deform Z based on gravity well
        float depth = - (uCentralMass / 500.0) / (1.0 + r / 20.0);
        pos.z += depth;

        vDepth = depth;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
    `,
  // Fragment Shader (Procedural Grid)
  `
    uniform vec3 uColor;
    varying vec2 vUv;
    varying float vDepth;

    void main() {
        // Grid Logic: 50.0 is density
        vec2 grid = abs(fract(vUv * 50.0 - 0.5) - 0.5) / fwidth(vUv * 50.0);
        float line = min(grid.x, grid.y);
        
        // Anti-aliased lines
        float lineIntensity = 1.0 - min(line, 1.0);

        // Depth fade
        float alpha = (0.1 + abs(vDepth) * 0.005) * lineIntensity;
        
        // Discard between lines
        if (alpha < 0.1) discard;

        gl_FragColor = vec4(uColor, alpha);
    }
    `,
);

extend({ GravityGridMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gravityGridMaterial: any;
  }
}

const SpaceGrid = ({ centralMass }: { centralMass: number }) => {
  // Defines a plane that distorts near the center (0,0) based on mass
  // GPU ACCELERATED VERSION via Custom Shader

  // Calculate bounding box or max depth for culling issues?
  // Usually fine unless curvature is extreme.

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[1000, 1000, 128, 128]} />

      <gravityGridMaterial
        transparent={true}
        uColor="#4ade80"
        uCentralMass={centralMass}
      />
    </mesh>
  );
};

const VectorArrow3D = ({
  origin,
  vector,
  color,
  scale = 1.0,
  label,
}: {
  origin: THREE.Vector3;
  vector: Vector2;
  color: string;
  scale?: number;
  label?: string;
}) => {
  if (Math.abs(vector.x) < 0.01 && Math.abs(vector.y) < 0.01) return null;

  // Convert 2D vector (x, y) to 3D direction (x, 0, y) because we are in XZ plane
  const dir = new THREE.Vector3(vector.x, 0, vector.y).normalize();
  const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y) * scale;

  if (length < 0.5) return null;

  return (
    <group position={origin}>
      <arrowHelper
        args={[
          dir,
          new THREE.Vector3(0, 0, 0),
          length,
          color,
          Math.min(length * 0.2, 5),
          Math.min(length * 0.1, 2),
        ]}
      />
      {label && (
        <group position={[dir.x * length, dir.y * length + 2, dir.z * length]}>
          {/* Billboard text simplified */}
        </group>
      )}
    </group>
  );
};

const OrbitTrail3D = ({
  trail,
  color,
}: {
  trail: Vector2[];
  color: string;
}) => {
  // Convert 2D trail points to 3D points with depth
  // This needs to happen efficiently.
  const { centralMass } = useAstroEngine();

  const points = React.useMemo(() => {
    return trail.map((p) => {
      const r = Math.sqrt(p.x * p.x + p.y * p.y);
      const depth = -(centralMass / 500) / (1 + r / 20);
      return new THREE.Vector3(p.x, depth + 0.5, p.y); // Lift slightly above grid
    });
  }, [trail, centralMass]);

  if (points.length < 2) return null;

  const positions = new Float32Array(points.flatMap((p) => [p.x, p.y, p.z]));

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={positions}
          itemSize={3}
          args={[positions, 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial
        color={color}
        opacity={0.6}
        transparent
        linewidth={1}
      />
    </line>
  );
};

const Body3D = ({ body }: { body: CelestialBody }) => {
  const { showVectors, centralMass } = useAstroEngine();

  // Calculate depth
  const r = Math.sqrt(
    body.position.x * body.position.x + body.position.y * body.position.y,
  );
  const depth = -(centralMass / 500) / (1 + r / 20);
  const pos3D = new THREE.Vector3(body.position.x, depth, body.position.y);

  // Calculate gravity vector for viz
  const gravityVec = React.useMemo(() => {
    // Simple recalculation for display: F ~ -pos
    // Direction is towards center (0,0)
    // Magnitude scaled for visibility
    return {
      x: -body.position.x * 0.5, // Visual scale
      y: -body.position.y * 0.5,
    };
  }, [body.position]);

  return (
    <group>
      <group position={pos3D}>
        <mesh>
          <sphereGeometry args={[body.radius, 32, 32]} />
          <meshStandardMaterial
            color={body.color}
            emissive={body.color}
            emissiveIntensity={0.5}
          />
        </mesh>

        {/* Vectors */}
        {showVectors && (
          <>
            <VectorArrow3D
              origin={new THREE.Vector3(0, 0, 0)}
              vector={body.velocity}
              color="#34d399" // Green
              scale={2.0}
            />
            {/* Gravity Vector (Visual only, pointing to center) */}
            <VectorArrow3D
              origin={new THREE.Vector3(0, 0, 0)}
              vector={gravityVec}
              color="#f87171" // Red
              scale={0.05}
            />
          </>
        )}
      </group>

      {/* Trail */}
      <OrbitTrail3D trail={body.trail} color={body.color} />
    </group>
  );
};

const HohmannTransferWell = () => {
  const { orbitingBodies, centralMass, showHohmann } = useAstroEngine();

  const transferData = React.useMemo(() => {
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

    const a = (r1 + r2) / 2;
    const c = (r2 - r1) / 2;
    const b = Math.sqrt(a * a - c * c);

    const angle = Math.atan2(inner.position.y, inner.position.x);

    const points = [];
    const segments = 100;

    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * 2 * Math.PI;
      const x_local = a * Math.cos(theta) - c;
      const y_local = b * Math.sin(theta);

      const x_rot = x_local * Math.cos(angle) - y_local * Math.sin(angle);
      const y_rot = x_local * Math.sin(angle) + y_local * Math.cos(angle);

      const r_point = Math.sqrt(x_rot * x_rot + y_rot * y_rot);
      const depth = -(centralMass / 500) / (1 + r_point / 20);

      points.push(new THREE.Vector3(x_rot, depth + 1.0, y_rot));
    }

    // Calculate label positions (Periapsis r1, Apoapsis r2)
    // Periapsis local: (r1, 0) (Angle 0)
    // Apoapsis local: (-r2, 0) (Angle PI)

    // Transform to 3D with rotation
    // P1
    const x1 = r1 * Math.cos(angle);
    const y1 = r1 * Math.sin(angle);
    const d1 = -(centralMass / 500) / (1 + r1 / 20);
    const pos1 = new THREE.Vector3(x1, d1 + 5.0, y1);

    // P2
    const x2 = -r2 * Math.cos(angle);
    const y2 = -r2 * Math.sin(angle);
    const d2 = -(centralMass / 500) / (1 + r2 / 20);
    const pos2 = new THREE.Vector3(x2, d2 + 5.0, y2);

    return { points, hohmann, r1, r2, pos1, pos2 };
  }, [orbitingBodies, centralMass, showHohmann]);

  if (!transferData) return null;

  const positions = new Float32Array(
    transferData.points.flatMap((p) => [p.x, p.y, p.z]),
  );

  return (
    <group>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={transferData.points.length}
            array={positions}
            itemSize={3}
            args={[positions, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#eab308" linewidth={2} />
      </line>

      <Billboard position={transferData.pos1}>
        <Text fontSize={12} color="#eab308" anchorX="center" anchorY="bottom">
          {`Δv1: ${transferData.hohmann.dv1.toFixed(1)}`}
        </Text>
      </Billboard>

      <Billboard position={transferData.pos2}>
        <Text fontSize={12} color="#eab308" anchorX="center" anchorY="bottom">
          {`Δv2: ${transferData.hohmann.dv2.toFixed(1)}`}
        </Text>
      </Billboard>
    </group>
  );
};

const CentralStar3D = () => {
  const { starRadiusRelative, temperature, centralMass } = useAstroEngine();
  // Visual size scaled roughly
  const size = 20 * Math.sqrt(Math.max(0.01, starRadiusRelative));
  const color = kelvinToColor(temperature);

  // Depth at center
  const depth = -(centralMass / 500);

  return (
    <group position={[0, depth, 0]}>
      <mesh>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2}
        />
      </mesh>
      <pointLight distance={500} decay={1} intensity={2} color={color} />
    </group>
  );
};

const PhysicsLoop = () => {
  const { isPlaying, stepPhysics } = useAstroEngine();

  useFrame(() => {
    if (isPlaying) {
      stepPhysics();
    }
  });

  return null;
};

export const GravityWellStage: React.FC = () => {
  const { orbitingBodies, centralMass } = useAstroEngine();
  const containerRef = React.useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="w-full h-full bg-black">
      <Canvas
        eventSource={
          containerRef as React.RefObject<HTMLElement> as unknown as HTMLElement
        }
        camera={{ position: [0, 200, 400], fov: 45 }}
      >
        <color attach="background" args={["#020408"]} />

        <PhysicsLoop />

        {/* Lighting */}
        <ambientLight intensity={0.2} />

        {/* Environment */}
        <Stars
          radius={300}
          depth={50}
          count={5000}
          factor={4}
          saturation={0}
          fade
          speed={1}
        />

        {/* Visualization */}
        <SpaceGrid centralMass={centralMass} />
        <CentralStar3D />

        <HohmannTransferWell />

        {orbitingBodies.map((body) => (
          <Body3D key={body.id} body={body} />
        ))}

        {/* Controls */}
        <SceneStabilizer />
        <SafeOrbitControls
          enablePan={true}
          enableZoom={true}
          maxPolarAngle={Math.PI / 1.5} // Don't go below grid
          minPolarAngle={0}
        />
      </Canvas>
    </div>
  );
};
