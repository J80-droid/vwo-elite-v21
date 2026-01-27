/* eslint-disable @typescript-eslint/no-explicit-any */
import { geminiGenerate } from "@shared/api/geminiBase";
import { useTranslations } from "@shared/hooks/useTranslations";
import { AnimatePresence, motion } from "framer-motion";
import {
  Award,
  BookOpen,
  Brain,
  ChevronRight,
  FileText,
  Globe,
  HelpCircle,
  Microscope,
  RefreshCw,
  Scale,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from "lucide-react";
import React, { useState } from "react";

// --- THEORY HUD ---
const ExamTheoryHUD = ({
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
                <ShieldCheck className="text-indigo-400" />
                <span className="text-sm font-black text-white uppercase tracking-widest">
                  {t("philosophy.exam.theory_hud.title", "Examen Theorie")}
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
              <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/10">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck size={16} className="text-indigo-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">
                    {t(
                      "philosophy.exam.theory_hud.answer_model_title",
                      "Het Antwoordmodel",
                    )}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t(
                    "philosophy.exam.theory_hud.answer_model_desc",
                    "Op het VWO-examen word je afgerekend op je <0>argumentatiestructuur</0>.",
                    {
                      components: [
                        <span className="text-white font-bold italic" />,
                      ],
                    },
                  )}
                  <br />
                  <br />
                  {t(
                    "philosophy.exam.theory_hud.always_do",
                    "Dwing jezelf om altijd:",
                  )}
                </p>
                <ul className="text-xs text-slate-300 mt-2 space-y-1 list-disc pl-4">
                  <li>
                    {t(
                      "philosophy.exam.theory_hud.step_def",
                      "De <0>definitie</0> te geven van het kernbegrip",
                      { components: [<strong />] },
                    )}
                  </li>
                  <li>
                    {t(
                      "philosophy.exam.theory_hud.step_cite",
                      "Direct uit de <0>tekst te citeren</0> (met regelnummer)",
                      { components: [<strong />] },
                    )}
                  </li>
                  <li>
                    {t(
                      "philosophy.exam.theory_hud.step_conc",
                      "Een <0>conclusie</0> te trekken die de vraag beantwoordt",
                      { components: [<strong />] },
                    )}
                  </li>
                </ul>
              </div>

              <div className="p-6 rounded-2xl bg-black/40 border border-white/5 flex items-start gap-3">
                <HelpCircle
                  size={20}
                  className="text-amber-400 shrink-0 mt-1"
                />
                <div>
                  <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-1">
                    {t(
                      "philosophy.exam.theory_hud.points_title",
                      "Puntenscore",
                    )}
                  </h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-light">
                    {t(
                      "philosophy.exam.theory_hud.points_desc",
                      "Onze AI kijkt naar de kernpunten van het officiële correctievoorschrift. Mis geen enkel punt door te vaag te blijven!",
                    )}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/10">
                <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2">
                  {t(
                    "philosophy.exam.theory_hud.mistakes_title",
                    "Veelgemaakte Fouten",
                  )}
                </h4>
                <ul className="text-xs text-slate-400 space-y-1 list-disc pl-4">
                  <li>
                    {t(
                      "philosophy.exam.theory_hud.mistake_1",
                      "Geen definitie geven van het begrip",
                    )}
                  </li>
                  <li>
                    {t(
                      "philosophy.exam.theory_hud.mistake_2",
                      "Alleen parafraseren i.p.v. analyseren",
                    )}
                  </li>
                  <li>
                    {t(
                      "philosophy.exam.theory_hud.mistake_3",
                      "Geen directe verwijzing naar de brontekst",
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
interface ExamQuestion {
  id: string;
  domain: string;
  points: number;
  sourceText: string;
  question: string;
  correctKeywords: string[];
  answeringStructure: string[];
}

type TrainerState = "setup" | "generating" | "exam" | "feedback";

const getDomains = (t: any) => [
  {
    id: "ethics",
    label: t("philosophy.exam.domains.ethics.label"),
    icon: Scale,
    description: t("philosophy.exam.domains.ethics.desc"),
  },
  {
    id: "anthropology",
    label: t("philosophy.exam.domains.anthropology.label"),
    icon: User,
    description: t("philosophy.exam.domains.anthropology.desc"),
  },
  {
    id: "knowledge",
    label: t("philosophy.exam.domains.knowledge.label"),
    icon: Microscope,
    description: t("philosophy.exam.domains.knowledge.desc"),
  },
  {
    id: "society",
    label: t("philosophy.exam.domains.society.label"),
    icon: Globe,
    description: t("philosophy.exam.domains.society.desc"),
  },
];

export const ExamTrainer: React.FC = () => {
  const { t } = useTranslations();
  const DOMAINS = getDomains(t);
  const [state, setState] = useState<TrainerState>("setup");
  const [activeQuestion, setActiveQuestion] = useState<ExamQuestion | null>(
    null,
  );
  const [activeStep, setActiveStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [showTheory, setShowTheory] = useState(false);

  // --- AI ACTIONS ---

  const generateExamQuestion = async (domainId: string) => {
    setState("generating");
    try {
      const domainLabel =
        DOMAINS.find((d) => d.id === domainId)?.label || "Filosofie";

      const prompt = `
                Je bent een constructeur van het Centraal Eindexamen Filosofie VWO 2025.
                Onderwerp: ${domainId === "anthropology" ? "De vraag naar de mens in relatie tot techniek en wetenschap" : domainId}.
                
                Genereer 1 pittige examenvraag met brontekst.
                
                EISEN:
                1. Niveau: VWO 6 (Abstract, complex).
                2. Inclusief een korte brontekst (fictief of citaat van een filosoof uit de syllabus).
                3. De vraag moet een "Leg uit"-structuur hebben waarbij een begrip toegepast moet worden.
                4. Output puur JSON.

                JSON Format:
                {
                    "sourceText": "Hier de filosofische tekst of casus...",
                    "question": "De vraagstelling (bijv: Leg uit aan de hand van tekst 1 dat...)",
                    "points": 3,
                    "correctKeywords": ["Begrip 1", "Begrip 2", "Naam Filosoof"],
                    "answeringStructure": [
                        "Stap 1: Definieer het begrip...",
                        "Stap 2: Pas toe op regel 4 van de tekst...",
                        "Stap 3: Conclusie..."
                    ]
                }
            `;

      const result = await geminiGenerate(prompt, "", { jsonMode: true });
      if (!result || !result.content) throw new Error("No response generated");
      const data = JSON.parse(result.content.replace(/```json|```/g, ""));

      const newQuestion: ExamQuestion = {
        id: Date.now().toString(),
        domain: domainLabel,
        ...data,
      };

      setActiveQuestion(newQuestion);
      setAnswers(new Array(newQuestion.answeringStructure.length).fill(""));
      setActiveStep(0);
      setState("exam");
    } catch (error) {
      console.error("Gen Error:", error);
      alert(
        t(
          "philosophy.exam.error_generating",
          "Fout bij genereren. Probeer opnieuw.",
        ),
      );
      setState("setup");
    }
  };

  const gradeExamAnswer = async () => {
    if (!activeQuestion) return;
    setIsSubmitting(true);

    try {
      const prompt = `
                Je bent een strenge corrector. Hier is het correctievoorschrift (answeringStructure) en het antwoord van de leerling.
                Context: VWO Filosofie Eindexamen Training.
                Brontekst: ${activeQuestion.sourceText}
                Vraag: ${activeQuestion.question}
                
                Antwoord van de student (gestructureerd):
                ${activeQuestion.answeringStructure.map((s, i) => `${s}: ${answers[i]}`).join("\n")}
                
                Taak:
                1. Beoordeel het antwoord STRENG volgens VWO-normen.
                2. Controleer op de trefwoorden: ${activeQuestion.correctKeywords.join(", ")}.
                3. Geef punten (Max: ${activeQuestion.points}).
                4. Geef feedback in JSON.

                Return JSON ONLY:
                {
                  "finalScore": 0.0, // Decimals allowed
                  "totalPoints": ${activeQuestion.points},
                  "stepFeedback": ["Feedback stap 1...", "Feedback stap 2..."],
                  "overallComment": "Korte, directe feedback. Benader de leerling met 'u' of neutraal."
                }
            `;

      const result = await geminiGenerate(prompt, "", { jsonMode: true });
      if (!result || !result.content) throw new Error("No response generated");
      const data = JSON.parse(result.content.replace(/```json|```/g, ""));

      setFeedback(data);
      setState("feedback");
    } catch (error) {
      console.error("Grading Error:", error);
      alert(t("philosophy.exam.error_grading", "Fout bij nakijken."));
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- NAVIGATION ---
  const handleNext = () => {
    if (
      activeQuestion &&
      activeStep < activeQuestion.answeringStructure.length - 1
    )
      setActiveStep(activeStep + 1);
  };
  const handleBack = () => {
    if (activeStep > 0) setActiveStep(activeStep - 1);
  };
  const updateAnswer = (val: string) => {
    const newAnswers = [...answers];
    newAnswers[activeStep] = val;
    setAnswers(newAnswers);
  };
  const resetTrainer = () => {
    setState("setup");
    setFeedback(null);
    setActiveQuestion(null);
    setAnswers([]);
  };

  return (
    <div className="w-full h-full bg-[#020408] flex flex-col p-8 gap-8 overflow-y-auto">
      {/* Header Info */}
      <div className="flex justify-between items-center bg-white/5 p-6 rounded-[2rem] border border-white/10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400">
            <FileText size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">
              {t("philosophy.exam.title")}
            </h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mt-1">
              {state === "setup"
                ? t("philosophy.exam.select_domain")
                : activeQuestion?.domain || t("philosophy.exam.default_domain")}
            </p>
          </div>
        </div>
        {state !== "setup" && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTheory(true)}
              className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all border border-indigo-500/20"
              title={t("philosophy.exam.open_theory", "Open Theorie")}
            >
              <BookOpen size={18} />
            </button>
            <button
              onClick={resetTrainer}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all text-xs font-bold uppercase tracking-widest"
            >
              <RefreshCw size={14} /> {t("philosophy.exam.reset")}
            </button>
          </div>
        )}
      </div>

      {/* --- SETUP MODE --- */}
      {state === "setup" && (
        <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-500/20">
              <Sparkles className="w-10 h-10 text-indigo-400" />
            </div>
            <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-4">
              {t("philosophy.exam.setup.title")}
            </h3>
            <p className="text-slate-400 max-w-lg mx-auto text-lg font-light">
              {t("philosophy.exam.setup.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
            {DOMAINS.map((domain) => {
              const Icon = domain.icon;
              return (
                <button
                  key={domain.id}
                  onClick={() => generateExamQuestion(domain.id)}
                  className="p-8 rounded-3xl bg-white/5 border border-white/5 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all group text-left relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110">
                    <Icon size={80} />
                  </div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:bg-indigo-500 text-slate-400 group-hover:text-white transition-colors">
                      <Icon size={24} />
                    </div>
                    <h4 className="text-2xl font-black text-white mb-2">
                      {domain.label}
                    </h4>
                    <p className="text-sm text-slate-500 font-medium">
                      {domain.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* --- GENERATING STATE --- */}
      {state === "generating" && (
        <div className="flex-1 flex flex-col items-center justify-center text-center animate-pulse">
          <Brain className="w-24 h-24 text-indigo-500 mb-8 opacity-50" />
          <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-2">
            {t("philosophy.exam.generating.title")}
          </h3>
          <p className="text-slate-500 font-mono text-sm">
            {t("philosophy.exam.generating.subtitle")}
          </p>
        </div>
      )}

      {/* --- EXAM / FEEDBACK MODE --- */}
      {(state === "exam" || state === "feedback") && activeQuestion && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-0 animate-in slide-in-from-bottom-8 duration-700">
          {/* LEFT: SOURCE & QUESTION */}
          <div className="flex flex-col gap-6 h-full min-h-0">
            <div className="flex-1 bg-white/[0.02] border border-white/10 rounded-[2rem] p-8 flex flex-col gap-6 overflow-hidden relative">
              <div className="flex items-center gap-3 shrink-0">
                <BookOpen size={18} className="text-indigo-400" />
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">
                  {t("philosophy.exam.source_text")}
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <p className="text-xl font-serif text-slate-300 leading-relaxed italic border-l-4 border-white/5 pl-6 py-2">
                  "{activeQuestion.sourceText}"
                </p>
              </div>
              <div className="p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl relative shrink-0">
                <HelpCircle className="absolute top-4 right-4 text-indigo-500/50" />
                <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-2">
                  {t("philosophy.exam.question_label")} ({activeQuestion.points}
                  pt):
                </h4>
                <p className="text-white text-lg font-bold leading-snug">
                  {activeQuestion.question}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT: ANSWERING */}
          <div className="flex flex-col gap-6 h-full min-h-0">
            <div className="flex-1 bg-black/40 border border-white/10 rounded-[2rem] flex flex-col shadow-2xl relative overflow-hidden">
              {/* Progress Header */}
              <div className="flex p-6 gap-2 border-b border-white/5 shrink-0">
                {activeQuestion.answeringStructure.map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${i === activeStep ? "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" : i < activeStep ? "bg-indigo-900/50" : "bg-white/5"}`}
                  />
                ))}
              </div>

              <div className="flex-1 p-8 flex flex-col gap-6 overflow-hidden">
                <div className="flex justify-between items-center shrink-0">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] truncate mr-4">
                    {t("philosophy.exam.step")} {activeStep + 1}:{" "}
                    {activeQuestion.answeringStructure[activeStep]}
                  </h4>
                  <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20 whitespace-nowrap">
                    {t("philosophy.exam.structure")}
                  </span>
                </div>

                <textarea
                  value={answers[activeStep] || ""}
                  onChange={(e) => updateAnswer(e.target.value)}
                  readOnly={state === "feedback"} // Read-only in feedback mode
                  placeholder={`${t("philosophy.exam.answer_placeholder")} ${activeStep + 1}...`}
                  className="flex-1 bg-transparent border-none outline-none text-lg text-white font-light placeholder:text-slate-700 resize-none leading-relaxed p-0 focus:ring-0"
                />
              </div>

              {/* Controls */}
              {state === "exam" && (
                <div className="p-8 border-t border-white/5 flex justify-between gap-4 bg-white/[0.02] shrink-0">
                  <button
                    onClick={handleBack}
                    disabled={activeStep === 0}
                    className="px-6 py-4 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors disabled:opacity-10"
                  >
                    {t("philosophy.exam.previous")}
                  </button>

                  <div className="flex gap-3">
                    {activeStep <
                    activeQuestion.answeringStructure.length - 1 ? (
                      <button
                        onClick={handleNext}
                        disabled={!answers[activeStep]}
                        className="px-8 py-4 bg-white text-black rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-xl disabled:opacity-20 disabled:scale-100"
                      >
                        {t("philosophy.exam.next")} <ChevronRight size={16} />
                      </button>
                    ) : (
                      <button
                        onClick={gradeExamAnswer}
                        disabled={answers.some((a) => !a) || isSubmitting}
                        className="px-10 py-4 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-indigo-500/10 hover:shadow-indigo-500/20 disabled:opacity-20"
                      >
                        {isSubmitting ? (
                          <RefreshCw className="animate-spin" />
                        ) : (
                          <Award size={18} />
                        )}
                        {t("philosophy.exam.grade")}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* FEEDBACK OVERLAY */}
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="p-8 bg-black/90 backdrop-blur-xl border border-indigo-500/30 rounded-[2rem] shadow-2xl overflow-y-auto max-h-[50vh] absolute bottom-0 left-0 right-0 z-20 m-8"
                >
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-500 flex items-center justify-center text-white font-black text-3xl shadow-lg border-4 border-indigo-400">
                        {feedback.finalScore}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                          {t("philosophy.exam.final_grade")}
                        </h4>
                        <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">
                          {t("philosophy.exam.score_label")}:{" "}
                          {feedback.totalPoints}{" "}
                          {t("philosophy.exam.points_suffix")}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={resetTrainer}
                      className="p-3 hover:bg-white/10 rounded-full transition-colors"
                    >
                      <RefreshCw size={20} className="text-slate-400" />
                    </button>
                  </div>
                  <p className="text-white italic text-lg mb-6 leading-relaxed border-l-4 border-indigo-500 pl-4 bg-indigo-500/5 py-4 pr-4 rounded-r-xl">
                    "{feedback.overallComment}"
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {feedback.stepFeedback.map((fb: string, i: number) => (
                      <div
                        key={i}
                        className="p-4 rounded-xl bg-white/5 border border-white/5"
                      >
                        <span className="text-[9px] font-black text-indigo-400/60 uppercase tracking-widest block mb-1">
                          {t("philosophy.exam.feedback_step")} {i + 1}
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {fb}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
      <ExamTheoryHUD isOpen={showTheory} onClose={() => setShowTheory(false)} />
    </div>
  );
};
