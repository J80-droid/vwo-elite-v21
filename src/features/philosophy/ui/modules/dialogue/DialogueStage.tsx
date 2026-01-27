import { useModuleState } from "@features/philosophy/hooks/PhilosophyLabContext";
import {
  defaultDialogueState,
  DialogueState,
} from "@features/philosophy/types";
import { geminiChat } from "@shared/api/geminiBase";
import { useTranslations } from "@shared/hooks/useTranslations";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Brain, Send, Sparkles, Trash2, User } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

export const DialogueStage: React.FC = () => {
  const { t } = useTranslations();
  const [state, setState] = useModuleState<DialogueState>(
    "dialogue",
    defaultDialogueState,
  );
  const [inputValue, setInputValue] = useState("");
  const [showMethodology, setShowMethodology] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [state?.chatHistory]);

  const handleSend = async () => {
    const history = state?.chatHistory || [];
    const textToSend = history.length === 0 ? state?.currentTopic : inputValue;
    if (!textToSend?.trim()) return;

    const newUserMsg = { role: "user" as const, content: textToSend };
    const newHistory = [...history, newUserMsg];

    setState((prev) => ({
      ...prev,
      chatHistory: newHistory,
      isTyping: true,
    }));

    if (history.length > 0) {
      setInputValue("");
    }

    try {
      const systemPrompt = `
                Jij bent ${state.philosopherPersona || "Socrates"}. Spreek in het Nederlands.
                Houd het antwoord beknopt (max 3 zinnen) en Socratisch (eindig met een wedervraag).
                Reageer op VWO-niveau, uitdagend maar educatief.
            `;

      const aiResponseText = await geminiChat(
        history.filter(
          (msg): msg is { role: "user" | "assistant"; content: string } =>
            msg.role !== "system",
        ),
        newUserMsg.content,
        systemPrompt,
      );

      const newAiMsg = { role: "assistant" as const, content: aiResponseText };

      setState((prev) => ({
        ...prev,
        chatHistory: [...newHistory, newAiMsg],
        isTyping: false,
      }));
    } catch (e) {
      console.error(e);
      setState((prev) => ({
        ...prev,
        isTyping: false,
        chatHistory: [
          ...newHistory,
          {
            role: "assistant",
            content: t(
              "philosophy.dialogue.error",
              "Mijn gedachten zijn vertroebeld... (API Error)",
            ),
          },
        ],
      }));
    }
  };

  const handleClear = () => {
    setState((prev) => ({ ...prev, chatHistory: [], currentTopic: "" }));
    setInputValue("");
  };

  return (
    <div className="w-full h-full p-6 md:p-12 overflow-y-auto bg-black flex flex-col custom-scrollbar relative font-outfit">
      {/* 0. Blueprint Background (Violet Theme) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.05),transparent_70%)] pointer-events-none" />

      {/* 1. Blueprint Header */}
      <div className="flex justify-between items-end mb-10 relative z-10 shrink-0">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-400 via-white to-white bg-clip-text text-transparent tracking-tight mb-2">
            {t("philosophy.dialogue.title", "DIALOGUE PROTOCOL")}
          </h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">
            {t("philosophy.dialogue.subtitle", "SOCRATIC METHOD v2.5")}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowMethodology(!showMethodology)}
            className={`flex items - center gap - 2 px - 4 py - 2 rounded - xl border transition - all duration - 300 ${
              showMethodology
                ? "bg-violet-500/20 border-violet-500/50 text-white shadow-[0_0_15px_-5px_rgba(139,92,246,0.5)]"
                : "bg-white/[0.03] border-white/10 text-slate-400 hover:text-white hover:bg-white/5"
            } `}
          >
            <BookOpen
              size={14}
              className={showMethodology ? "text-violet-400" : "text-slate-500"}
            />
            <span className="text-[10px] font-bold uppercase tracking-widest hidden md:inline">
              Methodiek
            </span>
          </button>

          {state?.chatHistory && state.chatHistory.length > 0 && (
            <button
              onClick={handleClear}
              className="bg-white/[0.03] hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 text-slate-400 hover:text-red-400 px-4 py-2 rounded-xl transition-all"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* 2. Main Dashboard Area */}
      <div className="flex-1 relative z-10 flex flex-col pb-20">
        {!state?.chatHistory || state.chatHistory.length === 0 ? (
          /* 2.A Welcome "Reactor" State */
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-violet-600/20 via-fuchsia-500/20 to-violet-600/20 rounded-[2.5rem] blur-xl opacity-50 animate-pulse" />

              <div className="relative bg-[#0A0A0B] border border-white/[0.08] rounded-[2rem] p-10 shadow-2xl overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

                <div className="text-center mb-12 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                    <span className="text-[9px] font-bold text-violet-300 uppercase tracking-widest">
                      System Ready
                    </span>
                  </div>
                  <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
                    Open de <span className="text-violet-500">Discussie</span>
                  </h2>
                  <p className="text-slate-400 text-sm md:text-base max-w-md mx-auto leading-relaxed">
                    Start een filosofisch onderzoek met{" "}
                    {state.philosopherPersona}. Stel een vraag, stelling of
                    ethisch dilemma.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="relative group">
                    <textarea
                      rows={2}
                      placeholder="Wat houdt je bezig?"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-5 text-lg text-white focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.05] transition-all placeholder:text-slate-600 resize-none"
                      value={state.currentTopic || ""}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          currentTopic: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (state.currentTopic?.trim()) handleSend();
                        }
                      }}
                    />
                    <div className="absolute bottom-4 right-4">
                      <span className="text-[9px] font-mono text-slate-600">
                        {state.currentTopic?.length || 0} chars
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleSend}
                    disabled={!state.currentTopic?.trim()}
                    className="w-full py-5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(124,58,237,0.3)] hover:shadow-[0_0_25px_-5px_rgba(124,58,237,0.5)] active:scale-[0.99] disabled:opacity-30 disabled:shadow-none flex items-center justify-center gap-3 group"
                  >
                    <span className="text-xs font-bold uppercase tracking-[0.2em]">
                      Initialiseer Dialoog
                    </span>
                    <Send
                      size={14}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* 2.B Dashboard Chat Interface */
          <div className="flex-1 flex flex-col min-h-0 bg-white/[0.015] border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm relative">
            {/* Chat Header inside Dashboard */}
            <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-white/[0.01]">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Onderwerp:
                </span>
                <span className="text-sm font-medium text-white/90 truncate max-w-md">
                  {state.currentTopic}
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20">
                <User size={12} className="text-violet-400" />
                <span className="text-[10px] font-bold text-violet-300 uppercase tracking-wider">
                  {state.philosopherPersona}
                </span>
              </div>
            </div>

            {/* Scrollable Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              {(state?.chatHistory || [])
                .filter((m) => m.role !== "system")
                .map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} `}
                  >
                    <div
                      className={`max - w - [85 %] lg: max - w - [70 %] group flex gap - 4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"} `}
                    >
                      <div
                        className={`w - 8 h - 8 rounded - lg flex items - center justify - center shrink - 0 border ${
                          msg.role === "user"
                            ? "bg-slate-800 border-white/10"
                            : "bg-violet-600/20 border-violet-500/30"
                        } `}
                      >
                        {msg.role === "user" ? (
                          <User size={14} className="text-slate-400" />
                        ) : (
                          <Brain size={14} className="text-violet-400" />
                        )}
                      </div>

                      <div
                        className={`space - y - 1 ${msg.role === "user" ? "text-right" : "text-left"} `}
                      >
                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          {msg.role === "user"
                            ? "Student"
                            : state.philosopherPersona}
                        </div>
                        <div
                          className={`p - 5 rounded - 2xl border backdrop - blur - md text - sm leading - relaxed ${
                            msg.role === "user"
                              ? "bg-white/[0.03] border-white/10 text-slate-200 rounded-tr-sm"
                              : "bg-black/40 border-violet-500/10 text-slate-100 rounded-tl-sm"
                          } `}
                        >
                          <div className="prose prose-invert prose-sm max-w-none">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}

              {state.isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start gap-4"
                >
                  <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center shrink-0">
                    <Brain size={14} className="text-violet-400" />
                  </div>
                  <div className="bg-black/40 border border-violet-500/10 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 bg-violet-500/50 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 150} ms` }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Footer */}
            <div className="p-4 border-t border-white/5 bg-black/20">
              <div className="relative flex items-center gap-3 bg-white/[0.03] border border-white/10 p-2 pl-4 rounded-xl focus-within:border-violet-500/30 focus-within:bg-white/[0.05] transition-all">
                <input
                  type="text"
                  placeholder="Typ je reactie..."
                  className="flex-1 bg-transparent border-none py-2 text-sm text-white focus:outline-none placeholder:text-slate-600"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && inputValue.trim() && handleSend()
                  }
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || state.isTyping}
                  className="p-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors disabled:opacity-30"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Methodology Drawer (Overlay) */}
      <AnimatePresence>
        {showMethodology && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute right-6 top-24 bottom-6 w-80 bg-[#0F1012] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            <div className="p-5 border-b border-white/5 bg-white/[0.02]">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <Sparkles size={12} className="text-violet-400" />
                Onderwijsprotocol
              </h3>
            </div>
            <div className="p-5 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Fase
                </div>
                <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-lg">
                  <div className="text-violet-300 font-bold text-sm mb-1">
                    Elenchus
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Kritisch onderzoek en weerlegging. Het doel is niet winnen,
                    maar waarheidsvinding door het blootleggen van
                    tegenstrijdigheden.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Kernbegrippen
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["Aporia", "Maieutiek", "Doxa", "Episteme"].map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-white/5 border border-white/5 rounded-md text-[9px] font-mono text-slate-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Status
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full w-[35%] bg-violet-500 rounded-full" />
                  </div>
                  <span className="text-[9px] font-mono text-violet-400">
                    35%
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
