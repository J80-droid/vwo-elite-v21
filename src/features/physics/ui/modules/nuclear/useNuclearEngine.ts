import { useCallback, useEffect, useRef } from "react";

import { useModuleState } from "../../../hooks/usePhysicsLabContext";
import { CUSTOM_ISOTOPE_ID, Isotope, ISOTOPE_LIBRARY } from "./isotopes";

export interface NuclearParticle {
  id: number;
  x: number;
  y: number;
  z: number;
  decayed: boolean;
  decayTime: number;
}

export interface EmittedParticle {
  id: string;
  type: "alpha" | "beta_minus" | "beta_plus" | "gamma";
  position: [number, number, number];
  velocity: [number, number, number];
  startTime: number;
  kineticEnergy: number; // In MeV
}

export interface NuclearState {
  time: number;
  halfLife: number;
  particleCount: number;
  particles: NuclearParticle[];
  emittedParticles: EmittedParticle[];
  counts: { alpha: number; beta: number; gamma: number };
  detectorDistance: number;
  detectionCount: number;
  accumulatedEnergy: number; // Cumulatieve energie in MeV op detector
  customIsotopes?: Isotope[];
  shieldMaterial: string;
  shieldThickness: number;
  isPlaying: boolean;
  isotopeId: string;
  timeScale: number;
  magneticField: number;
  idealMode: boolean;
  isLabOpen: boolean;
  isBuilderOpen: boolean;
  isLibraryOpen: boolean;
}

// --- Fysische Hulpfuncties ---

/**
 * Berekent een kinetische energie voor bèta-verval op basis van de Fermi-verdeling.
 * De kansverdeling volgt bij benadering P(E) ~ sqrt(E) * (Q - E)^2.
 */
const sampleBetaEnergy = (Q: number): number => {
  if (Q <= 0) return 0;
  const peakE = Q / 3; // Modale waarde ligt vaak rond Q/3
  const maxP = Math.sqrt(peakE) * Math.pow(Q - peakE, 2);

  // Rejection Sampling
  for (let i = 0; i < 20; i++) {
    const E = Math.random() * Q;
    const p = Math.sqrt(E) * Math.pow(Q - E, 2);
    if (Math.random() * maxP <= p) return E;
  }
  return Q / 3; // Fallback naar gemiddelde bij sampling failure
};

const DEFAULT_STATE: NuclearState = {
  time: 0,
  halfLife: 5,
  particleCount: 500,
  particles: [],
  emittedParticles: [],
  customIsotopes: [],
  counts: { alpha: 0, beta: 0, gamma: 0 },
  detectorDistance: 15,
  detectionCount: 0,
  accumulatedEnergy: 0,
  shieldMaterial: "lead",
  shieldThickness: 0,
  isPlaying: false,
  isotopeId: CUSTOM_ISOTOPE_ID,
  timeScale: 1,
  magneticField: 0,
  idealMode: false,
  isLabOpen: false,
  isBuilderOpen: false,
  isLibraryOpen: false,
};

const generateParticles = (
  count: number,
  halfLife: number,
): NuclearParticle[] => {
  const lambda = Math.log(2) / halfLife;
  return Array.from({ length: count }, (_, i) => {
    const r = Math.pow(Math.random(), 1 / 3) * 1.5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    return {
      id: i,
      x: r * Math.sin(phi) * Math.cos(theta),
      y: r * Math.sin(phi) * Math.sin(theta),
      z: r * Math.cos(phi),
      decayed: false,
      decayTime: -Math.log(Math.random()) / lambda,
    };
  });
};

