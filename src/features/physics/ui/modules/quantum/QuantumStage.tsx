import { Sigma } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

import {
  barrierWavefunction,
  calculateExpectationValue,
  harmonicEnergy,
  harmonicWavefunction,
} from "./quantumMath";
import { useQuantumEngine } from "./useQuantumEngine";

const NEON_COLORS = [
  "#8b5cf6",
  "#3b82f6",
  "#06b6d4",
  "#10b981",
  "#84cc16",
  "#f59e0b",
  "#f97316",
  "#f43f5e",
];

export const QuantumStage: React.FC = () => {
  const state = useQuantumEngine();
  const { setParam, collapse } = state;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(0);
  const activeZoomRef = useRef<number>(150);
  const lastTimeRef = useRef<number>(0);

  // Mutable refs voor data om GC (Garbage Collection) te minimaliseren
  const currentProbabilityDistribution = useRef<{ x: number; prob: number }[]>(
    [],
  );

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const dragDistance = useRef(0);
  const [flashOpacity, setFlashOpacity] = useState(0);

  useEffect(() => {
    if (state.lastCollapseTime > 0) {
      const timeoutToken = setTimeout(() => {
        setFlashOpacity(0.8);
        setTimeout(() => setFlashOpacity(0), 150);
      }, 0);
      return () => clearTimeout(timeoutToken);
    }
    return undefined;
  }, [state.lastCollapseTime]);

  // Export Logic
  useEffect(() => {
    if (state.exportTrigger > 0 && canvasRef.current) {
      const link = document.createElement("a");
      link.download = `quantum-lab-${Date.now()}.png`;
      link.href = canvasRef.current.toDataURL("image/png");
      link.click();
    }
  }, [state.exportTrigger]);

  // Time Loop
  useEffect(() => {
    const animate = (time: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = time;
      const rawDelta = time - lastTimeRef.current;
      const delta = Math.min(rawDelta, 50);

      lastTimeRef.current = time;

      if (state.isPlaying) {
        const newTime = state.time + (delta / 1000) * state.simulationSpeed;
        setParam("time", newTime);
      }
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [state.isPlaying, state.simulationSpeed, setParam, state.time]);

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false }); // Optimization
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // 1. Reset
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#020408";
    ctx.fillRect(0, 0, w, h);

    // 2. Camera
    const cx = w / 2;
    const cy = h / 2;
    const calculatedZoom =
      state.zoom || Math.min(w, h) / (state.wellWidth * 2.0);
    activeZoomRef.current = calculatedZoom;

    ctx.translate(cx, cy);
    ctx.scale(calculatedZoom, calculatedZoom);
    ctx.translate(-state.panX, -state.panY);

    const L = state.wellWidth;
    const t = state.time;

    // 3. Grid & Axes
    ctx.lineWidth = 1 / calculatedZoom;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.font = `${10 / calculatedZoom}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(10, 0);
    ctx.stroke();

    const tickSpacing = 0.5;
    const startTick =
      Math.floor((-w / 2 / calculatedZoom + state.panX) / tickSpacing) *
      tickSpacing;
    const endTick =
      Math.ceil((w / 2 / calculatedZoom + state.panX) / tickSpacing) *
      tickSpacing;

    for (let x = startTick; x <= endTick; x += tickSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, -2 / calculatedZoom);
      ctx.lineTo(x, 2 / calculatedZoom);
      ctx.stroke();
      if (calculatedZoom > 40) {
        const label = Math.round(x * 10) / 10;
        ctx.fillText(label.toString(), x, 4 / calculatedZoom);
      }
    }

    if (calculatedZoom > 40) {
      ctx.fillStyle = "#94a3b8";
      ctx.fillText("Position (nm)", 0, 16 / calculatedZoom);
    }

    // Potential Well / Trap
    ctx.lineWidth = 3 / calculatedZoom;
    ctx.strokeStyle = "#94a3b8";
    ctx.beginPath();

    if (state.potentialType === "harmonic") {
      const omega = 4.0 / L;
      const m = state.mass;
      const k = m * omega * omega;
      // Step size optimization for rendering potential
      const step = 2 / calculatedZoom;
      const xStart = -w / 2 / calculatedZoom + state.panX;
      const xEnd = w / 2 / calculatedZoom + state.panX;

      let first = true;
      for (let px = xStart; px <= xEnd; px += step) {
        const vy = 0.5 * k * px * px * 0.5;
        if (vy > h / 2 / calculatedZoom + 10) continue;
        if (first) {
          ctx.moveTo(px, -vy);
          first = false;
        } else {
          ctx.lineTo(px, -vy);
        }
      }
      ctx.stroke();
    } else if (state.potentialType === "barrier") {
      // Barrier Visualization
      const bw = state.barrierWidth;
      const bh = state.barrierHeight * (1 / 40); // Scale V to Y coordinate visually

      ctx.fillStyle = "rgba(16, 185, 129, 0.2)"; // Emerald tint
      ctx.fillRect(-bw / 2, -bh, bw, bh);

      ctx.strokeStyle = "#10b981"; // Emerald
      ctx.beginPath();
      // Floor
      ctx.moveTo(-w, 0);
      ctx.lineTo(-bw / 2, 0);
      ctx.lineTo(-bw / 2, -bh);
      ctx.lineTo(bw / 2, -bh);
      ctx.lineTo(bw / 2, 0);
      ctx.lineTo(w, 0);
      ctx.stroke();
    } else {
      // Infinite Well
      const wallHeight = (h / calculatedZoom) * 1.5;
      ctx.fillStyle = "rgba(30, 41, 59, 0.5)";
      ctx.fillRect(-L / 2 - 1, -wallHeight, 1, wallHeight * 2);
      ctx.fillRect(L / 2, -wallHeight, 1, wallHeight * 2);
      ctx.beginPath();
      ctx.moveTo(-L / 2, -wallHeight);
      ctx.lineTo(-L / 2, wallHeight);
      ctx.moveTo(L / 2, -wallHeight);
      ctx.lineTo(L / 2, wallHeight);
      ctx.stroke();
    }

    // 4. Measurements Histogram
    if (state.measurements.length > 0) {
      const maxCount = Math.max(...state.measurements.map((m) => m.count));
      const histScale = 1.5 / maxCount;
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      const binWidth = 0.1;
      state.measurements.forEach((bin) => {
        ctx.fillRect(
          bin.x - binWidth / 2,
          0,
          binWidth,
          -(bin.count * histScale),
        );
      });
    }

    // 5. Wavefunction Calculation & Draw
    // Optimization: Avoid allocation in loop
    const dx = 0.01;
    let xRange = L / 2;
    if (state.potentialType === "harmonic") xRange = L * 1.8;
    else if (state.potentialType === "barrier") xRange = L * 1.5;

    const xMax = xRange;

    // Clear previous distribution array but keep ref
    currentProbabilityDistribution.current = [];
    const distribution = currentProbabilityDistribution.current;

    const totalCoeffSq = state.activeStates.reduce(
      (acc, s) => acc + s.coefficient ** 2,
      0,
    );
    const normFactor = Math.sqrt(totalCoeffSq);

    const mainColor = state.viewMode === "probability" ? "#f43f5e" : "#8b5cf6";
    ctx.shadowColor = mainColor;
    ctx.shadowBlur = state.viewMode !== "complex" ? 20 : 0;
    ctx.strokeStyle = mainColor;

    ctx.beginPath();
    let firstPoint = true;

    // Loop variables declaration outside
    let psiRe = 0,
      psiIm = 0;
    let prob = 0,
      mag = 0,
      phaseVal = 0,
      yVal = 0;

    // Complex phase drawing buffers
    const complexPoints: { x: number; y: number; phase: number }[] = [];

    for (let x = -xRange; x <= xRange; x += dx) {
      psiRe = 0;
      psiIm = 0;

      if (state.potentialType === "barrier") {
        // Single Energy State assumption for barrier demo
        // Use 'energyLevel' as E
        const res = barrierWavefunction(
          x,
          state.energyLevel,
          state.barrierHeight,
          state.barrierWidth,
          state.mass,
        );
        const E = state.energyLevel;
        const timePhase = E * t * 0.1; // Slow down animation

        const cosT = Math.cos(timePhase);
        const sinT = Math.sin(timePhase);

        psiRe = res.re * cosT + res.im * sinT;
        psiIm = res.im * cosT - res.re * sinT;
      } else {
        // Inner loop over active states
        for (const s of state.activeStates) {
          const n = s.n;
          const c = s.coefficient / normFactor;
          let spatial = 0;
          let En = 0;

          if (state.potentialType === "harmonic") {
            spatial = harmonicWavefunction(n - 1, x, state.mass, L);
            En = harmonicEnergy(n - 1, state.mass, L);
          } else {
            // Infinite well logic inside
            if (x > -L / 2 && x < L / 2) {
              spatial =
                Math.sqrt(2 / L) * Math.sin((n * Math.PI * (x + L / 2)) / L);
            }
            En = (n * n * Math.PI * Math.PI) / (2 * state.mass * L * L);
          }

          const phase = En * t;
          const cosP = Math.cos(phase);
          const sinP = Math.sin(phase);

          psiRe += c * spatial * cosP;
          psiIm += c * spatial * -sinP; // e^-iEt
        }
      }

      prob = psiRe * psiRe + psiIm * psiIm;
      distribution.push({ x, prob }); // Store for collapse logic

      if (state.viewMode === "probability") {
        yVal = prob;
      } else if (state.viewMode === "complex") {
        mag = Math.sqrt(prob);
        yVal = mag;
        phaseVal = Math.atan2(psiIm, psiRe);
        complexPoints.push({ x, y: -yVal, phase: phaseVal });
      } else {
        yVal = psiRe;
      }

      if (firstPoint) {
        ctx.moveTo(x, -yVal);
        firstPoint = false;
      } else {
        ctx.lineTo(x, -yVal);
      }
    }

    if (state.viewMode !== "complex") {
      ctx.stroke();

      // Fill
      ctx.lineTo(xMax, 0);
      ctx.lineTo(-xRange, 0);
      ctx.fillStyle =
        state.viewMode === "probability"
          ? "rgba(244, 63, 94, 0.2)"
          : "rgba(139, 92, 246, 0.2)";
      ctx.fill();
    } else {
      // Custom rendering for complex phase strokes
      if (complexPoints.length > 1) {
        ctx.fillStyle = "rgba(139, 92, 246, 0.1)";
        ctx.fill(); // Fill generic background

        // Draw colored edge
        for (let i = 0; i < complexPoints.length - 1; i++) {
          const p1 = complexPoints[i];
          const p2 = complexPoints[i + 1];
          if (!p1 || !p2) continue;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          const hue = ((p1.phase * 180) / Math.PI + 360) % 360;
          ctx.strokeStyle = `hsl(${hue}, 100%, 60%)`;
          ctx.stroke();
        }
      }
    }

    ctx.shadowBlur = 0;

    // 6. Expectation Value (<x>)
    if (state.showExpectation && distribution.length > 0) {
      const avgX = calculateExpectationValue(
        distribution.map((d) => ({ ...d, y: 0 })),
      ); // Map to fit interface

      ctx.beginPath();
      ctx.setLineDash([2, 4]);
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 1 / calculatedZoom;
      ctx.moveTo(avgX, -2);
      ctx.lineTo(avgX, 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.fillStyle = "#10b981";
      ctx.arc(avgX, 0, 6 / calculatedZoom, 0, Math.PI * 2);
      ctx.fill();

      if (calculatedZoom > 100) {
        ctx.fillText("<x>", avgX + 0.1, -0.2);
      }
    }

    // 7. Ghost Overlay
    if (state.hoveredState !== null) {
      const n = state.hoveredState;
      // Re-use logic briefly or keep simple
      ctx.beginPath();
      let firstG = true;

      for (let x = -xRange; x <= xRange; x += dx) {
        let spatial = 0;
        let En = 0;

        if (state.potentialType === "harmonic") {
          spatial = harmonicWavefunction(n - 1, x, state.mass, L);
          En = harmonicEnergy(n - 1, state.mass, L);
        } else {
          if (x > -L / 2 && x < L / 2) {
            spatial =
              Math.sqrt(2 / L) * Math.sin((n * Math.PI * (x + L / 2)) / L);
          }
          En = (n * n * Math.PI * Math.PI) / (2 * state.mass * L * L);
        }

        const phase = En * t;
        const val =
          state.viewMode === "probability"
            ? spatial * spatial
            : spatial * Math.cos(phase);

        if (firstG) {
          ctx.moveTo(x, -val);
          firstG = false;
        } else {
          ctx.lineTo(x, -val);
        }
      }

      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 2 / calculatedZoom;
      ctx.strokeStyle = NEON_COLORS[n - 1] || "#ffffff";
      ctx.globalAlpha = 0.5;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1.0;
    }
  }, [state, dimensions]);

  // Event Handlers
  const handleWheel = (e: React.WheelEvent) => {
    const currentZoom = activeZoomRef.current;
    const newZoom = Math.max(50, currentZoom * (1 - e.deltaY * 0.001));
    setParam("zoom", newZoom);
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    let clientX = 0,
      clientY = 0;
    if ("touches" in e) {
      const touch = e.touches[0];
      if (touch) {
        clientX = touch.clientX;
        clientY = touch.clientY;
      }
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    lastPos.current = { x: clientX, y: clientY };
    dragDistance.current = 0;
    setIsPanning(true);
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isPanning) return;
    let clientX = 0,
      clientY = 0;
    if ("touches" in e) {
      const touch = e.touches[0];
      if (touch) {
        clientX = touch.clientX;
        clientY = touch.clientY;
      }
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    const dx = (clientX - lastPos.current.x) / activeZoomRef.current;
    const dy = (clientY - lastPos.current.y) / activeZoomRef.current;
    dragDistance.current +=
      Math.abs(clientX - lastPos.current.x) +
      Math.abs(clientY - lastPos.current.y);

    setParam("panX", state.panX - dx);
    setParam("panY", state.panY - dy);
    lastPos.current = { x: clientX, y: clientY };
  };

  const handlePointerUp = () => {
    setIsPanning(false);
    if (dragDistance.current < 5) {
      collapse(currentProbabilityDistribution.current);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        const dpr = window.devicePixelRatio || 1;
        canvasRef.current.width = containerRef.current.clientWidth * dpr;
        canvasRef.current.height = containerRef.current.clientHeight * dpr;
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative bg-black overflow-hidden select-none cursor-crosshair"
      onWheel={handleWheel}
      onMouseDown={handlePointerDown}
      onTouchStart={handlePointerDown}
      onMouseMove={handlePointerMove}
      onTouchMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchEnd={handlePointerUp}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Flash Effect */}
      <div
        className="absolute inset-0 bg-white pointer-events-none transition-opacity duration-300 ease-out mix-blend-overlay"
        style={{ opacity: flashOpacity }}
      />

      {/* HUD */}
      <div className="absolute top-4 left-4 pointer-events-none select-none">
        <h2 className="text-2xl font-black text-white italic tracking-tighter drop-shadow-lg">
          QUANTUM <span className="text-violet-500">LAB</span>
        </h2>
        <div className="flex items-center gap-3">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
            ELITE PHYSICS ENGINE
          </div>
          <div className="text-[9px] text-white/20 font-mono mt-1 border-l border-white/10 pl-3">
            T = {state.time.toFixed(2)} | CLICK TO MEASURE
          </div>
        </div>
      </div>

      {/* Formula Overlay */}
      {state.showFormulas && (
        <div className="absolute top-4 right-4 p-4 bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl max-w-xs text-white pointer-events-none select-none z-50">
          <div className="flex items-center gap-2 mb-2 border-b border-white/10 pb-2">
            <Sigma size={16} className="text-violet-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Theoretical Model
            </h3>
          </div>
          <div className="space-y-3">
            {state.potentialType === "infinite-well" ? (
              <>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase">
                    Infinite Square Well
                  </p>
                  <div className="font-mono text-sm bg-white/5 p-2 rounded border border-white/5 text-center">
                    E_n = <span className="text-violet-400">n²</span> · (h² /
                    8mL²)
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase">
                    Wavefunction
                  </p>
                  <div className="font-mono text-sm bg-white/5 p-2 rounded border border-white/5 text-center">
                    Ψ_n(x) = √(2/L) · sin(nπx/L)
                  </div>
                </div>
              </>
            ) : state.potentialType === "harmonic" ? (
              <>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase">
                    Harmonic Oscillator
                  </p>
                  <div className="font-mono text-sm bg-white/5 p-2 rounded border border-white/5 text-center">
                    E_n = ℏω · (n - ½)
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase">
                    Potential Barrier
                  </p>
                  <div className="font-mono text-sm bg-white/5 p-2 rounded border border-white/5 text-center">
                    E &lt; V₀ (Tunneling) vs E &gt; V₀ (Transmission)
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
