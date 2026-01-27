/**
 * bioConstants.ts
 * Centralized biological constants from peer-reviewed sources
 *
 * Sources:
 * - Campbell Biology, 12th Edition (Urry et al., 2020)
 * - Guyton and Hall Textbook of Medical Physiology, 14th Edition
 * - McSharry et al. (2003) - ECG synthesis model
 */

// ============================================
// CARDIOVASCULAR PHYSIOLOGY
// ============================================

export const CARDIOVASCULAR = {
  // Normal ranges (resting adult)
  HEART_RATE: { min: 60, max: 100, unit: "bpm" },
  BLOOD_PRESSURE_SYSTOLIC: { min: 90, max: 120, unit: "mmHg" },
  BLOOD_PRESSURE_DIASTOLIC: { min: 60, max: 80, unit: "mmHg" },
  STROKE_VOLUME: { min: 60, max: 100, avg: 70, unit: "mL" },
  CARDIAC_OUTPUT: { min: 4, max: 8, avg: 5, unit: "L/min" },

  // ECG timing (at 60 bpm baseline)
  ECG_INTERVALS: {
    P_WAVE_DURATION: 0.08, // seconds
    PR_INTERVAL: 0.16, // seconds
    QRS_COMPLEX: 0.08, // seconds
    QT_INTERVAL: 0.4, // seconds
    RR_INTERVAL: 1.0, // seconds at 60 bpm
  },

  // ECG amplitudes (mV)
  ECG_AMPLITUDES: {
    P_WAVE: 0.15,
    Q_WAVE: -0.1,
    R_WAVE: 1.0,
    S_WAVE: -0.25,
    T_WAVE: 0.3,
  },
};

// ============================================
// CELL BIOLOGY (Campbell Biology, 12th Ed.)
// ============================================

export const CELL_COMPOSITION = {
  // Animal cell (% of cell volume)
  ANIMAL: {
    cytoplasm: 54,
    mitochondria: 22,
    nucleus: 10,
    endoplasmic_reticulum: 9,
    golgi: 3,
    lysosomes: 1,
    peroxisomes: 1,
  },

  // Plant cell (% of cell volume)
  PLANT: {
    vacuole: 50, // Can be 30-90% in mature cells
    cytoplasm: 20,
    chloroplasts: 15,
    nucleus: 8,
    endoplasmic_reticulum: 4,
    mitochondria: 2,
    golgi: 1,
  },
};

// Organelle dimensions (micrometers)
export const ORGANELLE_DIMENSIONS = {
  nucleus: { diameter: { min: 5, max: 10 }, unit: "μm" },
  mitochondria: {
    length: { min: 1, max: 10 },
    width: { min: 0.5, max: 1 },
    unit: "μm",
  },
  chloroplast: { diameter: { min: 4, max: 6 }, unit: "μm" },
  ribosome: { diameter: 0.025, unit: "μm" },
  lysosome: { diameter: { min: 0.1, max: 1.2 }, unit: "μm" },
};

// ============================================
// ECOLOGY (Lotka-Volterra Parameters)
// ============================================

export const ECOLOGY_DEFAULTS = {
  // Realistic parameter ranges based on field studies
  PREY_GROWTH_RATE: { min: 0.05, max: 0.5, default: 0.1 }, // α (per day)
  PREDATION_RATE: { min: 0.001, max: 0.05, default: 0.01 }, // β
  PREDATOR_EFFICIENCY: { min: 0.001, max: 0.1, default: 0.05 }, // δ
  PREDATOR_MORTALITY: { min: 0.01, max: 0.3, default: 0.1 }, // γ (per day)
  CARRYING_CAPACITY: { min: 50, max: 1000, default: 200 }, // K
};

// ============================================
// RESPIRATORY PHYSIOLOGY
// ============================================

