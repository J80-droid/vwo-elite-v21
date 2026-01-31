/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Architecture Settings - 3D Codebase Visualization
 *
 * An immersive 3D exploration of VWO Elite's architecture.
 * Users can fly through the codebase like "Alice in Wonderland".
 */

import {
  Float,
  OrbitControls,
  PerspectiveCamera,
  Stars,
  Text,
} from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useAIStatusStore } from "@shared/model/aiStatusStore";
import { MeshViewer } from "@shared/ui/components/MeshViewer";
import { AnimatePresence, motion } from "framer-motion";
import {
  Boxes,
  ChevronRight,
  Database,
  Eye,
  EyeOff,
  FolderOpen,
  Hexagon,
  Info,
  Layers,
  LayoutGrid,
  Share2,
  X,
  Zap,
} from "lucide-react";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";

import {
  ARCHITECTURE_DATA,
  ArchNode,
  CONNECTIONS as STATIC_CONNECTIONS,
} from "./data";
import LIVE_DATA_RAW from "./live-data.json";

// Type assertion for live data
const LIVE_DATA = LIVE_DATA_RAW as { nodes: any[]; connections: any[] };

// ----------------------------------------------------------------------------
// UTILS & HOOKS
// ----------------------------------------------------------------------------

function useKeys() {
  const keys = useRef<Record<string, boolean>>({});
  useEffect(() => {
    const hDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
    };
    const hUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };
    window.addEventListener("keydown", hDown);
    window.addEventListener("keyup", hUp);
    return () => {
      window.removeEventListener("keydown", hDown);
      window.removeEventListener("keyup", hUp);
    };
  }, []);
  return keys;
}

// ============================================================================
// 3D COMPONENTS
// ============================================================================

function ArchitectureNode({
  node,
  onClick,
  isSelected,
  isHovered,
  onHover,
  aiStatus,
}: {
  node: ArchNode;
  onClick: () => void;
  isSelected: boolean;
  isHovered: boolean;
  onHover: (hover: boolean) => void;
  aiStatus: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const fileCount = node.files?.length || 0;
  const complexityScale = 1 + fileCount * 0.05; // Heatmap: larger nodes for more files
  const scale = (isSelected ? 1.3 : isHovered ? 1.15 : 1) * complexityScale;

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      // Active pulse for API layer during AI activity
      if (node.id === "api" && aiStatus !== "idle") {
        const pulse = 1 + Math.sin(time * 10) * 0.1;
        meshRef.current.scale.set(scale * pulse, scale * pulse, scale * pulse);
      }
    }
  });

  // Size based on type - INCREASED for foundation layers
  const sizes: Record<string, [number, number, number]> = {
    feature: [1.2, 0.8, 0.8],
    shared: [3, 1, 1], // Major Foundation Blocks
    api: [2.5, 0.9, 0.9], // Gateway Block
    lib: [1.3, 0.6, 0.6],
    type: [1.3, 0.6, 0.6],
    component: [1.4, 0.6, 0.6],
  };

  return (
    <group
      position={node.position}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={() => onHover(true)}
      onPointerOut={() => onHover(false)}
    >
      <Float
        speed={1.5}
        rotationIntensity={isHovered ? 0.3 : 0.1}
        floatIntensity={isHovered ? 0.5 : 0.2}
      >
        {/* Main Neon Core - Constant brightness approach */}
        <mesh ref={meshRef} scale={scale}>
          <boxGeometry args={sizes[node.type] || [1, 0.6, 0.6]} />
          <meshStandardMaterial
            color={node.color}
            emissive={node.color}
            emissiveIntensity={0.6}
            roughness={0.2}
            metalness={0.8}
            transparent
            opacity={0.9}
          />
        </mesh>

        {/* Outer Glow Shell (Neon Aura) */}
        <mesh scale={scale * 1.3}>
          <boxGeometry args={sizes[node.type] || [1, 0.6, 0.6]} />
          <meshBasicMaterial
            color={node.color}
            transparent
            opacity={isHovered ? 0.3 : 0.15}
            side={THREE.BackSide}
            toneMapped={false}
          />
        </mesh>

        {/* Integrated Label (Razor Sharp) */}
        <Text
          position={[0, 0.8, 0]}
          fontSize={0.25}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.015}
          outlineColor="#000000"
          fillOpacity={1} // Full opacity for sharpness
        >
          {node.name.toUpperCase()}
        </Text>
      </Float>
    </group>
  );
}

