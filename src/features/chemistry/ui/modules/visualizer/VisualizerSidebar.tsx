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
    <div className="space-y-4">
      <form onSubmit={(e) => handleSearch(e)} className="relative">
        <Search className="absolute left-3 top-3 text-slate-500" size={16} />
        <input
          value={state.query}
          onChange={(e) =>
            setState((prev: VisualizerState) => ({
              ...prev,
              query: e.target.value,
            }))
          }
          placeholder="Zoek molecuul..."
          className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-cyan-500 outline-none"
        />
      </form>

      <div className="space-y-2">
        <h4 className="text-xs font-bold text-slate-500 uppercase">Populair</h4>
        <div className="flex flex-wrap gap-2">
          {MOLECULES.slice(0, 6).map((m: Molecule) => (
            <button
              key={m.name}
              onClick={() => handleSearch(undefined, m.name)}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              {m.nameDutch}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
