import { useCallback, useEffect, useRef } from "react";

import { useModuleState } from "../../../hooks/usePhysicsLabContext";

export interface MechanicsState {
  time: number;
  angle: number; // degrees
  mass: number; // kg
  mu: number; // friction coeff
  g: number; // gravity
  pos: number; // position on ramp (meters)
  vel: number; // velocity (m/s)
  isPlaying: boolean;
}

const DEFAULT_STATE: MechanicsState = {
  time: 0,
  angle: 30,
  mass: 5,
  mu: 0.1,
  g: 9.81,
  pos: 0,
  vel: 0,
  isPlaying: false,
};

export const useMechanicsEngine = () => {
  // Use the specific module hook
  const [moduleState, setModuleState] =
    useModuleState<MechanicsState>("mechanics");

  // Ensure state is initialized (merge default with current)
  // If moduleState is undefined or empty, we fallback to defaults
  const currentModuleState = moduleState || {};
  const state: MechanicsState = { ...DEFAULT_STATE, ...currentModuleState };

  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const updateRef = useRef<((ts: number) => void) | undefined>(undefined);

  // Init state if missing
  useEffect(() => {
    // If the state looks uninitialized (missing 'mass'), set defaults
    if (typeof currentModuleState.mass === "undefined") {
      setModuleState(DEFAULT_STATE);
    }
  }, [currentModuleState.mass, setModuleState]);

  const reset = useCallback(() => {
    // We use the functional update to ensure we keep any other state if needed,
    // though here we reset valid physics props.
    setModuleState((s: MechanicsState) => ({
      ...s,
      time: 0,
      pos: 0,
      vel: 0,
      isPlaying: false,
    }));
  }, [setModuleState]);

  useEffect(() => {
    updateRef.current = (ts: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = ts;
      const dt = Math.min((ts - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = ts;

      if (state.isPlaying) {
        setModuleState((s: MechanicsState) => {
          // Always ensure we have a valid state object to work with
          const current = { ...DEFAULT_STATE, ...s };
          if (!current.isPlaying) return current;

          const rad = current.angle * (Math.PI / 180);
          const Fg = current.mass * current.g;
          const F_parallel = Fg * Math.sin(rad);
          const F_perp = Fg * Math.cos(rad);
          const F_friction = current.mu * F_perp;
          const F_net = Math.max(0, F_parallel - F_friction);
          const acc = F_net / current.mass;
          const newVel = current.vel + acc * dt;
          const newPos = current.pos + newVel * dt;

          if (newPos > 10) {
            return { ...current, pos: 10, vel: newVel, isPlaying: false };
          }

          return {
            ...current,
            time: current.time + dt,
            vel: newVel,
            pos: newPos,
          };
        });
      }

      requestRef.current = requestAnimationFrame((t) => updateRef.current?.(t));
    };
  }, [state.isPlaying, setModuleState]);

  // Animation Loop
  useEffect(() => {
    requestRef.current = requestAnimationFrame((t) => updateRef.current?.(t));
    return () => cancelAnimationFrame(requestRef.current!);
  }, []);

  const setParam = (key: keyof MechanicsState, val: number | boolean) => {
    setModuleState((s: MechanicsState) => ({ ...s, [key]: val }));
  };

  return { state, setParam, reset };
};
