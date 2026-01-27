/**
 * Vectors Input Component
 */

import { useMathLabContext } from "@features/math/hooks/useMathLabContext";
import type { VectorData } from "@features/math/types";
import { useTranslations } from "@shared/hooks/useTranslations";
import { Grid3X3, Plus, RefreshCw, Trash2 } from "lucide-react";
import React from "react";

const VECTOR_COLORS = ["#00D1FF", "#F055BA", "#00FF9D", "#FFD166", "#A06CD5"];

export const VectorsInput: React.FC = () => {
  const { t } = useTranslations();
  const { vectors, setVectors, isMatrixActive, setIsMatrixActive } =
    useMathLabContext();

  const addVector = () => {
    const newId = `v${vectors.length + 1}`;
    const newVector: VectorData = {
      id: newId,
      symbol: ["u", "v", "w", "a", "b"][vectors.length % 5]!,
      x: "1",
      y: "1",
      z: "0",
      color: VECTOR_COLORS[vectors.length % VECTOR_COLORS.length]!,
    };
    setVectors([...vectors, newVector]);
  };

  const updateVector = (id: string, field: keyof VectorData, value: string) => {
    setVectors(
      vectors.map((v) => (v.id === id ? { ...v, [field]: value } : v)),
    );
  };

  const removeVector = (id: string) => {
    setVectors(vectors.filter((v) => v.id !== id));
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
          {t("calculus.vectors.define")}
        </span>
        <button
          onClick={() => setIsMatrixActive(!isMatrixActive)}
          className={`p-2 rounded-lg transition-all flex items-center gap-2 text-xs ${
            isMatrixActive
              ? "bg-purple-500/10 text-purple-400 border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
              : "bg-white/5 text-slate-400 hover:text-white border border-transparent"
          }`}
        >
          <Grid3X3 size={14} />
          Matrix
        </button>
      </div>

      {/* Vector Inputs */}
      {vectors.map((vec) => (
        <div
          key={vec.id}
          className="p-3 bg-black/40 rounded-lg border border-white/10 hover:border-cyan-500/30 transition-all"
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: vec.color }}
            />
            <input
              value={vec.symbol}
              onChange={(e) => updateVector(vec.id, "symbol", e.target.value)}
              className="w-8 bg-transparent text-white font-bold text-sm outline-none border-b border-white/20 focus:border-cyan-400"
              maxLength={2}
            />
            <span className="text-slate-500 text-xs">=</span>
            <button
              onClick={() => removeVector(vec.id)}
              className="ml-auto p-1 text-slate-500 hover:text-red-400 transition-all"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(["x", "y", "z"] as const).map((axis) => (
              <div key={axis} className="flex flex-col">
                <label
                  className={`text-[9px] uppercase font-bold mb-1 ${
                    axis === "x"
                      ? "text-red-400"
                      : axis === "y"
                        ? "text-green-400"
                        : "text-blue-400"
                  }`}
                >
                  {axis}
                </label>
                <input
                  value={vec[axis as keyof VectorData]}
                  onChange={(e) =>
                    updateVector(
                      vec.id,
                      axis as keyof VectorData,
                      e.target.value,
                    )
                  }
                  className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs font-mono text-white focus:border-cyan-500 outline-none transition-all"
                  placeholder="0"
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <button
        onClick={addVector}
        className="w-full py-2 border border-dashed border-white/10 rounded-lg text-slate-400 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all text-sm flex items-center justify-center gap-2"
      >
        <Plus size={14} />
        {t("calculus.vectors.add_vector")}
      </button>

      <button
        onClick={() =>
          setVectors([
            {
              id: "v1",
              symbol: "u",
              x: "3",
              y: "2",
              z: "0",
              color: VECTOR_COLORS[0]!,
            },
            {
              id: "v2",
              symbol: "v",
              x: "-1",
              y: "4",
              z: "0",
              color: VECTOR_COLORS[1]!,
            },
          ])
        }
        className="w-full py-2 bg-cyan-500/10 border border-cyan-500/50 hover:bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)] rounded-lg transition-all text-xs flex items-center justify-center gap-2"
      >
        <RefreshCw size={12} />
        {t("calculus.vectors.load_example")}
      </button>
    </div>
  );
};
