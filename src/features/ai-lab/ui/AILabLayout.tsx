/* eslint-disable @typescript-eslint/no-explicit-any */
import { BrainCircuit } from "lucide-react";
import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { AI_LAB_MODULES } from "../api/registry";
import { useAILab } from "../hooks/AILabContext";
import type { AILabModuleId } from "../types";
import { AILabHub } from "./AILabHub";

const MODULE_COMPONENTS: Record<
  string,
  React.LazyExoticComponent<React.ComponentType<any>>
> = {
  "prompt-eng": React.lazy(() =>
    import("./modules/prompt-engineering").then((m) => ({
      default: m.NeuralForge,
    })),
  ),
  architecture: React.lazy(() =>
    import("./modules/architecture").then((m) => ({
      default: m.NeuralArchitect,
    })),
  ),
  dashboard: React.lazy(() =>
    import("./modules/NeuralDashboard").then((m) => ({
      default: m.NeuralDashboard,
    })),
  ),
};

// Module inner logic kept here for now

export { AILabProvider } from "../hooks/AILabContext";

export const AILabLayout: React.FC = () => {
  const { activeModuleId, setActiveModuleId } = useAILab();
  const ActiveComponent = activeModuleId
    ? MODULE_COMPONENTS[activeModuleId]
    : null;
  const { module: urlModule } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (urlModule) {
      setActiveModuleId(urlModule as AILabModuleId);
    } else {
      setActiveModuleId("");
    }
  }, [urlModule, setActiveModuleId]);

  // HUB VIEW
  if (!activeModuleId) {
    return (
      <div className="flex h-full bg-obsidian-950 text-white font-outfit overflow-hidden">
        <div className="flex-1 relative overflow-hidden flex flex-col bg-black/50">
          <AILabHub />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-obsidian-950 text-white font-outfit overflow-hidden">
      {/* LAB SIDEBAR */}
      <div className="w-20 md:w-64 border-r border-white/5 bg-obsidian-900 flex flex-col z-20">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <button
            onClick={() => navigate("/ailab")}
            className="flex items-center gap-3 hover:text-white transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-electric/10 flex items-center justify-center text-electric shadow-[0_0_15px_rgba(0,240,255,0.2)]">
              <BrainCircuit size={24} />
            </div>
            <div className="hidden md:block">
              <h1 className="font-bold text-lg tracking-tight">AI Lab</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                Neural Campus
              </p>
            </div>
          </button>
        </div>

        <div className="flex-1 py-6 px-3 space-y-2">
          {AI_LAB_MODULES.map((module) => {
            const isActive = activeModuleId === module.id;
            return (
              <button
                key={module.id}
                onClick={() => navigate(`/ailab/${module.id}`)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group
                                    ${isActive
                    ? "bg-white/5 border border-white/10 shadow-lg"
                    : "hover:bg-white/5 border border-transparent opacity-60 hover:opacity-100"
                  }`}
              >
                <div
                  className={`p-2 rounded-lg transition-all ${isActive ? "bg-black/40 text-electric" : "text-slate-400 group-hover:text-white"}`}
                >
                  <module.icon size={20} />
                </div>
                <div className="text-left hidden md:block">
                  <div
                    className={`text-sm font-bold ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"}`}
                  >
                    {module.label}
                  </div>
                  <div className="text-[10px] text-slate-600 truncate max-w-[120px]">
                    {module.description}
                  </div>
                </div>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-electric shadow-[0_0_5px_cyan] hidden md:block" />
                )}
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-white/5">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
            <p className="text-[10px] text-indigo-300 leading-relaxed text-center">
              "AI is not magic. It's engineering."
            </p>
          </div>
        </div>
      </div>

      {/* MAIN STAGE */}
      <div className="flex-1 relative overflow-hidden flex flex-col bg-black/50">
        <React.Suspense
          fallback={
            <div className="flex-1 flex items-center justify-center text-electric animate-pulse">
              Initializing AI Lab Environment...
            </div>
          }
        >
          {ActiveComponent ? (
            <ActiveComponent />
          ) : (
            <div className="p-10 text-white">Select a module</div>
          )}
        </React.Suspense>
      </div>
    </div>
  );
};