// --- ELEVATOR NAVIGATION ---
const ELEVATOR_LEVELS = [
  { id: "feature", y: 10, label: "Sky City (Features)", color: "#3b82f6" },
  { id: "api", y: 5, label: "The Bridge (API)", color: "#f43f5e" },
  { id: "component", y: 2, label: "Midtown (Components)", color: "#64748b" },
  { id: "lib", y: -4, label: "Industrial (Libs/Types)", color: "#a855f7" },
  { id: "shared", y: -8, label: "The Core (Shared)", color: "#eab308" },
  { id: "overview", y: 0, label: "Command Center", color: "#6366f1" },
];

function CameraRig({
  targetLevel,
  controlsRef,
}: {
  targetLevel: number | null;
  controlsRef: any;
}) {
  useFrame((state, delta) => {
    if (targetLevel !== null && controlsRef.current) {
      // Smoothly interpolate the camera target Y to the level height
      // We only move the TARGET, the camera naturally follows if in orbit
      const currentY = controlsRef.current.target.y;
      const step = (targetLevel - currentY) * 5 * delta;

      // Also gently drift the camera height to keep perspective
      if (Math.abs(step) > 0.01) {
        controlsRef.current.target.y += step;
        state.camera.position.y += step * 0.8; // Parallax effect
      }
    }
  });
  return null;
}

function ElevatorPanel({
  activeLevel,
  onChange,
}: {
  activeLevel: number | null;
  onChange: (y: number) => void;
}) {
  return (
    <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-40 pointer-events-auto">
      <div className="text-[10px] text-zinc-500 font-mono text-center mb-2 tracking-widest writing-vertical-rl">
        LIFT CONTROL
      </div>
      {ELEVATOR_LEVELS.map((level) => {
        const isActive = activeLevel === level.y;
        return (
          <button
            key={level.id}
            onClick={() => onChange(level.y)}
            className={`
                            relative group flex items-center justify-end
                        `}
          >
            {/* Label tooltip (left) */}
            <div
              className={`
                            absolute right-8 px-2 py-1 bg-black/80 text-white text-[10px] font-mono rounded whitespace-nowrap
                            transition-all duration-300
                            ${isActive ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"}
                        `}
            >
              {level.label}
            </div>

            {/* Button Pip */}
            <div
              className={`
                            w-3 h-3 rounded-full border border-white/20 transition-all duration-300
                            ${isActive ? "scale-125" : "bg-zinc-800 hover:bg-zinc-600"}
                        `}
              style={{
                backgroundColor: isActive ? level.color : undefined,
                boxShadow: isActive ? `0 0 15px ${level.color}` : undefined,
              }}
            />
          </button>
        );
      })}
    </div>
  );
}

