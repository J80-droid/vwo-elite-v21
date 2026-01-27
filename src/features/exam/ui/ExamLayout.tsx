import "allotment/dist/style.css";

import { useTranslations } from "@shared/hooks/useTranslations";
import { ExamModule } from "@shared/types/exam";
import { Allotment, LayoutPriority } from "allotment";
import { FileText, Layers, Settings } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";

import { getAllModules } from "../api/registry";
import { useExamContext } from "../hooks/ExamContext";
import { useExamContent } from "./ExamContent";

// --- HELPERS ---
const GlassPanel = ({
  children,
  title,
  icon: Icon,
  className = "",
  color = "indigo",
}: {
  children: React.ReactNode;
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  className?: string;
  color?: string;
}) => {
  const colorMap: Record<string, string> = {
    indigo:
      "from-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.2)] bg-indigo-500/10",
    blue: "from-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.2)] bg-blue-500/10",
    emerald:
      "from-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)] bg-emerald-500/10",
    amber:
      "from-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)] bg-amber-500/10",
    rose: "from-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.2)] bg-rose-500/10",
    purple:
      "from-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.2)] bg-purple-500/10",
  };

  const style = colorMap[color] || colorMap.indigo || "";

  return (
    <div
      className={`bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col overflow-hidden relative group ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-500" />
      <div
        className={`absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r ${style.split(" ")[0] || ""} to-transparent opacity-50`}
      />
      <div className="p-4 border-b border-white/5 flex items-center gap-3 shrink-0 bg-white/[0.02]">
        <div
          className={`p-2 rounded-lg ${style.split(" ").slice(2).join(" ") || ""} ${style.split(" ")[1] || ""}`}
        >
          <Icon size={16} />
        </div>
        <span className="text-xs font-black text-white uppercase tracking-widest">
          {title}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 relative z-10">
        {children}
      </div>
    </div>
  );
};

export const ExamLayout: React.FC = () => {
  const { activeModule, setActiveModule } = useExamContext();

  const content = useExamContent();
  const { t } = useTranslations();
  const modules = getAllModules();
  const navigate = useNavigate();

  // Determine if sidebars should be shown based on content presence
  const showLeftPanel = !!content.Input || !!content.Params;
  const showRightPanel = !!content.Results;

  return (
    <div className="fixed inset-0 bg-slate-950 font-outfit text-white overflow-hidden flex flex-col pt-16">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,1),#000)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)] opacity-20 pointer-events-none" />

      {/* --- TOP NAVIGATION BAR --- */}
      <div className="absolute top-0 left-0 right-0 h-16 z-50 flex items-center px-6 border-b border-white/5 bg-black/50 backdrop-blur-sm justify-between">
        <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
          {modules.map((m) => {
            const isActive = activeModule === m.id;
            const baseColor = m.color.split("-")[1];
            return (
              <button
                key={m.id}
                onClick={() => {
                  setActiveModule(m.id as ExamModule);
                  navigate(`/examen-centrum/${m.id}`);
                }}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2
                  ${
                    isActive
                      ? `bg-${baseColor}-500/20 ${m.color} shadow-[0_0_15px_rgba(var(--${baseColor}-500),0.3)]`
                      : "text-slate-500 hover:text-white hover:bg-white/5"
                  }`}
              >
                <m.icon size={14} />
                {m.label(t)}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest hidden md:block">
            Elite System Hub v2.0
          </span>
          <div className="h-4 w-[1px] bg-white/10 mx-2 hidden md:block" />
          <button className="text-slate-500 hover:text-white transition-colors">
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* --- MAIN SPLIT WORKSPACE --- */}
      <div className="flex-1 relative z-10 min-h-0 container mx-auto p-4 flex flex-col gap-4">
        {activeModule === "dashboard" ? (
          <div className="flex-1">{content.Stage}</div>
        ) : (
          <div className="flex-1 min-h-0">
            <Allotment>
              {/* LEFT PANEL: CONTROLS */}
              {showLeftPanel && (
                <Allotment.Pane preferredSize={320} minSize={280} maxSize={500}>
                  <div className="h-full flex flex-col gap-4 pr-4">
                    {content.Params && (
                      <GlassPanel
                        title="Instellingen"
                        icon={Settings}
                        color="amber"
                        className="max-h-[40%] shrink-0"
                      >
                        {content.Params}
                      </GlassPanel>
                    )}
                    {content.Input && (
                      <GlassPanel
                        title="Input & Data"
                        icon={Layers}
                        color="blue"
                        className="flex-1"
                      >
                        {content.Input}
                      </GlassPanel>
                    )}
                  </div>
                </Allotment.Pane>
              )}

              {/* CENTER & BOTTOM: STAGE & CONSOLE */}
              <Allotment.Pane priority={LayoutPriority.High}>
                <div className="h-full flex flex-col gap-4 relative">
                  {/* The Main Stage */}
                  <div className="flex-1 bg-black/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm shadow-2xl relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
                    {content.Stage}
                  </div>

                  {/* BOTTOM: CONSOLE REMOVED FOR SIMULATOR */}
                  {/* {activeModule === "simulator" && ...} */}
                </div>
              </Allotment.Pane>

              {/* RIGHT PANEL: RESULTS */}
              {showRightPanel && (
                <Allotment.Pane preferredSize={320} minSize={280} maxSize={500}>
                  <div className="h-full pl-4">
                    <GlassPanel
                      title="Resultaten"
                      icon={FileText}
                      color="emerald"
                      className="h-full"
                    >
                      {content.Results}
                    </GlassPanel>
                  </div>
                </Allotment.Pane>
              )}
            </Allotment>
          </div>
        )}
      </div>
    </div>
  );
};
