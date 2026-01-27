import { SafeOrbitControls, SceneStabilizer } from "@features/threed-studio";
import {
  ContactShadows,
  Environment,
  Grid,
  Html,
  Line,
  MeshTransmissionMaterial,
  Stars,
  Text,
} from "@react-three/drei";
import { Canvas, ThreeEvent } from "@react-three/fiber";
import React, { useCallback, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import { AnalysisGraph } from "./AnalysisGraph";
import { calculateRayPath, TraceLens } from "./opticsRaytracer";
import { useOpticsEngine } from "./useOpticsEngine";

// --- TYPES ---
interface RayPath {
  pts: THREE.Vector3[];
  color: string;
}

// --- VISUAL CONSTANTS ---
const RAIL_LENGTH = 800;
// Radius berekend op basis van scenario
const getLensRadius = (scenario: string) =>
  scenario === "eye" || scenario === "correction" ? 65 : 85;

// Didactische Kleuren (RGB conventie voor optica constructies)
const COLORS = {
  RAY_1: "#ef4444", // Rood: Parallel -> Brandpunt
  RAY_2: "#22c55e", // Groen: Optisch Midden (Rechtdoor)
  RAY_3: "#3b82f6", // Blauw: Brandpunt -> Parallel
  LASER_GLOW: "#ff0055",
  VIRTUAL_OPACITY: 0.4,
  GUIDE: "#64748b",
};

// --- COMPONENTS ---

const OpticalRail = () => (
  <group position={[0, -2, 0]}>
    <mesh rotation={[0, 0, Math.PI / 2]} receiveShadow castShadow>
      <boxGeometry args={[4, RAIL_LENGTH, 10]} />
      <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
    </mesh>
    {[-300, -200, -100, 0, 100, 200, 300].map((x) => (
      <mesh key={x} position={[x, 2.1, 0]}>
        <boxGeometry args={[0.5, 0.2, 8]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
    ))}
  </group>
);

const Lens = ({
  type,
  curvatureRadius,
  mode,
  refractiveIndex,
  radius = 65,
}: {
  type: "convex" | "concave";
  curvatureRadius: number;
  mode: "simple" | "lensmaker";
  refractiveIndex: number;
  radius?: number;
}) => {
  // Check speciale materialen
  const isDiamond = (refractiveIndex || 1.5) > 2.0;
  const isGlass =
    (refractiveIndex || 1.5) > 1.45 && (refractiveIndex || 1.5) < 1.6;

  let color = type === "concave" ? "#fbcfe8" : "#a5f3fc";
  if (isDiamond) color = "#ffffff";
  if (isGlass) color = "#cceeff";

  // Bereken dikte
  const dynamicThickness =
    mode === "lensmaker"
      ? 2 + 1500 / Math.max(50, curvatureRadius)
      : type === "convex"
        ? 5
        : 2;

  // Cap dikte iets ruimer nu de lens groter is
  const thickness = Math.min(40, dynamicThickness);

  return (
    <group>
      {/* 1. HET GLAS */}
      {/* Rotatie [0, 0, PI/2] legt de cilinder plat op de X-as (Lichtrichting) */}
      <mesh castShadow receiveShadow rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[radius, radius, thickness, 32]} />
        <MeshTransmissionMaterial
          backside
          thickness={thickness}
          chromaticAberration={isDiamond ? 1.5 : 0.2}
          anisotropy={isDiamond ? 0.5 : 0.3}
          ior={refractiveIndex || 1.5}
          distortion={isDiamond ? 0.8 : 0.2}
          color={color}
          opacity={isDiamond ? 0.1 : 0.3}
        />
      </mesh>

      {/* 2. DE RAND (TORUS) */}
      {/* Rotatie [0, PI/2, 0] draait het gat naar de X-as */}
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[radius, 2, 16, 60]} />
        {/* VOEG 'side={THREE.DoubleSide}' TOE HIERONDER */}
        <meshStandardMaterial
          color="#334155"
          metalness={0.8}
          roughness={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

interface DraggableArrowProps {
  position: [number, number, number];
  height: number;
  color: string;
  label?: string;
  opacity?: number;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  isDraggable?: boolean;
}

const ArrowObj = ({
  position,
  height,
  color,
  label,
  opacity = 1,
  onDragStart,
  onDragEnd,
  isDraggable,
}: DraggableArrowProps) => {
  const [hovered, setHover] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const absH = Math.abs(height);
  if (absH < 0.1) return null;

  const isUp = height > 0;
  const stemH = Math.max(0.1, absH * 0.8);
  const headH = absH * 0.2;
  const yDir = isUp ? 1 : -1;

  const activeColor = hovered && isDraggable ? "#ffffff" : color;
  const scale = hovered && isDraggable ? 1.1 : 1;

  return (
    <group
      position={position}
      scale={scale}
      onPointerOver={() => isDraggable && setHover(true)}
      onPointerOut={() => isDraggable && setHover(false)}
      onPointerDown={(e) => {
        if (isDraggable && onDragStart) {
          e.stopPropagation();
          setIsDragging(true);
          onDragStart();
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
        }
      }}
      onPointerUp={(e) => {
        if (isDraggable && onDragEnd) {
          setIsDragging(false);
          onDragEnd();
          (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        }
      }}
    >
      {/* Hover HUD */}
      {(hovered || isDragging) && (
        <Html
          position={[0, height > 0 ? height + 5 : height - 5, 0]}
          center
          distanceFactor={10}
          style={{ pointerEvents: "none" }}
        >
          <div className="bg-black/90 backdrop-blur-md border border-white/20 px-3 py-2 rounded-lg text-[11px] text-white whitespace-nowrap font-sans flex flex-col gap-1 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-2">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="font-black uppercase tracking-tighter opacity-70">
                {label}
              </span>
            </div>
            <div className="flex flex-col font-mono text-slate-300">
              <div className="flex justify-between gap-4">
                <span className="opacity-50">Pos (x):</span>
                <span className="text-white font-bold">
                  {Math.abs(position[0]).toFixed(0)} mm
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="opacity-50">Hoogte (h):</span>
                <span className="text-white font-bold">
                  {height.toFixed(1)} mm
                </span>
              </div>
            </div>
          </div>
        </Html>
      )}
      <mesh position={[0, (stemH / 2) * yDir, 0]}>
        <cylinderGeometry args={[0.8, 0.8, stemH, 8]} />
        <meshStandardMaterial
          color={activeColor}
          emissive={activeColor}
          emissiveIntensity={1.5}
          transparent
          opacity={opacity}
        />
      </mesh>
      <mesh
        position={[0, (stemH + headH / 2) * yDir, 0]}
        rotation={[isUp ? 0 : Math.PI, 0, 0]}
      >
        <coneGeometry args={[2.5, headH, 16]} />
        <meshStandardMaterial
          color={activeColor}
          emissive={activeColor}
          emissiveIntensity={1.5}
          transparent
          opacity={opacity}
        />
      </mesh>
      {label && (
        <Text
          position={[0, height + (isUp ? 10 : -10), 0]}
          fontSize={6}
          color="white"
          anchorX="center"
          anchorY={isUp ? "bottom" : "top"}
          outlineWidth={0.5}
          outlineColor="black"
        >
          {label}
        </Text>
      )}
    </group>
  );
};

const FocalPoint = ({
  x,
  label,
  color = "#fbbf24",
}: {
  x: number;
  label: string;
  color?: string;
}) => (
  <group position={[x, 0, 0]}>
    <mesh>
      <sphereGeometry args={[1.5]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={2}
      />
    </mesh>
    <Text position={[0, -5, 0]} fontSize={5} color={color} anchorY="top">
      {label}
    </Text>
  </group>
);

const EquationHUD = () => {
  const { state, derived } = useOpticsEngine();
  const { objectDistance, scenario } = state;
  const { v1, f1 } = derived;

  if (scenario === "eye" || scenario === "correction") return null;

  const u = objectDistance || 100;
  const v = v1 || 1000;
  const f = f1 || 100;

  const isCorrect = Math.abs(1 / u + 1 / v - 1 / f) < 0.0001;

  return (
    <Html fullscreen style={{ pointerEvents: "none" }}>
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
        <div className="bg-black/60 backdrop-blur-2xl border border-white/10 p-5 rounded-3xl shadow-2xl flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="text-[10px] uppercase font-black text-slate-500 tracking-[0.3em] mb-1 opacity-70">
            Lenzenformule{" "}
            <span className="text-[8px] opacity-40 ml-2 font-mono">
              (1/u + 1/v = 1/f)
            </span>
          </div>
          <div className="flex items-center gap-6 text-2xl font-black text-white italic tracking-tighter">
            <div className="flex flex-col items-center">
              <div className="border-b-2 border-white/20 px-3 pb-1 mb-1 opacity-40 text-sm not-italic font-sans">
                1
              </div>
              <div className="text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]">
                {u.toFixed(0)}
              </div>
            </div>
            <div className="text-3xl pb-2 opacity-30 not-italic">+</div>
            <div className="flex flex-col items-center">
              <div className="border-b-2 border-white/20 px-3 pb-1 mb-1 opacity-40 text-sm not-italic font-sans">
                1
              </div>
              <div className="text-sky-500 drop-shadow-[0_0_10px_rgba(14,165,233,0.4)]">
                {Number.isFinite(v) ? v.toFixed(0) : "∞"}
              </div>
            </div>
            <div
              className={`text-4xl pb-2 px-2 transition-colors duration-500 ${isCorrect ? "text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" : "text-slate-700 opacity-20"}`}
            >
              =
            </div>
            <div className="flex flex-col items-center">
              <div className="border-b-2 border-white/20 px-3 pb-1 mb-1 opacity-40 text-sm not-italic font-sans">
                1
              </div>
              <div className="text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.4)]">
                {Math.abs(f) < 1000 ? f.toFixed(0) : "∞"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Html>
  );
};

const Rays = ({
  u,
  h,
  f1,
  lenses,
  showLasers,
  showDispersion,
  radius = 65,
}: {
  u: number;
  h: number;
  f1: number;
  lenses: { x: number; f: number }[];
  showLasers: boolean;
  showDispersion?: boolean;
  radius?: number;
}) => {
  const objX = -u;
  const objY = h;

  // Helper to generate ray paths for a specific color channel
  const generatePaths = useCallback(
    (channelFocalScale: number, color: string) => {
      // Adjust lenses for this channel (dispersion simulation)
      // Blue refracts more -> smaller f. Red refracts less -> larger f.
      const channelLenses: TraceLens[] = lenses.map((l) => ({
        x: l.x,
        f: l.f * channelFocalScale,
        h: radius,
      }));

      const startPt = { x: objX, y: objY };

      const toVector3Path = (
        path: { x: number; y: number }[],
      ): THREE.Vector3[] => {
        return path.map((p) => new THREE.Vector3(p.x, p.y, 0));
      };

      // Ray 1: Parallel -> Focus
      // Dir: (1, 0)
      const path1 = calculateRayPath(
        startPt,
        { x: 1, y: 0 },
        channelLenses,
        1000,
      );
      const r1 = toVector3Path(path1);

      // Ray 2: Optisch Midden (Start richting (0,0) als lens 1 op 0 staat)
      // Richting: van startPt naar (0,0) -> vector (-objX, -objY)
      const dir2 = { x: -objX, y: -objY };
      const path2 = calculateRayPath(startPt, dir2, channelLenses, 1000);
      const r2 = toVector3Path(path2);

      // Ray 3: Door F (links) -> Parallel
      // F ligt op -f (als f>0, convex) or richt op F' (+f, concave)?
      // Original logic: targetX = -f1_channel
      const f1_channel = f1 * channelFocalScale;
      const targetX = -f1_channel;

      const dir3 = { x: targetX - objX, y: 0 - objY };
      const path3 = calculateRayPath(startPt, dir3, channelLenses, 1000);
      const r3 = toVector3Path(path3);

      return [
        { pts: r1, color: color },
        { pts: r2, color: color },
        { pts: r3, color: color },
      ];
    },
    [lenses, objX, objY, f1, radius],
  );

  const allRays = useMemo(() => {
    if (!showDispersion) {
      // Standard Mode (Green physics color)
      return generatePaths(1.0, COLORS.RAY_2).map(
        (r: { pts: THREE.Vector3[]; color: string }, i: number) => ({
          ...r,
          color: [COLORS.RAY_1, COLORS.RAY_2, COLORS.RAY_3][i] || COLORS.RAY_2,
        }),
      );
    } else {
      // Dispersion Mode: RGB Split
      // Red (n low, f high) -> 1.05
      // Green (n med, f normal) -> 1.0
      // Blue (n high, f low) -> 0.95
      // Blue refracts MORE => f is SMALLER. Correct?
      // f ~ (n-1). n_blue > n_red. => (n_blue-1) > (n_red-1).
      // 1/f ~ (n-1). So f ~ 1/(n-1).
      // Larger n => Smaller f.
      // So Blue (high n) => Small f. Red (low n) => Large f.
      // My code: Red 1.05 (Large f), Blue 0.95 (Small f). Correct.
      return [
        ...generatePaths(1.05, "#ff0000"), // Red
        ...generatePaths(1.0, "#00ff00"), // Green
        ...generatePaths(0.95, "#0088ff"), // Blue
      ];
    }
  }, [showDispersion, generatePaths]); // Dependencies

  if (showLasers) {
    return (
      <group>
        {allRays.map((ray: RayPath, i: number) => (
          <group key={`laser-${i}`}>
            <Line
              points={ray.pts}
              color={ray.color}
              lineWidth={showDispersion ? 3 : 5}
              opacity={showDispersion ? 0.6 : 0.8}
              transparent
              toneMapped={false}
            />
            <Line
              points={ray.pts}
              color={ray.color}
              lineWidth={showDispersion ? 8 : 15}
              opacity={0.2}
              transparent
              toneMapped={false}
            />
          </group>
        ))}
      </group>
    );
  }

  return (
    <group>
      {allRays.map((ray: RayPath, i: number) => (
        <Line
          key={i}
          points={ray.pts}
          color={ray.color}
          lineWidth={2}
          opacity={0.8}
          transparent
        />
      ))}
    </group>
  );
};

const OpticsScene = ({
  setOrbitEnabled,
}: {
  setOrbitEnabled: (enabled: boolean) => void;
}) => {
  const { state, derived, setParam } = useOpticsEngine();

  const {
    objectDistance: u,
    objectHeight: h,
    lensType,
    curvatureRadius,
    mode,
    showLasers,
    scenario,
    lens2Distance = 300,
    showGraph,
  } = state;
  const { f1, hasImage1, f2, hasImage2, image2X, isVirtual, isVirtual2 } =
    derived;

  const v1 = derived.v1; // Explicit use needed? Just use derived.v1.

  const radius = getLensRadius(scenario);

  // Prepare Lenses array for raytracer
  const lenses = useMemo(() => {
    // Basis: Lens 1 op x=0
    const list = [{ x: 0, f: f1 }];

    if (scenario === "system") {
      list.push({ x: lens2Distance, f: f2 || 100 });
    } else if (scenario === "correction") {
      // Scenario Correction:
      // Lens 1 = Bril (x=0)
      // Lens 2 = Oog (x=15)
      // Retina = 15 + eyeLength
      list.push({ x: 15, f: f2 || 50 });
    }
    return list;
  }, [f1, scenario, lens2Distance, f2]);

  // Retina Positie Bepalen
  const retinaX = useMemo(() => {
    if (scenario === "eye") return state.eyeLength || 50;
    if (scenario === "correction") return 15 + (state.eyeLength || 50);
    return null;
  }, [scenario, state.eyeLength]);

  // --- TACTILE DRAG LOGIC ---
  const draggingRef = useRef(false);

  const handleDragStart = () => {
    draggingRef.current = true;
    setOrbitEnabled(false);
  };
  const handleDragEnd = () => {
    draggingRef.current = false;
    setOrbitEnabled(true);
  };

  const onPlanePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (draggingRef.current) {
      const x = e.point.x;
      const newU = Math.max(50, Math.min(600, -x));
      setParam("objectDistance", Math.round(newU));
    }
  };

  // Calculate visualization height for images
  const h1 = h * (derived.m1 || 1);
  const h2 = h1 * (derived.m2 || 1);

  return (
    <group>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 50, 50]} intensity={1} />

      <OpticalRail />

      {/* LENS 1 (System: Lens 1, Eye: Ooglens, Correction: Bril) */}
      <group position={[0, 0, 0]}>
        <Lens
          type={lensType}
          curvatureRadius={curvatureRadius}
          mode={mode}
          refractiveIndex={state.refractiveIndex || 1.5}
          radius={radius}
        />
        <FocalPoint
          x={-Math.abs(f1)}
          label={scenario === "correction" ? "F_bril" : f1 > 0 ? "F" : "F'"}
          color={f1 > 0 ? COLORS.RAY_3 : COLORS.RAY_1}
        />
        {scenario !== "correction" && (
          <FocalPoint
            x={Math.abs(f1)}
            label={f1 > 0 ? "F'" : "F"}
            color={f1 > 0 ? COLORS.RAY_1 : COLORS.RAY_3}
          />
        )}
      </group>

      {/* LENS 2 (System Mode OR Eye in Correction Mode) */}
      {scenario === "system" && (
        <group position={[lens2Distance, 0, 0]}>
          <Lens
            type="convex"
            curvatureRadius={100}
            mode="simple"
            refractiveIndex={1.5}
            radius={radius}
          />
          <Text position={[0, radius + 5, 0]} fontSize={8} color="white">
            Lens 2
          </Text>
          <FocalPoint
            x={-Math.abs(f2 || 100)}
            label="F2"
            color={COLORS.GUIDE}
          />
          <FocalPoint
            x={Math.abs(f2 || 100)}
            label="F2'"
            color={COLORS.GUIDE}
          />
        </group>
      )}

      {/* OOG LENS (Correction Mode: Lens 2 op x=15) */}
      {scenario === "correction" && (
        <group position={[15, 0, 0]}>
          <Lens
            type="convex"
            curvatureRadius={state.eyeAccommodation || 50}
            mode="simple"
            refractiveIndex={1.336}
            radius={radius}
          />
          <Text position={[0, radius + 10, 0]} fontSize={6} color="#fb7185">
            Ooglens
          </Text>
          {/* Ooglens focal points */}
          <FocalPoint
            x={-Math.abs(f2 || 50)}
            label="F_oog"
            color={COLORS.RAY_3}
          />
        </group>
      )}

      {/* RETINA (Eye / Correction Mode) */}
      {retinaX !== null && (
        <group position={[retinaX || 0, 0, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[40, 40, 2, 32, 1, true, 0, Math.PI]} />
            <meshStandardMaterial
              color="#fb7185"
              side={THREE.DoubleSide}
              transparent
              opacity={0.4}
            />
          </mesh>
          <Text position={[0, 45, 0]} fontSize={6} color="#fb7185">
            Netvlies
          </Text>

          {/* Feedback Status */}
          <Text
            position={[0, -50, 0]}
            fontSize={8}
            color={derived.isBlurred ? "#ef4444" : "#22c55e"}
          >
            {derived.isBlurred ? "WAZIG" : "SCHERP"}
          </Text>
        </group>
      )}

      {/* DRAG PLANE */}
      <mesh
        visible={false}
        onPointerMove={onPlanePointerMove}
        onPointerUp={handleDragEnd}
        position={[0, 0, 0]}
      >
        <planeGeometry args={[2000, 2000]} />
      </mesh>

      {/* Voorwerp */}
      <ArrowObj
        position={[-u, 0, 0]}
        height={h}
        color="#fbbf24"
        label="Voorwerp"
        isDraggable={true}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      />

      {/* Beeld 1 (Altijd tonen tenzij in eye/correction mode waar het intern is) */}
      {hasImage1 &&
        Math.abs(v1) < 2000 &&
        scenario !== "eye" &&
        scenario !== "correction" && (
          <ArrowObj
            position={[v1, 0, 0]}
            height={h1}
            color={
              scenario === "system"
                ? "#94a3b8"
                : isVirtual
                  ? "#f472b6"
                  : "#38bdf8"
            }
            label={scenario === "system" ? "Beeld 1 (V2)" : "Beeld"}
            opacity={scenario === "system" ? 0.5 : isVirtual ? 0.6 : 1}
          />
        )}

      {/* Beeld 2 (System) */}
      {scenario === "system" && hasImage2 && Math.abs(image2X || 0) < 2000 && (
        <ArrowObj
          position={[image2X || 0, 0, 0]}
          height={h2}
          color={isVirtual2 ? "#f472b6" : "#38bdf8"}
          label="Eindbeeld"
          opacity={isVirtual2 ? 0.6 : 1}
        />
      )}

      {/* Beeld op Netvlies (niet echt een pijl, want het projecteert op het scherm, maar we kunnen het tekenen als debug) */}
      {(scenario === "eye" || scenario === "correction") && hasImage2 && (
        // Render niets? Of een projectie spot?
        // Laten we de stralen het werk laten doen.
        // Maar misschien wel de positie waar het scherm ZOU moeten staan voor scherp beeld (v_total)?
        // Optioneel: Ghost image waar het beeld echt valt.
        <ArrowObj
          position={[image2X || 0, 0, 0]}
          height={h2}
          color="#ffffff"
          label="Focusvlak"
          opacity={0.3}
        />
      )}

      <EquationHUD />

      {state.showRays && (
        <Rays
          u={u}
          h={h}
          f1={f1}
          lenses={lenses}
          showLasers={showLasers}
          radius={radius}
        />
      )}

      {state.showGrid && (
        <Grid
          position={[0, -2.05, 0]}
          args={[800, 200]}
          cellSize={10}
          cellThickness={0.5}
          cellColor="#1e293b"
          sectionSize={50}
          sectionThickness={1}
          sectionColor="#334155"
          fadeDistance={500}
          infiniteGrid
        />
      )}

      <Stars
        radius={200}
        depth={50}
        count={2000}
        factor={4}
        saturation={0}
        fade
        speed={1}
      />
      <ContactShadows
        resolution={512}
        scale={100}
        blur={4}
        opacity={0.5}
        far={10}
        color="#000000"
      />
      {/* HTML OVERLAY FOR GRAPHS */}
      {showGraph && (
        <Html fullscreen style={{ pointerEvents: "none" }}>
          <AnalysisGraph />
        </Html>
      )}
    </group>
  );
};

export const OpticsStage: React.FC = () => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="w-full h-full bg-[#020617] relative">
      <Canvas
        shadows
        eventSource={
          containerRef as React.RefObject<HTMLElement> as unknown as HTMLElement
        }
        dpr={[1, 2]}
        camera={{ position: [0, 40, 300], fov: 35 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <SafeOrbitControls
          ref={controlsRef}
          makeDefault
          minDistance={50}
          maxDistance={800}
          maxPolarAngle={Math.PI / 2 - 0.1}
          target={[0, 0, 0]}
        />
        <SceneStabilizer />
        <OpticsScene
          setOrbitEnabled={(enabled) => {
            if (controlsRef.current) controlsRef.current.enabled = enabled;
          }}
        />
        <Environment preset="city" />
      </Canvas>

      {/* Overlay Title & Legend */}
      <div className="absolute top-4 left-4 pointer-events-none space-y-4">
        <div>
          <h2 className="text-3xl font-black text-white italic tracking-tighter drop-shadow-2xl uppercase opacity-90">
            OPTICA <span className="text-orange-500">3D</span>
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-white font-bold border border-white/10 backdrop-blur-md">
              LENZEN
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Elite Engine
            </span>
          </div>
        </div>

        {/* Didactische Legenda */}
        <div className="bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/10 space-y-2 max-w-[200px]">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
            Constructiestralen
          </div>

          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
            <span className="text-[10px] text-white font-medium">
              Parallel &rarr; Focus
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            <span className="text-[10px] text-white font-medium">
              Optisch Midden
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
            <span className="text-[10px] text-white font-medium">
              Focus &rarr; Parallel
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
