/* eslint-disable react-hooks/purity */
import { SafeOrbitControls, SceneStabilizer } from "@features/threed-studio";
import { Html } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { getUniversityStudiesSQL } from "@shared/api/sqliteService";
import { Study } from "@shared/api/studyDatabaseService";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";

// --- Types ---
interface Node extends Study {
  position: [number, number, number];
  color: string;
}

interface Edge {
  source: [number, number, number];
  target: [number, number, number];
}

// --- Helper: Generate 3D Positions ---
const generateGraph = (studies: Study[]) => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  if (!studies || studies.length === 0) return { nodes, edges };

  // Group by primary sector for clustering
  const sectors = Array.from(new Set(studies.flatMap((s) => s.sectors)));

  studies.forEach((study, i) => {
    // Random position within a sphere, clustered by sector angle
    const primarySector = study.sectors[0] || "";
    const sectorIndex = sectors.indexOf(primarySector);
    const phi = Math.acos(-1 + (2 * i) / studies.length);
    const theta = Math.sqrt(studies.length * Math.PI) * phi;

    // Add some noise/clustering based on sector
    const clusterAngle = (sectorIndex / sectors.length) * Math.PI * 2;
    const radius = 10 + Math.random() * 5;

    const x = radius * Math.cos(theta + clusterAngle) * Math.sin(phi);
    const y = radius * Math.sin(theta + clusterAngle) * Math.sin(phi);
    const z = radius * Math.cos(phi);

    // Color based on profile/sector
    let color = "#ffffff";
    if (study.profiles.includes("NT")) color = "#34d399"; // Emerald
    if (study.profiles.includes("NG")) color = "#22d3ee"; // Cyan
    if (study.profiles.includes("EM")) color = "#f472b6"; // Pink
    if (study.profiles.includes("CM")) color = "#fbbf24"; // Amber

    nodes.push({ ...study, position: [x, y, z], color });
  });

  // Create edges between similar studies (same sector)
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const overlap = nodes[i]!.sectors.filter((s) =>
        nodes[j]!.sectors.includes(s),
      );
      if (overlap.length > 0) {
        // Only draw edge if close enough or meaningful overlap
        if (Math.random() > 0.7) {
          // Don't draw ALL edges to avoid mess
          edges.push({
            source: nodes[i]!.position,
            target: nodes[j]!.position,
          });
        }
      }
    }
  }

  return { nodes, edges };
};

// --- Components ---

const NetworkNode = ({
  node,
  onSelect,
}: {
  node: Node;
  onSelect: (id: string) => void;
}) => {
  const [hovered, setHovered] = useState(false);
  const ref = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.01;
      if (hovered) {
        ref.current.scale.lerp(new THREE.Vector3(1.5, 1.5, 1.5), 0.1);
      } else {
        ref.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
      }
    }
  });

  return (
    <group position={node.position}>
      {/* Node Mesh */}
      <mesh
        ref={ref}
        onClick={() => onSelect(node.id)}
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
          setHovered(true);
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
          setHovered(false);
        }}
      >
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial
          color={node.color}
          emissive={node.color}
          emissiveIntensity={hovered ? 0.8 : 0.2}
          roughness={0.1}
        />
      </mesh>

      {/* Label (Always visible or on hover) */}
      <Html distanceFactor={15}>
        <div
          className={`pointer-events-none select-none px-2 py-1 rounded bg-black/50 backdrop-blur-sm border border-white/10 text-xs text-white whitespace-nowrap transition-opacity ${hovered ? "opacity-100" : "opacity-40"}`}
        >
          {node.name}
        </div>
      </Html>
    </group>
  );
};

const Connections = ({ edges }: { edges: Edge[] }) => {
  // We use a LineSegments for better performance
  // But for simplicity in R3F, we can just map simple lines or use a dedicated Line component
  // Let's use simple lines for now.

  return (
    <group>
      {edges.map((edge, i) => (
        <line key={i}>
          <bufferGeometry>
            <float32BufferAttribute
              attach="attributes-position"
              args={[new Float32Array([...edge.source, ...edge.target]), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#ffffff" transparent opacity={0.1} />
        </line>
      ))}
    </group>
  );
};

export const StudyUniverse: React.FC = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [studies, setStudies] = useState<Study[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await getUniversityStudiesSQL();
      setStudies(data);
    };
    load();
  }, []);

  const data = useMemo(() => generateGraph(studies), [studies]);

  const handleNodeSelect = (id: string) => {
    console.log("Selected:", id);
    // Navigate to Study Explorer with filter or detail?
    // For now, let's just go to the explorer, ideally focusing the study.
    navigate("/research/career/explorer");
  };

  return (
    <div ref={containerRef} className="w-full h-screen bg-black relative">
      <div className="absolute top-24 left-8 z-10 pointer-events-none">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
          Study Universe
        </h1>
        <p className="text-slate-400 max-w-md mt-2">
          Verken de connecties tussen studies in een 3D netwerk. Dichter bij
          elkaar = meer overlap in vakgebied.
        </p>
        <div className="mt-4 flex gap-4 text-xs font-bold font-mono">
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-400"></div> NT
            (Natuur & Techniek)
          </span>
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-400"></div> NG (Natuur
            & Gezondheid)
          </span>
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-pink-400"></div> EM
            (Economie)
          </span>
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-400"></div> CM
            (Cultuur)
          </span>
        </div>
      </div>

      <Canvas
        eventSource={
          containerRef as React.RefObject<HTMLElement> as unknown as HTMLElement
        }
        camera={{ position: [0, 0, 30], fov: 60 }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <SceneStabilizer />
        <SafeOrbitControls autoRotate autoRotateSpeed={0.5} enablePan={false} />

        <group>
          {data.nodes.map((node) => (
            <NetworkNode
              key={node.id}
              node={node}
              onSelect={handleNodeSelect}
            />
          ))}
          <Connections edges={data.edges} />
        </group>

        {/* Stars/Background particles */}
        <Particles />
      </Canvas>
    </div>
  );
};

const Particles = () => {
  const positions = useMemo(() => {
    return new Float32Array(
      Array.from({ length: 1500 }, () => (Math.random() - 0.5) * 100),
    );
  }, []);

  return (
    <points>
      <bufferGeometry>
        <float32BufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial size={0.1} color="#ffffff" transparent opacity={0.5} />
    </points>
  );
};
