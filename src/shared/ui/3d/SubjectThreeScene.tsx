import { Float, MeshDistortMaterial, MeshWobbleMaterial, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import React, { useMemo, useRef } from "react";
import * as THREE from "three";

interface SubjectModelProps {
    subjectId: string;
}

const DNAHelix = () => {
    const groupRef = useRef<THREE.Group>(null);
    const count = 20;

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.5;
        }
    });

    const spheres = useMemo(() => {
        const items = [];
        for (let i = 0; i < count; i++) {
            const y = (i - count / 2) * 0.4;
            const angle = i * 0.5;
            const x1 = Math.cos(angle) * 1.5;
            const z1 = Math.sin(angle) * 1.5;
            const x2 = Math.cos(angle + Math.PI) * 1.5;
            const z2 = Math.sin(angle + Math.PI) * 1.5;
            items.push({
                pos1: [x1, y, z1] as [number, number, number],
                pos2: [x2, y, z2] as [number, number, number],
                id: i
            });
        }
        return items;
    }, []);

    return (
        <group ref={groupRef}>
            {spheres.map((s) => (
                <group key={s.id}>
                    <mesh position={s.pos1}>
                        <sphereGeometry args={[0.15, 16, 16]} />
                        <meshStandardMaterial color="#6366f1" emissive="#6366f1" emissiveIntensity={0.5} />
                    </mesh>
                    <mesh position={s.pos2}>
                        <sphereGeometry args={[0.15, 16, 16]} />
                        <meshStandardMaterial color="#ec4899" emissive="#ec4899" emissiveIntensity={0.5} />
                    </mesh>
                    <mesh rotation={[0, 0, Math.atan2((s.pos2[1] - s.pos1[1]), (s.pos2[0] - s.pos1[0]))]} position={[(s.pos1[0] + s.pos2[0]) / 2, s.pos1[1], (s.pos1[2] + s.pos2[2]) / 2]}>
                        {/* Simple bar connecting the spheres */}
                        <boxGeometry args={[3, 0.05, 0.05]} />
                        <meshStandardMaterial color="white" opacity={0.3} transparent />
                    </mesh>
                </group>
            ))}
        </group>
    );
};

const AtomModel = () => {
    const groupRef = useRef<THREE.Group>(null);
    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
            groupRef.current.rotation.z = state.clock.getElapsedTime() * 0.2;
        }
    });

    return (
        <group ref={groupRef}>
            <mesh>
                <sphereGeometry args={[0.6, 32, 32]} />
                <MeshDistortMaterial color="#fbbf24" speed={2} distort={0.3} />
            </mesh>
            {[0, 1, 2].map((i) => (
                <group key={i} rotation={[0, 0, (i * Math.PI) / 3]}>
                    <mesh>
                        <torusGeometry args={[1.5, 0.02, 16, 100]} />
                        <meshBasicMaterial color="#6366f1" opacity={0.5} transparent />
                    </mesh>
                    <Float speed={5} rotationIntensity={0} floatIntensity={0}>
                        <mesh position={[1.5, 0, 0]}>
                            <sphereGeometry args={[0.08, 16, 16]} />
                            <meshStandardMaterial color="#6366f1" emissive="#6366f1" />
                        </mesh>
                    </Float>
                </group>
            ))}
        </group>
    );
};

const MathGeometry = () => {
    return (
        <Float speed={2} rotationIntensity={1} floatIntensity={1}>
            <mesh>
                <octahedronGeometry args={[1.2, 0]} />
                <meshStandardMaterial wireframe color="#0ea5e9" />
            </mesh>
            <mesh scale={0.8}>
                <octahedronGeometry args={[1.2, 0]} />
                <meshStandardMaterial color="#0ea5e9" opacity={0.2} transparent />
            </mesh>
        </Float>
    );
};

const DefaultModel = () => (
    <Float speed={3} rotationIntensity={2} floatIntensity={2}>
        <mesh>
            <torusKnotGeometry args={[0.8, 0.3, 128, 32]} />
            <MeshWobbleMaterial color="#8b5cf6" speed={1} factor={0.6} />
        </mesh>
    </Float>
);

const SubjectModel: React.FC<SubjectModelProps> = ({ subjectId }) => {
    const id = subjectId.toLowerCase();

    // Mapping for Elite Subjects (IDs 1-10 or Legacy Names)
    if (id.includes("bio") || id === "biologie" || id === "9") return <DNAHelix />;
    if (id.includes("chem") || id === "scheikunde" || id === "3" || id.includes("phi") || id === "8" || id.includes("nat") || id === "2") return <AtomModel />;
    if (id.includes("math") || id === "1" || id.includes("inf") || id === "10" || id.includes("econ") || id === "97") return <MathGeometry />;
    if (id.includes("hist") || id === "hist" || id.includes("psy")) return <AtomModel />;

    return <DefaultModel />;
};

export const SubjectThreeScene: React.FC<{ subjectId: string; className?: string }> = ({ subjectId, className }) => {
    return (
        <div className={`w-full h-full min-h-[300px] ${className}`}>
            <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
                <React.Suspense fallback={null}>
                    <SubjectModel subjectId={subjectId} />
                    <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
                </React.Suspense>
            </Canvas>
        </div>
    );
};
