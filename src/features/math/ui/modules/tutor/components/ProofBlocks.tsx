import { closestCenter, DndContext, DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CheckCircle, RotateCcw } from "lucide-react";
import { useState } from "react";
import { InlineMath } from "react-katex";

import { SortableItem } from "./SortableItem";

const PROOF_LIBRARY = [
  {
    title: "Bewijs: Hoek in een halve cirkel (Thales)",
    given: "Cirkel M met middellijn AB. C op cirkel.",
    steps: [
      { id: "1", content: "Trek lijnstuk MC (straal)." },
      {
        id: "2",
        content:
          "\\Delta AMC \\text{ is gelijkbenig } (AM = MC), \\text{ dus } \\angle A = \\angle ACM.",
      },
      {
        id: "3",
        content:
          "\\Delta BMC \\text{ is gelijkbenig } (BM = MC), \\text{ dus } \\angle B = \\angle BCM.",
      },
      {
        id: "4",
        content:
          "\\angle C = \\angle ACM + \\angle BCM = \\angle A + \\angle B.",
      },
      {
        id: "5",
        content:
          "\\text{Som van hoeken in } \\Delta ABC: \\angle A + \\angle B + \\angle C = 180^\\circ.",
      },
      {
        id: "6",
        content:
          "\\text{Substitutie: } \\angle C + \\angle C = 180^\\circ \\implies 2\\angle C = 180^\\circ \\implies \\angle C = 90^\\circ.",
      },
    ],
    distractors: [
      {
        id: "X1",
        content:
          "\\text{Omdat } M \\text{ het middelpunt is, is } \\angle C \\text{ recht.}",
      },
      { id: "X2", content: "\\Delta ABC \\text{ is gelijkzijdig.}" },
    ],
  },
  {
    title: "Bewijs: Raaklijn aan Cirkel",
    given: "Cirkel M, raaklijn l raakt in P.",
    steps: [
      {
        id: "1",
        content: "\\text{Neem aan dat MP niet loodrecht op l staat.}",
      },
      { id: "2", content: "\\text{Teken de loodlijn MQ op l.}" },
      {
        id: "3",
        content:
          "\\text{In rechthoekige } \\Delta MQP \\text{ is MP de schuine zijde.}",
      },
      {
        id: "4",
        content:
          "\\text{Dus } MQ < MP \\text{ (rechthoekszijde < schuine zijde).}",
      },
      {
        id: "5",
        content: "MP \\text{ is de straal, dus Q ligt binnen de cirkel.}",
      },
      {
        id: "6",
        content:
          "\\text{De lijn snijdt de cirkel dus in 2 punten. Tegenspraak met raaklijn.}",
      },
    ],
    distractors: [
      {
        id: "X1",
        content: "\\text{De stelling van Pythagoras geldt in } \\Delta MQP.",
      },
      {
        id: "X2",
        content: "\\text{De raaklijn heeft richtingscoëfficiënt -1.}",
      },
    ],
  },
];

export function ProofBlocks() {
  // 1. Kies random probleem
  const [problem] = useState(
    () => PROOF_LIBRARY[Math.floor(Math.random() * PROOF_LIBRARY.length)]!,
  );

  // 2. Maak de Solution Order (Voordat we shufflen!)
  // Note: We use ref or useMemo or just const if we trust it won't re-render unpredictably for this simple component
  const solutionOrder = problem.steps.map((s) => s.id);

  const [steps, setSteps] = useState(() =>
    [...problem.steps, ...problem.distractors].sort(() => Math.random() - 0.5),
  );
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSteps((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const checkLogic = () => {
    // Elite Validation:
    // 1. Filter out distractors to see if core logic is present
    // 2. Check strict order

    const currentIds = steps.map((s) => s.id);
    const cleanIds = currentIds.filter((id) => solutionOrder.includes(id));
    const hasDistractors = currentIds.some((id) => !solutionOrder.includes(id));

    if (hasDistractors) {
      setResult("wrong"); // Feedback: remove distractors
      return;
    }

    const isOrderCorrect =
      JSON.stringify(cleanIds) === JSON.stringify(solutionOrder);
    setResult(isOrderCorrect ? "correct" : "wrong");
  };

  return (
    <div className="h-full flex flex-col max-w-3xl mx-auto w-full selection:bg-violet-500/30">
      {/* Problem Card */}
      <div className="mb-10 p-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl relative overflow-hidden group">
        <div className="absolute -inset-24 bg-violet-500/5 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none" />
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-violet-400 text-[10px] font-black uppercase tracking-widest mb-6 border border-violet-500/20">
          Target Proof
        </div>
        <h3 className="text-2xl font-black text-white mb-4 tracking-tight uppercase">
          {problem.title}
        </h3>

        <div className="bg-black/20 rounded-2xl border border-white/5 p-6 mb-6">
          <p className="text-slate-400 text-sm mb-2">
            <strong className="text-violet-400">Gegeven:</strong>{" "}
            <InlineMath math={problem.given} />
          </p>
          {/* Te Bewijzen removed for generic support or needs to be in problem obj */}
        </div>

        <p className="text-slate-500 text-xs font-medium uppercase tracking-widest text-center mb-2">
          Sleep de blokken in de juiste volgorde
        </p>
      </div>

      {/* Drag & Drop Area */}
      <div className="flex-1 overflow-y-auto px-2 pb-32 scrollbar-none">
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={steps} strategy={verticalListSortingStrategy}>
            {steps.map((step) => (
              <SortableItem key={step.id} id={step.id}>
                <div className="py-1">
                  <InlineMath math={step.content} />
                </div>
              </SortableItem>
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {/* Action Bar */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-xl px-6">
        <div className="p-4 bg-obsidian-900/60 border border-white/10 rounded-3xl backdrop-blur-2xl shadow-2xl flex gap-4">
          <button
            onClick={() =>
              setSteps(
                [...problem.steps, ...problem.distractors].sort(
                  () => Math.random() - 0.5,
                ),
              )
            }
            className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all hover:scale-110 active:scale-90"
          >
            <RotateCcw size={24} />
          </button>
          <button
            onClick={checkLogic}
            className={`
                            flex-1 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-sm transition-all duration-500
                            ${
                              result === "correct"
                                ? "bg-emerald-500/5 border border-emerald-500/30 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.1)]"
                                : result === "wrong"
                                  ? "bg-rose-500/5 border border-rose-500/30 text-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.1)]"
                                  : "bg-violet-500/5 border border-violet-500/30 text-violet-400 hover:bg-violet-500/10 hover:shadow-[0_0_30px_rgba(139,92,246,0.2)] active:scale-95"
                            }
                        `}
          >
            {result === "correct" ? (
              <span className="flex items-center justify-center gap-2">
                <CheckCircle size={20} /> Perfect Logic
              </span>
            ) : result === "wrong" ? (
              "Try Again"
            ) : (
              "Check Logic"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
