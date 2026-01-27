/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";

/**
 * Hook that provides a delayed "ready" state for Canvas components.
 * This prevents @react-three/fiber OrbitControls "addEventListener" errors
 * by ensuring the DOM is fully ready before Canvas/OrbitControls initialize.
 *
 * @param delayMs - Delay in milliseconds (default: 150ms)
 * @returns Object with `mounted` (immediate) and `canvasReady` (delayed) states
 */
export function useCanvasReady(delayMs: number = 150) {
  const [mounted, setMounted] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => setCanvasReady(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  return { mounted, canvasReady };
}