function PilotControls() {
  const keys = useKeys();

  useFrame((state) => {
    const k = keys.current;
    const speed = 0.2;
    const rotSpeed = 0.02;

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(
      state.camera.quaternion,
    );
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(
      state.camera.quaternion,
    );
    const up = new THREE.Vector3(0, 1, 0);

    if (k["KeyW"]) state.camera.position.addScaledVector(forward, speed);
    if (k["KeyS"]) state.camera.position.addScaledVector(forward, -speed);
    if (k["KeyA"]) state.camera.position.addScaledVector(right, -speed);
    if (k["KeyD"]) state.camera.position.addScaledVector(right, speed);
    if (k["KeyQ"]) state.camera.position.addScaledVector(up, speed);
    if (k["KeyE"]) state.camera.position.addScaledVector(up, -speed);

    if (k["ArrowLeft"]) state.camera.rotation.y += rotSpeed;
    if (k["ArrowRight"]) state.camera.rotation.y -= rotSpeed;
    if (k["ArrowUp"]) state.camera.rotation.x += rotSpeed;
    if (k["ArrowDown"]) state.camera.rotation.x -= rotSpeed;
  });
  return null;
}

function Scene3D({
  onNodeSelect,
  selectedNode,
  visibleLayers,
  isPilotMode,
  targetLevel = null,
  useLiveData = false,
}: {
  onNodeSelect: (node: ArchNode | null) => void;
  selectedNode: ArchNode | null;
  visibleLayers: Set<string>;
  isPilotMode: boolean;
  targetLevel?: number | null;
  useLiveData?: boolean;
}) {
  const aiStatus = useAIStatusStore((state) => state.status);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const controlsRef = useRef<any>(null);

  // switch data source
  const activeData = useMemo(() => {
    if (!useLiveData) return ARCHITECTURE_DATA;

    // Merge Live Data with Static Colors/Metadata
    return LIVE_DATA.nodes.map((liveNode: any) => {
      const staticNode = ARCHITECTURE_DATA.find((n) => n.id === liveNode.id);
      return {
        ...liveNode,
        color: staticNode?.color || liveNode.color, // Prefer static color -> fallback to scan color
        description: staticNode?.description || liveNode.description,
      };
    });
  }, [useLiveData]);

  const activeConnections: [string, string][] = useLiveData
    ? (LIVE_DATA.connections as [string, string][])
    : STATIC_CONNECTIONS;

  // --- ELITE ORBITAL LAYOUT ENGINE ---
  const processedNodes = useMemo(() => {
    // 1. Group nodes by type
    const groups: Record<string, any[]> = {}; // Use any to allow partial live nodes
    activeData.forEach((node) => {
      const types = ["feature", "shared", "api", "component", "lib"];
      const type = types.includes(node.type) ? node.type : "component"; // Fallback
      if (!groups[type]) groups[type] = [];
      groups[type].push(node);
    });

    const newNodes: any[] = [];

    // 2. Define Layout Rules
    const RULES: Record<
      string,
      { y: number; radius: number; startAngle: number }
    > = {
      feature: { y: 10, radius: 25, startAngle: 0 }, // Outer Ring (Heaven)
      api: { y: 5, radius: 0, startAngle: 0 }, // Central Spire (Gateway)
      component: { y: 2, radius: 15, startAngle: Math.PI / 4 }, // Inner Ring
      lib: { y: -2, radius: 15, startAngle: Math.PI / 2 },
      type: { y: -5, radius: 10, startAngle: 0 },
      shared: { y: -8, radius: 6, startAngle: 0 }, // Core (Foundation)
    };

    // 3. Calculate Positions
    Object.keys(groups).forEach((type) => {
      const nodes = groups[type];
      if (!nodes) return;
      const rule = RULES[type] || { y: 0, radius: 10, startAngle: 0 };
      const count = nodes.length;

      nodes.forEach((node, index) => {
        let x = 0,
          z = 0;

        if (rule.radius === 0) {
          // Center
          x = 0;
          z = 0;
        } else {
          // Circle
          const angle = rule.startAngle + (index / count) * Math.PI * 2;
          x = Math.cos(angle) * rule.radius;
          z = Math.sin(angle) * rule.radius;
        }

        newNodes.push({
          ...node,
          originalPosition: node.position, // Keep for reference if needed
          position: [x, rule.y, z] as [number, number, number],
        });
      });
    });

    // Filter visibility
    return newNodes.filter((n) => visibleLayers.has(n.type));
  }, [visibleLayers, activeData]);

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[40, 20, 40]}
        fov={35}
        onUpdate={(c) => c.lookAt(0, 0, 0)}
      />
      {!isPilotMode ? (
        <OrbitControls
          ref={controlsRef}
          autoRotate
          autoRotateSpeed={0.5}
          enableDamping
          dampingFactor={0.05}
          minDistance={10}
          maxDistance={250} // Massive Zoom Out
          maxPolarAngle={Math.PI / 1.5} // Allow looking up from below a bit more
        />
      ) : (
        <PilotControls />
      )}

      {/* Elevator Logic */}
      <CameraRig targetLevel={targetLevel ?? null} controlsRef={controlsRef} />

      {/* Cinematic Lighting */}
      <ambientLight intensity={0.5} />
      <pointLight position={[0, 50, 0]} intensity={2} color="#ffffff" />
      <pointLight position={[50, 0, 50]} intensity={1} color="#6366f1" />
      <pointLight position={[-50, 0, -50]} intensity={1} color="#ec4899" />

      {/* Background */}
      <Stars
        radius={300}
        depth={50}
        count={5000}
        factor={4}
        saturation={0}
        fade
        speed={1}
      />

      {/* Visual Layer Platforms (Holographic Discs) */}
      <LayerPlatforms />

      {/* Data Lasers (Straight & Clean) */}
      <LaserBeams nodes={processedNodes} connections={activeConnections} />

      {/* Architecture Nodes (Cubes) */}
      {processedNodes.map((node) => (
        <ArchitectureNode
          key={node.id}
          node={node}
          onClick={() =>
            onNodeSelect(selectedNode?.id === node.id ? null : node)
          }
          isSelected={selectedNode?.id === node.id}
          isHovered={hoveredNode === node.id}
          onHover={(hover) => setHoveredNode(hover ? node.id : null)}
          aiStatus={aiStatus}
        />
      ))}

      {/* Floor Grid */}
      <gridHelper
        args={[100, 100, "#334155", "#0f172a"]}
        position={[0, -20, 0]}
      />
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.8} // Only bloom the brightest emissive points
          mipmapBlur
          intensity={0.4} // Subtle, sharp glow
          radius={0.2} // Tight glow
        />
        {/* Removed ChromaticAberration and Noise for maximum sharpness */}
      </EffectComposer>
    </>
  );
}

