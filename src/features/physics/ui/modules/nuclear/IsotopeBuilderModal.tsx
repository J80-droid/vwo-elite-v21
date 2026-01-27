import { AlertTriangle, Atom, Save, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { defaultSpecs, Isotope } from "./isotopes";

// --- CONSTANTEN ---
const MP = 1.007276466621;
const MN = 1.00866491588;
const U_TO_MEV = 931.4941;
const PARTICLE_MASSES = {
  alpha: 4.001506,
  beta_minus: 0.0005486,
  beta_plus: 0.0005486,
  gamma: 0,
};

const ELEMENT_DATA: Record<number, string> = {
  1: "H",
  2: "He",
  3: "Li",
  4: "Be",
  5: "B",
  6: "C",
  7: "N",
  8: "O",
  9: "F",
  10: "Ne",
  11: "Na",
  12: "Mg",
  13: "Al",
  14: "Si",
  15: "P",
  16: "S",
  17: "Cl",
  18: "Ar",
  19: "K",
  20: "Ca",
  21: "Sc",
  22: "Ti",
  23: "V",
  24: "Cr",
  25: "Mn",
  26: "Fe",
  27: "Co",
  28: "Ni",
  29: "Cu",
  30: "Zn",
  31: "Ga",
  32: "Ge",
  33: "As",
  34: "Se",
  35: "Br",
  36: "Kr",
  37: "Rb",
  38: "Sr",
  39: "Y",
  40: "Zr",
  41: "Nb",
  42: "Mo",
  43: "Tc",
  44: "Ru",
  45: "Rh",
  46: "Pd",
  47: "Ag",
  48: "Cd",
  49: "In",
  50: "Sn",
  51: "Sb",
  52: "Te",
  53: "I",
  54: "Xe",
  55: "Cs",
  56: "Ba",
  57: "La",
  58: "Ce",
  59: "Pr",
  60: "Nd",
  61: "Pm",
  62: "Sm",
  63: "Eu",
  64: "Gd",
  65: "Tb",
  66: "Dy",
  67: "Ho",
  68: "Er",
  69: "Tm",
  70: "Yb",
  71: "Lu",
  72: "Hf",
  73: "Ta",
  74: "W",
  75: "Re",
  76: "Os",
  77: "Ir",
  78: "Pt",
  79: "Au",
  80: "Hg",
  81: "Tl",
  82: "Pb",
  83: "Bi",
  84: "Po",
  85: "At",
  86: "Rn",
  87: "Fr",
  88: "Ra",
  89: "Ac",
  90: "Th",
  91: "Pa",
  92: "U",
  93: "Np",
  94: "Pu",
  95: "Am",
  96: "Cm",
  97: "Bk",
  98: "Cf",
  99: "Es",
  100: "Fm",
  101: "Md",
  102: "No",
  103: "Lr",
  104: "Rf",
  105: "Db",
  106: "Sg",
  107: "Bh",
  108: "Hs",
  109: "Mt",
  110: "Ds",
  111: "Rg",
  112: "Cn",
  113: "Nh",
  114: "Fl",
  115: "Mc",
  116: "Lv",
  117: "Ts",
  118: "Og",
};

const calculateBindingEnergyPerNucleon = (A: number, Z: number): number => {
  if (A <= 1) return 0;
  const N = A - Z;
  const av = 15.8;
  const as = 18.3;
  const ac = 0.714;
  const aa = 23.2;
  const ap = 12.0;
  const ev = av * A;
  const es = as * Math.pow(A, 2 / 3);
  const ec = ac * ((Z * (Z - 1)) / Math.pow(A, 1 / 3));
  const ea = aa * (Math.pow(A - 2 * Z, 2) / A);
  let ep = 0;
  if (Z % 2 === 0 && N % 2 === 0) ep = ap / Math.sqrt(A);
  else if (Z % 2 !== 0 && N % 2 !== 0) ep = -ap / Math.sqrt(A);
  return Math.max(0, (ev - es - ec - ea + ep) / A);
};

const getAtomicMass = (A: number, Z: number): number => {
  const bePerN = calculateBindingEnergyPerNucleon(A, Z);
  return Z * MP + (A - Z) * MN - (A * bePerN) / U_TO_MEV;
};

export const IsotopeBuilderModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (iso: Isotope) => void;
}> = ({ isOpen, onClose, onSave }) => {
  const [z, setZ] = useState(40);
  const [mass, setMass] = useState(100);
  const [halfLife, setHalfLife] = useState(60);
  const [decayMode, setDecayMode] = useState<
    "alpha" | "beta_minus" | "beta_plus" | "gamma"
  >("beta_minus");
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const symbol = ELEMENT_DATA[z] || "??";
  const currentBE = calculateBindingEnergyPerNucleon(mass, z);

  useEffect(() => {
    if (z > 118) setError("Atoomnummer Z > 118 is niet valide.");
    else if (mass < z)
      setError("Massa (A) kan niet kleiner zijn dan protonen (Z).");
    else if (z < 1) setError("Minimaal 1 proton vereist.");
    else if (halfLife <= 0) setError("Halveringstijd moet positief zijn.");
    else setError(null);
  }, [z, mass, halfLife]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (error) return;

    let dZ = z;
    let dMass = mass;
    if (decayMode === "alpha") {
      dZ = z - 2;
      dMass = mass - 4;
    } else if (decayMode === "beta_minus") {
      dZ = z + 1;
    } else if (decayMode === "beta_plus") {
      dZ = z - 1;
    }

    const pM = getAtomicMass(mass, z);
    const dM = getAtomicMass(dMass, dZ);
    const qValue = Math.max(
      0.1,
      (pM - (dM + PARTICLE_MASSES[decayMode])) * U_TO_MEV,
    );

    const daughterSym = ELEMENT_DATA[dZ] || "Unk";
    const particleType =
      decayMode === "alpha"
        ? "alpha"
        : decayMode === "gamma"
          ? "gamma"
          : decayMode === "beta_plus"
            ? "positron"
            : "beta";

    onSave({
      // eslint-disable-next-line react-hooks/purity
      id: `custom-${symbol}-${mass}-${Date.now()}`,
      name: `Custom ${symbol}-${mass}`,
      symbol: `${mass}${symbol}`,
      mass: pM,
      Z: z,
      daughterZ: dZ,
      daughterMass: dM,
      daughterSymbol: `${dMass}${daughterSym}`,
      decayMode,
      halfLife,
      bindingEnergyPerNucleon: currentBE,
      scheme: {
        levels: [
          { energy: qValue, label: `${mass}${symbol}` },
          { energy: 0.0, label: `${dMass}${daughterSym}` },
        ],
        transitions: [{ fromLevel: 0, toLevel: 1, particle: particleType }],
      },
      specs: defaultSpecs(decayMode),
    });
    onClose();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="bg-[#0f172a] border border-white/10 rounded-3xl w-[420px] shadow-2xl p-8 relative overflow-hidden">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/30">
              <Atom className="text-emerald-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tighter uppercase">
                Elite Designer
              </h2>
              <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">
                Nucleaire Synthese v2.2
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-black/40 rounded-2xl p-4 border border-white/5 space-y-4">
            <div className="flex items-center justify-center gap-6">
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-widest">
                  Bron
                </span>
                <div className="flex gap-1">
                  <div className="flex flex-col text-[10px] font-mono text-emerald-500/80 font-bold leading-none justify-center">
                    <span>{mass}</span>
                    <span>{z}</span>
                  </div>
                  <span className="text-4xl font-black text-white">
                    {symbol}
                  </span>
                </div>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-widest">
                  Bindingsenergie
                </span>
                <span className="text-xl font-mono font-bold text-blue-400">
                  {currentBE.toFixed(3)}{" "}
                  <span className="text-[8px] text-blue-500/50">MeV/n</span>
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                Protonen (Z)
              </label>
              <input
                type="number"
                value={z}
                onChange={(e) => setZ(parseInt(e.target.value) || 0)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white font-mono focus:border-emerald-500 outline-none transition-all text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                Massa (A)
              </label>
              <input
                type="number"
                value={mass}
                onChange={(e) => setMass(parseInt(e.target.value) || 0)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white font-mono focus:border-emerald-500 outline-none transition-all text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                T½ (s)
              </label>
              <input
                type="number"
                value={halfLife}
                onChange={(e) => setHalfLife(parseFloat(e.target.value) || 0)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white font-mono focus:border-emerald-500 outline-none transition-all text-sm"
              />
            </div>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex items-center gap-3">
              <AlertTriangle size={18} className="text-rose-500" />
              <span className="text-xs font-bold text-rose-200">{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {(["alpha", "beta_minus", "beta_plus", "gamma"] as const).map(
              (mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setDecayMode(mode)}
                  className={`py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${decayMode === mode ? "bg-emerald-500 text-black border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "bg-white/5 text-slate-500 border-white/5"}`}
                >
                  {mode.replace("_", " ")}
                </button>
              ),
            )}
          </div>

          <button
            type="submit"
            disabled={!!error}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 text-black font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 group"
          >
            <Save
              size={18}
              className="group-hover:scale-110 transition-transform"
            />
            Synthese Starten
          </button>
        </form>
      </div>
    </div>
  );
  return createPortal(modalContent, document.body);
};
