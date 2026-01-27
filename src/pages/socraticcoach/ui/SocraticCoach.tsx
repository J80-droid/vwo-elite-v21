import { VoiceChatButton } from "@features/tutor/ui/components/VoiceChatButton";
import { ExecutionPlan } from "@shared/api/ai-brain/planExecutor";
import {
  chatWithSocraticCoach,
  generateChatSummary,
  generatePodcastAudio,
} from "@shared/api/gemini";
import { useAIContext } from "@shared/hooks/useAIContext";
import { useContextManager } from "@shared/hooks/useContextManager";
import { useSaveStudyMaterial } from "@shared/hooks/useLocalData";
import { useSettings } from "@shared/hooks/useSettings";
import { useTranslations } from "@shared/hooks/useTranslations";
import { useVisualContext } from "@shared/hooks/useVisualContext";
import {
  ChatMessage,
  ChatSessionSummary,
  CoachRole,
  PersonaType,
} from "@shared/types/index";
import { ContextManager } from "@shared/ui/ContextManager";
import { LiveCoach } from "@shared/ui/LiveCoach";
import { MarkdownRenderer } from "@shared/ui/MarkdownRenderer";
import { PlanVisualizer } from "@shared/ui/PlanVisualizer";
import { Check, Eye, EyeOff, Play, Plus, Save, Workflow, X } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const SocraticCoach: React.FC = () => {
  const navigate = useNavigate();
  const activeView = "DASHBOARD"; // Default or from search params if needed
  const onNavigate = (view: string) => navigate(view as unknown as string);
  const { t, lang } = useTranslations();
  const { settings } = useSettings();
  const saveMaterial = useSaveStudyMaterial();
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [role, setRole] = useState<PersonaType>(
    settings.aiConfig.persona || "socratic",
  );
  const [summary, setSummary] = useState<ChatSessionSummary | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [isVisionEnabled, setIsVisionEnabled] = useState(false); // Vision Toggle State
  const [isContextManagerOpen, setIsContextManagerOpen] = useState(false);

  // Plan Executor State
  const [activePlan, setActivePlan] = useState<ExecutionPlan | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [isPlanMode, setIsPlanMode] = useState(false);

  // Chat save dialog state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [chatTitle, setChatTitle] = useState("");
  const [chatSubject, setChatSubject] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    contexts,
    addContext,
    removeContext,
    clearContexts,
    buildContextString,
    hasContexts,
    shouldPersist,
    togglePersist,
  } = useContextManager();
  const { captureContext: _captureContext } = useVisualContext(); // Visual Context Hook

  const { customPrompts } = settings.aiConfig;

  const SYSTEM_INSTRUCTIONS: Record<PersonaType, string> = {
    socratic: customPrompts?.socratic || "You are a Socratic tutor.",
    strict: customPrompts?.strict || "You are a strict examiner.",
    peer: customPrompts?.peer || "You are a study buddy.",
    eli5: customPrompts?.eli5 || "Explain like I'm 5.",
    strategist: customPrompts?.strategist || "Exam strategist.",
    debater: customPrompts?.debater || "Devil's advocate.",
    feynman:
      customPrompts?.feynman ||
      "You are a student who knows NOTHING about the topic. The user must explain it to you. Ask naive but probing questions to test their deep understanding. If they use jargon, ask what it means. Use the Feynman Technique.",
  };

  // AI Context from Database
  const { profile, gymStats } = useAIContext();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, activePlan]);

  // Build auto-injected context from profile and gym stats
  const buildAutoContext = () => {
    let autoContext = "";
    if (profile) {
      autoContext += `Student Name: ${profile.name}\nGrade: ${profile.grade}\n`;
    }
    if (gymStats) {
      if (gymStats.failures.length > 0) {
        autoContext += `\n[RECENT STRUGGLES]\nThe student recently failed these gym exercises:\n${gymStats.failures.map((f) => `- ${f.engine_id} (${Math.round(f.time / 1000)}s)`).join("\n")}\nPay special attention to these concepts.\n`;
      }
      if (gymStats.unlocks.length > 0) {
        autoContext += `\n[UNLOCKED MODULES]\n${gymStats.unlocks.join(", ")}\n`;
      }
    }
    return autoContext;
  };

  // Handle "Analyze Recent Mistakes" action
  const handleAnalyzeMistakes = async () => {
    if (gymStats.failures.length === 0) {
      setChatHistory((prev) => [
        ...prev,
        {
          role: "user",
          parts: [{ text: "Analyseer mijn recente fouten in de Gym." }],
        },
        {
          role: "model",
          parts: [
            {
              text: "Je hebt nog geen fouten gemaakt in de Gym! Blijf oefenen. 💪",
            },
          ],
        },
      ]);
      return;
    }

    const userMsg: ChatMessage = {
      role: "user",
      parts: [
        {
          text: "Analyseer mijn recente fouten in de Gym en geef specifieke tips.",
        },
      ],
    };
    setChatHistory((prev) => [
      ...prev,
      userMsg,
      { role: "model", parts: [{ text: "" }] },
    ]);
    setIsChatLoading(true);

    try {
      const autoContext = buildAutoContext();
      const failureDetails = `De student vraagt om analyse van recente fouten. Focus op:\n${gymStats.failures.map((f) => `- Exercise engine: ${f.engine_id}, time spent: ${Math.round(f.time / 1000)}s`).join("\n")}\n\nGeef concrete tips om deze concepten te verbeteren.`;

      const responseText = await chatWithSocraticCoach(
        [...chatHistory, userMsg],
        userMsg.parts[0]!.text,
        lang,
        role as CoachRole,
        settings.aiConfig.persona || "socratic",
        settings.aiConfig,
        `${autoContext}\n\n${failureDetails}`,
        SYSTEM_INSTRUCTIONS[role],
      );

      setChatHistory((prev) => {
        const newHist = [...prev];
        if (
          newHist.length > 0 &&
          newHist[newHist.length - 1]!.role === "model"
        ) {
          newHist[newHist.length - 1]!.parts[0]!.text = responseText;
        }
        return newHist;
      });
    } catch (e: unknown) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      setChatHistory((prev) => {
        const newHist = [...prev];
        if (
          newHist.length > 0 &&
          newHist[newHist.length - 1]!.role === "model"
        ) {
          newHist[newHist.length - 1]!.parts[0]!.text = `Error: ${errorMessage}`;
        }
        return newHist;
      });
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleSend = async () => {
    if (!chatInput.trim()) return;

    const userMsg: ChatMessage = { role: "user", parts: [{ text: chatInput }] };
    const updatedHistory = [...chatHistory, userMsg];
    setChatHistory([
      ...updatedHistory,
      { role: "model", parts: [{ text: "" }] },
    ]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      // Prepare context
      const userContext = buildContextString();
      const autoContext = buildAutoContext();
      const fullContext = userContext
        ? `${userContext}\n\n${autoContext}`
        : autoContext;

      // Get AI response
      const responseText = await chatWithSocraticCoach(
        updatedHistory,
        userMsg.parts[0]!.text,
        lang,
        role as CoachRole,
        settings.aiConfig.persona || "socratic",
        settings.aiConfig,
        fullContext,
        SYSTEM_INSTRUCTIONS[role],
      );

      setChatHistory((prev) => {
        const newHist = [...prev];
        if (
          newHist.length > 0 &&
          newHist[newHist.length - 1]!.role === "model"
        ) {
          newHist[newHist.length - 1]!.parts[0]!.text = responseText;
        } else {
          newHist.push({ role: "model", parts: [{ text: responseText }] });
        }
        return newHist;
      });
    } catch (e: unknown) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      setChatHistory((prev) => {
        const newHist = [...prev];
        if (
          newHist.length > 0 &&
          newHist[newHist.length - 1]!.role === "model"
        ) {
          newHist[newHist.length - 1]!.parts[0]!.text = `Error: ${errorMessage}`;
        } else {
          newHist.push({
            role: "model",
            parts: [{ text: `Error: ${errorMessage}` }],
          });
        }
        return newHist;
      });
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleComplexTask = async () => {
    if (!chatInput.trim()) return;

    setIsPlanning(true);
    const goal = chatInput;
    setChatInput("");

    try {
      const { generatePlan } = await import("@shared/api/ai-brain/planExecutor");

      // Mock tools for planning
      const mockTools = [
        { name: "research_web", description: "Zoek informatie op internet" },
        { name: "calculate", description: "Voer complexe berekeningen uit" },
        { name: "visualize", description: "Maak een diagram of grafiek" },
        { name: "binary_lookup", description: "Zoek BINAS tabellen" },
        { name: "protein_structure", description: "Analyseer eiwit structuren" }
      ];

      const plan = await generatePlan(goal, mockTools);
      setActivePlan(plan);
      setIsPlanMode(true);

      // Add message to chat
      setChatHistory(prev => [...prev, {
        role: "user",
        parts: [{ text: `Complex Doel: ${goal}` }]
      }]);

    } catch (e: unknown) {
      console.error(e);
      toast.error("Planning mislukt: " + (e instanceof Error ? e.message : "Onbekende fout"));
    } finally {
      setIsPlanning(false);
    }
  };

  const runPlan = useCallback(async () => {
    if (!activePlan) return;

    const { getNextSteps, executePlanStep } = await import("@shared/api/ai-brain/planExecutor");
    let currentPlan = activePlan;

    while (currentPlan.status !== "completed" && currentPlan.status !== "failed") {
      const nextSteps = getNextSteps(currentPlan);
      if (nextSteps.length === 0) break;

      for (const step of nextSteps) {
        currentPlan = await executePlanStep(currentPlan, step.id, async (name, args) => {
          // Simulate tool execution for now
          await new Promise(r => setTimeout(r, 2000));
          return `Resultaat van ${name} met args ${JSON.stringify(args)}`;
        });
        setActivePlan({ ...currentPlan });
      }
    }

    if (currentPlan.status === "completed") {
      setChatHistory(prev => [...prev, {
        role: "model",
        parts: [{ text: "Plan succesvol afgerond! Hier is het resultaat van je complexe taak." }]
      }]);
    }
  }, [activePlan]);

  const handleFinish = async () => {
    setIsSummaryLoading(true);
    try {
      const summaryData = await generateChatSummary(
        chatHistory,
        lang,
        settings.aiConfig,
      );
      setSummary(summaryData);
      // Auto-fill chat title from first user message
      const firstUserMsg = chatHistory.find((m) => m.role === "user")?.parts[0]
        ?.text;
      setChatTitle(firstUserMsg?.substring(0, 50) || "Chat Sessie");
      setShowSaveDialog(true); // Show save dialog after summary
    } catch (e) {
      console.error(e);
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const handleSaveChat = async () => {
    if (!chatTitle.trim()) return;

    // Convert chat history to markdown format
    const chatContent = chatHistory
      .map((msg) => {
        const text = msg.parts[0]?.text || "";
        const prefix = msg.role === "user" ? "**Jij:** " : "**AI:** ";
        return prefix + text;
      })
      .join("\n\n---\n\n");

    // Save to library as a chat material
    await saveMaterial.mutateAsync({
      id: `chat-${Date.now()}`,
      name: chatTitle,
      subject: chatSubject || "Chat",
      type: "chat",
      content: chatContent,
      date: new Date().toISOString(),
      createdAt: Date.now(),
      // Store metadata in content since schema is fixed
      quiz: JSON.stringify({
        messageCount: chatHistory.length,
        role: role,
        summary: summary?.summary,
      }),
    });

    setShowSaveDialog(false);
    setChatTitle("");
    setChatSubject("");
  };

  const handleTTS = async (text: string) => {
    try {
      const base64Audio = await generatePodcastAudio(text);
      if (base64Audio) {
        const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
        audio.play();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div
      ref={containerRef}
      className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[calc(100vh-160px)]"
    >
      {/* Save Chat Modal */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-obsidian-900 border border-electric rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-electric/20 rounded-lg">
                  <Save className="w-5 h-5 text-electric" />
                </div>
                <h2 className="text-xl font-bold text-white">Chat Opslaan?</h2>
              </div>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-400 mb-4">
              Sla deze chat op in je bibliotheek om later te gebruiken voor quiz
              generatie.
            </p>

            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Titel
                </label>
                <input
                  type="text"
                  value={chatTitle}
                  onChange={(e) => setChatTitle(e.target.value)}
                  placeholder="Bijv. Bespreking Differentiëren"
                  className="w-full px-4 py-2 bg-obsidian-950 border border-obsidian-800 rounded-lg text-white placeholder-slate-500 focus:border-electric focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Vak</label>
                <input
                  type="text"
                  value={chatSubject}
                  onChange={(e) => setChatSubject(e.target.value)}
                  placeholder="Bijv. Wiskunde, Geschiedenis"
                  className="w-full px-4 py-2 bg-obsidian-950 border border-obsidian-800 rounded-lg text-white placeholder-slate-500 focus:border-electric focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="flex-1 px-4 py-2 bg-obsidian-800 text-slate-400 rounded-lg hover:bg-obsidian-700 transition-colors"
              >
                Niet Opslaan
              </button>
              <button
                onClick={handleSaveChat}
                disabled={!chatTitle.trim() || saveMaterial.isPending}
                className="flex-1 px-4 py-2 bg-electric text-obsidian-950 font-bold rounded-lg hover:bg-electric-glow disabled:bg-slate-700 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {saveMaterial.isPending ? (
                  "..."
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Opslaan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="lg:col-span-2 flex flex-col bg-obsidian-900 rounded-xl border border-obsidian-800 overflow-hidden relative min-h-[500px]">
        {/* Role Selector */}
        <div className="p-4 border-b border-obsidian-800 flex justify-between items-center bg-obsidian-950/50 backdrop-blur flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-sm hidden sm:inline">
              {t.coach.roles.label}
            </span>
            <div className="flex bg-obsidian-900 rounded-lg p-1 border border-obsidian-800 overflow-x-auto no-scrollbar">
              {(
                [
                  "socratic",
                  "strict",
                  "peer",
                  "eli5",
                  "strategist",
                  "debater",
                  "feynman",
                ] as PersonaType[]
              ).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-tight rounded-md transition-all border whitespace-nowrap ${role === r
                    ? "bg-electric/20 border-electric text-white scale-105"
                    : "bg-transparent border-transparent text-slate-500 hover:text-white hover:bg-white/5"
                    }`}
                >
                  {r === "eli5"
                    ? "Analist"
                    : r === "debater"
                      ? "Criticus"
                      : r === "feynman"
                        ? "Feynman"
                        : r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleFinish}
            disabled={chatHistory.length < 2 || isSummaryLoading}
            className="text-xs btn-glass-rose px-3 py-1.5 flex items-center gap-2"
          >
            {isSummaryLoading ? "..." : "✨ " + t.coach.actions.finish}
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {chatHistory.length === 0 && (
            <div className="text-center text-slate-500 mt-20">
              <p>{t.coach.intro}</p>
            </div>
          )}
          {chatHistory.map((msg, idx: number) => {
            const part =
              msg.parts && msg.parts.length > 0 ? msg.parts[0]! : { text: "" };
            const isImage = part.text.startsWith("[IMAGE]");
            const content = isImage
              ? part.text.replace("[IMAGE]", "")
              : part.text;

            return (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-4 overflow-hidden ${msg.role === "user"
                    ? "bg-electric text-white shadow-lg shadow-electric/20"
                    : isImage
                      ? "p-0 bg-transparent border-none"
                      : "glass border-white/5 text-slate-200"
                    }`}
                >
                  {isImage ? (
                    <img
                      src={content}
                      alt="AI Generated"
                      className="rounded-xl border border-obsidian-800 max-w-full shadow-lg"
                    />
                  ) : (
                    <div className="break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      <MarkdownRenderer content={content} className="compact" />
                    </div>
                  )}

                  {msg.role === "model" && !isImage && (
                    <button
                      onClick={() => handleTTS(content)}
                      className="mt-2 text-xs flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                      </svg>
                      {t.coach.listen}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {isChatLoading && (
            <div className="text-slate-500 text-sm animate-pulse ml-4">
              {t.coach.thinking}
            </div>
          )}

          {activePlan && (
            <div className="px-4 py-2">
              <PlanVisualizer plan={activePlan} className="max-w-2xl mx-auto" />
              {activePlan.status === "planning" && (
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={runPlan}
                    className="btn-glass-primary px-6 py-2 flex items-center gap-2 animate-bounce"
                  >
                    <Play size={16} /> Plan Uitvoeren
                  </button>
                </div>
              )}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-obsidian-950 border-t border-obsidian-800 flex gap-3 flex-shrink-0 items-center">
          <button
            onClick={() => setIsContextManagerOpen(true)}
            className={`p-3 rounded-xl transition-all relative border ${hasContexts
              ? "btn-glass-primary"
              : "bg-obsidian-900 border-white/10 text-slate-400 hover:text-white hover:border-white/30"
              }`}
            title="Context toevoegen"
          >
            <Plus size={20} />
            {hasContexts && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-electric text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg shadow-electric/50">
                {contexts.length}
              </span>
            )}
          </button>
          <button
            onClick={handleAnalyzeMistakes}
            disabled={isChatLoading}
            className={`p-3 rounded-xl transition-all border ${gymStats.failures.length > 0
              ? "bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20"
              : "bg-obsidian-900 border-white/10 text-slate-400 hover:text-white hover:border-white/30"
              }`}
            title={
              gymStats.failures.length > 0
                ? `Analyseer ${gymStats.failures.length} fouten`
                : "Geen recente fouten"
            }
          >
            🔍
          </button>
          <button
            onClick={() => setIsPlanMode(!isPlanMode)}
            className={`p-3 rounded-xl transition-all border ${isPlanMode
              ? "bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
              : "bg-obsidian-900 border-white/10 text-slate-400 hover:text-white hover:border-white/30"
              }`}
            title="Complex Task Mode (Multi-step)"
          >
            <Workflow size={20} className={isPlanning ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setIsVisionEnabled(!isVisionEnabled)}
            className={`p-3 rounded-xl transition-all border ${isVisionEnabled
              ? "btn-glass-teal"
              : "bg-obsidian-900 border-white/10 text-slate-400 hover:text-white hover:border-white/30"
              }`}
            title={
              isVisionEnabled ? "Vision ingeschakeld" : "Vision inschakelen"
            }
          >
            {isVisionEnabled ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>

          <VoiceChatButton
            onTranscript={setChatInput}
            className="h-[46px]"
          />

          <input
            className="flex-1 bg-obsidian-900/50 backdrop-blur border border-white/10 rounded-xl px-6 py-3 focus:border-electric/50 focus:bg-obsidian-900 outline-none text-white transition-all placeholder:text-slate-600 shadow-inner"
            placeholder={
              hasContexts
                ? `${contexts.length} context(s) toegevoegd...`
                : isVisionEnabled
                  ? "Vraag iets over je scherm..."
                  : t.coach.input
            }
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (isPlanMode ? handleComplexTask() : handleSend())}
          />
          <button
            onClick={isPlanMode ? handleComplexTask : handleSend}
            aria-label="send"
            className="btn-glass-primary p-3 !rounded-xl"
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
              <line x1="22" x2="11" y1="2" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>

        {/* Context Manager Modal */}
        <ContextManager
          isOpen={isContextManagerOpen}
          onClose={() => setIsContextManagerOpen(false)}
          contexts={contexts}
          onAddContext={addContext}
          onRemoveContext={removeContext}
          onClearContexts={clearContexts}
          shouldPersist={shouldPersist}
          onTogglePersist={togglePersist}
        />

        {/* Summary Modal Overlay */}
        {summary && (
          <div className="absolute inset-0 bg-obsidian-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-obsidian-900 border border-obsidian-800 rounded-2xl p-8 max-w-lg w-full shadow-2xl relative animate-in fade-in zoom-in duration-300">
              <button
                onClick={() => setSummary(null)}
                className="absolute top-4 right-4 text-slate-500 hover:text-white"
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

              <h2 className="text-2xl font-bold mb-1 bg-gradient-to-r from-gold to-orange-500 bg-clip-text text-transparent">
                {t.coach.actions.summary_title}
              </h2>
              <p className="text-slate-400 text-sm mb-6 uppercase tracking-wider">
                {summary.topic}
              </p>

              <div className="space-y-6">
                <div className="bg-obsidian-950 p-4 rounded-lg border border-obsidian-800">
                  <p className="text-slate-200 leading-relaxed">
                    {summary.summary}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                    <span className="text-electric">⚡</span>{" "}
                    {t.coach.actions.action_items}
                  </h4>
                  <ul className="space-y-2">
                    {summary.actionItems.map((item: string, i: number) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-slate-300"
                      >
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-electric flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => setSummary(null)}
                  className="w-full bg-white text-obsidian-950 font-bold py-3 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  {t.coach.actions.download_notes}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {settings.speechRecognitionEnabled && (
        <div className="bg-obsidian-900 rounded-xl border border-obsidian-800 p-6 flex flex-col items-center">
          <h3 className="text-lg font-bold mb-4">{t.coach.liveTitle}</h3>
          <p className="text-sm text-slate-400 mb-6 text-center">
            {t.coach.liveDesc}
          </p>
          <LiveCoach
            lang={lang}
            t={t.live}
            viewContext={activeView}
            onNavigate={onNavigate}
            systemInstruction={SYSTEM_INSTRUCTIONS[role]}
          />
        </div>
      )}
    </div>
  );
};
