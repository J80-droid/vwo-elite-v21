import { useTranslations } from "@shared/hooks/useTranslations";
import { Activity } from "lucide-react";
import React, { useEffect, useRef } from "react";

import { useSpringEngine } from "./useSpringEngine";

export const SpringAnalysis: React.FC = () => {
  const { state } = useSpringEngine();
  const { t } = useTranslations();
  const graphRef = useRef<HTMLCanvasElement>(null);
  const { metrics, showGraph, showEnergy } = state;

  useEffect(() => {
    if (showGraph && graphRef.current && metrics.history.length > 0) {
      const canvas = graphRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        // Grid (Center line)
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();

        // Wave Pattern
        if (metrics.history.length > 1) {
          // 1. Determine the maximum amplitude in current history for auto-scaling
          const maxAmp = metrics.history.reduce(
            (max, pt) => Math.max(max, Math.abs(pt.y)),
            0,
          );
          // Ensure at least 0.1m headroom to avoid jitter at low amplitudes
          const scaleLimit = Math.max(0.1, maxAmp * 1.2);
          const scaleFactor = h / 2 / scaleLimit;

          ctx.beginPath();
          ctx.strokeStyle = "#22d3ee";
          ctx.lineWidth = 2;

          const step = w / metrics.history.length;
          metrics.history.forEach((pt: { t: number; y: number }, i: number) => {
            // pt.y is in meters. Scale dynamically.
            const val = h / 2 + pt.y * scaleFactor;
            const x = i * step;
            if (i === 0) ctx.moveTo(x, val);
            else ctx.lineTo(x, val);
          });
          ctx.stroke();

          // Fill Gradient
          ctx.lineTo(w, h / 2);
          ctx.lineTo(0, h / 2);
          ctx.fillStyle = "rgba(34, 211, 238, 0.05)";
          ctx.fill();
        }
      }
    }
  }, [metrics.history, showGraph]);

  return (
    <div className="bg-black/40 backdrop-blur-xl p-5 rounded-3xl border border-white/10 shadow-2xl min-w-[300px] animate-in slide-in-from-top-4 duration-700 delay-100">
      <div className="flex items-center gap-3 mb-4 border-b border-white/5 pb-2">
        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <Activity className="text-emerald-400" size={14} />
        </div>
        <div>
          <h4 className="text-[10px] font-black text-white uppercase tracking-widest">
            {t("physics.spring.energy_balance")}
          </h4>
          <div className="text-[9px] text-emerald-400 font-mono">
            {t("physics.spring.conservation")}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {showEnergy && (
          <div className="space-y-2">
            <EnergyBar label="E-kin" value={metrics.ke} color="cyan" max={5} />
            <EnergyBar
              label="E-pot*"
              value={metrics.pe}
              color="amber"
              max={5}
            />
            <EnergyBar
              label="E-tot*"
              value={metrics.te}
              color="emerald"
              max={5}
              isTotal
            />
            <div className="text-[7px] text-slate-500 italic mt-1 px-1">
              *{" "}
              {t("physics.spring.energy_ref_note") || "t.o.v. evenwichtsstand"}
            </div>
          </div>
        )}

        {showGraph && (
          <div className="space-y-1">
            <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase tracking-wider">
              <span>{t("physics.spring.oscillation_curve")}</span>
              <span>t</span>
            </div>
            <div className="h-20 bg-black/50 rounded-xl border border-white/5 overflow-hidden relative">
              <canvas
                ref={graphRef}
                width={300}
                height={80}
                className="w-full h-full"
              />
            </div>
          </div>
        )}

        {/* Theoretical Verification Group */}
        <div className="pt-2 border-t border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              {t("physics.spring.theory")}
            </span>
            <div className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[8px] font-mono text-blue-400 uppercase">
              Exam Prep
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <MetricItem
              label={t("physics.spring.theoretical_period")}
              value={`${metrics.theoreticalT.toFixed(2)}s`}
            />
            <MetricItem
              label="Aantal trillingen (n)"
              value={metrics.phase.toFixed(2)}
            />
            <MetricItem
              label="Gereduceerde fase (φ)"
              value={metrics.reducedPhase.toFixed(2)}
            />
            <MetricItem
              label={t("physics.spring.displacement")}
              value={`${metrics.y.toFixed(2)}m`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricItem = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className="bg-white/5 p-2 rounded-xl border border-white/5">
    <div className="text-[7px] font-black text-slate-500 uppercase tracking-wider mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
      {label}
    </div>
    <div className="text-[10px] font-mono text-white font-bold">{value}</div>
  </div>
);

const EnergyBar = ({
  label,
  value,
  color,
  max,
  isTotal = false,
}: {
  label: string;
  value: number;
  color: string;
  max: number;
  isTotal?: boolean;
}) => {
  const pct = Math.min(100, (value / max) * 100);
  const colorClasses =
    {
      cyan: "bg-cyan-400 text-cyan-400",
      amber: "bg-amber-400 text-amber-400",
      emerald: "bg-emerald-400 text-emerald-400",
    }[color] || "bg-white text-white";

  return (
    <div className="flex items-center gap-2">
      <span
        className={`text-[8px] font-bold w-8 ${colorClasses.split(" ")[1]}`}
      >
        {label}
      </span>
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-75 ${colorClasses.split(" ")[0]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={`text-[8px] font-mono w-8 text-right ${isTotal ? "text-white font-bold" : "text-slate-400"}`}
      >
        {value.toFixed(1)}J
      </span>
    </div>
  );
};
