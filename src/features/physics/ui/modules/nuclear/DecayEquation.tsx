import React, { useMemo } from "react";

import { CUSTOM_ISOTOPE_ID, ISOTOPE_LIBRARY } from "./isotopes";

interface DecayEquationProps {
  isotopeId: string;
}

export const DecayEquation: React.FC<DecayEquationProps> = ({ isotopeId }) => {
  const equation = useMemo(() => {
    if (isotopeId === CUSTOM_ISOTOPE_ID) {
      return {
        parent: { mass: "238", sym: "U", z: 92 },
        daughter: { mass: "234", sym: "Th", z: 90 },
        particle: { mass: "4", sym: "α", z: 2, charge: 2 },
        showNeutrino: false,
      };
    }

    const iso = ISOTOPE_LIBRARY[isotopeId];
    if (!iso) return null;

    // 1. Parent
    const parent = { mass: iso.mass.toFixed(0), sym: iso.symbol, z: iso.Z };

    // 2. Daughter & Particle (Defaults)
    let dMass = iso.daughterMass.toFixed(0);
    let dSym = iso.daughterSymbol;
    let dZ = iso.daughterZ;

    let pMass = "0";
    let pSym = "?";
    let pZ = 0;
    let pCharge = 0;

    // Standaard logica per type (fallback als er geen override is)
    if (iso.decayMode === "alpha") {
      pMass = "4";
      pSym = "α";
      pZ = 2;
      pCharge = 2;
    } else if (iso.decayMode === "beta_minus") {
      pMass = "0";
      pSym = "β";
      pZ = -1;
      pCharge = -1;
    } else if (iso.decayMode === "beta_plus") {
      pMass = "0";
      pSym = "β";
      pZ = 1;
      pCharge = 1;
    } else if (iso.decayMode === "gamma") {
      pMass = "0";
      pSym = "γ";
      pZ = 0;
      pCharge = 0;
      dMass = parent.mass;
      dZ = parent.z; // Isomeer
    }

    // 3. Pas Overrides toe vanuit isotopes.ts (Data-Driven!)
    // Hierdoor hoeven we geen "if (id === 'co60')" meer te doen
    if (iso.specs.equation.daughterSymbol)
      dSym = iso.specs.equation.daughterSymbol;
    if (iso.specs.equation.particleSymbol)
      pSym = iso.specs.equation.particleSymbol;

    const daughter = { mass: dMass, sym: dSym, z: dZ };
    const particle = { mass: pMass, sym: pSym, z: pZ, charge: pCharge };

    return {
      parent,
      daughter,
      particle,
      showNeutrino: !!iso.specs.equation.showNeutrino,
    };
  }, [isotopeId]);

  if (!equation) return null;

  return (
    <div className="flex items-center gap-6 select-none pointer-events-auto opacity-80 hover:opacity-100 transition-opacity">
      {/* Parent */}
      <div className="flex flex-col items-center">
        <div className="flex gap-0.5 relative">
          <div className="flex flex-col text-[10px] font-mono leading-none justify-center items-end mr-0.5 text-slate-400 font-bold">
            <span>{equation.parent.mass}</span>
            <span>{equation.parent.z}</span>
          </div>
          <span className="text-3xl font-black text-white tracking-tighter drop-shadow-lg">
            {equation.parent.sym.replace(/\d+/g, "")}
          </span>
        </div>
      </div>

      {/* Arrow */}
      <div className="text-slate-500 font-black text-xl">→</div>

      {/* Daughter */}
      <div className="flex flex-col items-center">
        <div className="flex gap-0.5 relative">
          <div className="flex flex-col text-[10px] font-mono leading-none justify-center items-end mr-0.5 text-slate-400 font-bold">
            <span>{equation.daughter.mass}</span>
            <span>{equation.daughter.z}</span>
          </div>
          <span className="text-3xl font-black text-white tracking-tighter drop-shadow-lg">
            {equation.daughter.sym.replace(/\d+/g, "")}
          </span>
        </div>
      </div>

      {/* Plus */}
      <div className="text-slate-500 font-black text-xl">+</div>

      {/* Particle */}
      <div className="flex flex-col items-center">
        <div className="flex gap-0.5 relative">
          <div className="flex flex-col text-[10px] font-mono leading-none justify-center items-end mr-0.5 text-slate-400 font-bold">
            <span>{equation.particle.mass}</span>
            <span>{equation.particle.z}</span>
          </div>
          <span
            className={`text-3xl font-black tracking-tighter drop-shadow-lg ${
              equation.particle.sym === "α"
                ? "text-rose-400"
                : equation.particle.sym === "β" || equation.particle.sym === "e"
                  ? "text-blue-400"
                  : "text-yellow-400"
            }`}
          >
            {equation.particle.sym}
          </span>
          {/* Neutrino (Data Driven) */}
          {equation.showNeutrino && (
            <span className="text-xl text-slate-500 self-center ml-2 font-bold font-serif italic">
              + <span className="text-xs align-top">_</span>ν
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
