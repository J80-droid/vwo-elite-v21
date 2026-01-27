/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable no-empty */
/* eslint-disable react-hooks/exhaustive-deps */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { math } from "@shared/lib/math/math-light";
import { Activity, Calculator, Grid, Moon, Sun } from "lucide-react";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

interface GraphPlotterProps {
  functions: (string | null | undefined)[];
  width?: number;
  height?: number;
  xDomain?: [number, number];
  yDomain?: [number, number];
  integral?: { fnIndex: number; from: number; to: number };
  intersections?: { x: number; y: number }[];
  // Dynamic Layout Props (Preserved from previous version)
  consoleExpanded?: boolean;
  consoleHeight?: number;
  // NEW: Plot mode support
  plotMode?: "cartesian" | "parametric" | "polar";
  // NEW: Audio Scanner
  scannerX?: number | null;
  // V2.0 Didactic Features
  riemannState?: {
    show: boolean;
    n: number;
    type: "left" | "right" | "midpoint" | "trapezoidal" | "simpson";
  };
  showTangent?: boolean;
  isTangentAnimating?: boolean;
  tangentSpeed?: number;
  showUnitCircle?: boolean;
  unitCircleMode?: "standard" | "components";
  highlightedPoints?: {
    x: number;
    y: number;
    label?: string;
    color?: string;
  }[];
  vectors?: {
    id?: string;
    x: number;
    y: number;
    z?: number;
    color?: string;
    symbol?: string;
  }[];
  // V2.1 VWO B/D Features
  showAsymptotes?: boolean;
  showSecantLine?: boolean;
  showDerivativeGraph?: boolean;
}

const COLORS = ["#00D1FF", "#F055BA", "#00FF9D", "#FFD166", "#A06CD5"];
const LEFT_PADDING = 40;
// const AXIS_PADDING = 40; // Replaced by dynamic logic

export interface GraphPlotterHandle {
  toggleSettings: () => void;
  resetView: () => void;
}

