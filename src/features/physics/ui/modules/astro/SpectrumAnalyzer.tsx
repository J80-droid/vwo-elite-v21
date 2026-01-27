import React, { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Label,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  C,
  calculateIntegral,
  calculateTangent,
  planckLaw,
  Point,
  WIEN_CONSTANT,
} from "./astroMath";

interface Props {
  temperature: number;
}

// Rest wavelength of Fraunhofer Lines
const BASE_ABSORPTION_LINES = [
  { nm: 393, element: "Ca II (K)" },
  { nm: 396, element: "Ca II (H)" },
  { nm: 410, element: "H-delta" },
  { nm: 434, element: "H-gamma" },
  { nm: 486, element: "H-beta" },
  { nm: 517, element: "Mg I (b)" },
  { nm: 589, element: "Na I (D)" },
  { nm: 656, element: "H-alpha" },
];

export const SpectrumAnalyzer: React.FC<Props> = ({ temperature }) => {
  const [activeTool, setActiveTool] = useState<"none" | "integral" | "tangent">(
    "none",
  );
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [selection, setSelection] = useState<{
    start: number;
    end: number;
  } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  // NEW: Doppler Velocity State (km/s)
  const [radialVelocity, setRadialVelocity] = useState(0);

  const data = useMemo(() => {
    const points = [];
    for (let nm = 100; nm <= 2000; nm += 10) {
      points.push({
        nm,
        intensity: planckLaw(nm, temperature),
      });
    }
    return points;
  }, [temperature]);

  const points = useMemo<Point[]>(() => {
    return data.map((d) => ({ x: d.nm, y: d.intensity }));
  }, [data]);

  const lambdaMaxNm = (WIEN_CONSTANT / temperature) * 1e9;

  // Calculate Shifted Lines based on Doppler formula: Δλ = λ * (v/c)
  // v is in km/s, c approx 300,000 km/s
  const shiftedLines = useMemo(() => {
    return BASE_ABSORPTION_LINES.map((line) => ({
      ...line,
      shiftedNm: line.nm * (1 + radialVelocity / C),
    }));
  }, [radialVelocity]);

  const tangent = useMemo(() => {
    if (activeTool !== "tangent" || hoverIndex === null) return null;
    return calculateTangent(points, hoverIndex);
  }, [activeTool, points, hoverIndex]);

  const integral = useMemo(() => {
    if (activeTool !== "integral" || !selection) return null;
    return calculateIntegral(points, selection.start, selection.end);
  }, [activeTool, points, selection]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMouseMove = (e: any) => {
    if (
      !e ||
      typeof e.activeTooltipIndex === "undefined" ||
      e.activeTooltipIndex === null
    ) {
      setHoverIndex(null);
      return;
    }
    const idx = Number(e.activeTooltipIndex);
    setHoverIndex(idx);
    if (isSelecting) {
      setSelection((prev) => ({ start: prev?.start ?? idx, end: idx }));
    }
  };

  return (
    <div className="h-full w-full flex flex-col p-2 select-none relative">
      <div className="mb-2 flex justify-between items-end">
        <div className="flex flex-col gap-1">
          <div className="flex gap-2 items-center">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Spectral Analysis
            </h4>
            {/* Tool Toggle */}
            <div className="flex bg-white/5 rounded-md overflow-hidden border border-white/10">
              <button
                onClick={() =>
                  setActiveTool(activeTool === "tangent" ? "none" : "tangent")
                }
                className={`px-2 py-0.5 text-[10px] transition-colors ${activeTool === "tangent" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-400 hover:text-white"}`}
              >
                Slope
              </button>
              <div className="w-[1px] bg-white/10"></div>
              <button
                onClick={() => {
                  setActiveTool(
                    activeTool === "integral" ? "none" : "integral",
                  );
                  setSelection(null);
                }}
                className={`px-2 py-0.5 text-[10px] transition-colors ${activeTool === "integral" ? "bg-emerald-500/20 text-emerald-400" : "text-slate-400 hover:text-white"}`}
              >
                Area
              </button>
            </div>
          </div>

          {/* NEW: Doppler Slider */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[9px] text-slate-400 uppercase font-bold w-12">
              Doppler v
            </span>
            <input
              type="range"
              min="-15000"
              max="15000"
              step="100"
              value={radialVelocity}
              onChange={(e) => setRadialVelocity(Number(e.target.value))}
              className="w-24 h-1 bg-slate-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-400"
            />
            <span
              className={`text-[9px] font-mono w-16 text-right ${radialVelocity > 0 ? "text-rose-400" : radialVelocity < 0 ? "text-blue-400" : "text-slate-400"}`}
            >
              {radialVelocity > 0 ? "+" : ""}
              {(radialVelocity / C).toFixed(4)}c
            </span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] text-emerald-400 font-mono">
            λmax = {lambdaMaxNm.toFixed(0)} nm
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative group">
        {/* Visual Spectrum with Absorption Lines Overlay */}
        <div className="absolute top-0 bottom-8 left-[40px] right-[10px] opacity-20 pointer-events-none overflow-hidden rounded-sm">
          <div
            style={{
              width: "100%",
              height: "100%",
              background:
                "linear-gradient(to right, violet, indigo, blue, green, yellow, orange, red)",
            }}
          />

          {/* Static Reference Lines (Dashed, minimal opacity) - Where lines SHOULD be at rest */}
          {BASE_ABSORPTION_LINES.map((line) => {
            const pct = ((line.nm - 100) / (2000 - 100)) * 100;
            if (pct < 0 || pct > 100) return null;
            return (
              <div
                key={`ref-${line.nm}`}
                className="absolute top-0 bottom-0 border-l border-white/10 border-dashed w-[1px]"
                style={{ left: `${pct}%` }}
              />
            );
          })}

          {/* Shifted Actual Lines (Solid Black) */}
          {shiftedLines.map((line) => {
            const pct = ((line.shiftedNm - 100) / (2000 - 100)) * 100;
            if (pct < 0 || pct > 100) return null;
            return (
              <div
                key={line.nm}
                className="absolute top-0 bottom-0 bg-black/80 w-[1.5px]"
                style={{ left: `${pct}%` }}
                title={`${line.element}: ${line.shiftedNm.toFixed(1)}nm`}
              />
            );
          })}
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            onMouseMove={handleMouseMove}
            onMouseDown={() => {
              if (activeTool === "integral" && hoverIndex !== null) {
                setIsSelecting(true);
                setSelection({ start: hoverIndex, end: hoverIndex });
              }
            }}
            onMouseUp={() => setIsSelecting(false)}
            onMouseLeave={() => {
              setHoverIndex(null);
              setIsSelecting(false);
            }}
          >
            <XAxis
              dataKey="nm"
              stroke="#64748b"
              fontSize={10}
              tickFormatter={(v) => `${v}`}
            >
              <Label
                value="Wavelength (nm)"
                offset={-5}
                position="insideBottom"
                className="fill-slate-500 text-[10px]"
              />
            </XAxis>
            <YAxis hide />
            <Tooltip
              contentStyle={{
                backgroundColor: "#020617",
                borderColor: "#334155",
              }}
              itemStyle={{ color: "#e2e8f0", fontSize: "12px" }}
              formatter={(value: number | undefined) => [
                value !== undefined ? Number(value).toExponential(1) : "0",
                "Intensity",
              ]}
              labelFormatter={(v) => `${v} nm`}
            />
            {activeTool === "integral" && selection && (
              <ReferenceArea
                x1={data[Math.min(selection.start, selection.end)]?.nm}
                x2={data[Math.max(selection.start, selection.end)]?.nm}
                fill="rgba(16, 185, 129, 0.25)"
                stroke="#10b981"
                strokeOpacity={0.8}
              />
            )}
            {activeTool === "tangent" && hoverIndex !== null && (
              <ReferenceLine
                x={data[hoverIndex]?.nm}
                stroke="#22d3ee"
                strokeDasharray="3 3"
                label={{
                  position: "top",
                  value: "SLOPE",
                  fill: "#22d3ee",
                  fontSize: 8,
                  fontWeight: "bold",
                }}
              />
            )}
            <Area
              type="monotone"
              dataKey="intensity"
              stroke="#ffffff"
              fill="url(#colorIntensity)"
              strokeWidth={2}
              isAnimationActive={false}
            />
            <defs>
              <linearGradient id="colorIntensity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ffffff" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <ReferenceLine
              x={lambdaMaxNm}
              stroke="#10b981"
              strokeDasharray="3 3"
            />
          </AreaChart>
        </ResponsiveContainer>

        {(tangent !== null || integral !== null) && (
          <div className="absolute top-2 left-12 bg-slate-900/90 backdrop-blur-md border border-white/10 p-2 rounded-lg shadow-xl z-50 pointer-events-none">
            <div className="text-[8px] font-black uppercase text-slate-500 mb-0.5">
              {tangent !== null ? "Slope (dI/dλ)" : "Integrated Flux"}
            </div>
            <div className="text-xs font-mono font-bold text-white">
              {tangent !== null
                ? tangent.toExponential(2)
                : integral?.toExponential(2)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
