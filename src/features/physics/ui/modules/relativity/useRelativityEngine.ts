import { create } from "zustand";

// --- Types ---

export interface SpacetimeEvent {
  id: string;
  x: number; // Light-seconds (spatial)
  t: number; // Seconds (time coordinate, ct where c=1)
  label: string;
  color: string;
  worldlineId?: string; // Optional: belongs to a worldline
}

export interface Worldline {
  id: string;
  label: string;
  color: string;
  beta: number; // Velocity as fraction of c
  events: string[]; // Event IDs on this worldline
}

export interface RelativityScenario {
  id: string;
  name: string;
  description: string;
  events: Omit<SpacetimeEvent, "id">[];
  worldlines: Omit<Worldline, "id" | "events">[];
  initialBeta: number;
}

export interface RelativityState {
  // Core Physics
  beta: number; // Observer velocity v/c (-0.99 to 0.99)
  gamma: number; // Lorentz factor (computed)

  // Spacetime Data
  events: SpacetimeEvent[];
  worldlines: Worldline[];

  // View Options
  showLightCone: boolean;
  showGrid: boolean;
  showLorentzAxes: boolean;
  showWorldlines: boolean;
  showProperTime: boolean;
  viewMode: "2D" | "3D";

  // Simulation
  isPlaying: boolean;
  time: number;
  timeScale: number;

  // UI State
  isLabOpen: boolean;
  isEventBuilderOpen: boolean;
  isScenarioLibraryOpen: boolean;
  activeScenarioId: string | null;

  // Measurements
  measurements: TimeDilationMeasurement[];
}

export interface TimeDilationMeasurement {
  id: string;
  properTime: number;
  coordinateTime: number;
  beta: number;
  gamma: number;
}

// --- Physics Constants & Functions ---

export const SPEED_OF_LIGHT = 1; // Natural units (c = 1)

/**
 * Calculate Lorentz factor γ = 1/√(1-β²)
 */
export const calculateGamma = (beta: number): number => {
  const betaSq = beta * beta;
  if (betaSq >= 1) return Infinity;
  return 1 / Math.sqrt(1 - betaSq);
};

/**
 * Lorentz transformation: S → S'
 * x' = γ(x - βt)
 * t' = γ(t - βx)
 */
export const lorentzTransform = (
  x: number,
  t: number,
  beta: number,
): { x: number; t: number } => {
  const gamma = calculateGamma(beta);
  if (!isFinite(gamma)) return { x: 0, t: 0 };
  return {
    x: gamma * (x - beta * t),
    t: gamma * (t - beta * x),
  };
};

/**
 * Inverse Lorentz transformation: S' → S
 */
export const inverseLorentzTransform = (
  xPrime: number,
  tPrime: number,
  beta: number,
): { x: number; t: number } => {
  return lorentzTransform(xPrime, tPrime, -beta);
};

/**
 * Calculate spacetime interval (invariant)
 * s² = t² - x² (timelike if positive, spacelike if negative, lightlike if zero)
 */
export const spacetimeInterval = (x: number, t: number): number => {
  return t * t - x * x;
};

/**
 * Time dilation: Δt = γΔτ (coordinate time = gamma × proper time)
 */
export const timeDilation = (properTime: number, gamma: number): number => {
  return properTime * gamma;
};

/**
 * Length contraction: L = L₀/γ (contracted length = rest length / gamma)
 */
export const lengthContraction = (
  restLength: number,
  gamma: number,
): number => {
  return restLength / gamma;
};

// --- Predefined Scenarios ---

export const RELATIVITY_SCENARIOS: RelativityScenario[] = [
  {
    id: "twin-paradox",
    name: "Twin Paradox",
    description:
      "One twin travels at high speed while the other stays on Earth",
    events: [
      { x: 0, t: 0, label: "Departure", color: "#10b981" },
      { x: 4, t: 5, label: "Turnaround", color: "#f59e0b" },
      { x: 0, t: 10, label: "Reunion", color: "#ef4444" },
    ],
    worldlines: [
      { label: "Earth Twin", color: "#3b82f6", beta: 0 },
      { label: "Space Twin", color: "#ec4899", beta: 0.8 },
    ],
    initialBeta: 0.6,
  },
  {
    id: "barn-pole",
    name: "Barn-Pole Paradox",
    description:
      "A pole longer than a barn fits inside due to length contraction",
    events: [
      { x: -5, t: 0, label: "Pole Front Enter", color: "#10b981" },
      { x: 0, t: 0, label: "Barn Center", color: "#f59e0b" },
      { x: 5, t: 0, label: "Pole Back Enter", color: "#ef4444" },
    ],
    worldlines: [
      { label: "Barn", color: "#64748b", beta: 0 },
      { label: "Pole", color: "#8b5cf6", beta: 0.866 },
    ],
    initialBeta: 0.866,
  },
  {
    id: "simultaneity",
    name: "Relativity of Simultaneity",
    description: "Two simultaneous events in S are not simultaneous in S'",
    events: [
      { x: -3, t: 2, label: "Event A", color: "#f472b6" },
      { x: 3, t: 2, label: "Event B", color: "#34d399" },
      { x: 0, t: 0, label: "Origin", color: "#fbbf24" },
    ],
    worldlines: [],
    initialBeta: 0.5,
  },
  {
    id: "muon-decay",
    name: "Muon Decay",
    description: "Cosmic ray muons reach Earth surface due to time dilation",
    events: [
      { x: 0, t: 0, label: "Muon Created", color: "#10b981" },
      { x: 0, t: 2.2, label: "Classical Decay", color: "#ef4444" },
      { x: 0, t: 15, label: "Actual Decay", color: "#22c55e" },
    ],
    worldlines: [{ label: "Muon", color: "#a855f7", beta: 0.994 }],
    initialBeta: 0.994,
  },
];

