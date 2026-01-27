import {
  Html,
  Line as DreiLine,
  PerspectiveCamera,
  Stars,
  Text,
} from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Bloom,
  EffectComposer,
  SMAA,
  Vignette,
} from "@react-three/postprocessing";
import { useCanvasReady } from "@shared/hooks/useCanvasReady";
import { useTranslations } from "@shared/hooks/useTranslations";
import { math } from "@shared/lib/math/math-light";
import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { LazyXR } from "../../features/threed-studio/ui/LazyXR";
import { SafeOrbitControls } from "../../features/threed-studio/ui/SafeOrbitControls";
import { SceneStabilizer } from "../../features/threed-studio/ui/SceneStabilizer";

// Safe Effect Composer wrapper to prevent rendering during context loss
const SafeEffectComposer = ({ children }: { children: React.ReactNode }) => {
  const { gl } = useThree();
  // Check for context loss via the underlying WebGL context
  const ctx = gl.getContext();
  if (ctx.isContextLost()) return null;
  return (
    <EffectComposer enableNormalPass={false} multisampling={0}>
      {children as React.ReactElement}
    </EffectComposer>
  );
};

// Helper: Render only if GPU is available to prevent race conditions during context loss
// Also supports explicit disabling via props (e.g. for VR)
// Helper: Render only if GPU is available to prevent race conditions during context loss
// Also supports explicit disabling via props (e.g. for VR)

