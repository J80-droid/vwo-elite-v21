/* eslint-disable unused-imports/no-unused-vars */
import { useFrame, useThree } from "@react-three/fiber";
import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";

export interface SafeOrbitControlsProps {
  makeDefault?: boolean;
  enableZoom?: boolean;
  enablePan?: boolean;
  enableRotate?: boolean;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  minDistance?: number;
  maxDistance?: number;
  minPolarAngle?: number;
  maxPolarAngle?: number;
  enableDamping?: boolean;
  dampingFactor?: number;
  target?: [number, number, number] | THREE.Vector3;
  [key: string]: unknown; // Allow all OrbitControls props
}

export const SafeOrbitControls = React.forwardRef<
  OrbitControlsImpl,
  SafeOrbitControlsProps
>(({ makeDefault, ...props }, ref) => {
  const { camera, gl, invalidate, events } = useThree();
  const controls = useRef<OrbitControlsImpl>(null);

  useEffect(() => {
    // Strict safety check for DOM element
    if (!gl?.domElement?.isConnected) return;

    let instance: OrbitControlsImpl | null = null;

    try {
      // Use the R3F event target if available, otherwise fallback to canvas
      const eventTarget =
        (gl as unknown as { xr: { enabled: boolean; isPresenting: boolean } })
          .xr?.enabled &&
        (gl as unknown as { xr: { enabled: boolean; isPresenting: boolean } })
          .xr?.isPresenting
          ? gl.domElement
          : (events.connected as HTMLElement) || gl.domElement;

      instance = new OrbitControlsImpl(camera, eventTarget);
      controls.current = instance;

      // Forward ref
      if (ref) {
        if (typeof ref === "function") ref(instance);
        else ref.current = instance;
      }

      // Initial update
      instance.update();

      // Force first frame
      invalidate();
    } catch (e) {
      console.warn(
        "[SafeOrbitControls] Failed to instantiate OrbitControls:",
        e,
      );
      return;
    }

    return () => {
      if (instance) {
        try {
          instance.dispose();
        } catch (e) {
          // Ignore disposal errors
        }
      }
      controls.current = null;
    };
  }, [camera, gl, ref, invalidate, events.connected]);

  // Apply props changes
  useEffect(() => {
    const c = controls.current;
    if (c) {
      const { target, ...otherProps } = props;

      // Apply all props except target
      Object.assign(c, otherProps);

      // Handle target explicitly to avoid overwriting Vector3 with array
      if (target) {
        if (Array.isArray(target)) {
          c.target.set(target[0], target[1], target[2]);
        } else if (target instanceof THREE.Vector3) {
          c.target.copy(target);
        }
      }

      c.update();
    }
  });

  // Handle makeDefault - removed as it causes issues with hook state access
  // The controls are functional without this feature

  // Animation frame for damping and autoRotate
  useFrame(() => {
    if (controls.current) {
      controls.current.update();
    }
  });

  return null; // This component handles controls logically, no visual output
});

SafeOrbitControls.displayName = "SafeOrbitControls";
