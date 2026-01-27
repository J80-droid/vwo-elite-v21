import { createEmptyCard, scheduleCard } from "@shared/api/fsrsService";
import { generatePodcastAudio } from "@shared/api/gemini";
import { generateImageHF } from "@shared/api/huggingFaceService";
import { LessonService } from "@shared/api/lessonService";
import { getTieredStorage } from "@shared/api/memory";
import { HtmlPorter } from "@shared/lib/HtmlPorter";
import {
    DidacticConfig,
    Flashcard,
    GenerationStage,
    LearningIntent,
    SavedLesson,
    SavedLessonSchema,
    SourceReliability,
    StudyMaterial,
    UserSettings,
} from "@shared/types/index";
import { useCallback, useEffect, useRef } from "react";

import { useDeleteStudyMaterial, useSaveFlashcard } from "../useLocalData";

export interface UseLessonActionsProps {
    subject: string;
    lang: string;
    settings: Partial<UserSettings>;
    lessonT: {
        progress_analyzing?: string;
        progress_generating?: string;
        progress_structuring?: string;
        progress_done?: string;
        no_quiz_questions?: string;
        podcast_error?: string;
        image_error?: string;
        [key: string]: string | undefined;
    };
    selectedMaterials: Set<string>;
    orderedMaterialIds: string[];
    materials: StudyMaterial[];
    setLoading: (loading: boolean) => void;
    loading: boolean;
    setError: (err: string | null) => void;
    setProgress: React.Dispatch<React.SetStateAction<number>>;
    setProgressStatus: (s: string) => void;
    setGenStage: (stage: GenerationStage) => void;
    setPodcastLoading: (id: string | null) => void;
    addLesson: (lesson: SavedLesson) => void;
    updateLesson: (id: string, updates: Partial<SavedLesson>) => void;
    setExpandedLessonId: (id: string | null) => void;
    logLessonGenerated: (subject: string, topic: string) => void;
    refetchMaterials: () => void;
    setSelectedMaterials: React.Dispatch<React.SetStateAction<Set<string>>>;
    savedLessons: SavedLesson[];
}

