/* eslint-disable react-hooks/set-state-in-effect */
import { useTranslations } from "@shared/hooks/useTranslations";
import { AnimatePresence, motion } from "framer-motion";
import { Save, Star, Target, X } from "lucide-react";
import React, { useEffect, useState } from "react";

interface GradeInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (grade: number) => void;
  initialValue?: number;
  title: string;
  type: "achieved" | "target";
}

export const GradeInputModal: React.FC<GradeInputModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialValue,
  title,
  type,
}) => {
  const { t } = useTranslations();
  const [value, setValue] = useState(initialValue?.toString() || "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue?.toString() || "");
      setError(null);
    }
  }, [isOpen, initialValue]);

  const handleSave = () => {
    const grade = parseFloat(value.replace(",", "."));
    if (isNaN(grade) || grade < 1 || grade > 10) {
      setError(t("planner:common.error"));
      return;
    }
    onSave(grade);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 pb-24 md:pb-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-[#0a0a0b] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-indigo-500/10"
          >
            {/* Header */}
            <div className="p-8 pb-4 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    type === "achieved"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-indigo-500/10 text-indigo-400"
                  }`}
                >
                  {type === "achieved" ? (
                    <Star size={24} />
                  ) : (
                    <Target size={24} />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">
                    {title}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    {type === "achieved"
                      ? t("planner:exams.entered_grade")
                      : t("planner:exams.target")}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-3 hover:bg-white/5 rounded-2xl text-slate-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-8 space-y-8">
              <div className="flex flex-col items-center gap-4">
                <div className="relative group w-full max-w-[200px]">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={value}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || /^[0-9.,]*$/.test(val)) {
                        setValue(val);
                        setError(null);
                      }
                    }}
                    placeholder="1.0 - 10.0"
                    className={`w-full bg-white/5 border-2 ${error ? "border-rose-500/50" : "border-white/10 focus:border-indigo-500/50"} rounded-3xl px-6 py-8 text-center text-5xl font-black text-white focus:outline-none transition-all placeholder:text-slate-800`}
                    autoFocus
                  />
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute -bottom-6 left-0 right-0 text-center"
                    >
                      <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">
                        {error}
                      </span>
                    </motion.div>
                  )}
                </div>
                <p className="text-xs text-slate-500 text-center max-w-[200px]">
                  Voer een getal in tussen 1.0 en 10.0 (gebruik een punt of
                  komma).
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={onClose}
                  className="py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-white/5 transition-colors"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleSave}
                  className={`py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl ${
                    type === "achieved"
                      ? "bg-emerald-500 text-black shadow-emerald-500/20 hover:bg-emerald-400"
                      : "bg-indigo-500 text-white shadow-indigo-500/20 hover:bg-indigo-400"
                  }`}
                >
                  <Save size={16} />
                  Opslaan
                </button>
              </div>
            </div>

            {/* Background Decoration */}
            <div
              className={`absolute -bottom-24 -right-24 w-64 h-64 blur-[100px] pointer-events-none rounded-full ${
                type === "achieved" ? "bg-emerald-500/10" : "bg-indigo-500/10"
              }`}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