// ============================================================================
// ELITE COMPONENTS (V3)
// ============================================================================

function LayerPlatforms() {
  const layers = [
    { y: 10, color: "#3b82f6", label: "FEATURES LAYER" },
    { y: 5, color: "#f43f5e", label: "API GATEWAY" },
    { y: 2, color: "#64748b", label: "COMPONENTS" },
    { y: -2, color: "#a855f7", label: "LIBRARIES" },
    { y: -8, color: "#eab308", label: "DATA CORE" },
  ];

  return (
    <group>
      {layers.map((layer, i) => (
        <group key={i} position={[0, layer.y - 0.5, 0]}>
          {/* Glass Disc */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0, 40, 64]} />
            <meshBasicMaterial
              color={layer.color}
              transparent
              opacity={0.03}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          {/* Rim */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[39.8, 40, 64]} />
            <meshBasicMaterial
              color={layer.color}
              transparent
              opacity={0.3}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Label */}
          <Text
            position={[42, 0, 0]}
            rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
            fontSize={1}
            color={layer.color}
            anchorX="center"
            anchorY="middle"
            fillOpacity={0.6}
          >
            {layer.label}
          </Text>
        </group>
      ))}
    </group>
  );
}

function LaserBeams({
  nodes,
  connections,
}: {
  nodes: ArchNode[];
  connections: [string, string][];
}) {
  const allPoints = useMemo(() => {
    const getNodePos = (id: string): THREE.Vector3 => {
      const node = nodes.find((n) => n.id === id);
      return node ? new THREE.Vector3(...node.position) : new THREE.Vector3();
    };

    const pairs: THREE.Vector3[] = [];
    connections.forEach(([from, to]) => {
      const start = getNodePos(from);
      const end = getNodePos(to);
      // Ignore if start/end are 0,0,0 (filtered out nodes)
      if (start.lengthSq() === 0 || end.lengthSq() === 0) return;
      pairs.push(start);
      pairs.push(end);
    });
    return pairs;
  }, [nodes, connections]);

  return (
    <lineSegments>
      <bufferGeometry
        attach="geometry"
        onUpdate={(self) => self.setFromPoints(allPoints)}
      />
      <lineBasicMaterial
        attach="material"
        color="#00FFFF"
        opacity={0.15}
        transparent
        linewidth={1}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </lineSegments>
  );
}

