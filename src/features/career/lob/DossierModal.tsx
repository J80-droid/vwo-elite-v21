import { VALUES_LIST } from "@shared/assets/data/valuesData";
import { AnimatePresence, motion } from "framer-motion";
import { Award, Briefcase, FileText, X } from "lucide-react";
import React from "react";

import { RIASECScores, ValuesScores } from "./LOBContext";

interface DossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  bigFiveTopTrait: string;
  riasecScores: RIASECScores | null;
  valuesScores: ValuesScores | null;
}

export const DossierModal: React.FC<DossierModalProps> = ({
  isOpen,
  onClose,
  bigFiveTopTrait,
  riasecScores,
  valuesScores,
}) => {
  // const { t } = useTranslation('career');

  // Calculate Top 3 RIASEC
  const topRiasec = riasecScores
    ? Object.entries(riasecScores)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
    : [];
  const riasecCode = topRiasec.map(([k]) => k.charAt(0).toUpperCase()).join("");

  // Calculate Top 3 Values
  const topValues = valuesScores
    ? Object.entries(valuesScores)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([id]) => VALUES_LIST.find((v) => v.id === id)?.label || id)
    : [];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-[#0a0a0a] border border-white/10 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-8 border-b border-white/10 flex justify-between items-start bg-gradient-to-r from-purple-900/20 to-blue-900/20">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <FileText className="text-purple-400" size={28} />
                <h2 className="text-3xl font-black text-white uppercase tracking-tight">
                  Carrière Dossier
                </h2>
              </div>
              <p className="text-slate-400">
                Jouw unieke profiel samengevat. Gebruik dit voor je studiekeuze.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content Grid */}
          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Personality */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Award size={16} /> Persoonlijkheid
              </h3>
              <div className="p-6 bg-white/5 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-purple-500/30 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 blur-2xl rounded-full -mr-10 -mt-10" />
                <div className="text-4xl font-black text-white mb-2 capitalize">
                  {bigFiveTopTrait || "Onbekend"}
                </div>
                <div className="text-purple-400 text-sm font-bold">
                  Dominant Big Five Kenmerk
                </div>
              </div>
              <div className="text-xs text-slate-400 leading-relaxed">
                Dit kenmerk zegt veel over hoe jij werkt en met anderen omgaat.
              </div>
            </div>

            {/* Interests */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Briefcase size={16} /> Interesses (RIASEC)
              </h3>
              <div className="p-6 bg-white/5 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-blue-500/30 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-2xl rounded-full -mr-10 -mt-10" />
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                    {riasecCode || "???"}
                  </span>
                </div>
                <div className="space-y-1">
                  {topRiasec.map(([k, v], i) => (
                    <div key={k} className="flex justify-between text-xs">
                      <span className="capitalize text-slate-300">
                        {i + 1}. {k}
                      </span>
                      <span className="text-blue-400 font-mono">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Values */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Award size={16} /> Kernwaarden
              </h3>
              <div className="p-6 bg-white/5 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-2xl rounded-full -mr-10 -mt-10" />
                {topValues.length > 0 ? (
                  <div className="space-y-3">
                    {topValues.map((val, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
                          {i + 1}
                        </div>
                        <span className="text-white font-medium">{val}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-500 italic">
                    Nog geen waarden gekozen.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer / Actions */}
          <div className="p-8 border-t border-white/10 bg-white/5 flex justify-end gap-4">
            <button
              onClick={() => window.print()} // Simple print for now
              className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold transition-all flex items-center gap-2"
            >
              <FileText size={18} /> Print Dossier
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold transition-all shadow-lg shadow-blue-900/50"
            >
              Sluiten
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
