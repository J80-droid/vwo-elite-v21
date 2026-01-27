import "mafs/core.css";

import { ArrowRight, TrendingUp } from "lucide-react";
import { Coordinates, Mafs, MovablePoint, Plot, Point } from "mafs";
import { useCallback, useMemo, useState } from "react";

// For the derivative sketcher, we'll use a set of movable points at fixed X intervals
const SKETCH_X_POINTS = [-4, -3, -2, -1, 0, 1, 2, 3, 4];

// Helper for random generation outside component to satisfy purity linting
const getRandomCubicParams = () => {
  const r1 = Math.floor(Math.random() * 5) - 4; // -4 to 0
  const r2 = 0;
  const r3 = Math.floor(Math.random() * 5); // 0 to 4
  const a = Math.random() > 0.5 ? 0.2 : -0.2;
  return { a, b: r1, c: r2, d: r3 };
};

export const ConceptSketcher = () => {
  // 1. Session State
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const totalQuestions = 10;
  const [isFinished, setIsFinished] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  // 2. Challenge Generation
  // We'll use a simple cubic function: f(x) = a(x-b)(x-c)(x-d)
  const [targetFunction, setTargetFunction] = useState({
    a: 0.2,
    b: -2,
    c: 0,
    d: 2,
  });

  const generateNewChallenge = () => {
    if (currentQuestion >= totalQuestions) {
      setIsFinished(true);
      return;
    }

    setTargetFunction(getRandomCubicParams());

    // Reset player sketch
    setPoints(SKETCH_X_POINTS.map((x) => [x, 0] as [number, number]));
    setShowValidation(false);
    setCurrentQuestion((prev) => prev + 1);
  };

  const restartSession = () => {
    setCurrentQuestion(1);
    setIsFinished(false);
    setPoints(SKETCH_X_POINTS.map((x) => [x, 0] as [number, number]));
    setShowValidation(false);
    // Reset to initial cubic
    setTargetFunction({ a: 0.2, b: -2, c: 0, d: 2 });
  };

  // 3. Player Sketch Points
  const [points, setPoints] = useState<[number, number][]>(
    SKETCH_X_POINTS.map((x) => [x, 0]),
  );

  // 4. Calculations
  const f = useCallback(
    (x: number) => {
      const { a, b, c, d } = targetFunction;
      return a * (x - b) * (x - c) * (x - d);
    },
    [targetFunction],
  );

  // Exact derivative of the cubic: f'(x) = a * [ (x-c)(x-d) + (x-b)(x-d) + (x-b)(x-c) ]
  const fPrime = useCallback(
    (x: number) => {
      const { a, b, c, d } = targetFunction;
      return a * ((x - c) * (x - d) + (x - b) * (x - d) + (x - b) * (x - c));
    },
    [targetFunction],
  );

  // Heuristic Score Calculation
  const score = useMemo(() => {
    let totalError = 0;
    points.forEach(([x, y]) => {
      const actual = fPrime(x);
      totalError += Math.pow(y - actual, 2);
    });
    const rmse = Math.sqrt(totalError / points.length);
    const matchPercent = Math.max(0, 100 - rmse * 20); // Heuristic
    return matchPercent;
  }, [points, fPrime]);

  const isSuccess = score > 85;

  if (isFinished) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-obsidian-950 p-8 text-center animate-in fade-in duration-1000">
        <div className="w-24 h-24 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(99,102,241,0.1)]">
          <TrendingUp size={40} className="text-indigo-400 animate-pulse" />
        </div>
        <h2 className="text-5xl font-black text-white uppercase tracking-tighter mb-4">
          Mastering Slopes
        </h2>
        <p className="text-slate-400 max-w-md mb-12 uppercase tracking-[0.2em] text-[10px] font-bold leading-loose">
          Gefeliciteerd! Je hebt de relatie tussen $f(x)$ en $f'(x)$ visueel
          onder de knie gekregen. Je bent nu klaar voor de Kettingregel.
        </p>

        <div className="flex gap-4">
          <button
            onClick={restartSession}
            className="group relative overflow-hidden rounded-xl p-[1px] transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500" />
            <div className="relative px-8 py-4 bg-obsidian-950 rounded-[11px] flex items-center gap-3 group-hover:bg-indigo-950/20 transition-colors">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-white">
                Nieuwe Training
              </span>
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full text-white bg-obsidian-950 font-outfit selection:bg-indigo-500/30">
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-white/5 z-50">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-700 ease-out shadow-[0_0_15px_rgba(139,92,246,0.5)]"
          style={{
            width: `${((currentQuestion - 1) / totalQuestions) * 100}%`,
          }}
        />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Section */}
        <div className="p-6 border-b border-white/5 bg-black/20 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <TrendingUp size={16} className="text-indigo-400" />
              <span className="text-[10px] uppercase font-black tracking-widest text-indigo-400">
                Layer 2 Trainer
              </span>
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
              Helling Schetser
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1">
                Match Score
              </span>
              <div className="text-2xl font-black tabular-nums flex items-end gap-1">
                {Math.round(score)}
                <span className="text-xs text-slate-500 mb-1">%</span>
              </div>
            </div>
            <div className="w-px h-10 bg-white/5" />
            <div className="text-right">
              <div className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1">
                Progressie
              </div>
              <div className="text-xl font-bold text-white tabular-nums">
                {currentQuestion}{" "}
                <span className="text-slate-600 text-sm">
                  / {totalQuestions}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-2 p-6 gap-6 overflow-hidden">
          {/* Top Graph: f(x) */}
          <div className="flex flex-col h-full bg-white/[0.02] border border-white/5 rounded-[40px] overflow-hidden relative group">
            <div className="absolute top-6 left-8 z-10 flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">
                Origineel
              </span>
              <h3 className="text-lg font-black text-white uppercase tracking-tighter">
                Functie f(x)
              </h3>
            </div>
            <div className="absolute top-6 right-8 z-10 p-3 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/5 pointer-events-none">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed max-w-[180px]">
                Kijk naar de{" "}
                <span className="text-indigo-400 underline decoration-indigo-400/30">
                  toppen
                </span>
                . Daar is de helling nul.
              </p>
            </div>
            <div className="flex-1 elite-alive-glow bg-white/[0.01]">
              <Mafs viewBox={{ x: [-5, 5], y: [-5, 5] }} height={350}>
                <Coordinates.Cartesian />
                <Plot.OfX y={f} color="#818cf8" weight={3} />
                {/* Marker for maxima/minima to help the student */}
                {showValidation && (
                  <>
                    {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((x) => {
                      const h = 0.001;
                      const der = (f(x + h) - f(x - h)) / (2 * h);
                      if (Math.abs(der) < 0.5) {
                        return (
                          <Point
                            key={x}
                            x={x}
                            y={f(x)}
                            color="#818cf8"
                            opacity={0.5}
                          />
                        );
                      }
                      return null;
                    })}
                  </>
                )}
              </Mafs>
            </div>
          </div>

          {/* Bottom Graph: f'(x) Sketch area */}
          <div className="flex flex-col h-full bg-white/[0.02] border border-white/10 rounded-[40px] overflow-hidden relative group shadow-2xl">
            <div className="absolute inset-0 bg-indigo-500/[0.02] elite-alive-glow pointer-events-none" />
            <div className="absolute top-6 left-8 z-10 flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-1">
                Jouw Schets
              </span>
              <h3 className="text-lg font-black text-white uppercase tracking-tighter">
                Afgeleide f'(x)
              </h3>
            </div>

            <div className="flex-1 p-4 relative">
              <Mafs viewBox={{ x: [-5, 5], y: [-5, 5] }} height={350}>
                <Coordinates.Cartesian />

                {/* Target Ghost (Only show on validation/success) */}
                {(showValidation || isSuccess) && (
                  <Plot.OfX
                    y={fPrime}
                    color="#ef4444"
                    style="dashed"
                    opacity={0.3}
                    weight={2}
                  />
                )}

                {/* Player's Connecting Line (The Spline) */}
                <Plot.OfX
                  y={(x) => {
                    // Simple linear interpolation between points
                    const sorted = [...points].sort((a, b) => a[0] - b[0]);
                    for (let i = 0; i < sorted.length - 1; i++) {
                      const p1 = sorted[i];
                      const p2 = sorted[i + 1];
                      if (p1 && p2 && x >= p1[0] && x <= p2[0]) {
                        const t = (x - p1[0]) / (p2[0] - p1[0]);
                        return p1[1] * (1 - t) + p2[1] * t;
                      }
                    }
                    return 0;
                  }}
                  color={isSuccess ? "#10b981" : "#818cf8"}
                  weight={4}
                />

                {/* Interactive Points */}
                {points.map((p, idx) => (
                  <MovablePoint
                    key={idx}
                    point={[p[0], p[1]]}
                    onMove={(newPoint) => {
                      const newPoints = [...points];
                      // Lock X, allow Y
                      newPoints[idx] = [
                        p[0],
                        Math.max(-10, Math.min(10, newPoint[1])),
                      ];
                      setPoints(newPoints);
                    }}
                    color={isSuccess ? "#10b981" : "#818cf8"}
                  />
                ))}
              </Mafs>
            </div>

            {/* Controls Overlay */}
            <div className="p-8 border-t border-white/5 bg-black/40 flex items-center justify-between">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">
                Sleep de <span className="text-white">punten</span> om de
                hellinggrafiek te tekenen.
              </p>

              <div className="flex gap-4">
                {!showValidation ? (
                  <button
                    onClick={() => setShowValidation(true)}
                    className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 transition-all hover:scale-105 active:scale-95"
                  >
                    Check Helling
                  </button>
                ) : (
                  <button
                    onClick={generateNewChallenge}
                    disabled={!isSuccess}
                    className={`group relative overflow-hidden rounded-xl p-[1px] transition-all duration-300 shadow-xl ${!isSuccess ? "opacity-50 grayscale cursor-not-allowed" : "hover:scale-105 active:scale-95"}`}
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-r ${isSuccess ? "from-emerald-500 to-teal-500" : "from-slate-500 to-slate-600"}`}
                    />
                    <div className="relative px-8 py-3 bg-obsidian-950 rounded-[11px] flex items-center justify-center gap-3 transition-colors">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                        {isSuccess ? "Volgende" : "Score te laag"}
                      </span>
                      {isSuccess && (
                        <ArrowRight
                          size={14}
                          className="group-hover:translate-x-1 transition-transform"
                        />
                      )}
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
