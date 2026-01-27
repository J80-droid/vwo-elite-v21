import { AnimatePresence, motion } from "framer-motion";
import { Bot, Cpu, Send, Sparkles, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

import { useTutor } from "./useTutor";

export const TutorInterface: React.FC = () => {
  const {
    isOpen,
    toggleTutor,
    messages,
    sendMessage,
    isThinking,
    currentContext,
  } = useTutor();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll naar beneden
  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isThinking]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  return (
    <>
      {/* Toggle Button (Floating Action Button style) */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={toggleTutor}
          className={`
                        relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300
                        ${isOpen ? "bg-obsidian-900 border border-white/20 rotate-90" : "bg-emerald-500 hover:bg-emerald-400 hover:scale-105"}
                    `}
        >
          {isOpen ? (
            <X className="text-white" />
          ) : (
            <Bot className="text-white" />
          )}

          {/* Status Indicator (Pulse als er context is) */}
          {!isOpen && currentContext && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500"></span>
            </span>
          )}
        </button>
      </div>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-[400px] z-40 bg-obsidian-950/90 backdrop-blur-xl border-l border-white/10 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] flex flex-col"
          >
            {/* Header */}
            <div className="h-16 border-b border-white/10 flex items-center px-6 bg-white/5 justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <Sparkles size={18} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white tracking-wide text-sm">
                    ELITE TUTOR
                  </h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-400/80 font-mono uppercase">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Online •{" "}
                    {currentContext?.moduleId
                      ? `Monitoring ${currentContext.moduleId}`
                      : "Idle"}
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div
              className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
              ref={scrollRef}
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`
                                        w-8 h-8 rounded-full flex items-center justify-center shrink-0 border
                                        ${msg.role === "user" ? "bg-slate-700 border-slate-600" : "bg-emerald-900/30 border-emerald-500/30"}
                                    `}
                  >
                    {msg.role === "user" ? (
                      <div className="text-[10px] font-bold">JIJ</div>
                    ) : (
                      <Cpu size={14} className="text-emerald-400" />
                    )}
                  </div>

                  <div
                    className={`
                                        max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm
                                        ${msg.role === "user" ? "bg-slate-800 text-white rounded-tr-none" : "bg-black/40 border border-white/5 text-slate-200 rounded-tl-none"}
                                    `}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {isThinking && (
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-900/30 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <Cpu size={14} className="text-emerald-400 animate-pulse" />
                  </div>
                  <div className="bg-black/40 border border-white/5 rounded-2xl rounded-tl-none p-4 flex gap-1">
                    <div
                      className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/10 bg-black/40">
              <form onSubmit={handleSend} className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Stel een vraag over je simulatie..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all placeholder:text-slate-600"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isThinking}
                  className="absolute right-2 top-2 p-1.5 bg-emerald-500 rounded-lg text-black hover:bg-emerald-400 disabled:opacity-50 disabled:hover:bg-emerald-500 transition-colors"
                >
                  <Send size={16} />
                </button>
              </form>
              <p className="text-[10px] text-center text-slate-600 mt-2">
                AI kan fouten maken. Controleer kritische informatie in Binas.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