export const RESPIRATORY = {
  RESPIRATORY_RATE: { min: 12, max: 20, avg: 15, unit: "breaths/min" },
  TIDAL_VOLUME: { avg: 500, unit: "mL" },
  VITAL_CAPACITY: { min: 3000, max: 5000, unit: "mL" },
  OXYGEN_SATURATION: { min: 95, max: 100, unit: "%" },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate Mean Arterial Pressure (MAP)
 * Formula: MAP = DBP + 1/3(SBP - DBP)
 */
export const calculateMAP = (systolic: number, diastolic: number): number => {
  return diastolic + (1 / 3) * (systolic - diastolic);
};

/**
 * Calculate Cardiac Output
 * Formula: CO = HR × SV (in L/min)
 */
export const calculateCardiacOutput = (
  heartRate: number,
  strokeVolume: number = 70,
): number => {
  return (heartRate * strokeVolume) / 1000;
};

/**
 * Estimate Stroke Volume based on heart rate (simplified)
 * Decreases slightly at higher heart rates due to reduced filling time
 */
export const estimateStrokeVolume = (heartRate: number): number => {
  // Based on Frank-Starling mechanism
  const baselineSV = 70;
  if (heartRate <= 70) return baselineSV;
  if (heartRate >= 180) return 50;
  // Linear interpolation
  return baselineSV - ((heartRate - 70) / 110) * 20;
};

/**
 * Generate realistic ECG waveform point
 * Based on McSharry et al. (2003) model simplified
 */
export const generateECGPoint = (t: number, heartRate: number): number => {
  const period = 60 / heartRate;
  const phase = (t % period) / period;

  // PQRST wave positions within one heartbeat cycle
  const pStart = 0.0,
    pEnd = 0.1;
  const qStart = 0.15,
    qEnd = 0.18;
  const rStart = 0.18,
    rEnd = 0.22;
  const sStart = 0.22,
    sEnd = 0.25;
  const tStart = 0.35,
    tEnd = 0.5;

  let voltage = 0;

  // P wave (atrial depolarization)
  if (phase >= pStart && phase <= pEnd) {
    const x = (phase - pStart) / (pEnd - pStart);
    voltage = CARDIOVASCULAR.ECG_AMPLITUDES.P_WAVE * Math.sin(x * Math.PI);
  }
  // Q wave
  else if (phase >= qStart && phase <= qEnd) {
    const x = (phase - qStart) / (qEnd - qStart);
    voltage = CARDIOVASCULAR.ECG_AMPLITUDES.Q_WAVE * Math.sin(x * Math.PI);
  }
  // R wave (ventricular depolarization peak)
  else if (phase >= rStart && phase <= rEnd) {
    const x = (phase - rStart) / (rEnd - rStart);
    voltage = CARDIOVASCULAR.ECG_AMPLITUDES.R_WAVE * Math.sin(x * Math.PI);
  }
  // S wave
  else if (phase >= sStart && phase <= sEnd) {
    const x = (phase - sStart) / (sEnd - sStart);
    voltage = CARDIOVASCULAR.ECG_AMPLITUDES.S_WAVE * Math.sin(x * Math.PI);
  }
  // T wave (ventricular repolarization)
  else if (phase >= tStart && phase <= tEnd) {
    const x = (phase - tStart) / (tEnd - tStart);
    voltage = CARDIOVASCULAR.ECG_AMPLITUDES.T_WAVE * Math.sin(x * Math.PI);
  }

  // Add small baseline noise for realism
  voltage += (Math.random() - 0.5) * 0.02;

  return voltage;
};

/**
 * Calculate sympathetic/parasympathetic balance
 * Based on heart rate variability principles
 */
export const calculateANSBalance = (
  heartRate: number,
): { sympathetic: number; parasympathetic: number } => {
  // Resting HR ~60-70 = parasympathetic dominant
  // Exercise HR >100 = sympathetic dominant
  const restingHR = 65;
  const maxHR = 200;

  // Sympathetic activation increases with HR above baseline
  const sympathetic = Math.min(
    100,
    Math.max(0, ((heartRate - restingHR) / (maxHR - restingHR)) * 100),
  );
  const parasympathetic = 100 - sympathetic;

  return { sympathetic, parasympathetic };
};
