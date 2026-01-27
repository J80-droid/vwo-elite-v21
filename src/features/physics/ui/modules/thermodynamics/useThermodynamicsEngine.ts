import { useCallback, useEffect, useRef } from "react";

import { useModuleState } from "../../../hooks/usePhysicsLabContext";

export interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
}

export interface ThermodynamicsState {
  // Ideal Gas Law: PV = nRT
  P: number; // Pressure
  V: number; // Volume (represented by piston height)
  T: number; // Temperature (affects particle speed)
  n: number; // Number of particles

  targetT: number; // Set temperature (heat source)
  targetV: number; // Set volume (piston target)

  // Process Modes
  processMode: "isothermal" | "adiabatic";
  simMode: "ideal_gas" | "hydrogen" | "wind_turbine";

  isPlaying: boolean;
  showParticles: boolean;
  showGasGlow: boolean;

  // Computed / Visual
  pistonY: number;
  containerWidth: number;
  containerHeight: number;
  containerDepth: number;
}

const DEFAULT_STATE: ThermodynamicsState = {
  P: 101.325, // kPa
  V: 1.0,
  T: 300, // Kelvin
  n: 100,

  targetT: 300,
  targetV: 1.0,

  processMode: "isothermal",
  simMode: "ideal_gas",

  isPlaying: false,
  showParticles: true,
  showGasGlow: true,

  pistonY: 5,
  containerWidth: 6,
  containerHeight: 10,
  containerDepth: 6,
};

// Physics Constants
const R_CONST = 8.314;
const THERMAL_CONDUCTIVITY = 0.05;
const PISTON_SPEED = 0.1;
const PV_SCALE_FACTOR = 200; // Calibrated for visible kPa/L units in UI

