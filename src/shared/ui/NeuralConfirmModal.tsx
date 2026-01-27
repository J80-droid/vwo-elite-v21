import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Check, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface NeuralConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
}

export const NeuralConfirmModal: React.FC<NeuralConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => {
      clearTimeout(timer);
      setMounted(false);
    };
  }, []);

  const getColors = () => {
    switch (variant) {
      case "danger":
        return {
          icon: "text-red-500",
          border: "border-red-500/20",
          glow: "shadow-[0_0_30px_rgba(239,68,68,0.1)]",
          button:
            "border-red-500/50 text-red-400 hover:bg-red-500/10 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]",
        };
      case "warning":
        return {
          icon: "text-amber-500",
          border: "border-amber-500/20",
          glow: "shadow-[0_0_30px_rgba(245,158,11,0.1)]",
          button:
            "border-amber-500/50 text-amber-400 hover:bg-amber-500/10 hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]",
        };
      default:
        return {
          icon: "text-blue-500",
          border: "border-blue-500/20",
          glow: "shadow-[0_0_30px_rgba(59,130,246,0.1)]",
          button:
            "border-blue-500/50 text-blue-400 hover:bg-blue-500/10 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]",
        };
    }
  };

  const colors = getColors();

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className={`relative w-full max-w-md bg-zinc-950 border ${colors.border} rounded-2xl p-6 ${colors.glow}`}
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center bg-white/5 ${colors.icon}`}
              >
                <AlertTriangle size={24} />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white tracking-tight">
                  {title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {message}
                </p>
              </div>

              <div className="flex gap-3 w-full pt-4">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-slate-400 font-medium hover:bg-white/5 hover:text-white transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <X size={16} />
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  className={`flex-1 py-3 px-4 rounded-xl border font-bold transition-all duration-200 flex items-center justify-center gap-2 ${colors.button}`}
                >
                  <Check size={16} />
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
