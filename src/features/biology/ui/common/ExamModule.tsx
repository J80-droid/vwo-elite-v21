import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  TrendingUp,
} from "lucide-react";
import React from "react";

import { useBiologyLabContext } from "../../hooks/useBiologyLabContext";

interface ExamQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  level: "Knowing" | "Understanding" | "Applying" | "Analyzing";
}

const MODULE_QUESTIONS: Record<string, ExamQuestion[]> = {
  genomics: [
    {
      id: "gen-1",
      question:
        "Welk enzym is verantwoordelijk voor het ontwinden van de DNA-helix tijdens replicatie?",
      options: ["DNA Polymerase", "Helicase", "Primase", "Ligase"],
      correctIndex: 1,
      explanation:
        "Helicase verbreekt de waterstofbruggen tussen de basenparen en 'rits' de helix open.",
      level: "Knowing",
    },
    {
      id: "gen-2",
      question:
        "In welke richting wordt een nieuwe DNA-streng altijd gesynthetiseerd?",
      options: [
        "3' -> 5'",
        "5' -> 3'",
        "Beide richtingen",
        "Afhankelijk van de celcyclus",
      ],
      correctIndex: 1,
      explanation:
        "DNA Polymerase kan alleen nucleotiden toevoegen aan het 3'-uiteinde, dus de groei is 5' naar 3'.",
      level: "Understanding",
    },
  ],
  microscopy: [
    {
      id: "mic-1",
      question:
        "Waarom wordt olie-immersie gebruikt bij hoge microscopische vergrotingen (100x objectief)?",
      options: [
        "Om het preparaat koel te houden",
        "Om de brekingsindex tussen glas en lens gelijk te trekken",
        "Om wrijving te verminderen",
        "Om bacteriën te doden",
      ],
      correctIndex: 1,
      explanation:
        "Olie heeft een vergelijkbare brekingsindex als glas, waardoor er minder licht verloren gaat door reflectie en de resolutie toeneemt.",
      level: "Understanding",
    },
  ],
  physiology: [
    {
      id: "phy-1",
      question:
        "Welk deel van het hart pompt zuurstofrijk bloed naar de aorta?",
      options: [
        "Rechter atrium",
        "Linker atrium",
        "Rechter ventrikel",
        "Linker ventrikel",
      ],
      correctIndex: 3,
      explanation:
        "De linker ventrikel (kamer) heeft de dikste wand en pompt het bloed met hoge druk de aorta in.",
      level: "Knowing",
    },
  ],
  ecology: [
    {
      id: "eco-1",
      question:
        "Wat gebeurt er in een Lotka-Volterra model als de predatie-efficiëntie toeneemt?",
      options: [
        "De prooi-populatie stabiliseert sneller",
        "De predator-populatie groeit sneller, leidend tot grotere fluctuaties",
        "Beide populaties sterven direct uit",
        "Er verandert niets",
      ],
      correctIndex: 1,
      explanation:
        "Hogere predatie-efficiëntie zorgt voor een snellere afname van prooi, wat weer leidt tot een snelle val van de predator-populatie.",
      level: "Applying",
    },
    {
      id: "eco-2",
      question:
        "Welke factor beperkt de draagkracht (carrying capacity) van een ecosysteem meestal het eerst?",
      options: [
        "Zuurstofgehalte",
        "Beschikbaar voedsel of ruimte",
        "Aantal predatoren",
        "Luchtdruk",
      ],
      correctIndex: 1,
      explanation:
        "Draagkracht wordt bepaald door de 'limiting factors', meestal abiotische bronnen zoals voedsel, water en leefruimte.",
      level: "Understanding",
    },
  ],
};

export const ExamModule: React.FC<{ moduleId: string }> = ({ moduleId }) => {
  const { incrementMastery } = useBiologyLabContext();
  const questions = MODULE_QUESTIONS[moduleId] || [];
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [selectedOption, setSelectedOption] = React.useState<number | null>(
    null,
  );
  const [showExplanation, setShowExplanation] = React.useState(false);

  if (questions.length === 0) return null;

  const currentQuestion = questions[currentIndex];

  if (!currentQuestion) return null;

  const handleAnswer = (index: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(index);
    setShowExplanation(true);

    if (index === currentQuestion.correctIndex) {
      incrementMastery(moduleId, 5, currentQuestion.level);
    }
  };

  const nextQuestion = () => {
    setSelectedOption(null);
    setShowExplanation(false);
    setCurrentIndex((currentIndex + 1) % questions.length);
  };

  return (
    <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-full">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen size={18} className="text-white" />
          <h2 className="text-sm font-black uppercase tracking-widest text-white">
            VWO Examen Trainer
          </h2>
        </div>
        <div className="flex items-center gap-2 bg-black/20 px-2 py-1 rounded-full">
          <TrendingUp size={12} className="text-emerald-400" />
          <span className="text-[10px] font-bold text-emerald-400">
            Bloom: {currentQuestion.level}
          </span>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
        <div className="mb-6">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
            Vraag {currentIndex + 1} / {questions.length}
          </span>
          <p className="text-white font-medium leading-relaxed">
            {currentQuestion.question}
          </p>
        </div>

        <div className="space-y-3">
          {currentQuestion.options.map((option, idx) => {
            const isCorrect = idx === currentQuestion.correctIndex;
            const isSelected = idx === selectedOption;

            let buttonClass =
              "w-full text-left p-4 rounded-xl border transition-all duration-200 text-sm ";
            if (selectedOption === null) {
              buttonClass +=
                "bg-white/5 border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/5 text-slate-300";
            } else if (isCorrect) {
              buttonClass +=
                "bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold";
            } else if (isSelected && !isCorrect) {
              buttonClass += "bg-red-500/20 border-red-500 text-red-400";
            } else {
              buttonClass +=
                "bg-white/5 border-white/5 text-slate-600 opacity-50";
            }

            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={selectedOption !== null}
                className={buttonClass}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {selectedOption !== null && isCorrect && (
                    <CheckCircle2 size={16} />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {showExplanation && (
          <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-2 mb-2 text-indigo-400">
              <HelpCircle size={14} />
              <span className="text-xs font-bold uppercase">Uitleg</span>
            </div>
            <p className="text-xs text-indigo-200/80 leading-relaxed italic">
              {currentQuestion.explanation}
            </p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/5 bg-black/20">
        <button
          onClick={nextQuestion}
          className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-white transition-all group"
        >
          Volgende Vraag
          <ChevronRight
            size={16}
            className="group-hover:translate-x-1 transition-transform"
          />
        </button>
      </div>
    </div>
  );
};
