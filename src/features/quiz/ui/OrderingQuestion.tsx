import { OrderingQuestion as OrderQuestion } from "@shared/types/index";
import { MarkdownRenderer } from "@shared/ui/MarkdownRenderer";
import { GripVertical, Layers } from "lucide-react";
import React, { useState } from "react";

interface OrderingQuestionProps {
  question: OrderQuestion;
  onAnswer: (isCorrect: boolean, givenAnswer: string[]) => void;
}

export const OrderingQuestion: React.FC<OrderingQuestionProps> = ({
  question,
  onAnswer,
}) => {
  // We houden de huidige volgorde bij in de state
  const [currentOrder, setCurrentOrder] = useState<
    { id: string; text: string }[]
  >(question.items || []);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  // --- DRAG & DROP LOGICA ---

  const handleDragStart = (index: number) => {
    if (isSubmitted) return;
    setDraggedItemIndex(index);
  };

  const handleDragEnter = (index: number) => {
    if (isSubmitted || draggedItemIndex === null) return;

    // Verwissel de items in de lijst als je over een ander item heen sleept
    const newItems = [...currentOrder];
    const draggedItem = newItems[draggedItemIndex];

    // Verwijder het gesleepte item
    newItems.splice(draggedItemIndex, 1);
    // Voeg het toe op de nieuwe plek
    newItems.splice(index, 0, draggedItem as { id: string; text: string });

    setDraggedItemIndex(index);
    setCurrentOrder(newItems);
  };

  const handleDragEnd = () => {
    setDraggedItemIndex(null);
  };

  // --- SUBMIT LOGICA ---

  const handleSubmit = () => {
    setIsSubmitted(true);

    // Check of de IDs in de juiste volgorde staan
    const currentIds = currentOrder.map((item) => item.id);
    const isCorrect =
      JSON.stringify(currentIds) ===
      JSON.stringify(question.correctSequence || []);

    onAnswer(isCorrect, currentIds);
  };

  const getItemClass = (id: string, index: number): string => {
    const base =
      "p-4 rounded-lg border-2 flex items-center gap-4 transition-all duration-200 shadow-sm";

    if (!isSubmitted) {
      if (index === draggedItemIndex) {
        return `${base} bg-purple-600 border-purple-400 opacity-50 scale-105`;
      }
      return `${base} bg-gray-800 border-gray-600 hover:border-purple-400 cursor-grab active:cursor-grabbing`;
    }

    // Na submit: groen/rood per positie
    const isCorrectPosition = id === (question.correctSequence || [])[index];
    if (isCorrectPosition) {
      return `${base} bg-green-900/20 border-green-500/50 text-green-200`;
    }
    return `${base} bg-red-900/20 border-red-500/50 text-red-200`;
  };

  return (
    <div className="bg-gray-900/40 p-6 rounded-2xl border border-white/5 shadow-2xl max-w-2xl mx-auto backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
          <Layers
            size={20}
            className="text-purple-400 shadow-[0_0_8px_#a855f7]"
          />
        </div>
        <div>
          <h3 className="text-white font-bold tracking-tight">Ordenen</h3>
          <p className="text-[10px] text-purple-400/60 uppercase font-black tracking-widest leading-none">
            Sleep in de juiste volgorde
          </p>
        </div>
      </div>

      {/* Question */}
      <div className="text-xl font-bold text-white mb-6">
        <MarkdownRenderer content={question.question || question.text || ""} />
      </div>

      {/* Draggable List */}
      <div className="space-y-3 mb-8">
        {currentOrder.map((item, index) => (
          <div
            key={item.id}
            draggable={!isSubmitted}
            onDragStart={() => handleDragStart(index)}
            onDragEnter={() => handleDragEnter(index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => e.preventDefault()}
            className={getItemClass(item.id, index)}
          >
            {/* Drag Handle Icon */}
            <div className="text-gray-500">
              <GripVertical className="w-5 h-5" />
            </div>

            <span className="font-medium text-lg select-none flex-1">
              {item.text}
            </span>

            {/* Nummering */}
            <span className="text-xs font-mono text-gray-500 bg-gray-900 px-2 py-1 rounded">
              #{index + 1}
            </span>
          </div>
        ))}
      </div>

      {/* Submit Button */}
      {!isSubmitted ? (
        <button
          onClick={handleSubmit}
          className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg shadow-lg transition-transform active:scale-95"
        >
          Check Volgorde
        </button>
      ) : (
        /* Explanation */
        <div className="p-4 rounded-lg border border-gray-600 bg-gray-800">
          <div className="flex items-center gap-2 mb-2">
            {JSON.stringify(currentOrder.map((it) => it.id)) ===
            JSON.stringify(question.correctSequence || []) ? (
              <span className="text-green-400 font-bold">✅ Correct!</span>
            ) : (
              <span className="text-red-400 font-bold">❌ Helaas...</span>
            )}
          </div>
          <div className="text-gray-300 text-sm mb-3">
            <MarkdownRenderer content={question.explanation || ""} />
          </div>
          <div className="text-xs text-gray-400">
            <strong>Juiste volgorde:</strong>{" "}
            {(question.correctSequence || [])
              .map(
                (id) =>
                  (question.items || []).find((it) => it.id === id)?.text || id,
              )
              .join(" → ")}
          </div>
        </div>
      )}
    </div>
  );
};
