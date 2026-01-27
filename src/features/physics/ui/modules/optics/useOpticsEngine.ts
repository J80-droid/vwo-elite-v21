import { useCallback, useEffect, useMemo } from "react";

import { useModuleState } from "../../../hooks/usePhysicsLabContext";

export interface OpticalElement {
  id: string;
  type: "lens" | "screen" | "retina";
  x: number; // Positie op rail (mm)
  f: number; // Brandpuntsafstand (mm)
  h: number; // Hoogte/Diameter (mm)
  label?: string;
}

export interface OpticsState {
  mode: "simple" | "lensmaker";
  scenario: "single" | "system" | "eye" | "correction";

  focalLength: number; // Primary lens f (f1)

  // Lensmaker Mode
  refractiveIndex: number;
  curvatureRadius: number;

  // Common
  objectDistance: number;
  objectHeight: number;
  lensType: "convex" | "concave";

  // Multi-Lens / Eye Props
  lens2FocalLength?: number;
  lens2Distance?: number;
  lens2Type?: "convex" | "concave";

  eyeAccommodation?: number;
  eyeLength?: number;

  glassesDiopters?: number; // S (dpt) for correction mode

  // Visuals
  showRays: boolean;
  showLasers: boolean;
  showGrid: boolean;
  showValues: boolean;
  showFormula?: boolean;
  showDispersion?: boolean;
  showGraph?: boolean;
}

// Berekende waarden (output only)
export interface OpticsDerived {
  // Single / Lens 1
  f1: number;
  v1: number;
  m1: number;
  S: number; // Toegevoegd voor compatibility
  hasImage1: boolean;
  image1X: number; // Absolute positie op rail
  isVirtual: boolean; // Alias voor isVirtual1 (compat)

  // Lens 2 (indien van toepassing)
  f2?: number;
  u2?: number; // Voorwerpsafstand voor lens 2 (t.o.v. beeld 1)
  v2?: number;
  m2?: number;
  mTotal?: number;
  hasImage2?: boolean;
  image2X?: number;
  isVirtual2?: boolean;

  // Eye properties
  requiredF?: number; // Wat f zou moeten zijn voor scherp beeld
  isBlurred?: boolean;
  visus?: number;
  refractionErrorDpt?: number;
  eyeStatus?: "Normal" | "Myopia" | "Hypermetropia";
}

const DEFAULT_STATE: OpticsState = {
  mode: "simple",
  scenario: "single",
  focalLength: 100,
  refractiveIndex: 1.5,
  curvatureRadius: 100,
  objectDistance: 200,
  objectHeight: 60,
  lensType: "convex",

  lens2FocalLength: 100,
  lens2Distance: 300,
  lens2Type: "convex",

  eyeAccommodation: 50,
  eyeLength: 50,
  glassesDiopters: 0,

  showRays: true,
  showLasers: false,
  showGrid: true,
  showValues: true,
  showFormula: true,
  showDispersion: false,
};

