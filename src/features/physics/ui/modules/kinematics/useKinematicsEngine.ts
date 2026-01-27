import { useCallback, useEffect, useRef } from "react";

import { useModuleState } from "../../../hooks/usePhysicsLabContext";

export interface MotionSegment {
  id: string;
  duration: number; // Duration of this segment in seconds
  a: number; // Acceleration for this segment
}

export interface KinematicsState {
  time: number;
  x0: number; // Initial Position
  v0: number; // Initial Velocity

  // Multi-phase Motion
  segments: MotionSegment[];
  activeSegmentIndex: number;

  // Computed Values
  x: number;
  v: number;
  a: number; // Current instantaneous acceleration

  isPlaying: boolean;

  // Elite Features
  showVectors: boolean;
  ghostMode: boolean;
  previousHistory?: DataPoint[]; // Store last run for ghost mode
}

export interface DataPoint {
  t: number;
  x: number;
  v: number;
  a: number;
}

const DEFAULT_SEGMENTS: MotionSegment[] = [
  { id: "1", duration: 5, a: 2 }, // Initial default: 5s accelerate
  { id: "2", duration: 5, a: 0 }, // Then 5s constant
];

const DEFAULT_STATE: KinematicsState = {
  time: 0,
  x0: 0,
  v0: 0,
  segments: DEFAULT_SEGMENTS,
  activeSegmentIndex: 0,
  x: 0,
  v: 0,
  a: 0,
  isPlaying: false,
  showVectors: true,
  ghostMode: false,
  previousHistory: [],
};

export const useKinematicsEngine = () => {
  // Shared State
  const [moduleState, setModuleState] =
    useModuleState<KinematicsState>("kinematics");

  // Safely derive current state
  const currentModuleState = moduleState || {};
  const state: KinematicsState = { ...DEFAULT_STATE, ...currentModuleState };

  // Ensure segments exist if loading from old state
  if (!state.segments || state.segments.length === 0) {
    state.segments = DEFAULT_SEGMENTS;
  }

  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const updateRef = useRef<((ts: number) => void) | undefined>(undefined);

  // History Buffer for Graphs
  const historyRef = useRef<DataPoint[]>([]);

  // Initialization
  useEffect(() => {
    if (typeof currentModuleState.x0 === "undefined") {
      setModuleState(DEFAULT_STATE);
    }
  }, [currentModuleState.x0, setModuleState]);

  const reset = useCallback(() => {
    setModuleState((s: KinematicsState) => {
      // If ghost mode is enabled, save the current run before resetting
      let prev = s.previousHistory || [];
      if (s.ghostMode && historyRef.current.length > 0) {
        prev = [...historyRef.current];
      }

      return {
        ...s,
        time: 0,
        x: s.x0,
        v: s.v0,
        a: s.segments?.[0]?.a || 0,
        activeSegmentIndex: 0,
        isPlaying: false,
        previousHistory: prev,
      };
    });
    historyRef.current = []; // Clear history
  }, [setModuleState]);

  // Update Input Params
  // Extended to handle Segments update
  const setParam = (
    key: keyof KinematicsState,
    val: number | boolean | DataPoint[] | MotionSegment[],
  ) => {
    setModuleState((s: KinematicsState) => {
      const newState = { ...s, [key]: val };
      if (s.time === 0) {
        if (key === "x0") newState.x = val as number;
        if (key === "v0") newState.v = val as number;
      }
      return newState as KinematicsState;
    });
  };

  // Physics Loop (Multi-phase)
  useEffect(() => {
    updateRef.current = (ts: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = ts;
      const dt = Math.min((ts - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = ts;

      if (state.isPlaying) {
        setModuleState((s: KinematicsState) => {
          const current = { ...DEFAULT_STATE, ...s };
          if (!current.isPlaying) return current;

          const newTime = current.time + dt;

          // Multi-phase Calculation
          let timeRemaining = newTime;
          let currentX = current.x0;
          let currentV = current.v0;
          let currentA = 0;
          let activeIndex = 0;

          // Iterate through segments
          const segs = current.segments || DEFAULT_SEGMENTS;

          for (let i = 0; i < segs.length; i++) {
            const seg = segs[i];
            if (!seg) continue;
            activeIndex = i;
            currentA = seg.a;

            if (timeRemaining <= seg.duration) {
              // Inside this segment
              const t = timeRemaining;
              currentX += currentV * t + 0.5 * seg.a * t * t;
              currentV += seg.a * t;
              timeRemaining = 0;
              break;
            } else {
              // Completed this segment
              const t = seg.duration;
              currentX += currentV * t + 0.5 * seg.a * t * t;
              currentV += seg.a * t;
              timeRemaining -= seg.duration;
            }
          }

          // If time remains after all segments, coast/stop logic
          if (timeRemaining > 0) {
            currentA = 0;
            // Let's assume we maintain velocity (Newton's 1st Law) - infinite coasting
            const t = timeRemaining;
            currentX += currentV * t;
          }

          const newDataPoint = {
            t: newTime,
            x: currentX,
            v: currentV,
            a: currentA,
          };

          // Update History
          if (historyRef.current.length > 1000) {
            historyRef.current.shift();
          }
          historyRef.current.push(newDataPoint);

          // Max distance check
          if (currentX > 2000) {
            return { ...current, x: 2000, isPlaying: false };
          }

          return {
            ...current,
            time: newTime,
            x: currentX,
            v: currentV,
            a: currentA,
            activeSegmentIndex: activeIndex,
          };
        });
      }

      requestRef.current = requestAnimationFrame((t) => updateRef.current?.(t));
    };
  }, [state.isPlaying, setModuleState]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame((t) => updateRef.current?.(t));
    return () => cancelAnimationFrame(requestRef.current!);
  }, []);

  return { state, setParam, reset, history: historyRef };
};
