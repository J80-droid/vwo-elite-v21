/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any -- dynamic stoichiometry and matrix logic */
import { useVoiceCoachContext } from "@shared/lib/contexts/VoiceCoachContext";
import { AnimatePresence, motion } from "framer-motion";
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

export const StoichiometrySim: React.FC<{
  mode?: "sidebar" | "main" | "stage" | "controls";
}> = ({ mode }) => {
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

  if (mode === "controls") {
    return (
      <div className="flex flex-row items-center gap-4">
        {/* Balance Controls */}
        <div className="flex items-center gap-2 bg-black/40 border border-white/5 p-1 rounded-xl">
          <input
            value={reactants}
            onChange={(e) => setReactants(e.target.value)}
            placeholder="Reagentia (bijv. H2 + O2)"
            className="w-40 bg-transparent px-3 py-1 text-[10px] text-white outline-none font-mono"
          />
          <ArrowRight size={12} className="text-slate-600" />
          <input
            value={products}
            onChange={(e) => setProducts(e.target.value)}
            placeholder="Producten (bijv. H2O)"
            className="w-40 bg-transparent px-3 py-1 text-[10px] text-white outline-none font-mono"
          />
        </div>

        <button
          onClick={handleBalance}
          className="px-4 py-2 rounded-xl bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-purple-500 transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2"
        >
          <Beaker size={14} /> Balanceer
        </button>

        <div className="w-px h-6 bg-white/10 mx-2" />

        {/* Molar Mass Mini-Input */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/5 p-1 rounded-xl">
          <input
            value={molFormula}
            onChange={(e) => setMolFormula(e.target.value)}
            placeholder="Molecuul"
            className="w-24 bg-transparent px-2 py-1 text-[10px] text-white outline-none font-mono"
          />
          <button
            onClick={calculateMolarMass}
            className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white transition-colors"
          >
            <Scale size={12} />
          </button>
          {molarMass && (
            <span className="text-[10px] font-bold text-cyan-400 pr-2">
              {molarMass.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (mode === "stage") {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-8 relative overflow-hidden">
        {/* Large Result Display */}
        <AnimatePresence mode="wait">
          {balancedEq ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="bg-obsidian-900/60 p-12 rounded-[3rem] border border-purple-500/20 backdrop-blur-xl shadow-2xl relative overflow-hidden text-center max-w-2xl w-full"
            >
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500/20 blur-[100px]" />
              <div className="relative z-10">
                <span className="px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest mb-8 inline-block">
                  Gebalanceerde Reactievergelijking
                </span>
                <div className="text-4xl md:text-6xl text-white font-mono font-black tracking-tighter">
                  <ChemicalFormula formula={balancedEq} big />
                </div>
              </div>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-rose-500 font-bold bg-rose-500/10 px-6 py-3 rounded-2xl border border-rose-500/20"
            >
              {error}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-slate-500 flex flex-col items-center gap-4"
            >
              <Calculator size={64} className="opacity-20" />
              <div className="text-sm uppercase font-black tracking-widest opacity-40">
                Voer een reactie in om te balanceren
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Background Visual */}
        <div className="absolute bottom-10 left-10 opacity-10 pointer-events-none select-none">
          <Scale size={300} strokeWidth={0.5} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-8 bg-black flex flex-col items-center justify-center relative overflow-hidden">
      <div className="flex-1 flex items-center justify-center text-slate-500 italic">
        Full mode rendering is deactivated. Please use mode="stage" and mode="controls".
      </div>
    </div>
  );
};
