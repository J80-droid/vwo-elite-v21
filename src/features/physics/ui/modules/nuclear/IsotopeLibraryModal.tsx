import Fuse from "fuse.js";
import { Book, FolderOpen, Plus, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom"; // Toevoeging 1: Importeer createPortal

import { Isotope } from "./isotopes";
import { useNuclearEngine } from "./useNuclearEngine";

interface IsotopeLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IsotopeLibraryModal: React.FC<IsotopeLibraryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { state, setParam } = useNuclearEngine();
  const [search, setSearch] = React.useState("");
  const [sortBy, setSortBy] = React.useState<"name" | "mass" | "halfLife">(
    "name",
  );

  // Toevoeging 2: Hydration check voor Next.js/SSR
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    // Optioneel: Voorkom scrollen op de achtergrond als modal open is
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const customIsotopes = state.customIsotopes || [];

  // Fuzzy Search Logic
  let filteredIsotopes = customIsotopes;
  if (search.trim()) {
    const fuse = new Fuse(customIsotopes, {
      keys: ["name", "symbol", "mass"],
      threshold: 0.4,
      ignoreLocation: true,
    });
    filteredIsotopes = fuse.search(search).map((result) => result.item);
  }

  // Sort Logic
  const sortedIsotopes = [...filteredIsotopes].sort((a, b) => {
    if (sortBy === "mass") return a.mass - b.mass;
    if (sortBy === "halfLife") return a.halfLife - b.halfLife;
    return a.name.localeCompare(b.name);
  });

  const selectIsotope = (id: string) => {
    setParam("isotopeId", id);
    onClose();
  };

  // Toevoeging 3: Definieer de content in een variabele
  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Klik buiten de modal om te sluiten (optioneel, maar goede UX) */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-[500px] shadow-2xl p-6 relative overflow-hidden flex flex-col max-h-[80vh] z-10">
        {/* Background Glow */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        <div className="flex justify-between items-center mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
              <Book className="text-indigo-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Isotopen Bibliotheek
              </h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Beheer uw eigen isotopen
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Controls */}
        <div className="flex gap-3 mb-4 z-10">
          <input
            type="text"
            placeholder="Zoek op naam of symbool..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
            autoFocus
          />
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "name" | "mass" | "halfLife")
            }
            className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-slate-400 outline-none focus:border-indigo-500/50 cursor-pointer appearance-none"
          >
            <option value="name">Naam (A-Z)</option>
            <option value="mass">Massa</option>
            <option value="halfLife">Halveringstijd</option>
          </select>
        </div>

        <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar relative z-10 flex-1 pr-1">
          {sortedIsotopes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 opacity-40">
              <FolderOpen
                size={48}
                className="text-slate-500 mb-2"
                strokeWidth={1.5}
              />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center">
                {search ? "Geen resultaten" : "Bibliotheek is leeg"}
              </span>
            </div>
          ) : (
            sortedIsotopes.map((iso: Isotope) => (
              <div
                key={iso.id}
                onClick={() => selectIsotope(iso.id)}
                className="flex items-center gap-4 p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors group shrink-0 cursor-pointer"
              >
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center font-black text-sm border font-mono shadow-lg ${
                    iso.decayMode === "alpha"
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                      : iso.decayMode.startsWith("beta")
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                        : "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                  }`}
                >
                  {iso.mass}
                </div>

                <div className="flex-1 flex flex-col">
                  <span className="text-sm font-bold text-white leading-tight">
                    {iso.name}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider bg-black/30 px-1.5 py-0.5 rounded">
                      {iso.symbol}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      T½ = {iso.halfLife}s
                    </span>
                  </div>
                </div>

                <button className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-500/30 hover:border-emerald-500/50 transition-all hover:scale-105 active:scale-95">
                  Laad
                </button>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center z-10">
          <span className="text-[10px] font-bold text-slate-500">
            {sortedIsotopes.length}{" "}
            {sortedIsotopes.length === 1 ? "Isotoop" : "Isotopen"}
          </span>
          <button
            onClick={() => {
              onClose();
              setParam("isBuilderOpen", true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-indigo-500/30 hover:border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)] hover:shadow-[0_0_20px_rgba(99,102,241,0.25)] transition-all hover:scale-105 active:scale-95"
          >
            <Plus size={14} />
            Nieuw Isotoop
          </button>
        </div>
      </div>
    </div>
  );

  // Toevoeging 4: Render via Portal naar document.body
  return createPortal(modalContent, document.body);
};
