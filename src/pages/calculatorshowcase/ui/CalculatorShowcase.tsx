import { InteractiveFormulaCard } from "@shared/ui/InteractiveFormulaCard";
import { Sparkles } from "lucide-react";
import React from "react";

export const CalculatorShowcase: React.FC = () => {
  return (
    <div className="p-10 space-y-10 min-h-screen bg-black text-white">
      <header className="flex items-center gap-4 mb-10">
        <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/20">
          <Sparkles className="text-white" size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
            Elite Formula Lab
          </h1>
          <p className="text-slate-500 font-mono text-sm">
            Interactive Variable Analysis
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        <InteractiveFormulaCard
          title="Afgelegde Weg"
          latex="s = v \cdot t"
          colorTheme="cyan"
          formulaFn={(vals) => (vals["v"] || 0) * (vals["t"] || 0)}
          variables={[
            {
              symbol: "v",
              name: "Snelheid",
              min: 0,
              max: 130,
              step: 1,
              unit: "km/u",
              defaultValue: 50,
            },
            {
              symbol: "t",
              name: "Tijd",
              min: 0,
              max: 10,
              step: 0.5,
              unit: "h",
              defaultValue: 2,
            },
          ]}
        />

        <InteractiveFormulaCard
          title="Kinetische Energie"
          latex="E_k = \frac{1}{2} m \cdot v^2"
          colorTheme="rose"
          formulaFn={(vals) =>
            0.5 * (vals["m"] || 0) * Math.pow(vals["v"] || 0, 2)
          }
          variables={[
            {
              symbol: "m",
              name: "Massa",
              min: 1,
              max: 2000,
              step: 10,
              unit: "kg",
              defaultValue: 800,
            },
            {
              symbol: "v",
              name: "Snelheid",
              min: 0,
              max: 50,
              step: 1,
              unit: "m/s",
              defaultValue: 20,
            },
          ]}
        />

        <InteractiveFormulaCard
          title="Massa-Veer Systeem"
          latex="T = 2\pi \sqrt{\frac{m}{C}}"
          colorTheme="emerald"
          formulaFn={(vals) =>
            2 * Math.PI * Math.sqrt((vals["m"] || 0) / (vals["C"] || 1))
          }
          variables={[
            {
              symbol: "m",
              name: "Massa",
              min: 0.1,
              max: 10,
              step: 0.1,
              unit: "kg",
              defaultValue: 1,
            },
            {
              symbol: "C",
              name: "Veerconstante",
              min: 1,
              max: 100,
              step: 1,
              unit: "N/m",
              defaultValue: 20,
            },
          ]}
        />
      </div>
    </div>
  );
};
