import { useSocraticTutor } from "@features/lesson/hooks/useSocraticTutor";
import { QuizQuestion } from "@features/quiz";
import { generateImageHF } from "@shared/api/huggingFaceService";
import { Language } from "@shared/types/common";
import { TFunction } from "@shared/types/i18n";
import { InteractiveComponentSchema } from "@shared/types/lesson.schema";
import { GeneratedLesson, Section } from "@shared/types/study";
import { MarkdownRenderer } from "@shared/ui/MarkdownRenderer";
import React, { useEffect, useRef, useState } from "react";
import { z } from "zod";

import { DidacticRenderer } from "./ui/DidacticRenderer";

type InteractiveComponent = z.infer<typeof InteractiveComponentSchema>;

// Extended section type for local state with image loading
interface LocalSection extends Section {
  id: string; // Enforce ID for stable keys
  imageError?: string | undefined;
}

interface LessonContentProps {
  lesson: GeneratedLesson & { quiz?: QuizQuestion[] };
  t: TFunction;
  lang: Language;
  highlightedConcepts: Set<string>;
  setHighlightedConcepts: React.Dispatch<React.SetStateAction<Set<string>>>;
  onConvertToFlashcards: (lesson: GeneratedLesson) => void;
  onSessionUpdate?: (lessonState: GeneratedLesson) => void;
}

