import { useCallback, useEffect, useRef } from "react";

import { useModuleState } from "../../../hooks/usePhysicsLabContext";

export interface WaveParams {
  f: number;
  A: number;
  phi: number;
  active: boolean;
  direction: 1 | -1;
  xOffset?: number; // Starting position offset
}

export interface WavesState {
  time: number;
  timeScale?: number;
  zoom: number;
  panX: number;
  panY: number;
  isPlaying: boolean;

  // Wave 1 (Base)
  wave1: WaveParams;

  // Wave 2 (Superposition)
  wave2: WaveParams;

  // Advanced Features
  harmonics: {
    isEnabled: boolean;
    n: number; // Harmonic number (1, 2, 3...)
    L: number; // Length of string (px)
    mode: "string" | "open" | "closed"; // string=Fixed-Fixed, open=Open-Open, closed=Fixed-Open
  };
  probe: {
    isActive: boolean;
    x: number; // Position on x-axis
  };
  isLongitudinal: boolean;
  ghostPoints?: { x: number; y: number }[] | null; // For Ghost Trace
  medium: {
    tension: number; // 1-100 N (approx)
    density: number; // 0.0001 - 0.001 kg/m
  };
}

const DEFAULT_WAVE: WaveParams = {
  f: 1.0,
  A: 50,
  phi: 0,
  active: true,
  direction: 1,
  xOffset: 0,
};
const DEFAULT_WAVE_2: WaveParams = {
  f: 1.5,
  A: 50,
  phi: 0,
  active: false,
  direction: -1,
  xOffset: 0,
};

const DEFAULT_STATE: WavesState = {
  time: 0,
  timeScale: 1.0,
  zoom: 1.0,
  panX: 0,
  panY: 0,
  isPlaying: false,
  isLongitudinal: false,
  medium: { tension: 50, density: 0.0002 },
  wave1: DEFAULT_WAVE,
  wave2: DEFAULT_WAVE_2,
  harmonics: { isEnabled: false, n: 1, L: 600, mode: "string" },
  probe: { isActive: false, x: 200 },
};