const SurfaceMesh: React.FC<{
  expression: string;
  range: number;
  resolution: number;
  showGlass: boolean;
  showContours: boolean;
  color1?: string;
  color2?: string;
  liquidStrength?: number;
  liquidSpeed?: number;
  wireframe?: boolean;
  isAnimating?: boolean;
  animationSpeed?: number;
  colorMode?: string;
  showHologram?: boolean;
  opacity?: number;
  roughness?: number;
  metalness?: number;
  clipX?: number;
  clipY?: number;
  clipZ?: number;
}> = ({
  expression,
  range,
  resolution,
  showGlass,
  showContours,
  color1 = "#A06CD5",
  color2 = "#facc15",
  liquidStrength = 0.05,
  liquidSpeed = 5,
  wireframe = false,
  isAnimating = true,
  animationSpeed = 1,
  colorMode = "height",
  showHologram = false,
  opacity = 1,
  roughness = 0.2,
  metalness = 0.9,
  clipX = 1,
  clipY = 1,
  clipZ = 1,
}) => {
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const posTarget = useRef<Float32Array | null>(null);
  const posCurrent = useRef<Float32Array | null>(null);
  const colTarget = useRef<Float32Array | null>(null);
  const colCurrent = useRef<Float32Array | null>(null);
  const lerpProgress = useRef(1);

  // Dynamic Time Variable
  const timeRef = useRef(0);

  // Clipping Planes
  const clippingPlanes = useMemo(() => {
    const planes = [];
    if (clipX < 1)
      planes.push(
        new THREE.Plane(new THREE.Vector3(-1, 0, 0), range * (2 * clipX - 1)),
      );
    if (clipY < 1)
      planes.push(
        new THREE.Plane(new THREE.Vector3(0, 0, 1), range * (2 * clipY - 1)),
      );
    if (clipZ < 1)
      planes.push(
        new THREE.Plane(new THREE.Vector3(0, -1, 0), range * (2 * clipZ - 1)),
      );
    return planes;
  }, [clipX, clipY, clipZ, range]);

  useEffect(() => {
    if (!geometryRef.current) return;

    const h = 0.05;
    let compiled: math.EvalFunction;
    try {
      compiled = math.compile(expression);
    } catch {
      return;
    }

    const getZ = (x: number, y: number, t: number = 0) => {
      try {
        const val = compiled.evaluate({ x, y, t });
        if (!isFinite(val)) return 0;
        return Math.max(-range * 2, Math.min(range * 2, val));
      } catch {
        return 0;
      }
    };

    const size = resolution + 1;
    const count = size * size;
    const nextPos = new Float32Array(count * 3);
    const nextCol = new Float32Array(count * 3);
    const curvatureValues: number[] = [];
    const zValues: number[] = [];

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const x = (i / resolution) * 2 * range - range;
        const y = (j / resolution) * 2 * range - range;
        const z = getZ(x, y, 0);

        zValues.push(z);
        const idx = (i * size + j) * 3;
        nextPos[idx] = x;
        nextPos[idx + 1] = z;
        nextPos[idx + 2] = -y;

        if (colorMode !== "height") {
          // Finite difference for curvature
          const fx = (getZ(x + h, y) - getZ(x - h, y)) / (2 * h);
          const fy = (getZ(x, y + h) - getZ(x, y - h)) / (2 * h);
          const fxx = (getZ(x + h, y) - 2 * z + getZ(x - h, y)) / (h * h);
          const fyy = (getZ(x, y + h) - 2 * z + getZ(x, y - h)) / (h * h);
          const fxy =
            (getZ(x + h, y + h) -
              getZ(x + h, y - h) -
              getZ(x - h, y + h) +
              getZ(x - h, y - h)) /
            (4 * h * h);

          if (colorMode === "gaussian") {
            const K =
              (fxx * fyy - fxy * fxy) / Math.pow(1 + fx * fx + fy * fy, 2);
            curvatureValues.push(K);
          } else {
            const H =
              ((1 + fy * fy) * fxx - 2 * fx * fy * fxy + (1 + fx * fx) * fyy) /
              (2 * Math.pow(1 + fx * fx + fy * fy, 1.5));
            curvatureValues.push(H);
          }
        }
      }
    }

    let minVal = Infinity,
      maxVal = -Infinity;
    const activeValues = colorMode === "height" ? zValues : curvatureValues;
    activeValues.forEach((v) => {
      minVal = Math.min(minVal, v);
      maxVal = Math.max(maxVal, v);
    });

    const span = maxVal - minVal || 1;
    for (let i = 0; i < count; i++) {
      const z = zValues[i]!;
      const val = activeValues[i]!;
      const t = (val - minVal) / span;
      const color = new THREE.Color();

      if (showContours && Math.abs((z * 5) % 1.0) < 0.1) {
        color.set("#ffffff");
      } else {
        if (t < 0.33)
          color.lerpColors(
            new THREE.Color(color1),
            new THREE.Color("#00D1FF"),
            t * 3,
          );
        else if (t < 0.66)
          color.lerpColors(
            new THREE.Color("#00D1FF"),
            new THREE.Color("#A06CD5"),
            (t - 0.33) * 3,
          );
        else
          color.lerpColors(
            new THREE.Color("#A06CD5"),
            new THREE.Color(color2),
            (t - 0.66) * 3,
          );
      }

      const index = i * 3;
      nextCol[index] = color.r;
      nextCol[index + 1] = color.g;
      nextCol[index + 2] = color.b;
    }

    const idxArray: number[] = [];
    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const a = i * size + j;
        const b = i * size + (j + 1);
        const c = (i + 1) * size + j;
        const d = (i + 1) * size + (j + 1);
        idxArray.push(a, b, d, a, d, c);
      }
    }

    if (!posCurrent.current) {
      posCurrent.current = nextPos.slice();
      colCurrent.current = nextCol.slice();
      const geo = geometryRef.current;
      geo.setAttribute(
        "position",
        new THREE.BufferAttribute(posCurrent.current, 3),
      );
      geo.setAttribute(
        "color",
        new THREE.BufferAttribute(colCurrent.current, 3),
      );
      geo.setIndex(idxArray);
      geo.computeVertexNormals();
    }

    posTarget.current = nextPos;
    colTarget.current = nextCol;
    lerpProgress.current = 0;
  }, [expression, range, resolution, showContours, colorMode, color1, color2]);

  useFrame((state, delta) => {
    if (!geometryRef.current || !posCurrent.current) return;
    const positions = posCurrent.current;
    const time = state.clock.getElapsedTime();
    const needsAnim = isAnimating && expression.includes("t");

    if (needsAnim) {
      timeRef.current += delta * animationSpeed;
      const t_anim = timeRef.current;
      let compiled: math.EvalFunction | null = null;
      try {
        compiled = math.compile(expression);
      } catch {
        return;
      }

      const size = resolution + 1;
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          const idx = (i * size + j) * 3;
          const x = positions[idx]!;
          const y = -positions[idx + 2]!;
          try {
            const z = compiled.evaluate({ x, y, t: t_anim });
            positions[idx + 1] = Math.max(-range * 2, Math.min(range * 2, z));
          } catch {
            /* empty */
          }
        }
      }
      (
        geometryRef.current.getAttribute("position") as THREE.BufferAttribute
      ).needsUpdate = true;
      geometryRef.current.computeVertexNormals();
    }

    if (lerpProgress.current < 1) {
      const t = Math.min(lerpProgress.current + delta * 2, 1);
      lerpProgress.current = t;
      const p = t * t * (3 - 2 * t);
      const wave = Math.sin(time * liquidSpeed) * (1 - p) * liquidStrength;

      const targetPos = posTarget.current;
      if (targetPos) {
        for (let i = 0; i < positions.length; i++) {
          positions[i] =
            positions[i]! * (1 - p) +
            targetPos[i]! * p +
            (i % 3 === 1 ? wave : 0);
        }
        (
          geometryRef.current.getAttribute("position") as THREE.BufferAttribute
        ).needsUpdate = true;
      }
      const currentCols = colCurrent.current;
      const targetCols = colTarget.current;
      if (targetCols && currentCols) {
        for (let i = 0; i < currentCols.length; i++) {
          currentCols[i] = currentCols[i]! * (1 - p) + targetCols[i]! * p;
        }
        (
          geometryRef.current.getAttribute("color") as THREE.BufferAttribute
        ).needsUpdate = true;
      }
      if (t >= 1) {
        geometryRef.current.computeVertexNormals();
      }
    }
  });

  useEffect(() => {
    const geo = geometryRef.current;
    return () => {
      if (geo) geo.dispose();
    };
  }, []);

  if (showHologram) {
    return (
      <mesh>
        <bufferGeometry ref={geometryRef} />
        <meshStandardMaterial
          vertexColors
          wireframe
          transparent
          opacity={0.6 * opacity}
          emissive={color1}
          emissiveIntensity={2}
          clippingPlanes={clippingPlanes}
        />
        <meshStandardMaterial
          transparent
          opacity={0.1 * opacity}
          color={color1}
          side={THREE.DoubleSide}
          clippingPlanes={clippingPlanes}
        />
      </mesh>
    );
  }

  if (showGlass) {
    return (
      <mesh>
        <bufferGeometry ref={geometryRef} />
        <meshPhysicalMaterial
          vertexColors
          transmission={1}
          thickness={1}
          roughness={roughness}
          metalness={0.2}
          transparent
          opacity={opacity}
          envMapIntensity={2}
          wireframe={wireframe}
          clippingPlanes={clippingPlanes}
        />
      </mesh>
    );
  }

  return (
    <mesh>
      <bufferGeometry ref={geometryRef} />
      <meshStandardMaterial
        vertexColors
        side={THREE.DoubleSide}
        roughness={roughness}
        metalness={metalness}
        transparent={opacity < 1}
        opacity={opacity}
        envMapIntensity={1}
        wireframe={wireframe}
        clippingPlanes={clippingPlanes}
      />
    </mesh>
  );
};

