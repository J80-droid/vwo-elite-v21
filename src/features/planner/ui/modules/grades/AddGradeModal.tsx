import { addManualGradeSQL } from "@shared/api/sqliteService";
import { INITIAL_SUBJECTS } from "@shared/assets/data/initialSubjects";
import { useTranslations } from "@shared/hooks/useTranslations";
import { CustomCombobox } from "@shared/ui/Combobox";
import { CustomSelect } from "@shared/ui/Select";
import { AnimatePresence, motion } from "framer-motion";
import { Calculator, Calendar, TrendingUp, X } from "lucide-react";
import React, { useState } from "react";

interface AddGradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddGradeModal: React.FC<AddGradeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  useTranslations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newGrade, setNewGrade] = useState({
    subject: "",
    grade: "",
    weight: "1",
    description: "",
    period: "1",
    date: new Date().toISOString().split("T")[0] || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Sanitize inputs: remove anything that isn't a number, dot, or comma
    const cleanGrade = newGrade.grade
      .replace(/[^0-9,.]/g, "")
      .replace(",", ".");
    const cleanWeight = newGrade.weight
      .replace(/[^0-9,.]/g, "")
      .replace(",", ".");

    const grade = parseFloat(cleanGrade);
    const weight = parseFloat(cleanWeight);

    if (!newGrade.subject || isNaN(grade) || isNaN(weight)) return;

    setIsSubmitting(true);
    try {
      await addManualGradeSQL({
        subject: newGrade.subject,
        grade,
        weight,
        description: newGrade.description || "Handmatige invoer",
        period: parseInt(newGrade.period),
        date: newGrade.date,
      });
      onSuccess();
      onClose();
      // Reset form
      setNewGrade({
        subject: "",
        grade: "",
        weight: "1",
        description: "",
        period: "1",
        date: new Date().toISOString().split("T")[0] || "",
      });
    } catch (error) {
      console.error("Failed to add grade:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-obsidian-900/95 border border-white/10 rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-3xl overflow-hidden neon-frame-indigo"
          >
            {/* Pulsing Neon Border (Inline fallback since index.css edit failed) */}
            <div className="absolute -inset-[1px] rounded-[2.5rem] border border-indigo-500/30 animate-pulse pointer-events-none" />

            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/15 blur-[100px] -z-10 rounded-full -mr-24 -mt-24" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/15 blur-[100px] -z-10 rounded-full -ml-24 -mb-24" />

            {/* Header */}
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)] pulse-slow">
                  <Calculator className="text-indigo-400" size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none italic">
                    RESULTAAT<span className="text-indigo-500">.</span>
                    VASTLEGGEN
                  </h3>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2">
                    Manual Performance Entry
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl flex items-center justify-center transition-all border border-white/5 group"
              >
                <X
                  size={20}
                  className="group-hover:rotate-90 transition-transform duration-300"
                />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-5">
                {/* Subject Input */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
                      ACADEMIC DISCIPLINE
                    </label>
                    <span className="text-[7px] font-black text-indigo-500/50 uppercase tracking-widest">
                      Required
                    </span>
                  </div>
                  <div className="relative group">
                    <CustomCombobox
                      options={INITIAL_SUBJECTS.map((s) => s.legacyName).filter(
                        (name): name is string => !!name,
                      )}
                      value={newGrade.subject}
                      onChange={(val) =>
                        setNewGrade({ ...newGrade, subject: val })
                      }
                      placeholder="Select Subject..."
                    />
                    <div className="absolute inset-0 rounded-2xl border border-indigo-500/0 group-focus-within:border-indigo-500/20 pointer-events-none transition-all duration-500" />
                  </div>
                </div>

                {/* Grade and Weight */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4 group/input">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] ml-1 group-focus-within/input:text-indigo-400 transition-colors">
                      SCORE
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500/50">
                        <TrendingUp size={18} />
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="10"
                        value={newGrade.grade}
                        onChange={(e) =>
                          setNewGrade({ ...newGrade, grade: e.target.value })
                        }
                        className="w-full bg-black/60 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white font-black text-xl focus:outline-none focus:border-indigo-500/30 focus:bg-black/80 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] group-hover/input:border-white/10"
                        placeholder="0.0"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-4 group/input">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] ml-1 group-focus-within/input:text-indigo-400 transition-colors">
                      COEFFICIENT
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500/50">
                        <Calculator size={18} />
                      </div>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={newGrade.weight}
                        onChange={(e) =>
                          setNewGrade({ ...newGrade, weight: e.target.value })
                        }
                        className="w-full bg-black/60 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white font-black text-xl focus:outline-none focus:border-indigo-500/30 focus:bg-black/80 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] group-hover/input:border-white/10"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 group/input">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] ml-1 group-focus-within/input:text-indigo-400 transition-colors">
                    METADATA
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={newGrade.description}
                      onChange={(e) =>
                        setNewGrade({
                          ...newGrade,
                          description: e.target.value,
                        })
                      }
                      className="w-full bg-black/60 border border-white/5 rounded-2xl py-4 px-6 text-white font-black text-sm focus:outline-none focus:border-indigo-500/30 focus:bg-black/80 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] group-hover/input:border-white/10"
                      placeholder="Assignment Title..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4 group/input">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] ml-1 group-focus-within/input:text-indigo-400 transition-colors">
                      CHRONOLOGY
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500/50">
                        <Calendar size={18} />
                      </div>
                      <input
                        type="date"
                        value={newGrade.date}
                        onChange={(e) =>
                          setNewGrade({ ...newGrade, date: e.target.value })
                        }
                        className="w-full bg-black/60 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white font-black text-sm focus:outline-none focus:border-indigo-500/30 focus:bg-black/80 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] group-hover/input:border-white/10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-4 group/input">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] ml-1 group-focus-within/input:text-indigo-400 transition-colors">
                      CYCLE
                    </label>
                    <div className="relative">
                      <CustomSelect
                        options={["1", "2", "3", "4"]}
                        value={newGrade.period}
                        onChange={(val) =>
                          setNewGrade({ ...newGrade, period: val })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="relative w-full py-5 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.4em] text-indigo-400 border border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 hover:border-indigo-500/60 hover:text-white hover:shadow-[0_0_30px_rgba(99,102,241,0.25)] transition-all duration-500 active:scale-[0.98] mt-6 overflow-hidden group"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                  initial={false}
                />
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="w-3 h-3 border-2 border-indigo-500/50 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  "Committer Resultaat"
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
