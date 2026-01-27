import { useTranslations } from "@shared/hooks/useTranslations";
import React, { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useModuleState } from "../../../hooks/useBiologyLabContext";
import { defaultGenomicsState, GenomicsState } from "../../../types";
import {
  CODON_TABLE,
  getKyteDoolittleScore,
  transcribeDNAtoRNA,
} from "../../../utils/bioUtils";

const BarChartAny = BarChart as unknown as React.ComponentType<Record<string, unknown>>;
const AreaChartAny = AreaChart as unknown as React.ComponentType<Record<string, unknown>>;

export const GenomicsAnalysis: React.FC = () => {
  const [state] = useModuleState<GenomicsState>(
    "genomics",
    defaultGenomicsState,
  );
  const { t } = useTranslations();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const baseFrequency = useMemo(() => {
    const counts: Record<string, number> = { A: 0, T: 0, C: 0, G: 0 };
    (state.sequence || "")
      .toUpperCase()
      .split("")
      .forEach((base) => {
        if (counts[base] !== undefined) counts[base]++;
      });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [state.sequence]);

  const proteinData = useMemo(() => {
    const rna = transcribeDNAtoRNA(state.sequence || "");
    const aminoAcids = [];
    for (let i = 0; i < rna.length - 2; i += 3) {
      const codon = rna.substring(i, i + 3);
      aminoAcids.push(CODON_TABLE[codon] || "?");
    }
    return aminoAcids;
  }, [state.sequence]);

  const plotData = useMemo(() => {
    return proteinData.map((aa, i) => ({
      residue: i + 1,
      score: getKyteDoolittleScore(aa),
      aa: aa,
    }));
  }, [proteinData]);

  const colors: Record<string, string> = {
    A: "#ef4444",
    T: "#3b82f6",
    C: "#22c55e",
    G: "#eab308",
  };

  return (
    <div className="p-6 flex flex-col h-full overflow-hidden">
      <div className="flex-1 mb-6">
        <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">
          {t("biology.genomics.analysis.base_frequency")}
        </h5>
        <div className="h-32 min-h-[128px]">
          {isMounted ? (
            <ResponsiveContainer
              width="99%"
              height="100%"
              minWidth={10}
              minHeight={128}
            >
              <BarChartAny data={baseFrequency}>
                <XAxis dataKey="name" hide />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#000",
                    border: "1px solid #333",
                    fontSize: "10px",
                  }}
                  itemStyle={{ color: "#fff" }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {baseFrequency.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={colors[entry.name] || "#8884d8"}
                    />
                  ))}
                </Bar>
              </BarChartAny>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full bg-white/5 animate-pulse rounded-lg" />
          )}
        </div>
      </div>

      <div className="flex-1 mb-6 flex flex-col">
        <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
          Hydrofobiciteit
        </h5>
        <div className="h-24 min-h-[96px] bg-black/20 rounded-xl p-2 border border-white/5 relative overflow-hidden">
          {isMounted ? (
            <ResponsiveContainer
              width="99%"
              height="100%"
              minWidth={10}
              minHeight={80}
            >
              <AreaChartAny data={plotData}>
                <defs>
                  <linearGradient
                    id="colorScoreAnalysis"
                    x1="0"
                    y1="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="residue" hide />
                <YAxis hide domain={["auto", "auto"]} />
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#ffffff05"
                  vertical={false}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#8884d8"
                  fillOpacity={1}
                  fill="url(#colorScoreAnalysis)"
                  isAnimationActive={false}
                />
              </AreaChartAny>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full bg-white/5 animate-pulse rounded-lg" />
          )}
        </div>
      </div>

      <div className="flex-2 overflow-hidden flex flex-col min-h-0">
        <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
          {t("biology.genomics.analysis.translated_peptide")} ({proteinData.length} AA)
        </h5>
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/40 border border-white/5 rounded-xl p-3 font-mono text-[9px] break-all leading-relaxed text-slate-400">
          {proteinData.length > 0 ? (
            proteinData.map((aa, i) => (
              <span
                key={i}
                className={`transition-colors duration-300 ${state.selectedIndex !== null && Math.floor(state.selectedIndex / 3) === i ? "text-white font-black bg-white/10 px-0.5 rounded" : ""}`}
              >
                {aa}
              </span>
            ))
          ) : (
            <span className="italic">
              {t("biology.genomics.analysis.no_coding_sequence")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
