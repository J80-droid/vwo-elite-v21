import React, { useEffect, useRef, useState } from "react";

import { useInterferenceEngine } from "./useInterferenceEngine";

export const InterferenceStage: React.FC = () => {
  const { state, setParam, setDetectorParam } = useInterferenceEngine();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // Resize Observer to handle canvas size
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
        canvasRef.current.width = clientWidth * ratio;
        canvasRef.current.height = clientHeight * ratio;
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const step = state.resolution || 2;

    const imgData = ctx.createImageData(w, h);
    const data = imgData.data;

    // Physics Constants (Normalized units 0..1)
    const lam = state.wavelength;
    const k = (2 * Math.PI) / (lam || 0.1);
    const omega = 2 * Math.PI * state.frequency;
    const t = state.time;
    const phaseOffset = omega * t;

    const s1 = state.source1;
    const s2 = state.source2;
    const mode = state.mode || "instant";

    // Viewport
    const zoom = state.zoom || 1;
    const panX = state.panX || 0;
    const panY = state.panY || 0;

    // Render Loop
    for (let y = 0; y < h; y += step) {
      // Map pixel y to world y: [0..h] -> [0..1] through zoom/pan
      const uy = (y / h - 0.5) / zoom + 0.5 + panY;

      for (let x = 0; x < w; x += step) {
        const ux = (x / w - 0.5) / zoom + 0.5 + panX;

        const dx1 = ux - s1.x;
        const dy1 = uy - s1.y;
        const r1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);

        const dx2 = ux - s2.x;
        const dy2 = uy - s2.y;
        const r2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

        // Amplitude decay (1/sqrt(r)) - Clamp r to avoid infinity
        const amp1 = 1 / Math.sqrt(Math.max(0.02, r1 * 10));
        const amp2 = 1 / Math.sqrt(Math.max(0.02, r2 * 10));

        let val = 0;

        if (mode === "instant") {
          const u1 = amp1 * Math.sin(k * r1 - phaseOffset + s1.phase);
          const u2 = amp2 * Math.sin(k * r2 - phaseOffset + s2.phase);
          if (s1.active) val += u1;
          if (s2.active) val += u2;
        } else {
          if (s1.active && s2.active) {
            const deltaPhi = k * (r2 - r1) + (s2.phase - s1.phase);
            // Generalized interference formula for different amplitudes
            val = Math.sqrt(
              amp1 * amp1 + amp2 * amp2 + 2 * amp1 * amp2 * Math.cos(deltaPhi),
            );
          } else if (s1.active) {
            val = amp1;
          } else if (s2.active) {
            val = amp2;
          }
        }

        let r = 0,
          g = 0,
          b = 0;
        const brightness = 200;

        if (mode === "instant") {
          if (val > 0) r = Math.min(255, val * brightness);
          else b = Math.min(255, -val * brightness);
        } else {
          const intensity = Math.min(255, val * brightness);
          r = intensity;
          g = intensity * 0.2;
          b = intensity * 0.2;
        }

        // Fill block
        for (let sy = 0; sy < step && y + sy < h; sy++) {
          for (let sx = 0; sx < step && x + sx < w; sx++) {
            const idx = ((y + sy) * w + (x + sx)) * 4;
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
            data[idx + 3] = 255;
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);

    // --- Vector Overlays (transformed to screen pixels) ---
    const toScreen = (ux: number, uy: number) => ({
      x: ((ux - panX - 0.5) * zoom + 0.5) * w,
      y: ((uy - panY - 0.5) * zoom + 0.5) * h,
    });

    // 1. Nodal Lines
    if (state.showNodalLines && s1.active && s2.active) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 1;
      const overlayStep = Math.max(1, 4 / (zoom * 0.5)); // Dynamic step for zoom-independent sharpness
      ctx.beginPath();
      for (let x = 0; x < w; x += overlayStep) {
        for (let y = 0; y < h; y += overlayStep) {
          const ux = (x / w - 0.5) / zoom + 0.5 + panX;
          const uy = (y / h - 0.5) / zoom + 0.5 + panY;
          const r1 = Math.sqrt(Math.pow(ux - s1.x, 2) + Math.pow(uy - s1.y, 2));
          const r2 = Math.sqrt(Math.pow(ux - s2.x, 2) + Math.pow(uy - s2.y, 2));
          const ratio = Math.abs(r2 - r1) / (lam || 1);
          if (Math.abs((ratio % 1) - 0.5) < 0.05 / zoom) {
            ctx.moveTo(x, y);
            ctx.lineTo(x + 1, y + 1);
          }
        }
      }
      ctx.stroke();
    }

    // 2. Sources
    const drawSource = (
      srcX: number,
      srcY: number,
      color: string,
      active: boolean,
    ) => {
      if (!active) return;
      const pos = toScreen(srcX, srcY);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 5 * zoom, 0, Math.PI * 2);
      ctx.fill();
    };
    drawSource(s1.x, s1.y, "#34d399", s1.active);
    drawSource(s2.x, s2.y, "#38bdf8", s2.active);

    // 3. Detector
    if (state.detector.active) {
      const pos = toScreen(state.detector.x, state.detector.y);
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pos.x - 10, pos.y);
      ctx.lineTo(pos.x + 10, pos.y);
      ctx.moveTo(pos.x, pos.y - 10);
      ctx.lineTo(pos.x, pos.y + 10);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
      ctx.stroke();

      // Lines to sources
      ctx.setLineDash([5, 5]);
      if (s1.active) {
        const s1p = toScreen(s1.x, s1.y);
        ctx.strokeStyle = "rgba(52, 211, 153, 0.5)";
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(s1p.x, s1p.y);
        ctx.stroke();
      }
      if (s2.active) {
        const s2p = toScreen(s2.x, s2.y);
        ctx.strokeStyle = "rgba(56, 189, 248, 0.5)";
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(s2p.x, s2p.y);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }
  }, [state]);

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setParam("zoom", Math.max(0.5, Math.min(20, (state.zoom || 1) * delta)));
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX =
      "touches" in e && e.touches.length > 0
        ? e.touches[0]!.clientX
        : (e as React.MouseEvent).clientX;
    const clientY =
      "touches" in e && e.touches.length > 0
        ? e.touches[0]!.clientY
        : (e as React.MouseEvent).clientY;

    lastPos.current = { x: clientX, y: clientY };

    // If detector is active and we are near it, we might want to prioritize it.
    // For now, let's use Right-click or Alt-click for pan, or just check distance.
    const xNorm = (clientX - rect.left) / rect.width;
    const yNorm = (clientY - rect.top) / rect.height;
    const ux = (xNorm - 0.5) / (state.zoom || 1) + 0.5 + (state.panX || 0);
    const uy = (yNorm - 0.5) / (state.zoom || 1) + 0.5 + (state.panY || 0);

    const distToDetector = Math.sqrt(
      Math.pow(ux - state.detector.x, 2) + Math.pow(uy - state.detector.y, 2),
    );

    if (state.detector.active && distToDetector < 0.05) {
      setIsPanning(false);
    } else {
      setIsPanning(true);
    }
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX =
      "touches" in e && e.touches.length > 0
        ? e.touches[0]!.clientX
        : (e as React.MouseEvent).clientX;
    const clientY =
      "touches" in e && e.touches.length > 0
        ? e.touches[0]!.clientY
        : (e as React.MouseEvent).clientY;

    if (isPanning) {
      const dx = (clientX - lastPos.current.x) / rect.width / state.zoom;
      const dy = (clientY - lastPos.current.y) / rect.height / state.zoom;
      setParam("panX", (state.panX || 0) - dx);
      setParam("panY", (state.panY || 0) - dy);
      lastPos.current = { x: clientX, y: clientY };
    } else if (
      state.detector.active &&
      ("buttons" in e ? e.buttons === 1 : true)
    ) {
      const xNorm = (clientX - rect.left) / rect.width;
      const yNorm = (clientY - rect.top) / rect.height;
      const ux = (xNorm - 0.5) / (state.zoom || 1) + 0.5 + (state.panX || 0);
      const uy = (yNorm - 0.5) / (state.zoom || 1) + 0.5 + (state.panY || 0);
      setDetectorParam("x", Math.max(-2, Math.min(3, ux)));
      setDetectorParam("y", Math.max(-2, Math.min(3, uy)));
    }
  };

  // Derived Logic for HUD
  const d1 =
    state.detector.active && state.source1.active
      ? Math.sqrt(
          Math.pow(state.detector.x - state.source1.x, 2) +
            Math.pow(state.detector.y - state.source1.y, 2),
        )
      : 0;
  const d2 =
    state.detector.active && state.source2.active
      ? Math.sqrt(
          Math.pow(state.detector.x - state.source2.x, 2) +
            Math.pow(state.detector.y - state.source2.y, 2),
        )
      : 0;

  const UNIT_SCALE = 10;
  const r1 = d1 * UNIT_SCALE;
  const r2 = d2 * UNIT_SCALE;
  const deltaX = Math.abs(r2 - r1);
  const lam = state.wavelength * UNIT_SCALE;
  const ratio = lam > 0 ? deltaX / lam : 0;
  const isNode = Math.abs((ratio % 1) - 0.5) < 0.1;
  const isAntiNode =
    Math.abs(ratio % 1) < 0.1 || Math.abs((ratio % 1) - 1) < 0.1;

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative bg-black overflow-hidden select-none cursor-move"
      onWheel={handleWheel}
      onMouseDown={handlePointerDown}
      onTouchStart={handlePointerDown}
      onMouseMove={handlePointerMove}
      onTouchMove={handlePointerMove}
      onMouseUp={() => setIsPanning(false)}
      onTouchEnd={() => setIsPanning(false)}
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        style={{ imageRendering: "pixelated" }}
      />

      {/* Elite Header + Viewport HUD */}
      <div className="absolute top-4 left-4 pointer-events-none">
        <h2 className="text-2xl font-black text-white italic tracking-tighter drop-shadow-lg">
          2D <span className="text-sky-400">INTERFERENTIE</span>
        </h2>
        <div className="flex items-center gap-3">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
            ELITE PHYSICS ENGINE
          </div>
          <div className="text-[9px] text-white/20 font-mono mt-1 border-l border-white/10 pl-3">
            {state.zoom.toFixed(1)}x | {state.panX.toFixed(2)},{" "}
            {state.panY.toFixed(2)}
          </div>
        </div>
      </div>

      {state.detector.active &&
        state.source1.active &&
        state.source2.active && (
          <div className="absolute top-4 left-4 pointer-events-none space-y-2">
            <div className="bg-black/80 backdrop-blur border border-amber-500/30 p-3 rounded-xl shadow-xl text-xs font-mono">
              <div className="flex justify-between gap-4 text-emerald-400">
                <span>r1 (Groen)</span>
                <span>{r1.toFixed(2)}m</span>
              </div>
              <div className="flex justify-between gap-4 text-sky-400">
                <span>r2 (Blauw)</span>
                <span>{r2.toFixed(2)}m</span>
              </div>
              <div className="h-px bg-white/20 my-1" />
              <div className="flex justify-between gap-4 text-white font-bold">
                <span>Δx (|r2-r1|)</span>
                <span>{deltaX.toFixed(2)}m</span>
              </div>
              <div className="flex justify-between gap-4 text-slate-400">
                <span>λ (Golflengte)</span>
                <span>{lam.toFixed(2)}m</span>
              </div>
              <div className="h-px bg-white/20 my-1" />
              <div className="flex justify-between gap-4 items-center">
                <span>Δx / λ</span>
                <span className="text-amber-400 font-bold">
                  {ratio.toFixed(2)}
                </span>
              </div>
            </div>

            {(isNode || isAntiNode) && (
              <div
                className={`backdrop-blur border p-2 rounded-xl text-center shadow-xl font-black uppercase tracking-widest ${isNode ? "bg-indigo-900/80 border-indigo-500 text-white" : "bg-amber-900/80 border-amber-500 text-white"}`}
              >
                {isNode ? "KNOOPLIJN (Destructief)" : "BUIKLIJN (Constructief)"}
              </div>
            )}
          </div>
        )}
    </div>
  );
};
