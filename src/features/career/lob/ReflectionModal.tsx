import { Study } from "@shared/api/studyDatabaseService";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, Save, Tag, X } from "lucide-react";
import React, { useState } from "react";

interface ReflectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reflection: string, tags: string[]) => void;
  study: Study;
}

const REFLECTION_TAGS = [
  {
    id: "content",
    label: "Inhoud",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/50",
  },
  {
    id: "career",
    label: "Carrièreperspectief",
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50",
  },
  {
    id: "atmosphere",
    label: "Sfeer",
    color: "bg-amber-500/20 text-amber-400 border-amber-500/50",
  },
  {
    id: "city",
    label: "Stad",
    color: "bg-purple-500/20 text-purple-400 border-purple-500/50",
  },
  {
    id: "prestige",
    label: "Aanzien",
    color: "bg-rose-500/20 text-rose-400 border-rose-500/50",
  },
  {
    id: "social",
    label: "Sociaal",
    color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/50",
  },
];

export const ReflectionModal: React.FC<ReflectionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  study,
}) => {
  const [reflection, setReflection] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const toggleTag = (id: string) => {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  };

  const handleSave = () => {
    setIsSaving(true);
    onSave(reflection, selectedTags);
    // Small delay for UX
    setTimeout(() => {
      setIsSaving(false);
      setReflection("");
      setSelectedTags([]);
      onClose();
    }, 500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Waarom {study.name}?
                  </h3>
                  <p className="text-slate-400 text-sm">
                    Reflecteer op je keuze om het 'Elite' te maken.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Tags */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block flex items-center gap-2">
                    <Tag size={12} /> Wat spreekt je aan?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {REFLECTION_TAGS.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.label)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                          selectedTags.includes(tag.label)
                            ? tag.color
                            : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"
                        }`}
                      >
                        {tag.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text Area */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block flex items-center gap-2">
                    <MessageSquare size={12} /> Jouw onderbouwing
                  </label>
                  <textarea
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    placeholder="Ik vind deze studie interessant omdat..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 min-h-[120px] resize-none"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-slate-400 hover:text-white font-medium transition-colors"
                >
                  Overslaan
                </button>
                <button
                  onClick={handleSave}
                  disabled={selectedTags.length === 0 && reflection.length < 5}
                  className={`px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${
                    selectedTags.length > 0 || reflection.length >= 5
                      ? "bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20"
                      : "bg-white/10 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  <Save size={18} />
                  {isSaving ? "Opslaan..." : "Opslaan in Dossier"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
