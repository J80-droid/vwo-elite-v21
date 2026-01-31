import { useModuleState } from "@features/chemistry/hooks/ChemistryLabContext";
import { MoleculeData, searchMolecule } from "@shared/api/chemService";
import { logActivitySQL } from "@shared/api/sqliteService";
import { Molecule, MOLECULES } from "@shared/assets/data/molecules";
import { Search } from "lucide-react";
import React from "react";

export interface VisualizerState {
  query: string;
  molecule: MoleculeData | null;
  analysis: string | null;
}

export const VisualizerSidebar: React.FC = () => {
  // Gebruik useModuleState voor lokale data
  const [state, setState] = useModuleState<VisualizerState>("visualizer", {
    query: "",
    molecule: null,
    analysis: null,
  });

  const handleSearch = async (e?: React.FormEvent, manualQuery?: string) => {
    if (e) e.preventDefault();
    const term = manualQuery || state.query;
    if (!term) return;

    // Reset huidig
    setState((prev: VisualizerState) => ({
      ...prev,
      molecule: null,
      query: term,
    }));

    const data = await searchMolecule(term);
    if (data) {
      setState((prev: VisualizerState) => ({ ...prev, molecule: data }));
      logActivitySQL("chem", `Molecuul bekeken: ${data.name}`, 10);
    } else {
      console.warn("Niet gevonden.");
    }
  };

  return (
    <div className="flex flex-row items-center gap-4">
      <form onSubmit={(e) => handleSearch(e)} className="relative w-48">
        <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
        <input
          value={state.query}
          onChange={(e) =>
            setState((prev: VisualizerState) => ({
              ...prev,
              query: e.target.value,
            }))
          }
          placeholder="Zoek molecuul..."
          className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:border-cyan-500 outline-none transition-all focus:bg-black/60"
        />
      </form>

      <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider px-2">Populair</span>
        <div className="flex gap-1">
          {MOLECULES.slice(0, 5).map((m: Molecule) => (
            <button
              key={m.name}
              onClick={() => handleSearch(undefined, m.name)}
              className="px-2.5 py-1 rounded-lg bg-black/20 border border-white/5 text-[10px] text-slate-400 hover:text-cyan-400 hover:bg-white/10 transition-all whitespace-nowrap"
            >
              {m.nameDutch}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
