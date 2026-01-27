import { useTranslations } from "@shared/hooks/useTranslations";
import { useVoiceCoachContext } from "@shared/lib/contexts/VoiceCoachContext";
import { AlertTriangle, ArrowRight, Brain, Scale } from "lucide-react";
import React, { useState } from "react";

const SCENARIOS = [
  {
    id: 1,
    title: "Academic Integrity",
    situation:
      "You notice a close friend using unauthorized notes during a critical exam. You know they have been struggling with mental health issues recently.",
    question: "What is the most ethical and appropriate course of action?",
    options: [
      {
        id: "a",
        text: "Ignore it completely to protect your friend.",
        type: "ineffective",
      },
      {
        id: "b",
        text: "Report them immediately to the invigilator.",
        type: "effective",
      },
      {
        id: "c",
        text: "Confront them after the exam and encourage them to confess.",
        type: "very_effective",
      },
      {
        id: "d",
        text: "Send an anonymous tip to the faculty.",
        type: "slightly_effective",
      },
    ],
    explanation:
      "Confronting them (C) balances integrity with compassion. Reporting immediately (B) is technically correct but lacks empathy. Ignoring (A) compromises integrity.",
  },
  {
    id: 2,
    title: "Cultural Misunderstanding",
    situation:
      "During a group project with international students, one member remains silent and avoids eye contact. The deadline is approaching.",
    question: "How should you handle this?",
    options: [
      {
        id: "a",
        text: "Assume they are lazy and assign them a minor role.",
        type: "ineffective",
      },
      {
        id: "b",
        text: "Publicly ask them to contribute more.",
        type: "ineffective",
      },
      {
        id: "c",
        text: "Speak to them privately to check if everything is okay.",
        type: "very_effective",
      },
      {
        id: "d",
        text: "Ask the group leader to handle it.",
        type: "slightly_effective",
      },
    ],
    explanation:
      "Private communication (C) respects potential cultural differences or personal issues. Public confrontation (B) or assumptions (A) are counterproductive.",
  },
];

export const SJTStage: React.FC = () => {
  const { t } = useTranslations();
  useVoiceCoachContext(
    "LanguageLab",
    t(
      "language.sjt.voice_coach",
      "Welkom bij de Situational Judgement Test. Evalueer complexe sociale en ethische scenario's.",
    ),
    { tool: "sjt" },
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const activeScenario = SCENARIOS[currentIndex];

  // Guard: ensure scenario exists
  if (!activeScenario) {
    return <div className="text-slate-500 p-8">No scenario available.</div>;
  }

  const handleSubmit = () => {
    if (selectedOption) setIsSubmitted(true);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % SCENARIOS.length);
    setSelectedOption(null);
    setIsSubmitted(false);
  };

  const getOptionStyle = (optionId: string, type: string) => {
    if (!isSubmitted) {
      return selectedOption === optionId
        ? "bg-amber-500/20 border-amber-500 text-white"
        : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10";
    }

    if (optionId === selectedOption) {
      if (type === "very_effective")
        return "bg-emerald-500/20 border-emerald-500 text-emerald-100";
      if (type === "effective")
        return "bg-blue-500/20 border-blue-500 text-blue-100";
      if (type === "slightly_effective")
        return "bg-yellow-500/20 border-yellow-500 text-yellow-100";
      return "bg-red-500/20 border-red-500 text-red-100";
    }
    return "opacity-50 bg-black/20 border-transparent";
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none select-none z-0">
        <h1 className="text-[10rem] md:text-[15rem] font-black tracking-tighter text-white">
          VWO ELITE
        </h1>
      </div>

      <div className="relative z-10 h-full overflow-y-auto p-6 max-w-4xl mx-auto custom-scrollbar">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-teal-500/10 rounded-xl border border-teal-500/20">
            <Scale className="text-teal-400" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">
              {t("language.sjt.title", "Situational Judgement Test")}
            </h2>
            <p className="text-slate-400 text-sm">
              {t(
                "language.sjt.subtitle",
                "Ethics, Diplomacy & Nuance assessment",
              )}
            </p>
          </div>
        </div>

        <div className="bg-obsidian-900 border border-white/10 rounded-3xl p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Brain size={120} />
          </div>

          <h3 className="text-xl font-bold text-white mb-2">
            {t(
              `language.sjt.scenario_${activeScenario.id}.title`,
              activeScenario.title,
            )}
          </h3>
          <p className="text-slate-300 text-lg leading-relaxed mb-8">
            {t(
              `language.sjt.scenario_${activeScenario.id}.situation`,
              activeScenario.situation,
            )}
          </p>

          <div className="bg-black/30 rounded-xl p-4 border-l-4 border-amber-500 mb-8">
            <h4 className="font-bold text-amber-500 mb-1">
              {t("language.sjt.question_label", "Question")}
            </h4>
            <p className="text-slate-200">
              {t(
                `language.sjt.scenario_${activeScenario.id}.question`,
                activeScenario.question,
              )}
            </p>
          </div>

          <div className="space-y-3">
            {activeScenario.options.map((option) => (
              <button
                key={option.id}
                onClick={() => !isSubmitted && setSelectedOption(option.id)}
                disabled={isSubmitted}
                className={`w-full p-4 rounded-xl border text-left transition-all ${getOptionStyle(option.id, option.type)}`}
              >
                <div className="flex items-start gap-3">
                  <span className="font-mono font-bold opacity-50">
                    {option.id.toUpperCase()}.
                  </span>
                  <div>
                    {t(
                      `language.sjt.scenario_${activeScenario.id}.option_${option.id}`,
                      option.text,
                    )}
                    {isSubmitted && selectedOption === option.id && (
                      <div className="text-xs uppercase font-bold mt-2 tracking-widest">
                        {t(
                          `language.sjt.rating.${option.type}`,
                          option.type.replace("_", " "),
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {isSubmitted && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 animate-in slide-in-from-bottom active:scale-[0.99] transition-transform">
            <h4 className="font-bold text-white mb-2 flex items-center gap-2">
              <AlertTriangle size={18} className="text-teal-400" />{" "}
              {t("language.sjt.analysis_label", "Analyse")}
            </h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              {t(
                `language.sjt.scenario_${activeScenario.id}.explanation`,
                activeScenario.explanation,
              )}
            </p>
          </div>
        )}

        <div className="flex justify-end">
          {!isSubmitted ? (
            <button
              onClick={handleSubmit}
              disabled={!selectedOption}
              className="bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-black font-bold px-8 py-3 rounded-xl transition-all shadow-lg shadow-teal-500/20"
            >
              {t("language.sjt.confirm_button", "Bevestig Keuze")}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="bg-white text-black font-bold px-8 py-3 rounded-xl hover:scale-105 transition-all flex items-center gap-2"
            >
              {t("language.sjt.next_button", "Volgende Situatie")}{" "}
              <ArrowRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
