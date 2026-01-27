/**
 * Vectors Results Component
 */

import {
  useMathLabContext,
  useModuleState,
} from "@features/math/hooks/useMathLabContext";
import type { VectorsModuleState } from "@features/math/types";
import { useTranslations } from "@shared/hooks/useTranslations";
import React from "react";

export const VectorsResults: React.FC = () => {
  const { t } = useTranslations();
  const { computedVectors, resultantVector, crossProductVector } =
    useMathLabContext();

  const [state] = useModuleState<VectorsModuleState>("vectors");

  // Calculate dot product
  const v1 = computedVectors[0];
  const v2 = computedVectors[1];
  const dotProduct =
    computedVectors.length >= 2 && v1 && v2
      ? v1.x * v2.x + v1.y * v2.y + v1.z * v2.z
      : null;

  // Calculate magnitudes
  const magnitudes = computedVectors.map((v) =>
    Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z),
  );

  // Calculate angle between first two vectors
  const mag0 = magnitudes[0];
  const mag1 = magnitudes[1];
  const angle =
    dotProduct !== null && mag0 && mag0 > 0 && mag1 && mag1 > 0
      ? Math.acos(dotProduct / (mag0 * mag1)) * (180 / Math.PI)
      : null;

  return (
    <div className="space-y-4 pb-20">
      {/* Vector Magnitudes */}
      <div>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block mb-2">
          {t("calculus.vectors.magnitudes")}
        </span>
        <div className="space-y-1">
          {computedVectors.map((v, i) => (
            <div
              key={v.id}
              className="flex justify-between items-center p-2 bg-black/40 rounded"
            >
              <span className="text-sm font-mono" style={{ color: v.color }}>
                |{v.symbol}|
              </span>
              <span className="text-sm font-mono text-white">
                {(magnitudes[i] ?? 0).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Resultant */}
      {state.showResultant && resultantVector && (
        <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <span className="text-[10px] text-purple-400 uppercase tracking-wider">
            {t("calculus.vectors.resultant")}
          </span>
          <code className="block mt-1 text-white font-mono text-sm">
            Σ = ({resultantVector.x.toFixed(2)}, {resultantVector.y.toFixed(2)},{" "}
            {resultantVector.z.toFixed(2)})
          </code>
          <span className="text-xs text-slate-500">
            |Σ| ={" "}
            {Math.sqrt(
              resultantVector.x ** 2 +
                resultantVector.y ** 2 +
                resultantVector.z ** 2,
            ).toFixed(2)}
          </span>
        </div>
      )}

      {/* Cross Product */}
      {state.showCrossProduct && crossProductVector && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <span className="text-[10px] text-amber-400 uppercase tracking-wider">
            {t("calculus.vectors.cross_product")}
          </span>
          <code className="block mt-1 text-white font-mono text-sm">
            n = ({crossProductVector.x.toFixed(2)},{" "}
            {crossProductVector.y.toFixed(2)}, {crossProductVector.z.toFixed(2)}
            )
          </code>
          <span className="text-xs text-slate-500">
            |n| ={" "}
            {Math.sqrt(
              crossProductVector.x ** 2 +
                crossProductVector.y ** 2 +
                crossProductVector.z ** 2,
            ).toFixed(2)}
          </span>
        </div>
      )}

      {/* Dot Product */}
      {state.showDotProduct && dotProduct !== null && (
        <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
          <span className="text-[10px] text-cyan-400 uppercase tracking-wider">
            {t("calculus.vectors.dot_product")}
          </span>
          <code className="block mt-1 text-white font-mono text-sm">
            {computedVectors[0]?.symbol} · {computedVectors[1]?.symbol} ={" "}
            {dotProduct.toFixed(2)}
          </code>
        </div>
      )}

      {/* Angle */}
      {state.showAngles && angle !== null && (
        <div className="p-3 bg-pink-500/10 border border-pink-500/30 rounded-lg">
          <span className="text-[10px] text-pink-400 uppercase tracking-wider">
            {t("calculus.vectors.angle_between")}
          </span>
          <code className="block mt-1 text-white font-mono text-sm">
            θ = {angle.toFixed(1)}°
          </code>
        </div>
      )}
    </div>
  );
};
