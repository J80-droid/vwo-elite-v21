import { Check, Library, Search } from "lucide-react";
import React, { useMemo, useState } from "react";

import { StudyMaterial } from "../types";

interface LibraryPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (materials: StudyMaterial[]) => void;
  materials: StudyMaterial[];
}

const SUBJECT_THEMES: Record<
  string,
  { base: string; glow: string; text: string }
> = {
  "Wiskunde B": {
    base: "blue-500",
    glow: "rgba(59,130,246,0.5)",
    text: "blue-400",
  },
  Natuurkunde: {
    base: "emerald-500",
    glow: "rgba(16,185,129,0.5)",
    text: "emerald-400",
  },
  Scheikunde: {
    base: "fuchsia-500",
    glow: "rgba(217,70,239,0.5)",
    text: "fuchsia-400",
  },
  Frans: { base: "rose-500", glow: "rgba(244,63,94,0.5)", text: "rose-400" },
  Engels: { base: "sky-500", glow: "rgba(14,165,233,0.5)", text: "sky-400" },
  Nederlands: {
    base: "orange-500",
    glow: "rgba(249,115,22,0.5)",
    text: "orange-400",
  },
  Filosofie: {
    base: "violet-500",
    glow: "rgba(139,92,246,0.5)",
    text: "violet-400",
  },
};

const DEFAULT_THEME = {
  base: "indigo-500",
  glow: "rgba(99,102,241,0.5)",
  text: "indigo-400",
};

export const LibraryPickerModal: React.FC<LibraryPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  materials,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  // Extract unique subjects
  const subjects = useMemo(() => {
    const uniqueSubjects = [
      ...new Set((materials || []).map((m) => m && m.subject).filter(Boolean)),
    ] as string[];
    return uniqueSubjects.sort();
  }, [materials]);

  // Filter materials
  const filteredMaterials = useMemo(() => {
    let result = (materials || []).filter((m) => m);
    if (selectedSubject) {
      result = result.filter((m) => m.subject === selectedSubject);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          (m.name || "").toLowerCase().includes(query) ||
          (m.content || "").toLowerCase().includes(query),
      );
    }
    return result;
  }, [materials, selectedSubject, searchQuery]);

  const toggleMaterial = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const selected = (materials || []).filter(
      (m) => m && selectedIds.has(m.id),
    );
    onSelect(selected);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#050914]/90 border border-white/10 rounded-[2.5rem] p-10 max-w-4xl w-full max-h-[85vh] flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300 backdrop-blur-3xl overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between mb-8 relative">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
              <Library size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                Kies{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-500">
                  Bronmateriaal
                </span>
              </h2>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                Bibliotheek Archief
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 rounded-xl hover:bg-white/5 text-slate-500 hover:text-white transition-all border border-transparent hover:border-white/10"
          >
            <span className="text-xl">✕</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-8 group">
          <Search
            className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 transition-colors group-focus-within:text-indigo-400"
            size={20}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Zoeken in je archief..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-5 text-lg text-white outline-none focus:border-indigo-500/40 transition-all placeholder:text-slate-700 shadow-inner group-hover:bg-white/[0.07]"
          />
        </div>

        {/* Subject Tabs */}
        {subjects.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8 items-center">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">
              Filter op vak:
            </div>
            <button
              onClick={() => setSelectedSubject(null)}
              className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-500 border ${
                selectedSubject === null
                  ? "bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                  : "bg-white/5 border-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-300"
              }`}
            >
              Alle Materialen
            </button>
            {subjects.map((subject) => {
              const theme = SUBJECT_THEMES[subject] || DEFAULT_THEME;
              const isActive = selectedSubject === subject;
              return (
                <button
                  key={subject}
                  onClick={() => setSelectedSubject(subject)}
                  className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-500 border ${
                    isActive
                      ? `bg-${theme.base}/20 border-${theme.base} text-${theme.text} shadow-[0_0_20px_${theme.glow}]`
                      : "bg-white/5 border-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-300"
                  }`}
                >
                  {subject}
                </button>
              );
            })}
          </div>
        )}

        {/* Materials Grid */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-3 py-2">
          {filteredMaterials.map((mat) => {
            const theme = SUBJECT_THEMES[mat.subject] || DEFAULT_THEME;
            const isSelected = selectedIds.has(mat.id);

            return (
              <button
                key={mat.id}
                onClick={() => toggleMaterial(mat.id)}
                className={`w-full p-6 rounded-[2rem] border-2 text-left transition-all duration-700 flex items-start gap-6 group/card relative overflow-hidden ${
                  isSelected
                    ? `border-${theme.base} bg-${theme.base}/10 shadow-[0_0_40px_${theme.glow.replace("0.5", "0.1")}]`
                    : "border-white/5 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/10"
                }`}
              >
                {isSelected && (
                  <div
                    className={`absolute top-0 right-0 w-32 h-32 bg-${theme.base}/5 blur-[60px] pointer-events-none`}
                  />
                )}

                <div
                  className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center shrink-0 mt-1 transition-all duration-500 ${
                    isSelected
                      ? `bg-${theme.base} border-${theme.base} shadow-[0_0_15px_${theme.glow}]`
                      : "border-white/10 group-hover/card:border-white/20"
                  }`}
                >
                  {isSelected && (
                    <Check size={18} className="text-white" strokeWidth={3} />
                  )}
                </div>

                <div className="flex-1 min-w-0 relative">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md ${isSelected ? `bg-${theme.base}/20 text-${theme.text}` : "bg-white/5 text-slate-500"}`}
                    >
                      {mat.subject}
                    </span>
                    <div className="w-1 h-1 rounded-full bg-slate-700" />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                      {new Date(mat.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-black text-white text-xl mb-2 tracking-tight">
                    {mat.name}
                  </h4>
                  <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed font-light">
                    {mat.content}
                  </p>
                </div>
              </button>
            );
          })}
          {filteredMaterials.length === 0 && (
            <div className="text-center py-20 flex flex-col items-center gap-4 opacity-40">
              <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center text-slate-500 border border-white/10">
                <Search size={32} />
              </div>
              <div className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">
                Geen documenten gevonden
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-10 pt-8 border-t border-white/5 relative">
          <div className="flex flex-col">
            <span className="text-xs font-black text-white uppercase tracking-widest">
              {selectedIds.size} Items{" "}
              <span className="text-slate-500">Geselecteerd</span>
            </span>
            <div className="flex gap-1 mt-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-500 ${i < selectedIds.size ? "w-4 bg-indigo-500" : "w-1 bg-white/5"}`}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-6">
            <button
              onClick={onClose}
              className="px-8 py-4 text-slate-500 hover:text-white font-black transition-all uppercase text-[11px] tracking-[0.2em] hover:bg-white/5 rounded-2xl border border-transparent hover:border-white/10"
            >
              Annuleren
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedIds.size === 0}
              className={`group relative px-12 py-4 font-black rounded-2xl transition-all duration-500 uppercase text-[11px] tracking-[0.2em] overflow-hidden ${
                selectedIds.size > 0
                  ? "bg-indigo-500/20 border border-indigo-500 text-indigo-300 shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:shadow-[0_0_50px_rgba(99,102,241,0.6)] hover:bg-indigo-500/30 active:scale-95"
                  : "bg-white/5 border border-white/5 text-slate-600 cursor-not-allowed opacity-50"
              }`}
            >
              <div className="relative z-10">Bevestig Selectie</div>
              {selectedIds.size > 0 && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