export const useWavesEngine = () => {
  // Use the specific module hook
  const [moduleState, setModuleState] = useModuleState<WavesState>("waves");

  // Ensure state is initialized (merge default with current)
  const currentModuleState = moduleState || {};

  // Deep merge for waves to avoid undefined access if migrating
  const state: WavesState = {
    ...DEFAULT_STATE,
    ...currentModuleState,
    medium: { ...DEFAULT_STATE.medium, ...(currentModuleState.medium || {}) },
    wave1: { ...DEFAULT_STATE.wave1, ...(currentModuleState.wave1 || {}) },
    wave2: { ...DEFAULT_STATE.wave2, ...(currentModuleState.wave2 || {}) },
    harmonics: {
      ...DEFAULT_STATE.harmonics,
      ...(currentModuleState.harmonics || {}),
    },
    probe: { ...DEFAULT_STATE.probe, ...(currentModuleState.probe || {}) },
  };

  // Physics Engine: Taylor's Law Coupling
  useEffect(() => {
    if (state.harmonics?.isEnabled) {
      const T = state.medium?.tension || 50;
      const mu = state.medium?.density || 0.0002;
      const v = Math.sqrt(T / mu); // Wave speed

      const L = state.harmonics.L || 600;
      const n = state.harmonics.n || 1;
      const mode = state.harmonics.mode || "string";

      let lambda = 0;
      if (mode === "string" || mode === "open") {
        lambda = (2 * L) / n;
      } else {
        // closed
        lambda = (4 * L) / (2 * n - 1);
      }

      const f_phys = v / lambda;

      // Only update if significantly different (avoid loops/jitters)
      const currentF = state.wave1.f;
      if (Math.abs(currentF - f_phys) > 0.001) {
        setModuleState((prev) => {
          if (!prev) return {};
          return {
            ...prev,
            wave1: { ...prev.wave1, f: f_phys },
            wave2: { ...prev.wave2, f: f_phys },
          };
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.harmonics.isEnabled,
    state.harmonics.n,
    state.harmonics.L,
    state.harmonics.mode,
    state.medium.tension,
    state.medium.density,
    setModuleState,
  ]);

  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const lastUiUpdateTimeRef = useRef<number>(0);
  const updateRef = useRef<((ts: number) => void) | undefined>(undefined);

  // Physics Source of Truth (prevents time dilation when throttling)
  const wavesRef = useRef({
    time: state.time || 0,
  });

  // Init state if missing
  useEffect(() => {
    if (!currentModuleState.wave1 || !currentModuleState.harmonics) {
      setModuleState(DEFAULT_STATE);
    }
  }, [currentModuleState.wave1, currentModuleState.harmonics, setModuleState]);

  // Sync Ref with State changes (e.g. reset)
  useEffect(() => {
    wavesRef.current.time = state.time;
  }, [state.time]);

  const reset = useCallback(
    (type: "soft" | "hard" = "soft") => {
      if (type === "hard") {
        setModuleState(DEFAULT_STATE);
        wavesRef.current.time = 0;
      } else {
        setModuleState((s: WavesState | null) => ({
          ...(s || DEFAULT_STATE),
          time: 0,
          isPlaying: true,
        }));
        wavesRef.current.time = 0;
      }
    },
    [setModuleState],
  );

  useEffect(() => {
    updateRef.current = (ts: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = ts;
      const dt = Math.min((ts - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = ts;

      if (state.isPlaying) {
        // 1. Physics Update (High Frequency 60fps+)
        const scale = state.timeScale ?? 1.0;
        wavesRef.current.time += dt * scale;

        // 2. UI Sync (Throttled 30fps)
        const now = performance.now();
        const UI_UPDATE_INTERVAL = 32;

        if (now - lastUiUpdateTimeRef.current > UI_UPDATE_INTERVAL) {
          setModuleState((s: WavesState | null) => {
            const current = { ...DEFAULT_STATE, ...(s || {}) };
            // Verify playing state inside callback to be safe
            if (!current.isPlaying) return current;
            return { ...current, time: wavesRef.current.time };
          });
          lastUiUpdateTimeRef.current = now;
        }
      }

      requestRef.current = requestAnimationFrame((t) => updateRef.current?.(t));
    };
  }, [state.isPlaying, state.timeScale, setModuleState]); // Added timeScale dependency

  // Animation Loop
  useEffect(() => {
    requestRef.current = requestAnimationFrame((t) => updateRef.current?.(t));
    return () => cancelAnimationFrame(requestRef.current!);
  }, []);

  const setParam = (key: keyof WavesState, val: unknown) => {
    setModuleState((s: WavesState | null) => ({
      ...(s || DEFAULT_STATE),
      [key]: val,
    }));
  };

  const setMediumParam = (key: keyof WavesState["medium"], val: number) => {
    setModuleState((s: WavesState | null) => ({
      ...(s || DEFAULT_STATE),
      medium: {
        ...((s && s.medium) || DEFAULT_STATE.medium),
        [key]: val,
      },
    }));
  };

  const setWaveParam = (
    wave: "wave1" | "wave2",
    key: keyof WaveParams,
    val: number | boolean,
  ) => {
    setModuleState((s: WavesState | null) => ({
      ...(s || DEFAULT_STATE),
      [wave]: {
        ...((s && s[wave]) || DEFAULT_STATE[wave]),
        [key]: val,
      },
    }));
  };

  const setHarmonicsParam = (
    key: keyof WavesState["harmonics"],
    val: number | boolean | string,
  ) => {
    setModuleState((s: WavesState | null) => ({
      ...(s || DEFAULT_STATE),
      harmonics: {
        ...((s && s.harmonics) || DEFAULT_STATE.harmonics),
        [key]: val,
      },
    }));
  };

  const setProbeParam = (
    key: keyof WavesState["probe"],
    val: number | boolean,
  ) => {
    setModuleState((s: WavesState | null) => ({
      ...(s || DEFAULT_STATE),
      probe: {
        ...((s && s.probe) || DEFAULT_STATE.probe),
        [key]: val,
      },
    }));
  };

  return {
    state,
    setParam,
    setWaveParam,
    setHarmonicsParam,
    setProbeParam,
    setMediumParam,
    reset,
  };
};
