import { useProactiveStore } from "@shared/model/proactiveStore";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Brain,
  Calculator,
  Sparkles,
  X,
} from "lucide-react";
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const AIStatusBar: React.FC = () => {
  const { suggestions, fetchSuggestions, dismissSuggestion, isLoading } =
    useProactiveStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Initial fetch
    fetchSuggestions();

    // Refresh every 5 minutes
    const interval = setInterval(fetchSuggestions, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchSuggestions]);

  const current = suggestions[0];
  if (!current || isLoading) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case "exam_prep":
        return <BookOpen size={18} className="text-electric" />;
      case "weak_point_focus":
        return <Brain size={18} className="text-magenta" />;
      case "practice_reminder":
        return <Calculator size={18} className="text-cyan" />;
      default:
        return <Sparkles size={18} className="text-gold" />;
    }
  };

  const handleAction = () => {
    if (current.action === "generate_prep") {
      navigate("/smart-review");
    } else if (current.action === "start_practice") {
      if (current.metadata?.subject) {
        navigate(`/lesson/${current.metadata.subject}`);
      } else {
        navigate("/smart-review");
      }
    }
    dismissSuggestion(current.id);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-2xl px-4"
      >
        <div className="glass border border-white/10 rounded-2xl p-4 shadow-2xl shadow-black/50 flex items-center justify-between gap-4 overflow-hidden relative group">
          {/* Background glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-electric/5 via-magenta/5 to-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

          <div className="flex items-center gap-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              {getIcon(current.type)}
            </div>

            <div className="min-w-0">
              <h4 className="text-white font-bold text-sm truncate">
                {current.title}
              </h4>
              <p className="text-slate-400 text-xs truncate max-w-md">
                {current.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 relative z-10">
            <button
              onClick={handleAction}
              className="bg-electric hover:bg-electric-light text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-electric/20 whitespace-nowrap"
            >
              {current.actionLabel}
              <ArrowRight size={14} />
            </button>

            <button
              onClick={() => dismissSuggestion(current.id)}
              className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
