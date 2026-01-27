import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";
import React from "react";

import { useTutor } from "../../hooks/useTutor";
import { ConfidenceThermometer } from "./ConfidenceThermometer";
import { LogicAccordion } from "./LogicAccordion";

interface MessageStreamProps {
  tutor: ReturnType<typeof useTutor>;
}

export const MessageStream: React.FC<MessageStreamProps> = ({ tutor }) => {
  // reasoningSteps is the LIVE current thinking (for the typing indicator)
  const { history, isThinking, reasoningSteps } = tutor;

  return (
    <div className="flex flex-col gap-4 p-4 min-h-0 overflow-y-auto custom-scrollbar">
      {history.map((msg, idx: number) => {
        // Determine if we show rich features for this message
        const showRichFeatures = msg.role === "assistant";
        const hasReasoning =
          msg.metadata?.reasoning && msg.metadata.reasoning.length > 0;
        const hasConfidence = msg.metadata?.confidence !== undefined;

        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            {/* Avatar Icon */}
            <div
              className={`p-2 rounded-xl h-fit shrink-0 backdrop-blur-md ${msg.role === "user"
                ? "bg-blue-500/10 border border-blue-500/20 text-blue-400"
                : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                }`}
            >
              {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
            </div>

            {/* Message Content Wrapper */}
            <div
              className={`flex flex-col gap-2 max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"}`}
            >
              {showRichFeatures && hasReasoning && msg.metadata?.reasoning && (
                <LogicAccordion
                  steps={msg.metadata.reasoning}
                  isThinking={false}
                />
              )}

              {/* 2. Message Bubble */}
              <div
                className={`p-3 rounded-2xl text-sm leading-relaxed backdrop-blur-sm border ${msg.role === "user"
                  ? "bg-blue-500/5 border-blue-500/10 text-blue-100 rounded-tr-sm"
                  : "bg-emerald-500/5 border-emerald-500/10 text-emerald-100 rounded-tl-sm"
                  }`}
              >
                {msg.content}
              </div>

              {showRichFeatures && hasConfidence && msg.metadata?.confidence !== undefined && (
                <ConfidenceThermometer score={msg.metadata.confidence} />
              )}
            </div>
          </motion.div>
        );
      })}

      {/* Typing Indicator & Active Reasoning */}
      {isThinking && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex gap-3"
        >
          <div className="p-2 rounded-xl h-fit bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 backdrop-blur-md">
            <Bot size={16} />
          </div>
          <div className="flex flex-col gap-2">
            {/* Thinking Accordion State - Shows LIVE reasoning steps */}
            {reasoningSteps.length > 0 && (
              <LogicAccordion steps={reasoningSteps} isThinking={true} />
            )}

            <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 rounded-tl-sm flex items-center gap-1 w-fit">
              <span
                className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
