import React, { useEffect, useMemo, useRef, useState } from "react";

import { Point } from "../../common/AnalysisTools";
import { useWavesEngine, WavesState } from "./useWavesEngine";

export const WavesStage: React.FC = () => {
  const { state, setParam, setProbeParam } = useWavesEngine();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isPanning, setIsPanning] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const width = dimensions.width || 800;
  const tVal = state.time;

  interface ExtendedPoint extends Point {
    y1?: number | undefined;
    y2?: number | undefined;
    env?: number | undefined;
  }

  // Points calculation (World Space)
  const points = useMemo(() => {
    const pts: ExtendedPoint[] = [];
    const w1 = state.wave1;
    const w2 = state.wave2;
    const harmonics = state.harmonics;

    if (harmonics.isEnabled) {
      const mode = harmonics.mode || "string";
      for (let x = 0; x <= harmonics.L; x += 2) {
        let spatialPart = 0;
        if (mode === "string") {
          spatialPart = Math.sin((harmonics.n * Math.PI * x) / harmonics.L);
        } else if (mode === "open") {
          spatialPart = Math.cos((harmonics.n * Math.PI * x) / harmonics.L);
        } else if (mode === "closed") {
          const k = ((2 * harmonics.n - 1) * Math.PI) / (2 * harmonics.L);
          spatialPart = Math.sin(k * x);
        }
        const val =
          2 * w1.A * spatialPart * Math.cos(2 * Math.PI * w1.f * tVal);
        pts.push({ x, y: val });
      }
    } else {
      const zoom = state.zoom || 1;
      const worldLeft = state.panX - width / zoom;
      const worldRight = state.panX + (width / zoom) * 2;

      // Detection of "Beats" mode for envelope: Same direction, different frequencies
      const isBeatsMode =
        w1.active &&
        w2.active &&
        w1.direction === w2.direction &&
        Math.abs(w1.f - w2.f) > 0.05;

      for (let x = worldLeft; x < worldRight; x += 2) {
        let y1 = 0;
        if (w1.active) {
          const xEff = x - (w1.xOffset || 0);
          y1 =
            w1.A *
            Math.sin(
              2 * Math.PI * w1.f * (tVal + (w1.direction || 1) * xEff * 0.002) +
                w1.phi,
            );
        }
        let y2 = 0;
        if (w2.active) {
          const xEff = x - (w2.xOffset || 0);
          y2 =
            w2.A *
            Math.sin(
              2 *
                Math.PI *
                w2.f *
                (tVal + (w2.direction || -1) * xEff * 0.002) +
                w2.phi,
            );
        }

        let env = undefined;
        if (isBeatsMode) {
          // General Envelope: A_env = sqrt(A1^2 + A2^2 + 2A1A2 cos(delta_phi))
          const deltaPhi =
            2 * Math.PI * (w2.f - w1.f) * tVal +
            2 * Math.PI * (w2.f - w1.f) * x * 0.002 +
            (w2.phi - w1.phi);
          env = Math.sqrt(
            w1.A ** 2 + w2.A ** 2 + 2 * w1.A * w2.A * Math.cos(deltaPhi),
          );
        }

        pts.push({ x, y: y1 + y2, y1, y2, env });
      }
    }
    return pts;
  }, [
    state.wave1,
    state.wave2,
    state.harmonics,
    state.panX,
    state.zoom,
    tVal,
    width,
  ]);

  // Draw to Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#020408";
    ctx.fillRect(0, 0, w, h);

    const zoom = state.zoom || 1;
    const cx = w / 2;
    const cy = h / 2;

    ctx.translate(cx, cy);
    ctx.scale(zoom, zoom);

    ctx.translate(-state.panX, -state.panY);

    if (state.harmonics?.isEnabled) {
      ctx.translate(-state.harmonics.L / 2, 0);
    } else {
      ctx.translate(-w / 2, 0);
    }

    // --- Grid ---
    const step = 50;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    ctx.lineWidth = 1 / zoom;
    ctx.beginPath();
    for (let gx = -5000; gx < 5000; gx += step) {
      ctx.moveTo(gx, -1000);
      ctx.lineTo(gx, 1000);
    }
    for (let gy = -1000; gy < 1000; gy += step) {
      ctx.moveTo(-5000, gy);
      ctx.lineTo(5000, gy);
    }
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 2 / zoom;
    ctx.beginPath();
    ctx.moveTo(-5000, 0);
    ctx.lineTo(5000, 0);
    ctx.stroke();

    // Determine Colors Based on Mode
    const w1 = state.wave1;
    const w2 = state.wave2;
    const hams = state.harmonics;
    const w2Active = w2?.active;

    let resultantColor = "#10b981"; // Default Emerald
    let envelopeColor = "rgba(255, 255, 255, 0.2)"; // Default subtle white
    let envelopeGlow = false;

    if (hams?.isEnabled) {
      resultantColor = "#f43f5e"; // Rose (Matches sidebar)
    } else if (w2Active) {
      if (w1.direction === w2.direction) {
        resultantColor = "#0ea5e9"; // Sky Blue (Beats)
        envelopeColor = "#7dd3fc"; // Neon Sky (Envelope)
        envelopeGlow = true;
      } else {
        resultantColor = "#fbbf24"; // Amber/Gold (Standing)
      }
    }

    // --- Waves ---
    if (points.length > 0) {
      if (state.isLongitudinal) {
        ctx.strokeStyle =
          w2Active || hams?.isEnabled ? resultantColor : "#10b981";
        ctx.lineWidth = 2 / zoom;
        const particleStep = 4;
        ctx.beginPath();
        for (let i = 0; i < points.length; i += particleStep) {
          const p = points[i];
          if (p) {
            ctx.moveTo(p.x + p.y, -30);
            ctx.lineTo(p.x + p.y, 30);
          }
        }
        ctx.stroke();
      } else {
        const p0 = points[0];
        if (!p0) return;

        // Components (Subtle/Conditional)
        if (w2Active && !hams?.isEnabled) {
          ctx.lineWidth = 1.5 / zoom;
          ctx.setLineDash([5, 5]);

          if (w1.active && w1.A > 0) {
            ctx.strokeStyle = "rgba(16, 185, 129, 0.15)";
            ctx.beginPath();
            ctx.moveTo(p0.x, -(p0.y1 ?? 0));
            for (let i = 1; i < points.length; i++) {
              const pt = points[i];
              if (pt) ctx.lineTo(pt.x, -(pt.y1 ?? 0));
            }
            ctx.stroke();
          }

          if (w2.active && w2.A > 0) {
            ctx.strokeStyle = "rgba(56, 189, 248, 0.15)";
            ctx.beginPath();
            ctx.moveTo(p0.x, -(p0.y2 ?? 0));
            for (let i = 1; i < points.length; i++) {
              const pt = points[i];
              if (pt) ctx.lineTo(pt.x, -(pt.y2 ?? 0));
            }
            ctx.stroke();
          }
          ctx.setLineDash([]);
        }

        // Modulation Envelope (Beats)
        if (p0.env !== undefined) {
          ctx.strokeStyle = envelopeColor;
          ctx.lineWidth = 1.2 / zoom;
          ctx.setLineDash([10, 5]);
          if (envelopeGlow) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = envelopeColor;
          }
          ctx.beginPath();
          ctx.moveTo(p0.x, -p0.env);
          for (let i = 1; i < points.length; i++) {
            const pt = points[i];
            const env = pt?.env;
            if (pt && env !== undefined) ctx.lineTo(pt.x, -env);
          }
          ctx.moveTo(p0.x, p0.env);
          for (let i = 1; i < points.length; i++) {
            const pt = points[i];
            const env = pt?.env;
            if (pt && env !== undefined) ctx.lineTo(pt.x, env);
          }
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.shadowBlur = 0;
        }

        // Resultant
        ctx.strokeStyle = resultantColor;
        ctx.lineWidth = 4 / zoom;
        ctx.shadowBlur = 20;
        ctx.shadowColor = resultantColor;
        ctx.beginPath();
        ctx.moveTo(p0.x, -p0.y);
        for (let i = 1; i < points.length; i++) {
          const pt = points[i];
          if (pt) ctx.lineTo(pt.x, -pt.y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }

    // Probe
    const probe = state.probe;
    if (probe?.isActive) {
      const px = probe.x;
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 1 / zoom;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(px, -300);
      ctx.lineTo(px, 300);
      ctx.stroke();
      ctx.setLineDash([]);

      const firstPoint = points[0];
      if (firstPoint) {
        const idx = Math.floor((px - firstPoint.x) / 2);
        const p = points[idx];
        if (p) {
          ctx.fillStyle = "#ef4444";
          ctx.beginPath();
          const markerX = state.isLongitudinal ? p.x + p.y : p.x;
          const markerY = state.isLongitudinal ? 0 : -p.y;
          ctx.arc(markerX, markerY, 8 / zoom, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Boundaries
    if (hams?.isEnabled) {
      const L = hams.L;
      ctx.strokeStyle = "#f43f5e";
      ctx.lineWidth = 5 / zoom;
      ctx.beginPath();
      ctx.moveTo(0, -100);
      ctx.lineTo(0, 100);
      ctx.moveTo(L, -100);
      ctx.lineTo(L, 100);
      ctx.stroke();
    }
  }, [
    points,
    state.zoom,
    state.panX,
    state.panY,
    state.wave2?.active,
    state.harmonics,
    state.wave1,
    state.wave2,
    state.isLongitudinal,
    state.probe,
  ]);

  // Event Handlers
  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setParam("zoom", Math.max(0.4, Math.min(10, (state.zoom || 1) * delta)));
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX =
      "touches" in e
        ? (e.touches[0]?.clientX ?? 0)
        : (e as React.MouseEvent).clientX;
    const clientY =
      "touches" in e
        ? (e.touches[0]?.clientY ?? 0)
        : (e as React.MouseEvent).clientY;
    lastPos.current = { x: clientX, y: clientY };
    setIsPanning(true);
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isPanning) return;
    const clientX =
      "touches" in e
        ? (e.touches[0]?.clientX ?? 0)
        : (e as React.MouseEvent).clientX;
    const clientY =
      "touches" in e
        ? (e.touches[0]?.clientY ?? 0)
        : (e as React.MouseEvent).clientY;
    const dx = (clientX - lastPos.current.x) / (state.zoom || 1);
    const dy = (clientY - lastPos.current.y) / (state.zoom || 1);
    setParam("panX", state.panX - dx);
    setParam("panY", state.panY - dy);
    lastPos.current = { x: clientX, y: clientY };
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isPanning && Math.abs(e.clientX - lastPos.current.x) > 5) return;
    if (!state.probe?.isActive) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mx = e.clientX - rect.left;
    const zoom = state.zoom || 1;
    const cx = rect.width / 2;
    const hams = state.harmonics;
    const offsetX = hams?.isEnabled ? -(hams.L ?? 0) / 2 : -rect.width / 2;
    const worldX = (mx - cx) / zoom + (state.panX ?? 0) - (offsetX ?? 0);

    setProbeParam("x", worldX);
  };

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current?.parentElement) {
        const w = canvasRef.current.parentElement.clientWidth;
        const h = canvasRef.current.parentElement.clientHeight;
        const ratio = Math.min(window.devicePixelRatio || 1, 1.5);

        canvasRef.current.width = w * ratio;
        canvasRef.current.height = h * ratio;
        setDimensions({ width: w, height: h });
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-black cursor-move"
      onWheel={handleWheel}
      onMouseDown={handlePointerDown}
      onTouchStart={handlePointerDown}
      onMouseMove={handlePointerMove}
      onTouchMove={handlePointerMove}
      onMouseUp={() => setIsPanning(false)}
      onTouchEnd={() => setIsPanning(false)}
      onClick={handleClick}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      {state.probe?.isActive && (
        <>
          <OscilloscopeOverlay state={state} x={state.probe.x} />
          <PhasorOverlay state={state} x={state.probe.x} />
          <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-none z-20">
            <div className="bg-black/60 backdrop-blur border border-white/10 rounded-full px-4 py-1 flex gap-4 text-xs font-mono text-white shadow-xl">
              <span className="text-slate-400">PROBE</span>
              <span className="text-emerald-400">
                x = {state.probe.x.toFixed(0)} px
              </span>
            </div>
          </div>
        </>
      )}

      <div className="absolute top-4 left-4 pointer-events-none">
        <h2 className="text-2xl font-black text-white italic tracking-tighter drop-shadow-lg">
          TRILLINGEN <span className="text-emerald-400">& GOLVEN</span>
        </h2>
        <div className="flex items-center gap-3">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
            ELITE PHYSICS ENGINE
          </div>
          <div className="text-[9px] text-white/20 font-mono mt-1 border-l border-white/10 pl-3">
            {state.zoom.toFixed(1)}x | {state.panX.toFixed(0)},{" "}
            {state.panY.toFixed(0)}
          </div>
        </div>
      </div>
    </div>
  );
};

