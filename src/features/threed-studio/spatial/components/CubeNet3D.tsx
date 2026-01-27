import { Center } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

interface NetPoint {
  x: number;
  y: number;
}

interface FaceNode {
  x: number;
  y: number;
  parentDir?: "left" | "right" | "top" | "bottom";
  children: { node: FaceNode; dir: "left" | "right" | "top" | "bottom" }[];
}

export const CubeNet3D = ({
  net,
  isFolding,
  color = "#4ADE80",
  scale = 1,
}: {
  net: NetPoint[];
  isFolding: boolean;
  color?: string;
  scale?: number;
}) => {
  const tree = useMemo(() => {
    if (!net || net.length === 0) return null;

    const base = net[0];
    const nodes: FaceNode[] = net.map((p) => ({
      x: p.x,
      y: p.y,
      children: [],
    }));
    const baseNode = nodes.find((n) => n.x === base!.x && n.y === base!.y)!;

    const visited = new Set<string>();
    visited.add(base!.x + "," + base!.y);
    const queue: FaceNode[] = [baseNode];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const ds = [
        { dx: 1, dy: 0, dir: "right" as const },
        { dx: -1, dy: 0, dir: "left" as const },
        { dx: 0, dy: 1, dir: "bottom" as const },
        { dx: 0, dy: -1, dir: "top" as const },
      ];

      for (const { dx, dy, dir } of ds) {
        const nx = current.x + dx;
        const ny = current.y + dy;
        const found = nodes.find((n) => n.x === nx && n.y === ny);
        if (found && !visited.has(nx + "," + ny)) {
          visited.add(nx + "," + ny);
          found.parentDir =
            dir === "right"
              ? "left"
              : dir === "left"
                ? "right"
                : dir === "top"
                  ? "bottom"
                  : "top";
          current.children.push({ node: found, dir });
          queue.push(found);
        }
      }
    }
    return baseNode;
  }, [net]);

  if (!tree) return null;

  return (
    <group scale={scale}>
      <Center>
        <Face node={tree} isFolding={isFolding} color={color} level={0} />
      </Center>
    </group>
  );
};

const Face = ({
  node,
  isFolding,
  color,
  level,
}: {
  node: FaceNode;
  isFolding: boolean;
  color: string;
  level: number;
}) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!groupRef.current || level === 0) return;

    const speed = 7;
    const cycle = isFolding
      ? Math.sin(state.clock.elapsedTime * 2.5) * 0.5 + 0.5
      : 0;
    const foldAmount = cycle * (Math.PI / 2);

    let target = 0;
    switch (node.parentDir) {
      case "left":
        target = foldAmount;
        groupRef.current.rotation.y +=
          (target - groupRef.current.rotation.y) * speed * delta;
        break;
      case "right":
        target = -foldAmount;
        groupRef.current.rotation.y +=
          (target - groupRef.current.rotation.y) * speed * delta;
        break;
      case "top":
        target = foldAmount;
        groupRef.current.rotation.x +=
          (target - groupRef.current.rotation.x) * speed * delta;
        break;
      case "bottom":
        target = -foldAmount;
        groupRef.current.rotation.x +=
          (target - groupRef.current.rotation.x) * speed * delta;
        break;
    }
  });

  const meshPos: [number, number, number] = [
    node.parentDir === "left" ? 0.5 : node.parentDir === "right" ? -0.5 : 0,
    node.parentDir === "top" ? -0.5 : node.parentDir === "bottom" ? 0.5 : 0,
    0,
  ];

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <mesh position={meshPos}>
        <boxGeometry args={[0.98, 0.98, 0.05]} />
        <meshStandardMaterial color={color} transparent opacity={0.7} />
        <mesh position={[0, 0, 0.03]}>
          <planeGeometry args={[0.8, 0.8]} />
          <meshBasicMaterial color={color} transparent opacity={0.2} />
        </mesh>
      </mesh>

      <group position={meshPos}>
        {node.children.map((child, i) => {
          const hingePos: [number, number, number] = [
            child.dir === "right" ? 0.5 : child.dir === "left" ? -0.5 : 0,
            child.dir === "top" ? 0.5 : child.dir === "bottom" ? -0.5 : 0,
            0,
          ];
          return (
            <group key={i} position={hingePos}>
              <Face
                node={child.node}
                isFolding={isFolding}
                color={color}
                level={level + 1}
              />
            </group>
          );
        })}
      </group>
    </group>
  );
};
