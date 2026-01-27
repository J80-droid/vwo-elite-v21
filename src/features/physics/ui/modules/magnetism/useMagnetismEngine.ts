import { useCallback, useEffect, useRef } from "react";

import { useModuleState } from "../../../hooks/usePhysicsLabContext";

// CONSTANTEN
export const MAX_TRAIL_LENGTH = 100;
export const BOUNDS = 100;

export interface MagnetismParticle {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
  charge: number;
  mass: number;
  trail: [number, number, number][];
  color: string;
  type: "proton" | "electron" | "alpha" | "positron";
}

export interface MagnetismState {
  bField: number;
  eField: number;
  particles: MagnetismParticle[];
  isPlaying: boolean;
  timeScale: number;
  showBField: boolean;
  showEField: boolean;
  showGrid: boolean;
  particleType: "proton" | "electron" | "alpha" | "positron";
}

const DEFAULT_STATE: MagnetismState = {
  bField: 0.5,
  eField: 0,
  particles: [],
  isPlaying: false,
  timeScale: 1.0,
  showBField: true,
  showEField: true,
  showGrid: true,
  particleType: "proton",
};

export const useMagnetismEngine = () => {
  const [moduleState, setModuleState] =
    useModuleState<MagnetismState>("magnetism");
  const state: MagnetismState = { ...DEFAULT_STATE, ...moduleState };

  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const setParam = useCallback(
    <K extends keyof MagnetismState>(key: K, val: MagnetismState[K]) => {
      setModuleState((s: MagnetismState) => ({ ...s, [key]: val }));
    },
    [setModuleState],
  );

  const addParticle = useCallback(
    (type?: MagnetismParticle["type"]) => {
      const pType = type || state.particleType;
      let charge = 1;
      let mass = 1;
      let color = "#34d399";

      // VISUAL TWEAK: We gebruiken 'visuele massa's' i.p.v. realistische massa's.
      // Echte elektronen (0.0005u) zouden onzichtbaar snel zijn t.o.v. protonen.
      if (pType === "electron") {
        charge = -1;
        mass = 0.1; // Was 0.0005, verhoogd voor visuele stabiliteit
        color = "#f472b6";
      } else if (pType === "alpha") {
        charge = 2;
        mass = 4;
        color = "#fbbf24";
      } else if (pType === "positron") {
        charge = 1;
        mass = 0.1;
        color = "#60a5fa";
      }

      const newParticle: MagnetismParticle = {
        id: Math.random().toString(36).substring(2, 9), // Fixed: substr -> substring
        position: [-10, 0, 0],
        velocity: [5, (Math.random() - 0.5) * 2, 0],
        charge,
        mass,
        color,
        type: pType,
        trail: [],
      };

      setModuleState((s: MagnetismState) => ({
        ...s,
        particles: [...(s.particles || []), newParticle],
      }));
    },
    [state.particleType, setModuleState],
  );

  const clearParticles = useCallback(() => {
    setModuleState((s: MagnetismState) => ({ ...s, particles: [] }));
  }, [setModuleState]);

  const reset = useCallback(() => {
    setModuleState(() => ({ ...DEFAULT_STATE, particles: [] }));
  }, [setModuleState]);

  const hasParticles = state.particles.length > 0;
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current && state.particles.length === 0) {
      addParticle("proton"); // Start direct met een proton
      mounted.current = true;
    }
  }, [addParticle, state.particles.length]);

  useEffect(() => {
    const update = (ts: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = ts;
      // Cap dt op 32ms om spiraling te voorkomen bij tab-switching
      const dt = Math.min((ts - lastTimeRef.current) / 1000, 0.032);
      lastTimeRef.current = ts;

      if (state.isPlaying && hasParticles) {
        setModuleState((s: MagnetismState) => {
          // Safety check binnen de state update
          if (!s.isPlaying || !s.particles.length) return s;

          const effectiveDt = dt * s.timeScale;
          const B = s.bField;
          const E = s.eField;

          const newParticles = s.particles
            .map((p) => {
              const [vx, vy, vz] = p.velocity;
              const [x, y, z] = p.position;
              const q = p.charge;
              const m = p.mass;

              // Lorentz Force: F = q(E + v x B)
              // Aanname: E is vector(E, 0, 0), B is vector(0, 0, B)
              const Fx = q * (E + vy * B);
              const Fy = q * (-vx * B);

              let nvx = vx + (Fx / m) * effectiveDt;
              let nvy = vy + (Fy / m) * effectiveDt;
              let nvz = vz;

              // Energie-correctie voor pure magnetische velden (Symplectic hack)
              // Dit voorkomt dat de Euler-integratie de baan laat exploderen
              if (Math.abs(E) < 0.001 && Math.abs(B) > 0.001) {
                const oldSpeed = Math.sqrt(vx * vx + vy * vy + vz * vz);
                const newSpeed = Math.sqrt(nvx * nvx + nvy * nvy + nvz * nvz);
                if (newSpeed > 0.0001) {
                  const correction = oldSpeed / newSpeed;
                  nvx *= correction;
                  nvy *= correction;
                  nvz *= correction;
                }
              }

              const nx = x + nvx * effectiveDt;
              const ny = y + nvy * effectiveDt;
              const nz = z + nvz * effectiveDt;

              let newTrail = p.trail;
              // Performance: Update trail niet elke frame, maar random/interval
              // Of behoudt huidige logica maar met slice voor GC reductie
              if (Math.random() > 0.5) {
                newTrail = [
                  ...p.trail,
                  [nx, ny, nz] as [number, number, number],
                ];
                if (newTrail.length > MAX_TRAIL_LENGTH) {
                  newTrail = newTrail.slice(newTrail.length - MAX_TRAIL_LENGTH);
                }
              }

              return {
                ...p,
                position: [nx, ny, nz] as [number, number, number],
                velocity: [nvx, nvy, nvz] as [number, number, number],
                trail: newTrail,
              };
            })
            .filter(
              (p) =>
                Math.abs(p.position[0]) < BOUNDS &&
                Math.abs(p.position[1]) < BOUNDS,
            );

          return { ...s, particles: newParticles };
        });
      }
      requestRef.current = requestAnimationFrame(update);
    };

    requestRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(requestRef.current);
  }, [state.isPlaying, hasParticles, setModuleState]);

  return {
    state,
    setParam,
    addParticle,
    clearParticles,
    reset,
  };
};