export interface SurfacePlotterProps {
  expression: string;
  range?: number;
  resolution?: number;
  showLaser?: boolean;
  showGradients?: boolean;
  showContours?: boolean;
  showGlass?: boolean;
  showPhysics?: boolean;
  showTangent?: boolean;
  showCritical?: boolean;
  showSlice?: boolean;
  showGrid?: boolean;
  showAxes?: boolean;
  wireframe?: boolean;
  surfaceColor1?: string;
  surfaceColor2?: string;
  liquidStrength?: number;
  liquidSpeed?: number;
  bloomIntensity?: number;
  bloomThreshold?: number;

  // Phase 5 Ultra-Elite Props
  isAnimating?: boolean;
  animationSpeed?: number;
  colorMode?: string;
  showStreamlines?: boolean;
  showVolume?: boolean;
  showShadowMap?: boolean;
  chromaticAberration?: number;
  vignette?: number;
  showHologram?: boolean;
  dofIntensity?: number;
  sunPosition?: [number, number, number];
  lightColor?: string;
  clipX?: number;
  clipY?: number;
  clipZ?: number;
  autoOrbit?: boolean;
  surfaceShininess?: number;
  surfaceRoughness?: number;
  surfaceOpacity?: number;
  isAR?: boolean;
  onScreenshot?: () => void;
  onToggleSettings?: () => void;
  onReset?: () => void;
}

const LaserScanner = ({
  range,
  active,
}: {
  range: number;
  active: boolean;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!meshRef.current) return;
    const t = (state.clock.getElapsedTime() * 0.5) % 1;
    const z = t * 2 * range - range;
    meshRef.current.position.y = z;
  });

  if (!active) return null;

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[range * 2, range * 2]} />
      <meshStandardMaterial
        color="#00D1FF"
        emissive="#00D1FF"
        emissiveIntensity={2}
        transparent
        opacity={0.1}
        side={THREE.DoubleSide}
      />
      {/* Edge glow */}
      <mesh position={[0, 0, 0.01]} rotation={[0, 0, Math.PI / 4]}>
        <ringGeometry args={[range * 0.98, range, 4]} />
        <meshBasicMaterial color="#00D1FF" />
      </mesh>
    </mesh>
  );
};

const GradientField = ({
  expression,
  range,
  active,
}: {
  expression: string;
  range: number;
  resolution: number;
  active: boolean;
}) => {
  const arrows = useMemo(() => {
    if (!active) return [];
    let compiled: math.EvalFunction | null = null;
    try {
      compiled = math.compile(expression);
    } catch {
      return [];
    }
    if (!compiled) return [];
    const step = (range * 2) / 10; // lower res for arrows
    const res: { pos: number[]; dir: THREE.Vector3 }[] = [];

    for (let i = -range; i <= range; i += step) {
      for (let j = -range; j <= range; j += step) {
        try {
          const x = i;
          const y = j;
          const z = compiled.evaluate({ x, y });

          // Simple finite difference for gradient
          const eps = 0.01;
          const dzdx = (compiled.evaluate({ x: x + eps, y }) - z) / eps;
          const dzdy = (compiled.evaluate({ x, y: y + eps }) - z) / eps;

          const dir = new THREE.Vector3(dzdx, 1, -dzdy).normalize();
          res.push({ pos: [x, z + 0.1, -y], dir });
        } catch {
          /* empty */
        }
      }
    }
    return res;
  }, [expression, range, active]);

  if (!active) return null;

  return (
    <group>
      {arrows.map((a, i) => (
        <arrowHelper
          key={i}
          args={[a.dir, new THREE.Vector3(...a.pos), 0.3, 0x00d1ff, 0.1, 0.05]}
        />
      ))}
    </group>
  );
};

