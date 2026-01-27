import { Palette, Plus, X } from "lucide-react";
import React, { useState } from "react";

import { lorentzTransform, useRelativityEngine } from "./useRelativityEngine";

interface EventBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  { hex: "#f472b6", name: "rose" },
  { hex: "#10b981", name: "emerald" },
  { hex: "#f59e0b", name: "amber" },
  { hex: "#60a5fa", name: "blue" },
  { hex: "#a855f7", name: "purple" },
  { hex: "#06b6d4", name: "cyan" },
  { hex: "#6366f1", name: "indigo" },
  { hex: "#d946ef", name: "fuchsia" },
];

export const EventBuilderModal: React.FC<EventBuilderModalProps> = ({
  isOpen,
  onClose,
}) => {
  const engine = useRelativityEngine();

  const [x, setX] = useState(0);
  const [t, setT] = useState(0);
  const [label, setLabel] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]!.hex);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    engine.addEvent({
      x,
      t,
      label: label.trim(),
      color,
    });

    // Reset form
    setX(0);
    setT(0);
    setLabel("");
    setColor(PRESET_COLORS[0]!.hex);
    onClose();
  };

  if (!isOpen) return null;

  // Preview transformation
  const transformed = lorentzTransform(x, t, engine.beta);
  const interval = t * t - x * x;
  const intervalType =
    interval > 0 ? "timelike" : interval < 0 ? "spacelike" : "lightlike";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">
            Nieuw Spacetime Event
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                x (licht-seconden)
              </label>
              <input
                type="number"
                step="0.1"
                value={x}
                onChange={(e) => setX(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white font-mono focus:border-rose-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                ct (seconden)
              </label>
              <input
                type="number"
                step="0.1"
                value={t}
                onChange={(e) => setT(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white font-mono focus:border-rose-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Label */}
          <div>
            <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
              Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Bijv. 'Bliksem A'"
              maxLength={20}
              className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:border-rose-500 focus:outline-none"
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="text-[10px] text-slate-400 uppercase font-bold block mb-2">
              <Palette className="w-3 h-3 inline mr-1" />
              Kleur
            </label>
            <div className="flex gap-2 flex-wrap pb-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setColor(c.hex)}
                  className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center border-2 btn-elite-neon-${c.name} ${
                    color === c.hex
                      ? "active scale-110 shadow-lg"
                      : "opacity-40 hover:opacity-100 hover:scale-105"
                  }`}
                  style={{
                    backgroundColor:
                      color === c.hex ? `${c.hex}15` : "transparent",
                    borderColor: color === c.hex ? c.hex : `${c.hex}22`,
                  }}
                >
                  {color === c.hex && (
                    <div
                      className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]"
                      style={{ backgroundColor: c.hex }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <div className="text-[10px] text-slate-400 uppercase font-bold mb-2">
              Preview
            </div>
            <div className="grid grid-cols-3 gap-3 text-[10px]">
              <div>
                <span className="text-slate-500">Frame S</span>
                <div className="font-mono text-white">
                  ({x.toFixed(1)}, {t.toFixed(1)})
                </div>
              </div>
              <div>
                <span className="text-rose-400">Frame S'</span>
                <div className="font-mono text-rose-300">
                  ({transformed.x.toFixed(1)}, {transformed.t.toFixed(1)})
                </div>
              </div>
              <div>
                <span className="text-slate-500">Interval</span>
                <div
                  className={`font-mono ${
                    intervalType === "timelike"
                      ? "text-emerald-400"
                      : intervalType === "spacelike"
                        ? "text-blue-400"
                        : "text-amber-400"
                  }`}
                >
                  s² = {interval.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!label.trim()}
            className={`w-full btn-elite-neon ${!label.trim() ? "btn-elite-neon-slate opacity-30" : "btn-elite-neon-rose active animate-pulse-slow"} !py-4 !text-sm`}
          >
            <Plus className="w-4 h-4" />
            Event Toevoegen
          </button>
        </form>
      </div>
    </div>
  );
};
