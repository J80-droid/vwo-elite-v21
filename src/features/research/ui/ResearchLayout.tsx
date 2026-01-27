/* eslint-disable @typescript-eslint/no-explicit-any */
import { useTranslations } from "@shared/hooks/useTranslations";
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Layers,
  Settings,
} from "lucide-react";
import React from "react";

import { getAllModules } from "../api/registry";
import { useResearchContext } from "../hooks/ResearchContext";

interface ResearchLayoutProps {
  children: React.ReactNode;
  inputSection?: React.ReactNode;
  parameterSection?: React.ReactNode;
  resultSection?: React.ReactNode;
}

export const ResearchLayout: React.FC<ResearchLayoutProps> = ({
  children,
  inputSection,
  parameterSection,
  resultSection,
}) => {
  const {
    activeModule,
    setActiveModule,
    isConsoleOpen,
    setIsConsoleOpen,
    consoleHeight,
    setConsoleHeight,
  } = useResearchContext();

  const { t } = useTranslations();

  const modules = getAllModules();

  return (
    <div className="h-full bg-black font-outfit transition-all duration-300 z-0">
      {/* 1. STAGE */}
      <div
        id="research-stage"
        className={`absolute inset-0 z-0 bg-gradient-to-b from-obsidian-950 to-black transition-all duration-500`}
      >
        {children}
      </div>

      {/* 2. TABS */}
      <div className="absolute top-0 left-0 right-0 z-20 flex px-6 pt-4 pointer-events-none pl-[3.5rem] lg:pl-0">
        <div className="flex gap-1 pointer-events-auto items-end">
          {modules.map((m) => {
            const isActive = activeModule === m.id;
            return (
              <button
                key={m.id}
                onClick={() => {
                  setActiveModule(m.id as any);
                  setIsConsoleOpen(true);
                }}
                className={`
                                    relative px-6 py-3 flex items-center gap-2
                                    text-[10px] font-black uppercase tracking-widest transition-all duration-200
                                    rounded-t-xl border-t border-x backdrop-blur-md
                                    ${isActive
                    ? `bg-black/80 ${m.color} border-white/20 translate-y-[1px] z-10 shadow-[0_5px_15px_rgba(0,0,0,0.5)] h-12`
                    : "bg-black/40 text-slate-500 border-transparent hover:bg-black/60 hover:text-slate-300 h-10 mb-0"
                  }
`}
              >
                <m.icon size={14} className={isActive ? "animate-pulse" : ""} />
                {m.label(t)}
                {isActive && (
                  <div
                    className={`absolute -bottom-[1px] left-2 right-2 h-[2px] ${m.borderColor.replace("border", "bg")} shadow-[0_0_10px_currentColor]`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. CONSOLE */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-30 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) flex flex-col pl-[3.5rem] lg:pl-0`}
        style={{
          height: isConsoleOpen ? `${consoleHeight}px` : "56px",
          boxShadow: isConsoleOpen
            ? "0 -4px 30px rgba(0,0,0,0.5), 0 -1px 0 rgba(255,255,255,0.1)"
            : "none",
        }}
      >
        {/* Resize Handle */}
        {isConsoleOpen && setConsoleHeight && (
          <div
            className="absolute top-0 left-0 right-0 h-2 -mt-1 cursor-ns-resize z-50 hover:bg-emerald-500/50 transition-colors"
            onMouseDown={(e) => {
              e.preventDefault();
              const startY = e.clientY;
              const startH = consoleHeight;
              const onMove = (mv: MouseEvent) => {
                const newH = Math.max(
                  200,
                  Math.min(
                    window.innerHeight - 100,
                    startH - (mv.clientY - startY),
                  ),
                );
                setConsoleHeight(newH);
              };
              const onUp = () => {
                window.removeEventListener("mousemove", onMove);
                window.removeEventListener("mouseup", onUp);
              };
              window.addEventListener("mousemove", onMove);
              window.addEventListener("mouseup", onUp);
            }}
          />
        )}

        {/* --- CONSOLE HEADER --- */}
        <div className="absolute top-0 left-0 right-0 h-0 flex justify-end px-4 z-50">
          <button
            onClick={() => setIsConsoleOpen(!isConsoleOpen)}
            className={`
                            relative -top-8 pointer-events-auto
                            flex items-center gap-2 px-4 py-2
                            bg-black/90 backdrop-blur border border-white/10 rounded-t-lg
                            text-[10px] font-black text-slate-400 uppercase tracking-widest
                            hover:text-white hover:bg-obsidian-800 hover:border-white/20
                            transition-all shadow-lg
                            ${!isConsoleOpen ? "translate-y-8 rounded-none border-b-0" : ""}
`}
          >
            {isConsoleOpen ? "Minimize" : "Controls"}
            {isConsoleOpen ? (
              <ChevronDown size={12} />
            ) : (
              <ChevronUp size={12} />
            )}
          </button>
        </div>

        {/* Main Deck */}
        <div
          className={`flex-1 w-full bg-obsidian-900/95 backdrop-blur-xl border-t border-white/10 flex transition-opacity duration-300 overflow-hidden ${isConsoleOpen ? "opacity-100" : "opacity-0 pointer-events-none"} `}
        >
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          <div className="w-full h-full grid grid-cols-12 divide-x divide-white/5 relative z-10">
            {/* COLUMN 1: INPUT */}
            <div className="col-span-4 flex flex-col h-full min-h-0">
              <div className="px-6 pt-6 shrink-0">
                <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">
                  <Layers size={12} /> Sources & Input
                </h4>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar px-6">
                <div className="pb-32">
                  {inputSection || (
                    <div className="text-slate-600 text-xs italic">
                      No input controls
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* COLUMN 2: PARAMETERS */}
            <div className="col-span-4 flex flex-col h-full min-h-0 bg-white/[0.01]">
              <div className="px-6 pt-6 shrink-0">
                <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">
                  <Settings size={12} /> Analysis Tools
                </h4>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar px-6">
                <div className="pb-32">
                  {parameterSection || (
                    <div className="text-slate-600 text-xs italic">
                      No settings available
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* COLUMN 3: RESULTS */}
            <div className="col-span-4 flex flex-col h-full min-h-0 bg-black/20">
              <div
                className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full opacity-50 blur-2xl pointer-events-none`}
              />
              <div className="px-6 pt-6 shrink-0 relative z-10">
                <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">
                  <FileText size={12} /> Notes & Synthesis
                </h4>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar px-6 relative z-10">
                <div className="pb-32">
                  {resultSection || (
                    <div className="text-slate-600 text-xs italic">
                      No output
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
