import "katex/dist/katex.min.css";

import { motion } from "framer-motion";
import { Activity, Maximize2, X } from "lucide-react";
import React, { useMemo, useState } from "react";
import { BlockMath, InlineMath } from "react-katex";

interface Variable {
  symbol: string;
  name: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  defaultValue: number;
}

interface FormulaCardProps {
  title: string;
  latex: string; // Bijv: "s = v \\cdot t"
  formulaFn: (inputs: Record<string, number>) => number; // De rekenfunctie
  variables: Variable[];
  colorTheme?: "cyan" | "rose" | "amber" | "emerald"; // Restricted to known keys
}

export const InteractiveFormulaCard: React.FC<FormulaCardProps> = ({
  title,
  latex,
  formulaFn,
  variables,
  colorTheme = "cyan",
}) => {
  // 1. Initialize State dynamically based on props
  const [values, setValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    variables.forEach((v) => (initial[v.symbol] = v.defaultValue));
    return initial;
  });

  const [isExpanded, setIsExpanded] = useState(false);

  // 2. Realtime Resultaat Berekening
  const result = useMemo(() => formulaFn(values), [values, formulaFn]);

  // 3. Mini-Graph Data Generator (SVG Path)
  // We plotten de relatie tussen de EERSTE variabele en het resultaat
  // terwijl de andere variabelen vast staan.
  const graphPath = useMemo(() => {
    const xVar = variables[0]; // We plotten var 1 op de x-as
    if (!xVar) return ""; // Guard clause

    const points = [];
    const width = 200;
    const height = 80;

    for (let i = 0; i <= 20; i++) {
      const xVal = xVar.min + (xVar.max - xVar.min) * (i / 20);
      // Tijdelijke inputs met variërende X
      const tempInputs = { ...values, [xVar.symbol]: xVal };
      const yVal = formulaFn(tempInputs);

      // Map naar SVG coördinaten (simpele auto-scale)
      // Aanname: yMax is ongeveer 2x de huidige resultwaarde voor visuele ruimte
      // Prevent division by zero if result is 0
      const yMax = (result === 0 ? 100 : result * 2) || 100;

      const px = (i / 20) * width;
      const py = height - (yVal / yMax) * height;
      points.push(`${px},${Math.min(Math.max(py, 0), height)}`);
    }

    return `M ${points.join(" L ")}`;
  }, [values, variables, formulaFn, result]);

  // Kleuren mapping voor "Elite" neon look
  const colors = {
    cyan: "from-cyan-500 to-blue-600 border-cyan-400 text-cyan-400",
    rose: "from-rose-500 to-pink-600 border-rose-400 text-rose-400",
    amber: "from-amber-500 to-orange-600 border-amber-400 text-amber-400",
    emerald:
      "from-emerald-500 to-green-600 border-emerald-400 text-emerald-400",
  } as const;

  const themeClass = colors[colorTheme || "cyan"] || colors.cyan;
  const parts = themeClass.split(" ");
  const accentColor = parts[3]?.replace("text-", "bg-") || "bg-cyan-400"; // Safe access
  const borderColor = parts[2] || "border-cyan-400";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
                relative overflow-hidden rounded-2xl 
                bg-[#0f1115]/90 backdrop-blur-xl 
                border border-white/10 shadow-2xl
                group hover:border-white/20 transition-colors
                ${isExpanded ? "col-span-2 row-span-2 z-50" : ""}
            `}
    >
      {/* Achtergrond Glow Effect */}
      <div
        className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-[80px] opacity-20 bg-gradient-to-br ${parts[0]} ${parts[1]}`}
      />

      {/* HEADER */}
      <div className="p-5 border-b border-white/5 flex justify-between items-start">
        <div>
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
            <Activity size={14} className={parts[3] || "text-cyan-400"} />
            {title}
          </h3>
          {/* LaTeX Formule Render */}
          <div className="text-lg text-white font-serif tracking-wide drop-shadow-lg mt-2">
            <BlockMath math={latex} />
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors"
        >
          {isExpanded ? <X size={18} /> : <Maximize2 size={18} />}
        </button>
      </div>

      {/* VISUALISATIE (De Grafiek) */}
      <div className="relative h-24 w-full bg-black/40 overflow-hidden">
        <svg
          className="w-full h-full"
          preserveAspectRatio="none"
          viewBox="0 0 200 80"
        >
          {/* Grid lijnen */}
          <line
            x1="0"
            y1="20"
            x2="200"
            y2="20"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
          />
          <line
            x1="0"
            y1="40"
            x2="200"
            y2="40"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
          />
          <line
            x1="0"
            y1="60"
            x2="200"
            y2="60"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
          />

          {/* De "Levende" Lijn */}
          <motion.path
            d={graphPath}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className={`${parts[3] || "text-cyan-400"}`} // text-cyan-400 etc voor stroke color
            initial={false}
            animate={{ d: graphPath }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />

          {/* Area under the curve (gradient fill) */}
          <motion.path
            d={`${graphPath} L 200 80 L 0 80 Z`}
            fill={`url(#gradient-${colorTheme})`}
            initial={false}
            animate={{ d: `${graphPath} L 200 80 L 0 80 Z` }}
          />

          <defs>
            <linearGradient
              id={`gradient-${colorTheme}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="currentColor"
                className={(parts[3] || "text-cyan-400").replace(
                  "text-",
                  "text-",
                )}
                stopOpacity="0.2"
              />
              <stop
                offset="100%"
                stopColor="currentColor"
                className={parts[3] || "text-cyan-400"}
                stopOpacity="0"
              />
            </linearGradient>
          </defs>
        </svg>

        {/* Huidige Waarde Badge */}
        <div className="absolute top-2 right-4 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg px-3 py-1 text-right shadow-lg">
          <span
            className={`block text-xl font-bold font-mono ${parts[3] || "text-cyan-400"}`}
          >
            {result.toFixed(2)}
          </span>
        </div>
      </div>

      {/* CONTROLS (De Sliders) */}
      <div className="p-5 space-y-5 bg-gradient-to-b from-transparent to-black/20">
        {variables.map((v) => (
          <div key={v.symbol} className="group/slider">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">
              <span className="flex items-center gap-2">
                <span className={`w-1 h-3 rounded-full ${accentColor}`} />
                <InlineMath math={v.symbol} />
                <span className="opacity-50 font-normal normal-case">
                  ({v.name})
                </span>
              </span>
              <span className="font-mono text-white">
                {values[v.symbol] ?? v.defaultValue}{" "}
                <span className="text-slate-500">{v.unit}</span>
              </span>
            </div>

            <div className="relative h-6 flex items-center group-hover/slider:scale-[1.02] transition-transform">
              {/* De Slider Track */}
              <input
                type="range"
                min={v.min}
                max={v.max}
                step={v.step}
                value={values[v.symbol] ?? v.defaultValue}
                onChange={(e) =>
                  setValues({
                    ...values,
                    [v.symbol]: parseFloat(e.target.value),
                  })
                }
                className="absolute w-full h-full opacity-0 z-20 cursor-pointer"
              />
              {/* Custom Slider Visuals */}
              <div className="w-full h-1 bg-slate-800 rounded-lg overflow-hidden relative">
                <motion.div
                  className={`h-full ${accentColor}`}
                  style={{
                    width: `${(((values[v.symbol] ?? v.defaultValue) - v.min) / (v.max - v.min)) * 100}%`,
                  }}
                  layoutId={`slider-fill-${v.symbol}`}
                />
              </div>
              {/* Thumb (Knopje) */}
              <motion.div
                className={`absolute h-4 w-4 bg-[#0f1115] rounded-full shadow-lg border-2 ${borderColor} pointer-events-none z-10`}
                style={{
                  left: `${(((values[v.symbol] ?? v.defaultValue) - v.min) / (v.max - v.min)) * 100}%`,
                  x: "-50%",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* FOOTER MET INZICHT */}
      {isExpanded && (
        <div className="px-5 pb-5 pt-0">
          <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg text-xs text-blue-200/80 leading-relaxed">
            <strong className="text-blue-400">💡 Inzicht:</strong>{" "}
            Relatieanalyse voor {variables[0]?.name || "variabele"}. Verandering
            van deze variabele heeft een direct effect op de uitkomst.
          </div>
        </div>
      )}
    </motion.div>
  );
};
