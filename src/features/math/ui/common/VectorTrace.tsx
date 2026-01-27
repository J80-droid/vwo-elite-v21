/* eslint-disable react-hooks/refs */
// VectorTrace - Path Tracing Component
import { Line as DreiLine } from "@react-three/drei";
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface VectorTraceProps {
  vector: { x: number; y: number; z: number } | undefined;
  active: boolean;
}

export const VectorTrace: React.FC<VectorTraceProps> = ({ vector, active }) => {
  const points = useRef<THREE.Vector3[]>([]);
  const [curve, setCurve] = useState<THREE.CatmullRomCurve3 | null>(null);
  const [, setTick] = useState(0); // Force re-render

  // Reset trace if not active
  useEffect(() => {
    if (!active) {
      points.current = [];
      setCurve(null);
    }
  }, [active]);

  // Update trace
  useEffect(() => {
    if (!active || !vector) return;

    const lastPoint = points.current[points.current.length - 1];
    const newPoint = new THREE.Vector3(vector.x, vector.y, vector.z);

    // Add point if moved significantly
    if (!lastPoint || lastPoint.distanceTo(newPoint) > 0.05) {
      points.current.push(newPoint);
      if (points.current.length > 50) points.current.shift(); // Limit history

      if (points.current.length > 1) {
        setCurve(new THREE.CatmullRomCurve3(points.current));
      }
      setTick((t) => t + 1);
    }
  }, [vector, active]);

  if (!curve || points.current.length < 2) return null;

  // Convert curve to points for Line
  const linePoints = curve.getPoints(50);
  return (
    <DreiLine points={linePoints} color="#a855f7" opacity={0.6} lineWidth={3} />
  );
};
