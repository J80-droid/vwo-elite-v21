import { useCallback, useEffect, useMemo, useRef } from "react";

import { useModuleState } from "../../../hooks/usePhysicsLabContext";

export interface SpringHistoryPoint {
  t: number;
  y: number;
}

export interface SpringMetrics {
  ke: number;
  pe: number;
  te: number;
  y: number;
  v: number;
  history: SpringHistoryPoint[];
  // VWO 5/6 specific metrics
  theoreticalT: number;
  theoreticalF: number;
  phase: number;
  reducedPhase: number;
}

export interface SpringState {
  time: number;
  isPlaying: boolean;
  mass: number;
  k: number;
  damping: number;
  showGraph: boolean;
  showEnergy: boolean;
  showFormulas: boolean;
  isAnalyzing: boolean;
  panX: number;
  panY: number;
  zoom: number;
  isDragging: boolean;
  metrics: SpringMetrics;
}

const DEFAULT_STATE: SpringState = {
  time: 0,
  isPlaying: false,
  mass: 1.0,
  k: 10.0,
  damping: 0.5,
  showGraph: true,
  showEnergy: true,
  showFormulas: true,
  isAnalyzing: false,
  panX: 0,
  panY: 0,
  zoom: 1.0,
  isDragging: false,
  metrics: {
    ke: 0,
    pe: 0,
    te: 0,
    y: 1.0,
    v: 0,
    history: [],
    theoreticalT: 0,
    theoreticalF: 0,
    phase: 0,
    reducedPhase: 0,
  },
};

const SAMPLE_RATE = 0.05; // 50ms per point

export const useSpringEngine = () => {
  const [moduleState, setModuleState] = useModuleState<SpringState>("spring");

  const state = useMemo(
    () => ({
      ...DEFAULT_STATE,
      ...(moduleState || {}),
    }),
    [moduleState],
  );

  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const lastHistoryTimeRef = useRef<number>(0);
  const lastUiUpdateTimeRef = useRef<number>(0);

  // Internal physics state (Mutable ref for performance)
  const physicsRef = useRef({
    y: state.metrics.y,
    v: state.metrics.v,
    t: state.time,
    history: [...state.metrics.history],
    lastDragY: state.metrics.y,
    lastDragTime: 0,
  });

  const { isPlaying, mass, k, damping, isDragging } = state;

  // Sync Ref with State when NOT playing (to accept external resets/changes)
  useEffect(() => {
    if (!isPlaying && !isDragging) {
      physicsRef.current.y = state.metrics.y;
      // Note: We don't overwrite V here to allow momentum preservation after drag
    }
  }, [state.metrics.y, isPlaying, isDragging]);

  useEffect(() => {
    function update(ts: number) {
      if (!lastTimeRef.current) lastTimeRef.current = ts;
      const dt = Math.min((ts - lastTimeRef.current) / 1000, 0.016);
      lastTimeRef.current = ts;

      const phys = physicsRef.current;
      const safeMass = Math.max(0.01, mass);

      // 1. Physics Integration or Interaction
      if (isPlaying && !isDragging) {
        // Sub-stepping for stability (Symplectic Euler)
        const subSteps = 8;
        const sdt = dt / subSteps;

        for (let s = 0; s < subSteps; s++) {
          const force = -k * phys.y - damping * phys.v;
          const acceleration = force / safeMass;

          phys.v += acceleration * sdt;
          phys.y += phys.v * sdt;
          phys.t += sdt;
        }
      } else if (isDragging) {
        // Momentum Logic: Calculate velocity based on mouse movement
        // This allows "throwing" the mass
        const now = performance.now();
        if (now - phys.lastDragTime > 16) {
          const estimatedV = (phys.y - phys.lastDragY) / Math.max(0.001, dt);
          // Smoothing factor (0.8) to prevent jittery launches
          phys.v = estimatedV * 0.8;

          phys.lastDragY = phys.y;
          phys.lastDragTime = now;
        }
      }

      // 2. Metrics Calculation (All in SI units)
      const pe = 0.5 * k * (phys.y * phys.y);
      const ke = 0.5 * safeMass * (phys.v * phys.v);
      const te = pe + ke;

      const safeK = Math.max(0.1, k);
      const theoreticalT = 2 * Math.PI * Math.sqrt(safeMass / safeK);
      const theoreticalF = theoreticalT > 0 ? 1 / theoreticalT : 0;
      const phase = theoreticalT > 0 ? phys.t / theoreticalT : 0;
      const reducedPhase = phase % 1;

      // 3. Robust History Sampling (Memory Optimized)
      // Only create new array reference when sampling, NOT every frame.
      let currentHistory = phys.history;
      if (
        isPlaying &&
        !isDragging &&
        phys.t - lastHistoryTimeRef.current >= SAMPLE_RATE
      ) {
        currentHistory = [...phys.history, { t: phys.t, y: phys.y }];
        if (currentHistory.length > 500) currentHistory.shift();

        phys.history = currentHistory; // Update ref
        lastHistoryTimeRef.current = phys.t;
      }

      // 4. Sync to React State (Throttled to ~30fps for performance)
      const now = performance.now();
      const UI_UPDATE_INTERVAL = 32; // ~30fps

      if (
        (isPlaying || isDragging) &&
        now - lastUiUpdateTimeRef.current > UI_UPDATE_INTERVAL
      ) {
        setModuleState((prev) => ({
          ...prev,
          time: phys.t,
          metrics: {
            ke,
            pe,
            te,
            y: phys.y,
            v: phys.v,
            history: currentHistory,
            theoreticalT,
            theoreticalF,
            phase,
            reducedPhase,
          },
        }));
        lastUiUpdateTimeRef.current = now;
      }

      requestRef.current = requestAnimationFrame(update);
    }

    requestRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(requestRef.current);
  }, [isPlaying, isDragging, mass, k, damping, setModuleState]);

  const setParam = useCallback(
    (key: keyof SpringState, val: unknown) => {
      setModuleState((prev) => ({ ...(prev || DEFAULT_STATE), [key]: val }));
    },
    [setModuleState],
  );

  const reset = useCallback(() => {
    setModuleState({
      ...DEFAULT_STATE,
      isPlaying: false,
    });
    physicsRef.current = {
      y: 1.0,
      v: 0,
      t: 0,
      history: [],
      lastDragY: 1.0,
      lastDragTime: 0,
    };
    lastHistoryTimeRef.current = 0;
  }, [setModuleState]);

  const setMassPosition = useCallback(
    (y: number) => {
      // Direct physics ref update for zero-latency dragging
      physicsRef.current.y = y;

      // We do NOT reset v=0 here, to allow the loop to calculate throw-velocity.

      setModuleState((prev) => ({
        ...(prev || DEFAULT_STATE),
        metrics: {
          ...(prev?.metrics || DEFAULT_STATE.metrics),
          y,
          // v is updated by the loop via setModuleState
        },
      }));
    },
    [setModuleState],
  );

  const setDragging = useCallback(
    (dragging: boolean) => {
      if (dragging) {
        // Reset drag tracking
        physicsRef.current.lastDragY = physicsRef.current.y;
        physicsRef.current.lastDragTime = performance.now();
      }
      setModuleState((prev) => ({
        ...(prev || DEFAULT_STATE),
        isDragging: dragging,
      }));
    },
    [setModuleState],
  );

  return { state, setParam, reset, setMassPosition, setDragging };
};
