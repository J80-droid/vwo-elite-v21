import { geminiChat } from "@shared/api/geminiBase";
import { motion } from "framer-motion";
import {
  Bot,
  Brain,
  CheckSquare,
  MessageSquare,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import { ErrorAnalysis } from "./components/ErrorAnalysis";
import { ProofBlocks } from "./components/ProofBlocks";

const SYSTEM_PROMPT = `
Je bent Newton, de elite AI-tutor voor VWO Wiskunde B.
Jouw doel is om de leerling te coachen naar een dieper begrip, niet om antwoorden voor te kauwen.
Gebruik de Socratische methode: stel vragen terug.
Wees bemoedigend, kort en bondig. Gebruik LaTeX formules waar nodig (met enkele $ of dubbele $$).
Als de leerling vastloopt, geef een kleine hint.
Geef NOOIT direct het eindantwoord.
Spreek Nederlands.
`;

const askNewton = async (
  msg: string,
  history: { role: "user" | "ai"; text: string }[],
  context: string,
) => {
  try {
    // Convert internal history format to service format
    const formattedHistory = history.map((h) => ({
      role: h.role === "ai" ? "assistant" : ("user" as "assistant" | "user"),
      content: h.text,
    }));

    const finalSystemPrompt = `${SYSTEM_PROMPT}\n\nContext: De leerling bevindt zich op pagina: ${context}`;

    const response = await geminiChat(formattedHistory, msg, finalSystemPrompt);
    return response;
  } catch (e: unknown) {
    const err = e as Error;
    if (err.message && err.message.includes("API Key")) {
      return "Mijn brein staat even uitgeschakeld. Configureer je GEMINI API KEY in de instellingen om mij te activeren.";
    }
    console.error(e);
    return "Er ging iets mis in mijn circuits. Probeer het later opnieuw.";
  }
};

export const TutorOverlay = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  // State for tabs: 'chat', 'proof', 'error'
  const [activeTab, setActiveTab] = useState<"chat" | "proof" | "error">(
    "chat",
  );

  // Chat State
  const [messages, setMessages] = useState<
    { role: "user" | "ai"; text: string }[]
  >([{ role: "ai", text: "Hoi, ik ben Newton. Waar loop je vast?" }]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Auto-scroll logic for chat
  useEffect(() => {
    if (activeTab === "chat" && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeTab]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;

    // Optimistic update
    const newHistory = [...messages, { role: "user" as const, text: userMsg }];
    setMessages(newHistory);
    setInput("");
    setIsTyping(true);

    const context = `User is at ${location.pathname}`;

    try {
      // Pass the history BEFORE the new user message, as geminiChat takes history + new message
      // Wait, geminiChat takes history as previous turns.
      // So we pass 'messages' (the state before this update) to be strict, or 'messages' state is stale?
      // Actually 'messages' in the component state is confirmed.
      // But here we constructed 'newHistory' including the latest user message.
      // geminiChat function signature: (history, newMessage, ...)
      // So we should pass 'messages' (old history) and 'userMsg'.

      const response = await askNewton(userMsg, messages, context);
      setMessages((prev) => [...prev, { role: "ai", text: response }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4 sm:p-8 font-outfit">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
        onClick={onClose}
      />

      {/* Main Window - Wider for workspace functionality */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="pointer-events-auto w-full max-w-5xl h-[85vh] bg-obsidian-900 border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header & Tabs */}
        <div className="flex-none bg-black/40 border-b border-white/5 flex flex-col">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.3)]">
                <Bot className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white leading-none">Newton AI</h3>
                <span className="text-[10px] text-violet-300 uppercase tracking-wider font-bold">
                  Personal Tutor Workspace
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex px-4 gap-1">
            <TabButton
              active={activeTab === "chat"}
              onClick={() => setActiveTab("chat")}
              icon={<MessageSquare size={16} />}
              label="Chat Coach"
            />
            <TabButton
              active={activeTab === "proof"}
              onClick={() => setActiveTab("proof")}
              icon={<CheckSquare size={16} />}
              label="Q.E.D. Builder"
            />
            <TabButton
              active={activeTab === "error"}
              onClick={() => setActiveTab("error")}
              icon={<Brain size={16} />}
              label="Fouten Analyse"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative bg-obsidian-950 flex flex-col">
          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col h-full">
              {/* Messages Area */}
              <div
                className="flex-1 overflow-y-auto p-6 space-y-6 bg-black/20"
                ref={scrollRef}
              >
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`
                                            max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-lg
                                            ${
                                              m.role === "user"
                                                ? "bg-violet-600 text-white rounded-br-none"
                                                : "bg-white/10 text-slate-200 rounded-bl-none border border-white/5"
                                            }
                                        `}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start animate-pulse">
                    <div className="bg-white/5 px-4 py-2 rounded-full text-xs text-slate-500 flex items-center gap-2">
                      <Sparkles size={12} className="animate-spin" /> Newton
                      denkt na...
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-white/5 bg-black/40">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Stel je vraag aan Newton..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-violet-500 outline-none transition-colors placeholder:text-slate-600"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="p-3 bg-violet-600 text-white rounded-xl hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-violet-600/20"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "proof" && (
            <div className="flex-1 overflow-hidden p-6">
              <ProofBlocks />
            </div>
          )}

          {activeTab === "error" && (
            <div className="flex-1 overflow-hidden p-6">
              <ErrorAnalysis />
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// Helper Component for Tabs
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TabButton = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={`
            px-6 py-3 rounded-t-xl text-sm font-bold flex items-center gap-2 transition-all border-b-0
            ${
              active
                ? "bg-obsidian-950 text-violet-400 border-t border-x border-white/10 shadow-[-5px_-5px_20px_rgba(0,0,0,0.5)]"
                : "text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent"
            }
        `}
  >
    {icon} {label}
  </button>
);
