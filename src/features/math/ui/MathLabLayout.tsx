/* eslint-disable @typescript-eslint/no-explicit-any -- dynamic Lucide icons and module configurations */
import { useGodSlayer } from "@shared/hooks/useGodSlayer";
import { useTranslations } from "@shared/hooks/useTranslations";
import {
  ArrowUpRight,
  Box as BoxIcon,
  ChevronDown,
  ChevronUp,
  Database,
  LineChart,
  Sigma,
  Sparkles,
} from "lucide-react";
import React, { useState } from "react";

import { TutorOverlay } from "./modules/tutor/TutorOverlay";

interface MathLabLayoutProps {
  children: React.ReactNode;
  activeModule: string;
  setActiveModule: (m: any) => void;
  inputSection?: React.ReactNode;
  parameterSection?: React.ReactNode;
  resultSection?: React.ReactNode;
  onSettingsClick?: () => void;
  isConsoleOpen: boolean;
  onConsoleToggle: (isOpen: boolean) => void;
  consoleHeight?: number;
  onConsoleHeightChange?: (height: number) => void;
}

export const MathLabLayout: React.FC<MathLabLayoutProps> = ({
  children,
  activeModule,
  setActiveModule,
  inputSection,
  parameterSection,
  resultSection,
  isConsoleOpen,
  onConsoleToggle,
  consoleHeight = 300,
  onConsoleHeightChange,
}) => {
  const { t } = useTranslations();
  const [isTutorOpen, setIsTutorOpen] = useState(false);

  // If activeModule is 'gym' or 'tutor', we want a cleaner interface
  const isImmersive = ["gym", "tutor", "concepts"].includes(activeModule);

  // Hide console and tabs on hub view (no module selected)
  const isHubView = !activeModule;

  // Register modules on mount to avoid circular dependency
  React.useEffect(() => {
    // Dynamic import to break cycle if needed, or straight call
    import("./modules").then((m) => m.registerMathModules());
  }, []);

  // Configuration for Neon Tabs
  const modules = [
    {
      id: "analytics",
      label: t("calculus.layout.plot_analytics"),
      icon: LineChart,
      color: "text-emerald-400",
      border: "border-emerald-500",
    },
    {
      id: "symbolic",
      label: t("calculus.layout.symbolic_engine"),
      icon: Sigma,
      color: "text-red-400",
      border: "border-red-500",
    },
    {
      id: "vectors",
      label: t("calculus.layout.vector_space"),
      icon: ArrowUpRight,
      color: "text-amber-400",
      border: "border-amber-500",
    },
    {
      id: "formulas",
      label: t("calculus.layout.binas_formulas"),
      icon: Database,
      color: "text-blue-400",
      border: "border-blue-500",
    },
    {
      id: "3d",
      label: t("calculus.layout.threed_surface"),
      icon: BoxIcon,
      color: "text-violet-400",
      border: "border-violet-500",
    },
  ];

  // FORCE REMOVE XR BUTTON (The "God Slayer" Hook)
  useGodSlayer();

  return (
    <div
      className="h-full w-full bg-black font-outfit transition-all duration-300 z-0"
    >
      {/* Brute-force CSS for XR Button - SAFE VERSION */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
#XRButton,
  #VRButton,
  button[aria-label="Enter XR"],
  button[aria-label="Enter VR"],
  button[title="Enter XR"],
  button[title="Enter VR"] {
  display: none !important;
  opacity: 0 !important;
  pointer-events: none !important;
  visibility: hidden !important;
  z-index: -9999 !important;
}
`,
        }}
      />

      {/* 1. STAGE */}
      <div
        id="mathlab-stage"
        className="absolute inset-0 z-0 bg-gradient-to-b from-obsidian-950 to-black transition-all duration-500"
      >
        {children}
      </div>

      {/* 2. TABS */}
      {!isImmersive && !isHubView && (
        <div className="absolute top-0 left-0 right-0 z-20 flex px-6 pt-4 pointer-events-none">
          <div className="flex gap-1 pointer-events-auto items-end">
            {modules.map((m) => {
              const isActive = activeModule === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setActiveModule(m.id);
                    onConsoleToggle(true);
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
                  <m.icon
                    size={14}
                    className={isActive ? "animate-pulse" : ""}
                  />
                  {m.label}
                  {isActive && (
                    <div
                      className={`absolute -bottom-[1px] left-2 right-2 h-[2px] ${m.border.replace("border", "bg")} shadow-[0_0_10px_currentColor]`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. CONSOLE */}
      {!isImmersive && !isHubView && (
        <div
          className="absolute bottom-0 left-0 right-0 z-30 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) flex flex-col"
          style={{
            height: isConsoleOpen ? `${consoleHeight}px` : "56px",
            boxShadow: isConsoleOpen
              ? "0 -4px 30px rgba(0,0,0,0.5), 0 -1px 0 rgba(255,255,255,0.1)"
              : "none",
          }}
        >
          {/* ... (Existing console logic remains unchanged, omitted for brevity if not modifying) ... */}
          {/* Re-asserting console logic to ensure drop-in replacement works if truncated. 
                        Wait, I should probably target a smaller block if I want to append. 
                        Actually, the user asked to put it BEFORE the closing div. 
                        Let me target the closing div primarily.
                    */}

          {/* Resize Handle */}
          {isConsoleOpen && onConsoleHeightChange && (
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
                  onConsoleHeightChange(newH);
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
              onClick={() => onConsoleToggle(!isConsoleOpen)}
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
              {isConsoleOpen
                ? t("calculus.layout.minimize")
                : t("calculus.layout.open_controls")}
              {isConsoleOpen ? (
                <ChevronDown size={12} />
              ) : (
                <ChevronUp size={12} />
              )}
            </button>
          </div>

          {/* Main Deck */}
          <div
            className={`flex-1 w-full bg-obsidian-900/95 backdrop-blur-xl border-t border-white/10 flex transition-opacity duration-300 overflow-hidden ${isConsoleOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          >
            {/* Input Section */}
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar border-r border-white/5">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                Input
              </h3>
              {inputSection}
            </div>

            {/* Parameters Section */}
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar border-r border-white/5">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                Parameters
              </h3>
              {parameterSection}
            </div>

            {/* Results Section */}
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                Results
              </h3>
              {resultSection}
            </div>
          </div>
        </div>
      )}

      {/* --- FINAL PIECE: AI TUTOR FAB --- */}
      <button
        onClick={() => setIsTutorOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-violet-600 hover:bg-violet-500 text-white rounded-full shadow-[0_0_30px_rgba(124,58,237,0.5)] flex items-center justify-center transition-all hover:scale-110 active:scale-95 group animate-in slide-in-from-bottom-10 duration-700"
        title="Ask Newton"
      >
        <Sparkles
          size={28}
          className="group-hover:rotate-12 transition-transform"
        />

        {/* Notification Badge (Optioneel voor later) */}
        <span className="absolute top-0 right-0 w-4 h-4 bg-rose-500 rounded-full border-2 border-obsidian-950" />
      </button>

      <TutorOverlay
        isOpen={isTutorOpen}
        onClose={() => setIsTutorOpen(false)}
      />
    </div>
  );
};
