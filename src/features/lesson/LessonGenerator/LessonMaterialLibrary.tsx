import { StudyMaterial } from "@shared/types/index";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, Image as ImageIcon, Search, Trash2 } from "lucide-react";
import React from "react";

import { ProgressBar } from "../ProgressBar";

interface LessonMaterialLibraryProps {
  lessonT: Record<string, string | undefined>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredMaterials: StudyMaterial[];
  selectedMaterials: Set<string>;
  toggleSelection: (id: string) => void;
  handleDeleteMaterial: (id: string) => void;
  loading: boolean;
  progress: number;
  progressStatus: string;
  handleGenerateLesson: () => void;
}

export const LessonMaterialLibrary: React.FC<LessonMaterialLibraryProps> = ({
  lessonT,
  searchQuery,
  setSearchQuery,
  filteredMaterials,
  selectedMaterials,
  toggleSelection,
  handleDeleteMaterial,
  loading,
  progress,
  progressStatus,
}) => {
  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf': return <FileText className="text-rose-400" size={18} />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'webp': return <ImageIcon className="text-emerald-400" size={18} />;
      default: return <FileText className="text-indigo-400" size={18} />;
    }
  };

  return (
    <div className="flex flex-col gap-10">
      {/* Search & Header */}
      <div className="flex items-center justify-between gap-4 px-1">
        <div className="flex flex-col gap-1">
          <h2 className="text-[10px] font-space font-extrabold text-white/40 uppercase tracking-[0.4em]">
            Procedural Access
          </h2>
          <p className="text-[8px] text-white/20 font-medium uppercase tracking-[0.1em]">
            {filteredMaterials.length} telemetrie streams gevonden
          </p>
        </div>

        <div className="relative flex-1 max-w-[200px] group/search">
          <Search size={12} className="absolute left-0 top-1/2 -translate-y-1/2 text-white/10 group-focus-within/search:text-indigo-400 transition-colors" />
          <input
            type="text"
            placeholder={lessonT.search || "Filter telemetry..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-b border-white/5 rounded-none pl-6 pr-4 py-2 text-[9px] text-white/60 outline-none focus:border-indigo-500/30 transition-all placeholder:text-white/10 font-bold uppercase tracking-widest"
          />
        </div>
      </div>

      {/* Material Grid: Minimal List */}
      <div className="flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {filteredMaterials.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 flex flex-col items-center justify-center border border-white/5 border-dashed rounded-[2rem]"
            >
              <p className="text-[7px] font-black uppercase tracking-[0.4em] text-white/10">
                {searchQuery ? "No matching data streams" : "Vault silent"}
              </p>
            </motion.div>
          ) : (
            filteredMaterials.map((mat) => (
              <motion.div
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                key={mat.id}
                onClick={() => toggleSelection(mat.id)}
                className={`group relative px-6 py-4 rounded-3xl cursor-pointer transition-all duration-500 border ${selectedMaterials.has(mat.id)
                  ? "bg-indigo-500/5 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                  : "bg-transparent border-white/5 hover:border-white/10"
                  }`}
              >
                <div className="flex items-center gap-6">
                  <div className={`transition-colors ${selectedMaterials.has(mat.id) ? 'text-indigo-400' : 'text-white/10'}`}>
                    {getIcon(mat.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-white/60 truncate text-[10px] font-black uppercase tracking-widest italic group-hover:text-white transition-colors">
                      {mat.name}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMaterial(mat.id);
                      }}
                      className="p-1 text-white/10 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>

                    {/* Minimal Indicator Line */}
                    <div className={`w-px h-4 transition-all duration-500 ${selectedMaterials.has(mat.id)
                      ? "bg-indigo-500 scale-y-150 shadow-[0_0_8px_indigo]"
                      : "bg-white/5 group-hover:bg-white/10"
                      }`} />
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {selectedMaterials.size > 0 && (
        <div className="mt-2">
          {loading && (
            <ProgressBar progress={progress} status={progressStatus} />
          )}
        </div>
      )}
    </div>
  );
};
