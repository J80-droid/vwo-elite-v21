import { useTranslations } from "@shared/hooks/useTranslations";
import { Activity } from "lucide-react";
import React, { useEffect, useRef } from "react";

import { useKinematicsEngine } from "../physics";

/**
 * KinematicsGraphs
 * Pure renderer component that visualizes kinematics history.
 * Consumes data directly from the shared engine hook.
 */
export const KinematicsGraphs: React.FC = () => {
  const { history } = useKinematicsEngine();
  const { t } = useTranslations();
  const graphRef = useRef<HTMLCanvasElement>(null);

  // Draw Graphs Loop
  useEffect(() => {
    const canvas = graphRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const draw = () => {
      // Access ref current value
      const historyData = history.current;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      if (historyData.length < 2) {
        // Draw placeholders / grid if empty
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 1;
        const h3 = h / 3;
        ctx.beginPath();
        ctx.moveTo(0, h3);
        ctx.lineTo(w, h3);
        ctx.moveTo(0, 2 * h3);
        ctx.lineTo(w, 2 * h3);
        ctx.stroke();

        // Labels
        ctx.fillStyle = "#64748b";
        ctx.font = "10px monospace";
        ctx.fillText("x(t)", 5, 15);
        ctx.fillText("v(t)", 5, h3 + 15);
        ctx.fillText("a(t)", 5, 2 * h3 + 15);

        animationId = requestAnimationFrame(draw);
        return;
      }

      const h3 = h / 3;

      const drawPlot = (
        key: "x" | "v" | "a",
        offsetY: number,
        color: string,
        label: string,
      ) => {
        // Local bounds
        let min = Math.min(...historyData.map((d) => d[key]));
        let max = Math.max(...historyData.map((d) => d[key]));
        if (max === min) {
          max += 1;
          min -= 1;
        }

        // Add some padding
        const range = max - min;
        min -= range * 0.1;
        max += range * 0.1;

        const margin = 10;
        const plotH = h3 - 2 * margin;
        const tMax = historyData[historyData.length - 1]!.t;
        const tMin = historyData[0]!.t;

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        historyData.forEach((d, i) => {
          // Safe normalization
          const tNorm = (d.t - tMin) / (tMax - tMin || 1);
          const px = tNorm * w;

          const valNorm = (d[key] - min) / (max - min);
          const py = offsetY + h3 - margin - valNorm * plotH;

          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();

        // Label
        ctx.fillStyle = color;
        ctx.font = "10px monospace";
        ctx.fillText(label, 5, offsetY + 15);

        // Current Value Label (Right side)
        const currentVal = historyData[historyData.length - 1]![key].toFixed(1);
        ctx.textAlign = "right";
        ctx.fillText(currentVal, w - 5, offsetY + 15);
        ctx.textAlign = "left";
      };

      drawPlot("x", 0, "#38bdf8", "x(t)"); // Sky-400
      drawPlot("v", h3, "#34d399", "v(t)"); // Emerald-400
      drawPlot("a", 2 * h3, "#fbbf24", "a(t)"); // Amber-400

      // Separators
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h3);
      ctx.lineTo(w, h3);
      ctx.moveTo(0, 2 * h3);
      ctx.lineTo(w, 2 * h3);
      ctx.stroke();

      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [history]); // Re-bind if history ref changes

  return (
    <div className="bg-black/20 backdrop-blur-md p-4 rounded-3xl border border-white/10 shadow-2xl w-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/20">
          <Activity className="text-indigo-400" size={16} />
        </div>
        <div>
          <h4 className="text-[10px] font-black text-white uppercase tracking-widest">
            {t("physics.kinematics.graphs")}
          </h4>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em]">
            x(t), v(t), a(t)
          </p>
        </div>
      </div>

      <div className="h-48 bg-black/40 rounded-2xl border border-white/5 p-2 overflow-hidden relative">
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(to right, #ffffff15 1px, transparent 1px), linear-gradient(to bottom, #ffffff15 1px, transparent 1px)`,
            backgroundSize: "20px 20px",
          }}
        ></div>
        <canvas
          ref={graphRef}
          width={300}
          height={180}
          className="w-full h-full"
        />
      </div>
    </div>
  );
};

// Legacy export for compatibility if needed, mimicking old export shape but redirecting
export const KinematicsSim: React.FC<{ mode?: string }> = () => {
  // If something tries to render it, just render the graphs, as sidebar/stage are handled elsewhere
  return <KinematicsGraphs />;
};
