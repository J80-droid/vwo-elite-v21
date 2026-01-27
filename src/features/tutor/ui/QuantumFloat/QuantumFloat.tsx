import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Mic, MicOff, Minimize2, Send, Volume2 } from "lucide-react";
import React, { useRef, useState } from "react";

import { useSocraticVoice } from "../../hooks/useSocraticVoice";
import { useTutor } from "../../hooks/useTutor";
import { MessageStream } from "../components/MessageStream";

export const QuantumFloat: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const tutor = useTutor();
  const constraintsRef = useRef(null);

  const isDraggingRef = useRef(false);

  React.useEffect(() => {
    console.log("QuantumFloat Mounted");
  }, []);

  // Auto-Expand Logic
  const handleTranscript = (text: string, isUser: boolean) => {
    // If we receive a formula or image marker from the AI, expand the window
    if (!isUser) {
      if (
        text.includes("$$") ||
        text.includes("![") ||
        text.includes("Here is the formula")
      ) {
        setIsExpanded(true);
      }
    }
  };

  const {
    state: voiceState,
    isActive: isVoiceActive,
    startSession: startVoice,
    stopSession: stopVoice,
  } = useSocraticVoice({
    onTranscript: handleTranscript,
  });

  const handleSend = () => {
    if (!inputValue.trim()) return;
    tutor.send({ type: "USER_MESSAGE", message: inputValue });
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Helper to get Voice Icon
  const getVoiceIcon = () => {
    switch (voiceState) {
      case "connecting":
        return <Loader2 size={14} className="animate-spin" />;
      case "listening":
        return <Mic size={14} className="animate-pulse text-emerald-400" />;
      case "speaking":
        return (
          <Volume2 size={14} className="animate-bounce text-emerald-400" />
        );
      default:
        return <MicOff size={14} />;
    }
  };

  const toggleVoice = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log(
      "Toggle Voice Clicked. Current State:",
      voiceState,
      "Is Active:",
      isVoiceActive,
    );
    if (isVoiceActive) {
      console.log("Stopping voice session...");
      stopVoice();
    } else {
      console.log("Starting voice session...");
      startVoice();
    }
  };

  return (
    <>
      <div
        ref={constraintsRef}
        className="fixed inset-0 pointer-events-none z-[999]"
      />

      <motion.div
        drag
        dragConstraints={constraintsRef}
        dragMomentum={false}
        onDragStart={() => {
          isDraggingRef.current = true;
        }}
        onDragEnd={() => {
          setTimeout(() => (isDraggingRef.current = false), 100);
        }}
        // Use explicit bottom/left positioning instead of calculated Y
        initial={false}
        animate={{
          width: isExpanded ? 400 : 90,
          height: isExpanded ? 600 : 44,
          borderRadius: isExpanded ? 24 : 12, // More rounded button look
          bottom: isExpanded ? 24 : 24, // Consistent with global status bars
          left: 24,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`pointer-events-auto fixed flex flex-col transition-all duration-300 z-[9999] ${isExpanded
          ? "bg-obsidian-950/95 border border-emerald-500/20 shadow-2xl backdrop-blur-md overflow-hidden"
          : "bg-transparent border-none shadow-none overflow-visible"
          }`}
        style={{
          boxShadow: isExpanded
            ? "0 0 50px -10px rgba(16, 185, 129, 0.1)"
            : "none",
        }}
      >
        {/* Header / Orb Trigger */}
        <div
          className={`flex items-center justify-between ${isExpanded ? "p-4 cursor-grab active:cursor-grabbing" : "p-0"}`}
          onDoubleClick={() => setIsExpanded(!isExpanded)}
          onClick={() => {
            if (!isDraggingRef.current && !isExpanded) {
              // Allow handling by buttons
            }
          }}
        >
          {isExpanded ? (
            <>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 elite-alive-glow" />
                <span className="font-bold tracking-wider text-xs uppercase text-emerald-400">
                  Socratic Tutor
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* Voice Toggle in Header */}
                <button
                  onClick={toggleVoice}
                  className={`p-1.5 rounded-lg transition-colors ${isVoiceActive ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50" : "hover:bg-white/5 text-white/40 hover:text-white"}`}
                >
                  {getVoiceIcon()}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(false);
                  }}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                >
                  <Minimize2 size={14} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2.5 w-full h-full cursor-grab active:cursor-grabbing pl-1">
              {/* Green Button -> Chat */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isDraggingRef.current) setIsExpanded(true);
                }}
                className="relative w-[30px] h-[30px] rounded-full overflow-hidden shadow-lg hover:shadow-emerald-500/50 transition-shadow"
              >
                <img
                  src="./orb_knoppen/green.png"
                  alt="Chat"
                  className="w-full h-full object-cover"
                />
              </motion.button>

              {/* Blue Button -> Voice */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleVoice}
                className="relative w-[30px] h-[30px] rounded-full overflow-hidden shadow-lg hover:shadow-cyan-500/50 transition-shadow group"
              >
                <div
                  className={`absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors ${isVoiceActive ? "bg-red-500/20" : ""}`}
                />
                <img
                  src="./orb_knoppen/blue.png"
                  alt="Voice"
                  className={`w-full h-full object-cover ${isVoiceActive ? "animate-pulse" : ""}`}
                />
                {isVoiceActive && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Mic
                      className="text-white drop-shadow-md animate-bounce"
                      size={13}
                    />
                  </div>
                )}
              </motion.button>
            </div>
          )}
        </div>

        {/* Content Area */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col min-h-0"
            >
              {/* Messages */}
              <div className="flex-1 min-h-0 flex flex-col">
                <MessageStream tutor={tutor} />
              </div>

              {/* Input Area */}
              <div className="p-4 pt-2">
                <div className="relative group">
                  <div className="absolute inset-0 bg-emerald-500/5 rounded-xl blur-sm group-focus-within:bg-emerald-500/10 transition-colors" />
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a question..."
                    className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 pr-10 text-sm md:text-sm text-gray-200 focus:outline-none focus:border-emerald-500/30 resize-none h-[52px] max-h-[120px] custom-scrollbar placeholder:text-gray-600 relative z-10"
                    style={{ minHeight: "52px" }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || tutor.isThinking}
                    className="absolute right-2 top-2 p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all z-20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={16} />
                  </button>
                </div>

                <div className="mt-2 flex justify-between items-center px-1">
                  <span className="text-[10px] text-white/20 uppercase tracking-widest">
                    Quantum Float v2.0
                  </span>
                  {tutor.isThinking && (
                    <span className="text-[10px] text-emerald-400/60 animate-pulse">
                      Processing...
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};
