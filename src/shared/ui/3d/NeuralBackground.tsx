import { Canvas, useFrame } from "@react-three/fiber";
import React, { useMemo, useRef } from "react";
import * as THREE from "three";

const generateParticles = (count: number) => {
    const pts = [];
    for (let i = 0; i < count; i++) {
        pts.push(
            new THREE.Vector3(
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20,
            ),
        );
    }
    return pts;
};

const ConnectionLine = ({
    start,
    end,
}: {
    start: THREE.Vector3;
    end: THREE.Vector3;
}) => {
    const line = useMemo(() => {
        const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
        const material = new THREE.LineBasicMaterial({
            color: "#6366f1",
            transparent: true,
            opacity: 0.1,
        });
        return new THREE.Line(geometry, material);
    }, [start, end]);

    return <primitive object={line} />;
};

const ConnectionLines = ({ count = 50 }) => {
    const linesRef = useRef<THREE.Group>(null);
    const particles = useMemo(() => generateParticles(count), [count]);

    useFrame((state) => {
        if (linesRef.current) {
            linesRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
            linesRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.03) * 0.1;
        }
    });

    return (
        <group ref={linesRef}>
            {particles.map((p, i) => (
                <group key={i}>
                    <mesh position={p}>
                        <sphereGeometry args={[0.03, 8, 8]} />
                        <meshBasicMaterial color="#6366f1" transparent opacity={0.4} />
                    </mesh>
                    {particles.slice(i + 1, i + 3).map((p2, j) => (
                        <ConnectionLine key={`${i}-${j}`} start={p} end={p2} />
                    ))}
                </group>
            ))}
        </group>
    );
};

export const NeuralBackground: React.FC = () => {
    return (
        <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
            <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
                <ambientLight intensity={0.2} />
                <ConnectionLines count={80} />
            </Canvas>
        </div>
    );
};
