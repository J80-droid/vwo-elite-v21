/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any -- dynamic session and speech types */
import { analyzeBlurting } from "@shared/api/gemini";
import { logActivitySQL } from "@shared/api/sqliteService";
import { useSettings } from "@shared/hooks/useSettings";
import { useTranslations } from "@shared/hooks/useTranslations";
import { useBlurtingStore } from "@shared/model/blurtingStore";
import { LiveCoach } from "@shared/ui/LiveCoach";
import { MarkdownRenderer } from "@shared/ui/MarkdownRenderer";
import {
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  Mic,
  RefreshCw,
  Timer,
  XCircle,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

interface BlurtingLabProps {}

export const BlurtingLab: React.FC<BlurtingLabProps> = () => {
  const navigate = useNavigate();
  const { t, lang } = useTranslations();
  const { settings } = useSettings();
  const { addSession } = useBlurtingStore();

  // State
  const [topic, setTopic] = useState("");
  const [phase, setPhase] = useState<
    "setup" | "active" | "metacognition" | "analyzing" | "feedback"
  >("setup");
  const [userContent, setUserContent] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(300);

  // Metacognition State
  const [selfGrade, setSelfGrade] = useState<number>(5);
  const [predictedOmissions, setPredictedOmissions] = useState("");

  // Scaffolding State (Hints from previous session)
  const [hints, setHints] = useState<string[]>([]);
  const [scaffoldingMode, setScaffoldingMode] = useState(false);

  // Live Mode
  const [isLiveMode, setIsLiveMode] = useState(false);

  // Speech Recognition Setup (Simplified from LanguageLab)
  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang =
        lang === "nl"
          ? "nl-NL"
          : lang === "en"
            ? "en-US"
            : lang === "fr"
              ? "fr-FR"
              : "es-ES";

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + " ";
          }
        }
        if (finalTranscript) {
          setUserContent((prev) => prev + finalTranscript);
        }
      };
    }
  }, [lang]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  // Timer Logic
  useEffect(() => {
    if (phase === "active" && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft((p) => p - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && phase === "active") {
      setPhase("metacognition"); // Go to self-reflection first
    }
    return undefined;
  }, [phase, timeLeft]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const startSession = (retry: boolean = false) => {
    if (retry) {
      // Load hints from specific analysis or last session
      if (analysis && analysis.missingPoints) {
        setHints(analysis.missingPoints);
        setScaffoldingMode(true);
      }
    } else {
      // Check if there is a previous session for this topic to auto-load hints?
      // For now, only explicit retry enables hints to avoid clutter
      setHints([]);
      setScaffoldingMode(false);
    }

    setUserContent("");
    setTimeLeft(300);
    setPhase("active");
  };

  const handleMetacognitionSubmit = async () => {
    setPhase("analyzing");

    try {
      const result = await analyzeBlurting(
        topic,
        userContent,
        settings.aiConfig,
      );
      setAnalysis(result);

      // Persist Session
      addSession({
        id: crypto.randomUUID(),
        topic: topic,
        date: Date.now(),
        userContent: userContent,
        score: result.score,
        missingPoints: result.missingPoints,
        misconceptions: result.misconceptions,
      });

      // XP
      const xpEarned = Math.round((result.score || 0) * 0.5);
      await logActivitySQL("blurting", `Voltooide sessie ${topic}`, xpEarned);
    } catch (error) {
      console.error(error);
    }
    setPhase("feedback");
  };

  return (
    <div className="p-6 h-full flex flex-col items-center justify-center max-w-5xl mx-auto w-full relative">
      <button
        onClick={() => navigate("/")}
        className="absolute top-0 left-0 group flex items-center gap-2 text-slate-400 hover:text-white transition-colors z-50 pointer-events-auto"
      >
        <div className="p-2 rounded-lg bg-white/5 border border-white/10 group-hover:bg-white/10 group-hover:border-white/20 transition-all">
          <ArrowLeft size={20} />
        </div>
        <span className="font-bold text-sm uppercase tracking-wider">
          Dashboard
        </span>
      </button>
      {phase === "setup" && (
        <div className="bg-obsidian-900 border border-obsidian-800 rounded-2xl p-12 shadow-2xl text-center max-w-lg w-full relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-electric to-transparent opacity-50"></div>

          <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <BrainCircuit className="text-electric" size={32} />
            {t.blurting.title || "Blurting Modus"}
          </h2>
          <p className="text-slate-400 mb-8">
            {t.blurting.desc ||
              "Active Recall Training: Schrijf alles op wat je weet."}
          </p>

          <div className="space-y-4">
            <input
              className="w-full bg-obsidian-950 border border-obsidian-800 rounded-lg p-4 text-white text-lg focus:border-electric outline-none placeholder:text-slate-600"
              placeholder={t.blurting.placeholder}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setIsLiveMode(false);
                  startSession();
                }}
                disabled={!topic}
                className="relative overflow-hidden bg-cyan-500/5 hover:bg-cyan-500/10 border border-cyan-500/30 hover:border-cyan-400/60 text-cyan-100 font-black py-5 rounded-xl transition-all disabled:opacity-50 disabled:grayscale flex flex-col items-center justify-center gap-1 group shadow-[0_0_20px_rgba(6,182,212,0.1)] hover:shadow-[0_0_40px_rgba(6,182,212,0.3)]"
              >
                {/* Subtle Glow Overlay */}
                <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>

                <span className="text-xl tracking-tight z-10 uppercase">
                  {t.blurting.dump_btn || "Start Sessie"}
                </span>
                <span className="text-xs font-bold text-blue-100 z-10 opacity-90 group-hover:opacity-100 tracking-wider">
                  {t.blurting.dump_desc || "Typen & Schrijven"}
                </span>
              </button>

              <button
                onClick={() => {
                  setIsLiveMode(true);
                  setPhase("active");
                }}
                disabled={!topic}
                className="relative overflow-hidden bg-purple-500/5 hover:bg-purple-500/10 border border-purple-500/30 hover:border-purple-400/60 text-purple-100 font-bold py-5 rounded-xl transition-all disabled:opacity-50 flex flex-col items-center justify-center gap-1 group shadow-[0_0_20px_rgba(168,85,247,0.1)] hover:shadow-[0_0_40px_rgba(168,85,247,0.3)]"
              >
                <span className="text-xl flex items-center gap-2 z-10">
                  <Mic
                    size={20}
                    className="text-purple-400 group-hover:text-purple-300 transition-colors"
                  />
                  <span className="uppercase tracking-tight">
                    {t.blurting.oral_btn || "Mondeling"}
                  </span>
                </span>
                <span className="text-xs font-bold text-slate-500 group-hover:text-purple-200 transition-colors z-10 tracking-wider">
                  {t.blurting.oral_desc || "AI Examinator"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {phase === "active" && isLiveMode && (
        <div className="w-full h-full flex flex-col items-center justify-center">
          <div className="w-full max-w-md">
            <LiveCoach
              lang={lang}
              t={{
                ready: "Start Examen",
                connecting: "Verbinden...",
                listening: "Luisteren...",
                ended: "Klaar",
                error: "Fout",
                start: "Start",
                end: "Stop",
              }}
              systemInstruction={`Je bent een strenge maar rechtvaardige VWO-examinator. Het onderwerp is: ${topic}. Neem een mondeling examen af. Stel open vragen. Vraag door op details. Beoordeel kritisch.`}
            />
          </div>
          <button
            onClick={() => setPhase("setup")}
            className="mt-8 text-slate-500 hover:text-white underline"
          >
            Terug
          </button>
        </div>
      )}

      {phase === "active" && !isLiveMode && (
        <div className="w-full h-full flex flex-col relative">
          <div className="flex justify-between items-center mb-4 bg-obsidian-900/50 p-4 rounded-xl border border-white/5">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {topic}
              {scaffoldingMode && (
                <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded border border-purple-500/30">
                  {t.blurting.scaffolding}
                </span>
              )}
            </h2>

            <div
              className={`flex items-center gap-4 ${timeLeft < 60 ? "text-red-400 animate-pulse" : "text-slate-400"}`}
            >
              <Timer size={20} />
              <span className="font-mono text-xl font-bold">
                {formatTime(timeLeft)}
              </span>
            </div>

            {settings.speechRecognitionEnabled && (
              <button
                onClick={toggleListening}
                className={`p-3 rounded-full transition-all ${isListening ? "bg-red-500 animate-pulse" : "bg-obsidian-800 hover:bg-obsidian-700"}`}
              >
                {isListening ? (
                  <Mic className="text-white" />
                ) : (
                  <Mic className="text-slate-400" />
                )}
              </button>
            )}
          </div>

          <div className="flex-1 flex gap-6 overflow-hidden">
            <textarea
              className="flex-1 h-full bg-obsidian-900 border border-obsidian-800 rounded-2xl p-6 text-slate-200 text-lg leading-relaxed focus:border-electric outline-none resize-none font-mono"
              placeholder="Typ alles wat je weet..."
              value={userContent}
              onChange={(e) => setUserContent(e.target.value)}
            />

            {/* Scaffolding Sidebar */}
            {scaffoldingMode && hints.length > 0 && (
              <div className="w-64 bg-purple-900/10 border border-purple-500/10 rounded-2xl p-4 overflow-y-auto">
                <h3 className="text-purple-400 font-bold mb-3 text-sm uppercase tracking-wider">
                  {t.blurting.hints_title}
                </h3>
                <ul className="space-y-2">
                  {hints.map((hint, i) => (
                    <li
                      key={i}
                      className="text-sm text-purple-200/50 hover:text-purple-200 transition-colors cursor-help border-b border-white/5 pb-2"
                    >
                      {hint}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <button
            onClick={() => setPhase("metacognition")}
            className="bg-gold hover:bg-yellow-400 text-obsidian-950 font-bold py-4 px-8 rounded-xl transition-all shadow-lg shadow-gold/20 self-center mt-6"
          >
            {t.live.ready.replace("...", "")}
          </button>
        </div>
      )}

      {phase === "metacognition" && (
        <div className="max-w-xl w-full bg-obsidian-900 border border-obsidian-800 rounded-2xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">
            {t.blurting.reflection_title}
          </h3>

          <div className="mb-8">
            <label className="block text-slate-400 mb-2 text-sm">
              {t.blurting.grade_label}
            </label>
            <div className="flex justify-between gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <button
                  key={n}
                  onClick={() => setSelfGrade(n)}
                  className={`w-10 h-10 rounded-lg font-bold transition-all ${selfGrade === n ? "bg-electric text-white scale-110" : "bg-obsidian-950 text-slate-500 hover:bg-obsidian-800"}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-slate-400 mb-2 text-sm">
              {t.blurting.forgot_label}
            </label>
            <textarea
              className="w-full bg-obsidian-950 border border-obsidian-800 rounded-lg p-3 text-white h-24 resize-none focus:border-electric outline-none"
              placeholder={t.blurting.forgot_placeholder}
              value={predictedOmissions}
              onChange={(e) => setPredictedOmissions(e.target.value)}
            />
          </div>

          <button
            onClick={handleMetacognitionSubmit}
            className="w-full bg-electric hover:bg-electric-glow text-white font-bold py-3 rounded-xl"
          >
            {t.blurting.show_result}
          </button>
        </div>
      )}

      {phase === "analyzing" && (
        <div className="flex flex-col items-center animate-pulse">
          <BrainCircuit size={64} className="text-electric mb-4" />
          <div className="text-xl text-slate-400">{t.blurting.analyzing}</div>
        </div>
      )}

      {phase === "feedback" && analysis && (
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 h-full overflow-hidden">
          <div className="bg-obsidian-900 border border-obsidian-800 rounded-2xl p-6 overflow-y-auto">
            <h3 className="text-slate-400 font-bold mb-4 uppercase text-xs">
              {t.blurting.input_label}
            </h3>
            <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
              {userContent}
            </p>
          </div>

          <div className="bg-obsidian-900 border border-obsidian-800 rounded-2xl p-6 overflow-y-auto flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <h3 className="text-white font-bold text-xl">
                  {t.blurting.result_label}
                </h3>
                <div className="text-xs text-slate-500">
                  {t.blurting.grade_given.replace(
                    "{{score}}",
                    selfGrade.toString(),
                  )}
                </div>
              </div>
              <div
                className={`text-4xl font-bold ${analysis.score >= 80 ? "text-emerald-400" : analysis.score >= 55 ? "text-orange-400" : "text-rose-400"}`}
              >
                {analysis.score}%
              </div>
            </div>

            {analysis.misconceptions.length > 0 && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
                <h4 className="text-rose-400 font-bold mb-3 flex items-center gap-2">
                  {t.blurting.misconceptions}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.misconceptions.map((m: string, i: number) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 bg-rose-500/20 text-rose-200 text-sm rounded-lg border border-rose-500/30"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {analysis.missingPoints.length > 0 && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <h4 className="text-blue-400 font-bold mb-3 flex items-center gap-2">
                  <XCircle size={18} /> {t.blurting.missing}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.missingPoints.map((m: string, i: number) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 bg-blue-500/20 text-blue-200 text-sm rounded-lg border border-blue-500/30"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {analysis.covered_concepts &&
              analysis.covered_concepts.length > 0 && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                  <h4 className="text-emerald-400 font-bold mb-3 flex items-center gap-2">
                    <CheckCircle2 size={18} /> {t.blurting.known}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.covered_concepts.map((c: string, i: number) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 bg-emerald-500/20 text-emerald-200 text-sm rounded-lg border border-emerald-500/30"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            <div>
              <h4 className="text-white font-bold mb-2">
                {t.blurting.feedback}
              </h4>
              <div className="prose prose-invert prose-sm">
                <MarkdownRenderer content={analysis.feedback} />
              </div>
            </div>

            <div className="mt-auto grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setPhase("setup");
                  setTopic("");
                  setUserContent("");
                }}
                className="bg-obsidian-950 hover:bg-obsidian-800 text-slate-400 font-bold py-4 rounded-xl transition-colors"
              >
                {t.blurting.new_topic}
              </button>

              <button
                onClick={() => startSession(true)} // Retry with scaffolding
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={20} />
                {t.blurting.retry}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
