// PhysicsBall - F=ma Physics Integration Component
import { useFrame } from "@react-three/fiber";
import React, { useRef } from "react";
import * as THREE from "three";

interface PhysicsBallProps {
  force: { x: number; y: number; z: number };
  active: boolean;
}

export const PhysicsBall: React.FC<PhysicsBallProps> = ({ force, active }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const pos = useRef(new THREE.Vector3(0, 0, 0));
  const vel = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((_state, delta) => {
    if (!active || !meshRef.current) {
      pos.current.set(0, 0, 0);
      vel.current.set(0, 0, 0);
      if (meshRef.current) meshRef.current.position.set(0, 0, 0);
      return;
    }

    // Acceleration = Force (assuming mass = 1)
    const acc = new THREE.Vector3(force.x, force.y, force.z).multiplyScalar(
      0.1,
    );

    // Semi-implicit Euler integration
    vel.current.add(acc.multiplyScalar(delta));
    // Add simple damping/friction
    vel.current.multiplyScalar(0.99);
    pos.current.add(vel.current.clone().multiplyScalar(delta * 10));

    // Bounce off invisible walls
    const limit = 5;
    if (Math.abs(pos.current.x) > limit) {
      pos.current.x = Math.sign(pos.current.x) * limit;
      vel.current.x *= -0.7;
    }
    if (Math.abs(pos.current.y) > limit) {
      pos.current.y = Math.sign(pos.current.y) * limit;
      vel.current.y *= -0.7;
    }
    if (Math.abs(pos.current.z) > limit) {
      pos.current.z = Math.sign(pos.current.z) * limit;
      vel.current.z *= -0.7;
    }

    meshRef.current.position.copy(pos.current);
  });

  if (!active) return null;

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.3, 32, 32]} />
      <meshBasicMaterial color="#f87171" />
      <pointLight intensity={1} distance={5} color="#f87171" />
    </mesh>
  );
};