export const useThermodynamicsEngine = () => {
  const [moduleState, setModuleState] =
    useModuleState<ThermodynamicsState>("thermodynamics");
  const state: ThermodynamicsState = {
    ...DEFAULT_STATE,
    ...(moduleState || {}),
  };

  const particlesRef = useRef<Particle[]>([]);
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const updateRef = useRef<((ts: number) => void) | undefined>(undefined);
  const historyRef = useRef<{ t: number; P: number; V: number; T: number }[]>(
    [],
  );
  const physicsRef = useRef({
    T: state.T,
    V: state.V,
    P: state.P,
    lastUpdate: 0,
  });
  const pistonYRef = useRef(state.pistonY);

  // Sync ref when state changes externally (e.g. sliders)
  useEffect(() => {
    physicsRef.current.V = state.V;
    physicsRef.current.T = state.T;
    physicsRef.current.P = state.P;
    pistonYRef.current = state.pistonY;
  }, [
    state.simMode,
    state.processMode,
    state.V,
    state.T,
    state.P,
    state.pistonY,
  ]);

  // Initialize Particles
  useEffect(() => {
    if (particlesRef.current.length !== state.n) {
      const initialParticles: Particle[] = [];
      const speedBase = state.simMode === "hydrogen" ? 0.4 : 0.2;
      const safeV = isNaN(state.V) ? 1.0 : state.V;

      for (let i = 0; i < state.n; i++) {
        initialParticles.push({
          x: (Math.random() - 0.5) * state.containerWidth,
          y: Math.random() * (state.containerHeight * safeV * 0.5),
          z: (Math.random() - 0.5) * state.containerDepth,
          vx: (Math.random() - 0.5) * speedBase,
          vy: (Math.random() - 0.5) * speedBase,
          vz: (Math.random() - 0.5) * speedBase,
        });
      }
      particlesRef.current = initialParticles;
    }
  }, [
    state.n,
    state.simMode,
    state.containerWidth,
    state.containerDepth,
    state.containerHeight,
    state.V,
  ]);

  const reset = useCallback(() => {
    setModuleState(DEFAULT_STATE);
    historyRef.current = [];
    particlesRef.current = []; // Force re-init
    physicsRef.current = {
      T: DEFAULT_STATE.T,
      V: DEFAULT_STATE.V,
      P: DEFAULT_STATE.P,
      lastUpdate: 0,
    };
    pistonYRef.current = DEFAULT_STATE.pistonY;
  }, [setModuleState]);

  const setParam = useCallback(
    <K extends keyof ThermodynamicsState>(
      key: K,
      val: ThermodynamicsState[K],
    ) => {
      setModuleState((s: ThermodynamicsState | undefined) => ({
        ...(s || DEFAULT_STATE),
        [key]: val,
      }));
    },
    [setModuleState],
  );

  const clearHistory = useCallback(() => {
    historyRef.current = [];
  }, []);

  // Physics Loop
  useEffect(() => {
    updateRef.current = (ts: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = ts;
      const dt = Math.min((ts - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = ts;

      if (state.isPlaying) {
        const currentP = physicsRef.current;

        // 1. Calculate Volume step
        const vDiff = state.targetV - currentP.V;
        const dV = vDiff * PISTON_SPEED * dt * 60; // Standardized to 60fps
        const prevV = currentP.V;
        const nextV = currentP.V + dV;

        // Wind turbine mode fixes volume
        const finalV = state.simMode === "wind_turbine" ? 1.0 : nextV;
        const nextPistonY = finalV * state.containerHeight;

        // 2. Temperature Logic
        let nextT = currentP.T;
        const isAdiabatic = state.processMode === "adiabatic";

        if (state.processMode === "isothermal") {
          // Strictly match targetT (smoothing for visual stability)
          nextT += (state.targetT - nextT) * 0.1;
        } else {
          if (isAdiabatic) {
            // Poisson Relation: T2 = T1 * (V1/V2)^(gamma-1)
            // Gamma ≈ 1.4 for air (diatomic gas)
            if (Math.abs(dV) > 0.0001 && finalV > 0) {
              nextT = currentP.T * Math.pow(prevV / finalV, 0.4);
            }
          } else {
            // "Realistic" mode: Work based + Conduction
            const workFactor = -1 * (currentP.P || 100) * dV * 0.2;
            const dT_conduction =
              (state.targetT - nextT) * THERMAL_CONDUCTIVITY * dt * 10;
            nextT +=
              (isNaN(dT_conduction) ? 0 : dT_conduction) +
              (isNaN(workFactor) ? 0 : workFactor);
          }
        }

        // Scenario: Wind Turbine Energy Extraction
        if (state.simMode === "wind_turbine") {
          const rotationSpeed = (nextT / 300) * 2;
          // Extract energy: cooling proportional to work done by gas on turbine
          nextT -= rotationSpeed * 0.05 * dt;
        }

        // Protect absolute zero and extreme heat
        if (isNaN(nextT)) nextT = state.targetT || 300;
        nextT = Math.max(10, Math.min(3000, nextT));

        // 3. Ideal Gas Law: P = nRT / (V * Scale)
        const nextP =
          (state.n * R_CONST * nextT) / (finalV * PV_SCALE_FACTOR || 1);

        // Update Ref
        currentP.T = nextT;
        currentP.V = finalV;
        currentP.P = nextP;

        // 4. Update Particles
        const speedScale =
          Math.sqrt(nextT / 300) * (state.simMode === "hydrogen" ? 2.5 : 2.0);
        const halfW = state.containerWidth / 2;
        const halfD = state.containerDepth / 2;

        particlesRef.current.forEach((p) => {
          p.x += p.vx * dt * speedScale * 10;
          p.y += p.vy * dt * speedScale * 10;
          p.z += p.vz * dt * speedScale * 10;

          // Collisions
          if (Math.abs(p.x) > halfW) {
            p.vx *= -1;
            p.x = Math.sign(p.x) * halfW;
          }
          if (Math.abs(p.z) > halfD) {
            p.vz *= -1;
            p.z = Math.sign(p.z) * halfD;
          }
          if (p.y < 0) {
            p.vy *= -1;
            p.y = 0;
          }
          if (p.y > nextPistonY) {
            p.vy *= -1;
            p.y = nextPistonY;
          }

          if (state.simMode === "wind_turbine") {
            const distSq = p.x * p.x + p.z * p.z;
            if (
              distSq < 1 &&
              Math.abs(p.y - state.containerHeight * 0.5 + 2) < 2
            ) {
              p.vx *= -1;
              p.vz *= -1;
            }
          }
        });

        // 5. Throttled UI Update & History
        const now = Date.now();
        if (now - currentP.lastUpdate > 100) {
          currentP.lastUpdate = now;
          pistonYRef.current = nextPistonY;
          setModuleState((s) => ({
            ...(s || DEFAULT_STATE),
            T: nextT,
            V: finalV,
            P: nextP,
            pistonY: nextPistonY,
          }));

          // Update History
          if (
            !historyRef.current.length ||
            now - historyRef.current[historyRef.current.length - 1]!.t > 100
          ) {
            if (historyRef.current.length > 500) historyRef.current.shift();
            historyRef.current.push({ t: now, P: nextP, V: finalV, T: nextT });
          }
        }
      }
      requestRef.current = requestAnimationFrame((t) => updateRef.current?.(t));
    };
  }, [
    state.isPlaying,
    state.targetT,
    state.targetV,
    state.simMode,
    state.processMode,
    setModuleState,
    state.n,
    state.containerHeight,
    state.containerWidth,
    state.containerDepth,
  ]);

  // Start/Stop Loop
  useEffect(() => {
    requestRef.current = requestAnimationFrame((t) => updateRef.current?.(t));
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  // Self-healing: Reset if state becomes NaN (e.g. from previous sessions)
  useEffect(() => {
    if (isNaN(state.P) || isNaN(state.V) || isNaN(state.T)) {
      console.warn("Thermodynamics engine detected NaN state, resetting...");
      reset();
    }
  }, [state.P, state.V, state.T, reset]);

  return {
    state,
    setParam,
    reset,
    clearHistory,
    particles: particlesRef,
    history: historyRef,
    pistonYRef,
  };
};
