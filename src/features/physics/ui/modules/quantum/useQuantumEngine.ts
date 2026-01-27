import { create } from "zustand";

// Importeer ook de energieformules om placeholders te vermijden
import { energyToSpectralColor, harmonicEnergy } from "./quantumMath";

export interface MeasurementBin {
  x: number;
  count: number;
}

export interface PhotonData {
  id: string;
  energy: number;
  wavelength: number;
  color: string;
  timestamp: number;
}

export interface QuantumState {
  // Simulation Params
  wellWidth: number;
  mass: number;
  activeStates: { n: number; coefficient: number }[];
  potentialType: "infinite-well" | "harmonic" | "barrier"; // Added barrier

  // Barrier / Tunneling Params
  barrierWidth: number;
  barrierHeight: number;
  energyLevel: number; // For single particle tunneling

  // View Params
  viewMode: "real" | "probability" | "complex";
  zoom: number;
  panX: number;
  panY: number;
  time: number;
  isPlaying: boolean;

  // Interaction State
  hoveredState: number | null;
  lastCollapseTime: number;

  // Features State
  measurements: MeasurementBin[];
  totalMeasurements: number;
  lastPhoton: PhotonData | null;
  showExpectation: boolean;
  simulationSpeed: number;
  exportTrigger: number;
  showFormulas: boolean;

  // Actions
  setParam: <K extends keyof QuantumState>(
    key: K,
    value: QuantumState[K],
  ) => void;
  toggleState: (n: number) => void;
  collapse: (currentProbDistribution?: { x: number; prob: number }[]) => void;
  reset: () => void;
  clearMeasurements: () => void;
  triggerExport: () => void;
}

const INITIAL_STATE: Omit<
  QuantumState,
  | "setParam"
  | "toggleState"
  | "collapse"
  | "reset"
  | "clearMeasurements"
  | "triggerExport"
> = {
  wellWidth: 1.0,
  mass: 1.0,
  activeStates: [{ n: 1, coefficient: 1 }],
  potentialType: "infinite-well",

  // Default Barrier Params
  barrierWidth: 0.2,
  barrierHeight: 50,
  energyLevel: 30,

  viewMode: "real",
  zoom: 0,
  panX: 0,
  panY: 0,
  time: 0,
  isPlaying: true,
  hoveredState: null,
  lastCollapseTime: 0,

  measurements: [],
  totalMeasurements: 0,
  lastPhoton: null,
  showExpectation: true,
  simulationSpeed: 0.5,
  exportTrigger: 0,
  showFormulas: false,
};

// Helper om energie te berekenen op basis van current state parameters
const calculateEnergy = (
  n: number,
  type: "infinite-well" | "harmonic" | "barrier",
  mass: number,
  width: number,
) => {
  if (type === "harmonic") {
    return harmonicEnergy(n - 1, mass, width);
  } else if (type === "barrier") {
    return 0; // Not applicable for discrete n states in continuous scattering
  } else {
    // Infinite well: E ~ n^2 / L^2
    // Constanten vereenvoudigd voor simulatie-schaal, maar wel kwadratisch verband
    return (n * n * Math.PI * Math.PI) / (2 * mass * width * width);
  }
};