export const LessonContent: React.FC<LessonContentProps> = ({
  lesson,
  t,
  lang,
  highlightedConcepts,
  setHighlightedConcepts,
  onConvertToFlashcards,
  onSessionUpdate
}) => {
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isMounted = useRef(true);

  // Initialize sections with stable IDs
  const [sections, setSections] = useState<LocalSection[]>(() =>
    (lesson?.sections || []).map(s => ({
      ...s,
      // Use existing ID or generate one. Stable hash prefered if re-renders happen, but random is fine for init.
      // ideally backend provides IDs. For now, randomUUID or fallback.
      id: s.id || crypto.randomUUID?.() || Math.random().toString(36).substr(2, 9),
      imageError: undefined
    }))
  );

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // Socratic Tutor Hook
  const { feedback, isThinking, analyzeModel } = useSocraticTutor();

  // Ref-Sync Pattern: Keep callbacks stable without triggering effects
  const onSessionUpdateRef = useRef(onSessionUpdate);
  useEffect(() => {
    onSessionUpdateRef.current = onSessionUpdate;
  }, [onSessionUpdate]);

  const lessonRef = useRef(lesson);
  useEffect(() => {
    lessonRef.current = lesson;
  }, [lesson]);

  // Simulating debounce/auto-save (Optimized & Stable)
  useEffect(() => {
    const updateCallback = onSessionUpdateRef.current;
    if (updateCallback) {
      if (!isSaving) setIsSaving(true);
      const timer = setTimeout(() => setIsSaving(false), 800);

      // We use the Ref-Sync values to break identity loops
      updateCallback({
        ...lessonRef.current,
        sections: sections as unknown as Section[]
      });

      return () => clearTimeout(timer);
    }
    return undefined;
    // Effect ONLY fires when 'sections' (the actual data) changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections]);

  const handleInteraction = (index: number, newConfig: InteractiveComponent['config']) => {
    setSections(prev => {
      const next = [...prev];
      if (next[index]?.interactive) {
        // Type-safe update of the interactive config
        next[index] = {
          ...next[index],
          interactive: {
            ...next[index].interactive,
            config: newConfig
          } as InteractiveComponent,
        };
      }
      return next;
    });
  };

  const handleGenerateImage = async (
    sectionIndex: number,
    imagePrompt: string,
  ) => {
    // Set loading state
    setSections(currentSections => {
      const newSections = [...currentSections];
      const section = newSections[sectionIndex];
      if (!section) return currentSections;

      newSections[sectionIndex] = {
        ...section,
        imageUrl: "loading",
        imageError: undefined,
      };
      return newSections;
    });

    try {
      const imageUrl = await generateImageHF(imagePrompt, undefined, lang);
      if (!isMounted.current) return;

      setSections(currentSections => {
        const newSections = [...currentSections];
        const section = newSections[sectionIndex];
        if (!section) return currentSections;

        newSections[sectionIndex] = {
          ...section,
          imageUrl: imageUrl || undefined,
          imageError: undefined,
        };
        return newSections;
      });
    } catch (e: unknown) {
      if (!isMounted.current) return;
      console.error(e);
      let errorMessage = t("lesson.image_error", "Kan afbeelding niet genereren.");

      const errMsg = e instanceof Error ? e.message : String(e);

      if (errMsg.includes("opstarten")) {
        errorMessage = errMsg;
      } else if (errMsg.includes("API Key")) {
        errorMessage = t("lesson.error.api_key_missing", "VITE_HF_API_KEY mist!");
      }

      setSections(currentSections => {
        const newSections = [...currentSections];
        const section = newSections[sectionIndex];
        if (!section) return currentSections;

        newSections[sectionIndex] = {
          ...section,
          imageUrl: undefined,
          imageError: errorMessage,
        };
        return newSections;
      });
    }
  };

  // Extract quiz from practiceQuestions if available (backwards compatibility)
  const quizQuestions: QuizQuestion[] = lesson?.quiz || [];

  return (
    <div className="space-y-6 pdf-content" id={`lesson - content - ${lesson.id} `}>
      {/* Quiz Section */}
      <div
        className="bg-obsidian-950 p-6 sm:p-8 rounded-2xl border border-obsidian-800 relative"
        id="lesson-quiz"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl">✍️</span>
            {t("lesson.quiz_title", "Kennisquiz")}
          </h3>
          <button
            onClick={() => onConvertToFlashcards(lesson)}
            className="text-xs bg-obsidian-800 hover:bg-obsidian-700 text-slate-300 px-3 py-1.5 rounded-lg border border-obsidian-700 transition-colors flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="inline mr-1"
            >
              <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            </svg>
            {t("lesson.make_flashcards", "Maak Flitskaarten")}
          </button>
        </div>
        {quizQuestions.length > 0 ? (
          <div className="space-y-4">
            {quizQuestions.map((q: QuizQuestion, qIdx: number) => {
              // Backward compatibility for question/text field
              const questionText = q.text || (q as unknown as { question: string }).question || t("lesson.question_fallback", "Vraag zonder tekst");

              return (
                <div key={qIdx} className="glass p-4 rounded-lg">
                  <div className="font-semibold text-white mb-2">
                    {qIdx + 1}. <MarkdownRenderer content={questionText} className="inline" />
                  </div>

                  {q.contextReference && (
                    <span className="text-[10px] bg-electric/10 text-electric px-2 py-0.5 rounded border border-electric/20 mb-3 inline-block">
                      Context: {q.contextReference}
                    </span>
                  )}

                  {q.hint && (
                    <details className="mb-3">
                      <summary className="text-xs text-gold/80 cursor-pointer hover:text-gold transition-colors font-medium">
                        💡 {t("lesson.hint", "Hint")}
                      </summary>
                      <div className="mt-2 text-xs text-slate-400 pl-4 border-l border-gold/30 italic">
                        <MarkdownRenderer content={q.hint} />
                      </div>
                    </details>
                  )}

                  <ul className="list-disc list-inside text-slate-300 text-sm space-y-1 mb-3">
                    {q.options?.map((opt: string, optIdx: number) => (
                      <li
                        key={optIdx}
                        className={
                          optIdx === q.correctAnswerIndex
                            ? "text-emerald-400 font-medium"
                            : ""
                        }
                      >
                        {opt} {optIdx === q.correctAnswerIndex && `(${t("common.correct", "Correct")})`}
                      </li>
                    ))}
                  </ul>

                  {q.solutionSteps ? (
                    <details className="mt-3 bg-obsidian-950/50 rounded-lg border border-white/5 overflow-hidden">
                      <summary className="px-3 py-2 text-xs font-bold text-slate-300 cursor-pointer hover:bg-white/5 transition-colors">
                        ✅ {t("lesson.full_solution", "Volledige Uitwerking")}
                      </summary>
                      <div className="p-4 space-y-2 border-t border-white/5">
                        <ol className="list-decimal list-inside text-sm text-slate-400 space-y-1.5">
                          {q.solutionSteps.map((step, sIdx) => (
                            <li key={sIdx}><MarkdownRenderer content={step} /></li>
                          ))}
                        </ol>
                        {q.final_answer_latex && (
                          <div className="mt-3 pt-3 border-t border-white/5 text-emerald-400 font-black tracking-tight">
                            Antwoord: {q.final_answer_latex}
                          </div>
                        )}
                      </div>
                    </details>
                  ) : (
                    <div className="text-slate-400 text-xs mt-2">
                      <span className="font-medium">
                        {t("lesson.explanation", "Uitleg")}:
                      </span>{" "}
                      <MarkdownRenderer content={q.explanation || ""} className="inline" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-slate-400">
            {t("lesson.no_quiz", "Geen quiz beschikbaar voor deze les.")}
          </p>
        )}
      </div>

      {/* Key Concepts & Pitfalls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Key Concepts */}
        <div className="bg-obsidian-900/30 p-4 rounded-xl border border-white/5">
          <h3 className="text-sm font-black uppercase tracking-widest text-electric mb-3">
            {t.lesson?.key_concepts || "Kernbegrippen"}
          </h3>
          <div className="flex flex-wrap gap-2">
            {lesson?.keyConcepts?.map((concept: string, i: number) => {
              const isSelected = highlightedConcepts.has(concept);
              return (
                <button
                  key={i}
                  onClick={() => {
                    const willBeSelected = !highlightedConcepts.has(concept);
                    setHighlightedConcepts((prev) => {
                      const next = new Set(prev);
                      if (next.has(concept)) next.delete(concept);
                      else next.add(concept);
                      return next;
                    });

                    if (willBeSelected) {
                      const conceptLower = concept.toLowerCase();
                      const firstMatchIndex = sections.findIndex((s: Section) =>
                        (s.heading + " " + s.content)
                          .toLowerCase()
                          .includes(conceptLower),
                      );
                      if (
                        firstMatchIndex >= 0 &&
                        sectionRefs.current[firstMatchIndex]
                      ) {
                        setTimeout(() => {
                          sectionRefs.current[firstMatchIndex]?.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                          });
                        }, 100);
                      }
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-xs transition-all flex items-center gap-1.5 ${isSelected ? "bg-electric text-white font-bold" : "bg-electric/10 text-electric hover:bg-electric/20 border border-electric/10"}`}
                >
                  <MarkdownRenderer content={concept} className="inline-block" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Pitfalls (NIEUW) */}
        {lesson.pitfalls && lesson.pitfalls.length > 0 && (
          <div className="bg-rose-500/5 p-4 rounded-xl border border-rose-500/20">
            <h3 className="text-sm font-black uppercase tracking-widest text-rose-400 mb-3 flex items-center gap-2">
              <span className="text-lg">⚠️</span> {t("lesson.pitfalls", "Valkuilen")}
            </h3>
            <ul className="space-y-1.5">
              {lesson.pitfalls.map((pitfall: string, idx: number) => (
                <li key={idx} className="text-xs text-rose-200/70 flex items-start gap-2">
                  <span className="text-rose-500">•</span>
                  <MarkdownRenderer content={pitfall} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Sections */}
      {sections.map((section: LocalSection, i: number) => {
        const sectionText = (
          section.heading +
          " " +
          section.content
        ).toLowerCase();
        const matchingConcepts = Array.from(highlightedConcepts).filter(
          (c: string) => sectionText.includes(c.toLowerCase()),
        );
        const isHighlighted = matchingConcepts.length > 0;

        return (
          <div
            key={section.id}
            ref={(el) => {
              if (el) sectionRefs.current[i] = el;
            }}
            className={`border - l - 2 pl - 4 transition - all duration - 300 ${isHighlighted ? "border-gold bg-gold/10 rounded-r-lg py-3 pr-3 -ml-3" : "border-electric"} `}
          >
            {isHighlighted && (
              <div className="flex flex-wrap gap-1 mb-2">
                {matchingConcepts.map((c, j) => (
                  <span
                    key={j}
                    className="text-xs bg-gold/30 text-gold px-2 py-0.5 rounded-full"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}
            <h4
              className={`text - lg font - semibold mb - 2 ${isHighlighted ? "text-gold" : "text-white"} `}
            >
              {section?.heading}
            </h4>

            {/* Interactive Component */}
            {section.interactive && (
              <div className="my-6 p-4 bg-obsidian-900/50 border border-electric/20 rounded-xl relative group">
                {/* Status Indicator */}
                <div className={`absolute - top - 3 right - 0 text - [10px] px - 2 py - 0.5 rounded - full transition - opacity duration - 500 ${isSaving ? 'bg-emerald-500/20 text-emerald-400 opacity-100' : 'opacity-0'} `}>
                  {t("common.saving", "Saving state...")}
                </div>

                <DidacticRenderer
                  component={section.interactive}
                  onInteraction={(newConfig) => handleInteraction(i, newConfig)}
                  studentMastery={lesson?.didacticConfig?.mastery || 'novice'}
                  contextContent={section.content}
                />

                {/* The Teacher (Feedback Loop) */}
                <div className="mt-4 flex items-start gap-4">
                  <button
                    onClick={() => section.interactive && analyzeModel({
                      context: section.content,
                      studentState: section.interactive.config
                    })}
                    disabled={isThinking}
                    className="shrink-0 px-3 py-2 bg-electric/10 hover:bg-electric/20 text-electric text-xs font-semibold rounded-lg border border-electric/30 transition-all flex items-center gap-2"
                  >
                    {isThinking ? (
                      <span className="animate-pulse">Analyseren...</span>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        {t("lesson.check_insight", "Check mijn inzicht")}
                      </>
                    )}
                  </button>

                  {feedback && (
                    <div role="status" aria-live="polite" className="flex-1 bg-obsidian-950 p-3 rounded-lg border-l-2 border-gold text-sm text-slate-300 animate-in fade-in slide-in-from-left-2">
                      <span className="text-gold font-bold block text-xs mb-1 uppercase tracking-wider">AI Tutor</span>
                      {feedback}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Section Image */}
            {section.imageUrl && section.imageUrl !== "loading" ? (
              <div className="my-4 rounded-lg overflow-hidden border border-obsidian-800 relative group">
                <img
                  src={section.imageUrl}
                  alt={section.heading}
                  className="w-full max-h-96 object-contain bg-obsidian-950"
                />
              </div>
            ) : section.imagePrompt ? (
              <div className="my-4">
                <button
                  onClick={() => handleGenerateImage(i, section.imagePrompt!)}
                  className="flex items-center gap-2 text-xs bg-electric/10 text-electric hover:bg-electric/20 border border-electric/30 px-3 py-2 rounded-lg transition-colors"
                >
                  {section.imageUrl === "loading" && !section.imageError ? (
                    <>
                      <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      {t.lesson?.generating_image || "Afbeelding genereren..."}
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="3"
                          y="3"
                          width="18"
                          height="18"
                          rx="2"
                          ry="2"
                        ></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                      </svg>
                      {section.imageError
                        ? "Probeer opnieuw"
                        : t.lesson?.generate_image ||
                        "Genereer uitleg-afbeelding"}
                    </>
                  )}
                </button>
                {section.imageError && (
                  <p className="text-[11px] text-red-400 mt-2 flex items-center gap-1 font-medium">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    {section.imageError}
                  </p>
                )}
                <p className="text-[10px] text-slate-500 mt-1 ml-1">
                  {section.imagePrompt}
                </p>
              </div>
            ) : null}

            <div className="text-slate-300 leading-relaxed">
              <MarkdownRenderer content={section.content} />
            </div>

            {section.examples && section.examples.length > 0 && (
              <div className="mt-3 bg-obsidian-950 p-4 rounded-lg">
                <p className="text-sm font-medium text-gold mb-2">
                  {t.lesson?.examples || "Voorbeelden"}:
                </p>
                <ul className="list-disc list-inside text-slate-400 text-sm space-y-1">
                  {section.examples.map((ex: string, j: number) => (
                    <li key={j}><MarkdownRenderer content={ex} /></li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}

      {/* Context & Connections (Synergy) */}
      {(lesson.subjectConnections || lesson.crossCurricularConnections) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lesson.subjectConnections && lesson.subjectConnections.length > 0 && (
            <div className="bg-indigo-500/5 p-4 rounded-xl border border-indigo-500/20">
              <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-3 flex items-center gap-2">
                <span>🔗</span> {t("lesson.subject_connections", "Vakinhoudelijke Samenhang")}
              </h3>
              <ul className="space-y-2">
                {lesson.subjectConnections.map((conn, idx) => (
                  <li key={idx} className="text-xs text-indigo-200/70 border-l-2 border-indigo-500/30 pl-3 py-0.5">
                    <MarkdownRenderer content={conn} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {lesson.crossCurricularConnections && lesson.crossCurricularConnections.length > 0 && (
            <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/20">
              <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-3 flex items-center gap-2">
                <span>🌐</span> {t("lesson.cross_connections", "Interdisciplinaire Raakvlakken")}
              </h3>
              <ul className="space-y-2">
                {lesson.crossCurricularConnections.map((conn, idx) => (
                  <li key={idx} className="text-xs text-emerald-200/70 border-l-2 border-emerald-500/30 pl-3 py-0.5">
                    <MarkdownRenderer content={conn} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Practice Questions */}
      {lesson?.practiceQuestions && lesson.practiceQuestions.length > 0 && (
        <div className="bg-obsidian-950 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gold mb-4">
            {t("lesson.practice_questions", "Oefenvragen")}
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-slate-300">
            {lesson?.practiceQuestions?.map((q: string, i: number) => (
              <li key={i}><MarkdownRenderer content={q} /></li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};
