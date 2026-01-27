/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { geminiGenerate } from "@shared/api/geminiBase";
import { useTranslations } from "@shared/hooks/useTranslations";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowDown,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  GripVertical,
  Loader2,
  Play,
  RotateCcw,
  Scale,
  Trash2,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";

const LogicHandbook = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const { t } = useTranslations();
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-sm bg-black/95 border-l border-white/10 p-8 z-50 overflow-y-auto shadow-2xl"
          >
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-2">
                <Scale className="text-amber-400" />
                <span className="text-sm font-black text-white uppercase tracking-widest">
                  {t("philosophy.logic.handbook.title", "Logica Handboek")}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-8">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen size={16} className="text-indigo-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">
                    {t(
                      "philosophy.logic.handbook.theory_focus",
                      "Theorie Focus",
                    )}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t(
                    "philosophy.logic.handbook.theory_desc",
                    "Op het VWO-examen moet je redeneringen kunnen toetsen op <0>geldigheid</0> (vorm) en <1>houdbaarheid</1> (inhoud).",
                    {
                      components: [
                        <span className="text-white font-bold italic" />,
                        <span className="text-white font-bold italic" />,
                      ],
                    },
                  )}
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-white/10 pb-2">
                  {t(
                    "philosophy.logic.handbook.syllogism_title",
                    "Het Syllogisme",
                  )}
                </h4>

                <div className="space-y-1">
                  <div className="text-[10px] text-amber-500 font-bold uppercase">
                    {t(
                      "philosophy.logic.handbook.maior_title",
                      "1. Maior Premisse",
                    )}
                  </div>
                  <p className="text-sm text-slate-300">
                    {t(
                      "philosophy.logic.handbook.maior_desc",
                      "De algemene regel.",
                    )}{" "}
                    <br />
                    <span className="italic text-slate-500">
                      "
                      {t(
                        "philosophy.logic.handbook.maior_example",
                        "Alle mensen zijn sterfelijk.",
                      )}
                      "
                    </span>
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-amber-500 font-bold uppercase">
                    {t(
                      "philosophy.logic.handbook.minor_title",
                      "2. Minor Premisse",
                    )}
                  </div>
                  <p className="text-sm text-slate-300">
                    {t(
                      "philosophy.logic.handbook.minor_desc",
                      "Het specifieke geval.",
                    )}{" "}
                    <br />
                    <span className="italic text-slate-500">
                      "
                      {t(
                        "philosophy.logic.handbook.minor_example",
                        "Socrates is een mens.",
                      )}
                      "
                    </span>
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-emerald-500 font-bold uppercase">
                    {t(
                      "philosophy.logic.handbook.conclusion_title",
                      "3. Conclusie",
                    )}
                  </div>
                  <p className="text-sm text-slate-300">
                    {t(
                      "philosophy.logic.handbook.conclusion_desc",
                      "Het noodzakelijke gevolg.",
                    )}{" "}
                    <br />
                    <span className="italic text-slate-500">
                      "
                      {t(
                        "philosophy.logic.handbook.conclusion_example",
                        "Socrates is sterfelijk.",
                      )}
                      "
                    </span>
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/10">
                <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2">
                  {t(
                    "philosophy.logic.handbook.fallacies_title",
                    "Pas op voor Drogredenen",
                  )}
                </h4>
                <ul className="text-xs text-slate-400 space-y-2 list-disc pl-4">
                  <li>
                    <strong>
                      {t(
                        "philosophy.logic.handbook.strawman_label",
                        "Stromantype",
                      )}
                      :
                    </strong>{" "}
                    {t(
                      "philosophy.logic.handbook.strawman_desc",
                      "Het standpunt van de ander verdraaien.",
                    )}
                  </li>
                  <li>
                    <strong>
                      {t(
                        "philosophy.logic.handbook.adhominem_label",
                        "Ad Hominem",
                      )}
                      :
                    </strong>{" "}
                    {t(
                      "philosophy.logic.handbook.adhominem_desc",
                      "De persoon aanvallen i.p.v. het argument.",
                    )}
                  </li>
                  <li>
                    <strong>
                      {t(
                        "philosophy.logic.handbook.nonsequitur_label",
                        "Non Sequitur",
                      )}
                      :
                    </strong>{" "}
                    {t(
                      "philosophy.logic.handbook.nonsequitur_desc",
                      "De conclusie volgt niet uit de premissen.",
                    )}
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// --- TYPES ---
type BlockType = "premise" | "conclusion" | "hidden_premise";