export const useQuantumEngine = create<QuantumState>((set) => ({
  ...INITIAL_STATE,

  setParam: (key, value) => set((state) => ({ ...state, [key]: value })),

  clearMeasurements: () => set({ measurements: [], totalMeasurements: 0 }),

  triggerExport: () =>
    set((state) => ({ exportTrigger: state.exportTrigger + 1 })),

  toggleState: (n) =>
    set((state) => {
      const exists = state.activeStates.find((s) => s.n === n);
      let newStates = state.activeStates;
      let photon: PhotonData | null = state.lastPhoton;

      // Bereken energie van de staat die we manipuleren
      const currentE = calculateEnergy(
        n,
        state.potentialType,
        state.mass,
        state.wellWidth,
      );

      if (exists) {
        // REMOVE STATE (Emission)
        if (state.activeStates.length <= 1) return state; // Voorkom lege staat
        newStates = state.activeStates.filter((s) => s.n !== n);

        // Emissie simulatie: De energie 'verloren' door het weghalen van deze staat
        // We nemen het verschil met de grondtoestand of simpelweg de energie van deze staat
        // om een spectraalkleur te bepalen.
        const spectral = energyToSpectralColor(currentE);

        photon = {
          id: Math.random().toString(36).slice(2),
          energy: currentE,
          wavelength: spectral.wavelength,
          color: spectral.color,
          timestamp: Date.now(),
        };
      } else {
        // ADD STATE (Absorption)
        // We voegen de staat toe. Geen foton emissie bij absorptie in deze visualisatie,
        // of we zouden een 'donker' absorptiespectrum kunnen tonen, maar dat valt buiten scope.
        newStates = [...state.activeStates, { n, coefficient: 1 }];
      }

      return { activeStates: newStates, lastPhoton: photon };
    }),

  collapse: (currentProbDistribution) =>
    set((state) => {
      if (state.activeStates.length < 1) return state;

      // --- 1. HISTOGRAM LOGICA ---
      const newMeasurements = [...state.measurements];
      let newTotal = state.totalMeasurements;
      let measuredX = 0;

      if (currentProbDistribution && currentProbDistribution.length > 0) {
        const rand = Math.random();
        let cumulative = 0;
        const totalProb = currentProbDistribution.reduce(
          (acc, p) => acc + p.prob,
          0,
        );

        for (const p of currentProbDistribution) {
          cumulative += p.prob / totalProb;
          if (rand <= cumulative) {
            measuredX = p.x;
            break;
          }
        }

        const binX = Math.round(measuredX * 10) / 10;
        const existingBin = newMeasurements.find(
          (b) => Math.abs(b.x - binX) < 0.01,
        );
        if (existingBin) {
          existingBin.count++;
        } else {
          newMeasurements.push({ x: binX, count: 1 });
        }
        newTotal++;
      }

      // --- 2. GOLFFUNCTIE COLLAPSE ---
      let finalStates = state.activeStates;
      let photon = state.lastPhoton;

      if (state.activeStates.length > 1) {
        const totalCoeffSq = state.activeStates.reduce(
          (acc, s) => acc + s.coefficient ** 2,
          0,
        );
        const randState = Math.random() * totalCoeffSq;
        let cumState = 0;
        let selectedN = state.activeStates[0]?.n ?? 1;

        // Bereken gemiddelde energie voor de collapse (Verwachtingswaarde E)
        let avgE_old = 0;
        for (const s of state.activeStates) {
          const E = calculateEnergy(
            s.n,
            state.potentialType,
            state.mass,
            state.wellWidth,
          );
          const prob = s.coefficient ** 2 / totalCoeffSq;
          avgE_old += E * prob;
        }

        for (const s of state.activeStates) {
          cumState += s.coefficient ** 2;
          if (randState <= cumState) {
            selectedN = s.n;
            break;
          }
        }
        finalStates = [{ n: selectedN, coefficient: 1 }];

        // Energie na collapse
        const newE = calculateEnergy(
          selectedN,
          state.potentialType,
          state.mass,
          state.wellWidth,
        );

        // Emissie check: Is de energie gedaald?
        if (newE < avgE_old) {
          const deltaE = avgE_old - newE;
          const spectral = energyToSpectralColor(deltaE * 5); // Scaling factor voor zichtbaarheid
          photon = {
            id: Math.random().toString(36).slice(2),
            energy: deltaE,
            wavelength: spectral.wavelength,
            color: spectral.color,
            timestamp: Date.now(),
          };
        }
      }

      return {
        activeStates: finalStates,
        measurements: newMeasurements,
        totalMeasurements: newTotal,
        lastCollapseTime: Date.now(),
        lastPhoton: photon,
      };
    }),

  reset: () => set(INITIAL_STATE),
}));