export const GraphPlotter = forwardRef<GraphPlotterHandle, GraphPlotterProps>(
  (
    {
      functions,
      width: _propWidth,
      height: _propHeight,
      xDomain = [-10, 10],
      yDomain = [-6, 6],
      integral,
      intersections,
      consoleExpanded = true,
      consoleHeight = 300,
      plotMode = "cartesian",
      scannerX = null,
      riemannState = { show: false, n: 10, type: "midpoint" },
      showTangent = false,
      isTangentAnimating = false,
      tangentSpeed = 1,
      showUnitCircle = false,
      unitCircleMode = "standard",
      highlightedPoints = [],
      vectors = [],
      showAsymptotes = false,
      showSecantLine = false,
      showDerivativeGraph = false,
    },
    ref,
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    // UI State
    const [showSettings, setShowSettings] = useState(false);

    // De Uitgebreide Settings State
    const [settings, setSettings] = useState({
      grid: true,
      darkMode: true, // Dit is je "Paper Mode" (False = Wit papier)
      axes: true,
      highQuality: true,
      scale: "linear" as "linear" | "log",
      // NIEUWE ELITE FEATURES:
      trigScale: false, // π op de x-as
      showDerivative: false, // f'(x) stippellijn
      showTangent: false, // Raaklijn bij cursor
      snapMode: "off" as "off" | "grid" | "function", // Magneet
    });

    const view = useRef({
      xMin: xDomain[0],
      xMax: xDomain[1],
      yMin: yDomain[0],
      yMax: yDomain[1],
    });

    const [cursorInfo, setCursorInfo] = useState<{
      x: number;
      y: number;
    } | null>(null);
    const [tangentAnimX, setTangentAnimX] = useState(0);

    // --- TANGENT ANIMATION LOOP ---
    useEffect(() => {
      if (!isTangentAnimating) return;

      let rafId: number;
      let lastTime = performance.now();
      const loop = (now: number) => {
        const dt = (now - lastTime) / 1000;
        setTangentAnimX((prev) => {
          const next = prev + dt * tangentSpeed * 2;
          const { xMin, xMax } = view.current;
          return next > xMax ? xMin : next;
        });
        lastTime = now;
        rafId = requestAnimationFrame(loop);
      };
      rafId = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(rafId);
    }, [isTangentAnimating, tangentSpeed]);
    const [size, setSize] = useState({ w: 800, h: 600 });

    // --- DYNAMIC PADDING LOGIC (Merged) ---
    const BOTTOM_PADDING = consoleExpanded ? consoleHeight + 20 : 80;

    // --- COORDINATE SYSTEM ---
    const getActiveHeight = () => size.h - BOTTOM_PADDING;
    const getActiveWidth = () => size.w - LEFT_PADDING; // Corrected width calculation

    const toScreen = (x: number, y: number) => {
      const { xMin, xMax, yMin, yMax } = view.current;
      const h = getActiveHeight();
      const w = getActiveWidth();

      const px = LEFT_PADDING + ((x - xMin) / (xMax - xMin)) * w;
      let py = 0;

      if (settings.scale === "log") {
        const safeY = Math.max(1e-9, y);
        const safeMin = Math.max(1e-9, yMin);
        const safeMax = Math.max(1e-9, yMax);
        const logMin = Math.log10(safeMin);
        const logMax = Math.log10(safeMax);
        const logY = Math.log10(safeY);
        py = h - ((logY - logMin) / (logMax - logMin)) * h;
      } else {
        py = h - ((y - yMin) / (yMax - yMin)) * h;
      }
      return { x: px, y: py };
    };

    const toMath = (px: number, py: number) => {
      const { xMin, xMax, yMin, yMax } = view.current;
      const h = getActiveHeight();
      const w = getActiveWidth();

      const x = xMin + ((px - LEFT_PADDING) / w) * (xMax - xMin);
      let y = 0;

      if (settings.scale === "log") {
        const safeMin = Math.max(1e-9, yMin);
        const safeMax = Math.max(1e-9, yMax);
        const logMin = Math.log10(safeMin);
        const logMax = Math.log10(safeMax);
        const resultLog = logMin + ((h - py) / h) * (logMax - logMin);
        y = Math.pow(10, resultLog);
      } else {
        y = yMin + ((h - py) / h) * (yMax - yMin);
      }
      return { x, y };
    };

    // --- RENDER ENGINE ---
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Achtergrond (Paper Mode vs Dark Mode)
      ctx.fillStyle = settings.darkMode ? "#0b0e11" : "#ffffff";
      ctx.fillRect(0, 0, size.w, size.h);

      const { xMin, xMax, yMin, yMax } = view.current;
      const h = getActiveHeight();

      // 1. Grid & Labels
      if (settings.grid) {
        ctx.strokeStyle = settings.darkMode ? "#334155" : "#e2e8f0";
        ctx.lineWidth = 1;
        ctx.beginPath();

        // X-AS LOGICA (Trig vs Decimal)
        const xRange = xMax - xMin;
        // Als Trig aan staat, schalen we op basis van PI
        const effectiveStep = settings.trigScale
          ? Math.PI / 2
          : Math.pow(10, Math.floor(Math.log10(xRange / 10)));
        const startX = Math.ceil(xMin / effectiveStep) * effectiveStep;

        for (let x = startX; x <= xMax; x += effectiveStep) {
          const { x: px } = toScreen(x, 0);
          if (px < -50 || px > size.w + 50) continue;

          ctx.moveTo(px, 0);
          ctx.lineTo(px, h);

          ctx.save();
          ctx.fillStyle = settings.darkMode ? "#FFFFFF" : "#64748b";
          ctx.font = "11px monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "top";

          let label = x.toPrecision(3).replace(/\.?0+$/, "");

          // TRIGONOMETRISCHE LABELS (π)
          if (settings.trigScale) {
            const piFrac = x / Math.PI;
            if (Math.abs(piFrac) < 0.01) label = "0";
            else if (Math.abs(piFrac - 1) < 0.01) label = "π";
            else if (Math.abs(piFrac + 1) < 0.01) label = "-π";
            else if (Math.abs(piFrac % 1) < 0.01)
              label = `${Math.round(piFrac)}π`;
            else if (Math.abs(piFrac % 0.5) < 0.01)
              label = `${piFrac.toFixed(1)}π`;
            else label = ""; // Sla lastige breuken over om clutter te voorkomen
          }

          if (label) ctx.fillText(label, px, h + 8);
          ctx.restore();
        }

        // Y-AS (Standaard logic)
        if (settings.scale === "log") {
          const safeMin = Math.max(1e-9, yMin);
          const safeMax = Math.max(1e-9, yMax);
          const minPow = Math.floor(Math.log10(safeMin));
          const maxPow = Math.ceil(Math.log10(safeMax));

          for (let p = minPow; p <= maxPow; p++) {
            const val = Math.pow(10, p);
            if (val < safeMin || val > safeMax) continue;

            const { y: py } = toScreen(0, val);

            ctx.moveTo(LEFT_PADDING, py);
            ctx.lineTo(size.w, py);

            ctx.save();
            ctx.fillStyle = settings.darkMode ? "#FFFFFF" : "#000000";
            ctx.font = "bold 12px sans-serif";
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            const expLabel =
              val >= 1000 || val <= 0.001
                ? val.toExponential(0)
                : val.toString();
            ctx.fillText(expLabel, 5, py - 4);
            ctx.restore();
          }
        } else {
          const yRange = yMax - yMin;
          const yStep = Math.pow(10, Math.floor(Math.log10(yRange / 8)));
          for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
            const { y: py } = toScreen(0, y);
            if (py < 0 || py > h) continue;
            ctx.moveTo(LEFT_PADDING, py);
            ctx.lineTo(size.w, py);
            ctx.save();
            ctx.fillStyle = settings.darkMode ? "#FFFFFF" : "#64748b";
            ctx.font = "11px monospace";
            ctx.textAlign = "left";
            ctx.textBaseline = "bottom";
            ctx.fillText(y.toPrecision(3).replace(/\.?0+$/, ""), 5, py - 4);
            ctx.restore();
          }
        }
        ctx.stroke();
      }

      // 2. Axes Lines
      if (settings.axes) {
        ctx.strokeStyle = settings.darkMode ? "#e2e8f0" : "#475569";
        ctx.lineWidth = 2;
        ctx.beginPath();
        const origin = toScreen(0, 0);
        if (xMin <= 0 && xMax >= 0) {
          ctx.moveTo(origin.x, 0);
          ctx.lineTo(origin.x, h);
        }
        if (settings.scale === "linear" && yMin <= 0 && yMax >= 0) {
          ctx.moveTo(LEFT_PADDING, origin.y);
          ctx.lineTo(size.w, origin.y);
        }
        ctx.stroke();
      }

      // 2b. Draw Integral Area (New)
      if (integral && functions[integral.fnIndex]) {
        const { fnIndex, from, to } = integral;
        const expr = functions[fnIndex];
        if (!expr) return;
        const startPx = toScreen(from, 0).x;
        const endPx = toScreen(to, 0).x;

        ctx.beginPath();
        ctx.moveTo(startPx, toScreen(from, 0).y); // Start at X-axis

        // Walk the curve
        const step = (to - from) / 100;
        for (let x = from; x <= to; x += step) {
          try {
            const y = math.evaluate(expr, { x, t: 0, theta: x });
            const pos = toScreen(x, y);
            ctx.lineTo(pos.x, pos.y);
          } catch (e) {}
        }

        ctx.lineTo(endPx, toScreen(to, 0).y); // Drop to X-axis
        ctx.fillStyle = "rgba(251, 191, 36, 0.3)"; // Amber-400 with opacity
        ctx.fill();
      }

      // 2c. Draw Riemann Sums (V2.0 + V2.1 Trapezoidal/Simpson)
      if (riemannState.show && integral && functions[integral.fnIndex]) {
        const { from, to } = integral;
        const { n, type } = riemannState;
        const fnStr = functions[integral.fnIndex]!;
        const dx = (to - from) / n;

        ctx.strokeStyle = "rgba(16, 185, 129, 0.8)"; // Emerald
        ctx.lineWidth = 1;

        if (type === "trapezoidal") {
          // TRAPEZOIDAL RULE: Draw trapezoids
          for (let i = 0; i < n; i++) {
            const x_left = from + i * dx;
            const x_right = x_left + dx;
            try {
              const y_left = math.evaluate(fnStr, {
                x: x_left,
                t: 0,
                theta: x_left,
              });
              const y_right = math.evaluate(fnStr, {
                x: x_right,
                t: 0,
                theta: x_right,
              });

              const pBL = toScreen(x_left, 0); // Bottom left
              const pTL = toScreen(x_left, y_left); // Top left
              const pTR = toScreen(x_right, y_right); // Top right
              const pBR = toScreen(x_right, 0); // Bottom right

              ctx.beginPath();
              ctx.moveTo(pBL.x, pBL.y);
              ctx.lineTo(pTL.x, pTL.y);
              ctx.lineTo(pTR.x, pTR.y);
              ctx.lineTo(pBR.x, pBR.y);
              ctx.closePath();
              ctx.fillStyle = "rgba(59, 130, 246, 0.3)"; // Blue-500
              ctx.fill();
              ctx.strokeStyle = "rgba(59, 130, 246, 0.8)";
              ctx.stroke();

              // Dots at both corners
              [pTL, pTR].forEach((pt) => {
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
                ctx.fillStyle = "#3b82f6";
                ctx.fill();
              });
            } catch (e) {}
          }
        } else if (type === "simpson") {
          // SIMPSON'S RULE: Draw parabolic arcs (groups of 2 intervals)
          const nPairs = Math.floor(n / 2);
          for (let i = 0; i < nPairs; i++) {
            const x0 = from + i * 2 * dx;
            const x1 = x0 + dx;
            const x2 = x0 + 2 * dx;
            try {
              const y0 = math.evaluate(fnStr, { x: x0, t: 0, theta: x0 });
              const y1 = math.evaluate(fnStr, { x: x1, t: 0, theta: x1 });
              const y2 = math.evaluate(fnStr, { x: x2, t: 0, theta: x2 });

              // Draw parabolic arc approximation with bezier
              const p0 = toScreen(x0, y0);
              const p1 = toScreen(x1, y1);
              const p2 = toScreen(x2, y2);
              const pB0 = toScreen(x0, 0);
              const pB2 = toScreen(x2, 0);

              // Fill path under parabola
              ctx.beginPath();
              ctx.moveTo(pB0.x, pB0.y);
              ctx.lineTo(p0.x, p0.y);
              // Quadratic bezier through midpoint
              const ctrlX = p1.x;
              const ctrlY = p1.y * 2 - (p0.y + p2.y) / 2; // Approximate parabola control
              ctx.quadraticCurveTo(ctrlX, ctrlY, p2.x, p2.y);
              ctx.lineTo(pB2.x, pB2.y);
              ctx.closePath();
              ctx.fillStyle = "rgba(168, 85, 247, 0.3)"; // Purple-500
              ctx.fill();
              ctx.strokeStyle = "rgba(168, 85, 247, 0.8)";
              ctx.stroke();

              // Dots at all three points
              [p0, p1, p2].forEach((pt) => {
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
                ctx.fillStyle = "#a855f7";
                ctx.fill();
              });
            } catch (e) {}
          }
        } else {
          // RECTANGLE METHODS: left, right, midpoint
          for (let i = 0; i < n; i++) {
            const x_start = from + i * dx;
            const x_end = x_start + dx;
            let x_eval = x_start;
            if (type === "right") x_eval = x_end;
            else if (type === "midpoint") x_eval = x_start + dx / 2;

            try {
              const y = math.evaluate(fnStr, {
                x: x_eval,
                t: 0,
                theta: x_eval,
              });
              const p1 = toScreen(x_start, 0);
              const p2 = toScreen(x_end, y);

              ctx.fillStyle = "rgba(16, 185, 129, 0.3)";
              ctx.fillRect(p1.x, p2.y, p2.x - p1.x, p1.y - p2.y);
              ctx.strokeStyle = "rgba(16, 185, 129, 0.8)";
              ctx.strokeRect(p1.x, p2.y, p2.x - p1.x, p1.y - p2.y);

              // Dot at evaluation point
              const pEval = toScreen(x_eval, y);
              ctx.beginPath();
              ctx.arc(pEval.x, pEval.y, 2, 0, Math.PI * 2);
              ctx.fillStyle = "#10b981";
              ctx.fill();
            } catch (e) {}
          }
        }
      }

      // 2d. Draw Tangent Line (V2.0)
      if (showTangent && functions[0]) {
        try {
          // Use tangentAnimX if animating, otherwise assume 0 or center if undefined, but logic initializes it to 0
          const x0 = tangentAnimX;
          const expr = math.compile(functions[0]!);
          const y0 = expr.evaluate({ x: x0 });

          // Calculate derivative numerically
          const h_eps = 0.001;
          const y1 = expr.evaluate({ x: x0 + h_eps });
          const slope = (y1 - y0) / h_eps;

          // Tangent line equation: y = slope * (x - x0) + y0
          const tangentFn = (x: number) => slope * (x - x0) + y0;

          const p1 = toScreen(xMin, tangentFn(xMin));
          const p2 = toScreen(xMax, tangentFn(xMax));

          ctx.save();
          ctx.strokeStyle = "#6366f1"; // Indigo-500
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
          ctx.restore();

          // Draw point at (x0, y0)
          const p0 = toScreen(x0, y0);
          ctx.beginPath();
          ctx.arc(p0.x, p0.y, 5, 0, Math.PI * 2);
          ctx.fillStyle = "#6366f1";
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 2;
          ctx.fill();
          ctx.stroke();

          // Draw label
          ctx.save();
          ctx.fillStyle = settings.darkMode ? "#fff" : "#000";
          ctx.font = "bold 12px sans-serif";
          const labelText = `x: ${x0.toFixed(1)}, m: ${slope.toFixed(2)}`;
          ctx.fillText(labelText, p0.x + 10, p0.y - 10);
          ctx.restore();
        } catch (e) {}
      }

      // 2e. Draw Unit Circle (V2.0)
      if (showUnitCircle) {
        const center = toScreen(0, 0);
        const xRadius = Math.abs(toScreen(1, 0).x - toScreen(0, 0).x);
        const yRadius = Math.abs(toScreen(0, 1).y - toScreen(0, 0).y);

        ctx.save();
        ctx.strokeStyle = "#f59e0b"; // Amber-500
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(center.x, center.y, xRadius, yRadius, 0, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.restore();

        if (unitCircleMode === "components") {
          // Use tangentAnimX as theta to allow animation synergy controls to drive this too
          // Or just use a separate timer if we wanted, but reusing logic keeps controls simple
          const theta = Math.abs(tangentAnimX) % (2 * Math.PI);
          const cx = Math.cos(theta);
          const cy = Math.sin(theta);
          const pPoint = toScreen(cx, cy);

          ctx.save();
          // Radius line
          ctx.beginPath();
          ctx.moveTo(center.x, center.y);
          ctx.lineTo(pPoint.x, pPoint.y);
          ctx.strokeStyle = settings.darkMode ? "#ffffff" : "#000000";
          ctx.lineWidth = 1;
          ctx.stroke();

          // Sine projection (Vertical to X-axis) - Red
          ctx.beginPath();
          ctx.moveTo(pPoint.x, pPoint.y);
          ctx.lineTo(pPoint.x, center.y); // Drop to X-axis
          ctx.strokeStyle = "#ef4444";
          ctx.lineWidth = 2;
          ctx.stroke();

          // Cosine projection (Horizontal to Y-axis) - Blue
          ctx.beginPath();
          ctx.moveTo(pPoint.x, pPoint.y);
          ctx.lineTo(center.x, pPoint.y); // Drop to Y-axis
          ctx.strokeStyle = "#3b82f6";
          ctx.lineWidth = 2;
          ctx.stroke();

          // Point
          ctx.beginPath();
          ctx.arc(pPoint.x, pPoint.y, 5, 0, 2 * Math.PI);
          ctx.fillStyle = "#f59e0b";
          ctx.fill();
          ctx.restore();
        }
      }

      // 3. Functions & Analysis (Supports Cartesian, Parametric, and Polar)
      if (plotMode === "cartesian") {
        // CARTESIAN MODE: y = f(x)
        functions.forEach((fnStr, i) => {
          if (!fnStr) return;
          try {
            const expr = math.compile(fnStr);
            const color = COLORS[i % COLORS.length] || "#000";
            const pixelsPerStep = settings.highQuality ? 1 : 2;

            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            ctx.beginPath();

            let first = true;
            for (let px = 0; px <= size.w; px += pixelsPerStep) {
              const x = xMin + (px / size.w) * (xMax - xMin);
              try {
                const y = expr.evaluate({ x });
                if (settings.scale === "log" && y <= 0) {
                  first = true;
                  continue;
                }

                const screenPos = toScreen(x, y);
                if (screenPos.y >= -100 && screenPos.y <= h + 100) {
                  if (first) ctx.moveTo(screenPos.x, screenPos.y);
                  else ctx.lineTo(screenPos.x, screenPos.y);
                  first = false;
                } else first = true;
              } catch (e) {
                first = true;
              }
            }
            ctx.stroke();

            // V2.1: Asymptote Detection (VWO B/D)
            if (showAsymptotes) {
              const asymptotes: number[] = [];
              const step = (xMax - xMin) / 200;
              for (let x = xMin; x < xMax; x += step) {
                try {
                  const y1 = expr.evaluate({ x });
                  const y2 = expr.evaluate({ x: x + step });
                  // Detect sign change with large magnitude (asymptote)
                  if (
                    (Math.abs(y1) > 1000 || Math.abs(y2) > 1000) &&
                    ((y1 > 0 && y2 < 0) || (y1 < 0 && y2 > 0))
                  ) {
                    asymptotes.push(x + step / 2);
                  }
                } catch (e) {}
              }
              // Draw asymptote lines
              asymptotes.forEach((asymX) => {
                const screenX = toScreen(asymX, 0).x;
                ctx.save();
                ctx.strokeStyle = "#f43f5e"; // Rose-500
                ctx.lineWidth = 1.5;
                ctx.setLineDash([8, 4]);
                ctx.beginPath();
                ctx.moveTo(screenX, 0);
                ctx.lineTo(screenX, h);
                ctx.stroke();
                // Label
                ctx.fillStyle = "#f43f5e";
                ctx.font = "bold 10px monospace";
                ctx.fillText(`x = ${asymX.toFixed(2)}`, screenX + 5, 20);
                ctx.restore();
              });
            }
          } catch (e) {}
        });

        // V2.1: Derivative Graph (f'(x) Visualization)
        if (showDerivativeGraph && functions[0]) {
          try {
            const fnStr = functions[0]!;
            const expr = math.compile(fnStr);
            const pixelsPerStep = settings.highQuality ? 2 : 4;
            const h_diff = 0.0001; // Small h for numerical differentiation

            ctx.strokeStyle = "#f97316"; // Orange-500
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 3]);
            ctx.beginPath();

            let first = true;
            for (let px = 0; px <= size.w; px += pixelsPerStep) {
              const x = xMin + (px / size.w) * (xMax - xMin);
              try {
                // Numerical derivative: f'(x) ≈ (f(x+h) - f(x-h)) / (2h)
                const y_plus = expr.evaluate({ x: x + h_diff });
                const y_minus = expr.evaluate({ x: x - h_diff });
                const derivative = (y_plus - y_minus) / (2 * h_diff);

                if (!isFinite(derivative)) {
                  first = true;
                  continue;
                }

                const screenPos = toScreen(x, derivative);
                if (screenPos.y >= -100 && screenPos.y <= h + 100) {
                  if (first) ctx.moveTo(screenPos.x, screenPos.y);
                  else ctx.lineTo(screenPos.x, screenPos.y);
                  first = false;
                } else first = true;
              } catch (e) {
                first = true;
              }
            }
            ctx.stroke();
            ctx.setLineDash([]);

            // Legend
            ctx.save();
            ctx.fillStyle = "#f97316";
            ctx.font = "bold 10px monospace";
            ctx.fillText("f'(x)", 60, 35);
            ctx.restore();
          } catch (e) {}
        }
      } else if (plotMode === "parametric") {
        // PARAMETRIC MODE: x(t), y(t)
        // Iterate in pairs
        for (let i = 0; i < functions.length; i += 2) {
          const xFn = functions[i];
          const yFn = functions[i + 1];

          if (xFn && yFn) {
            try {
              const xExpr = math.compile(xFn);
              const yExpr = math.compile(yFn);
              const color = COLORS[(i / 2) % COLORS.length] || "#000";
              const steps = 500;

              ctx.strokeStyle = color;
              ctx.lineWidth = 2.5;
              ctx.setLineDash([]);
              ctx.beginPath();

              let first = true;
              for (let start = 0; start <= steps; start++) {
                const t = (start / steps) * 2 * Math.PI;
                try {
                  const x = xExpr.evaluate({ t });
                  const y = yExpr.evaluate({ t });
                  const screenPos = toScreen(x, y);

                  if (
                    screenPos.x >= -50 &&
                    screenPos.x <= size.w + 50 &&
                    screenPos.y >= -50 &&
                    screenPos.y <= h + 50
                  ) {
                    if (first) ctx.moveTo(screenPos.x, screenPos.y);
                    else ctx.lineTo(screenPos.x, screenPos.y);
                    first = false;
                  } else first = true;
                } catch (e) {
                  first = true;
                }
              }
              ctx.stroke();

              // Draw parametric trace dots
              ctx.fillStyle = color;
              ctx.globalAlpha = 0.5;
              for (let start = 0; start <= 16; start++) {
                const t = (start / 16) * 2 * Math.PI;
                try {
                  const x = xExpr.evaluate({ t });
                  const y = yExpr.evaluate({ t });
                  const screenPos = toScreen(x, y);
                  ctx.beginPath();
                  ctx.arc(screenPos.x, screenPos.y, 3, 0, Math.PI * 2);
                  ctx.fill();
                } catch (e) {}
              }
              ctx.globalAlpha = 1.0;
            } catch (e) {}
          }
        }
      } else if (plotMode === "polar") {
        // POLAR MODE: r(θ)
        functions.forEach((rFn, i) => {
          if (rFn) {
            try {
              const rExpr = math.compile(rFn);
              const color = COLORS[i % COLORS.length] || "#000";
              const steps = 720;

              ctx.strokeStyle = color;
              ctx.lineWidth = 2.5;
              ctx.setLineDash([]);
              ctx.beginPath();

              let first = true;
              for (let start = 0; start <= steps; start++) {
                const theta = (start / steps) * 2 * Math.PI;
                try {
                  const r = rExpr.evaluate({ theta });
                  const x = r * Math.cos(theta);
                  const y = r * Math.sin(theta);
                  const screenPos = toScreen(x, y);

                  if (
                    r >= 0 &&
                    screenPos.x >= -50 &&
                    screenPos.x <= size.w + 50 &&
                    screenPos.y >= -50 &&
                    screenPos.y <= h + 50
                  ) {
                    if (first) ctx.moveTo(screenPos.x, screenPos.y);
                    else ctx.lineTo(screenPos.x, screenPos.y);
                    first = false;
                  } else first = true;
                } catch (e) {
                  first = true;
                }
              }
              ctx.stroke();
            } catch (e) {}
          }
        });

        // Draw polar origin marker (once)
        const origin = toScreen(0, 0);
        ctx.fillStyle = "#fbbf2460";
        ctx.beginPath();
        ctx.arc(origin.x, origin.y, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Intersections
      if (intersections) {
        intersections.forEach((p) => {
          const pos = toScreen(p.x, p.y);
          if (pos.y <= h) {
            ctx.fillStyle = settings.darkMode ? "white" : "black";
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      // NEW: Highlighted points (Roots, Maxima, etc.)
      if (highlightedPoints && highlightedPoints.length > 0) {
        highlightedPoints.forEach((p) => {
          const pos = toScreen(p.x, p.y);
          if (pos.y <= h) {
            const color = p.color || "#fbbf24"; // Amber default

            // Glow
            ctx.shadowBlur = 10;
            ctx.shadowColor = color;
            ctx.fillStyle = color;

            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowBlur = 0; // Reset

            // Core
            ctx.fillStyle = "#fff";
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 2, 0, Math.PI * 2);
            ctx.fill();

            if (p.label) {
              ctx.fillStyle = color;
              ctx.font = "bold 10px Inter, sans-serif";
              ctx.fillText(p.label, pos.x + 8, pos.y - 8);
            }
          }
        });
      }

      // 4. Tangent Line (V2.0)
      if (showTangent && functions[0]) {
        try {
          const x = isTangentAnimating ? tangentAnimX : cursorInfo?.x || 0;
          const fnStr = functions[0]!;
          const y = math.evaluate(fnStr, { x, t: 0, theta: x });

          // Calculuate numerical derivative
          const h_val = 0.0001;
          const y2 = math.evaluate(fnStr, {
            x: x + h_val,
            t: 0,
            theta: x + h_val,
          });
          const slope = (y2 - y) / h_val;

          // Tangent equation: Y = y + slope * (X - x)
          const xRange = xMax - xMin;
          const xStart = x - xRange;
          const xEnd = x + xRange;
          const yStart = y + slope * (xStart - x);
          const yEnd = y + slope * (xEnd - x);

          const p1 = toScreen(xStart, yStart);
          const p2 = toScreen(xEnd, yEnd);

          ctx.save();
          ctx.strokeStyle = "#818cf8"; // Indigo-400
          ctx.lineWidth = 1.5;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();

          // Point contact
          const pc = toScreen(x, y);
          ctx.beginPath();
          ctx.arc(pc.x, pc.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = "#818cf8";
          ctx.fill();

          // Label
          ctx.fillStyle = "#818cf8";
          ctx.font = "bold 12px monospace";
          ctx.fillText(`dy/dx ≈ ${slope.toFixed(3)}`, pc.x + 10, pc.y - 10);
          ctx.restore();
        } catch (e) {}
      }

      // V2.1: Secant Line (Differentiequotiënt)
      if (showSecantLine && functions[0]) {
        try {
          const fnStr = functions[0]!;
          const expr = math.compile(fnStr);
          // Two fixed points for secant demonstration
          const x1 = -2;
          const x2 = 2;
          const y1 = expr.evaluate({ x: x1 });
          const y2 = expr.evaluate({ x: x2 });

          // Secant slope = Δy/Δx
          const secantSlope = (y2 - y1) / (x2 - x1);

          // Draw line extending beyond the two points
          const lineXMin = xMin - 5;
          const lineXMax = xMax + 5;
          const lineY1 = y1 + secantSlope * (lineXMin - x1);
          const lineY2 = y1 + secantSlope * (lineXMax - x1);

          const p1 = toScreen(lineXMin, lineY1);
          const p2 = toScreen(lineXMax, lineY2);

          ctx.save();
          ctx.strokeStyle = "#14b8a6"; // Teal-500
          ctx.lineWidth = 2;
          ctx.setLineDash([10, 5]);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
          ctx.setLineDash([]);

          // Draw the two points
          const pt1 = toScreen(x1, y1);
          const pt2 = toScreen(x2, y2);

          [pt1, pt2].forEach((pt) => {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
            ctx.fillStyle = "#14b8a6";
            ctx.fill();
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 2;
            ctx.stroke();
          });

          // Draw Δ annotations
          ctx.strokeStyle = "rgba(20,184,166,0.4)";
          ctx.lineWidth = 1;
          // Δx line
          ctx.beginPath();
          ctx.moveTo(pt1.x, pt1.y);
          ctx.lineTo(pt2.x, pt1.y);
          ctx.stroke();
          // Δy line
          ctx.beginPath();
          ctx.moveTo(pt2.x, pt1.y);
          ctx.lineTo(pt2.x, pt2.y);
          ctx.stroke();

          // Labels
          ctx.fillStyle = "#14b8a6";
          ctx.font = "bold 11px monospace";
          ctx.fillText(
            `Δy/Δx = ${secantSlope.toFixed(3)}`,
            pt2.x + 10,
            pt2.y - 15,
          );
          ctx.font = "10px monospace";
          ctx.fillText(
            `Δx = ${(x2 - x1).toFixed(1)}`,
            (pt1.x + pt2.x) / 2,
            pt1.y + 15,
          );
          ctx.fillText(
            `Δy = ${(y2 - y1).toFixed(2)}`,
            pt2.x + 10,
            (pt1.y + pt2.y) / 2,
          );
          ctx.restore();
        } catch (e) {}
      }

      // 5. Unit Circle Overlay (V2.0)

      if (showUnitCircle) {
        ctx.save();
        const radius = 60;
        const margin = 20;
        const cx = size.w - radius - margin;
        const cy = radius + margin;

        // Background
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.stroke();

        // Unit Circle
        ctx.beginPath();
        const circleRadius = radius * 0.8;
        ctx.arc(cx, cy, circleRadius, 0, Math.PI * 2);
        ctx.strokeStyle = "#fbbf24"; // Amber-400
        ctx.lineWidth = 2;
        ctx.stroke();

        // Axes
        ctx.beginPath();
        ctx.moveTo(cx - radius, cy);
        ctx.lineTo(cx + radius, cy);
        ctx.moveTo(cx, cy - radius);
        ctx.lineTo(cx, cy + radius);
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.stroke();

        // V2.1: Special Angle Markers (VWO)
        const specialAngles = [
          { angle: 0, label: "0", color: "#fbbf24" },
          { angle: Math.PI / 6, label: "π/6", color: "#f472b6" },
          { angle: Math.PI / 4, label: "π/4", color: "#a78bfa" },
          { angle: Math.PI / 3, label: "π/3", color: "#60a5fa" },
          { angle: Math.PI / 2, label: "π/2", color: "#34d399" },
          { angle: (2 * Math.PI) / 3, label: "2π/3", color: "#60a5fa" },
          { angle: (3 * Math.PI) / 4, label: "3π/4", color: "#a78bfa" },
          { angle: (5 * Math.PI) / 6, label: "5π/6", color: "#f472b6" },
          { angle: Math.PI, label: "π", color: "#fbbf24" },
        ];
        specialAngles.forEach(({ angle, label, color }) => {
          const ax = cx + Math.cos(angle) * circleRadius;
          const ay = cy - Math.sin(angle) * circleRadius;
          // Dot
          ctx.beginPath();
          ctx.arc(ax, ay, 3, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
          // Label (offset based on quadrant)
          const labelOffsetX = Math.cos(angle) * 12;
          const labelOffsetY = -Math.sin(angle) * 12;
          ctx.fillStyle = color;
          ctx.font = "bold 8px monospace";
          ctx.fillText(label, ax + labelOffsetX - 8, ay + labelOffsetY + 3);
        });

        // Cursor angle or Animating Tangent angle
        const activeX = isTangentAnimating ? tangentAnimX : cursorInfo?.x || 0;
        const activeY = cursorInfo ? cursorInfo.y : 0;

        if (isTangentAnimating || cursorInfo) {
          // Angle logic: Map X to angle if needed, or use cursor
          const angle = cursorInfo
            ? Math.atan2(
                -(toScreen(0, activeY).y - cy),
                toScreen(activeX, 0).x - cx,
              )
            : activeX % (Math.PI * 2);

          const tx = cx + Math.cos(angle) * circleRadius;
          const ty = cy - Math.sin(angle) * circleRadius;

          // Projection components
          if (unitCircleMode === "components") {
            // Cosine (X-axis)
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(tx, cy);
            ctx.strokeStyle = "#10b981"; // Emerald
            ctx.lineWidth = 3;
            ctx.stroke();

            // Sine (Y-axis)
            ctx.beginPath();
            ctx.moveTo(tx, cy);
            ctx.lineTo(tx, ty);
            ctx.strokeStyle = "#00D1FF"; // Cyan
            ctx.lineWidth = 3;
            ctx.stroke();

            // Labels
            ctx.fillStyle = "#10b981";
            ctx.font = "10px monospace";
            ctx.fillText(
              `cos: ${Math.cos(angle).toFixed(2)}`,
              cx - 30,
              cy + radius + 10,
            );
            ctx.fillStyle = "#00D1FF";
            ctx.font = "10px monospace";
            ctx.fillText(
              `sin: ${Math.sin(angle).toFixed(2)}`,
              cx - 30,
              cy + radius + 22,
            );
          }

          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(tx, ty);
          ctx.strokeStyle = "#fbbf24";
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(tx, ty, 4, 0, Math.PI * 2);
          ctx.fillStyle = "#fbbf24";
          ctx.fill();
        }
        ctx.restore();
      }

      // 6. Draw Vectors (New for Binas/Physics)
      if (vectors && vectors.length > 0) {
        vectors.forEach((v) => {
          const start = toScreen(0, 0);
          const end = toScreen(v.x, v.y);
          const color = v.color || "#F055BA";

          ctx.save();
          ctx.strokeStyle = color;
          ctx.fillStyle = color;
          ctx.lineWidth = 3;

          // Draw Line
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();

          // Draw Arrow Head
          const angle = Math.atan2(end.y - start.y, end.x - start.x);
          const headLen = 15;
          ctx.beginPath();
          ctx.moveTo(end.x, end.y);
          ctx.lineTo(
            end.x - headLen * Math.cos(angle - Math.PI / 6),
            end.y - headLen * Math.sin(angle - Math.PI / 6),
          );
          ctx.lineTo(
            end.x - headLen * Math.cos(angle + Math.PI / 6),
            end.y - headLen * Math.sin(angle + Math.PI / 6),
          );
          ctx.closePath();
          ctx.fill();

          // Draw Label
          if (v.symbol) {
            ctx.font = "bold 12px monospace";
            ctx.fillText(v.symbol, end.x + 10, end.y);
          }
          ctx.restore();
        });
      }

      // 7. Audio Scanner (Preserved)
      if (scannerX !== null && scannerX !== undefined) {
        const scanPx = toScreen(scannerX, 0).x;
        if (scanPx >= 0 && scanPx <= size.w) {
          ctx.beginPath();
          ctx.moveTo(scanPx, 0);
          ctx.lineTo(scanPx, h);
          ctx.strokeStyle = "#f59e0b"; // Amber-500
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.stroke();
          ctx.setLineDash([]);

          // Draw Scanner Head
          ctx.beginPath();
          ctx.arc(scanPx, h / 2, 4, 0, Math.PI * 2);
          ctx.fillStyle = "#f59e0b";
          ctx.fill();
        }
      }
    };

    useLayoutEffect(() => {
      if (!containerRef.current || !canvasRef.current) return;
      const updateSize = () => {
        const { clientWidth, clientHeight } = containerRef.current!;
        canvasRef.current!.width = clientWidth;
        canvasRef.current!.height = clientHeight;
        setSize({ w: clientWidth, h: clientHeight });
        requestAnimationFrame(draw);
      };
      const observer = new ResizeObserver(updateSize);
      observer.observe(containerRef.current);
      updateSize();
      return () => observer.disconnect();
    }, [settings.darkMode]);

    useEffect(() => {
      requestAnimationFrame(draw);
    }, [
      functions,
      integral,
      intersections,
      size,
      settings,
      cursorInfo,
      consoleExpanded,
      consoleHeight,
    ]); // Re-draw on cursor move if tangent enabled

    // --- INTERACTION ---
    const drag = useRef({
      active: false,
      mode: "pan",
      startX: 0,
      startY: 0,
      startView: view.current,
    });

    const handleMouseDown = (e: React.MouseEvent, mode: "pan" | "x" | "y") => {
      e.preventDefault();
      e.stopPropagation();
      drag.current = {
        active: true,
        mode: mode as any,
        startX: e.clientX,
        startY: e.clientY,
        startView: { ...view.current },
      };
      document.body.style.cursor =
        mode === "pan"
          ? "grabbing"
          : mode === "x"
            ? "col-resize"
            : "row-resize";
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!drag.current.active) return;
      const { mode, startX, startY, startView } = drag.current;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (mode === "pan") {
        const xPerPixel = (startView.xMax - startView.xMin) / size.w;
        const activeH = getActiveHeight();
        const yPerPixel = (startView.yMax - startView.yMin) / activeH;
        view.current.xMin = startView.xMin - dx * xPerPixel;
        view.current.xMax = startView.xMax - dx * xPerPixel;

        if (settings.scale === "linear") {
          view.current.yMin = startView.yMin + dy * yPerPixel;
          view.current.yMax = startView.yMax + dy * yPerPixel;
        } else {
          const factor = Math.pow(1.002, dy);
          view.current.yMin = startView.yMin * factor;
          view.current.yMax = startView.yMax * factor;
        }
      } else if (mode === "y") {
        const factor = Math.pow(1.01, dy);
        const center = (startView.yMin + startView.yMax) / 2;
        const range = startView.yMax - startView.yMin;
        if (settings.scale === "linear") {
          view.current.yMin = center - (range * factor) / 2;
          view.current.yMax = center + (range * factor) / 2;
        } else {
          view.current.yMin = Math.pow(startView.yMin, factor);
          view.current.yMax = Math.pow(startView.yMax, factor);
        }
      } else if (mode === "x") {
        const factor = Math.pow(1.01, -dx);
        const center = (startView.xMin + startView.xMax) / 2;
        const range = startView.xMax - startView.xMin;
        view.current.xMin = center - (range * factor) / 2;
        view.current.xMax = center + (range * factor) / 2;
      }
      requestAnimationFrame(draw);
    };

    const onMouseUp = () => {
      drag.current.active = false;
      document.body.style.cursor = "";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    // --- HOVER & SNAP LOGIC ---
    const onHover = (e: React.MouseEvent) => {
      const rect = containerRef.current!.getBoundingClientRect();
      const p = toMath(e.clientX - rect.left, e.clientY - rect.top);

      // SNAP TO GRID
      if (settings.snapMode === "grid") {
        p.x = Math.round(p.x);
        p.y = Math.round(p.y);
      }
      // SNAP TO FUNCTION (Magneet)
      else if (settings.snapMode === "function" && functions[0]) {
        try {
          const expr = math.compile(functions[0]);
          const yOnGraph = expr.evaluate({ x: p.x });
          // Alleen snappen als muis in de buurt is (bijv. binnen 50 pixels verticaal)
          const screenMouse = toScreen(p.x, p.y);
          const screenGraph = toScreen(p.x, yOnGraph);
          if (Math.abs(screenMouse.y - screenGraph.y) < 50) {
            p.y = yOnGraph;
          }
        } catch (e) {}
      }

      setCursorInfo(p);
      setCursorInfo(p);
    };

    // --- UI HELPERS ---
    const reset = () => {
      view.current = { xMin: -10, xMax: 10, yMin: -6, yMax: 6 };
      if (settings.scale === "log")
        view.current = { xMin: -10, xMax: 10, yMin: 0.1, yMax: 100 };
      requestAnimationFrame(draw);
    };

    useImperativeHandle(ref, () => ({
      toggleSettings: () => setShowSettings((prev) => !prev),
      resetView: reset,
    }));

    const handleWheel = (e: React.WheelEvent) => {
      const rect = containerRef.current!.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      // Mouse to Math (Pre-Zoom)
      const p1 = toMath(mx, my);

      const factor = Math.pow(1.001, e.deltaY);
      const { xMin, xMax, yMin, yMax } = view.current;
      const width = xMax - xMin;
      const height = yMax - yMin;

      // Apply Zoom
      const newWidth = width * factor;
      const newHeight = height * factor;

      // Adjust view to keep mouse position stable
      view.current.xMin = p1.x - (mx / size.w) * newWidth;
      view.current.xMax = view.current.xMin + newWidth;

      if (settings.scale === "linear") {
        const h = getActiveHeight();
        const yRatio = (h - my) / h; // 0 at bottom, 1 at top
        view.current.yMin = p1.y - yRatio * newHeight;
        view.current.yMax = view.current.yMin + newHeight;
      }

      requestAnimationFrame(draw);
    };

    return (
      <div
        ref={containerRef}
        onWheel={handleWheel}
        className={`relative w-full h-full overflow-hidden select-none ${settings.darkMode ? "bg-[#0b0e11]" : "bg-white"}`}
      >
        {/* HUD */}
        <div className="absolute top-4 left-4 z-20 flex flex-col items-start gap-1 text-[10px] font-mono uppercase tracking-widest pointer-events-none opacity-50">
          <div className="flex items-center gap-2 text-emerald-400">
            <Activity size={12} /> <span>Elite Engine v2.1</span>
          </div>
        </div>

        {/* Cursor Info Display */}
        {cursorInfo && (
          <div className="absolute top-4 right-4 z-20 flex flex-col items-end text-[10px] font-mono text-slate-400 bg-black/40 p-2 rounded-lg border border-white/5 backdrop-blur-md pointer-events-none">
            <span>
              X:{" "}
              <span className="text-white font-bold">
                {cursorInfo.x.toFixed(2)}
              </span>
            </span>
            <span>
              Y:{" "}
              <span className="text-white font-bold">
                {Math.abs(cursorInfo.y) < 0.01
                  ? cursorInfo.y.toExponential(2)
                  : cursorInfo.y.toFixed(2)}
              </span>
            </span>
          </div>
        )}

        {/* SETTINGS MENU */}
        {showSettings && (
          <div className="absolute right-14 top-16 w-64 bg-[#0F1115]/95 border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl p-4 flex flex-col gap-4 z-50 animate-in slide-in-from-right-2 fade-in">
            <div>
              <div className="text-[9px] uppercase tracking-[0.2em] text-cyan-500/50 font-black mb-2 px-1">
                Visualisatie
              </div>
              <div className="bg-white/[0.02] rounded-lg border border-white/5 overflow-hidden">
                <button
                  onClick={() =>
                    setSettings((s) => ({ ...s, darkMode: !s.darkMode }))
                  }
                  className="settings-item group"
                >
                  <span className="flex items-center gap-2 text-slate-400 group-hover:text-cyan-400 transition-colors">
                    {settings.darkMode ? <Moon size={14} /> : <Sun size={14} />}
                    <span className="font-medium">Thema</span>
                  </span>
                  <div
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border ${settings.darkMode ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" : "bg-slate-800 border-white/10 text-slate-500"}`}
                  >
                    {settings.darkMode ? "DARK" : "LIGHT"}
                  </div>
                </button>
                <div className="h-px bg-white/5" />
                <button
                  onClick={() => setSettings((s) => ({ ...s, grid: !s.grid }))}
                  className="settings-item group"
                >
                  <span className="flex items-center gap-2 text-slate-400 group-hover:text-cyan-400 transition-colors">
                    <Grid size={14} />
                    <span className="font-medium">Raster</span>
                  </span>
                  <div
                    className={`w-3 h-3 rounded-full border ${settings.grid ? "bg-cyan-500 border-cyan-400" : "bg-transparent border-slate-600"}`}
                  />
                </button>
              </div>
            </div>

            <div>
              <div className="text-[9px] uppercase tracking-[0.2em] text-violet-400/50 font-black mb-2 px-1">
                Coördinaten
              </div>
              <div className="bg-white/[0.02] rounded-lg border border-white/5 overflow-hidden">
                <button
                  onClick={() =>
                    setSettings((s) => ({ ...s, trigScale: !s.trigScale }))
                  }
                  className="settings-item group"
                >
                  <span className="flex items-center gap-2 text-slate-400 group-hover:text-violet-400 transition-colors">
                    <Calculator size={14} />
                    <span className="font-medium">X-As Schaal</span>
                  </span>
                  <div
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border ${settings.trigScale ? "bg-violet-500/10 border-violet-500/30 text-violet-400" : "bg-slate-800 border-white/10 text-slate-500"}`}
                  >
                    {settings.trigScale ? "π RAD" : "DEC"}
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* INTERACTION LAYERS */}
        <div
          ref={overlayRef}
          className="absolute inset-0 cursor-crosshair z-10"
          onMouseDown={(e) => handleMouseDown(e, "pan")}
          onMouseMove={onHover}
          style={{ bottom: BOTTOM_PADDING }}
        />

        {/* Axis Zoom Handles */}
        <div
          className="absolute left-0 w-16 z-20 cursor-ns-resize hover:bg-white/5 transition-colors"
          style={{ top: 0, bottom: BOTTOM_PADDING, width: LEFT_PADDING }}
          onMouseDown={(e) => handleMouseDown(e, "y")}
        />
        <div
          className="absolute right-0 h-16 z-20 cursor-col-resize hover:bg-white/5 transition-colors"
          style={{ height: BOTTOM_PADDING, bottom: 0, left: LEFT_PADDING }}
          onMouseDown={(e) => handleMouseDown(e, "x")}
        />

        <canvas ref={canvasRef} className="block w-full h-full" />

        <style>{`
                .settings-item { @apply flex items-center justify-between p-2.5 hover:bg-white/5 rounded text-xs text-slate-300 transition-colors w-full text-left; }
            `}</style>
      </div>
    );
  },
);
