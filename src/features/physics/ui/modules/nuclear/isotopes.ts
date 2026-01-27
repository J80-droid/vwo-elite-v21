export interface EnergyLevel {
  energy: number; // MeV boven grondtoestand
  label: string;
}

export interface Transition {
  fromLevel: number; // index in levels array
  toLevel: number;
  particle: "alpha" | "beta" | "gamma" | "positron";
  intensity?: number; // % kans (optioneel voor weergave dikte pijl)
}

export interface IsotopeVisualSpecs {
  equation: {
    daughterSymbol?: string;
    particleSymbol?: string;
    showNeutrino?: boolean;
  };
  range: {
    alpha: { width: number; label: string };
    beta: { width: number; label: string };
    gamma: { width: number; label: string };
  };
}

export interface Isotope {
  id: string;
  name: string;
  symbol: string;
  Z: number;
  daughterZ: number;
  halfLife: number;
  decayMode: "alpha" | "beta_minus" | "beta_plus" | "gamma";
  mass: number;
  bindingEnergyPerNucleon: number; // NIEUW: Echte waarde in MeV
  daughterSymbol: string;
  daughterMass: number;
  scheme: {
    levels: EnergyLevel[];
    transitions: Transition[];
  };
  specs: IsotopeVisualSpecs;
}

// NOTE: Added export to defaultSpecs to maintain compatibility with IsotopeBuilderModal
export const defaultSpecs = (mode: string): IsotopeVisualSpecs => {
  const isAlpha = mode === "alpha";
  const isBeta = mode.startsWith("beta");
  const isGamma = mode === "gamma";
  return {
    equation: {},
    range: {
      alpha: { width: isAlpha ? 10 : 0, label: isAlpha ? "0.05 mm" : "-" },
      beta: { width: isBeta ? 40 : 0, label: isBeta ? "~5 mm" : "-" },
      gamma: { width: isGamma ? 95 : 0, label: isGamma ? "> 15 cm" : "-" },
    },
  };
};

