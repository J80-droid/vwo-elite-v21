/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Mic,
  MicOff,
  RotateCcw,
  Send,
  Sparkles,
  Star,
  Trophy,
  User,
} from "lucide-react";
import React, { useCallback, useState } from "react";

import {
  ChatMessage,
  continueMondelingChat,
  evaluateMondelingAnswer,
  generateMondelingQuestions,
  generateSessionSummary,
  MondelingFeedback,
  MondelingSession,
} from "../../../../shared/api/mondelingService";
import { useCelebration } from "../../../../shared/hooks/useCelebration";
import { useSettings } from "../../../../shared/hooks/useSettings";
import { useVoiceInput } from "../../../../shared/hooks/useVoiceInput";
import {
  LiteratureItem,
  useLiteratureStore,
} from "../../../../shared/model/literatureStore";
import { SUBJECT_THEME_CONFIG } from "../../types/library.types";

type SimulatorMode = "static" | "dynamic";
type SimulatorState = "select" | "session" | "feedback" | "summary" | "chat";

export interface MondelingSimulatorProps {
  subjectName: string;
  themeKey: string;
}

export const MondelingSimulator: React.FC<MondelingSimulatorProps> = ({
  subjectName,
  themeKey,
}) => {
  // Theme
  const theme = SUBJECT_THEME_CONFIG[themeKey] || SUBJECT_THEME_CONFIG.default!;

  // Store Hooks
  const { items } = useLiteratureStore();
  const { settings } = useSettings();
  const { celebrateMastery, celebrate } = useCelebration();

  // Get literature for this subject
  const literatureList = items[subjectName] || [];
  const finishedBooks = literatureList.filter((b) => b.status === "finished");

  // State
  const [mode, setMode] = useState<SimulatorMode>("static");
  const [state, setState] = useState<SimulatorState>("select");
  const [selectedBook, setSelectedBook] = useState<LiteratureItem | null>(null);

  // Static Session State
  const [session, setSession] = useState<MondelingSession | null>(null);
  const [lastFeedback, setLastFeedback] = useState<MondelingFeedback | null>(
    null,
  );
  const [sessionSummary, setSessionSummary] = useState<any>(null);

  // Dynamic Chat State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatScore, setChatScore] = useState<number | null>(null);

  const [currentAnswer, setCurrentAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Voice input
  const {
    isListening,
    toggleListening,
    isSupported: voiceSupported,
  } = useVoiceInput({
    lang:
      subjectName === "Frans"
        ? "fr-FR"
        : subjectName === "Engels"
          ? "en-US"
          : "nl-NL",
    onResult: (text, isFinal) => {
      if (isFinal) {
        setCurrentAnswer((prev) => prev + " " + text);
      }
    },
  });

  // Start session with selected book
  const startSession = useCallback(
    async (book: LiteratureItem) => {
      setSelectedBook(book);
      setIsLoading(true);

      try {
        if (mode === "static") {
          const questions = await generateMondelingQuestions(
            book.title,
            book.author,
            subjectName,
            book.oralNotes,
            settings?.aiConfig,
          );

          setSession({
            bookTitle: book.title,
            bookAuthor: book.author,
            subject: subjectName,
            questions,
            currentIndex: 0,
            answers: [],
          });
          setState("session");
        } else {
          // Dynamic Mode
          setChatHistory([]);
          setChatScore(null);
          // Initial prompt to AI to start
          const response = await continueMondelingChat(
            [],
            book.title,
            book.author,
            subjectName,
            settings?.aiConfig,
          );
          setChatHistory([{ role: "model", text: response.text }]);
          setState("chat");
        }
      } catch (error) {
        console.error("Failed to start session:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [subjectName, settings, mode],
  );

  // Helper for next question in static mode
  const nextQuestion = () => {
    if (!session) return;

    if (session.currentIndex + 1 >= session.questions.length) {
      // Finish session
      // FIX: Await the async function and pass correct arguments (session, aiConfig)
      generateSessionSummary(session, settings?.aiConfig).then((summary) => {
        setSessionSummary(summary);
        setState("summary");
        if (summary.overallScore >= 7.5) celebrateMastery();
      });
    } else {
      setSession((prev) =>
        prev
          ? {
            ...prev,
            currentIndex: prev.currentIndex + 1,
          }
          : null,
      );
      setLastFeedback(null);
      setCurrentAnswer("");
      setState("session");
    }
  };

  // Submit answer
  const submitAnswer = useCallback(async () => {
    if (!currentAnswer.trim()) return;
    setIsLoading(true);

    if (state === "chat") {
      // Dynamic flow
      const newUserMsg: ChatMessage = { role: "user", text: currentAnswer };
      const updatedHistory = [...chatHistory, newUserMsg];
      setChatHistory(updatedHistory);
      setCurrentAnswer("");

      try {
        const aiResponse = await continueMondelingChat(
          updatedHistory,
          selectedBook?.title || "",
          selectedBook?.author || "",
          subjectName,
          settings?.aiConfig,
        );

        setChatHistory((prev) => [
          ...prev,
          { role: "model", text: aiResponse.text },
        ]);

        if (aiResponse.isExamFinished) {
          setChatScore(aiResponse.score || 7);
          if ((aiResponse.score || 0) >= 7.5) celebrateMastery();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Static flow
    if (!session) return;

    const currentQuestion = session.questions[session.currentIndex]!;
    try {
      const feedback = await evaluateMondelingAnswer(
        session.bookTitle,
        session.bookAuthor,
        currentQuestion.question,
        currentAnswer,
        subjectName,
        settings?.aiConfig,
      );

      setLastFeedback(feedback);
      setSession((prev) =>
        prev
          ? {
            ...prev,
            answers: [
              ...prev.answers,
              {
                question: currentQuestion.question,
                answer: currentAnswer,
                feedback,
              },
            ],
          }
          : null,
      );

      if (feedback.score >= 8) celebrate();
      setState("feedback");
    } catch (error) {
      console.error("Failed to evaluate answer:", error);
    } finally {
      setIsLoading(false);
    }
  }, [
    session,
    currentAnswer,
    subjectName,
    settings,
    celebrate,
    state,
    chatHistory,
    selectedBook,
    mode,
    celebrateMastery,
  ]);

  // Define currentQuestion helper
  const currentQuestion = session?.questions[session.currentIndex || 0];

  // Reset
  const resetSimulator = useCallback(() => {
    setState("select");
    setSelectedBook(null);
    setSession(null);
    setCurrentAnswer("");
    setLastFeedback(null);
    setSessionSummary(null);
    setChatHistory([]);
    setChatScore(null);
  }, []);

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${theme.bg}`}>
            <Mic size={24} className={theme.text} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">
              Mondeling Simulator
            </h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              AI Examinator • {subjectName}
            </p>
          </div>
        </div>
        {state !== "select" && (
          <button
            onClick={resetSimulator}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
          >
            <RotateCcw size={18} />
          </button>
        )}
      </div>

      {/* Mode Selection in Select Screen */}
      {state === "select" && (
        <div className="flex gap-4 p-1 bg-white/5 rounded-2xl mb-2 self-start">
          <button
            onClick={() => setMode("static")}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${mode === "static" ? theme.bg + " " + theme.text : "text-slate-500 hover:text-slate-300"}`}
          >
            Oefenen
          </button>
          <button
            onClick={() => setMode("dynamic")}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${mode === "dynamic" ? theme.bg + " " + theme.text : "text-slate-500 hover:text-slate-300"}`}
          >
            <span className="flex items-center gap-2">
              <Sparkles size={12} /> Simulatie
            </span>
          </button>
        </div>
      )}

      {/* SELECT BOOK STATE */}
      {state === "select" && (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {finishedBooks.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 p-10 text-center">
              <BookOpen size={48} className="mb-4 opacity-20" />
              <p className="text-sm font-bold uppercase tracking-widest opacity-50 mb-2">
                Geen gelezen boeken
              </p>
              <p className="text-xs text-slate-500">
                Markeer boeken als 'gelezen' in je literatuurlijst om te
                oefenen.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 mb-4">
                {mode === "static"
                  ? "Selecteer een boek om specifieke vragen te oefenen:"
                  : "Start een volledig mondeling examen simulatie over:"}
              </p>
              {finishedBooks.map((book) => (
                <button
                  key={book.id}
                  onClick={() => startSession(book)}
                  disabled={isLoading}
                  className="w-full p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.04] hover:border-white/10 transition-all text-left group flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors">
                      {book.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {book.author} • {book.period || "Onbekende periode"}
                    </p>
                  </div>
                  <ChevronRight
                    size={18}
                    className="text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CHAT STATE (Dynamic) */}
      {state === "chat" && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 p-2 mb-4">
            {chatHistory.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "model" && (
                  <div
                    className={`p-2 rounded-lg h-8 w-8 flex items-center justify-center shrink-0 ${theme.bg}`}
                  >
                    <Trophy size={14} className={theme.text} />
                  </div>
                )}
                <div
                  className={`p-4 rounded-2xl max-w-[80%] text-sm leading-relaxed ${msg.role === "user"
                    ? "bg-blue-600 text-white rounded-tr-none"
                    : "bg-white/5 border border-white/10 text-slate-200 rounded-tl-none"
                    }`}
                >
                  {msg.text}
                </div>
                {msg.role === "user" && (
                  <div className="p-2 rounded-lg h-8 w-8 flex items-center justify-center shrink-0 bg-slate-700">
                    <User size={14} className="text-slate-300" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div
                  className={`p-2 rounded-lg h-8 w-8 flex items-center justify-center shrink-0 ${theme.bg}`}
                >
                  <Trophy size={14} className={theme.text} />
                </div>
                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-none flex items-center gap-2 text-slate-400 text-xs">
                  <Loader2 size={14} className="animate-spin" /> Denken...
                </div>
              </div>
            )}
            {chatScore !== null && (
              <div className="flex flex-col items-center justify-center p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl mt-8 mb-4">
                <Trophy size={48} className="text-emerald-400 mb-4" />
                <h3 className="text-2xl font-black text-white mb-2">
                  Examen Afgerond
                </h3>
                <div className="text-5xl font-black text-emerald-400 mb-2">
                  {chatScore}
                </div>
                <button
                  onClick={resetSimulator}
                  className="text-sm underline text-slate-400 hover:text-white"
                >
                  Terug naar overzicht
                </button>
              </div>
            )}
          </div>

          {/* Chat Input */}
          {chatScore === null && (
            <div className="flex flex-col gap-4 bg-[#050914] pt-2">
              <div className="relative">
                <textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Antwoord op de examinator..."
                  className="w-full h-24 bg-white/[0.02] border border-white/10 rounded-xl p-4 text-white placeholder-slate-600 resize-none focus:outline-none focus:border-blue-500/50 transition-all custom-scrollbar"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submitAnswer();
                    }
                  }}
                />
                {voiceSupported && (
                  <button
                    onClick={toggleListening}
                    className={`absolute bottom-3 right-3 p-2 rounded-lg transition-all ${isListening
                      ? "bg-red-500 text-white animate-pulse"
                      : "bg-white/10 text-slate-400 hover:text-white"
                      }`}
                  >
                    {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                  </button>
                )}
              </div>
              <button
                onClick={submitAnswer}
                disabled={isLoading || !currentAnswer.trim()}
                className={`py-3 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all ${currentAnswer.trim()
                  ? `${theme.bg} ${theme.text} hover:brightness-110`
                  : "bg-white/5 text-slate-600 cursor-not-allowed"
                  }`}
              >
                <Send size={16} /> Verstuur Antwoord
              </button>
            </div>
          )}
        </div>
      )}

      {/* SESSION STATE (Static Mode) */}
      {state === "session" && currentQuestion && mode === "static" && (
        <div className="flex-1 flex flex-col gap-6">
          {/* Progress */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full ${theme.bg} transition-all duration-500`}
                style={{
                  width: `${((session?.currentIndex || 0) / (session?.questions.length || 1)) * 100}%`,
                }}
              />
            </div>
            <span className="text-xs text-slate-500 font-bold">
              {(session?.currentIndex || 0) + 1}/{session?.questions.length}
            </span>
          </div>

          {/* Question */}
          <div className={`p-6 rounded-2xl border ${theme.border} ${theme.bg}`}>
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${theme.bg} ${theme.text} border ${theme.border}`}
              >
                {currentQuestion.category}
              </span>
              <span className="text-[9px] text-slate-500 uppercase">
                {currentQuestion.difficulty}
              </span>
            </div>
            <p className="text-white font-medium text-lg leading-relaxed">
              {currentQuestion.question}
            </p>
          </div>

          {/* Answer Input */}
          <div className="flex-1 flex flex-col gap-4">
            <div className="relative flex-1">
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Typ je antwoord of gebruik de microfoon..."
                className="w-full h-full bg-white/[0.02] border border-white/10 rounded-xl p-4 text-white placeholder-slate-600 resize-none focus:outline-none focus:border-blue-500/50 transition-all"
              />
              {voiceSupported && (
                <button
                  onClick={toggleListening}
                  className={`absolute bottom-4 right-4 p-3 rounded-xl transition-all ${isListening
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-white/10 text-slate-400 hover:text-white"
                    }`}
                >
                  {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
              )}
            </div>

            {/* Submit */}
            <button
              onClick={submitAnswer}
              disabled={isLoading || !currentAnswer.trim()}
              className={`py-4 rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all ${currentAnswer.trim()
                ? `${theme.bg} ${theme.text} hover:brightness-110`
                : "bg-white/5 text-slate-600 cursor-not-allowed"
                }`}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Analyseren...
                </>
              ) : (
                <>
                  <Send size={18} /> Antwoord Versturen
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* FEEDBACK STATE */}
      {state === "feedback" && lastFeedback && (
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
          {/* Score */}
          <div className="flex items-center justify-center gap-4 py-6">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black ${lastFeedback.score >= 7
                ? "bg-emerald-500/20 text-emerald-400"
                : lastFeedback.score >= 5
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-rose-500/20 text-rose-400"
                }`}
            >
              {lastFeedback.score}
            </div>
          </div>
          {/* Strengths */}
          {lastFeedback.strengths.length > 0 && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <h4 className="text-emerald-400 text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                <CheckCircle2 size={14} /> Sterk
              </h4>
              <ul className="space-y-1">
                {lastFeedback.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-emerald-200">
                    • {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* Improvements */}
          {lastFeedback.improvements.length > 0 && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <h4 className="text-amber-400 text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                <AlertCircle size={14} /> Verbeterpunten
              </h4>
              <ul className="space-y-1">
                {lastFeedback.improvements.map((s, i) => (
                  <li key={i} className="text-sm text-amber-200">
                    • {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* Sample Answer */}
          {lastFeedback.sampleAnswer && (
            <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl">
              <h4 className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">
                Voorbeeldantwoord
              </h4>
              <p className="text-sm text-slate-300">
                {lastFeedback.sampleAnswer}
              </p>
            </div>
          )}
          {/* Next Button */}
          <button
            onClick={nextQuestion}
            className={`py-4 rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 ${theme.bg} ${theme.text} hover:brightness-110 transition-all`}
          >
            {session && session.currentIndex + 1 >= session.questions.length ? (
              <>
                <Trophy size={18} /> Afronden
              </>
            ) : (
              <>
                <ChevronRight size={18} /> Volgende Vraag
              </>
            )}
          </button>
        </div>
      )}

      {/* SUMMARY STATE */}
      {state === "summary" && sessionSummary && (
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
          {/* Overall Score */}
          <div className="text-center py-8">
            <div
              className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-4xl font-black mb-4 ${sessionSummary.overallScore >= 7
                ? "bg-emerald-500/20 text-emerald-400"
                : sessionSummary.overallScore >= 5.5
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-rose-500/20 text-rose-400"
                }`}
            >
              {sessionSummary.overallScore}
            </div>
            <h3 className="text-xl font-black text-white uppercase mb-2">
              Mondeling Afgerond
            </h3>
            <p className="text-slate-400 text-sm">{sessionSummary.summary}</p>
          </div>
          {/* Recommendations */}
          {sessionSummary.recommendations?.length > 0 && (
            <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl">
              <h4 className="text-slate-400 text-xs font-black uppercase tracking-widest mb-3">
                Aanbevelingen
              </h4>
              <ul className="space-y-2">
                {sessionSummary.recommendations.map((r: string, i: number) => (
                  <li
                    key={i}
                    className="text-sm text-slate-300 flex items-start gap-2"
                  >
                    <Star
                      size={14}
                      className="text-amber-400 mt-0.5 shrink-0"
                    />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* Restart */}
          <button
            onClick={resetSimulator}
            className={`py-4 rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 ${theme.bg} ${theme.text} hover:brightness-110 transition-all`}
          >
            <RotateCcw size={18} /> Nieuw Mondeling
          </button>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && state === "select" && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-2xl">
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={32} className={`animate-spin ${theme.text}`} />
            <p className="text-sm text-slate-400">Vragen genereren...</p>
          </div>
        </div>
      )}
    </div>
  );
};
