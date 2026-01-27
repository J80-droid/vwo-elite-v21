import { ModuleStageProps } from "@features/math/types";
import {
  AlertTriangle,
  ArrowLeft,
  GraduationCap,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";

import { ErrorAnalysis } from "./components/ErrorAnalysis";
import { ProofBlocks } from "./components/ProofBlocks";
import { useTutorContext } from "./hooks/useTutorContext";

export const TutorStage: React.FC<ModuleStageProps> = () => {
  const { submodule: activeMode } = useParams();
  const navigate = useNavigate();
  const { getContextPrompt } = useTutorContext();
  const contextPrompt = getContextPrompt();

  if (activeMode) {
    return (
      <div className="h-full flex flex-col bg-obsidian-950">
        <div
          className={`flex-none p-4 border-b border-white/5 flex items-center gap-4 backdrop-blur-md ${activeMode === "proof" ? "bg-violet-500/5" : activeMode === "analysis" ? "bg-rose-500/5" : "bg-cyan-500/5"}`}
        >
          <button
            onClick={() => navigate("/math-modern/tutor")}
            className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all hover:scale-110 active:scale-90"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col">
            <span
              className={`text-[10px] uppercase font-black tracking-widest ${activeMode === "proof" ? "text-violet-500" : activeMode === "analysis" ? "text-rose-500" : "text-cyan-500"}`}
            >
              Layer 3: AI Tutor
            </span>
            <span className="font-bold text-white tracking-tight uppercase">
              {activeMode === "proof"
                ? "Bewijs Blokken"
                : activeMode === "analysis"
                  ? "Primitieve Politie"
                  : "Vraag het Newton"}
            </span>
          </div>
        </div>
        <div className="flex-1 overflow-hidden p-6 relative">
          {/* Ambient Glow in active mode */}
          <div
            className={`absolute top-0 right-0 w-64 h-64 blur-[100px] pointer-events-none opacity-20 ${activeMode === "proof" ? "bg-violet-500" : activeMode === "analysis" ? "bg-rose-500" : "bg-cyan-500"}`}
          />
          {activeMode === "proof" ? (
            <ProofBlocks />
          ) : activeMode === "analysis" ? (
            <ErrorAnalysis />
          ) : (
            <ChatInterface contextPrompt={contextPrompt} />
          )}
        </div>
      </div>
    );
  }

  // Dashboard View
  return (
    <div className="h-full w-full overflow-y-auto p-4 md:p-8 relative selection:bg-violet-500/30">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-violet-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto pb-32 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-16 gap-8 border-b border-white/5 pb-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-1 bg-violet-500/50 rounded-full" />
              <span className="text-[10px] font-black text-violet-500 uppercase tracking-widest">
                Socratic AI Module
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4 flex items-center gap-4">
              The Tutor{" "}
              <span className="px-3 py-1 bg-white/5 border border-white/10 text-violet-400 text-xs rounded-full font-bold tracking-normal uppercase">
                Layer 3
              </span>
            </h2>
            <p className="text-slate-400 max-w-lg text-lg font-medium leading-relaxed">
              De Socratische AI. Vraag om hulp, train je redeneren en leer{" "}
              <span className="text-white font-bold">waarom</span>, niet alleen
              hoe.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Mode 1: Proof Blocks */}
          <button
            onClick={() => navigate("/math-modern/tutor/proof")}
            className="group relative h-72 bg-white/5 border border-violet-500/20 rounded-3xl p-10 text-left transition-all duration-500 hover:bg-white/[0.08] hover:scale-[1.02] shadow-[0_0_20px_rgba(139,92,246,0.1)] hover:shadow-[0_0_40px_rgba(139,92,246,0.15)] overflow-hidden"
          >
            <div className="absolute -inset-24 bg-violet-500/5 opacity-20 blur-3xl group-hover:opacity-40 transition-opacity duration-700 pointer-events-none" />
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-all duration-700 rotate-12 group-hover:rotate-0 text-violet-500">
              <GraduationCap size={140} />
            </div>
            <div className="h-full flex flex-col justify-between relative z-10">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-violet-400 text-[10px] font-black uppercase tracking-widest mb-6 border border-violet-500/20">
                  Meetkunde
                </div>
                <h3 className="text-3xl font-black text-white mb-3 group-hover:text-white transition-colors tracking-tight uppercase">
                  Bewijs Blokken
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed font-medium">
                  Sleep logische stappen in de juiste volgorde. Train je
                  redeneervermogen zonder typwerk.
                </p>
              </div>
            </div>
          </button>

          {/* Mode 2: Chat with Newton */}
          <button
            onClick={() => navigate("/math-modern/tutor/chat")}
            className="group relative h-72 bg-white/5 border border-cyan-500/20 rounded-3xl p-10 text-left transition-all duration-500 hover:bg-white/[0.08] hover:scale-[1.02] shadow-[0_0_20px_rgba(6,182,212,0.1)] hover:shadow-[0_0_40px_rgba(6,182,212,0.15)] overflow-hidden"
          >
            <div className="absolute -inset-24 bg-cyan-500/5 opacity-20 blur-3xl group-hover:opacity-40 transition-opacity duration-700 pointer-events-none" />
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-all duration-700 -rotate-12 group-hover:rotate-0 text-cyan-500">
              <MessageSquare size={140} />
            </div>
            <div className="h-full flex flex-col justify-between relative z-10">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-6 border border-cyan-500/20">
                  AI Coach
                </div>
                <h3 className="text-3xl font-black text-white mb-3 group-hover:text-white transition-colors tracking-tight uppercase">
                  Vraag het Newton
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed font-medium">
                  Je persoonlijke denkpartner. Geeft nooit zomaar het antwoord,
                  maar helpt je het zelf te vinden.
                </p>
              </div>
            </div>
          </button>

          {/* Mode 3: Primitieve Politie (Error Analysis) */}
          <button
            onClick={() => navigate("/math-modern/tutor/analysis")}
            className="group relative h-72 bg-white/5 border border-rose-500/20 rounded-3xl p-10 text-left transition-all duration-500 hover:bg-white/[0.08] hover:scale-[1.02] shadow-[0_0_20px_rgba(244,63,94,0.1)] hover:shadow-[0_0_40px_rgba(244,63,94,0.15)] overflow-hidden"
          >
            <div className="absolute -inset-24 bg-rose-500/5 opacity-20 blur-3xl group-hover:opacity-40 transition-opacity duration-700 pointer-events-none" />
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-all duration-700 -rotate-12 group-hover:rotate-0 text-rose-500">
              <AlertTriangle size={140} />
            </div>
            <div className="h-full flex flex-col justify-between relative z-10">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-rose-400 text-[10px] font-black uppercase tracking-widest mb-6 border border-rose-500/20">
                  Foutenanalyse
                </div>
                <h3 className="text-3xl font-black text-white mb-3 group-hover:text-white transition-colors tracking-tight uppercase">
                  Primitieve Politie
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed font-medium">
                  De AI maakt fouten. Aan jou de taak om ze te vinden. Train je
                  instinct door fouten te spotten.
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

// Chat Interface (Mock for Layer 3 MVP)
const ChatInterface = ({ contextPrompt }: { contextPrompt: string }) => (
  <div className="h-full flex flex-col bg-white/5 rounded-3xl overflow-hidden border border-white/10 shadow-2xl backdrop-blur-xl relative">
    <div className="absolute top-0 right-0 p-8 opacity-5 text-cyan-500 pointer-events-none">
      <Sparkles size={80} />
    </div>

    <div className="bg-cyan-500/5 p-6 border-b border-white/5 flex justify-between items-center relative z-10">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
          <Sparkles size={20} />
        </div>
        <div className="flex flex-col">
          <span className="text-white font-black uppercase tracking-tight">
            Newton (AI Tutor)
          </span>
          <span className="text-[10px] text-cyan-500 font-bold tracking-widest uppercase">
            Layer 3 Intelligence
          </span>
        </div>
      </div>
      <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
        Context: {contextPrompt.substring(0, 15)}...
      </div>
    </div>

    <div className="flex-1 p-8 text-slate-400 italic flex items-center justify-center text-center relative z-10">
      <div className="max-w-md">
        <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center text-slate-600 mb-6 mx-auto border border-white/5">
          <GraduationCap size={40} className="animate-pulse" />
        </div>
        <p className="text-lg font-medium text-slate-300 mb-2">
          Ik ben Newton.
        </p>
        <p className="text-sm">
          Stel me een vraag over je wiskunde opgave en we plannen samen de route
          naar het antwoord.
        </p>
        <p className="text-[10px] mt-8 opacity-30 font-bold tracking-[0.2em] uppercase">
          Simuleer Chat Verbinding...
        </p>
      </div>
    </div>

    <div className="p-6 bg-black/20 border-t border-white/5 backdrop-blur-md">
      <div className="relative group">
        <input
          type="text"
          placeholder="Typ je vraag aan Newton..."
          disabled
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-sm text-white cursor-not-allowed opacity-40 transition-all"
        />
        <button
          disabled
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/5 rounded-xl border border-white/10 text-slate-600"
        >
          <ArrowLeft size={18} className="rotate-180" />
        </button>
      </div>
    </div>
  </div>
);