const Tooltip = () => {
  const { raycaster, mouse, camera, scene } = useThree();
  const [hoverPos, setHoverPos] = useState<{
    x: number;
    y: number;
    z: number;
    world: THREE.Vector3;
  } | null>(null);

  useFrame(() => {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    const surface = intersects.find(
      (hit: THREE.Intersection) =>
        hit.object.type === "Mesh" &&
        (hit.object as THREE.Mesh).geometry.type === "BufferGeometry",
    );

    if (surface) {
      const worldPos = surface.point;
      // Surface is rendered at y=-1, so adjust capture
      const mathX = worldPos.x;
      const mathY = -worldPos.z;
      setHoverPos({ x: mathX, y: mathY, z: worldPos.y + 1, world: worldPos });
    } else {
      setHoverPos(null);
    }
  });

  if (!hoverPos) return null;

  return (
    <group position={hoverPos.world}>
      <mesh>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color="#00D1FF" />
      </mesh>
      <Html distanceFactor={10} position={[0, 0.2, 0]} pointerEvents="none">
        <div className="bg-obsidian-950/90 border border-electric/40 backdrop-blur-md px-2 py-1 rounded text-[10px] font-mono whitespace-nowrap shadow-xl">
          <div className="text-electric/60 mb-0.5">POSITION</div>
          <div className="flex gap-3 text-slate-200">
            <span>
              X: <span className="text-white">{hoverPos.x.toFixed(2)}</span>
            </span>
            <span>
              Y: <span className="text-white">{hoverPos.y.toFixed(2)}</span>
            </span>
            <span>
              Z: <span className="text-white">{hoverPos.z.toFixed(2)}</span>
            </span>
          </div>
        </div>
      </Html>
    </group>
  );
};

const TangentPlane = ({
  expression,
  active,
}: {
  expression: string;
  active: boolean;
}) => {
  const { raycaster, mouse, camera, scene } = useThree();
  const [planeData, setPlaneData] = useState<{
    pos: THREE.Vector3;
    rotation: THREE.Euler;
  } | null>(null);

  useFrame(() => {
    if (!active) {
      setPlaneData(null);
      return;
    }
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    const hit = intersects.find(
      (h: THREE.Intersection) =>
        h.object.type === "Mesh" &&
        (h.object as THREE.Mesh).geometry.type === "BufferGeometry",
    );

    if (hit) {
      try {
        const compiled = math.compile(expression);
        const x = hit.point.x;
        const y = -hit.point.z;
        const z = compiled.evaluate({ x, y });

        const eps = 0.01;
        const dzdx = (compiled.evaluate({ x: x + eps, y }) - z) / eps;
        const dzdy = (compiled.evaluate({ x, y: y + eps }) - z) / eps;

        const normal = new THREE.Vector3(-dzdx, 1, dzdy).normalize();
        const dummy = new THREE.Object3D();
        dummy.position.set(x, z - 1, -y); // Surface is at y=-1
        dummy.lookAt(new THREE.Vector3().addVectors(dummy.position, normal));

        setPlaneData({ pos: dummy.position, rotation: dummy.rotation.clone() });
      } catch {
        /* empty */
      }
    } else {
      setPlaneData(null);
    }
  });

  if (!active || !planeData) return null;

  return (
    <mesh position={planeData.pos} rotation={planeData.rotation}>
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial
        color="#00D1FF"
        transparent
        opacity={0.4}
        side={THREE.DoubleSide}
        emissive="#00D1FF"
        emissiveIntensity={0.5}
      />
      <arrowHelper
        args={[
          new THREE.Vector3(0, 0, 1),
          new THREE.Vector3(0, 0, 0),
          0.5,
          0xffffff,
          0.1,
          0.05,
        ]}
      />
    </mesh>
  );
};

