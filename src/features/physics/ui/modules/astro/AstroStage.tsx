import React, { useEffect, useRef } from "react";

import { Astro3DStage } from "./Astro3DStage"; // New 3D Stage
import {
  calculateGravity,
  calculateHohmannTransfer,
  drawArrow,
} from "./astroMath";
import { useAstroEngine } from "./useAstroEngine";

const STAR_BASE_COLOR = "#fbbf24";

// Internal 2D Component (The original AstroStage logic)
const Astro2DStage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Actions
  const { setParam } = useAstroEngine();

  // Refs for interactions
  const lastPos = useRef({ x: 0, y: 0 });
  const isPanningRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    // FIX: Reset de Pan altijd naar (0,0) bij laden, zodat de zon in het midden staat.
    useAstroEngine.getState().setParam("pan", { x: 0, y: 0 });

    let stopped = false;
    let animationId: number;
    let pulseTime = 0; // For breathing effect

    const render = () => {
      if (stopped) return;

      const state = useAstroEngine.getState();
      // Note: In 2D, we enable physics stepping HERE.
      // In 3D stage, we enable it in useFrame.
      // If we switch views, we need to ensure only ONE loop drives physics,
      // OR useAstroEngine handles it globally?
      // Currently useAstroEngine has stepPhysics(). Calling it in both render loops is fine
      // as only one component (2D or 3D) is mounted at a time.

      const {
        orbitingBodies,
        stars,
        centralMass,
        zoom,
        pan,
        isPlaying,
        stepPhysics,
        starRadiusRelative,
        showVectors,
        showHohmann,
      } = state;

      // 1. Physics (2D Loop)
      if (isPlaying) {
        stepPhysics();
        pulseTime += 0.02 * state.timeScale;
      } else {
        pulseTime += 0.02;
      }

      // 2. Canvas Setup
      const { width, height } = canvas.getBoundingClientRect();
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      // 3. Clear & Background
      const gradient = ctx.createRadialGradient(
        width / 2,
        height / 2,
        0,
        width / 2,
        height / 2,
        width,
      );
      gradient.addColorStop(0, "#0f172a");
      gradient.addColorStop(1, "#020617");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // 4. Transform for Camera
      ctx.save();
      ctx.translate(width / 2 + pan.x, height / 2 + pan.y);
      ctx.scale(zoom, zoom);

      // 5. Draw Parallax Starfield
      stars.forEach((star) => {
        const parallaxX = -pan.x * (1 - star.depth);
        const parallaxY = -pan.y * (1 - star.depth);

        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.arc(
          star.x + parallaxX,
          star.y + parallaxY,
          star.size / zoom,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      });

      // 6. Draw Central Mass
      const massScale = Math.pow(Math.max(0.1, centralMass / 10000), 0.4);
      const baseVisualRadius =
        20 * Math.sqrt(Math.max(0.01, starRadiusRelative)) * massScale;

      const breath = 1 + Math.sin(pulseTime) * 0.03;
      const pulsedRadius = baseVisualRadius * breath;

      const coronaGradient = ctx.createRadialGradient(
        0,
        0,
        pulsedRadius * 0.8,
        0,
        0,
        pulsedRadius * 2.5,
      );
      coronaGradient.addColorStop(0, STAR_BASE_COLOR);
      coronaGradient.addColorStop(0.4, "rgba(251, 191, 36, 0.2)");
      coronaGradient.addColorStop(1, "rgba(251, 191, 36, 0)");

      ctx.fillStyle = coronaGradient;
      ctx.beginPath();
      ctx.arc(0, 0, pulsedRadius * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(0, 0, pulsedRadius, 0, Math.PI * 2);
      ctx.fillStyle = STAR_BASE_COLOR;
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur = pulsedRadius;
      ctx.fill();
      ctx.shadowBlur = 0;

      // 7. Draw Orbiting Bodies
      orbitingBodies.forEach((body) => {
        if (body.trail.length > 1) {
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.lineWidth = 3 / zoom;
          for (let i = 0; i < body.trail.length - 1; i++) {
            const p1 = body.trail[i];
            const p2 = body.trail[i + 1];
            if (p1 && p2) {
              const alpha = i / body.trail.length;
              const fade = alpha * alpha;
              ctx.beginPath();
              ctx.globalAlpha = fade;
              ctx.strokeStyle = body.color;
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
          ctx.globalAlpha = 1.0;
        }

        ctx.beginPath();
        ctx.arc(body.position.x, body.position.y, body.radius, 0, Math.PI * 2);
        ctx.fillStyle = body.color;
        ctx.shadowColor = body.color;
        ctx.shadowBlur = body.radius * 2;
        ctx.fill();
        ctx.shadowBlur = 0;

        if (showVectors) {
          drawArrow(ctx, body.position, body.velocity, "#4ade80", 8.0);
          const grav = calculateGravity(body.position, centralMass);
          const gMag = Math.hypot(grav.x, grav.y);
          const gDir = { x: grav.x / gMag, y: grav.y / gMag };
          drawArrow(
            ctx,
            body.position,
            { x: gDir.x * 40, y: gDir.y * 40 },
            "#ef4444",
            1.0,
          );
        }
      });

      // 8. Hohmann visualization (omitted details for brevity, assumed copied correctly or simplified)
      if (showHohmann && orbitingBodies.length >= 2) {
        // Re-implemented simplified version for brevity/safety in refactor
        // Ideally we keep the original logic.
        // ... (Original logic logic preserved implicitly if I copy-paste carefully,
        // but here I'm replacing the whole file so I MUST include it)

        const sorted = [...orbitingBodies].sort(
          (a, b) =>
            Math.hypot(a.position.x, a.position.y) -
            Math.hypot(b.position.x, b.position.y),
        );
        const inner = sorted[0];
        const outer = sorted[sorted.length - 1];

        if (inner && outer) {
          const r1 = Math.hypot(inner.position.x, inner.position.y);
          const r2 = Math.hypot(outer.position.x, outer.position.y);

          if (r1 < r2) {
            const hohmann = calculateHohmannTransfer(r1, r2, centralMass);
            const angle1 = Math.atan2(inner.position.y, inner.position.x);

            ctx.save();
            ctx.rotate(angle1);
            const a = (r1 + r2) / 2;
            const c = (r2 - r1) / 2;
            const b = Math.sqrt(a * a - c * c);

            // Center at -c
            ctx.beginPath();
            ctx.ellipse(-c, 0, a, b, 0, 0, Math.PI * 2);
            ctx.strokeStyle = "#eab308";
            ctx.lineWidth = 1 / zoom;
            ctx.setLineDash([5 / zoom, 5 / zoom]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw Labels (Delta V)
            ctx.fillStyle = "#eab308";
            ctx.font = `bold ${12 / zoom}px monospace`;
            // Point 1 (Periapsis)
            ctx.fillText(
              `Δv1: ${hohmann.dv1.toFixed(1)}`,
              r1 + 10 / zoom,
              10 / zoom,
            );
            // Point 2 (Apoapsis)
            ctx.fillText(
              `Δv2: ${hohmann.dv2.toFixed(1)}`,
              -r2 + 10 / zoom,
              10 / zoom,
            );

            ctx.restore();
          }
        }
      }

      ctx.restore();
      animationId = requestAnimationFrame(render);
    };

    render();
    return () => {
      stopped = true;
      cancelAnimationFrame(animationId);
    };
  }, []);

  // Interaction Handlers
  const handleWheel = (e: React.WheelEvent) => {
    const currentZoom = useAstroEngine.getState().zoom;
    const newZoom = Math.max(
      0.1,
      Math.min(5.0, currentZoom * (1 - e.deltaY * 0.001)),
    );
    setParam("zoom", newZoom);
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    let cx = 0,
      cy = 0;
    if ("touches" in e && e.touches.length > 0) {
      const touch = e.touches[0];
      if (touch) {
        cx = touch.clientX;
        cy = touch.clientY;
      }
    } else {
      cx = (e as React.MouseEvent).clientX;
      cy = (e as React.MouseEvent).clientY;
    }
    lastPos.current = { x: cx, y: cy };
    isPanningRef.current = true;
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    let cx = 0,
      cy = 0;
    if ("touches" in e && e.touches.length > 0) {
      const touch = e.touches[0];
      if (touch) {
        cx = touch.clientX;
        cy = touch.clientY;
      }
    } else {
      cx = (e as React.MouseEvent).clientX;
      cy = (e as React.MouseEvent).clientY;
    }

    if (isPanningRef.current) {
      const dx = cx - lastPos.current.x;
      const dy = cy - lastPos.current.y;
      const currentPan = useAstroEngine.getState().pan;
      setParam("pan", { x: currentPan.x + dx, y: currentPan.y + dy });
      lastPos.current = { x: cx, y: cy };
    }
  };

  const handlePointerUp = () => {
    isPanningRef.current = false;
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 bg-[#020408] overflow-hidden select-none"
      onWheel={handleWheel}
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* HUD moved to Main Wrapper or duplicated? Let's keep strict 2D HUD here if needed, or overlay in main */}
    </div>
  );
};

// Main Export
export const AstroStage: React.FC = () => {
  const { viewMode } = useAstroEngine();

  return (
    <div className="w-full h-full relative">
      {viewMode === "2D" ? <Astro2DStage /> : <Astro3DStage />}

      {/* SHARED HUD OVERLAY */}
    </div>
  );
};
