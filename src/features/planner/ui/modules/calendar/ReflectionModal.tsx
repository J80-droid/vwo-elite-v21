import { useTranslations } from "@shared/hooks/useTranslations";
import confetti from "canvas-confetti";
import { CheckCircle2, Frown, Meh, Smile } from "lucide-react";
import React, { useState } from "react";

interface ReflectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (rating: "easy" | "medium" | "hard", notes?: string) => void;
  onAutoReschedule?: () => void;
  taskTitle: string;
}

export const ReflectionModal: React.FC<ReflectionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onAutoReschedule,
  taskTitle,
}) => {
  const { t } = useTranslations();
  const [rating, setRating] = useState<"easy" | "medium" | "hard" | null>(null);
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (rating) {
      // Trigger confetti for positive/neutral feedback or just completion
      if (rating === "easy" || rating === "medium") {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#10b981", "#3b82f6", "#f59e0b"],
        });
      }
      onConfirm(rating, notes);
      setRating(null);
      setNotes("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gradient-to-br from-obsidian-900 to-black border border-white/10 rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-black text-white mb-2">
            {t("planner:dashboard.reflection.task_completed")}
          </h2>
          <p className="text-sm text-slate-400 line-clamp-1">{taskTitle}</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 block text-center">
              {t("planner:dashboard.reflection.how_did_it_go")}
            </label>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setRating("easy")}
                className={`p-4 rounded-2xl border-2 transition-all ${rating === "easy" ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 scale-110 shadow-lg shadow-emerald-500/20" : "bg-white/5 border-transparent text-slate-500 hover:bg-white/10 hover:scale-105"}`}
              >
                <Smile className="w-8 h-8" />
                <span className="text-[10px] font-bold block mt-1">
                  {t("planner:dashboard.reflection.rating_easy")}
                </span>
              </button>
              <button
                onClick={() => setRating("medium")}
                className={`p-4 rounded-2xl border-2 transition-all ${rating === "medium" ? "bg-amber-500/20 border-amber-500 text-amber-400 scale-110 shadow-lg shadow-amber-500/20" : "bg-white/5 border-transparent text-slate-500 hover:bg-white/10 hover:scale-105"}`}
              >
                <Meh className="w-8 h-8" />
                <span className="text-[10px] font-bold block mt-1">
                  {t("planner:dashboard.reflection.rating_medium")}
                </span>
              </button>
              <button
                onClick={() => setRating("hard")}
                className={`p-4 rounded-2xl border-2 transition-all ${rating === "hard" ? "bg-red-500/20 border-red-500 text-red-400 scale-110 shadow-lg shadow-red-500/20" : "bg-white/5 border-transparent text-slate-500 hover:bg-white/10 hover:scale-105"}`}
              >
                <Frown className="w-8 h-8" />
                <span className="text-[10px] font-bold block mt-1">
                  {t("planner:dashboard.reflection.rating_hard")}
                </span>
              </button>
            </div>
          </div>

          {rating === "hard" && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-red-400 text-xs font-bold uppercase tracking-wide">
                  {t("planner:dashboard.reflection.repair_loop")}
                </span>
              </div>
              <p className="text-xs text-slate-300 mb-2">
                {t("planner:dashboard.reflection.repair_desc")}
              </p>
              <button
                onClick={() => {
                  if (onAutoReschedule) onAutoReschedule();

                  // Reward the "Growth Mindset" decision
                  confetti({
                    particleCount: 150,
                    spread: 100,
                    origin: { y: 0.6 },
                    colors: ["#ef4444", "#f59e0b", "#ffffff"], // Red/Orange/White
                  });

                  onConfirm("hard", "Auto-rescheduled via Repair Loop");
                  setRating(null);
                }}
                className="w-full py-2.5 btn-elite-neon btn-elite-neon-rose text-xs"
              >
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                {t("planner:dashboard.reflection.auto_reschedule")}
              </button>
            </div>
          )}

          <div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("planner:dashboard.reflection.notes_placeholder")}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50 resize-none h-20"
            />
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <button
              onClick={onClose}
              className="btn-elite-neon btn-elite-neon-slate text-[10px]"
            >
              {t("planner:dashboard.reflection.cancel")}
            </button>
            <button
              onClick={() => onConfirm("medium")}
              className="btn-elite-neon btn-elite-neon-indigo text-[10px]"
            >
              {t("planner:dashboard.reflection.skip")}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!rating}
              className={`btn-elite-neon text-[10px] ${
                rating === "easy"
                  ? "btn-elite-neon-emerald"
                  : rating === "medium"
                    ? "btn-elite-neon-purple"
                    : rating === "hard"
                      ? "btn-elite-neon-rose"
                      : "opacity-20 cursor-not-allowed grayscale"
              }`}
            >
              {t("planner:dashboard.reflection.save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
