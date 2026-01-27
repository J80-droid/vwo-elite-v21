// VectorArrow - 3D Vector Visualization Component
import { Html, Line as DreiLine } from "@react-three/drei";
import React from "react";
import * as THREE from "three";

interface VectorArrowProps {
  start: [number, number, number];
  direction: [number, number, number];
  color: string;
  label: string;
  scale?: number;
  showValues?: boolean;
  showAngles?: boolean;
  opacity?: number;
  isGhost?: boolean;
}

export const VectorArrow: React.FC<VectorArrowProps> = ({
  start,
  direction,
  color,
  label,
  scale = 2,
  showValues = false,
  showAngles = false,
  opacity = 1,
  isGhost = false,
}) => {
  const dir = new THREE.Vector3(...direction).normalize();
  const end = new THREE.Vector3(...start).add(
    dir.clone().multiplyScalar(scale),
  );
  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

  const mag = Math.sqrt(
    direction[0] ** 2 + direction[1] ** 2 + direction[2] ** 2,
  ).toFixed(2);

  // Calculate angles (Azimuth and Elevation)
  const azimuth = (
    (Math.atan2(direction[1], direction[0]) * 180) /
    Math.PI
  ).toFixed(1);
  const elevation = (
    (Math.acos(direction[2] / (parseFloat(mag) || 1)) * 180) /
    Math.PI
  ).toFixed(1);

  return (
    <group>
      <DreiLine
        points={[start, [end.x, end.y, end.z]]}
        color={color}
        lineWidth={isGhost ? 1 : 4}
        transparent
        opacity={opacity}
      />
      <mesh position={[end.x, end.y, end.z]} quaternion={quaternion}>
        <coneGeometry args={[isGhost ? 0.08 : 0.15, isGhost ? 0.2 : 0.4, 8]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} />
      </mesh>
      {!isGhost && (
        <Html
          position={[
            end.x + dir.x * 0.5,
            end.y + dir.y * 0.5,
            end.z + dir.z * 0.5,
          ]}
          center
        >
          <div className="flex flex-col items-center gap-1 pointer-events-none select-none">
            {label && (
              <div
                className="bg-black/90 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest whitespace-nowrap font-space backdrop-blur-md shadow-xl"
                style={{ color, borderColor: color }}
              >
                {label}
              </div>
            )}
            {(showValues || showAngles) && (
              <div className="bg-black/80 px-2 py-1 rounded-md border border-white/10 text-[9px] font-mono text-white/80 tabular-nums flex flex-col gap-0.5">
                {showValues && (
                  <div>
                    |{label}| = {mag}
                  </div>
                )}
                {showAngles && (
                  <div className="text-[8px] opacity-70">
                    Az: {azimuth}° | El: {elevation}°
                  </div>
                )}
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};