export function useLessonActions({
    subject,
    lang,
    settings,
    lessonT,
    selectedMaterials,
    orderedMaterialIds,
    materials,
    setLoading,
    loading,
    setError,
    setProgress,
    setProgressStatus,
    setGenStage,
    setPodcastLoading,
    addLesson,
    updateLesson,
    setExpandedLessonId,
    logLessonGenerated,
    refetchMaterials,
    setSelectedMaterials,
    savedLessons,
}: UseLessonActionsProps) {
    const deleteMaterialMutation = useDeleteStudyMaterial();
    const saveFlashcardMutation = useSaveFlashcard();
    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        return () => {
            abortControllerRef.current?.abort();
        };
    }, []);

    // AUDIT: Persistence Resilience - Recover generation state after refresh
    useEffect(() => {
        const isGenerating = sessionStorage.getItem(`lesson_gen_active_${subject}`);
        if (isGenerating && !loading) {
            // This is a hint to the user/UI that something was interrupted
            // In a full implementation, we might retry or show a 'Resume' toast
        }
    }, [subject, loading]);

    const handleGenerateLesson = useCallback(
        async (
            config: DidacticConfig | undefined = undefined,
            intent: LearningIntent = "summarize",
            sourceCheck: SourceReliability = "high",
        ) => {
            if (selectedMaterials.size === 0) return;

            abortControllerRef.current?.abort();
            abortControllerRef.current = new AbortController();
            const signal = abortControllerRef.current.signal;

            setLoading(true);
            setError(null);
            setProgress(0);
            setGenStage("ingest");
            setProgressStatus(lessonT.progress_analyzing || "Materialen analyseren...");

            sessionStorage.setItem(`lesson_gen_active_${subject}`, "true");

            try {
                const selected = orderedMaterialIds
                    .filter((id) => selectedMaterials.has(id))
                    .map((id) => materials.find((m) => m.id === id))
                    .filter(Boolean) as StudyMaterial[];

                // Transition to digestion stage
                setGenStage("digest");

                const rawResult = await LessonService.generateLesson(
                    subject,
                    selected,
                    intent,
                    sourceCheck,
                    lang,
                    settings?.aiConfig,
                    config,
                    (stage, pct) => {
                        if (signal.aborted) return;
                        setProgressStatus(stage);
                        setProgress(pct);
                    },
                    (status, msg) => {
                        // Stage transitions
                        if (["ingest", "digest", "cache", "generating", "complete"].includes(status)) {
                            setGenStage(status as GenerationStage);
                        }
                        // Status messages (including waiting/countdown)
                        if (["waiting", "switching", "generating", "rescueing"].includes(status)) {
                            setProgressStatus(msg);
                            // ELITE FIX: Ensure HUD re-renders even if progress percentage is static
                            // Using a tiny jitter to force React state detection if needed, or just a dummy update
                            setProgress(prev => prev + 0.0001);
                            setTimeout(() => setProgress(prev => Math.floor(prev)), 0);
                        }
                    }
                );

                if (signal.aborted) {
                    sessionStorage.removeItem(`lesson_gen_active_${subject}`);
                    setGenStage("idle");
                    return;
                }

                const parseResult = SavedLessonSchema.safeParse({
                    ...rawResult,
                    subject,
                    title: rawResult.title || `Les: ${subject}`,
                    createdAt: rawResult.createdAt || Date.now(),
                    sections: rawResult.sections || [],
                    id: rawResult.id || crypto.randomUUID(),
                });

                if (!parseResult.success) {
                    console.error("Zod Validation Failed:", parseResult.error);
                    setError(lessonT.error_lesson_validation || "Gegenereerde les is niet in het juiste formaat.");
                    setProgress(0);
                    setGenStage("idle");
                    sessionStorage.removeItem(`lesson_gen_active_${subject}`);
                    return;
                }

                const validResult = parseResult.data;
                setProgress(100);
                setGenStage("complete");
                setProgressStatus(lessonT.progress_done || "Klaar!");
                logLessonGenerated(subject, validResult.title);

                addLesson(validResult);
                setExpandedLessonId(validResult.id ?? null);
                sessionStorage.removeItem(`lesson_gen_active_${subject}`);

                try {
                    await getTieredStorage().onGeneratedLessonCreate({
                        ...validResult,
                        sections: undefined,
                        content: validResult.sections.map(s => s.content).join("\n\n")
                    });
                } catch (e) {
                    console.error("Failed to add lesson to memory:", e);
                }

                setTimeout(() => {
                    if (!signal.aborted) {
                        setGenStage("idle");
                        setProgress(0);
                        setProgressStatus("");
                    }
                }, 1000);
                return true;
            } catch (e: unknown) {
                if (signal.aborted) return false;
                console.error(e);
                setProgress(0);
                setGenStage("idle");
                setProgressStatus("");
                sessionStorage.removeItem(`lesson_gen_active_${subject}`);
                setError(e instanceof Error ? e.message : lessonT.error_lesson_generation || "Les generatie mislukt.");
                return false;
            } finally {
                if (!signal.aborted) {
                    setLoading(false);
                }
            }
        },
        [selectedMaterials, materials, orderedMaterialIds, subject, lang, settings, lessonT, addLesson, setExpandedLessonId, logLessonGenerated, setError, setLoading, setProgress, setProgressStatus, setGenStage]
    );

    const handleStartExam = useCallback(
        async (difficulty: "easy" | "medium" | "hard" = "medium") => {
            if (selectedMaterials.size === 0) return;

            setLoading(true);
            setError(null);
            setGenStage("generating");
            setProgressStatus(lessonT.progress_generating_exam || "Examen genereren...");

            try {
                const selected = orderedMaterialIds
                    .filter((id) => selectedMaterials.has(id))
                    .map((id) => materials.find((m) => m.id === id))
                    .filter(Boolean) as StudyMaterial[];

                const questions = await LessonService.generateExam(
                    selected,
                    difficulty,
                    lang,
                    settings?.aiConfig
                );

                const mockLesson: SavedLesson = {
                    id: crypto.randomUUID(),
                    title: `Examen: ${subject} (${new Date().toLocaleDateString()})`,
                    subject,
                    createdAt: Date.now(),
                    sections: [{
                        heading: "Examen Instructies",
                        content: "Dit examen is gegenereerd op basis van je geselecteerde materialen. Veel succes!",
                        examples: []
                    }],
                    quiz: questions,
                    keyConcepts: [],
                    pitfalls: [],
                    subjectConnections: [],
                    crossCurricularConnections: [],
                    practiceQuestions: []
                };

                addLesson(mockLesson);
                setExpandedLessonId(mockLesson.id);
                logLessonGenerated(subject, mockLesson.title);

                try {
                    await getTieredStorage().onGeneratedLessonCreate({
                        ...mockLesson,
                        sections: undefined,
                        content: "Examen met " + questions.length + " vragen."
                    });
                } catch (e) {
                    console.error("Failed to add exam to memory:", e);
                }

                setGenStage("complete");
                setProgress(100);
                setTimeout(() => setGenStage("idle"), 1000);
            } catch (e: unknown) {
                console.error(e);
                setError(e instanceof Error ? e.message : "Examen generatie mislukt.");
                setGenStage("idle");
            } finally {
                setLoading(false);
            }
        },
        [selectedMaterials, materials, orderedMaterialIds, subject, lang, settings, lessonT, addLesson, setExpandedLessonId, logLessonGenerated, setError, setLoading, setGenStage, setProgress, setProgressStatus]
    );

    const handleExportPDF = useCallback(
        (lessonToExport: SavedLesson) => {
            const element = document.getElementById(`lesson-content-${lessonToExport.id}`);
            if (!element) {
                const msg = lessonT.error_content_not_found || "Lesinhoud niet gevonden voor export. Klap de les eerst uit.";
                setError(msg);
                return;
            }

            // 🛡️ ELITE PDF HARDENING: Standard Color Pass
            // html2canvas fails on oklch() colors. We force a standard color pass.
            element.classList.add("pdf-export-mode");

            import("html2pdf.js")
                .then(({ default: html2pdf }) => {
                    const opt = {
                        margin: 10,
                        filename: `${lessonToExport.title || "les"}.pdf`,
                        image: { type: "jpeg" as const, quality: 0.98 },
                        html2canvas: { scale: 2, useCORS: true, logging: false },
                        jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "portrait" as const },
                    };

                    // We use the worker pattern to ensure the class is removed AFTER generation
                    const worker = html2pdf().set(opt).from(element);
                    worker.save().then(() => {
                        element.classList.remove("pdf-export-mode");
                    }).catch((err: unknown) => {
                        console.error("PDF Export Worker Error:", err);
                        element.classList.remove("pdf-export-mode");
                    });
                })
                .catch(() => {
                    element.classList.remove("pdf-export-mode");
                    setError(lessonT.error_pdf_exporter || "Kon PDF-exporthulp niet laden");
                });
        },
        [setError, lessonT]
    );

    const handleExportHTML = useCallback(
        (lessonToExport: SavedLesson) => {
            try {
                const html = HtmlPorter.generateEliteHtml(lessonToExport);
                const blob = new Blob([html], { type: "text/html" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${lessonToExport.title || "les"}_ELITE.html`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (e) {
                console.error("HTML Export failed:", e);
                setError(lessonT.error_html_exporter || "Kon HTML-export niet voltooien.");
            }
        },
        [setError, lessonT]
    );

    const handleConvertToFlashcards = useCallback(
        async (lessonToConvert: SavedLesson) => {
            const questionsToConvert = lessonToConvert.quiz || [];
            if (!questionsToConvert.length) {
                setError(lessonT.no_quiz_questions || "Geen quizvragen gevonden.");
                return;
            }

            try {
                let count = 0;
                for (const q of questionsToConvert) {
                    const card: Flashcard = createEmptyCard();
                    const options = q.options || [];
                    card.front = q.question || q.text || "";
                    card.back = `Correct: ${options[q.correctAnswerIndex ?? 0]}\n\nExplain: ${q.explanation || ""}`;
                    card.tags = [subject, "quiz-import", lessonToConvert.title];

                    const scheduled = scheduleCard(card, 3);
                    await saveFlashcardMutation.mutateAsync(scheduled);
                    try {
                        // AUDIT: Pass the card directly as mutation returns void
                        await getTieredStorage().onFlashcardCreate(scheduled as unknown as Flashcard);
                    } catch (e) {
                        console.error("Failed to add flashcard to memory:", e);
                    }
                    count++;
                }
                alert(`${count} ${lessonT.success_flashcards || "flitskaarten aangemaakt!"}`);
            } catch (e: unknown) {
                console.error(e);
                setError(e instanceof Error ? e.message : lessonT.error_flashcards || "Kon flitskaarten niet aanmaken");
            }
        },
        [lessonT, subject, saveFlashcardMutation, setError]
    );

    const handleDeleteMaterial = useCallback(
        async (id: string) => {
            try {
                await deleteMaterialMutation.mutateAsync(id);
                try {
                    await getTieredStorage().onStudyMaterialDelete(id);
                } catch (e) {
                    console.error("Failed to remove from memory:", e);
                }
                refetchMaterials();
                setSelectedMaterials((prev) => {
                    const next = new Set(prev);
                    next.delete(id);
                    return next;
                });
            } catch (e: unknown) {
                console.error(e);
                setError(e instanceof Error ? e.message : lessonT.error_delete_material || "Kon materiaal niet verwijderen");
            }
        },
        [deleteMaterialMutation, refetchMaterials, setSelectedMaterials, setError, lessonT]
    );

    const handleGeneratePodcast = useCallback(
        async (lesson: SavedLesson) => {
            if (!lesson.id) return;
            setPodcastLoading(lesson.id);
            setError(null);

            try {
                const script = `${lesson.title}\n\n${lesson.summary}\n\n${lesson.sections.map((s) => `${s.heading}: ${s.content}`).join("\n\n")}\n\n${lesson.practiceQuestions ? "Oefenvragen: " + lesson.practiceQuestions.join(". ") : ""}`.trim();
                const base64Audio = await generatePodcastAudio(script, settings?.aiConfig);

                if (base64Audio) {
                    const audioBlob = new Blob([Uint8Array.from(atob(base64Audio), (c) => c.charCodeAt(0))], { type: "audio/mp3" });
                    const url = URL.createObjectURL(audioBlob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${lesson.title.replace(/[^a-zA-Z0-9]/g, "_")}_podcast.mp3`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }
            } catch (err: unknown) {
                console.error(err);
                setError(err instanceof Error ? err.message : lessonT.podcast_error || "Podcast generatie mislukt.");
            } finally {
                setPodcastLoading(null);
            }
        },
        [settings, lessonT, setError, setPodcastLoading]
    );

    const handleGenerateImage = useCallback(
        async (lessonId: string, sectionHeading: string) => {
            const lessonToUpdate = savedLessons.find((l) => l.id === lessonId);
            if (!lessonToUpdate) return;

            try {
                const section = lessonToUpdate.sections.find(s => s.heading === sectionHeading);
                if (!section) return;

                const updateSections = (updatedSection: Partial<typeof section>) => {
                    const newSections = lessonToUpdate.sections.map(s =>
                        s.heading === sectionHeading ? { ...s, ...updatedSection } : s
                    );
                    updateLesson(lessonId, { sections: newSections });
                };

                // AUDIT: Instead of putting "loading" in imageUrl (data pollution),
                // we keep it as a UI concern. For now, maintaining compatibility by clearing error.
                updateSections({ imageUrl: "loading", imageError: undefined });

                const imageUrl = await generateImageHF(
                    section.imagePrompt || section.heading,
                    undefined,
                    lang,
                );

                updateSections({ imageUrl: imageUrl || undefined });
            } catch (e: unknown) {
                console.error(e);
                const currentLesson = savedLessons.find((l) => l.id === lessonId);
                if (currentLesson) {
                    const finalSections = currentLesson.sections.map(s =>
                        s.heading === sectionHeading ? { ...s, imageUrl: undefined, imageError: "ERR_IMG_GEN" } : s
                    );
                    updateLesson(lessonId, { sections: finalSections });
                }
                setError(lessonT.error_image_generation || "Afbeelding genereren mislukt");
            }
        },
        [savedLessons, updateLesson, lang, setError, lessonT]
    );

    return {
        handleGenerateLesson,
        handleExportPDF,
        handleExportHTML,
        handleConvertToFlashcards,
        handleDeleteMaterial,
        handleGeneratePodcast,
        handleGenerateImage,
        handleStartExam,
    };
}