const LAYER_TYPES = [
  { id: "feature", label: "Features", color: "#3b82f6", icon: LayoutGrid },
  { id: "api", label: "API Layer", color: "#f43f5e", icon: Zap },
  { id: "lib", label: "Libraries", color: "#a855f7", icon: Share2 },
  { id: "type", label: "Types", color: "#14b8a6", icon: Hexagon },
  { id: "shared", label: "Stores", color: "#eab308", icon: Database },
  { id: "component", label: "Components", color: "#64748b", icon: Layers },
];

function Legend({
  visibleLayers,
  onToggleLayer,
}: {
  visibleLayers: Set<string>;
  onToggleLayer: (layer: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute top-4 left-4 bg-zinc-950/80 backdrop-blur-xl border border-white/10 rounded-xl p-4 z-10"
    >
      <div className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
        <Info size={14} className="text-indigo-400" />
        Legenda
      </div>
      <div className="space-y-2">
        {LAYER_TYPES.map((layer) => {
          const isVisible = visibleLayers.has(layer.id);
          return (
            <button
              key={layer.id}
              onClick={() => onToggleLayer(layer.id)}
              className={`flex items-center gap-3 w-full p-2 rounded-lg transition-all ${isVisible
                ? "bg-white/10 text-white"
                : "text-slate-500 hover:text-slate-300"
                }`}
            >
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: isVisible ? layer.color : "#475569" }}
              />
              <span className="text-xs font-medium flex-1 text-left">
                {layer.label}
              </span>
              {isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

function NodeDetails({
  node,
  onClose,
  onOpenFile,
}: {
  node: ArchNode;
  onClose: () => void;
  onOpenFile: (file: string) => void;
}) {
  // Mapping node types/ids to potential 3D models
  const modelUrl = useMemo(() => {
    if (node.type === "feature") return "models/architecture/feature_module.glb";
    if (node.type === "shared") return "models/architecture/core_engine.glb";
    if (node.id === "api") return "models/architecture/gateway_spire.glb";
    return null;
  }, [node]);

  // CALCULATE REAL COMPLEXITY METRICS
  const metrics = useMemo(() => {
    const fileCount = node.files?.length || 0;
    const estimatedLoC = fileCount * 120; // Heuristic based on project average
    const complexityScore = (fileCount * 0.5) + (estimatedLoC * 0.01);

    return {
      fileCount,
      estimatedLoC,
      complexityScore: Math.min(100, complexityScore).toFixed(1)
    };
  }, [node]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      className="absolute top-4 right-4 w-80 bg-zinc-950/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
    >
      {/* Header */}
      <div
        className="px-4 py-3 border-b border-white/5 flex items-center justify-between shrink-0"
        style={{ backgroundColor: `${node.color}20` }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: node.color }}
          />
          <span className="font-bold text-white">{node.name}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Spatial Preview (DATA DRIVEN) */}
      {modelUrl && (
        <div className="h-40 w-full bg-black/40 border-b border-white/5 relative group">
          <MeshViewer url={modelUrl} autoRotate shadows={false} />

          {/* Complexity HUD Overlay */}
          <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
            <div className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">Density Index</div>
            <div className="text-xl font-black text-white font-mono leading-none">{metrics.complexityScore}%</div>
          </div>

          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="px-1.5 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/40 text-[8px] text-indigo-300 font-black uppercase">
              Spatial Preview // Real Data
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-6 overflow-y-auto custom-scrollbar">
        {/* Real Metrics Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 bg-white/5 border border-white/5 rounded-xl">
            <div className="text-[8px] text-zinc-600 font-bold uppercase mb-1">Source Count</div>
            <div className="text-xs font-mono text-white">{metrics.fileCount} Files</div>
          </div>
          <div className="p-2 bg-white/5 border border-white/5 rounded-xl">
            <div className="text-[8px] text-zinc-600 font-bold uppercase mb-1">Estimated LoC</div>
            <div className="text-xs font-mono text-white">~{metrics.estimatedLoC.toLocaleString()} lines</div>
          </div>
        </div>
        {/* Description */}
        <div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
            Beschrijving
          </div>
          <p className="text-sm text-slate-300">{node.description}</p>
        </div>

        {/* Type Badge */}
        <div className="flex items-center gap-2">
          <span
            className="px-2 py-1 rounded text-[10px] font-bold uppercase"
            style={{ backgroundColor: `${node.color}30`, color: node.color }}
          >
            {node.type}
          </span>
        </div>

        {/* Files */}
        {node.files && node.files.length > 0 && (
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <FolderOpen size={12} />
              Bestanden
            </div>
            <div className="space-y-1 overflow-y-auto pr-1">
              {node.files.map((file, i) => (
                <div
                  key={i}
                  onClick={() => onOpenFile(file)}
                  className="group flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/0 hover:border-white/10 hover:bg-white/10 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-zinc-300 text-xs font-mono">
                    <ChevronRight
                      size={12}
                      className="text-zinc-600 group-hover:text-indigo-500 transition-colors"
                    />
                    {file}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 text-[8px] text-indigo-400 font-bold uppercase tracking-tighter">
                    Open Viewer
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function LoadingOverlay() {
  return (
    <div className="absolute inset-0 bg-zinc-950 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-4"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 mx-auto border-2 border-indigo-500/30 border-t-indigo-500 rounded-full"
        />
        <div className="text-white font-bold">INITIALISEREN...</div>
        <div className="text-slate-500 text-xs">
          3D Architectuur wordt geladen
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ArchitectureSettings() {
  const [selectedNode, setSelectedNode] = useState<ArchNode | null>(null);
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(
    new Set(LAYER_TYPES.map((l) => l.id)),
  );
  const [isPilotMode, setIsPilotMode] = useState(false);
  const [useLiveData, setUseLiveData] = useState(true); // Default to Real Data
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [elevatorLevel, setElevatorLevel] = useState<number | null>(null);

  // ... (rest of component)
  const containerRef = useRef<HTMLDivElement>(null);

  const handleToggleLayer = useCallback((layerId: string) => {
    setVisibleLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layerId)) {
        next.delete(layerId);
      } else {
        next.add(layerId);
      }
      return next;
    });
  }, []);

  const handleOpenFile = useCallback((file: string) => {
    setSelectedFile(file);
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-zinc-950">
      {/* Immersive Overlay Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-6 left-1/2 -translate-x-1/2 z-20 text-center pointer-events-none"
      >
        <div className="px-6 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full inline-block shadow-2xl pointer-events-auto">
          <h2 className="text-lg font-black text-white tracking-[0.2em] uppercase flex items-center gap-3">
            <Boxes className="text-indigo-500" size={20} /> Systeemarchitectuur
          </h2>
        </div>
        <div className="flex items-center justify-center gap-4 mt-2">
          <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
            VWO_ELITE_CORE // VISUAL_ENGINE_V2.0
          </p>
          <button
            onClick={() => setIsPilotMode(!isPilotMode)}
            className={`
                            px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all pointer-events-auto shadow-2xl
                            ${isPilotMode
                ? "bg-indigo-500 border-indigo-400 text-white animate-pulse"
                : "bg-black/40 border-white/10 text-zinc-400 hover:border-white/20"
              }
                        `}
          >
            {isPilotMode ? "🚀 PILOT: ACTIVE" : "🖱️ ORBIT MODE"}
          </button>
        </div>
      </motion.div>

      {/* 3D Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 z-0">
        {/* Mode Toggle */}
        <div className="absolute top-24 right-8 z-50 flex gap-2">
          <button
            onClick={() => setUseLiveData(!useLiveData)}
            className={`px-3 py-1 rounded-full text-xs font-bold border ${useLiveData ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" : "bg-zinc-800 border-zinc-700 text-zinc-500"}`}
          >
            {useLiveData ? "LIVE SCAN: ACTIVE" : "BLUEPRINT MODE"}
          </button>
        </div>

        <Suspense fallback={<LoadingOverlay />}>
          <Canvas gl={{ antialias: true, alpha: true }} dpr={[1, 2]}>
            <Scene3D
              onNodeSelect={setSelectedNode}
              selectedNode={selectedNode}
              visibleLayers={visibleLayers}
              isPilotMode={isPilotMode}
              useLiveData={useLiveData}
              targetLevel={elevatorLevel}
            />
          </Canvas>
        </Suspense>

        {/* Elevator Panel */}
        <ElevatorPanel
          activeLevel={elevatorLevel}
          onChange={setElevatorLevel}
        />

        {/* Legend */}
        <Legend
          visibleLayers={visibleLayers}
          onToggleLayer={handleToggleLayer}
        />

        {/* Node Details Panel */}
        <AnimatePresence>
          {selectedNode && (
            <NodeDetails
              node={selectedNode}
              onClose={() => setSelectedNode(null)}
              onOpenFile={handleOpenFile}
            />
          )}
        </AnimatePresence>

        {/* Code Viewer Overlay */}
        <AnimatePresence>
          {selectedFile && (
            <CodeViewerOverlay
              filename={selectedFile}
              onClose={() => setSelectedFile(null)}
            />
          )}
        </AnimatePresence>
      </div>
      {/* Radar Mini-map */}
      <MiniMap
        nodes={ARCHITECTURE_DATA.filter((n) => visibleLayers.has(n.type))}
        selectedNode={selectedNode}
      />
    </div>
  );
}
const ALL_FILES = import.meta.glob("/src/**/*.{ts,tsx}", {
  query: "?raw",
  import: "default",
});

function CodeViewerOverlay({
  filename,
  onClose,
}: {
  filename: string;
  onClose: () => void;
}) {
  const [fileContent, setFileContent] = useState<string>(
    "Loading elite source data...",
  );
  // const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFile = async () => {
      try {
        // Filename from data.ts is already an absolute-ish path from src
        // e.g. "src/features/math/ui/MathLabStage.tsx"
        // We need to ensure it starts with / for the glob match
        const normalizedPath = filename.startsWith("/")
          ? filename
          : `/${filename}`;

        if (ALL_FILES[normalizedPath]) {
          const content = await (
            ALL_FILES[normalizedPath] as () => Promise<string>
          )();
          setFileContent(content);
        } else {
          // Try to find by basename as fallback for older entries
          const basenameMatch = Object.keys(ALL_FILES).find((k) =>
            k.endsWith(filename),
          );
          if (basenameMatch) {
            const content = await (
              ALL_FILES[basenameMatch] as () => Promise<string>
            )();
            setFileContent(content);
          } else {
            // Keep error state for potential UI feedback
            const msg = `Module not found: ${filename}`;
            // setError(msg);
            console.warn(msg);
            setFileContent(
              `// Error: File ${filename} not found in live index.\n\n/**\n * Fallback data generated.\n */\n\nexport const placeholder = true;`,
            );
          }
        }
      } catch (err) {
        console.error("Failed to load file:", err);
        // setError("Elite access denied or file corrupted.");
        setFileContent("// Access Denied: File corrupted or unreadable.");
      }
    };

    loadFile();
  }, [filename]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className="absolute inset-x-8 bottom-8 top-1/4 z-30 flex flex-col bg-zinc-950/95 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
    >
      {/* Toolbar */}
      <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-500/50" />
            <div className="w-3 h-3 rounded-full bg-amber-500/50" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
          </div>
          <div className="h-4 w-[1px] bg-white/10" />
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <Boxes size={14} className="text-indigo-400" />
            <span>vwo-elite-src / {filename}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl hover:bg-white/10 text-zinc-500 hover:text-white transition-all"
        >
          <X size={18} />
        </button>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-auto p-8 font-mono text-sm custom-scrollbar">
        <div className="flex gap-6">
          {/* Line Numbers */}
          <div className="text-zinc-700 text-right select-none pr-4 border-r border-white/5">
            {Array.from({ length: fileContent.split("\n").length }).map(
              (_, i) => (
                <div key={i}>{i + 1}</div>
              ),
            )}
          </div>
          {/* Code Content */}
          <pre className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
            {fileContent}
          </pre>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-2 border-t border-white/5 bg-black/40 flex justify-between items-center text-[10px] text-zinc-600 font-mono">
        <div>UTF-8 // TypeScript</div>
        <div className="flex gap-4">
          <span>LN {fileContent.split("\n").length}, COL 1</span>
          <span className="text-indigo-500 font-black">ELITE_VIEWER v1.0</span>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// MINI-MAP COMPONENT
// ============================================================================

function MiniMap({
  nodes,
  selectedNode,
}: {
  nodes: ArchNode[];
  selectedNode: ArchNode | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, x: 20 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      className="absolute bottom-6 right-6 z-20 p-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
    >
      <div className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5 px-1 truncate">
        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
        Neural Radar
      </div>
      <div className="relative w-28 h-28 border border-white/5 bg-zinc-950/50 rounded-xl overflow-hidden">
        <svg
          width="112"
          height="112"
          viewBox="-12 -12 24 24"
          className="w-full h-full opacity-80"
        >
          {/* Radial Grid */}
          <circle
            cx="0"
            cy="0"
            r="10"
            stroke="white"
            strokeOpacity="0.03"
            fill="none"
            strokeWidth="0.1"
          />
          <circle
            cx="0"
            cy="0"
            r="6"
            stroke="white"
            strokeOpacity="0.03"
            fill="none"
            strokeWidth="0.1"
          />
          <line
            x1="-12"
            y1="0"
            x2="12"
            y2="0"
            stroke="white"
            strokeOpacity="0.05"
            strokeWidth="0.1"
          />
          <line
            x1="0"
            y1="-12"
            x2="0"
            y2="12"
            stroke="white"
            strokeOpacity="0.05"
            strokeWidth="0.1"
          />

          {/* Nodes */}
          {nodes.map((node) => (
            <circle
              key={node.id}
              cx={node.position[0] * 1}
              cy={node.position[2] * 1}
              r={selectedNode?.id === node.id ? 1 : 0.5}
              fill={node.color}
              fillOpacity={selectedNode?.id === node.id ? 1 : 0.6}
              className="transition-all duration-300"
            >
              <title>{node.name}</title>
            </circle>
          ))}

          {/* Scanning Sweep */}
          <motion.rect
            animate={{ y: [-12, 12] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            x="-12"
            y="-0.1"
            width="24"
            height="0.2"
            fill="indigo"
            fillOpacity="0.2"
          />
        </svg>
      </div>
    </motion.div>
  );
}