interface ArgumentBlock {
  id: string;
  type: BlockType;
  content: string;
}

interface SyllogismPuzzle {
  title: string;
  description: string;
  blocks: ArgumentBlock[];
  solution: string[]; // Array of IDs in correct order
}

export const ArgumentArchitect: React.FC = () => {
  const { t } = useTranslations();
  const [workspace, setWorkspace] = useState<ArgumentBlock[]>([]);
  const [puzzle, setPuzzle] = useState<SyllogismPuzzle | null>(null);
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<
    "idle" | "valid" | "invalid"
  >("idle");
  const [feedback, setFeedback] = useState("");
  const [showHandbook, setShowHandbook] = useState(false);

  // --- AI ACTIONS ---
  const generatePuzzle = async () => {
    setLoading(true);
    reset();

    try {
      const prompt = `
                Genereer een logica-puzzel voor VWO-studenten Filosofie.
                Onderwerp: Syllogismen (Deductie) of Drogredenen.
                
                Taak:
                Maak een redenering (Geldig of Ongeldig).
                Breek deze op in losse blokken (Premissen + Conclusie + eventueel 1 afleider/fout blok).
                
                Output JSON:
                {
                    "title": "Titel van de oefening (bijv. Modus Ponens)",
                    "description": "Opdracht: Sleep de blokken in de juiste logische volgorde.",
                    "blocks": [
                        { "id": "b1", "type": "premise", "content": "Alle mensen zijn sterfelijk" },
                        { "id": "b2", "type": "premise", "content": "Socrates is een mens" },
                        { "id": "b3", "type": "conclusion", "content": "Dus: Socrates is sterfelijk" },
                        { "id": "d1", "type": "premise", "content": "Sommige mensen zijn sterfelijk" } // Afleider
                    ],
                    "solution": ["b1", "b2", "b3"] // De juiste volgorde van ID's
                }
            `;
      const result = await geminiGenerate(prompt, "", { jsonMode: true });
      if (!result || !result.content) throw new Error("No response generated");
      const data = JSON.parse(result.content.replace(/```json|```/g, ""));
      setPuzzle(data);
      setPuzzle(data);
    } catch (e: any) {
      console.warn(
        "AI Generation failed (likely API Key missing), using fallback.",
      );
      // Fallback
      setPuzzle({
        title: "De Klassieker (Fallback)",
        description: "Reconstrueer het beroemde argument van Socrates.",
        blocks: [
          { id: "b1", type: "premise", content: "Alle mensen zijn sterfelijk" },
          { id: "b2", type: "premise", content: "Socrates is een mens" },
          {
            id: "b3",
            type: "conclusion",
            content: "Dus: Socrates is sterfelijk",
          },
          {
            id: "d1",
            type: "premise",
            content: "Sommige mensen zijn filosofen",
          },
          {
            id: "d2",
            type: "conclusion",
            content: "Dus: Alle filosofen zijn sterfelijk",
          },
        ],
        solution: ["b1", "b2", "b3"],
      });
    } finally {
      setLoading(false);
    }
  };

  // Load initial puzzle
  useEffect(() => {
    generatePuzzle();
  }, []);

  const addBlock = (block: ArgumentBlock) => {
    if (validationResult !== "idle") {
      setValidationResult("idle");
      setFeedback("");
    }
    if (workspace.find((b) => b.id === block.id)) return;
    setWorkspace([...workspace, block]);
  };

  const removeBlock = (id: string) => {
    setWorkspace(workspace.filter((b) => b.id !== id));
    setValidationResult("idle");
  };

  const validateArgument = () => {
    if (!puzzle || workspace.length === 0) return;

    const currentIds = workspace.map((b) => b.id);
    const isCorrect =
      JSON.stringify(currentIds) === JSON.stringify(puzzle.solution);

    if (isCorrect) {
      setValidationResult("valid");
      setFeedback(
        t(
          "philosophy.logic.feedback_success",
          "Perfect! Dit is een geldig deductief argument. De conclusie volgt noodzakelijk uit de premissen.",
        ),
      );
    } else {
      setValidationResult("invalid");
      setFeedback(
        t(
          "philosophy.logic.feedback_error",
          "Ongeldig. Controleer de logische volgorde: Maior (Algemeen) → Minor (Specifiek) → Conclusie.",
        ),
      );
    }
  };

  const reset = () => {
    setWorkspace([]);
    setValidationResult("idle");
    setFeedback("");
  };

  const COLORS = [
    "amber",
    "emerald",
    "sky",
    "violet",
    "fuchsia",
    "rose",
    "indigo",
    "teal",
  ];

  const getBlockStyle = (id: string) => {
    // Deterministic color based on ID char codes sum or just finding index in puzzle
    if (!puzzle) return "bg-white/5";
    const index = puzzle.blocks.findIndex((b) => b.id === id);
    const color = COLORS[index % COLORS.length];

    // Dynamic Tailwind classes are tricky if not safelisted.
    // Better to return specific full strings or style objects.
    // Using a map is safer for purging.

    switch (color) {
      case "amber":
        return "border-l-4 border-l-amber-500 bg-amber-500/10 border-amber-500/20 text-amber-100";
      case "emerald":
        return "border-l-4 border-l-emerald-500 bg-emerald-500/10 border-emerald-500/20 text-emerald-100";
      case "sky":
        return "border-l-4 border-l-sky-500 bg-sky-500/10 border-sky-500/20 text-sky-100";
      case "violet":
        return "border-l-4 border-l-violet-500 bg-violet-500/10 border-violet-500/20 text-violet-100";
      case "fuchsia":
        return "border-l-4 border-l-fuchsia-500 bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-100";
      case "rose":
        return "border-l-4 border-l-rose-500 bg-rose-500/10 border-rose-500/20 text-rose-100";
      case "indigo":
        return "border-l-4 border-l-indigo-500 bg-indigo-500/10 border-indigo-500/20 text-indigo-100";
      case "teal":
        return "border-l-4 border-l-teal-500 bg-teal-500/10 border-teal-500/20 text-teal-100";
      default:
        return "bg-white/5";
    }
  };

  return (
    <div className="w-full h-full p-8 font-sans text-slate-200 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <BrainCircuit className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white uppercase tracking-tight">
              {t("philosophy.logic.title")}
            </h2>
            <p className="text-sm text-slate-400 font-light">
              {puzzle ? puzzle.title : t("philosophy.logic.loading")}
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => setShowHandbook(true)}
            className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all border border-indigo-500/20"
            title={t("philosophy.logic.open_handbook", "Open Handboek")}
          >
            <BookOpen size={20} />
          </button>
          <button
            onClick={generatePuzzle}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin w-4 h-4" />
            ) : (
              <BrainCircuit className="w-4 h-4" />
            )}
            {loading
              ? t("philosophy.logic.loading")
              : t("philosophy.logic.new_puzzle")}
          </button>

          <button
            onClick={reset}
            className="p-2 hover:bg-amber-500/10 rounded-lg text-slate-400 hover:text-amber-400 transition-colors"
            title={t("philosophy.logic.reset_workshop", "Reset Workshop")}
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[500px]">
        {/* SIDEBAR: Bouwstenen */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <h3 className="text-[10px] uppercase tracking-widest text-slate-500 font-black ml-1">
            {t("philosophy.logic.available_blocks")}
          </h3>

          {loading ? (
            <div className="flex-1 flex items-center justify-center border border-white/5 rounded-2xl bg-black/20">
              <Loader2 className="w-8 h-8 text-amber-500/50 animate-spin" />
            </div>
          ) : puzzle ? (
            <div className="flex-1 bg-black/40 backdrop-blur-md rounded-2xl border border-white/5 p-4 overflow-y-auto space-y-3">
              {puzzle.blocks.map((block) => {
                const isInWorkspace = workspace.find((w) => w.id === block.id);
                return (
                  <button
                    key={block.id}
                    onClick={() => addBlock(block)}
                    disabled={!!isInWorkspace}
                    className={`w-full text-left p-4 rounded-xl border border-white/5 transition-all duration-300 group relative
                                            ${isInWorkspace ? "opacity-20 cursor-not-allowed scale-95" : "hover:scale-[1.02] cursor-pointer shadow-lg"}
                                            ${getBlockStyle(block.id)}
                                        `}
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-1 text-slate-500 group-hover:text-amber-400 transition-colors">
                        <GripVertical className="w-4 h-4" />
                      </span>
                      <div>
                        <span className="text-[9px] uppercase font-black tracking-widest opacity-60 mb-1 block">
                          {block.type === "premise"
                            ? t("philosophy.logic.block_premise", "Premisse")
                            : block.type === "conclusion"
                              ? t(
                                  "philosophy.logic.block_conclusion",
                                  "Conclusie",
                                )
                              : t("philosophy.logic.block_hidden", "Verzwegen")}
                        </span>
                        <span className="text-sm font-medium leading-relaxed">
                          {block.content}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        {/* WORKSPACE: De Architectuur */}
        <div className="lg:col-span-8 flex flex-col gap-4 relative">
          <h3 className="text-[10px] uppercase tracking-widest text-slate-500 font-black ml-1">
            {t("philosophy.logic.your_construction")}
          </h3>

          <div
            className={`flex-1 rounded-2xl border-2 border-dashed p-6 relative transition-all duration-700 flex flex-col gap-2
                        ${
                          validationResult === "valid"
                            ? "border-emerald-500/30 bg-emerald-500/5"
                            : validationResult === "invalid"
                              ? "border-rose-500/30 bg-rose-500/5"
                              : "border-white/10 bg-black/20"
                        }
                    `}
          >
            {workspace.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 pointer-events-none p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <BrainCircuit className="w-8 h-8 opacity-20" />
                </div>
                <p className="text-sm font-light italic">
                  {t("philosophy.logic.empty_state")}
                </p>
              </div>
            )}

            <div className="space-y-2">
              {workspace.map((block, index) => (
                <div
                  key={block.id}
                  className="relative transition-all duration-500"
                >
                  {/* Connecting Arrow */}
                  {index > 0 && (
                    <div className="flex justify-center py-2 text-slate-600/50">
                      <ArrowDown size={20} />
                    </div>
                  )}

                  <div
                    className={`p-5 rounded-2xl border border-white/10 shadow-2xl flex justify-between items-center group animate-in slide-in-from-left-4 duration-500 ${getBlockStyle(block.id)}`}
                  >
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-black tracking-widest opacity-40 mb-1">
                        {block.type === "premise"
                          ? `${t("philosophy.logic.block_premise", "Premisse")} ${index + 1}`
                          : t("philosophy.logic.block_conclusion", "Conclusie")}
                      </span>
                      <span className="text-sm md:text-base font-medium">
                        {block.content}
                      </span>
                    </div>
                    <button
                      onClick={() => removeBlock(block.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all duration-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* VALIDATIE CONTROLS */}
          <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/5 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
            {/* Feedback Tekst */}
            <div className="flex-1 text-sm border-l-2 border-white/5 pl-4 py-1">
              {validationResult === "valid" && (
                <div className="flex items-center gap-2 text-emerald-400 font-black uppercase tracking-widest text-[10px] mb-1">
                  <CheckCircle2 className="w-4 h-4" />{" "}
                  {t("philosophy.logic.success")}
                </div>
              )}
              {validationResult === "invalid" && (
                <div className="flex items-center gap-2 text-rose-400 font-black uppercase tracking-widest text-[10px] mb-1">
                  <AlertTriangle className="w-4 h-4" />{" "}
                  {t("philosophy.logic.error")}
                </div>
              )}
              <p className="text-slate-400 font-light leading-relaxed italic">
                {feedback || t("philosophy.logic.empty_state")}
              </p>
            </div>

            {/* Validate Button */}
            <button
              onClick={validateArgument}
              disabled={workspace.length === 0}
              className={`
                                w-full md:w-auto px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-500 shadow-xl
                                ${
                                  validationResult === "valid"
                                    ? "bg-emerald-500 hover:bg-emerald-400 text-white"
                                    : validationResult === "invalid"
                                      ? "bg-rose-500 hover:bg-rose-400 text-white"
                                      : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 hover:border-amber-500/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:scale-105 active:scale-95"
                                }
                                disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:scale-100
                            `}
            >
              <Play
                className={`w-4 h-4 ${validationResult === "idle" ? "fill-current drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]" : ""}`}
              />
              <span
                className={
                  validationResult === "idle"
                    ? "drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]"
                    : ""
                }
              >
                {validationResult === "idle"
                  ? t("philosophy.logic.validate")
                  : t("philosophy.logic.retry")}
              </span>
            </button>
          </div>
        </div>
      </div>
      <LogicHandbook
        isOpen={showHandbook}
        onClose={() => setShowHandbook(false)}
      />
    </div>
  );
};