const OscilloscopeOverlay = ({
  state,
  x,
}: {
  state: WavesState;
  x: number;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Setup visual parameters
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h); // ClearRect is sneller dan fillRect over alles
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(0, 0, w, h);

    // Grid line
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.stroke();

    // Trace
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 2;
    ctx.beginPath();

    const timeWindow = 1.0;
    const now = state.time;
    const w1 = state.wave1;
    const w2 = state.wave2;
    const hams = state.harmonics;

    for (let px = 0; px < w; px++) {
      const t = now - timeWindow + (px / w) * timeWindow;
      let val = 0;

      if (hams?.isEnabled) {
        const sp =
          hams.mode === "open"
            ? Math.cos((hams.n * Math.PI * x) / hams.L)
            : Math.sin((hams.n * Math.PI * x) / hams.L);
        val = 2 * w1.A * sp * Math.cos(2 * Math.PI * w1.f * t);
      } else {
        if (w1.active) {
          val +=
            w1.A *
            Math.sin(
              2 *
                Math.PI *
                w1.f *
                (t + w1.direction * (x - (w1.xOffset || 0)) * 0.002) +
                w1.phi,
            );
        }
        if (w2.active) {
          val +=
            w2.A *
            Math.sin(
              2 *
                Math.PI *
                w2.f *
                (t + w2.direction * (x - (w2.xOffset || 0)) * 0.002) +
                w2.phi,
            );
        }
      }
      const py = h / 2 - val * 0.5;
      if (px === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }, [state, x]); // Dependency is fine here

  return (
    <div className="absolute top-28 right-4 bg-black/80 border border-white/20 rounded-xl p-2 shadow-2xl backdrop-blur-md">
      <div className="text-[9px] font-bold text-slate-400 uppercase mb-1 flex justify-between">
        <span>u,t-diagram</span>
        <span className="text-red-400">x = {x.toFixed(0)}</span>
      </div>
      <canvas
        ref={canvasRef}
        width={200}
        height={100}
        className="w-[200px] h-[100px]"
      />
    </div>
  );
};

