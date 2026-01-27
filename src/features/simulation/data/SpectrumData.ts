export interface SpectrumPoint {
  x: number;
  y: number;
}

export interface MolecularSpectrum {
  id: string;
  name: string;
  formula: string;
  ir: SpectrumPoint[]; // Transmittance vs cm-1
  nmr: SpectrumPoint[]; // Intensity vs ppm
}

// Helper: Lorentzian Peak Generator
const addPeak = (
  points: { x: number; y: number }[],
  center: number,
  intensity: number,
  width: number,
  type: "IR" | "NMR",
) => {
  // IR: 4000-400. Width ~20-100.
  // NMR: 12-0. Width ~0.05.
  const range = type === "IR" ? 300 : 2.0;

  for (const p of points) {
    if (Math.abs(p.x - center) < range) {
      // Lorentz: I = Imax * (w/2)^2 / ((x-x0)^2 + (w/2)^2)
      const val =
        (intensity * Math.pow(width / 2, 2)) /
        (Math.pow(p.x - center, 2) + Math.pow(width / 2, 2));
      if (type === "IR") {
        p.y = Math.max(0, p.y - val); // IR is transmission (starts at 100, drops)
      } else {
        p.y += val; // NMR is emission/intensity (starts at 0, goes up)
      }
    }
  }
};

const generateIRBase = (): { x: number; y: number }[] => {
  const arr = [];
  for (let x = 4000; x >= 400; x -= 5) arr.push({ x, y: 100 }); // Baseline 100% T
  return arr;
};

const generateNMRBase = (): { x: number; y: number }[] => {
  const arr = [];
  for (let x = 12; x >= 0; x -= 0.01) arr.push({ x, y: 0 }); // Baseline 0
  return arr;
};

// --- DATA DEFINITIONS (REAL VALUES from SDBS/NIST) ---

// 1. ETHANOL (C2H5OH)
const ethanolIR = generateIRBase();
addPeak(ethanolIR, 3350, 40, 150, "IR"); // O-H stretch (broad)
addPeak(ethanolIR, 2970, 50, 30, "IR"); // C-H stretch (sp3)
addPeak(ethanolIR, 1050, 70, 40, "IR"); // C-O stretch

const ethanolNMR = generateNMRBase();
addPeak(ethanolNMR, 1.2, 3, 0.08, "NMR"); // CH3 (Triplet)
addPeak(ethanolNMR, 3.7, 2, 0.08, "NMR"); // CH2 (Quartet)
addPeak(ethanolNMR, 2.6, 1, 0.05, "NMR"); // OH (Singlet)
// Splitting simulation (rudimentary)
addPeak(ethanolNMR, 1.2 - 0.03, 1.5, 0.05, "NMR");
addPeak(ethanolNMR, 1.2 + 0.03, 1.5, 0.05, "NMR");
addPeak(ethanolNMR, 3.7 - 0.03, 0.5, 0.05, "NMR");
addPeak(ethanolNMR, 3.7 + 0.03, 0.5, 0.05, "NMR");
addPeak(ethanolNMR, 3.7 - 0.06, 0.2, 0.05, "NMR");
addPeak(ethanolNMR, 3.7 + 0.06, 0.2, 0.05, "NMR");

// 2. ACETONE (CH3COCH3)
const acetoneIR = generateIRBase();
addPeak(acetoneIR, 1715, 85, 25, "IR"); // C=O ketone (very strong)
addPeak(acetoneIR, 3000, 20, 20, "IR"); // C-H
addPeak(acetoneIR, 1360, 40, 20, "IR"); // CH3 bend

const acetoneNMR = generateNMRBase();
addPeak(acetoneNMR, 2.16, 6, 0.05, "NMR"); // CH3 (Singlet, 6H)

// 3. BENZENE (C6H6)
const benzeneIR = generateIRBase();
addPeak(benzeneIR, 3030, 30, 20, "IR"); // C-H (sp2)
addPeak(benzeneIR, 1480, 60, 20, "IR"); // C=C aromatic
addPeak(benzeneIR, 675, 90, 30, "IR"); // C-H oop bend

const benzeneNMR = generateNMRBase();
addPeak(benzeneNMR, 7.36, 6, 0.05, "NMR"); // Aromatic H (Singlet)

// 4. WATER (H2O)
const waterIR = generateIRBase();
addPeak(waterIR, 3400, 80, 200, "IR"); // O-H stretch
addPeak(waterIR, 1640, 50, 50, "IR"); // H-O-H bend

// 5. ETHYL ACETATE (C4H8O2)
const etacIR = generateIRBase();
addPeak(etacIR, 1740, 90, 25, "IR"); // C=O ester
addPeak(etacIR, 1240, 80, 40, "IR"); // C-O stretch
addPeak(etacIR, 2980, 40, 30, "IR"); // C-H

const etacNMR = generateNMRBase();
addPeak(etacNMR, 4.1, 2, 0.08, "NMR"); // O-CH2 (Quartet)
addPeak(etacNMR, 2.0, 3, 0.05, "NMR"); // CO-CH3 (Singlet)
addPeak(etacNMR, 1.2, 3, 0.08, "NMR"); // CH2-CH3 (Triplet)

export const SPECTRA_DATA: MolecularSpectrum[] = [
  {
    id: "ethanol",
    name: "Ethanol",
    formula: "C2H5OH",
    ir: ethanolIR,
    nmr: ethanolNMR,
  },
  {
    id: "acetone",
    name: "Aceton",
    formula: "C3H6O",
    ir: acetoneIR,
    nmr: acetoneNMR,
  },
  {
    id: "benzene",
    name: "Benzeen",
    formula: "C6H6",
    ir: benzeneIR,
    nmr: benzeneNMR,
  },
  {
    id: "etac",
    name: "Ethylacetaat",
    formula: "C4H8O2",
    ir: etacIR,
    nmr: etacNMR,
  },
  { id: "water", name: "Water", formula: "H2O", ir: waterIR, nmr: [] },
];