export const useNuclearEngine = () => {
  const [moduleState, setModuleState] = useModuleState<NuclearState>("nuclear");
  const state: NuclearState = { ...DEFAULT_STATE, ...moduleState };

  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const updateRef = useRef<((ts: number) => void) | undefined>(undefined);

  // Initialisatie
  useEffect(() => {
    if (!moduleState.particles || moduleState.particles.length === 0) {
      const initialParticles = generateParticles(
        DEFAULT_STATE.particleCount,
        DEFAULT_STATE.halfLife,
      );
      setModuleState({ ...DEFAULT_STATE, particles: initialParticles });
    }
  }, [moduleState.particles, setModuleState]);

  const reset = useCallback(() => {
    setModuleState((s: NuclearState) => {
      const iso =
        ISOTOPE_LIBRARY[s.isotopeId] ||
        s.customIsotopes?.find((i) => i.id === s.isotopeId);
      const currentHalfLife = iso?.halfLife || 5;
      return {
        ...s,
        time: 0,
        isPlaying: false,
        particles: generateParticles(s.particleCount, currentHalfLife),
        emittedParticles: [],
        detectionCount: 0,
        accumulatedEnergy: 0,
        counts: { alpha: 0, beta: 0, gamma: 0 },
      };
    });
  }, [setModuleState]);

  useEffect(() => {
    updateRef.current = (ts: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = ts;
      const dt = Math.min((ts - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = ts;
      const realTimeNow = ts / 1000;

      // Achtergrondruis
      if (Math.random() < 0.005 && !state.idealMode) {
        setModuleState((s: NuclearState) => ({
          ...s,
          detectionCount: s.detectionCount + 1,
        }));
      }

      if (state.isPlaying) {
        setModuleState((s: NuclearState) => {
          const current = { ...s };
          const effectiveDt = dt * current.timeScale;
          const newTime = current.time + effectiveDt;
          const newlyEmitted: EmittedParticle[] = [];

          const updatedParticles = current.particles.map((p) => {
            if (!p.decayed && newTime >= p.decayTime) {
              const iso =
                ISOTOPE_LIBRARY[current.isotopeId] ||
                current.customIsotopes?.find((i) => i.id === current.isotopeId);

              // ELITE EMISSIE: Gebruik vervalschema voor alle transities
              if (iso && iso.scheme) {
                iso.scheme.transitions.forEach((trans, idx) => {
                  const fromLvl = iso.scheme.levels[trans.fromLevel]!;
                  const toLvl = iso.scheme.levels[trans.toLevel]!;
                  const qVal = Math.abs(fromLvl.energy - toLvl.energy);

                  let kineticEnergy = qVal;
                  const type = (
                    trans.particle === "positron"
                      ? "beta_plus"
                      : trans.particle === "beta"
                        ? "beta_minus"
                        : trans.particle
                  ) as "alpha" | "beta_minus" | "beta_plus" | "gamma";

                  // Bèta Spectrum Logica
                  if (type.startsWith("beta")) {
                    kineticEnergy = sampleBetaEnergy(qVal);
                  }

                  // Richting en Snelheid (Visual Mapping)
                  const theta = Math.random() * Math.PI * 2;
                  const phi = Math.acos(2 * Math.random() - 1);

                  let visualSpeed = 5;
                  if (type === "alpha") visualSpeed = 1.5 + kineticEnergy / 10;
                  else if (type === "gamma") visualSpeed = 12;
                  else visualSpeed = 3 + (kineticEnergy / qVal) * 7;

                  newlyEmitted.push({
                    id: `emit-${p.id}-${idx}-${newTime}`,
                    type,
                    position: [p.x, p.y, p.z],
                    velocity: [
                      visualSpeed * Math.sin(phi) * Math.cos(theta),
                      visualSpeed * Math.sin(phi) * Math.sin(theta),
                      visualSpeed * Math.cos(phi),
                    ],
                    startTime: realTimeNow,
                    kineticEnergy,
                  });

                  if (type === "alpha") current.counts.alpha++;
                  else if (type === "gamma") current.counts.gamma++;
                  else current.counts.beta++;
                });
              }
              return { ...p, decayed: true };
            }
            return p;
          });

          // Update Posities & Lorentzkracht
          const filteredEmitted = [...current.emittedParticles, ...newlyEmitted]
            .map((ep) => {
              const q =
                ep.type === "alpha"
                  ? 2
                  : ep.type === "beta_minus"
                    ? -1
                    : ep.type === "beta_plus"
                      ? 1
                      : 0;
              let vx = ep.velocity[0];
              const vy = ep.velocity[1];
              let vz = ep.velocity[2];

              if (current.magneticField !== 0 && q !== 0) {
                const B = current.magneticField;
                const factor = (q * B * 50) / (ep.type === "alpha" ? 4000 : 1);
                vx += (vy * 0 - vz * B) * factor * dt; // Vereenvoudigde kruisproduct
                vz += (vx * B - vy * 0) * factor * dt;
              }

              const newPos: [number, number, number] = [
                ep.position[0] + vx * dt,
                ep.position[1] + vy * dt,
                ep.position[2] + vz * dt,
              ];

              // Detectie & Energie Accumulatie
              const dx = newPos[0] - current.detectorDistance;
              const dy = newPos[1];
              const dz = newPos[2];
              const distSq = dx * dx + dy * dy + dz * dz;

              if (distSq < 1.0) {
                current.detectionCount++;
                current.accumulatedEnergy += ep.kineticEnergy;
                return { ...ep, position: newPos, startTime: -100 }; // Vernietig na hit
              }

              return {
                ...ep,
                position: newPos,
                velocity: [vx, vy, vz] as [number, number, number],
              };
            })
            .filter((ep) => realTimeNow - ep.startTime < 2.0);

          return {
            ...current,
            particles: updatedParticles,
            emittedParticles: filteredEmitted,
          };
        });
      }
      requestRef.current = requestAnimationFrame((t) => updateRef.current?.(t));
    };
  }, [
    state.isPlaying,
    state.timeScale,
    state.isotopeId,
    setModuleState,
    state.idealMode,
  ]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame((t) => updateRef.current?.(t));
    return () => cancelAnimationFrame(requestRef.current!);
  }, []);

  // Dosimetrie Berekening
  const massHuman = 70;
  const gray = (state.accumulatedEnergy * 1.60218e-13) / massHuman;
  const wr = state.isotopeId.includes("alpha") ? 20 : 1; // Vereenvoudigde WR

  const addCustomIsotope = (iso: Isotope) => {
    setModuleState((s: NuclearState) => ({
      ...s,
      customIsotopes: [...(s.customIsotopes || []), iso],
      isotopeId: iso.id, // Auto-select new isotope
    }));
  };

  return {
    state,
    reset,
    setParam: (
      key: keyof NuclearState,
      val: NuclearState[keyof NuclearState],
    ) => setModuleState((s: NuclearState) => ({ ...s, [key]: val })),
    addCustomIsotope,
    dosimetry: { gray, sievert: gray * wr },
    activity:
      (Math.log(2) / state.halfLife) *
      state.particles.filter((p) => !p.decayed).length,
  };
};
