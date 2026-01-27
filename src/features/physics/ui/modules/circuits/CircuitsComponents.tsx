import {
  Activity,
  Battery,
  Infinity as InfinityIcon,
  Lightbulb,
  RefreshCcw,
  Square,
  Sun,
  Thermometer,
  ToggleLeft,
  Waves,
  Zap,
} from "lucide-react";
import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { useCircuitsEngine } from "./useCircuitsEngine";

// 1. ANALYSIS HUD (Oscilloscope)
export const AnalysisHUD: React.FC = () => {
  const { state, history } = useCircuitsEngine();
  const { t } = useTranslation("physics");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const activeComp =
    state.components?.find((c) => c.id === state.selectedId) ||
    state.components?.[0];

  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    const draw = () => {
      if (!canvas || !ctx) return;
      const hist = history.current;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Grid (Static color)
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 1; i < 6; i++) {
        const gx = (i / 6) * canvas.width;
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, canvas.height);
        const gy = (i / 6) * canvas.height;
        ctx.moveTo(0, gy);
        ctx.lineTo(canvas.width, gy);
      }
      ctx.stroke();

      if (hist.length < 2) {
        animationFrameId = requestAnimationFrame(draw);
        return;
      }

      // Auto-Ranging
      const maxV = Math.max(...hist.map((d) => Math.abs(d.V)), 0.1);
      const maxI = Math.max(...hist.map((d) => Math.abs(d.I)), 0.01);
      const scaleV = canvas.height / 2 / (maxV * 1.2);
      const scaleI = canvas.height / 2 / (maxI * 1.2);
      const midY = canvas.height / 2;

      // Voltage (Rose)
      ctx.strokeStyle = "#f43f5e";
      ctx.lineWidth = 2;
      ctx.beginPath();
      hist.forEach((d, i) => {
        const x = (i / 500) * canvas.width;
        const y = midY - d.V * scaleV;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Current (Sky)
      ctx.strokeStyle = "#0ea5e9";
      ctx.lineWidth = 2;
      ctx.beginPath();
      hist.forEach((d, i) => {
        const x = (i / 500) * canvas.width;
        const y = midY - d.I * scaleI;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Labels
      ctx.fillStyle = "#f43f5e";
      ctx.font = "10px Inter";
      ctx.fillText(`±${maxV.toFixed(1)}V`, 5, 12);
      ctx.fillStyle = "#0ea5e9";
      ctx.fillText(`±${maxI.toFixed(2)}A`, canvas.width - 50, 12);

      animationFrameId = requestAnimationFrame(draw);
    };

    animationFrameId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationFrameId);
  }, [history]);

  return (
    <div className="flex flex-col gap-2">
      <div className="w-[320px] bg-[#020617]/80 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="px-5 py-4 border-b border-white/5 bg-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={10} className="text-rose-500" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                {t("circuits.oscilloscope")}
              </span>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.5)]" />
                <span className="text-[8px] font-bold text-rose-500 uppercase tracking-wider">
                  V
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-sky-500 shadow-[0_0_5px_rgba(14,165,233,0.5)]" />
                <span className="text-[8px] font-bold text-sky-500 uppercase tracking-wider">
                  A
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col">
              <span className="text-[6px] font-black uppercase tracking-[0.1em] text-slate-500 mb-0.5">
                {t("circuits.voltage")}
              </span>
              <div className="text-sm font-black text-rose-500 tabular-nums">
                {(activeComp?.voltageDrop || 0).toFixed(2)}
              </div>
            </div>
            <div className="flex flex-col border-l border-white/5 pl-2">
              <span className="text-[6px] font-black uppercase tracking-[0.1em] text-slate-500 mb-0.5">
                {t("circuits.current")}
              </span>
              <div className="text-sm font-black text-sky-400 tabular-nums">
                {state.totalCurrent.toFixed(3)}
              </div>
            </div>
            <div className="flex flex-col border-l border-white/5 pl-2">
              <span className="text-[6px] font-black uppercase tracking-[0.1em] text-slate-500 mb-0.5">
                {t("circuits.power")}
              </span>
              <div className="text-sm font-black text-amber-500 tabular-nums">
                {state.totalPower.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        <div className="relative h-[160px] bg-black/20">
          <canvas
            ref={canvasRef}
            width={320}
            height={160}
            className="w-full h-full opacity-90"
          />
          <div
            className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-white/[0.04] to-transparent h-[4px] animate-scan"
            style={{ top: "0%" }}
          />
        </div>
      </div>
    </div>
  );
};

