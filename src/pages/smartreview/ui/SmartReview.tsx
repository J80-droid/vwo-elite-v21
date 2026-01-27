/* eslint-disable @typescript-eslint/no-empty-object-type */
import { createEmptyCard, scheduleCard } from "@shared/api/fsrsService";
// import { Flashcard } from '../../types';
import {
  useDueFlashcards,
  useFlashcards,
  useSaveFlashcard,
} from "@shared/hooks/useLocalData";
import { useTranslations } from "@shared/hooks/useTranslations";
import React, { useState } from "react";
import { toast } from "sonner";

interface SmartReviewProps {}

export const SmartReview: React.FC<SmartReviewProps> = () => {
  const { t } = useTranslations();
  const { data: dueCards = [], refetch: refetchDue } = useDueFlashcards();
  const { data: allCards = [] } = useFlashcards();
  const saveMutation = useSaveFlashcard();

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [mode, setMode] = useState<"dashboard" | "review" | "add">("dashboard");

  // Add Form State
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");
  const [newSubject, setNewSubject] = useState("");

  const currentCard = dueCards[currentCardIndex] || null;

  const startReview = () => {
    if (dueCards.length > 0) {
      setMode("review");
      setCurrentCardIndex(0);
      setShowBack(false);
    }
  };

  const handleRate = async (rating: 1 | 2 | 3 | 4) => {
    if (!currentCard) return;

    const updatedCard = scheduleCard(currentCard, rating);
    await saveMutation.mutateAsync(updatedCard);

    // Move to next
    const nextIndex = currentCardIndex + 1;
    if (nextIndex < dueCards.length) {
      setCurrentCardIndex(nextIndex);
      setShowBack(false);
    } else {
      setMode("dashboard");
      setCurrentCardIndex(0);
      refetchDue();
    }
  };

  const handleAddCard = async () => {
    if (!newFront || !newBack || !newSubject) return;
    const card = createEmptyCard(newFront, newBack, newSubject);
    await saveMutation.mutateAsync(card);
    setNewFront("");
    setNewBack("");
    toast.success("Kaart toegevoegd!");
    refetchDue();
  };

  return (
    <div className="p-6 h-full flex flex-col">
      {mode === "dashboard" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
          {/* Stats Card */}
          <div className="bg-obsidian-900 border border-obsidian-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-electric/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <h2 className="text-3xl font-bold bg-gradient-to-r from-electric to-blue-400 bg-clip-text text-transparent mb-2">
              {dueCards.length}
            </h2>
            <p className="text-slate-400 uppercase tracking-widest text-xs font-bold mb-6">
              Items te leren
            </p>

            <div className="w-full bg-obsidian-950 rounded-full h-2 mb-2 overflow-hidden">
              <div
                className="bg-electric h-full"
                style={{
                  width: `${Math.min(100, (dueCards.length / (allCards.length || 1)) * 100)}%`,
                }}
              />
            </div>
            <p className="text-xs text-slate-500 mb-8">
              {allCards.length} kaarten totaal
            </p>

            <button
              onClick={startReview}
              disabled={dueCards.length === 0}
              className="bg-electric hover:bg-electric-glow text-white font-bold py-4 px-12 rounded-full transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:grayscale shadow-lg shadow-electric/20"
            >
              {dueCards.length > 0
                ? t.live?.start || "Start Sessie"
                : t.live?.ready || "Alles Bijgewerkt"}
            </button>
          </div>

          {/* Quick Add */}
          <div className="bg-obsidian-900 border border-obsidian-800 rounded-2xl p-8 flex flex-col shadow-xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="text-gold">+</span> Nieuwe Kaart
            </h3>
            <input
              className="bg-obsidian-950 border border-obsidian-800 rounded-lg p-3 mb-3 text-white focus:border-gold outline-none transition-colors"
              placeholder="Vraag / Citaat"
              value={newFront}
              onChange={(e) => setNewFront(e.target.value)}
            />
            <textarea
              className="bg-obsidian-950 border border-obsidian-800 rounded-lg p-3 mb-3 text-white focus:border-gold outline-none transition-colors h-24 resize-none"
              placeholder="Antwoord / Definitie"
              value={newBack}
              onChange={(e) => setNewBack(e.target.value)}
            />
            <input
              className="bg-obsidian-950 border border-obsidian-800 rounded-lg p-3 mb-6 text-white focus:border-gold outline-none transition-colors"
              placeholder="Vak (bijv. Geschiedenis)"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
            />
            <button
              onClick={handleAddCard}
              className="bg-obsidian-950 border border-gold/30 text-gold hover:bg-gold hover:text-obsidian-950 font-bold py-3 rounded-lg transition-all"
            >
              Toevoegen
            </button>
          </div>
        </div>
      )}

      {mode === "review" && currentCard && (
        <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
          <div className="w-full text-center md:mb-8 mb-4">
            <span className="text-slate-500 text-sm font-mono">
              {currentCard.subject} • {dueCards.length} te gaan
            </span>
          </div>

          <div className="w-full bg-obsidian-900 border border-obsidian-800 rounded-3xl p-12 min-h-[400px] flex flex-col items-center justify-center shadow-2xl relative perspective-1000 transition-all duration-500">
            <div className="text-2xl md:text-4xl font-bold text-white text-center leading-relaxed">
              {currentCard.front}
            </div>

            {showBack && (
              <div className="mt-12 pt-12 border-t border-obsidian-800 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                <p className="text-xl md:text-2xl text-slate-300 text-center font-medium">
                  {currentCard.back}
                </p>
              </div>
            )}

            {!showBack && (
              <button
                onClick={() => setShowBack(true)}
                className="mt-12 bg-white text-obsidian-950 font-bold py-3 px-8 rounded-full hover:scale-105 transition-transform"
              >
                Toon Antwoord
              </button>
            )}
          </div>

          {showBack && (
            <div className="grid grid-cols-4 gap-4 w-full mt-8">
              <button
                onClick={() => handleRate(1)}
                className="flex flex-col items-center p-4 rounded-xl bg-obsidian-900 border border-red-500/30 hover:bg-red-500/10 hover:border-red-500 transition-all group"
              >
                <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">
                  ❌
                </span>
                <span className="text-xs font-bold text-red-400 uppercase">
                  Opnieuw
                </span>
                <span className="text-[10px] text-slate-500 mt-1">
                  &lt; 1 min
                </span>
              </button>
              <button
                onClick={() => handleRate(2)}
                className="flex flex-col items-center p-4 rounded-xl bg-obsidian-900 border border-orange-500/30 hover:bg-orange-500/10 hover:border-orange-500 transition-all group"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mb-1 group-hover:scale-110 transition-transform"
                >
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <path d="M12 9v4" />
                  <path d="M12 17h.01" />
                </svg>
                <span className="text-xs font-bold text-orange-400 uppercase">
                  Moeilijk
                </span>
                <span className="text-[10px] text-slate-500 mt-1">2 dagen</span>
              </button>
              <button
                onClick={() => handleRate(3)}
                className="flex flex-col items-center p-4 rounded-xl bg-obsidian-900 border border-electric/30 hover:bg-electric/10 hover:border-electric transition-all group"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mb-1 group-hover:scale-110 transition-transform"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span className="text-xs font-bold text-electric uppercase">
                  Goed
                </span>
                <span className="text-[10px] text-slate-500 mt-1">5 dagen</span>
              </button>
              <button
                onClick={() => handleRate(4)}
                className="flex flex-col items-center p-4 rounded-xl bg-obsidian-900 border border-green-500/30 hover:bg-green-500/10 hover:border-green-500 transition-all group"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mb-1 group-hover:scale-110 transition-transform"
                >
                  <path d="m5 12 7-7 7 7" />
                  <path d="M12 19V5" />
                </svg>
                <span className="text-xs font-bold text-green-400 uppercase">
                  Makkelijk
                </span>
                <span className="text-[10px] text-slate-500 mt-1">
                  10 dagen
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