export const ISOTOPE_LIBRARY: Record<string, Isotope> = {
  c14: {
    id: "c14",
    name: "Koolstof-14",
    symbol: "14C",
    Z: 6,
    daughterZ: 7,
    halfLife: 5730 * 365.25 * 24 * 3600,
    decayMode: "beta_minus",
    mass: 14.003241,
    bindingEnergyPerNucleon: 7.52,
    daughterSymbol: "14N",
    daughterMass: 14.003074,
    scheme: {
      levels: [
        { energy: 0.156, label: "14C" },
        { energy: 0, label: "14N (grond)" },
      ],
      transitions: [
        { fromLevel: 0, toLevel: 1, particle: "beta", intensity: 100 },
      ],
    },
    specs: {
      ...defaultSpecs("beta_minus"),
      range: {
        alpha: { width: 0, label: "-" },
        beta: { width: 25, label: "~2 mm" },
        gamma: { width: 0, label: "-" },
      },
    },
  },
  sr90: {
    id: "sr90",
    name: "Strontium-90",
    symbol: "90Sr",
    Z: 38,
    daughterZ: 39,
    halfLife: 28.8 * 365.25 * 24 * 3600,
    decayMode: "beta_minus",
    mass: 89.907738,
    bindingEnergyPerNucleon: 8.69,
    daughterSymbol: "90Y",
    daughterMass: 89.907151,
    scheme: {
      levels: [
        { energy: 0.546, label: "90Sr" },
        { energy: 0, label: "90Y (grond)" },
      ],
      transitions: [
        { fromLevel: 0, toLevel: 1, particle: "beta", intensity: 100 },
      ],
    },
    specs: {
      ...defaultSpecs("beta_minus"),
      range: {
        alpha: { width: 0, label: "-" },
        beta: { width: 60, label: "~10 mm" },
        gamma: { width: 0, label: "-" },
      },
    },
  },
  i131: {
    id: "i131",
    name: "Jodium-131",
    symbol: "131I",
    Z: 53,
    daughterZ: 54,
    halfLife: 8.02 * 24 * 3600,
    decayMode: "beta_minus",
    mass: 130.906124,
    bindingEnergyPerNucleon: 8.42,
    daughterSymbol: "131Xe",
    daughterMass: 130.905082,
    scheme: {
      // Vereenvoudigd: 131I vervalt vaak naar excited 131Xe (o.a. 0.364 MeV gamma)
      levels: [
        { energy: 0.971, label: "131I" },
        { energy: 0.364, label: "131Xe*" },
        { energy: 0, label: "131Xe" },
      ],
      transitions: [
        { fromLevel: 0, toLevel: 1, particle: "beta", intensity: 89 },
        { fromLevel: 1, toLevel: 2, particle: "gamma", intensity: 81 },
      ],
    },
    specs: defaultSpecs("beta_minus"),
  },
  am241: {
    id: "am241",
    name: "Americium-241",
    symbol: "241Am",
    Z: 95,
    daughterZ: 93,
    halfLife: 432.2 * 365.25 * 24 * 3600,
    decayMode: "alpha",
    mass: 241.056829,
    bindingEnergyPerNucleon: 7.54,
    daughterSymbol: "237Np",
    daughterMass: 237.048173,
    scheme: {
      levels: [
        { energy: 5.486, label: "241Am" },
        { energy: 0.06, label: "237Np*" }, // 59.5 keV level (bekende gamma bron)
        { energy: 0, label: "237Np" },
      ],
      transitions: [
        { fromLevel: 0, toLevel: 1, particle: "alpha", intensity: 85 },
        { fromLevel: 1, toLevel: 2, particle: "gamma", intensity: 36 }, // 59.5 keV gamma
      ],
    },
    specs: {
      ...defaultSpecs("alpha"),
      range: {
        alpha: { width: 8, label: "0.04 mm" },
        beta: { width: 0, label: "-" },
        gamma: { width: 0, label: "-" },
      },
    },
  },
  co60: {
    id: "co60",
    name: "Kobalt-60",
    symbol: "60Co",
    Z: 27,
    daughterZ: 28,
    halfLife: 5.27 * 365.25 * 24 * 3600,
    decayMode: "beta_minus",
    mass: 59.933817,
    bindingEnergyPerNucleon: 8.76, // Hoge bindingsenergie (vlakbij Fe-56)
    daughterSymbol: "60Ni",
    daughterMass: 59.930786,
    scheme: {
      levels: [
        { energy: 2.823, label: "60Co" },
        { energy: 2.505, label: "60Ni (4+)" },
        { energy: 1.332, label: "60Ni (2+)" },
        { energy: 0, label: "60Ni (gs)" },
      ],
      transitions: [
        { fromLevel: 0, toLevel: 1, particle: "beta", intensity: 99 },
        { fromLevel: 1, toLevel: 2, particle: "gamma", intensity: 100 },
        { fromLevel: 2, toLevel: 3, particle: "gamma", intensity: 100 },
      ],
    },
    specs: {
      equation: {
        daughterSymbol: "60Ni",
        particleSymbol: "e",
        showNeutrino: true,
      },
      range: {
        alpha: { width: 0, label: "-" },
        beta: { width: 40, label: "~4 mm" },
        gamma: { width: 100, label: ">> 20 cm" },
      },
    },
  },
  f18: {
    id: "f18",
    name: "Fluor-18 (PET)",
    symbol: "18F",
    Z: 9,
    daughterZ: 8,
    halfLife: 109.7 * 60,
    decayMode: "beta_plus",
    mass: 18.000938,
    bindingEnergyPerNucleon: 7.63,
    daughterSymbol: "18O",
    daughterMass: 17.999161,
    scheme: {
      levels: [
        { energy: 0.634, label: "18F" },
        { energy: 0, label: "18O" },
      ],
      transitions: [
        { fromLevel: 0, toLevel: 1, particle: "positron", intensity: 97 },
      ],
    },
    specs: defaultSpecs("beta_plus"),
  },
  tc99m: {
    id: "tc99m",
    name: "Technetium-99m",
    symbol: "99mTc",
    Z: 43,
    daughterZ: 43,
    halfLife: 6.01 * 3600,
    decayMode: "gamma",
    mass: 98.906255,
    bindingEnergyPerNucleon: 8.61,
    daughterSymbol: "99Tc",
    daughterMass: 98.906255,
    scheme: {
      levels: [
        { energy: 0.142, label: "99mTc" },
        { energy: 0, label: "99Tc" },
      ],
      transitions: [
        { fromLevel: 0, toLevel: 1, particle: "gamma", intensity: 100 },
      ],
    },
    specs: defaultSpecs("gamma"),
  },
  u238: {
    id: "u238",
    name: "Uranium-238",
    symbol: "238U",
    Z: 92,
    daughterZ: 90,
    halfLife: 4.468e9 * 365.25 * 24 * 3600,
    decayMode: "alpha",
    mass: 238.050788,
    bindingEnergyPerNucleon: 7.57,
    daughterSymbol: "234Th",
    daughterMass: 234.043601,
    scheme: {
      levels: [
        { energy: 4.27, label: "238U" },
        { energy: 0.05, label: "234Th*" },
        { energy: 0, label: "234Th" },
      ],
      transitions: [
        { fromLevel: 0, toLevel: 1, particle: "alpha", intensity: 79 },
        { fromLevel: 1, toLevel: 2, particle: "gamma", intensity: 100 },
      ],
    },
    specs: defaultSpecs("alpha"),
  },
};

export interface ShieldMaterial {
  id: string;
  name: string;
  dHalf: number;
  color: string;
}

export const SHIELDING_MATERIALS: Record<string, ShieldMaterial> = {
  lead: { id: "lead", name: "Lood", dHalf: 13, color: "#475569" },
  concrete: { id: "concrete", name: "Beton", dHalf: 65, color: "#94a3b8" },
  water: { id: "water", name: "Water", dHalf: 100, color: "#3b82f6" },
  al: { id: "al", name: "Aluminium", dHalf: 42, color: "#cbd5e1" },
};

export const CUSTOM_ISOTOPE_ID = "custom";
