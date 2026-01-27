import { useEffect, useRef } from "react";

import { useModuleState } from "../../../hooks/usePhysicsLabContext";

export interface Source {
  x: number; // 0.0 to 1.0 (relative)
  y: number; // 0.0 to 1.0 (relative)
  phase: number;
  active: boolean;
}

export interface InterferenceState {
  time: number;
  isPlaying: boolean;
  frequency: number; // Hz
  wavelength: number; // Relative units
  amplitude: number;

  source1: Source;
  source2: Source;

  // Config
  resolution: number; // 1 = full, 2 = half
  showNodalLines: boolean;
  mode: "instant" | "averaged";

  detector: {
    x: number;
    y: number;
    active: boolean;
  };

  // Viewport
  zoom: number;
  panX: number;
  panY: number;
}

const DEFAULT_STATE: InterferenceState = {
  time: 0,
  isPlaying: true,
  frequency: 1.0,
  wavelength: 0.15, // 15% of screen width
  amplitude: 1.0,

  source1: { x: 0.35, y: 0.5, phase: 0, active: true },
  source2: { x: 0.65, y: 0.5, phase: 0, active: true },

  resolution: 2, // Default to 0.5x resolution for performance on mid-range devices
  showNodalLines: false,
  mode: "instant",

  detector: { x: 0.5, y: 0.8, active: false },

  zoom: 1.0,
  panX: 0,
  panY: 0,
};

export const useInterferenceEngine = () => {
  const [moduleState, setModuleState] =
    useModuleState<InterferenceState>("interference");

  // Merge defaults
  const state: InterferenceState = {
    ...DEFAULT_STATE,
    ...moduleState,
    source1: { ...DEFAULT_STATE.source1, ...(moduleState?.source1 || {}) },
    source2: { ...DEFAULT_STATE.source2, ...(moduleState?.source2 || {}) },
    detector: { ...DEFAULT_STATE.detector, ...(moduleState?.detector || {}) },
  };

  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Animation Loop (update time)
  useEffect(() => {
    const animate = (time: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = time;
      const delta = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      if (state.isPlaying) {
        setModuleState((prev) => ({
          ...prev,
          time: (prev?.time || 0) + delta,
        }));
      }
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [state.isPlaying, setModuleState]);

  // Helper setters
  const setParam = (key: keyof InterferenceState, value: unknown) => {
    setModuleState((prev) => ({ ...prev, [key]: value }));
  };

  const setSourceParam = (
    source: "source1" | "source2",
    key: keyof Source,
    value: number | boolean,
  ) => {
    setModuleState((prev) => ({
      ...prev,
      [source]: { ...prev[source], [key]: value },
    }));
  };

  const setDetectorParam = (
    key: keyof typeof DEFAULT_STATE.detector,
    value: number | boolean,
  ) => {
    setModuleState((prev) => ({
      ...prev,
      detector: { ...(prev.detector || DEFAULT_STATE.detector), [key]: value },
    }));
  };

  const reset = () => {
    setModuleState(DEFAULT_STATE);
  };

  return {
    state,
    setParam,
    setSourceParam,
    setDetectorParam,
    reset,
  };
};
