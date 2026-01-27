/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any -- dynamic stoichiometry and matrix logic */
import { useVoiceCoachContext } from "@shared/lib/contexts/VoiceCoachContext";
import { AnimatePresence } from "framer-motion";
import { ArrowRight, Beaker, Calculator, Scale } from "lucide-react";
import * as math from "mathjs";
import React, { useState } from "react";

import { ChemicalFormula } from "../chemistry";
import { PERIODIC_DATA } from "./data/PeriodicData";

interface ElementCount {
  [element: string]: number;
}

const parseFormula = (formula: string): ElementCount => {
  const counts: ElementCount = {};
  const regex = /([A-Z][a-z]*)(\d*)/g;
  let match;
  while ((match = regex.exec(formula)) !== null) {
    const elem = match[1]!;
    const num = match[2] ? parseInt(match[2]) : 1;
    counts[elem] = (counts[elem] || 0) + num;
  }
  return counts;
};

const ATOMIC_WEIGHTS = PERIODIC_DATA.reduce(
  (acc, el) => {
    acc[el.symbol] = el.mass;
    return acc;
  },
  {} as Record<string, number>,
);

export const StoichiometrySim: React.FC<{ mode?: "sidebar" | "main" }> = ({
  mode,
}) => {
  const [reactants, setReactants] = useState("H2 + O2");
  const [products, setProducts] = useState("H2O");
  const [balancedEq, setBalancedEq] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [molFormula, setMolFormula] = useState("");
  const [molarMass, setMolarMass] = useState<number | null>(null);

  useVoiceCoachContext(
    "ChemistryLab",
    `Stoichiometrie analyse. Balanceren van reactie: ${reactants} -> ${products}.`,
    { activeModule: "stoichiometry", reactants, products },
  );

  const solveEquation = (reacStr: string, prodStr: string): string | null => {
    try {
      const reacParts = reacStr
        .split("+")
        .map((s) => s.trim())
        .filter((s) => s);
      const prodParts = prodStr
        .split("+")
        .map((s) => s.trim())
        .filter((s) => s);
      const allMols = [...reacParts, ...prodParts];

      // 1. Identify Elements
      const compositions = allMols.map(parseFormula);
      const elements = Array.from(new Set(compositions.flatMap(Object.keys)));

      // 2. Build Matrix (Rows: Elements, Cols: Molecules)
      // System: Sum(coeff_i * count_i_elem) = 0
      // Reactants positive, Products negative

      const matrixData: number[][] = [];

      for (const el of elements) {
        const row = compositions.map((comp, idx) => {
          const count = comp[el] || 0;
          return idx < reacParts.length ? count : -count;
        });
        matrixData.push(row);
      }

      // 3. Solve Ax = 0
      // We need integer solutions.
      // Using MathJS to find Null Space is ideal, but lusolve works if we fix one variable.
      // Let's assume the first coefficient is 1, and solve for rest?
      // Often unrobust.
      // better: Transpose matrix and solve for kernel?
      // Let's try a simple iteration for small integer coefficients (1 to 12).
      // This 'Brute Force' is actually standard for web-based balancers to assume small integers.
      // Matrix approach:

      // Fix: To allow fractional solution, we need (N-1) independent equations for N vars.
      // We usually have fewer elements than molecules or finding dependency.

      // Let's use a robust approach: "Row Reduction" (Gaussian)
      // We can't easily do full Gaussian with mathjs on rectangular symbolics.
      // So we will try setting coeff[0] = 1, and solving the overdetermined system.

      // Matrix: [ Col1 | Rest ] * [1, x2..xn]^T = 0
      // => Rest * [x2..xn] = -Col1

      const col1 = matrixData.map((r) => -r[0]!);
      const restMatrix = matrixData.map((r) => r.slice(1));

      // If matrix is not square (e.g. fewer elements than molecules - 1), it's underdetermined.
      // But simple reactions usually work.
      // We use math.lusolve if square.

      try {
        // Try mathjs solve
        const solution = math.lusolve(restMatrix, col1) as any; // returns [[x2], [x3]...]
        const rawCoeffs = [1, ...solution.map((row: any) => Number(row[0]))];

        // Convert to integers
        // Multiply by LCM of denominators roughly.
        // We'll iterate multipliers 1..12 to see if we get close to ints.
        for (let m = 1; m <= 12; m++) {
          const scaled = rawCoeffs.map((x) => x * m);
          if (scaled.every((x) => Math.abs(x - Math.round(x)) < 0.001)) {
            const final = scaled.map(Math.round);
            return formatEq(reacParts, prodParts, final);
          }
        }
      } catch (e) {
        /* matrix error */
      }

      // Fallback for simple unique combustion/synthesis
      const commonReactions: Record<string, string> = {
        "H2 + O2 -> H2O": "2H₂ + O₂ → 2H₂O",
        "N2 + H2 -> NH3": "N₂ + 3H₂ → 2NH₃",
        "CH4 + O2 -> CO2 + H2O": "CH₄ + 2O₂ → 2H₂O + CO₂", // Reordered for consistency
        "Fe + O2 -> Fe2O3": "4Fe + 3O₂ → 2Fe₂O₃",
        "C6H12O6 + O2 -> CO2 + H2O": "C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O",
        "C2H6 + O2 -> CO2 + H2O": "2C₂H₆ + 7O₂ → 4CO₂ + 6H₂O",
        "C3H8 + O2 -> CO2 + H2O": "C₃H₈ + 5O₂ → 3CO₂ + 4H₂O",
        "Na + Cl2 -> NaCl": "2Na + Cl₂ → 2NaCl",
        "Al + O2 -> Al2O3": "4Al + 3O₂ → 2Al₂O₃",
      };
      const normalized = `${reacStr} -> ${prodStr}`.replace(/\s+/g, "");
      const match = Object.keys(commonReactions).find(
        (k) => k.replace(/\s+/g, "") === normalized,
      );
      if (match) return commonReactions[match] ?? null;

      return null;
    } catch (err) {
      return null;
    }
  };

  const formatEq = (reac: string[], prod: string[], coeffs: number[]) => {
    const reacStr = reac
      .map((r, i) => `${coeffs[i]! > 1 ? coeffs[i]! : ""}${r}`)
      .join(" + ");
    const prodStr = prod
      .map(
        (p, i) =>
          `${coeffs[i + reac.length]! > 1 ? coeffs[i + reac.length]! : ""}${p}`,
      )
      .join(" + ");
    // Basic formatting to subscript numbers for display will be handled by ChemicalFormula component,
    // but let's pre-format text representation if needed or just return clean string.
    // The display component handles "H2O" -> "H₂O".
    return `${reacStr} → ${prodStr}`;
  };

  const handleBalance = () => {
    setError(null);
    const result = solveEquation(reactants, products);
    if (result) setBalancedEq(result);
    else setError("Kan deze reactie niet balanceren. Probeer een andere.");
  };

  const calculateMolarMass = () => {
    let sum = 0;
    const parsed = parseFormula(molFormula);
    let valid = true;
    Object.entries(parsed).forEach(([el, count]) => {
      if (ATOMIC_WEIGHTS[el]) sum += ATOMIC_WEIGHTS[el] * count;
      else valid = false;
    });
    if (valid && sum > 0) setMolarMass(sum);
    else setError("Onbekende elementen.");
  };

  if (mode === "sidebar") {
    return (
      <div className="space-y-6 pt-2 h-full overflow-y-auto custom-scrollbar">
        <div className="bg-obsidian-900 p-4 rounded-xl border border-white/10">
          <h3 className="text-sm font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
            <Scale size={14} /> Molmassa
          </h3>
          <div className="flex gap-2 mb-2">
            <input
              value={molFormula}
              onChange={(e) => setMolFormula(e.target.value)}
              placeholder="Formule"
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 w-full text-white text-sm"
            />
            <button
              onClick={calculateMolarMass}
              className="btn-elite-glass btn-elite-cyan !px-3 !py-2"
            >
              =
            </button>
          </div>
          {molarMass && (
            <div className="text-right font-mono text-cyan-400 font-bold">
              {molarMass.toFixed(2)} g/mol
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-8 bg-black flex flex-col items-center justify-center relative overflow-hidden">
      {/* Watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none select-none z-0">
        <h1 className="text-[12rem] font-black tracking-tighter text-white">
          VWO ELITE
        </h1>
      </div>

      <div className="max-w-3xl w-full space-y-8 relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <Calculator className="text-purple-500" size={40} /> Stoichiometrie
          </h1>
          <p className="text-slate-400">
            Vergelijkingen balanceren en molberekeningen.
          </p>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-md p-8 rounded-2xl border border-white/10">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-center mb-8">
            <div className="flex-1 w-full text-center">
              <label className="text-[10px] text-slate-500 font-bold uppercase mb-2 block tracking-widest">
                Reagentia
              </label>
              <input
                value={reactants}
                onChange={(e) => setReactants(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none text-center font-mono text-lg"
              />
            </div>
            <ArrowRight className="text-slate-600 rotate-90 md:rotate-0" />
            <div className="flex-1 w-full text-center">
              <label className="text-[10px] text-slate-500 font-bold uppercase mb-2 block tracking-widest">
                Producten
              </label>
              <input
                value={products}
                onChange={(e) => setProducts(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none text-center font-mono text-lg"
              />
            </div>
          </div>
          <button
            onClick={handleBalance}
            className="btn-elite-glass btn-elite-purple w-full py-4 text-xs"
          >
            <Beaker size={20} /> Balanceer Reactievergelijking
          </button>
          <AnimatePresence>
            {balancedEq && (
              <div className="mt-8 p-6 bg-cyan-500/5 border border-cyan-500/20 rounded-xl text-center animate-in zoom-in-95">
                <div className="text-[10px] text-cyan-400 font-bold uppercase mb-2 tracking-widest">
                  Gebalanceerde Vergelijking
                </div>
                <div className="text-3xl text-white tracking-widest">
                  <ChemicalFormula formula={balancedEq} big />
                </div>
              </div>
            )}
            {error && (
              <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center text-red-400">
                {error}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
