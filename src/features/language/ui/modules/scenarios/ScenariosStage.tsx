import { useTranslations } from "@shared/hooks/useTranslations";
import { useVoiceCoachContext } from "@shared/lib/contexts/VoiceCoachContext";
import { Mic, Send, Sparkles, Square } from "lucide-react";
import React, { useState } from "react";

// Mock data (migrated from legacy LanguageLab.tsx)
const SCENARIOS = [
  {
    id: "cafe-paris",
    title: "Ordering in a Café",
    lang: "fr",
    difficulty: "A2",
    context:
      'You are at "Le Petit Coin" in Paris. Order a coffee and a croissant.',
    aiRole: "Waitar (Jean)",
    userRole: "Customer",
    starters: [
      "Bonjour, je voudrais une table pour un.",
      "Excusez-moi, avez-vous du wifi ?",
    ],
  },
  {
    id: "interview-madrid",
    title: "Job Interview",
    lang: "es",
    difficulty: "B2",
    context: "You are applying for an internship at a tech startup in Madrid.",
    aiRole: "HR Manager (Sofia)",
    userRole: "Applicant",
    starters: [
      "Buenos días, vengo por la entrevista.",
      "Hola, gracias por recibirme.",
    ],
  },
  {
    id: "debate-oxford",
    title: "Academic Debate",
    lang: "en",
    difficulty: "C1",
    context: "Debating the ethics of AI in an Oxford seminar.",
    aiRole: "Professor Higgins",
    userRole: "Student",
    starters: [
      "I believe AI requires strict regulation.",
      "The potential benefits outweigh the risks.",
    ],
  },
];

export const ScenariosStage: React.FC = () => {
  const { t } = useTranslations();
  useVoiceCoachContext(
    "LanguageLab",
    t(
      "language.scenarios.voice_coach",
      "Welkom bij Scenario Training. Oefen je spraak en interactie in realistische situaties.",
    ),
    { tool: "scenarios" },
  );
  const [activeScenario, setActiveScenario] = useState(SCENARIOS[0]!);
  const [isRecording, setIsRecording] = useState(false);
  const [conversation, setConversation] = useState<
    { role: "ai" | "user"; text: string }[]
  >([
    {
      role: "ai",
      text: "Bonjour ! Bienvenue chez Le Petit Coin. Je peux prendre votre commande ?",
    },
  ]);
  const [inputText, setInputText] = useState("");

  const handleSend = () => {
    if (!inputText.trim()) return;
    setConversation((prev) => [...prev, { role: "user", text: inputText }]);
    setInputText("");

    // Simulate AI response
    setTimeout(() => {
      setConversation((prev) => [
        ...prev,
        { role: "ai", text: "Très bien. Avec ceci ?" },
      ]);
    }, 1000);
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none select-none z-0">
        <h1 className="text-[15rem] font-black tracking-tighter text-white">
          VWO ELITE
        </h1>
      </div>

      <div className="relative z-10 h-full flex flex-col p-6 max-w-5xl mx-auto overflow-y-auto">
        {/* Header / Scenario Selection */}
        <div className="flex gap-4 mb-6 overflow-x-auto pb-2 shrink-0">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveScenario(s)}
              className={`flex-shrink-0 p-4 rounded-xl border transition-all text-left w-64 ${
                activeScenario.id === s.id
                  ? "bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/10"
                  : "bg-white/5 border-white/5 hover:bg-white/10"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-black/40 text-slate-400">
                  {s.lang.toUpperCase()} • {s.difficulty}
                </span>
                {activeScenario.id === s.id && (
                  <Sparkles size={14} className="text-amber-400" />
                )}
              </div>
              <h3 className="font-bold text-white mb-1">{s.title}</h3>
              <p className="text-xs text-slate-400 line-clamp-2">{s.context}</p>
            </button>
          ))}
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-black/40 border border-white/10 rounded-2xl overflow-hidden flex flex-col relative z-10 backdrop-blur-sm">
          {/* Scene Context Header */}
          <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-black font-bold">
                AI
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">
                  {activeScenario.aiRole}
                </h4>
                <span className="text-xs text-slate-500">
                  {t("language.scenarios.status_online", "Online")} •{" "}
                  {t("language.scenarios.type_ai", "AI Scenario")}
                </span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {conversation.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-4 ${
                    msg.role === "user"
                      ? "bg-amber-500/20 border border-amber-500/30 text-amber-100 rounded-tr-sm"
                      : "bg-white/10 border border-white/5 text-slate-200 rounded-tl-sm"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-white/10 bg-black/40">
            {/* Suggested Starters */}
            {conversation.length < 2 && (
              <div className="flex gap-2 mb-4 overflow-x-auto">
                {activeScenario.starters.map((starter, i) => (
                  <button
                    key={i}
                    onClick={() => setInputText(starter)}
                    className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    "{starter}"
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder={`${t("language.scenarios.respond_as", "Reageer als")} ${activeScenario.userRole}...`}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                />
                <button
                  onClick={handleSend}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-amber-400 transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>

              <button
                onClick={() => setIsRecording(!isRecording)}
                className={`p-3 rounded-xl border transition-all ${
                  isRecording
                    ? "bg-red-500/20 border-red-500 text-red-400 animate-pulse"
                    : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                }`}
              >
                {isRecording ? (
                  <Square size={20} fill="currentColor" />
                ) : (
                  <Mic size={20} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
