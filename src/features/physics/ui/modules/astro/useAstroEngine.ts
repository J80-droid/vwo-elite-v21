import { create } from "zustand";

import {
  calculateOrbitalVelocity,
  calculateStarRadiusRelative,
  CelestialBody,
  generateStarField,
  Star,
  updateBodyPhysics,
  Vector2,
} from "./astroMath";

interface AstroState {
  // Star Properties
  centralMass: number;
  temperature: number; // Kelvin
  luminosity: number; // Log10(L/L_sun)
  starRadiusRelative: number; // R / R_sun (Derived)

  // Physics State
  orbitingBodies: CelestialBody[];
  stars: Star[]; // Background stars
  timeScale: number;
  isPlaying: boolean;

  // Viewport & UI
  viewMode: "2D" | "3D";
  zoom: number;
  pan: Vector2;
  showAnalysis: boolean;
  showVectors: boolean;
  showHohmann: boolean; // Nieuw: Hohmann Transfer Viz

  // Actions
  setParam: (
    param: keyof AstroState,
    value: number | boolean | Vector2,
  ) => void;
  togglePlay: () => void;
  toggleViewMode: () => void;
  toggleAnalysis: () => void;
  toggleVectors: () => void;
  toggleHohmann: () => void;
  reset: () => void;
  stepPhysics: () => void;
  addRandomPlanet: () => void;
  clearTrails: () => void;
}

const INITIAL_MASS = 10000;
const INITIAL_TEMP = 5778;

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useAstroEngine = create<AstroState>((set, get) => ({
  centralMass: INITIAL_MASS,
  temperature: INITIAL_TEMP,
  luminosity: 0,
  starRadiusRelative: 1.0,
  orbitingBodies: [],
  stars: generateStarField(300, 4000, 4000), // Huge starfield
  timeScale: 1.0,
  isPlaying: true,
  viewMode: "3D",
  zoom: 1.0,
  pan: { x: 0, y: 0 },
  showAnalysis: false,
  showVectors: false,
  showHohmann: false,

  setParam: (param, value) => {
    set((state) => {
      const newState = { ...state, [param]: value };

      // Auto-recalculate Radius if T or L changes (Stefan-Boltzmann)
      if (param === "temperature" || param === "luminosity") {
        newState.starRadiusRelative = calculateStarRadiusRelative(
          newState.luminosity,
          newState.temperature,
        );
      }
      return newState;
    });
  },

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  toggleViewMode: () =>
    set((state) => ({ viewMode: state.viewMode === "2D" ? "3D" : "2D" })),
  toggleAnalysis: () => set((state) => ({ showAnalysis: !state.showAnalysis })),
  toggleVectors: () => set((state) => ({ showVectors: !state.showVectors })),
  toggleHohmann: () => set((state) => ({ showHohmann: !state.showHohmann })),

  reset: () =>
    set({
      centralMass: INITIAL_MASS,
      temperature: INITIAL_TEMP,
      luminosity: 0,
      starRadiusRelative: 1.0,
      orbitingBodies: [],
      stars: generateStarField(300, 4000, 4000), // Re-gen on reset
      timeScale: 1.0,
      isPlaying: true,
      viewMode: "3D",
      zoom: 1.0,
      pan: { x: 0, y: 0 },
      showAnalysis: false,
      showVectors: false,
      showHohmann: false,
    }),

  clearTrails: () =>
    set((state) => ({
      orbitingBodies: state.orbitingBodies.map((b) => ({ ...b, trail: [] })),
    })),

  addRandomPlanet: () => {
    const { centralMass } = get();
    const radius = 100 + Math.random() * 300;
    const angle = Math.random() * Math.PI * 2;

    const pos = {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };

    const vMag = calculateOrbitalVelocity(radius, centralMass);
    const vel = {
      x: -Math.sin(angle) * vMag,
      y: Math.cos(angle) * vMag,
    };

    const newBody: CelestialBody = {
      id: generateId(),
      mass: 10 + Math.random() * 40,
      radius: 5 + Math.random() * 5,
      position: pos,
      velocity: vel,
      color: `hsl(${Math.random() * 360}, 70%, 60%)`,
      trail: [],
    };

    set((state) => ({ orbitingBodies: [...state.orbitingBodies, newBody] }));
  },

  stepPhysics: () => {
    set((state) => {
      if (!state.isPlaying) return {};

      const dt = 0.1 * state.timeScale;
      const newBodies = state.orbitingBodies.map((body) =>
        updateBodyPhysics(body, state.centralMass, dt),
      );

      return { orbitingBodies: newBodies };
    });
  },
}));