const PhasorOverlay = ({ state, x }: { state: WavesState; x: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = 100,
      h = 100,
      cx = 50,
      cy = 50;

    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.beginPath();
    ctx.arc(cx, cy, 40, 0, Math.PI * 2);
    ctx.stroke();

    const drawV = (amp: number, ang: number, color: string) => {
      // Scale amp for visibility inside the 100x100 box
      const r = Math.min(45, amp * 0.6);
      const vx = Math.cos(ang) * r;
      const vy = -Math.sin(ang) * r; // Canvas Y is inverted relative to math Y

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + vx, cy + vy);
      ctx.stroke();

      // Arrowhead (optional polish)
      ctx.beginPath();
      ctx.arc(cx + vx, cy + vy, 2, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    };

    const t = state.time;
    const w1 = state.wave1;
    const w2 = state.wave2;

    // Use safe accessors (|| 0) instead of !
    if (w1.active) {
      const phase =
        2 *
          Math.PI *
          w1.f *
          (t + w1.direction * (x - (w1.xOffset || 0)) * 0.002) +
        w1.phi;
      drawV(w1.A, phase, "#10b981");
    }
    if (w2.active) {
      const phase =
        2 *
          Math.PI *
          w2.f *
          (t + w2.direction * (x - (w2.xOffset || 0)) * 0.002) +
        w2.phi;
      drawV(w2.A, phase, "#38bdf8");
    }
  }, [state, x]);

  return (
    <div className="absolute top-28 left-4 bg-black/80 border border-white/20 rounded-xl p-2 shadow-2xl backdrop-blur-md flex flex-col items-center">
      <span className="text-[9px] font-bold text-slate-400 uppercase mb-1">
        Phasor
      </span>
      <canvas
        ref={canvasRef}
        width={100}
        height={100}
        className="w-[100px] h-[100px]"
      />
    </div>
  );
};
