import { usePlannerEliteStore } from "@shared/model/plannerStore";
import confetti from "canvas-confetti";
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Star,
  TrendingUp,
  X,
} from "lucide-react";
import React, { useState } from "react";

interface WeeklyReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewDate: string;
}

export const WeeklyReviewModal: React.FC<WeeklyReviewModalProps> = ({
  isOpen,
  onClose,
  reviewDate,
}) => {
  const { completeWeeklyReview, weeklyReviews } = usePlannerEliteStore();
  const [rating, setRating] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const review = weeklyReviews.find((r) => r.id === reviewDate);
  const isCompleted = !!review?.completed;

  if (!isOpen) return null;

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      await completeWeeklyReview(reviewDate, rating, notes);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#6366f1", "#a855f7", "#ec4899"],
      });
      onClose();
    } catch (error) {
      console.error("[WeeklyReview] Failed to complete review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-obsidian-900/90 border border-white/10 rounded-[2.5rem] p-10 max-w-lg w-full mx-4 shadow-[0_0_100px_-20px_rgba(99,102,241,0.2)] relative overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] -z-10 rounded-full" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 blur-[100px] -z-10 rounded-full" />

        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/5 border border-white/5 text-slate-500 hover:text-white hover:bg-white/10 transition-all uppercase text-[10px] font-black group"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Calendar size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white leading-none mb-1">
              Weekly Review
            </h2>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
              Week van {new Date(reviewDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        {isCompleted ? (
          <div className="space-y-6 text-center py-8">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20 shadow-[0_0_30px_-5px_rgba(16,185,129,0.2)]">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-2">
                Review Voltooid!
              </h3>
              <p className="text-sm text-slate-400">
                Je hebt deze week al gereflecteerd. Goed bezig met je groei!
              </p>
            </div>
            <button
              onClick={onClose}
              className="btn-elite-neon btn-elite-neon-emerald w-full"
            >
              Sluiten
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 block">
                Hoe tevreden ben je over je inzet deze week?
              </label>
              <div className="flex justify-between items-center bg-white/5 border border-white/5 p-4 rounded-3xl">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`p-2 transition-all ${rating >= star ? "scale-125 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]" : "text-slate-700 hover:text-slate-500"}`}
                  >
                    <Star
                      size={28}
                      fill={rating >= star ? "currentColor" : "none"}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 block">
                Belangrijkste leerpunten of obstakels?
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reflecteer op je focus, energie en resultaten..."
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50 resize-none h-32 transition-all"
              />
            </div>

            <div className="flex items-start gap-4 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
              <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 shrink-0">
                <TrendingUp size={16} />
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                Wekelijkse reflectie helpt je metacognitieve vaardigheden te
                versterken. Dit is essentieel voor VWO succes.
              </p>
            </div>

            <button
              onClick={handleComplete}
              disabled={rating === 0 || isSubmitting}
              className={`w-full py-4 rounded-2xl font-black text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-3 ${
                rating > 0
                  ? "bg-indigo-600 text-white shadow-[0_10px_20px_-10px_rgba(79,70,229,0.5)] hover:bg-indigo-500 active:scale-[0.98]"
                  : "bg-white/5 text-slate-600 cursor-not-allowed grayscale"
              }`}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Week Afronden
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