// 2. PARAMETERS HUD (Inputs)
export const ParametersHUD: React.FC = () => {
  const {
    state,
    updateComponentValue,
    updateComponentFreq,
    updateComponentExternal,
    removeComponent,
  } = useCircuitsEngine();
  const { t } = useTranslation("physics");

  const selectedComp = state.components?.find((c) => c.id === state.selectedId);

  // Helper voor dynamische max ranges
  const getMaxRange = (type: string) => {
    if (type === "resistor") return 10000;
    if (type === "battery") return 100;
    if (type === "capacitor") return 0.001;
    if (type === "inductor") return 1;
    return 100;
  };

  const getStep = (type: string) => {
    if (type === "capacitor") return 0.00001;
    if (type === "resistor") return 10;
    return 1;
  };

  return (
    <div className="flex flex-col gap-3">
      {selectedComp && (
        <div className="bg-[#020617]/60 backdrop-blur-xl p-5 rounded-[2rem] border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.1)] min-w-[240px] animate-in slide-in-from-left-4 duration-500">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity size={12} className="text-amber-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                {t("circuits.inspector")}
              </span>
            </div>
            <button
              onClick={() => removeComponent(selectedComp.id)}
              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-colors"
            >
              <RefreshCcw size={10} className="rotate-45" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Main Value Slider */}
            {selectedComp.type !== "wire" && selectedComp.type !== "switch" && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase tracking-widest px-1">
                  <span>
                    {selectedComp.type === "battery"
                      ? t("circuits.voltage")
                      : selectedComp.type === "ac_source"
                        ? t("circuits.peak_voltage")
                        : selectedComp.type === "capacitor"
                          ? t("circuits.capacitance")
                          : selectedComp.type === "inductor"
                            ? t("circuits.inductance")
                            : t("circuits.resistance")}
                  </span>
                  <span className="text-amber-500">
                    {selectedComp.value}{" "}
                    {selectedComp.type === "battery" ||
                    selectedComp.type === "ac_source"
                      ? "V"
                      : selectedComp.type === "capacitor"
                        ? "F"
                        : selectedComp.type === "inductor"
                          ? "H"
                          : "Ω"}
                  </span>
                </div>
                <input
                  type="range"
                  min={selectedComp.type === "capacitor" ? 0.00001 : 0.1}
                  max={getMaxRange(selectedComp.type)}
                  step={getStep(selectedComp.type)}
                  value={selectedComp.value}
                  onChange={(e) =>
                    updateComponentValue(
                      selectedComp.id,
                      parseFloat(e.target.value),
                    )
                  }
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>
            )}

            {selectedComp.type === "ac_source" && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase tracking-widest px-1">
                  <span>{t("circuits.frequency")}</span>
                  <span className="text-blue-400">
                    {selectedComp.frequency} Hz
                  </span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={60}
                  step={0.1}
                  value={selectedComp.frequency}
                  onChange={(e) =>
                    updateComponentFreq(
                      selectedComp.id,
                      parseFloat(e.target.value),
                    )
                  }
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            )}

            {(selectedComp.type === "ldr" || selectedComp.type === "ntc") && (
              <div className="space-y-1.5 border-t border-white/5 pt-4">
                <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase tracking-widest px-1">
                  <span>
                    {selectedComp.type === "ldr"
                      ? t("circuits.light_level")
                      : t("circuits.temperature")}
                  </span>
                  <span
                    className={
                      selectedComp.type === "ldr"
                        ? "text-yellow-400"
                        : "text-rose-400"
                    }
                  >
                    {Math.round((selectedComp.externalFactor || 0.5) * 100)}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {selectedComp.type === "ldr" ? (
                    <Sun size={12} className="text-yellow-400" />
                  ) : (
                    <Thermometer size={12} className="text-rose-400" />
                  )}
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={selectedComp.externalFactor || 0.5}
                    onChange={(e) =>
                      updateComponentExternal(
                        selectedComp.id,
                        parseFloat(e.target.value),
                      )
                    }
                    className={`w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer ${selectedComp.type === "ldr" ? "accent-yellow-400" : "accent-rose-400"}`}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 opacity-60">
              <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                <p className="text-[6px] font-bold text-slate-500 uppercase mb-0.5">
                  {t("circuits.current")}
                </p>
                <p className="text-[10px] font-black text-white">
                  {(selectedComp.current || 0).toFixed(3)} A
                </p>
              </div>
              <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                <p className="text-[6px] font-bold text-slate-500 uppercase mb-0.5">
                  {t("circuits.power")}
                </p>
                <p className="text-[10px] font-black text-white">
                  {(selectedComp.power || 0).toFixed(2)} W
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#020617]/40 backdrop-blur-md p-4 rounded-3xl border border-white/5 min-w-[200px]">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {t("circuits.status")}
          </span>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-end border-b border-white/5 pb-2">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
              {t("circuits.comp_count")}
            </span>
            <span className="text-sm font-black text-white">
              {state.components?.length || 0}
            </span>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
              {t("circuits.power")}
            </span>
            <span className="text-sm font-black text-amber-500">
              {state.totalPower.toFixed(2)} W
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// 3. CIRCUITS SIDEBAR (Toolkit)
export const CircuitsSidebar: React.FC = () => {
  const { state, addComponent, setParam, reset } = useCircuitsEngine();
  const { t } = useTranslation("physics");

  return (
    <div className="flex items-center justify-between w-full h-full py-1 px-2 relative overflow-hidden">
      <div className="shrink-0 pr-4 border-r border-white/10 flex items-center h-full">
        <button
          onClick={reset}
          className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all active:scale-95 group"
          title={t("circuits.reset")}
        >
          <RefreshCcw
            size={16}
            className="group-hover:rotate-180 transition-transform duration-500"
          />
        </button>
      </div>

      <div className="flex-1 overflow-x-auto no-scrollbar mx-2 h-full flex items-center">
        <div className="grid grid-rows-2 grid-flow-col gap-x-3 gap-y-2 auto-cols-max">
          <ToolkitButton
            icon={Zap}
            label={t("circuits.wire")}
            color="text-slate-400"
            onClick={() => addComponent("wire")}
          />
          <ToolkitButton
            icon={Battery}
            label={t("circuits.battery")}
            color="text-amber-400"
            onClick={() => addComponent("battery")}
          />
          <ToolkitButton
            icon={Waves}
            label={t("circuits.ac_source")}
            color="text-blue-400"
            onClick={() => addComponent("ac_source")}
          />
          <ToolkitButton
            icon={Zap}
            label={t("circuits.resistor")}
            color="text-orange-400"
            onClick={() => addComponent("resistor")}
          />
          <ToolkitButton
            icon={Lightbulb}
            label={t("circuits.bulb")}
            color="text-yellow-200"
            onClick={() => addComponent("bulb")}
          />
          <ToolkitButton
            icon={ToggleLeft}
            label={t("circuits.switch")}
            color="text-emerald-400"
            onClick={() => addComponent("switch")}
          />
          <ToolkitButton
            icon={Square}
            label={t("circuits.capacitor")}
            color="text-blue-600"
            onClick={() => addComponent("capacitor")}
          />
          <ToolkitButton
            icon={InfinityIcon}
            label={t("circuits.inductor")}
            color="text-amber-700"
            onClick={() => addComponent("inductor")}
          />
          <ToolkitButton
            icon={Sun}
            label={t("circuits.ldr")}
            color="text-yellow-400"
            onClick={() => addComponent("ldr")}
          />
          <ToolkitButton
            icon={Thermometer}
            label={t("circuits.ntc")}
            color="text-rose-400"
            onClick={() => addComponent("ntc")}
          />
          <ToolkitButton
            icon={Activity}
            label={t("circuits.ground")}
            color="text-emerald-500"
            onClick={() => addComponent("ground")}
          />
        </div>
      </div>

      <div className="shrink-0 pl-4 border-l border-white/10 flex items-center h-full gap-4">
        <div className="flex flex-col gap-2 min-w-[100px]">
          <ControlSwitch
            label={t("circuits.electrons")}
            active={state.showElectrons}
            onClick={() => setParam("showElectrons", !state.showElectrons)}
          />
          <ControlSwitch
            label={t("circuits.active")}
            active={state.isPlaying}
            onClick={() => setParam("isPlaying", !state.isPlaying)}
          />
        </div>
      </div>
    </div>
  );
};

const ToolkitButton: React.FC<{
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  color: string;
  onClick: () => void;
}> = ({ icon: Icon, label, color, onClick }) => (
  <button
    onClick={onClick}
    className="px-3 py-2 rounded-xl bg-white/5 border border-white/5 hover:border-amber-500/40 hover:bg-amber-500/5 transition-all flex flex-col items-center gap-1.5 group active:scale-95 min-w-[72px]"
  >
    <Icon
      className={`${color} group-hover:scale-110 transition-transform`}
      size={16}
    />
    <span className="text-[7px] font-black text-slate-500 group-hover:text-white tracking-widest uppercase truncate w-full text-center">
      {label}
    </span>
  </button>
);

const ControlSwitch: React.FC<{
  label: string;
  active: boolean;
  onClick: () => void;
}> = ({ label, active, onClick }) => (
  <div
    className="flex items-center justify-between group cursor-pointer"
    onClick={onClick}
  >
    <span className="text-[10px] font-bold text-slate-400 group-hover:text-white transition-colors">
      {label}
    </span>
    <div
      className={`w-8 h-4 rounded-full transition-all duration-300 relative border ${active ? "bg-amber-500/10 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]" : "bg-white/5 border-white/10"}`}
    >
      <div
        className={`absolute top-[3px] w-2 h-2 rounded-full transition-all duration-300 ${active ? "left-[17px] bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]" : "left-[3px] bg-slate-500"}`}
      />
    </div>
  </div>
);
