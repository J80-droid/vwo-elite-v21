import { useThree } from "@react-three/fiber";
import { useEffect } from "react";

/**
 * SceneStabilizer
 * Attach this component inside any Canvas to prevent crashes during WebGL context loss.
 * It strictly checks for null pointers on gl.domElement before adding event listeners.
 */
export const SceneStabilizer = () => {
  const { gl } = useThree();
  useEffect(() => {
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      console.warn("[SceneStabilizer] WebGL Context Lost detected");
    };

    // Strict null check pattern
    const dom = gl?.domElement;
    if (dom) {
      dom.addEventListener("webglcontextlost", handleContextLost);
      return () =>
        dom.removeEventListener("webglcontextlost", handleContextLost);
    }
    return undefined;
  }, [gl]);

  return null;
};
