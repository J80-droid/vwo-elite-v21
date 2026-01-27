/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any -- AI response parsing and dynamic Bloom levels */
import { aiGenerateJSON } from "@shared/api/aiCascadeService";
import { useSettings } from "@shared/hooks/useSettings";
import { useBloomStore } from "@shared/model/bloomStore";
import { MarkdownRenderer } from "@shared/ui/MarkdownRenderer";
import { CheckCircle, Lock, PlayCircle } from "lucide-react";
import React, { useState } from "react";

interface BloomTrainerProps {}

export const BloomTrainer: React.FC<BloomTrainerProps> = () => {
  const { settings: _settings } = useSettings();
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ... Store Integration ...
  const { sessions, activeSessionId, createSession, addChatMessage } =
    useBloomStore();
  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const levels = activeSession?.levels || [];

  // Interaction State
  const [selectedQuestion, setSelectedQuestion] = useState<{
    question: string;
    level: string;
    chatHistory: any[];
    isCorrect?: boolean;
  } | null>(null);
  const [answerInput, setAnswerInput] = useState("");
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);

  // Refresh selected question state from store when it updates
  React.useEffect(() => {
    if (selectedQuestion && activeSession) {
      const levelIdx = activeSession.levels.findIndex(
        (l) => l.level === selectedQuestion.level,
      );
      if (levelIdx !== -1) {
        const qData = activeSession.levels[levelIdx]!.questions.find(
          (q) => q.text === selectedQuestion.question,
        );
        if (qData) {
          setSelectedQuestion({
            question: qData.text,
            level: selectedQuestion.level, // Keep original logic for level
            chatHistory: qData.chatHistory,
            ...(qData.isCorrect !== undefined
              ? { isCorrect: qData.isCorrect }
              : {}),
          });
        } else {
          setSelectedQuestion(null);
        }
      }
    }
  }, [activeSession, sessions]); // Deep dependency check might be needed, but 'sessions' ref changes on update

  const handleGenerate = async () => {
    if (!inputText) return;
    setIsLoading(true);

    const prompt = `
        Je bent een didactisch expert en trainer voor VWO-leerlingen.
        Gebruik Bloom's Taxonomie om actieve leervragen te genereren voor de volgende tekst.
        
        De tekst:
        "${inputText.slice(0, 3000)}"

        Genereer voor ELK van de 6 niveaus precies 2 uitdagende, open vragen.
        De niveaus zijn:
        1. Onthouden (Feiten, definities)
        2. Begrijpen (Uitleggen in eigen woorden)
        3. Toepassen (Gebruik de kennis in een nieuwe situatie)
        4. Analyseren (Verbanden leggen, structuur zien)
        5. Evalueren (Oordelen, verdedigen van een standpunt)
        6. Creëren (Iets nieuws ontwerpen of samenstellen)

        Geef het antwoord ALTIJD als een JSON array met deze structuur:
        [
          {
            "level": "Onthouden",
            "description": "Feiten herinneren",
            "questions": ["Vraag 1...", "Vraag 2..."],
            "actionVerb": "Definieer / Noem"
          },
          ... etc voor alle 6 niveaus
        ]
        Geen extra tekst, alleen de JSON.
        `;

    try {
      const systemPrompt =
        "Je bent een didactisch expert. Antwoord altijd in valide JSON format met een array van 6 Bloom taxonomie niveaus.";
      let parsed = await aiGenerateJSON<any>(prompt, systemPrompt);

      // Robust parsing logic...
      if (!Array.isArray(parsed)) {
        if (parsed.levels && Array.isArray(parsed.levels))
          parsed = parsed.levels;
        else if (parsed.result && Array.isArray(parsed.result))
          parsed = parsed.result;
        else if (parsed.niveaus && Array.isArray(parsed.niveaus))
          parsed = parsed.niveaus;
        else {
          const values = Object.values(parsed);
          if (values.length > 0 && typeof values[0] === "object")
            parsed = values;
          else throw new Error("AI response was not a valid array");
        }
      }

      // Colors
      const colors = [
        "bg-purple-500/20 border-purple-500/50 text-purple-200", // Remember
        "bg-blue-500/20 border-blue-500/50 text-blue-200", // Understand
        "bg-cyan-500/20 border-cyan-500/50 text-cyan-200", // Apply
        "bg-emerald-500/20 border-emerald-500/50 text-emerald-200", // Analyze
        "bg-yellow-500/20 border-yellow-500/50 text-yellow-200", // Evaluate
        "bg-orange-500/20 border-orange-500/50 text-orange-200", // Create
      ];

      parsed = parsed.map((l: any, i: number) => ({
        ...l,
        color: colors[i] || colors[0],
      }));

      createSession(inputText, parsed);
    } catch (e) {
      console.error("[BloomTrainer] AI Cascade failed:", e);
      alert("Er ging iets mis bij het genereren. Probeer het opnieuw.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedQuestion || !answerInput.trim() || !activeSessionId) return;

    const currentInput = answerInput;
    setAnswerInput(""); // Clear immediately
    setIsFeedbackLoading(true);

    const levelIdx = levels.findIndex(
      (l) => l.level === selectedQuestion.level,
    );
    const qIdx = levels[levelIdx]!.questions.findIndex(
      (q: any) => q.text === selectedQuestion.question,
    );

    // 1. Add User Message
    addChatMessage(activeSessionId, levelIdx, qIdx, {
      role: "user",
      content: currentInput,
      timestamp: Date.now(),
    });

    try {
      const { aiGenerate } = await import("@shared/api/aiCascadeService");

      // Build Context from history
      const historyContext = selectedQuestion.chatHistory
        .map((m) => `${m.role === "user" ? "Leerling" : "Coach"}: ${m.content}`)
        .join("\n");

      const prompt = `
                Je bent een Sferische (Socratic) coach.
                Vraag: "${selectedQuestion.question}"
                Niveau: ${selectedQuestion.level}
                
                Gespreksgeschiedenis:
                ${historyContext}
                Leerling (nieuw): "${currentInput}"
                
                Instructie:
                1. Analyseer het antwoord didactisch.
                2. Als het antwoord **volledig juist** en diepgaand genoeg is voor VWO-niveau: Begin je antwoord met "[CORRECT]". Geef daarna een kort compliment.
                3. Als het antwoord **onvolledig of oppervlakkig** is: Stel een verdiepende, sturende vraag (Socratisch) om de leerling naar het antwoord te gidsen. Geef nog GEEN goedkeuring.
                4. Als het **fout** is: Geef een hint, geen direct antwoord.

                Houd het kort (max 3 zinnen).
                Taal: Nederlands.
            `;
      const result = await aiGenerate(prompt, {
        systemPrompt: "Socratic Tutor",
      });

      const isCorrect = result.includes("[CORRECT]");
      const cleanResponse = result.replace("[CORRECT]", "").trim();

      // 2. Add AI Response
      addChatMessage(
        activeSessionId,
        levelIdx,
        qIdx,
        {
          role: "assistant",
          content: cleanResponse,
          timestamp: Date.now(),
        },
        isCorrect,
      );
    } catch (e) {
      console.error(e);
      addChatMessage(activeSessionId, levelIdx, qIdx, {
        role: "assistant",
        content: "Oeps, ik kon even niet nadenken. Probeer het nog eens.",
        timestamp: Date.now(),
      });
    } finally {
      setIsFeedbackLoading(false);
    }
  };

  // Scroll chat to bottom
  const chatEndRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedQuestion?.chatHistory]);

  if (!activeSession)
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <div className="text-8xl mb-4 grayscale opacity-20">🧠</div>
        <p>Plak je leerstof in het tekstveld links om te starten.</p>
      </div>
    );

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 relative">
      {/* Input Section */}
      <div className="w-full md:w-1/3 flex flex-col h-full bg-obsidian-900/50 rounded-xl border border-white/10 p-6">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <span className="text-3xl">🧠</span> Bloom Trainer
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          Plak je leerstof (paragraaf, artikel, notities) hieronder. De AI maakt
          er actieve leervragen van op 6 niveaus.
        </p>

        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Plak hier je tekst..."
          className="flex-1 bg-obsidian-950 border border-white/10 rounded-lg p-4 text-slate-300 resize-none outline-none focus:border-electric mb-4 font-mono text-sm"
        />

        <button
          onClick={handleGenerate}
          disabled={isLoading || !inputText}
          className="bg-electric hover:bg-electric-glow text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50 flex justify-center items-center gap-2"
        >
          {isLoading ? <span className="animate-spin text-xl">↻</span> : "🚀"}{" "}
          Generate Challenge
        </button>
      </div>

      {/* Output Section */}
      <div className="flex-1 h-full overflow-y-auto pr-2">
        {!levels.length && !isLoading && (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
            <div className="text-8xl mb-4">Ladder</div>
            <p>Wachtend op input...</p>
          </div>
        )}

        <div className="space-y-6 pb-12">
          {levels.map((level, idx) => {
            const isLocked = level.status === "locked";
            const isCompleted = level.status === "completed";

            return (
              <div
                key={idx}
                className={`relative rounded-xl border p-5 transition-all duration-500
                                ${
                                  isLocked
                                    ? "bg-obsidian-950 border-white/5 opacity-60 grayscale"
                                    : isCompleted
                                      ? "bg-emerald-950/20 border-emerald-500/30"
                                      : level.color
                                }
                            `}
              >
                {/* LOCKED OVERLAY */}
                {isLocked && (
                  <div className="absolute inset-0 z-10 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-xl">
                    <Lock className="w-8 h-8 text-slate-400 mb-2" />
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                      Voltooi vorig niveau
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3">
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    ) : !isLocked ? (
                      <PlayCircle className="w-5 h-5 text-white animate-pulse" />
                    ) : (
                      <span className="text-slate-500 font-bold">
                        {idx + 1}.
                      </span>
                    )}

                    <h3
                      className={`font-bold text-lg uppercase tracking-wider ${isCompleted ? "text-emerald-400" : "text-white"}`}
                    >
                      {level.level}
                    </h3>
                  </div>
                  <span className="text-xs font-mono px-2 py-1 rounded bg-black/20 border border-white/10">
                    {level.actionVerb}
                  </span>
                </div>
                <p className="text-xs opacity-75 mb-4 italic">
                  {level.description}
                </p>

                <ul className="space-y-3">
                  {level.questions.map((q: any, qIdx: number) => {
                    const isAnswered = q.isCorrect;
                    const hasHistory =
                      q.chatHistory && q.chatHistory.length > 0;

                    return (
                      <button
                        key={q.id}
                        disabled={isLocked}
                        onClick={() => {
                          setSelectedQuestion({
                            question: q.text,
                            level: level.level,
                            chatHistory: q.chatHistory || [],
                            isCorrect: q.isCorrect,
                          });
                        }}
                        className={`w-full text-left flex gap-3 items-start p-3 rounded-lg transition-colors cursor-pointer group disabled:cursor-not-allowed
                                                    ${
                                                      isAnswered
                                                        ? "bg-emerald-500/10 border border-emerald-500/30"
                                                        : hasHistory
                                                          ? "bg-blue-500/10 border border-blue-500/30"
                                                          : "bg-black/20 hover:bg-white/10"
                                                    }
                                                `}
                      >
                        <span
                          className={`font-bold ${isAnswered ? "text-emerald-400" : hasHistory ? "text-blue-400" : "opacity-50"}`}
                        >
                          {isAnswered ? "✓" : hasHistory ? "✎" : `Q${qIdx + 1}`}
                        </span>
                        <span className="flex-1 text-sm">{q.text}</span>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                          ➡️
                        </span>
                      </button>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interaction Modal */}
      {selectedQuestion && (
        <div className="absolute inset-0 bg-obsidian-950/90 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-obsidian-900 border border-obsidian-800 rounded-2xl w-full max-w-3xl shadow-2xl relative flex flex-col h-[85vh]">
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-start bg-obsidian-950 rounded-t-2xl">
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  {selectedQuestion.level}
                  {selectedQuestion.isCorrect && (
                    <span className="text-emerald-500 flex items-center gap-1">
                      <CheckCircle size={12} /> Voltooid
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white leading-snug pr-8">
                  {selectedQuestion.question}
                </h3>
              </div>
              <button
                onClick={() => setSelectedQuestion(null)}
                className="text-slate-500 hover:text-white p-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-black/20">
              {selectedQuestion.chatHistory.length === 0 && (
                <div className="flex justify-center mt-10">
                  <div className="bg-electric/10 text-electric px-4 py-2 rounded-full text-sm animate-bounce">
                    👋 De coach luistert. Wat denk jij?
                  </div>
                </div>
              )}

              {selectedQuestion.chatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-electric text-white rounded-br-none"
                        : "bg-obsidian-800 border border-white/10 text-slate-200 rounded-bl-none"
                    }`}
                  >
                    <MarkdownRenderer content={msg.content} />
                  </div>
                </div>
              ))}
              {isFeedbackLoading && (
                <div className="flex justify-start">
                  <div className="bg-obsidian-800 border border-white/10 text-slate-400 px-4 py-3 rounded-xl rounded-bl-none text-sm flex gap-2 items-center">
                    <span className="animate-pulse">●</span>
                    <span className="animate-pulse delay-75">●</span>
                    <span className="animate-pulse delay-150">●</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-obsidian-950 border-t border-white/5 rounded-b-2xl">
              {selectedQuestion.isCorrect ? (
                <div className="flex items-center justify-center p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 font-bold gap-2">
                  <CheckCircle /> Vraag voltooid! Ga terug naar de ladder.
                </div>
              ) : (
                <div className="flex gap-2 relative">
                  <textarea
                    className="flex-1 bg-obsidian-900 border border-obsidian-700 rounded-xl p-3 text-white outline-none focus:border-electric resize-none h-14"
                    placeholder="Typ je antwoord..."
                    value={answerInput}
                    onChange={(e) => setAnswerInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isFeedbackLoading || !answerInput.trim()}
                    className="bg-electric hover:bg-electric-glow disabled:opacity-50 text-white font-bold p-4 rounded-xl transition-all"
                  >
                    ➤
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
