/* eslint-disable @typescript-eslint/no-explicit-any */
import { BINAS_DATA } from "@shared/assets/data/BinasData";
import { useVoiceCoachContext } from "@shared/lib/contexts/VoiceCoachContext";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Search,
  X,
} from "lucide-react";
import React, { useState } from "react";

import { useModuleState } from "../hooks/ChemistryLabContext";
import ChemicalFormatter from "./ui/ChemicalFormatter";

// Helper component for table display
const MOLECULAR_STRUCTURES: Record<string, React.ReactNode> = {
  Alanine: (
    <svg
      viewBox="0 0 100 80"
      className="w-full h-full stroke-cyan-400 fill-none"
      strokeWidth="2"
    >
      <path d="M 20 60 L 40 40 L 60 40 M 40 40 L 40 20 M 60 40 L 80 60 M 60 40 L 70 20" />
      <text x="10" y="70" className="fill-white text-[8px]" stroke="none">
        NH2
      </text>
      <text x="75" y="70" className="fill-white text-[8px]" stroke="none">
        COOH
      </text>
      <text x="35" y="15" className="fill-cyan-300 text-[8px]" stroke="none">
        CH3
      </text>
    </svg>
  ),
  Glycine: (
    <svg
      viewBox="0 0 100 80"
      className="w-full h-full stroke-cyan-400 fill-none"
      strokeWidth="2"
    >
      <path d="M 20 60 L 40 40 L 60 40 L 80 60 L 70 20" />
      <text x="10" y="70" className="fill-white text-[8px]" stroke="none">
        NH2
      </text>
      <text x="75" y="70" className="fill-white text-[8px]" stroke="none">
        COOH
      </text>
    </svg>
  ),
  Adenine: (
    <svg
      viewBox="0 0 100 100"
      className="w-full h-full stroke-rose-400 fill-none"
      strokeWidth="2"
    >
      <path d="M 50 20 L 70 35 L 70 65 L 50 80 L 30 65 L 30 35 Z" />
      <path d="M 70 35 L 90 45 L 90 75 L 70 65" />
      <text x="40" y="15" className="fill-white text-[8px]" stroke="none">
        NH2
      </text>
    </svg>
  ),
  Guanine: (
    <svg
      viewBox="0 0 100 100"
      className="w-full h-full stroke-rose-400 fill-none"
      strokeWidth="2"
    >
      <path d="M 30 40 L 50 25 L 70 40 L 70 70 L 50 85 L 30 70 Z" />
      <path d="M 70 40 L 90 50 L 90 80 L 70 70" />
      <text x="45" y="20" className="fill-white text-[8px]" stroke="none">
        O
      </text>
      <text x="92" y="55" className="fill-white text-[8px]" stroke="none">
        NH2
      </text>
    </svg>
  ),
  Cytosine: (
    <svg
      viewBox="0 0 100 100"
      className="w-full h-full stroke-rose-400 fill-none"
      strokeWidth="2"
    >
      <path d="M 50 20 L 80 40 L 80 70 L 50 90 L 20 70 L 20 40 Z" />
      <text x="45" y="15" className="fill-white text-[8px]" stroke="none">
        NH2
      </text>
      <text x="85" y="45" className="fill-white text-[8px]" stroke="none">
        O
      </text>
    </svg>
  ),
  Thymine: (
    <svg
      viewBox="0 0 100 100"
      className="w-full h-full stroke-rose-400 fill-none"
      strokeWidth="2"
    >
      <path d="M 50 20 L 80 40 L 80 70 L 50 90 L 20 70 L 20 40 Z" />
      <text x="45" y="15" className="fill-white text-[8px]" stroke="none">
        O
      </text>
      <text x="85" y="45" className="fill-cyan-300 text-[8px]" stroke="none">
        CH3
      </text>
      <text x="45" y="95" className="fill-white text-[8px]" stroke="none">
        O
      </text>
    </svg>
  ),
  Uracil: (
    <svg
      viewBox="0 0 100 100"
      className="w-full h-full stroke-rose-400 fill-none"
      strokeWidth="2"
    >
      <path d="M 50 20 L 80 40 L 80 70 L 50 90 L 20 70 L 20 40 Z" />
      <text x="45" y="15" className="fill-white text-[8px]" stroke="none">
        O
      </text>
      <text x="45" y="95" className="fill-white text-[8px]" stroke="none">
        O
      </text>
    </svg>
  ),
  Valine: (
    <svg
      viewBox="0 0 100 80"
      className="w-full h-full stroke-cyan-400 fill-none"
      strokeWidth="2"
    >
      <path d="M 20 60 L 40 40 L 60 40 L 80 60 L 70 20" />
      <path d="M 40 40 L 30 20" />
      <path d="M 40 40 L 50 20" />
      <text x="10" y="70" className="fill-white text-[8px]" stroke="none">
        NH2
      </text>
      <text x="75" y="70" className="fill-white text-[8px]" stroke="none">
        COOH
      </text>
    </svg>
  ),
  Serine: (
    <svg
      viewBox="0 0 100 80"
      className="w-full h-full stroke-cyan-400 fill-none"
      strokeWidth="2"
    >
      <path d="M 20 60 L 40 40 L 60 40 L 80 60 L 70 20" />
      <path d="M 40 40 L 40 10" />
      <text x="10" y="70" className="fill-white text-[8px]" stroke="none">
        NH2
      </text>
      <text x="75" y="70" className="fill-white text-[8px]" stroke="none">
        COOH
      </text>
      <text x="35" y="5" className="fill-white text-[8px]" stroke="none">
        OH
      </text>
    </svg>
  ),
  Arginine: (
    <svg
      viewBox="0 0 100 100"
      className="w-full h-full stroke-cyan-400 fill-none"
      strokeWidth="2"
    >
      <path d="M 10 70 L 30 50 L 50 50 L 70 30 L 90 30" />
      <text x="5" y="85" className="fill-white text-[8px]" stroke="none">
        NH2
      </text>
      <text x="85" y="25" className="fill-white text-[8px]" stroke="none">
        NH-C(NH2)2
      </text>
    </svg>
  ),
  Asparaginezuur: (
    <svg
      viewBox="0 0 100 80"
      className="w-full h-full stroke-cyan-400 fill-none"
      strokeWidth="2"
    >
      <path d="M 20 60 L 40 40 L 60 40 L 80 60 L 70 20" />
      <path d="M 40 40 L 40 10" />
      <text x="10" y="70" className="fill-white text-[8px]" stroke="none">
        NH2
      </text>
      <text x="75" y="70" className="fill-white text-[8px]" stroke="none">
        COOH
      </text>
      <text x="35" y="5" className="fill-white text-[8px]" stroke="none">
        COOH
      </text>
    </svg>
  ),
  Glutamine: (
    <svg
      viewBox="0 0 100 80"
      className="w-full h-full stroke-cyan-400 fill-none"
      strokeWidth="2"
    >
      <path d="M 20 60 L 40 40 L 60 40 L 80 60 L 70 20" />
      <path d="M 40 40 L 40 20 L 50 10" />
      <text x="10" y="70" className="fill-white text-[8px]" stroke="none">
        NH2
      </text>
      <text x="75" y="70" className="fill-white text-[8px]" stroke="none">
        COOH
      </text>
      <text x="55" y="10" className="fill-white text-[8px]" stroke="none">
        CONH2
      </text>
    </svg>
  ),
  Lysine: (
    <svg
      viewBox="0 0 100 100"
      className="w-full h-full stroke-cyan-400 fill-none"
      strokeWidth="2"
    >
      <path d="M 10 70 L 30 50 L 50 70 L 70 50 L 90 70" />
      <text x="5" y="85" className="fill-white text-[8px]" stroke="none">
        NH2
      </text>
      <text x="85" y="85" className="fill-white text-[8px]" stroke="none">
        NH2
      </text>
    </svg>
  ),
  Phenylalanine: (
    <svg
      viewBox="0 0 100 100"
      className="w-full h-full stroke-cyan-400 fill-none"
      strokeWidth="2"
    >
      <path d="M 20 70 L 40 50 L 60 50" />
      <circle cx="75" cy="50" r="20" className="stroke-rose-400" />
      <text x="10" y="85" className="fill-white text-[8px]" stroke="none">
        NH2
      </text>
    </svg>
  ),
  Tyrosine: (
    <svg
      viewBox="0 0 100 100"
      className="w-full h-full stroke-cyan-400 fill-none"
      strokeWidth="2"
    >
      <path d="M 20 70 L 40 50 L 60 50 L 95 50" />
      <circle cx="75" cy="50" r="15" className="stroke-rose-400" />
      <text x="10" y="85" className="fill-white text-[8px]" stroke="none">
        NH2
      </text>
      <text x="90" y="45" className="fill-white text-[8px]" stroke="none">
        OH
      </text>
    </svg>
  ),
};

