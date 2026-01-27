import { useTranslations } from "@shared/hooks/useTranslations";
import { Activity, Settings2 } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Label,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  useModuleState,
  usePhysicsLabContext,
} from "../../../hooks/usePhysicsLabContext";
import {
  calculateIntegral,
  calculateTangent,
  Point,
} from "../../common/AnalysisTools";
import { useNumericalEngine } from "./hooks/useNumericalEngine";
import { ModelCoach } from "./ModelCoach";
import { NumericalModel } from "./types";

// Custom Tooltip outside component to prevent re-creation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label, xAxis, yAxis }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-obsidian-950/90 border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-md">
        <p className="text-slate-400 text-xs font-mono mb-1">
          {xAxis} ={" "}
          <span className="text-white font-bold">
            {Number(label).toFixed(3)}
          </span>
        </p>
        <p className="text-fuchsia-400 text-sm font-mono font-bold">
          {yAxis} = {Number(payload[0].value).toFixed(3)}
        </p>
      </div>
    );
  }
  return null;
};

export const ModelStage: React.FC = () => {
  const { t } = useTranslations();
  const { globalSettings } = usePhysicsLabContext();
  const [moduleState] = useModuleState("modeling");
  const { results, runSimulation, isComputing, error, analysisResult } =
    useNumericalEngine();

  // Analysis State
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [selection, setSelection] = useState<{
    start: number;
    end: number;
  } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  // Standaard selectie: Snelheid (v) tegen Tijd (t)
  const [xAxis, setXAxis] = useState<string>("t");
  const [yAxis, setYAxis] = useState<string>("v");
  const [showGrid, setShowGrid] = useState(true);

  // Prepare points for analysis tools
  const points = useMemo<Point[]>(() => {
    if (!results || results.length === 0) return [];
    return results.map((r) => ({
      x: r[xAxis] as number,
      y: r[yAxis] as number,
    }));
  }, [results, xAxis, yAxis]);

  // Calculate analysis values
  const tangent = useMemo(() => {
    if (globalSettings.activeGraphTool !== "tangent" || hoverIndex === null)
      return null;
    return calculateTangent(points, hoverIndex);
  }, [globalSettings.activeGraphTool, points, hoverIndex]);

  const integral = useMemo(() => {
    if (globalSettings.activeGraphTool !== "integral" || !selection)
      return null;
    return calculateIntegral(points, selection.start, selection.end);
  }, [globalSettings.activeGraphTool, points, selection]);

  // Event Handlers for Recharts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMouseMove = (e: any) => {
    if (!e || !e.activeTooltipIndex) {
      setHoverIndex(null);
      return;
    }
    const idx = e.activeTooltipIndex;
    setHoverIndex(idx);

    if (isSelecting) {
      setSelection((prev) => ({
        start: prev?.start ?? idx,
        end: idx,
      }));
    }
  };

  const handleMouseDown = () => {
    if (globalSettings.activeGraphTool === "integral" && hoverIndex !== null) {
      setIsSelecting(true);
      setSelection({ start: hoverIndex, end: hoverIndex });
    }
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
  };

  // Listen for run triggers from the sidebar

  // Listen for run triggers from the sidebar
  useEffect(() => {
    if (moduleState.runVersion && moduleState.runVersion > 0) {
      // Construct the model object from state
      const model: NumericalModel = {
        id: "current-session",
        name: "Huidig Model",
        timeStep: moduleState.dt || 0.1,
        duration: moduleState.duration || 10,
        constants: moduleState.constants || [],
        initialValues: moduleState.initialValues || [],
        equations: (moduleState.code || "").split("\n"),
      };

      runSimulation(model);
    }
  }, [
    moduleState.runVersion,
    moduleState.dt,
    moduleState.duration,
    moduleState.constants,
    moduleState.initialValues,
    moduleState.code,
    runSimulation,
  ]);

  // Filter variabelen zodat we geen rare dingen plotten (alleen getallen)
  const plotableVars = useMemo(() => {
    if (!results || results.length === 0) return ["t", "v"];
    // Get keys from first result item
    return Object.keys(results[0]!).filter(
      (k) => typeof results[0]![k] === "number",
    );
  }, [results]);

  return (
    <div className="flex flex-col h-full w-full bg-gradient-to-br from-obsidian-950 to-black relative">
      {/* 1. Socratic Coach (Prioriteit bij didactische fouten) */}
      {analysisResult && analysisResult.hasError && (
        <div className="absolute top-4 left-4 right-4 z-50">
          <ModelCoach
            context={analysisResult}
            onFix={() => console.log("User wants to fix code")}
          />
        </div>
      )}

      {/* Toolbar: As-selectie (Cruciaal voor Faseruimte) */}
      {results.length > 0 && !isComputing && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md p-1.5 rounded-xl border border-white/10">
          <div className="flex items-center gap-2 px-2 border-r border-white/10">
            <span className="text-[10px] font-bold text-slate-500 uppercase">
              Y-as
            </span>
            <select
              value={yAxis}
              onChange={(e) => setYAxis(e.target.value)}
              className="bg-transparent text-fuchsia-400 text-xs font-bold font-mono outline-none cursor-pointer hover:text-white transition-colors"
            >
              {plotableVars.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 px-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase">
              X-as
            </span>
            <select
              value={xAxis}
              onChange={(e) => setXAxis(e.target.value)}
              className="bg-transparent text-slate-300 text-xs font-bold font-mono outline-none cursor-pointer hover:text-white transition-colors"
            >
              {plotableVars.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 rounded-lg transition-colors ${showGrid ? "text-emerald-400 bg-emerald-500/10" : "text-slate-500 hover:text-white"}`}
            title="Toggle Grid"
          >
            <Settings2 size={14} />
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && !analysisResult?.hasError && (
        <div className="absolute top-4 left-4 right-4 z-40 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-4 font-mono text-xs">
          <span className="font-bold">FOUT:</span> {error}
        </div>
      )}

      {/* Empty State / Loading */}
      {(results.length === 0 || isComputing) &&
        !analysisResult?.hasError &&
        !error && (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-4">
            {isComputing ? (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 border-2 border-emerald-500 border-dashed rounded-full mb-4 animate-spin-slow"></div>
                <p className="text-emerald-400 animate-pulse font-mono">
                  Berekent...
                </p>
              </div>
            ) : (
              <>
                <div className="p-4 rounded-full bg-white/5 border border-white/5">
                  <Activity size={32} strokeWidth={1.5} />
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-500">
                    Geen Modeldata
                  </p>
                  <p className="text-sm text-slate-600 max-w-xs mt-1">
                    Run de simulatie om de grafiek te genereren.
                  </p>
                </div>
              </>
            )}
          </div>
        )}

      {/* De Grafiek */}
      {results.length > 0 && !isComputing && (
        <div className="flex-1 w-full p-2 pt-12 pb-4 select-none">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={results}
              margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
              onMouseMove={handleMouseMove}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => {
                setHoverIndex(null);
                handleMouseUp();
              }}
            >
              {showGrid && (
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#ffffff"
                  opacity={0.05}
                  vertical={true}
                />
              )}

              <XAxis
                dataKey={xAxis}
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#ffffff10" }}
                tickFormatter={(val) =>
                  typeof val === "number" ? val.toFixed(1) : val
                }
                minTickGap={30}
                type="number"
                domain={["auto", "auto"]}
              >
                <Label
                  value={xAxis}
                  position="insideBottom"
                  offset={-10}
                  className="fill-slate-500 text-xs font-bold uppercase"
                />
              </XAxis>

              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#ffffff10" }}
                tickFormatter={(val) => val.toFixed(1)}
                domain={["auto", "auto"]} // Auto-scale
                type="number"
              >
                <Label
                  value={yAxis}
                  angle={-90}
                  position="insideLeft"
                  style={{ textAnchor: "middle" }}
                  className="fill-fuchsia-400 text-xs font-bold uppercase"
                />
              </YAxis>

              <Tooltip
                content={(props) => (
                  <CustomTooltip {...props} xAxis={xAxis} yAxis={yAxis} />
                )}
                cursor={{ stroke: "#ffffff20" }}
              />

              {/* Nul-lijn referentie */}
              <ReferenceLine y={0} stroke="#ffffff" strokeOpacity={0.1} />
              <ReferenceLine x={0} stroke="#ffffff" strokeOpacity={0.1} />

              {/* Integral Selection Area */}
              {globalSettings.activeGraphTool === "integral" && selection && (
                <ReferenceArea
                  x1={
                    results[Math.min(selection.start, selection.end)]![
                      xAxis
                    ] as number
                  }
                  x2={
                    results[Math.max(selection.start, selection.end)]![
                      xAxis
                    ] as number
                  }
                  fill="rgba(16, 185, 129, 0.2)"
                  stroke="#10b981"
                  strokeOpacity={0.5}
                />
              )}

              <Line
                type="monotone"
                dataKey={yAxis}
                stroke="#e879f9" // Fuchsia-400
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: "#fff", stroke: "#e879f9" }}
                animationDuration={500}
                isAnimationActive={false} // Performance
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Analysis Overlay HUD (Glassmorphism) */}
          {(tangent !== null || (integral !== null && selection)) && (
            <div className="absolute bottom-10 left-10 bg-black/60 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl flex flex-col gap-1 min-w-[160px] animate-in fade-in slide-in-from-bottom-2">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-1">
                {tangent !== null
                  ? t("physics.layout.graph_tools.slope")
                  : t("physics.layout.graph_tools.area")}
              </span>
              <div className="text-xl font-mono font-black text-white">
                {tangent !== null
                  ? `dy/dx = ${tangent.toFixed(5)}`
                  : integral?.toFixed(4)}
              </div>
              {tangent !== null && hoverIndex !== null && (
                <div className="text-[10px] text-fuchsia-400 font-bold">
                  at {xAxis} = {results[hoverIndex]![xAxis]?.toFixed(3)}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