const CriticalPoints = ({
  expression,
  range,
  active,
}: {
  expression: string;
  range: number;
  active: boolean;
}) => {
  const points = useMemo(() => {
    if (!active) return [];
    let compiled: math.EvalFunction | null = null;
    try {
      compiled = math.compile(expression);
    } catch {
      return [];
    }
    if (!compiled) return [];
    const res: {
      x: number;
      y: number;
      z: number;
      type: string;
      color: string;
    }[] = [];
    const steps = 15;
    const stepSize = (range * 2) / steps;

    for (let i = -range; i <= range; i += stepSize) {
      for (let j = -range; j <= range; j += stepSize) {
        try {
          const x = i;
          const y = j;
          const z = compiled.evaluate({ x, y });

          const eps = 0.05;
          const dzdx = (compiled.evaluate({ x: x + eps, y }) - z) / eps;
          const dzdy = (compiled.evaluate({ x, y: y + eps }) - z) / eps;

          if (Math.abs(dzdx) < 0.1 && Math.abs(dzdy) < 0.1) {
            // Check Hessian for type
            const dzdx2 =
              (compiled.evaluate({ x: x + eps, y }) -
                2 * z +
                compiled.evaluate({ x: x - eps, y })) /
              (eps * eps);
            const dzdy2 =
              (compiled.evaluate({ x, y: y + eps }) -
                2 * z +
                compiled.evaluate({ x, y: y - eps })) /
              (eps * eps);
            const detH = dzdx2 * dzdy2;

            let type = "Critical";
            let color = "#ffffff";
            if (detH > 0 && dzdx2 > 0) {
              type = "MIN";
              color = "#22c55e";
            } else if (detH > 0 && dzdx2 < 0) {
              type = "MAX";
              color = "#ef4444";
            } else if (detH < 0) {
              type = "SADDLE";
              color = "#facc15";
            }

            res.push({ x, y: z, z: -y, type, color });
          }
        } catch {
          /* empty */
        }
      }
    }
    return res;
  }, [expression, range, active]);

  if (!active) return null;

  return (
    <group>
      {points.map((p, i) => (
        <group key={i} position={[p.x, p.y, p.z]}>
          <mesh>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshBasicMaterial color={p.color} />
          </mesh>
          <Text position={[0, 0.3, 0]} fontSize={0.2} color={p.color}>
            {p.type}
          </Text>
        </group>
      ))}
    </group>
  );
};

const TopographicSlice = ({
  range,
  active,
}: {
  range: number;
  active: boolean;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!meshRef.current) return;
    const t = Math.sin(state.clock.getElapsedTime()) * 0.5 + 0.5;
    meshRef.current.position.y = t * range * 4 - range * 2;
  });

  if (!active) return null;

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[range * 2.2, 0.02, range * 2.2]} />
      <meshStandardMaterial
        color="#ffffff"
        emissive="#ffffff"
        emissiveIntensity={2}
        transparent
        opacity={0.3}
      />
    </mesh>
  );
};

