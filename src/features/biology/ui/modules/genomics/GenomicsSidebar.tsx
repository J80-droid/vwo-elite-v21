// import { fastaToJson } from '@teselagen/bio-parsers'; // Moved to dynamic import
import { logActivitySQL } from "@shared/api/sqliteService";
import { useTranslations } from "@shared/hooks/useTranslations";
import { useBioMasteryStore } from "@shared/model/bioMasteryStore";
import {
  Activity,
  Award,
  Box,
  Cpu,
  Database,
  FileCode,
  Fingerprint,
  Microscope,
  Scissors,
  Search,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import React from "react";

import { useModuleState } from "../../../hooks/useBiologyLabContext";
import { defaultGenomicsState, GenomicsState } from "../../../types";
import { CODON_TABLE, transcribeDNAtoRNA } from "../../../utils/bioUtils";

export const GenomicsSidebar: React.FC = () => {
  const [state, setState] = useModuleState<GenomicsState>(
    "genomics",
    defaultGenomicsState,
  );
  const { registerMutationAttempt } = useBioMasteryStore();
  const { t } = useTranslations();

  // Handlers
  const handleImportFasta = async (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const text = e.target.value;
    if (text.startsWith(">")) {
      try {
        // Dynamic import to reduce bundle size
        const { fastaToJson } = await import("@teselagen/bio-parsers");
        const result = await fastaToJson([text]);
        if (result && result[0]) {
          setState((prev) => ({ ...prev, sequence: result[0].sequence }));
          logActivitySQL("bio", "FASTA bestand geïmporteerd", 15);
        }
      } catch (err) {
        console.error("FASTA parse error", err);
      }
    } else {
      setState((prev) => ({
        ...prev,
        sequence: text.replace(/[^ATCGatcg]/g, "").toUpperCase(),
      }));
    }
  };

  const loadExample = (type: "covid" | "insulin") => {
    let seq = "";
    let id = "";
    if (type === "covid") {
      seq =
        "ATGTTTGTTTTTCTTGTTTTATTGCCACTAGTCTCTAGTCAGTGTGTTAATCTTACAACCAGAACTCAATTACCCCCTGCATACACTAATTCTTTCACACGTGGTGTTTATTACCCTGACAAAGTTTTCAGATCCTCAGTTTTACATTCAACTCAGGACTTGTTCTTACCTTTCTTTTCCAATGTTACTTGGTTCCATGCTATACATGTCTCTGGGACCAATGGTACTAAGAGGTTTGATAACCCTGTCCTACCATTTAATGATGGTGTTTATTTTGCTTCCACTGAGAAGTCTAACATAATAAGAGGCTGGATTTTTGGTACTACTTTAGATTCGAAGACCCAGTCCCTACTTATTGTTAATAACGCTACTAATGTTGTTATTAAAGTCTGTGAATTTCAATTTTGTAATGATCCATTTTTGGGTGTTTATTACCACAAAAACAACAAAAGTTGGATGGAAAGTGAGTTCAGAGTTTATTCTAGTGCGAATAATTGCACTTTTGAATATGTCTCTCAGCCTTTTCTTATGGACCTTGAAGGAAAACAGGGTAATTTCAAAAATCTTAGGGAATTTGTGTTTAAGAATATTGATGGTTATTTTAAAATATATTCTAAGCACACGCCTATTAATTTAGTGCGTGATCTCCCTCAGGGTTTTTCGGCTTTAGAACCATTGGTAGATTTGCCAATAGGTATTAACATCACTAGGTTTCAAACTTTACTTGCTTTACATAGAAGTTATTTGACTCCTGGTGATTCTTCTTCAGGTTGGACAGCTGGTGCTGCAGCTTATTATGTGGGTTATCTTCAACCTAGGACTTTTCTATTAAAATATAATGAAAATGGAACCATTACAGATGCTGTAGACTGTGCACTTGACCCTCTCTCAGAAACAAAGTGTACGTTGAAATCCTTCACTGTAGAAAAAGGAATCTATCAAACTTCTAACTTTAGAGTCCAACCAACAGAATCTATTGTTAGATTTCCTAATATTACAAACTTGTGCCCTTTTGGTGAAGTTTTTAACGCCACCAGATTTGCATCTGTTTATGCTTGGAACAGGAAGAGAATCAGCAACTGTGTTGCTGATTATTCTGTCCTATATAATTCCGCATCATTTTCCACTTTTAAGTGTTATGGAGTGTCTCCTACTAAATTAAATGATCTCTGCTTTACTAATGTCTATGCAGATTCATTTGTAATTAGAGGTGATGAAGTCAGACAAATCGCTCCAGGGCAAACTGGAAAGATTGCTGATTATAATTATAAATTACCAGATGATTTTACAGGCTGCGTTATAGCTTGGAATTCTAACAATCTTGATTCTAAGGTTGGTGGTAATTATAATTACCTGTATAGATTGTTTAGGAAGTCTAATCTCAAACCTTTTGAGAGAGATATTTCAACTGAAATCTATCAGGCCGGTAGCACACCTTGTAATGGTGTTGAAGGTTTTAATTGTTACTTTCCTTTACAATCATATGGTTTCCAACCCACTAATGGTGTTGGTTACCAACCATACAGAGTAGTAGTACTTTCTTTTGAACTTCTACATGCACCAGCAACTGTTTGTGGACCTAAAAAGTCTACTAATTTGGTTAAAAACAAATGTGTCAATTTCAACTTCAATGGTTTAACAGGCACAGGTGTTCTTACTGAGTCTAACAAAAAGTTTCTGCCTTTCCAACAATTTGGCAGAGACATTGCTGACACTACTGATGCTGTCCGTGATCCACAGACACTTGAGATTCTTGACATTACACCATGTTCTTTTGGTGGTGTCAGTGTTATAACACCAGGAACAAATACTTCTAACCAGGTTGCTGTTCTTTATCAGGGGTGTTAA";
      id = "6VXX";
    } else if (type === "insulin") {
      seq =
        "ATGGCCCTGTGGATGCGCCTCCTGCCCCTGCTGGCGCTGCTGGCCCTCTGGGGACCTGACCCAGCCGCAGCCTTTGTGAACCAACACCTGTGCGGCTCACACCTGGTGGAAGCTCTCTACCTAGTGTGCGGGGAACGAGGCTTCTTCTACACACCCAAGACCCGCCGGGAGGCAGAGGACCTGCAGGTGGGGCAGGTGGAGCTGGGCGGGGGCCCTGGTGCAGGCAGCCTGCAGCCCTTGGCCCTGGAGGGGTCCCTGCAGAAGCGTGGCATTGTGGAACAATGCTGTACCAGCATCTGCTCCCTCTACCAGCTGGAGAACTACTGCAACTAG";
      id = "4INS";
    }

    setState((prev) => ({ ...prev, sequence: seq, pdbId: id }));
    logActivitySQL("bio", `Voorbeeld geladen: ${type}`, 10);
  };

  const handleBaseMutation = (newBase: string) => {
    if (state.selectedIndex === null) return;

    const codonStart = Math.floor(state.selectedIndex / 3) * 3;
    const oldCodon = state.sequence.substring(codonStart, codonStart + 3);
    const oldAA = CODON_TABLE[transcribeDNAtoRNA(oldCodon)] || "?";

    const newSeq =
      state.sequence.substring(0, state.selectedIndex) +
      newBase +
      state.sequence.substring(state.selectedIndex + 1);
    const newCodon = newSeq.substring(codonStart, codonStart + 3);
    const newAA = CODON_TABLE[transcribeDNAtoRNA(newCodon)] || "?";

    let mutationType = "";
    if (oldAA === newAA) mutationType = "Silent (Stil)";
    else if (newAA === "STOP") mutationType = "Nonsense (STOP)";
    else mutationType = `Missense (${oldAA} -> ${newAA})`;

    let unifiedType: "Silent" | "Missense" | "Nonsense" = "Missense";
    if (mutationType.includes("Silent")) unifiedType = "Silent";
    if (mutationType.includes("Nonsense")) unifiedType = "Nonsense";

    registerMutationAttempt(unifiedType, state.missionTarget, state.viewMode);

    const feedbackIcon =
      state.missionTarget && unifiedType === state.missionTarget ? "✅" : "";
    const msg = `Mutatie op pos ${state.selectedIndex + 1}: ${oldCodon} -> ${newCodon} | ${mutationType} ${feedbackIcon}`;
    logActivitySQL("bio", msg, 10);

    if (state.missionTarget && unifiedType === state.missionTarget) {
      logActivitySQL(
        "bio",
        `Missie Voltooid: Maak een ${state.missionTarget} mutatie!`,
        50,
      );
      setState((prev) => ({
        ...prev,
        sequence: newSeq,
        mutatedIndex: state.selectedIndex,
        missionTarget: null,
      }));
    } else {
      setState((prev) => ({
        ...prev,
        sequence: newSeq,
        mutatedIndex: state.selectedIndex,
      }));
    }

    setTimeout(
      () => setState((prev) => ({ ...prev, mutatedIndex: null })),
      2000,
    );
  };

  const loadPdb = (id: string) => {
    const upperId = id.toUpperCase();
    setState((prev) => ({ ...prev, pdbId: upperId, viewMode: "pdb" }));
  };

  return (
    <div className="h-full flex flex-col p-4 space-y-4 overflow-y-auto custom-scrollbar">
      {/* Missions */}
      <div className="bg-white/5 p-4 rounded-xl border border-white/5">
        <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
          <Target size={14} className="text-amber-400" />{" "}
          {t("biology.genomics.sidebar.mastery_missions")}
        </h3>
        {state.missionTarget ? (
          <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/50 p-3 rounded-lg flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Trophy className="text-amber-400 animate-pulse" size={16} />
              <span className="text-white font-bold text-xs">
                {t("biology.genomics.sidebar.active_mission_prompt", {
                  target: state.missionTarget,
                })}
              </span>
            </div>
            <button
              onClick={() => setState((p) => ({ ...p, missionTarget: null }))}
              className="text-[10px] text-amber-300 underline self-start"
            >
              {t("biology.genomics.sidebar.cancel")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() =>
                setState((p) => ({ ...p, missionTarget: "Silent" }))
              }
              className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/10 rounded-lg text-xs font-bold text-slate-400 hover:text-emerald-400 transition-all text-left"
            >
              <Award size={14} /> {t("biology.genomics.sidebar.mission_silent")}
            </button>
            <button
              onClick={() =>
                setState((p) => ({ ...p, missionTarget: "Missense" }))
              }
              className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 hover:border-blue-500/50 hover:bg-blue-500/10 rounded-lg text-xs font-bold text-slate-400 hover:text-blue-400 transition-all text-left"
            >
              <Award size={14} />{" "}
              {t("biology.genomics.sidebar.mission_missense")}
            </button>
            <button
              onClick={() =>
                setState((p) => ({ ...p, missionTarget: "Nonsense" }))
              }
              className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 rounded-lg text-xs font-bold text-slate-400 hover:text-red-400 transition-all text-left"
            >
              <Award size={14} />{" "}
              {t("biology.genomics.sidebar.mission_nonsense")}
            </button>
          </div>
        )}
      </div>

      {/* Sequence Editor */}
      <div className="bg-white/5 p-4 rounded-xl border border-white/5">
        <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
          <FileCode size={14} className="text-electric" />{" "}
          {t("biology.genomics.sidebar.dna_editor")}
        </h3>
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => loadExample("covid")}
            className="flex-1 text-[10px] bg-red-500/20 hover:bg-red-500/30 text-red-200 px-2 py-1 rounded border border-red-500/30 transition-colors"
          >
            {t("biology.genomics.sidebar.example_covid")}
          </button>
          <button
            onClick={() => loadExample("insulin")}
            className="flex-1 text-[10px] bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 px-2 py-1 rounded border border-blue-500/30 transition-colors"
          >
            {t("biology.genomics.sidebar.example_insulin")}
          </button>
        </div>
        <textarea
          value={state.sequence}
          onChange={handleImportFasta}
          rows={6}
          className="w-full bg-black/60 border border-white/10 rounded-xl p-3 font-mono text-cyan-400 text-xs focus:border-electric transition-all outline-none mb-4 resize-none"
          placeholder=">sequence_1&#10;ATGCG..."
        />
      </div>

      {/* Mutation Controls */}
      <div className="bg-white/5 p-4 rounded-xl border border-white/5">
        <div className="flex justify-between items-center mb-2">
          <label className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-2">
            <Fingerprint size={12} />
            {t("biology.genomics.sidebar.base_selection")}:{" "}
            {state.selectedIndex !== null ? `#${state.selectedIndex + 1}` : "-"}
          </label>
          {state.selectedIndex !== null && (
            <span className="text-xs font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded">
              {state.sequence[state.selectedIndex]}
            </span>
          )}
        </div>

        {state.selectedIndex !== null ? (
          <div className="grid grid-cols-4 gap-2">
            {["A", "T", "C", "G"].map((base) => (
              <button
                key={base}
                onClick={() => handleBaseMutation(base)}
                disabled={state.sequence[state.selectedIndex!] === base}
                className={`py-2 rounded font-bold text-xs transition-colors ${
                  state.sequence[state.selectedIndex!] === base
                    ? "bg-white/5 text-slate-600 cursor-not-allowed"
                    : "bg-electric/20 hover:bg-electric text-white shadow-lg shadow-electric/20"
                }`}
              >
                {base}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 border-2 border-dashed border-white/10 rounded-lg">
            <p className="text-[10px] text-slate-500">
              {t("biology.genomics.sidebar.no_base_selected")}
            </p>
          </div>
        )}
      </div>

      {/* PDB Loader */}
      <div className="bg-white/5 p-4 rounded-xl border border-white/5">
        <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
          <Microscope size={14} className="text-purple-400" />{" "}
          {t("biology.genomics.sidebar.protein_db")}
        </h3>
        <div className="flex mb-2">
          <input
            type="text"
            value={state.pdbId}
            onChange={(e) =>
              setState((p) => ({ ...p, pdbId: e.target.value.toUpperCase() }))
            }
            className="flex-1 bg-black/50 border border-white/10 border-r-0 rounded-l-lg px-3 py-2 text-white font-mono text-xs focus:border-purple-500 transition-colors outline-none"
          />
          <button
            onClick={() => loadPdb(state.pdbId)}
            className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-r-lg font-bold text-xs transition-colors uppercase"
          >
            <Search size={14} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {["1CRN", "4HHB", "6VXX", "1BNA"].map((id) => (
            <button
              key={id}
              onClick={() => loadPdb(id)}
              className="text-[10px] bg-white/5 hover:bg-white/10 border border-white/5 p-1 rounded text-slate-400 uppercase font-mono"
            >
              {id === "1BNA"
                ? "DNA"
                : id === "4HHB"
                  ? "Hemo"
                  : id === "6VXX"
                    ? "Spike"
                    : id}
            </button>
          ))}
        </div>
      </div>

      {/* View Mode */}
      <div className="bg-white/5 p-4 rounded-xl border border-white/5">
        <label className="text-[10px] text-slate-500 uppercase font-bold mb-2 block">
          {t("biology.genomics.sidebar.viewer_mode")}:
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setState((p) => ({ ...p, viewMode: "procedural" }));
              logActivitySQL("bio", "Viewer: Real-time Helix", 5);
            }}
            className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${state.viewMode === "procedural" ? "border-cyan-500 bg-cyan-500/10 text-white" : "border-white/5 bg-white/5 text-slate-500"}`}
          >
            <Cpu size={14} />
            <span className="text-[8px] font-bold uppercase">
              {t("biology.genomics.sidebar.real_time")}
            </span>
          </button>
          <button
            onClick={() => {
              setState((p) => ({ ...p, viewMode: "pdb" }));
              logActivitySQL("bio", "Viewer: PDB", 5);
            }}
            className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${state.viewMode === "pdb" ? "border-purple-500 bg-purple-500/10 text-white" : "border-white/5 bg-white/5 text-slate-500"}`}
          >
            <Database size={14} />
            <span className="text-[8px] font-bold uppercase">
              {t("biology.genomics.sidebar.pdb")}
            </span>
          </button>
        </div>
      </div>

      {/* Replication Mode Toggle */}
      <div className="bg-white/5 p-4 rounded-xl border border-white/5">
        <button
          onClick={() =>
            setState((p) => ({ ...p, replicationMode: !p.replicationMode }))
          }
          className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${state.replicationMode ? "bg-amber-500/20 border-amber-500/50 text-amber-400" : "bg-white/5 border-white/10 text-slate-500 hover:bg-white/10"}`}
        >
          <div className="flex items-center gap-3">
            <Zap
              size={16}
              className={state.replicationMode ? "animate-pulse" : ""}
            />
            <span className="text-xs font-black uppercase tracking-widest">
              {t("biology.genomics.sidebar.replication_mode")}
            </span>
          </div>
          <div
            className={`w-8 h-4 rounded-full relative transition-colors ${state.replicationMode ? "bg-amber-500" : "bg-slate-700"}`}
          >
            <div
              className={`absolute top-1 w-2 h-2 rounded-full bg-white transition-all ${state.replicationMode ? "right-1" : "left-1"}`}
            />
          </div>
        </button>
      </div>

      {/* Lab Tools */}
      <div className="bg-white/5 p-4 rounded-xl border border-white/5">
        <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
          <Box size={14} className="text-blue-400" />{" "}
          {t("biology.genomics.sidebar.lab_tools")}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setState((p) => ({ ...p, activeTool: "gel" }))}
            className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${state.activeTool === "gel" ? "border-cyan-500 bg-cyan-500/10 text-white" : "border-white/5 bg-white/5 text-slate-500 hover:text-slate-300"}`}
          >
            <Activity size={16} />
            <span className="text-[10px] font-bold uppercase">
              {t("biology.genomics.sidebar.tool_gel")}
            </span>
          </button>
          <button
            onClick={() => setState((p) => ({ ...p, activeTool: "pcr" }))}
            className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${state.activeTool === "pcr" ? "border-orange-500 bg-orange-500/10 text-white" : "border-white/5 bg-white/5 text-slate-500 hover:text-slate-300"}`}
          >
            <Zap size={16} />
            <span className="text-[10px] font-bold uppercase">
              {t("biology.genomics.sidebar.tool_pcr")}
            </span>
          </button>
          <button
            onClick={() => setState((p) => ({ ...p, activeTool: "crispr" }))}
            className={`col-span-2 flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${state.activeTool === "crispr" ? "border-purple-500 bg-purple-500/10 text-white" : "border-white/5 bg-white/5 text-slate-500 hover:text-slate-300"}`}
          >
            <Scissors size={16} />
            <span className="text-[10px] font-bold uppercase">
              {t("biology.genomics.sidebar.tool_crispr")}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
