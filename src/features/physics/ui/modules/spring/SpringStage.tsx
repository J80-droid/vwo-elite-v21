import { useTranslations } from "@shared/hooks/useTranslations";
import React, { useEffect, useRef, useState } from "react";

import { useSpringEngine } from "./useSpringEngine";

const PIXELS_PER_METER = 100;
const GRAVITY = 9.81;
const MOUNT_Y = -300;
const NATURAL_LENGTH = 100;

export const SpringStage: React.FC = () => {
  const { state, setParam, setMassPosition, setDragging } = useSpringEngine();
  const { t } = useTranslations();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const lastPos = useRef({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  // Calculated Constants
  const extensionMeters = (state.mass * GRAVITY) / (state.k || 1);
  const extensionPixels = extensionMeters * PIXELS_PER_METER;
  const equilibriumY = MOUNT_Y + NATURAL_LENGTH + extensionPixels;

  // 1. High-Performance Resizing
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry && canvasRef.current) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        const dpr = window.devicePixelRatio || 1;
        canvasRef.current.width = w * dpr;
        canvasRef.current.height = h * dpr;
        setDimensions({ width: w, height: h });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Global Interaction Handling
  useEffect(() => {
    const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
      if (!state.isDragging && !isPanning) return;

      const clientX =
        "touches" in e
          ? (e as TouchEvent).touches[0]!.clientX
          : (e as MouseEvent).clientX;
      const clientY =
        "touches" in e
          ? (e as TouchEvent).touches[0]!.clientY
          : (e as MouseEvent).clientY;

      if (state.isDragging) {
        const dyPixels = (clientY - lastPos.current.y) / (state.zoom || 1);
        const newY = state.metrics.y + dyPixels / PIXELS_PER_METER;
        setMassPosition(newY);
      } else if (isPanning) {
        const dx = (clientX - lastPos.current.x) / (state.zoom || 1);
        const dy = (clientY - lastPos.current.y) / (state.zoom || 1);
        setParam("panX", (state.panX || 0) - dx);
        setParam("panY", (state.panY || 0) - dy);
      }
      lastPos.current = { x: clientX, y: clientY };
    };

    const handleGlobalUp = () => {
      if (state.isDragging) setDragging(false);
      if (isPanning) setIsPanning(false);
    };

    if (state.isDragging || isPanning) {
      window.addEventListener("mousemove", handleGlobalMove);
      window.addEventListener("touchmove", handleGlobalMove);
      window.addEventListener("mouseup", handleGlobalUp);
      window.addEventListener("touchend", handleGlobalUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleGlobalMove);
      window.removeEventListener("touchmove", handleGlobalMove);
      window.removeEventListener("mouseup", handleGlobalUp);
      window.removeEventListener("touchend", handleGlobalUp);
    };
  }, [
    state.isDragging,
    isPanning,
    state.zoom,
    state.panX,
    state.panY,
    state.metrics.y,
    setMassPosition,
    setDragging,
    setParam,
  ]);

  // Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const dpr = w / dimensions.width;

    // Reset Transform & Clear
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#020408";
    ctx.fillRect(0, 0, w, h);

    const zoom = state.zoom || 1;
    const cx = w / 2;
    const cy = h / 2;

    // Apply Camera Transform
    ctx.translate(cx, cy);
    ctx.scale(zoom * dpr, zoom * dpr);
    ctx.translate(-(state.panX || 0), -(state.panY || 0));

    // --- Grid ---
    const visibleW = w / dpr / zoom;
    const visibleH = h / dpr / zoom;
    const left = (state.panX || 0) - visibleW / 2;
    const right = (state.panX || 0) + visibleW / 2;
    const top = (state.panY || 0) - visibleH / 2;
    const bottom = (state.panY || 0) + visibleH / 2;

    const gridSize = 50;
    const startX = Math.floor(left / gridSize) * gridSize;
    const startY = Math.floor(top / gridSize) * gridSize;

    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    ctx.lineWidth = 1 / zoom;
    ctx.beginPath();
    for (let x = startX; x <= right; x += gridSize) {
      ctx.moveTo(x, top);
      ctx.lineTo(x, bottom);
    }
    for (let y = startY; y <= bottom; y += gridSize) {
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
    }
    ctx.stroke();

    // --- Scene Elements ---
    const displacementPixels = state.metrics.y * PIXELS_PER_METER;
    const currentY = equilibriumY + displacementPixels;
    const centerX = 0;

    // 1. Mount (Static)
    const mountGradient = ctx.createLinearGradient(0, MOUNT_Y, 0, MOUNT_Y + 50);
    mountGradient.addColorStop(0, "#334155");
    mountGradient.addColorStop(1, "#1e293b");
    ctx.fillStyle = mountGradient;
    ctx.fillRect(-80, MOUNT_Y, 160, 20);

    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 2 / zoom;
    ctx.beginPath();
    ctx.moveTo(0, MOUNT_Y + 20);
    ctx.lineTo(0, MOUNT_Y + 40);
    ctx.stroke();

    // 2. Spring
    const startSpringY = MOUNT_Y + 40;
    const endSpringY = Math.max(startSpringY + 10, currentY);
    const springLength = endSpringY - startSpringY;

    const segments = 24;
    const segHeight = springLength / segments;
    const coilWidth = 40;

    ctx.beginPath();
    ctx.moveTo(centerX, startSpringY);
    for (let i = 1; i <= segments; i++) {
      const y = startSpringY + i * segHeight;
      const prevY = startSpringY + (i - 1) * segHeight;
      const midY = (prevY + y) / 2;
      const isLeft = i % 2 !== 0;
      const xControl = isLeft ? centerX - coilWidth : centerX + coilWidth;
      const xTarget = centerX;
      ctx.quadraticCurveTo(xControl, midY, xTarget, y);
    }
    ctx.lineTo(centerX, currentY);

    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle =
      state.isPlaying || state.isDragging
        ? "rgba(34, 211, 238, 0.6)"
        : "rgba(148, 163, 184, 0.4)";
    ctx.lineWidth = 3 / zoom;

    if (state.isPlaying || state.isDragging) {
      ctx.shadowColor = "#06b6d4";
      ctx.shadowBlur = 10;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 3. Mass
    const size = 60;
    ctx.save();
    ctx.translate(centerX - size / 2, currentY);

    if (state.isDragging) {
      ctx.shadowColor = "#22d3ee";
      ctx.shadowBlur = 25;
    }

    const massGradient = ctx.createLinearGradient(0, 0, size, size);
    massGradient.addColorStop(0, "#334155");
    massGradient.addColorStop(1, "#0f172a");
    ctx.fillStyle = massGradient;
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, 8);
    ctx.fill();

    ctx.strokeStyle = state.isDragging ? "#22d3ee" : "rgba(255,255,255,0.2)";
    ctx.lineWidth = (state.isDragging ? 2 : 1) / zoom;
    ctx.stroke();

    ctx.fillStyle = "#f8fafc";
    const fontSize = 14 / zoom;
    ctx.font = `700 ${fontSize}px "Outfit", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${state.mass.toFixed(1)}kg`, size / 2, size / 2);
    ctx.restore();

    // 4. Vectors & Equilibrium
    if (state.showFormulas) {
      // Equilibrium Line
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.setLineDash([4 / zoom, 4 / zoom]);
      ctx.lineWidth = 1 / zoom;
      ctx.beginPath();
      ctx.moveTo(-150, equilibriumY);
      ctx.lineTo(150, equilibriumY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.font = `${10 / zoom}px monospace`;
      ctx.textAlign = "left";
      ctx.fillText("u = 0", 160 / zoom, equilibriumY + 3);

      // Force Calculations
      const F_gravity = state.mass * GRAVITY; // Always positive (down)

      // F_res = -ky - dv (Resulterende kracht)
      const F_res =
        -state.k * state.metrics.y - state.damping * state.metrics.v;

      // Vector Som: F_res = F_gravity + F_spring
      // Dus: F_spring = F_res - F_gravity
      const F_spring_total = F_res - F_gravity;

      const maxVectorLen = 150;
      const vectorScaleForce = 4.0;
      const vectorScaleVel = 15.0;

      const drawVector = (
        val: number,
        color: string,
        label: string,
        offsetX: number,
        alignLeft = true,
      ) => {
        const clampedLen =
          Math.sign(val) * Math.min(Math.abs(val), maxVectorLen);
        if (Math.abs(clampedLen) < 2) return;

        const sY = currentY + size / 2;
        const eY = sY + clampedLen;

        ctx.strokeStyle = color;
        ctx.lineWidth = 2 / zoom;
        ctx.beginPath();
        ctx.moveTo(centerX + offsetX, sY);
        ctx.lineTo(centerX + offsetX, eY);
        ctx.stroke();

        // Arrowhead
        const headSize = 6 / zoom;
        const pointingDown = clampedLen > 0;
        ctx.beginPath();
        ctx.moveTo(
          centerX + offsetX - headSize,
          eY + (pointingDown ? -headSize : headSize),
        );
        ctx.lineTo(centerX + offsetX, eY);
        ctx.lineTo(
          centerX + offsetX + headSize,
          eY + (pointingDown ? -headSize : headSize),
        );
        ctx.stroke();

        // Label
        ctx.fillStyle = color;
        ctx.font = `bold ${11 / zoom}px "Outfit", sans-serif`;
        ctx.textAlign = alignLeft ? "left" : "right";
        const textX = centerX + offsetX + (alignLeft ? 8 : -8) / zoom;
        ctx.fillText(label, textX, eY);
      };

      // 1. Resultant Force (Red) - Right Inner
      drawVector(
        F_res * vectorScaleForce,
        "#f43f5e",
        `Fres ${F_res.toFixed(1)}N`,
        40 / zoom,
        true,
      );

      // 2. Velocity (Green) - Left Inner
      drawVector(
        state.metrics.v * vectorScaleVel,
        "#10b981",
        `v ${state.metrics.v.toFixed(2)}`,
        -40 / zoom,
        false,
      );

      // 3. Components (Outer Right)
      // Gravity (Indigo) - Constant Down
      drawVector(
        F_gravity * vectorScaleForce,
        "#818cf8",
        `Fz`,
        140 / zoom,
        true,
      );
      // Spring Force (Orange) - Variable Up
      drawVector(
        F_spring_total * vectorScaleForce,
        "#fb923c",
        `Fv`,
        140 / zoom,
        true,
      );
    }
  }, [state, dimensions, equilibriumY]);

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setParam("zoom", Math.max(0.4, Math.min(5, (state.zoom || 1) * delta)));
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX =
      "touches" in e
        ? (e as React.TouchEvent).touches[0]!.clientX
        : (e as React.MouseEvent).clientX;
    const clientY =
      "touches" in e
        ? (e as React.TouchEvent).touches[0]!.clientY
        : (e as React.MouseEvent).clientY;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const xRaw = clientX - rect.left;
    const yRaw = clientY - rect.top;

    const zoom = state.zoom || 1;
    const cx = dimensions.width / 2;
    const cy = dimensions.height / 2;

    const worldX = (xRaw - cx) / zoom + (state.panX || 0);
    const worldY = (yRaw - cy) / zoom + (state.panY || 0);

    const displacementPixels = state.metrics.y * PIXELS_PER_METER;
    const massY = equilibriumY + displacementPixels + 30;
    const hitRadius = 50;

    if (Math.abs(worldX) < hitRadius && Math.abs(worldY - massY) < hitRadius) {
      setDragging(true);
    } else {
      setIsPanning(true);
    }

    lastPos.current = { x: clientX, y: clientY };
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-black cursor-crosshair select-none touch-none"
      onWheel={handleWheel}
      onMouseDown={handlePointerDown}
      onTouchStart={handlePointerDown}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      <div className="absolute top-6 left-6 pointer-events-none">
        <h2 className="text-3xl font-black text-white italic tracking-tighter drop-shadow-2xl uppercase opacity-80">
          {t("physics.modules.spring")}
        </h2>
        <div className="flex items-center gap-2 mt-1">
          <div
            className={`w-2 h-2 rounded-full ${state.isPlaying ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`}
          />
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            {state.isPlaying ? t("physics.spring.status_active") : "PAUSED"}
          </span>
        </div>
      </div>
    </div>
  );
};