const INDICATOR_COLORS: Record<string, string> = {
  Rood: "#ef4444",
  Geel: "#facc15",
  Paarsblauw: "#6366f1",
  Blauw: "#3b82f6",
  Paarsrood: "#d946ef",
  "Oranje-rood": "#f97316",
  Kleurloos: "#ffffff20", // Witte gloed met 12% dekking (glas effect)
  Blauwgrijs: "#94a3b8",
};

const BinasTable: React.FC<{
  tableId: string;
  data: { title: string; headers: string[]; rows: string[][]; legend?: string };
  searchTerm: string;
}> = ({ tableId, data, searchTerm }) => {
  const [selectedStructure, setSelectedStructure] = useState<string | null>(
    null,
  );
  const [sortConfig, setSortConfig] = useState<{
    col: number;
    dir: "asc" | "desc" | null;
  }>({ col: -1, dir: null });

  const handleSort = (colIndex: number) => {
    setSortConfig((prev) => ({
      col: colIndex,
      dir: prev.col === colIndex && prev.dir === "asc" ? "desc" : "asc",
    }));
  };

  const sortedRows = [...data.rows].sort((a, b) => {
    if (sortConfig.col === -1 || !sortConfig.dir) return 0;
    const valA = a[sortConfig.col];
    const valB = b[sortConfig.col];
    const parseValue = (s: string) => {
      if (!s) return "";
      const clean = s
        .replace(/ · 10\^/g, "e")
        .replace(/,/g, ".")
        .replace(/[^\d.e-]/g, "");
      const parsed = parseFloat(clean);
      return isNaN(parsed) ? s.toLowerCase() : parsed;
    };
    const parsedA = parseValue(valA || "");
    const parsedB = parseValue(valB || "");
    if (typeof parsedA === "number" && typeof parsedB === "number") {
      return sortConfig.dir === "asc" ? parsedA - parsedB : parsedB - parsedA;
    }
    return sortConfig.dir === "asc"
      ? String(parsedA).localeCompare(String(parsedB))
      : String(parsedB).localeCompare(String(parsedA));
  });

  const filteredRows = sortedRows.filter((row) =>
    row.some((cell) => cell.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const isBioTable = tableId === "T66" || tableId === "T67";
  const isIndicatorTable = tableId === "T52A";
  const isPriorityTable = tableId === "T66D";

  return (
    <div className="overflow-hidden rounded-2xl border border-white/5 bg-slate-950/40 shadow-2xl flex flex-col relative group/table">
      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent opacity-0 group-hover/table:opacity-100 transition-opacity duration-700" />
      <div className="relative z-10 w-full overflow-x-auto pb-4 custom-scrollbar">
        <table className="w-full text-left text-[17px] relative border-collapse">
          <thead className="sticky top-16 z-20">
            <tr className="bg-slate-900/90 backdrop-blur-xl border-b border-white/10 shadow-lg">
              {data.headers.map((h: string, idx: number) => (
                <th
                  key={idx}
                  onClick={() => handleSort(idx)}
                  className="p-4 font-bold tracking-tight text-cyan-400 hover:text-white transition-all cursor-pointer select-none group/header"
                >
                  <div className="flex items-center gap-2">
                    <ChemicalFormatter formula={h} />
                    <div
                      className={`transition-all duration-300 ${sortConfig.col === idx ? "text-cyan-400 scale-110 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" : "text-slate-600 opacity-20 group-hover/header:opacity-100"}`}
                    >
                      {sortConfig.col === idx ? (
                        sortConfig.dir === "asc" ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )
                      ) : (
                        <ArrowUpDown size={14} />
                      )}
                    </div>
                  </div>
                </th>
              ))}
              {(isBioTable || isIndicatorTable) && (
                <th className="p-4 border-b border-white/10 font-bold tracking-tight text-cyan-500/80 uppercase text-[11px] whitespace-nowrap">
                  Visualisatie
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-300">
            {filteredRows.length > 0 ? (
              filteredRows.map((row: string[], i: number) => {
                const name = (row[0] || "").split(" ")[0] || "";
                const priorityStr = isPriorityTable
                  ? (row[3] || "").split(" ")[0] || "0"
                  : "0";
                const priority = parseInt(priorityStr);
                return (
                  <tr
                    key={i}
                    className={`hover:bg-cyan-500/[0.03] transition-all duration-300 group/row border-l-2 ${isPriorityTable && priority === 1 ? "bg-cyan-500/5 border-cyan-400 shadow-[inset_4px_0_12px_-4px_rgba(34,211,238,0.2)]" : "border-transparent hover:border-white/10"}`}
                  >
                    {row.map((cell: string, j: number) => (
                      <td key={j} className="p-4 whitespace-nowrap">
                        <ChemicalFormatter
                          formula={cell}
                          className={
                            searchTerm &&
                              cell
                                .toLowerCase()
                                .includes(searchTerm.toLowerCase())
                              ? "text-cyan-400 font-bold drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]"
                              : isPriorityTable && j === 3 && priority === 1
                                ? "text-cyan-400 font-bold"
                                : ""
                          }
                        />
                      </td>
                    ))}
                    <td className="p-4">
                      <button
                        onClick={() => setSelectedStructure(name)}
                        className="btn-elite-glass btn-elite-cyan !px-3 !py-1 !rounded-full !text-[10px]"
                      >
                        Bekijk
                      </button>
                    </td>
                    {isIndicatorTable && (
                      <td className="p-4">
                        <div className="flex items-center gap-1 w-24 h-4 rounded-full overflow-hidden border border-white/10 p-0.5 bg-black/20">
                          <div
                            className="flex-1 h-full rounded-l-full shadow-inner transition-transform hover:scale-110"
                            style={{
                              backgroundColor:
                                INDICATOR_COLORS[row[2] || ""] || "#666",
                            }}
                          />
                          <div className="w-px h-full bg-white/10" />
                          <div
                            className="flex-1 h-full rounded-r-full shadow-inner transition-transform hover:scale-110"
                            style={{
                              backgroundColor:
                                INDICATOR_COLORS[row[3] || ""] || "#666",
                            }}
                          />
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={
                    data.headers.length +
                    (isBioTable || isIndicatorTable ? 1 : 0)
                  }
                  className="p-20 text-center text-slate-500 italic"
                >
                  Geen resultaten gevonden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {data.legend && (
        <div className="p-4 bg-slate-900/50 backdrop-blur text-[11px] text-slate-500 italic border-t border-white/5 shrink-0 tracking-tight">
          {data.legend}
        </div>
      )}

      {/* Structure Modal Overlay */}
      <AnimatePresence>
        {selectedStructure && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedStructure(null)}
            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-8 rounded-2xl"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-white/10 p-8 rounded-3xl shadow-2xl max-w-sm w-full relative"
            >
              <button
                onClick={() => setSelectedStructure(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="w-1.5 h-6 bg-cyan-500 rounded-full" />
                {selectedStructure}
              </h3>

              <div className="aspect-square bg-black/40 rounded-2xl p-6 border border-white/5 flex items-center justify-center">
                {MOLECULAR_STRUCTURES[selectedStructure] || (
                  <div className="text-slate-600 italic text-sm text-center">
                    Geen visualisatie beschikbaar voor {selectedStructure}
                  </div>
                )}
              </div>

              <p className="mt-6 text-xs text-slate-500 text-center uppercase tracking-widest font-bold opacity-50">
                Moleculaire Structuur (Schematisch)
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CATEGORIES: Record<string, string[]> = {
  Algemeen: ["T7", "T25"],
  "Stoffen & Eigenschappen": ["T40", "T42"],
  "Reacties & Evenwicht": ["T45", "T46", "T48", "T49", "T37", "T57", "T58"],
  "Analyse & Spectroscopie": ["T39B", "T39C", "T39D", "T52A"],
  "Biochemie & Organisch": ["T66", "T66D", "T67"],
};

export const BinasControls: React.FC = () => {
  const [state, setState] = useModuleState("binas", {
    activeTab: "T45" as keyof typeof BINAS_DATA,
  });

  return (
    <div className="flex flex-row items-center gap-4 overflow-x-auto no-scrollbar max-w-full">
      {Object.entries(CATEGORIES).map(([catName, tables]) => (
        <div key={catName} className="flex items-center gap-1 bg-black/40 border border-white/5 p-1 rounded-xl shrink-0">
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest px-2">{catName}</span>
          <div className="flex gap-0.5">
            {tables.map((key) => (
              <button
                key={key}
                onClick={() => setState({ activeTab: key as any })}
                className={`px-2 py-1 rounded-lg text-[9px] font-black transition-all ${state.activeTab === key ? "bg-cyan-500/20 text-cyan-400" : "text-slate-600 hover:text-slate-400"}`}
              >
                {key}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export const BinasStage: React.FC = () => {
  const [state] = useModuleState("binas", {
    activeTab: "T45" as keyof typeof BINAS_DATA,
  });
  const [searchTerm, setSearchTerm] = React.useState("");
  const activeData =
    BINAS_DATA[state.activeTab as keyof typeof BINAS_DATA] || BINAS_DATA["T45"];

  useVoiceCoachContext(
    "ChemistryLab",
    `Je raadpleegt tabel ${state.activeTab}: ${activeData.title}.`,
    { activeModule: "binas", table: state.activeTab },
  );

  return (
    <div className="min-h-full flex flex-col p-6 animate-in fade-in zoom-in-95 duration-500 overflow-visible relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none select-none z-0">
        <h1 className="text-[12rem] font-black tracking-tighter text-white">
          VWO ELITE
        </h1>
      </div>

      <div className="relative z-10 w-full flex flex-col h-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="space-y-1">
            <div className="flex items-center gap-3 mb-1">
              <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-mono font-bold text-cyan-400">
                {String(state.activeTab)}
              </span>
              <div className="h-px w-8 bg-gradient-to-r from-cyan-500/20 to-transparent" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-white to-white bg-clip-text text-transparent tracking-tight drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]">
              {activeData.title}
            </h1>
            <p className="text-sm text-slate-500 max-w-lg leading-relaxed">
              Officiële referentiewaarden voor VWO Scheikunde.
            </p>
          </div>
          <div className="relative group">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors"
            />
            <input
              type="text"
              placeholder="Zoeken in tabel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-2xl pl-12 pr-6 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 w-full md:w-80 transition-all shadow-xl hover:bg-slate-900/80"
            />
          </div>
        </div>
        <div className="w-full overflow-visible">
          <BinasTable
            tableId={state.activeTab}
            data={activeData}
            searchTerm={searchTerm}
          />
        </div>
      </div>
    </div>
  );
};
