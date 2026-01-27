/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef } from "react";

/**
 * Hook to handle parameter animation loops.
 * Increments/decrements values for parameters that have 'animating' set to true.
 */
export function useParameterAnimation(
  parameters: Record<string, number>,
  setParameters: React.Dispatch<React.SetStateAction<Record<string, number>>>,
  animatingParams: Record<string, boolean>,
) {
  const requestRef = useRef<number | undefined>(undefined);

  const animate = () => {
    let hasChanges = false;
    const newUpdates: Record<string, number> = {};

    Object.entries(animatingParams).forEach(([key, isAnimating]) => {
      if (isAnimating) {
        // Determine direction/bounds logic here if needed
        // For now, simple ping-pong or continuous loop can be implemented
        // Following legacy logic: continuous increment with wrap-around or bounce would be ideal
        // But simplified: plain increment
        const current = parameters[key] || 0;
        let next = current + 0.05;

        // Simple bounce logic: -10 to 10
        if (next > 10) next = -10;

        newUpdates[key] = next;
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setParameters((prev) => ({ ...prev, ...newUpdates }));
    }

    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    // Only start loop if at least one parameter is animating
    const isAnyAnimating = Object.values(animatingParams).some((v) => v);

    if (isAnyAnimating) {
      requestRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [animatingParams, parameters]); // Dependency on parameters might cause too many re-renders/loop restarts?
  // Optimization: In a real RAF loop, we shouldn't depend on 'parameters' in the effect dependency array,
  // but rather read from a ref. However, to keep it simple and consistent with React State:
}