export const useOpticsEngine = () => {
  const [moduleState, setModuleState] = useModuleState<OpticsState>("optics");

  // Merge defaults veilig
  const state: OpticsState = useMemo(
    () => ({ ...DEFAULT_STATE, ...moduleState }),
    [moduleState],
  );

  // Initialisatie check
  useEffect(() => {
    if (moduleState.focalLength === undefined) {
      setModuleState(DEFAULT_STATE);
    }
  }, [moduleState.focalLength, setModuleState]);

  const reset = useCallback(() => {
    setModuleState(DEFAULT_STATE);
  }, [setModuleState]);

  const setParam = <K extends keyof OpticsState>(
    key: K,
    val: OpticsState[K],
  ) => {
    setModuleState((s: OpticsState) => ({ ...s, [key]: val }));
  };

  // --- CENTRALE FYSICA ENGINE ---
  const derived = useMemo<OpticsDerived>(() => {
    const {
      focalLength,
      objectDistance: u1,
      // objectHeight, // Unused
      lensType,
      mode,
      refractiveIndex,
      curvatureRadius,
      scenario,
      lens2FocalLength = 100,
      lens2Distance = 300,
      lens2Type = "convex",
    } = state;

    // --- STAP 1: LENS 1 ---
    let f1 = focalLength;

    if (mode === "lensmaker") {
      const n = Math.max(1.01, refractiveIndex);
      // Lensmaker formule benadering
      f1 = curvatureRadius / (2 * (n - 1));
      // Bij Lensmaker bepaalt lensType (convex/concave) het teken van R en dus f
      if (lensType === "concave") f1 = -Math.abs(f1);
    } else {
      // SIMPLE MODE
      if (scenario === "correction") {
        // In correction mode, glassesDiopters (S) is the primary input.
        // S = 1000 / f -> f = 1000 / S
        const S_glasses = state.glassesDiopters || 0;
        if (Math.abs(S_glasses) < 0.01) {
          f1 = 1e6; // Effectively flat glass (f = infinity)
        } else {
          f1 = 1000 / S_glasses;
        }
      } else {
        // In single/system/eye mode is de slider altijd positief (magnitude),
        // en bepaalt lensType het teken.
        f1 = Math.abs(focalLength);
        if (lensType === "concave") f1 = -f1;
      }
    }

    // Lensformule 1
    // 1/v1 = 1/f1 - 1/u1
    let v1 = Infinity;
    let m1 = 0;

    if (Math.abs(u1 - f1) > 0.1) {
      v1 = (u1 * f1) / (u1 - f1);
      m1 = f1 / (f1 - u1);
      // BEVEILIGING: Cap de vergroting
      if (Math.abs(m1) > 100) m1 = Math.sign(m1) * 100;
    }

    const hasImage1 = Number.isFinite(v1);
    const image1X = v1; // Relatief t.o.v. Lens 1 (op x=0)
    const isVirtual = v1 < 0;

    // Current diopters S
    // In correction mode we use the provided state value for accuracy/UX
    const S =
      scenario === "correction" ? state.glassesDiopters || 0 : 1000 / f1;

    // Default result (Single Lens)
    const result: OpticsDerived = {
      f1,
      v1,
      m1,
      S,
      hasImage1,
      image1X,
      isVirtual,
    };

    // --- STAP 2: LENS SYSTEMEN ---
    if (scenario === "system") {
      // Lens 2 staat op x = lens2Distance.
      // Beeld 1 is het (virtuele) voorwerp voor Lens 2.
      // Positie beeld 1 = v1.
      // Afstand object tot lens 2 (u2) = (Positie Lens 2) - (Positie Beeld 1)
      // LET OP BORDJES:
      // Als beeld 1 REËEL is (v1 > 0), staat het rechts van lens 1.
      // Als v1 < lens2Distance, staat het VÓÓR lens 2. Dit is een reëel voorwerp voor lens 2?
      // Nee, het licht komt van links.
      // Afstand u2 = lens2Distance - v1.

      const u2 = lens2Distance - v1;
      let f2_val = Math.abs(lens2FocalLength);
      if (lens2Type === "concave") f2_val = -f2_val;

      let v2 = Infinity;
      let m2 = 0;

      if (Math.abs(u2 - f2_val) > 0.1) {
        v2 = (u2 * f2_val) / (u2 - f2_val);
        m2 = f2_val / (f2_val - u2);
        // BEVEILIGING: Cap de vergroting
        if (Math.abs(m2) > 100) m2 = Math.sign(m2) * 100;
      }

      result.f2 = f2_val;
      result.u2 = u2;
      result.v2 = v2;
      result.m2 = m2;
      const mTotal = m1 * m2;
      result.mTotal =
        Math.abs(mTotal) > 1000 ? Math.sign(mTotal) * 1000 : mTotal; // Cap total magnification higher
      result.hasImage2 = Number.isFinite(v2);
      result.image2X = lens2Distance + v2; // Absolute positie
      result.isVirtual2 = v2 < 0;
    }

    // --- STAP 3: OOG & CORRECTIE ---
    if (scenario === "eye" || scenario === "correction") {
      const v_eye = state.eyeLength || 50; // Vaste afstand lens-netvlies

      // In Eye mode, f1 is de ooglens (accommodatie).
      // v1 is de beeldafstand.
      // Als v1 == v_eye -> scherp.

      // Bereken radius van blur circle op netvlies
      // Geometrie: R_blur / D_pupil = |v - v_eye| / v
      // Laat D_pupil = 5mm (willekeurige schaal)
      // Als v1 = Infinity, is blur = D_pupil.

      let blurRadius = 0;
      if (Number.isFinite(v1)) {
        blurRadius = (5 * Math.abs(v1 - v_eye)) / Math.abs(v1);
      } else {
        blurRadius = 5;
      }

      // Correction logic:
      // Een bril staat op vaste afstand d_glasses (bijv 15mm) VOOR het oog.
      // Systeem: Bril -> (15mm) -> Oog -> (50mm) -> Netvlies.
      // Dit is eigenlijk een 2-lens systeem!
      // Lens 1 = Bril (f_bril).
      // Lens 2 = Oog (f_oog).
      // Afstand d = 15.

      if (scenario === "correction") {
        // Swap logic: f1 is nu de bril, f2 is het oog.
        // Maar in de state is focalLength de "hoofdlens".
        // Laten we afspreken:
        // In 'correction' mode:
        // Lens 1 = Bril (focalLength, variabele S bril).
        // Lens 2 = Oog (eyeAccommodation, variabele f oog).
        // Afstand = 15mm.

        // const f_bril = f1; // focalLength slider is nu brilsterkte
        const f_oog = state.eyeAccommodation || 50;
        const d_glasses = 15;

        // Berekening Lens 1 (Bril)
        // v_bril, m_bril al berekend als v1, m1 hierboven (met f1=f_bril).

        // Lens 2 (Oog)
        const u_oog = d_glasses - v1;

        let v_total = Infinity;
        if (Math.abs(u_oog - f_oog) > 0.1) {
          v_total = (u_oog * f_oog) / (u_oog - f_oog);
        }

        // Blur op netvlies (v_eye)
        if (Number.isFinite(v_total)) {
          blurRadius = (5 * Math.abs(v_total - v_eye)) / Math.abs(v_total);
        } else {
          blurRadius = 5;
        }

        // Output mapping
        // We willen de resultaten van het hele systeem zien
        result.f2 = f_oog; // Oog
        result.v2 = v_total; // Waar valt het beeld
        result.isBlurred = blurRadius > 0.5; // Drempelwaarde

        // Visus benadering: Visus = 1 / (1 + 2 * blurRadius)
        // Bij blurRadius = 0 -> Visus = 1.0
        // Bij blurRadius = 1 -> Visus = 0.33
        result.visus = Math.max(0.1, Math.min(1.0, 1 / (1 + 2 * blurRadius)));

        // Refraction Error: Sterkte ooglens (dpt) - Vereiste sterkte ooglens (dpt)
        // 1/f_req = 1/u_oog + 1/v_eye
        const f_req = (u_oog * v_eye) / (u_oog + v_eye);
        const s_req = 1000 / f_req;
        const s_actual = 1000 / f_oog;
        result.refractionErrorDpt = s_actual - s_req;

        // Eye Status
        if (Math.abs(result.refractionErrorDpt) < 0.25)
          result.eyeStatus = "Normal";
        else if (result.refractionErrorDpt < 0) result.eyeStatus = "Myopia";
        else result.eyeStatus = "Hypermetropia";

        // Uitleg: "f1" is hier de bril. "v1" is beeld na bril.
      } else {
        // Gewoon Oog (geen bril)
        // f1 is de ooglens.
        result.requiredF = (u1 * v_eye) / (u1 + v_eye); // Lensformule omgeschreven
        result.isBlurred = blurRadius > 0.5;
      }
    }

    return result;
  }, [state]);

  return { state, derived, setParam, reset };
};
