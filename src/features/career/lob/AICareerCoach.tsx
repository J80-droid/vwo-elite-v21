/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// import studiesData from '../../../data/studies.json'; // Converted to dynamic check
// import { useAIContext } from "@shared/hooks/useAIContext";
import { chatWithCareerCoach } from "@shared/api/gemini";
import {
  getAllStudies,
  getSavedStudies,
} from "@shared/api/studyDatabaseService";
import { motion } from "framer-motion";
import { Bot, Loader2, Send, User as UserIcon } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useLOBContext } from "./LOBContext";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export const AICareerCoach: React.FC = () => {
  const { t } = useTranslation("coach");
  const { bigFiveScores, riasecScores } = useLOBContext();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: t("career.welcome"),
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Proactive Coach Logic
  useEffect(() => {
    const checkSavedStudies = async () => {
      const saved = await getSavedStudies();
      if (saved.length > 0 && messages.length === 1) {
        // User has liked studies but hasn't chatted yet. Be proactive!
        const studyNames = saved
          .map((s: any) => s.study_name)
          .slice(0, 2)
          .join(" en ");
        const count = saved.length;

        let proactiveMsg = "";
        if (count === 1) {
          proactiveMsg = `Hé, ik zag dat je interesse hebt in ${studyNames}. Wat spreekt je daar het meeste in aan?`;
        } else {
          proactiveMsg = `Ik zie dat je twijfelt tussen o.a. ${studyNames}. Zullen we de verschillen eens op een rijtje zetten?`;
        }

        // Add small delay to feel natural
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: "proactive-trigger",
              role: "assistant",
              content: proactiveMsg,
              timestamp: Date.now(),
            },
          ]);
        }, 1000);
      }
    };

    checkSavedStudies();
  }, []); // Run once on mount

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      // Context injection
      const studiesData = getAllStudies();
      const context = {
        bigFive: bigFiveScores,
        riasec: riasecScores,
        // Inject a few sample studies to help the AI be specific
        availableStudiesSample: studiesData
          .slice(0, 5)
          .map(
            (s: { name: string; institution: string }) =>
              `${s.name} (${s.institution})`,
          )
          .join(", "),
      };

      const response = await chatWithCareerCoach(input, messages, context);

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: t("career.error_offline"),
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black/90 rounded-3xl border border-white/10 overflow-hidden font-outfit shadow-2xl relative">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-purple-500/5 pointer-events-none" />

      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center gap-4 bg-white/5 backdrop-blur-md relative z-10">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-black shadow-lg shadow-emerald-500/20">
          <Bot size={28} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">{t("career.title")}</h3>
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            {t("career.subtitle")}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div
        className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
        ref={scrollRef}
      >
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            <div
              className={`
                            w-10 h-10 rounded-full flex items-center justify-center shrink-0
                            ${msg.role === "user" ? "bg-purple-500/20 text-purple-400" : "bg-emerald-500/20 text-emerald-400"}
                        `}
            >
              {msg.role === "user" ? <UserIcon size={20} /> : <Bot size={20} />}
            </div>

            <div
              className={`
                            p-4 rounded-2xl max-w-[80%] text-sm leading-relaxed shadow-sm
                            ${
                              msg.role === "user"
                                ? "bg-purple-600 text-white rounded-tr-none"
                                : "bg-white/10 text-slate-200 rounded-tl-none border border-white/5"
                            }
                        `}
            >
              {msg.content}
            </div>
          </motion.div>
        ))}

        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Bot size={20} />
            </div>
            <div className="bg-white/5 rounded-2xl p-4 rounded-tl-none flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-emerald-500" />
              <span className="text-xs text-slate-400">
                {t("career.analyzing")}
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/5 bg-black/50 backdrop-blur-md relative z-10">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={t("career.input_placeholder")}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 pr-12 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="absolute right-2 top-2 bottom-2 aspect-square rounded-lg bg-emerald-500/10 border border-emerald-500/50 hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-emerald-400 flex items-center justify-center transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]"
          >
            {isTyping ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
        <div className="text-center mt-2">
          <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">
            {t("career.footer")}
          </p>
        </div>
      </div>
    </div>
  );
};
