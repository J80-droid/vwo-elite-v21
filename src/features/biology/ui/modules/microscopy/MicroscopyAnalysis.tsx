import { useTranslations } from "@shared/hooks/useTranslations";
import React, { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { useModuleState } from "../../../hooks/useBiologyLabContext";
import { defaultMicroscopyState, MicroscopyState } from "../../../types";
import {
  CELL_COMPOSITION,
  ORGANELLE_DIMENSIONS,
} from "../../../utils/bioConstants";

export const MicroscopyAnalysis: React.FC = () => {
  const [state] = useModuleState<MicroscopyState>(
    "microscopy",
    defaultMicroscopyState,
  );
  const { t } = useTranslations();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Real cell composition data from Campbell Biology, 12th Edition
  const organelleData = useMemo(() => {
    if (state.selectedSlide === "plant") {
      const plant = CELL_COMPOSITION.PLANT;
      return [
        {
          name: "Vacuole",
          value: plant.vacuole,
          color: "#60a5fa",
          size: "30-90% of cell",
        },
        {
          name: "Cytoplasm",
          value: plant.cytoplasm,
          color: "#10b981",
          size: "Variable",
        },
        {
          name: "Chloroplasts",
          value: plant.chloroplasts,
          color: "#34d399",
          size: `${ORGANELLE_DIMENSIONS.chloroplast.diameter.min}-${ORGANELLE_DIMENSIONS.chloroplast.diameter.max} ${ORGANELLE_DIMENSIONS.chloroplast.unit}`,
        },
        {
          name: "Nucleus",
          value: plant.nucleus,
          color: "#8b5cf6",
          size: `${ORGANELLE_DIMENSIONS.nucleus.diameter.min}-${ORGANELLE_DIMENSIONS.nucleus.diameter.max} ${ORGANELLE_DIMENSIONS.nucleus.unit}`,
        },
        {
          name: "ER",
          value: plant.endoplasmic_reticulum,
          color: "#f59e0b",
          size: "Network",
        },
        {
          name: "Mitochondria",
          value: plant.mitochondria,
          color: "#ef4444",
          size: `${ORGANELLE_DIMENSIONS.mitochondria.length.min}-${ORGANELLE_DIMENSIONS.mitochondria.length.max} ${ORGANELLE_DIMENSIONS.mitochondria.unit}`,
        },
        { name: "Golgi", value: plant.golgi, color: "#ec4899", size: "Stacks" },
      ];
    } else if (state.selectedSlide === "animal") {
      const animal = CELL_COMPOSITION.ANIMAL;
      return [
        {
          name: "Cytoplasm",
          value: animal.cytoplasm,
          color: "#f472b6",
          size: "Variable",
        },
        {
          name: "Mitochondria",
          value: animal.mitochondria,
          color: "#ef4444",
          size: `${ORGANELLE_DIMENSIONS.mitochondria.length.min}-${ORGANELLE_DIMENSIONS.mitochondria.length.max} ${ORGANELLE_DIMENSIONS.mitochondria.unit}`,
        },
        {
          name: "Nucleus",
          value: animal.nucleus,
          color: "#8b5cf6",
          size: `${ORGANELLE_DIMENSIONS.nucleus.diameter.min}-${ORGANELLE_DIMENSIONS.nucleus.diameter.max} ${ORGANELLE_DIMENSIONS.nucleus.unit}`,
        },
        {
          name: "ER",
          value: animal.endoplasmic_reticulum,
          color: "#f59e0b",
          size: "Network",
        },
        {
          name: "Golgi",
          value: animal.golgi,
          color: "#ec4899",
          size: "Stacks",
        },
        {
          name: "Lysosomes",
          value: animal.lysosomes,
          color: "#06b6d4",
          size: `${ORGANELLE_DIMENSIONS.lysosome.diameter.min}-${ORGANELLE_DIMENSIONS.lysosome.diameter.max} ${ORGANELLE_DIMENSIONS.lysosome.unit}`,
        },
        {
          name: "Peroxisomes",
          value: animal.peroxisomes,
          color: "#84cc16",
          size: "0.1-1 μm",
        },
      ];
    }
    return [];
  }, [state.selectedSlide]);

  // Calculate scale bar based on zoom
  const scaleBar = useMemo(() => {
    const zoomToMicrons: Record<number, number> = {
      40: 100, // 100 μm at 40x
      100: 50, // 50 μm at 100x
      400: 10, // 10 μm at 400x
      1000: 5, // 5 μm at 1000x
    };
    return zoomToMicrons[state.zoom] || 50;
  }, [state.zoom]);

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          {t("biology.microscopy.analysis.cellular_composition")}
        </h5>
        {state.selectedSlide && (
          <div className="flex items-center gap-2 bg-black/30 px-2 py-1 rounded border border-white/10">
            <div className="w-8 h-0.5 bg-white" />
            <span className="text-[8px] font-mono text-slate-400">
              {scaleBar} μm
            </span>
          </div>
        )}
      </div>

      {state.selectedSlide ? (
        <div className="flex-1 flex flex-col">
          <div className="h-36 min-h-[140px]">
            {isMounted ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={0}
                minHeight={140}
                debounce={1}
              >
                <PieChart>
                  <Pie
                    data={organelleData}
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {organelleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#000",
                      border: "1px solid #333",
                      fontSize: "10px",
                    }}
                    itemStyle={{ color: "#fff" }}
                    formatter={(value, name, props) => [
                      `${value ?? 0}% | Size: ${props?.payload?.size ?? "N/A"}`,
                      name as string,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full bg-white/5 rounded-full animate-pulse mx-auto aspect-square scale-75" />
            )}
          </div>

          {/* Legend with real dimensions */}
          <div className="mt-3 space-y-1.5 max-h-[120px] overflow-y-auto custom-scrollbar">
            {organelleData.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-[9px]">
                <div
                  className="w-2 h-2 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-bold text-slate-400 uppercase tracking-tighter">
                  {item.name}
                </span>
                <span className="font-mono text-white ml-auto">
                  {item.value}%
                </span>
                <span className="font-mono text-slate-600 text-[8px] w-16 text-right">
                  {item.size}
                </span>
              </div>
            ))}
          </div>

          {/* Data source citation */}
          <div className="mt-auto pt-3 border-t border-white/5">
            <p className="text-[7px] text-slate-700 italic">
              Source: Campbell Biology, 12th Ed. (Urry et al., 2020)
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-black/20 rounded-2xl border border-dashed border-white/5">
          <p className="text-[10px] text-slate-600 italic">
            {t("biology.microscopy.analysis.select_slide_prompt")}
          </p>
        </div>
      )}
    </div>
  );
};
