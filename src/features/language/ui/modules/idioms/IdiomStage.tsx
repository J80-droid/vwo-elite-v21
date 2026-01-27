import { useTranslations } from "@shared/hooks/useTranslations";
import { useVoiceCoachContext } from "@shared/lib/contexts/VoiceCoachContext";
import { BookOpen, Check, RefreshCw, X } from "lucide-react";
import React, { useState } from "react";

const IDIOMS = [
  {
    id: "break-leg",
    expression: "Break a leg",
    meaning: "Good luck (theatrical)",
    origin:
      "Theatrical superstition to wish performers bad luck to avoid jinxing them.",
    example: "Break a leg on your premiere tonight!",
    options: ["Break a bone", "Good luck", "Do your best", "Fail miserably"],
  },
  {
    id: "piece-cake",
    expression: "A piece of cake",
    meaning: "Something very easy to do",
    origin:
      'Cakes were given as prizes in competitions, so winning was "a piece of cake".',
    example: "That math test was a piece of cake.",
    options: ["Delicious", "Difficult", "Very easy", "Expensive"],
  },
  {
    id: "bite-bullet",
    expression: "Bite the bullet",
    meaning: "To face a difficult situation with courage",
    origin:
      "Soldiers would bite on a bullet during surgery without anesthesia.",
    example: "I have to bite the bullet and tell him the truth.",
    options: ["Eat metal", "Be brave", "Give up", "Shoot"],
  },
];

export const IdiomStage: React.FC = () => {
  const { t } = useTranslations();
  useVoiceCoachContext(
    "LanguageLab",
    t(
      "language.idioms.voice_coach",
      "Welkom bij Idiom Mastery. Leer de betekenis en herkomst van complexe uitdrukkingen.",
    ),
    { tool: "idioms" },
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const activeIdiom = IDIOMS[currentIndex]!;

  const handleOptionSelect = (option: string) => {
    const correct = option === activeIdiom.meaning;
    setSelectedOption(option);
    setIsCorrect(correct);
  };

  const nextIdiom = () => {
    setCurrentIndex((prev: number) => (prev + 1) % IDIOMS.length);
    setSelectedOption(null);
    setIsCorrect(null);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 relative overflow-hidden text-center">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none select-none z-0">
        <h1 className="text-[10rem] md:text-[15rem] font-black tracking-tighter text-white">
          VWO ELITE
        </h1>
      </div>

      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-black/90 z-0"></div>
      <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>

      <div className="relative z-10 max-w-2xl w-full">
        <div className="mb-8 p-4 bg-white/5 rounded-full inline-flex items-center gap-2 border border-white/10">
          <BookOpen size={16} className="text-blue-400" />
          <span className="text-sm font-bold text-slate-300">
            IDIOM MASTERY • LEVEL B2
          </span>
        </div>

        <div className="bg-black/40 border border-white/10 rounded-3xl p-10 backdrop-blur-xl mb-8 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>

          <h1 className="text-5xl font-black text-white mb-4 tracking-tighter group-hover:scale-105 transition-transform duration-500">
            {activeIdiom.expression}
          </h1>

          {isCorrect !== null ? (
            <div
              className={`mt-6 p-6 rounded-2xl border transition-all animate-in zoom-in-95 duration-300 ${isCorrect ? "bg-emerald-500/10 border-emerald-500/30" : "bg-red-500/10 border-red-500/30"}`}
            >
              <div className="flex items-center justify-center gap-3 mb-2">
                {isCorrect ? (
                  <Check className="text-emerald-400" size={24} />
                ) : (
                  <X className="text-red-400" size={24} />
                )}
                <h3
                  className={`text-xl font-bold ${isCorrect ? "text-emerald-400" : "text-red-400"}`}
                >
                  {isCorrect
                    ? t("language.idioms.correct", "Correct!")
                    : t("language.idioms.incorrect", "Helaas...")}
                </h3>
              </div>
              <p className="text-slate-300 italic mb-4">
                "{activeIdiom.origin}"
              </p>
              <div className="bg-black/20 p-4 rounded-xl text-left border border-white/5">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest block mb-1">
                  {t("language.idioms.example_label", "Voorbeeld")}
                </span>
                <p className="text-white">"{activeIdiom.example}"</p>
              </div>
            </div>
          ) : (
            <p className="text-slate-400 text-lg">
              {t("language.idioms.question", "Wat betekent deze uitdrukking?")}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {activeIdiom.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleOptionSelect(option)}
              disabled={isCorrect !== null}
              className={`p-4 rounded-2xl border text-lg font-bold transition-all ${
                selectedOption === option
                  ? isCorrect
                    ? "bg-emerald-500 text-black border-emerald-500 scale-105"
                    : "bg-red-500 text-white border-red-500"
                  : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20 hover:text-white"
              } ${isCorrect !== null && selectedOption !== option ? "opacity-50" : ""}`}
            >
              {option}
            </button>
          ))}
        </div>

        {isCorrect !== null && (
          <button
            onClick={nextIdiom}
            className="mt-8 px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 mx-auto"
          >
            <RefreshCw size={18} />{" "}
            {t("language.idioms.next_button", "Volgende Idioom")}
          </button>
        )}
      </div>
    </div>
  );
};