const GravityBall = ({
  expression,
  range,
  active,
}: {
  expression: string;
  range: number;
  active: boolean;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const pos = useRef(new THREE.Vector3(1, 0, 1));
  const vel = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((_, delta) => {
    if (!active || !meshRef.current) return;

    try {
      const compiled = math.compile(expression);
      const x = pos.current.x;
      const y = -pos.current.z; // back to math coordinates

      const z = compiled.evaluate({ x, y });

      // Gradient descent
      const eps = 0.05;
      const dzdx = (compiled.evaluate({ x: x + eps, y }) - z) / eps;
      const dzdy = (compiled.evaluate({ x, y: y + eps }) - z) / eps;

      // Acceleration based on slope
      const gravity = 9.8;
      const acc = new THREE.Vector3(-dzdx, 0, dzdy).multiplyScalar(
        gravity * delta,
      );

      vel.current.add(acc);
      vel.current.multiplyScalar(0.98); // Damping/Friction

      pos.current.x += vel.current.x * delta;
      pos.current.z += vel.current.z * delta;

      // Keep in bounds
      if (Math.abs(pos.current.x) > range) {
        pos.current.x = Math.sign(pos.current.x) * range;
        vel.current.x *= -0.5;
      }
      if (Math.abs(pos.current.z) > range) {
        pos.current.z = Math.sign(pos.current.z) * range;
        vel.current.z *= -0.5;
      }

      // Update height
      const finalZ = compiled.evaluate({ x: pos.current.x, y: -pos.current.z });
      pos.current.y = finalZ + 0.3; // Offset to sit on surface

      meshRef.current.position.copy(pos.current);
    } catch {
      /* empty */
    }
  });

  if (!active) return null;

  return (
    <mesh ref={meshRef} castShadow>
      <sphereGeometry args={[0.2, 32, 32]} />
      <meshStandardMaterial
        color="#fbbf24"
        emissive="#fbbf24"
        emissiveIntensity={1}
        metalness={1}
        roughness={0}
      />
      <pointLight intensity={1} distance={3} color="#fbbf24" />
    </mesh>
  );
};

const Streamlines = ({
  expression,
  range,
  active,
}: {
  expression: string;
  range: number;
  active: boolean;
}) => {
  const lines = useMemo(() => {
    if (!active) return [];
    let compiled: math.EvalFunction | null = null;
    try {
      compiled = math.compile(expression);
    } catch {
      return [];
    }
    if (!compiled) return [];
    const res: THREE.Vector3[][] = [];
    const seeds = 8;
    const step = (range * 2) / seeds;

    for (let i = -range; i <= range; i += step) {
      for (let j = -range; j <= range; j += step) {
        let currX = i;
        let currY = j;
        const path: THREE.Vector3[] = [];
        for (let k = 0; k < 20; k++) {
          try {
            const z = compiled.evaluate({ x: currX, y: currY });
            path.push(new THREE.Vector3(currX, z + 0.05, -currY));

            const eps = 0.01;
            const dx =
              (compiled.evaluate({ x: currX + eps, y: currY }) - z) / eps;
            const dy =
              (compiled.evaluate({ x: currX, y: currY + eps }) - z) / eps;

            currX -= dx * 0.1;
            currY -= dy * 0.1;
            if (Math.abs(currX) > range || Math.abs(currY) > range) break;
          } catch {
            break;
          }
        }
        if (path.length > 1) res.push(path);
      }
    }
    return res;
  }, [expression, range, active]);

  if (!active) return null;
  return (
    <group>
      {lines.map((path, i) => (
        <DreiLine
          key={i}
          points={path}
          color="#00D1FF"
          lineWidth={1}
          transparent
          opacity={0.4}
        />
      ))}
    </group>
  );
};

const AutoOrbit = ({ active }: { active: boolean }) => {
  useFrame((state) => {
    if (!active) return;
    const t = state.clock.getElapsedTime() * 0.2;
    state.camera.position.x = Math.cos(t) * 15;
    state.camera.position.z = Math.sin(t) * 15;
    state.camera.lookAt(0, 0, 0);
  });
  return null;
};

const VolumeVisualizer = ({
  expression,
  range,
  resolution,
  active,
}: {
  expression: string;
  range: number;
  resolution: number;
  active: boolean;
}) => {
  const geom = useMemo(() => {
    if (!active) return null;
    let compiled: math.EvalFunction | null = null;
    try {
      compiled = math.compile(expression);
    } catch {
      return null;
    }
    if (!compiled) return null;
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];

    // Brute force: create wall panels for each edge
    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const x1 = (i / resolution) * 2 * range - range;
        const y1 = (j / resolution) * 2 * range - range;
        const x2 = ((i + 1) / resolution) * 2 * range - range;

        const z11 = compiled.evaluate({ x: x1, y: y1 });

        // Simplified: just a box or skirt. Let's do a simple bottom-fill box for better performance.
        if (i % 5 === 0 && j % 5 === 0) {
          vertices.push(x1, 0, -y1, x1, z11, -y1, x2, 0, -y1);
        }
      }
    }
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3),
    );
    return geometry;
  }, [expression, range, resolution, active]);

  if (!active || !geom) return null;
  return (
    <mesh geometry={geom}>
      <meshStandardMaterial
        color="#3b82f6"
        transparent
        opacity={0.1}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

const ShadowMap = ({ range, active }: { range: number; active: boolean }) => {
  if (!active) return null;
  return (
    <group position={[0, -2, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[range * 2, range * 2]} />
        <meshStandardMaterial
          color="#000000"
          transparent
          opacity={0.3}
          roughness={1}
        />
      </mesh>
      <gridHelper
        args={[range * 2, 10, "#00D1FF", "#004466"]}
        rotation={[0, 0, 0]}
        material-transparent
        material-opacity={0.1}
      />
    </group>
  );
};

// 1. DEFINIEER DE HANDLE TYPE (De "Afstandsbediening")
export interface SurfacePlotterHandle {
  toggleVR: () => Promise<void>;
  toggleAR: () => Promise<void>;
  capture: () => Promise<string>;
}

// 2. VR-AWARE COMPONENT (Passes VR state to children or handles it)
// We need to access useXR hook inside the Canvas.
// --- Safe Orbit Controls ---

const VisualizationContent = (
  props: SurfacePlotterProps & {
    isContextLost: boolean;
    effectsReady: boolean;
    remountKey: number;
    xrRef: unknown;
  },
) => {
  // const isPresenting = useXR((state) => !!state.session); // isPresenting is not used

  return (
    <>
      <color attach="background" args={["#000000"]} />
      <PerspectiveCamera makeDefault position={[10, 8, 10]} fov={45} />
      <SafeOrbitControls enableDamping dampingFactor={0.05} />
      <ambientLight intensity={0.1} color={props.lightColor || "#ffffff"} />
      <pointLight
        position={
          (props.sunPosition as [number, number, number]) || [10, 10, 10]
        }
        intensity={1.5}
        color={props.lightColor || "#ffffff"}
        castShadow
      />
      <pointLight position={[-10, -10, -5]} intensity={0.5} color="#4c1d95" />{" "}
      {/* Background elements - Hide in AR */}
      {!props.isAR && (
        <>
          <Stars
            radius={100}
            depth={50}
            count={5000}
            factor={4}
            saturation={0}
            fade
            speed={1}
          />
          <fog attach="fog" args={["#000000", 10, 50]} />
        </>
      )}
      <group position={[0, -1, 0]}>
        <SurfaceMesh
          range={props.range || 5}
          resolution={props.resolution || 50}
          showGlass={props.showGlass || false}
          showContours={props.showContours || false}
          expression={props.expression}
          color1={props.surfaceColor1 || "#A06CD5"}
          color2={props.surfaceColor2 || "#facc15"}
          liquidStrength={props.liquidStrength || 0.05}
          liquidSpeed={props.liquidSpeed || 5}
          wireframe={props.wireframe || false}
          isAnimating={props.isAnimating || false}
          animationSpeed={props.animationSpeed || 1}
          colorMode={props.colorMode || "height"}
          showHologram={props.showHologram || false}
          opacity={
            props.surfaceOpacity !== undefined ? props.surfaceOpacity : 1
          }
          roughness={
            props.surfaceRoughness !== undefined ? props.surfaceRoughness : 0.2
          }
          metalness={
            props.surfaceShininess ? props.surfaceShininess / 100 : 0.9
          }
          clipX={props.clipX || 1}
          clipY={props.clipY || 1}
          clipZ={props.clipZ || 1}
        />

        <LaserScanner
          range={props.range || 5}
          active={props.showLaser || false}
        />
        <GradientField
          expression={props.expression}
          range={props.range || 5}
          resolution={10}
          active={props.showGradients || false}
        />
        <TangentPlane
          expression={props.expression}
          active={props.showTangent || false}
        />
        <CriticalPoints
          expression={props.expression}
          range={props.range || 5}
          active={props.showCritical || false}
        />
        <TopographicSlice
          range={props.range || 5}
          active={props.showSlice || false}
        />
        <GravityBall
          expression={props.expression}
          range={props.range || 5}
          active={props.showPhysics || false}
        />
        <Streamlines
          expression={props.expression}
          range={props.range || 5}
          active={props.showStreamlines || false}
        />
        <VolumeVisualizer
          expression={props.expression}
          range={props.range || 5}
          resolution={20}
          active={props.showVolume || false}
        />
        <ShadowMap
          range={props.range || 5}
          active={props.showShadowMap || false}
        />

        <Tooltip />

        {props.showGrid && (
          <gridHelper
            args={[(props.range || 5) * 2, 20, "#334155", "#1e293b"]}
            position={[0, 0.01, 0]}
          />
        )}
        {props.showAxes && (
          <axesHelper args={[props.range || 5]} position={[0, 0.01, 0]} />
        )}
      </group>
      {props.autoOrbit && <AutoOrbit active={true} />}
      {!props.isContextLost && props.effectsReady && props.remountKey >= 0 && (
        <Suspense fallback={null}>
          <SafeEffectComposer>
            <SMAA /> {/* Anti-aliasing for sharp edges */}
            <Bloom
              luminanceThreshold={0.2}
              mipmapBlur={false}
              intensity={0.8}
            />
            <Vignette eskil={false} offset={0.1} darkness={0.8} />
          </SafeEffectComposer>
        </Suspense>
      )}
    </>
  );
};

// 2. INTERNE CONTROLLER (Zit IN de Canvas en heeft toegang tot useXR)

export const SurfacePlotter = React.forwardRef<
  SurfacePlotterHandle,
  SurfacePlotterProps
>((props, ref) => {
  // Interne ref om de bridge te bouwen
  // Koppel de interne ref door naar de parent ref
  interface XRStore {
    enterVR: () => Promise<void>;
    enterAR: () => Promise<void>;
  }
  const [xrStore, setXrStore] = useState<XRStore | null>(null);

  // Initialize XR store asynchronously
  useEffect(() => {
    let mounted = true;
    const initXR = async () => {
      try {
        const { getXrStoreAsync } = await import("@shared/model/xr");
        const store = await getXrStoreAsync();
        if (mounted) {
          setXrStore(store);
        }
      } catch (e) {
        console.warn(
          "[SurfacePlotter] XR initialization failed (this is OK on non-XR devices):",
          e,
        );
      }
    };
    initXR();
    return () => {
      mounted = false;
    };
  }, []);

  React.useImperativeHandle(
    ref,
    () => ({
      toggleVR: async () => {
        try {
          if (xrStore) {
            await xrStore.enterVR();
          } else {
            console.warn("[SurfacePlotter] XR store not ready");
          }
        } catch (e) {
          console.error("Failed to enter VR via SurfacePlotter:", e);
        }
      },
      toggleAR: async () => {
        try {
          if (xrStore) {
            await xrStore.enterAR();
          } else {
            console.warn("[SurfacePlotter] XR store not ready");
          }
        } catch (e) {
          console.error("Failed to enter AR via SurfacePlotter:", e);
        }
      },
      capture: async () => {
        return canvasDomRef.current?.toDataURL("image/png") || "";
      },
    }),
    [xrStore],
  );

  const canvasDomRef = useRef<HTMLCanvasElement | null>(null);

  const { t } = useTranslations();
  const { canvasReady } = useCanvasReady(150);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  // SurfaceMesh and other internal components...
  const [remountKey, setRemountKey] = useState(0);
  const [effectsReady, setEffectsReady] = useState(false);
  const [isContextLost, setIsContextLost] = useState(false);
  const isContextLostRef = useRef(false);

  // Auto-recovery mechanism for mounting race conditions
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!effectsReady && !isContextLost) {
        setEffectsReady(true);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [effectsReady, isContextLost]);

  const handleContextLost = (event: Event) => {
    event.preventDefault();
    // console.warn("SurfacePlotter: WebGL Context Lost. Initiating recovery protocol...");
    setIsContextLost(true);
    isContextLostRef.current = true;
    setEffectsReady(false);

    // Fallback: If context isn't restored automatically within 2s, force remount
    setTimeout(() => {
      if (isContextLostRef.current) {
        // console.warn("SurfacePlotter: Context restoration timed out. Forcing hard remount.");
        setIsContextLost(false);
        isContextLostRef.current = false;
        setRemountKey((prev) => prev + 1);
      }
    }, 2000);
  };

  const handleContextRestored = () => {
    // console.log("SurfacePlotter: Context Restored. Retrying render...");
    setIsContextLost(false);
    isContextLostRef.current = false;
    setRemountKey((prev) => prev + 1); // Force fresh WebGL context
    setEffectsReady(false); // Re-init effects with delay
  };

  // Effect for cleanup
  useEffect(() => {
    return () => {
      const canvas = document.querySelector("canvas");
      if (canvas) {
        canvas.removeEventListener("webglcontextlost", handleContextLost);
        canvas.removeEventListener(
          "webglcontextrestored",
          handleContextRestored,
        );
      }
    };
  }, []);

  // Memoize geometry args to prevent rapid reconstruction
  useMemo(() => {
    return {
      ...props,
      resolution: Math.min(props.resolution || 50, 100),
    };
  }, [props]);

  // Import useTranslations if not available in scope (assuming it is available via hook)
  // Note: useTranslations hook usage assumes it's imported at top level.

  // Render content - wrap in XR only if store is available
  const canvasContent = (
    <VisualizationContent
      {...props}
      isContextLost={isContextLost}
      effectsReady={effectsReady}
      remountKey={remountKey}
      xrRef={ref}
    />
  );

  return (
    <div
      ref={setContainer}
      className={`h-full w-full relative overflow-hidden transition-colors duration-500 ${props.isAR ? "bg-transparent" : "bg-black"}`}
    >
      {/* Context Loss Overlay */}
      {isContextLost && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0b0e11]/90 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 animate-pulse">
            <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-emerald-400 font-bold font-mono">
              {t("common.restoring_gpu") || "Restoring GPU..."}
            </span>
          </div>
        </div>
      )}

      {/* CSS Vignette for cinematic depth without WebGL blur */}
      <div className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.8)_100%)]" />

      {canvasReady && container && (
        <Canvas
          eventSource={container as unknown as HTMLElement}
          key={remountKey}
          dpr={typeof window !== "undefined" ? window.devicePixelRatio : 1} // Uncapped for 1:1 Pixel Sharpness
          gl={{
            preserveDrawingBuffer: true,
            powerPreference: "high-performance",
            antialias: true, // Native AA enabled because Post-Processing is disabled for sharpness
            alpha: true,
            stencil: false,
            depth: true,
          }}
          onCreated={({ gl }) => {
            if (gl?.domElement) {
              canvasDomRef.current = gl.domElement;
              gl.domElement.addEventListener(
                "webglcontextlost",
                handleContextLost,
                false,
              );
              gl.domElement.addEventListener(
                "webglcontextrestored",
                handleContextRestored,
                false,
              );
            }
            gl.setClearColor("#000000", props.isAR ? 0 : 1);
            setTimeout(() => setEffectsReady(true), 300);
          }}
        >
          <SceneStabilizer />
          {xrStore ? (
            <LazyXR store={xrStore}>{canvasContent}</LazyXR>
          ) : (
            canvasContent
          )}
        </Canvas>
      )}

      {/* Overlay Info (Top Right) REPLACED/REMOVED */}
    </div>
  );
});

SurfacePlotter.displayName = "SurfacePlotter";