// --- Default State ---

const generateId = () => Math.random().toString(36).substring(2, 9);

const DEFAULT_STATE: RelativityState = {
  beta: 0,
  gamma: 1,
  events: [
    { id: "evt-1", x: 2, t: 3, label: "A", color: "#f472b6" },
    { id: "evt-2", x: -2, t: 4, label: "B", color: "#34d399" },
    { id: "evt-3", x: 0, t: 0, label: "O", color: "#fbbf24" },
  ],
  worldlines: [],
  showLightCone: true,
  showGrid: true,
  showLorentzAxes: true,
  showWorldlines: true,
  showProperTime: false,
  viewMode: "3D",
  isPlaying: false,
  time: 0,
  timeScale: 1,
  isLabOpen: false,
  isEventBuilderOpen: false,
  isScenarioLibraryOpen: false,
  activeScenarioId: null,
  measurements: [],
};

// --- Zustand Store ---

interface RelativityActions {
  // Core
  setBeta: (beta: number) => void;
  reset: () => void;
  togglePlay: () => void;

  // Events
  addEvent: (event: Omit<SpacetimeEvent, "id">) => void;
  removeEvent: (id: string) => void;
  clearEvents: () => void;

  // Worldlines
  addWorldline: (worldline: Omit<Worldline, "id" | "events">) => void;
  removeWorldline: (id: string) => void;

  // Scenarios
  loadScenario: (scenarioId: string) => void;

  // Toggles
  toggleFeature: (
    feature:
      | "showLightCone"
      | "showGrid"
      | "showLorentzAxes"
      | "showWorldlines"
      | "showProperTime",
  ) => void;
  setViewMode: (mode: "2D" | "3D") => void;

  // UI
  setParam: <K extends keyof RelativityState>(
    key: K,
    value: RelativityState[K],
  ) => void;

  // Measurements
  addMeasurement: (measurement: Omit<TimeDilationMeasurement, "id">) => void;
  clearMeasurements: () => void;
}

export const useRelativityStore = create<RelativityState & RelativityActions>(
  (set, _get) => ({
    ...DEFAULT_STATE,

    setBeta: (beta) => {
      const clampedBeta = Math.max(-0.99, Math.min(0.99, beta));
      set({
        beta: clampedBeta,
        gamma: calculateGamma(clampedBeta),
      });
    },

    reset: () => {
      set({
        ...DEFAULT_STATE,
        gamma: calculateGamma(DEFAULT_STATE.beta),
      });
    },

    togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),

    addEvent: (event) =>
      set((s) => ({
        events: [...s.events, { ...event, id: `evt-${generateId()}` }],
      })),

    removeEvent: (id) =>
      set((s) => ({
        events: s.events.filter((e) => e.id !== id),
      })),

    clearEvents: () => set({ events: [] }),

    addWorldline: (worldline) =>
      set((s) => ({
        worldlines: [
          ...s.worldlines,
          { ...worldline, id: `wl-${generateId()}`, events: [] },
        ],
      })),

    removeWorldline: (id) =>
      set((s) => ({
        worldlines: s.worldlines.filter((w) => w.id !== id),
      })),

    loadScenario: (scenarioId) => {
      const scenario = RELATIVITY_SCENARIOS.find((s) => s.id === scenarioId);
      if (!scenario) return;

      const events: SpacetimeEvent[] = scenario.events.map((e, i) => ({
        ...e,
        id: `evt-${scenarioId}-${i}`,
      }));

      const worldlines: Worldline[] = scenario.worldlines.map((w, i) => ({
        ...w,
        id: `wl-${scenarioId}-${i}`,
        events: [],
      }));

      set({
        events,
        worldlines,
        beta: scenario.initialBeta,
        gamma: calculateGamma(scenario.initialBeta),
        activeScenarioId: scenarioId,
        isScenarioLibraryOpen: false,
      });
    },

    toggleFeature: (feature) => set((s) => ({ [feature]: !s[feature] })),

    setViewMode: (mode) => set({ viewMode: mode }),

    setParam: (key, value) => set({ [key]: value }),

    addMeasurement: (measurement) =>
      set((s) => ({
        measurements: [
          ...s.measurements,
          { ...measurement, id: `meas-${generateId()}` },
        ],
      })),

    clearMeasurements: () => set({ measurements: [] }),
  }),
);

// --- Hook Wrapper (Compatible with existing pattern) ---

export const useRelativityEngine = () => {
  const store = useRelativityStore();

  // Transform events to primed coordinates for display
  const transformedEvents = store.events.map((e) => ({
    ...e,
    prime: lorentzTransform(e.x, e.t, store.beta),
  }));

  return {
    // State
    ...store,
    transformedEvents,

    // Computed values
    timeDilationFactor: store.gamma,
    lengthContractionFactor: 1 / store.gamma,

    // Physics functions for external use
    lorentzTransform: (x: number, t: number) =>
      lorentzTransform(x, t, store.beta),
    inverseLorentzTransform: (xPrime: number, tPrime: number) =>
      inverseLorentzTransform(xPrime, tPrime, store.beta),
    calculateInterval: spacetimeInterval,
  };
};
