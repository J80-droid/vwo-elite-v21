/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable no-useless-escape */
/* eslint-disable @typescript-eslint/no-explicit-any */
// import functionPlot from 'function-plot';
import { useGraphStore } from "@shared/model/graphStore";
import {
  Calculator,
  FolderOpen,
  History,
  MousePointer2,
  Plus,
  Save,
  Settings2,
  Sigma,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

// We hergebruiken Nerdamer voor de wiskundige analyse (Nulpunten/Afgeleide)
// function-plot and nerdamer removed for dynamic loading

interface FunctionDef {
  id: string;
  expression: string;
  color: string;
  derivative: boolean;
  visible: boolean;
  analysis?: { root?: string; derivative?: string }; // Cache voor analyse
}

const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"];

interface GraphCalculatorProps {
  initialFunction?: string;
  initialColor?: string;
  isWidget?: boolean;
}

export const GraphCalculator: React.FC<GraphCalculatorProps> = ({
  initialFunction,
  initialColor,
  isWidget = false,
}) => {
  const {
    logGraphAction,
    history,
    saveFunction,
    savedFunctions,
    deleteSavedFunction,
  } = useGraphStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [functions, setFunctions] = useState<FunctionDef[]>([
    {
      id: "1",
      expression: initialFunction || "x^2 - 4",
      color: initialColor || COLORS[0]!,
      derivative: false,
      visible: true,
    },
  ]);
  const [grid, setGrid] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  // Resize State
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // --- 1. RESIZE OBSERVER (De Fix voor Responsiviteit) ---
  useLayoutEffect(() => {
    if (!wrapperRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, []);

  // --- 2. RENDER GRAPH (Met Cleanup Fix) ---
  useEffect(() => {
    if (!containerRef.current || dimensions.width === 0) return;

    // let instance: any;

    const renderGraph = async () => {
      try {
        const functionPlot = (await import("function-plot")).default;

        // FIX: Maak container eerst leeg om dubbele grafieken te voorkomen
        if (containerRef.current) containerRef.current.innerHTML = "";

        const data = functions
          .filter((f) => f.visible && f.expression.trim() !== "")
          .map((f) => {
            const items = [];
            // Hoofdfunctie
            items.push({
              fn: f.expression,
              color: f.color,
              graphType: "polyline",
              skipTip: false,
            });
            // Afgeleide
            if (f.derivative) {
              items.push({
                fn: f.expression,
                derivative: { fn: f.expression, updateOnMouseMove: true },
                color: f.color,
                graphType: "polyline",
                lineType: "dashed",
                opacity: 0.5,
                skipTip: true,
              });
            }
            return items;
          })
          .flat();

        functionPlot({
          target: containerRef.current,
          width: dimensions.width,
          height: dimensions.height,
          yAxis: { domain: [-10, 10] },
          xAxis: { domain: [-10, 10] },
          grid: grid,
          data: data as any,
          renderer: "svg",
          tip: {
            xLine: true,
            yLine: true,
            renderer: (x: number, y: number) =>
              `(${x.toFixed(2)}, ${y.toFixed(2)})`,
          },
        } as any);
      } catch (e) {
        // Silent catch voor typfouten
      }
    };

    renderGraph();
  }, [functions, grid, dimensions]); // Re-render bij resize

  // --- 3. DIDACTISCHE ANALYSE (De Nerdamer Integratie) ---
  const analyzeFunction = async (id: string) => {
    const nerdamer = (await import("nerdamer")).default;
    await import("nerdamer/Solve");
    await import("nerdamer/Calculus");

    setFunctions((currentFuncs) =>
      currentFuncs.map((f) => {
        if (f.id !== id) return f;

        try {
          // Bereken Afgeleide
          const diff = (nerdamer as any)(`diff(${f.expression}, x)`).text();

          // Bereken Nulpunten (f(x) = 0)
          // Let op: nerdamer.solve geeft een Vector terug, we maken er een string van
          const rootsVec = (nerdamer as any).solve(f.expression, "x");
          const roots = rootsVec.toString().replace(/[\[\]]/g, ""); // [2, -2] -> 2, -2

          return { ...f, analysis: { root: roots, derivative: diff } };
        } catch (e) {
          return {
            ...f,
            analysis: { root: "Geen oplossing", derivative: "Error" },
          };
        }
      }),
    );
  };

  // --- HANDLERS ---
  const handleBlur = (id: string) => {
    const func = functions.find((f) => f.id === id);
    if (func && func.expression.length > 1) {
      logGraphAction(func.expression, func.derivative ? ["derivative"] : []);
      // Auto-analyse bij blur (optioneel, of via knop)
      analyzeFunction(id);
    }
  };

  const addFunction = () => {
    if (functions.length >= 5) return;
    setFunctions([
      ...functions,
      {
        id: crypto.randomUUID(),
        expression: "",
        color: COLORS[functions.length % COLORS.length]!,
        derivative: false,
        visible: true,
      },
    ]);
  };

  const updateFunction = (id: string, val: string) => {
    setFunctions(
      functions.map((f) => {
        if (f.id === id) {
          const { analysis: _, ...rest } = f;
          return { ...rest, expression: val };
        }
        return f;
      }),
    );
  };

  const toggleDerivative = (id: string) => {
    const newFuncs = functions.map((f) =>
      f.id === id ? { ...f, derivative: !f.derivative } : f,
    );
    setFunctions(newFuncs);
    const f = newFuncs.find((fn) => fn.id === id);
    if (f?.derivative) logGraphAction(f.expression, ["derivative"]);
  };

  const removeFunction = (id: string) =>
    setFunctions(functions.filter((f) => f.id !== id));

  const loadFunction = (expr: string) => {
    setFunctions([
      {
        id: crypto.randomUUID(),
        expression: expr,
        color: COLORS[0]!,
        derivative: false,
        visible: true,
      },
    ]);
    setShowHistory(false);
    setShowSaved(false);
  };

  return (
    <div
      className={`${isWidget ? "h-full" : "h-[calc(100vh-80px)]"} flex flex-col md:flex-row bg-obsidian-950 text-white overflow-hidden font-outfit`}
    >
      {/* SIDEBAR (Hidden in Widget Mode) */}
      {!isWidget && (
        <div className="w-full md:w-96 bg-obsidian-900 border-r border-white/10 p-4 flex flex-col z-10 shadow-2xl overflow-y-auto relative custom-scrollbar">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-500/30">
                <Calculator className="text-purple-400" size={20} />
              </div>
              <div>
                <h2 className="font-bold text-lg leading-none">Graph Elite</h2>
                <span className="text-[10px] text-purple-400 uppercase font-bold tracking-wider">
                  Calculus Engine
                </span>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => {
                  setShowSaved(!showSaved);
                  setShowHistory(false);
                }}
                className={`p-2 rounded-lg transition ${showSaved ? "bg-white/20" : "hover:bg-white/10 text-slate-400"}`}
              >
                <FolderOpen size={18} />
              </button>
              <button
                onClick={() => {
                  setShowHistory(!showHistory);
                  setShowSaved(false);
                }}
                className={`p-2 rounded-lg transition ${showHistory ? "bg-white/20" : "hover:bg-white/10 text-slate-400"}`}
              >
                <History size={18} />
              </button>
            </div>
          </div>

          {/* Function List */}
          <div className="space-y-4 flex-1">
            {functions.map((f, index) => (
              <div
                key={f.id}
                className="bg-black/20 p-3 rounded-xl border border-white/5 group hover:border-white/10 transition-all"
              >
                {/* Input Row */}
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-3 h-3 rounded-full shadow-[0_0_8px]"
                    style={{
                      backgroundColor: f.color,
                      boxShadow: `0 0 8px ${f.color}`,
                    }}
                  />
                  <span className="text-xs font-bold text-slate-500 uppercase">
                    F{index + 1}(x)
                  </span>
                  <div className="ml-auto flex gap-1">
                    <button
                      onClick={() => toggleDerivative(f.id)}
                      title="Toon Afgeleide"
                      className={`p-1.5 rounded transition ${f.derivative ? "text-white bg-purple-500/20 border border-purple-500/50" : "text-slate-600 hover:bg-white/10"}`}
                    >
                      <TrendingUp size={14} />
                    </button>
                    <button
                      onClick={() =>
                        saveFunction(`F${index + 1}`, f.expression)
                      }
                      className="p-1.5 text-slate-600 hover:text-emerald-400 rounded"
                    >
                      <Save size={14} />
                    </button>
                    <button
                      onClick={() => removeFunction(f.id)}
                      className="p-1.5 text-slate-600 hover:text-rose-400 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="relative mb-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-serif italic text-slate-500">
                    y =
                  </span>
                  <input
                    type="text"
                    value={f.expression}
                    onChange={(e) => updateFunction(f.id, e.target.value)}
                    onBlur={() => handleBlur(f.id)}
                    placeholder="bijv. x^2 - 4"
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-2 pl-10 pr-3 text-sm font-mono text-white outline-none focus:border-purple-500/50 transition-colors"
                  />
                </div>

                {/* ANALYSIS PANEL (Automatisch getoond indien beschikbaar) */}
                {f.analysis && (
                  <div className="bg-white/5 rounded-lg p-2 text-[10px] space-y-1 animate-in slide-in-from-top-2 border border-white/5">
                    <div className="flex gap-2">
                      <span className="text-slate-500 uppercase font-bold w-12">
                        Nulpunt:
                      </span>
                      <span className="font-mono text-emerald-400 break-all">
                        {f.analysis.root}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-slate-500 uppercase font-bold w-12">
                        Afgeleide:
                      </span>
                      <span className="font-mono text-purple-400 break-all">
                        f'(x) = {f.analysis.derivative}
                      </span>
                    </div>
                  </div>
                )}
                {!f.analysis && f.expression && (
                  <button
                    onClick={() => analyzeFunction(f.id)}
                    className="w-full py-1 text-[10px] bg-white/5 hover:bg-white/10 rounded text-slate-400 flex items-center justify-center gap-1"
                  >
                    <Sigma size={10} /> Analyseer
                  </button>
                )}
              </div>
            ))}

            {functions.length < 5 && (
              <button
                onClick={addFunction}
                className="w-full py-3 border border-dashed border-white/10 rounded-xl text-slate-500 hover:text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <Plus size={14} /> Functie Toevoegen
              </button>
            )}
          </div>

          {/* Footer */}
          <div className="mt-auto pt-4 border-t border-white/10">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1 bg-black/20 p-2 rounded-lg border border-white/5">
              <span className="flex items-center gap-2 font-bold">
                <Settings2 size={12} /> Rooster
              </span>
              <button
                onClick={() => setGrid(!grid)}
                className={`w-8 h-4 rounded-full transition-colors ${grid ? "bg-purple-500" : "bg-slate-700"}`}
              >
                <div
                  className={`w-2 h-2 bg-white rounded-full mt-1 ml-1 transition-transform ${grid ? "translate-x-4" : ""}`}
                />
              </button>
            </div>
          </div>

          {/* HISTORY OVERLAY */}
          {showHistory && (
            <div className="absolute inset-0 bg-obsidian-900 z-20 animate-in slide-in-from-left p-4 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold flex items-center gap-2">
                  <History size={16} /> Geschiedenis
                </h3>
                <button onClick={() => setShowHistory(false)}>
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-2">
                {history.length === 0 && (
                  <p className="text-xs text-slate-500">Leeg.</p>
                )}
                {history.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => loadFunction(h.expression)}
                    className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-xs"
                  >
                    <div className="font-mono text-purple-300 font-bold mb-1 truncate">
                      {h.expression}
                    </div>
                    <div className="text-[9px] text-slate-500">
                      {new Date(h.timestamp).toLocaleTimeString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SAVED OVERLAY */}
          {showSaved && (
            <div className="absolute inset-0 bg-obsidian-900 z-20 animate-in slide-in-from-left p-4 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold flex items-center gap-2">
                  <FolderOpen size={16} /> Opgeslagen
                </h3>
                <button onClick={() => setShowSaved(false)}>
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-2">
                {savedFunctions.length === 0 && (
                  <p className="text-xs text-slate-500">
                    Geen opgeslagen functies.
                  </p>
                )}
                {savedFunctions.map((f) => (
                  <div
                    key={f.id}
                    className="p-3 rounded-lg bg-white/5 border border-white/5 flex flex-col gap-2"
                  >
                    <div className="flex justify-between items-start">
                      <div className="text-xs font-bold text-slate-300">
                        {f.name}
                      </div>
                      <button
                        onClick={() => deleteSavedFunction(f.id)}
                        className="text-slate-600 hover:text-rose-400"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <button
                      onClick={() => loadFunction(f.expression)}
                      className="w-full text-left font-mono text-purple-300 text-xs font-bold truncate hover:underline"
                    >
                      {f.expression}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* GRAPH AREA */}
      <div
        className="flex-1 relative bg-[#09090b] cursor-crosshair overflow-hidden"
        ref={wrapperRef}
      >
        <div ref={containerRef} className="w-full h-full" />

        {!isWidget && (
          <div className="absolute top-4 right-4 pointer-events-none bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[10px] text-slate-400 flex items-center gap-2 shadow-xl">
            <MousePointer2 size={10} /> Scroll = Zoom • Sleep = Beweeg
          </div>
        )}

        {functions.some((f) => f.derivative) && (
          <div className="absolute bottom-6 left-6 pointer-events-none bg-purple-500/10 border border-purple-500/30 px-4 py-2 rounded-xl backdrop-blur-md">
            <div className="text-purple-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <TrendingUp size={14} /> Differentiaal Modus
            </div>
            <p className="text-[10px] text-purple-300/70">
              Stippellijn toont f'(x) real-time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
