import { useLiveBenchmarks } from "@shared/hooks/useLiveBenchmarks";
import { useTranslations } from "@shared/hooks/useTranslations";
import { Activity, ChevronLeft, ChevronRight, Cpu, Database, HardDrive, Wifi } from "lucide-react";
import React, { useEffect, useState } from "react";

import { getAllModules } from "../api/registry";
import { useSettingsContext } from "../hooks/SettingsContext";

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export const SettingsLayout: React.FC<SettingsLayoutProps> = ({ children }) => {
  // Trigger live benchmark fetch when Control Center is active
  useLiveBenchmarks();

  const { activeModule, setActiveModule } = useSettingsContext();
  const { t } = useTranslations();
  const modules = getAllModules();

  const [simulatedStats, setSimulatedStats] = useState({
    cpu: 12,
    mem: 45,
    ping: 24,
  });

  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("vwo_settings_sidebar_collapsed");
    return saved === "true";
  });

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("vwo_settings_sidebar_collapsed", String(next));
      return next;
    });
  };

  // Simulate system activity
  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedStats({
        cpu: Math.floor(Math.random() * 20) + 10,
        mem: Math.floor(Math.random() * 10) + 40,
        ping: Math.floor(Math.random() * 15) + 20,
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full w-full bg-black font-outfit flex overflow-hidden">
      {/* 1. SIDEBAR NAVIGATION */}
      <div className={`
        ${isCollapsed ? "w-20" : "w-64"} 
        bg-obsidian-950/80 border-r border-white/5 backdrop-blur-xl flex flex-col p-4 z-20 transition-all duration-300 ease-in-out
      `}>
        <div className={`mb-8 px-2 pt-4 transition-all duration-300 ${isCollapsed ? "flex flex-col items-center" : ""}`}>
          <h1 className={`text-xl font-black text-white tracking-tight uppercase flex items-center gap-2 ${isCollapsed ? "justify-center" : ""}`}>
            <Activity className="text-electric shrink-0" size={20} />
            {!isCollapsed && <span>Control Center</span>}
          </h1>
          {!isCollapsed && (
            <p className="text-[10px] text-slate-500 font-mono mt-1 pl-7">
              SYSTEM_V2.0 // ONLINE
            </p>
          )}
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto overflow-x-hidden custom-scrollbar px-4 -mx-4 py-2">
          {modules.map((m) => {
            const isActive = activeModule === m.id;
            const colorName = m.color.replace("text-", "").replace("-400", "");

            return (
              <button
                key={m.id}
                onClick={() => setActiveModule(m.id)}
                title={isCollapsed ? m.label(t) : undefined}
                className={`
                  w-full relative flex items-center gap-3 rounded-xl text-[11px] font-bold transition-all duration-300 group
                  ${isCollapsed ? "justify-center p-3" : "px-4 py-3.5"}
                  ${isActive
                    ? `${m.color} bg-white/[0.03] border-white/10`
                    : "text-slate-500 hover:text-slate-200 hover:bg-white/[0.02] border-transparent"
                  }
                  border backdrop-blur-md
                `}
                style={
                  isActive
                    ? ({
                      "--glow-color": `var(--color-${colorName}-500, rgba(99,102,241,0.5))`,
                    } as React.CSSProperties)
                    : undefined
                }
              >
                {/* Elite Active Glow Layer */}
                {isActive && (
                  <div
                    className="absolute inset-0 rounded-xl opacity-20 blur-xl transition-opacity duration-1000"
                    style={{ backgroundColor: "var(--glow-color)" }}
                  />
                )}

                {/* Active Indicator Bar */}
                {isActive && (
                  <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-current shadow-[0_0_15px_currentColor] ${isCollapsed ? "h-8" : ""}`} />
                )}

                <div
                  className={`relative p-2 rounded-lg transition-all duration-500 shrink-0 ${isActive ? `${m.color} scale-110 drop-shadow-[0_0_12px_currentColor]` : "text-slate-600 group-hover:text-slate-300"}`}
                >
                  <m.icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                </div>

                {!isCollapsed && (
                  <span className="flex-1 text-left tracking-wide uppercase truncate">
                    {m.label(t)}
                  </span>
                )}

                {isActive && !isCollapsed && (
                  <div
                    className={`relative w-1.5 h-1.5 rounded-full ${m.color.replace("text-", "bg-")} shadow-[0_0_10px_currentColor] animate-pulse`}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Toggle & System Footer Status */}
        <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
          <div className="space-y-2">
            <div className={`flex items-center text-[10px] text-slate-500 font-mono ${isCollapsed ? "justify-center" : "justify-between"}`}>
              <span className="flex items-center gap-1.5">
                <Cpu size={10} /> {!isCollapsed && "CPU"}
              </span>
              {!isCollapsed && <span className="text-electric">{simulatedStats.cpu}%</span>}
            </div>
            <div className={`flex items-center text-[10px] text-slate-500 font-mono ${isCollapsed ? "justify-center" : "justify-between"}`}>
              <span className="flex items-center gap-1.5">
                <Database size={10} /> {!isCollapsed && "MEM"}
              </span>
              {!isCollapsed && <span className="text-emerald-400">{simulatedStats.mem}%</span>}
            </div>
            {!isCollapsed && (
              <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                <span className="flex items-center gap-1.5">
                  <Wifi size={10} /> NET
                </span>
                <span className="text-amber-400">{simulatedStats.ping}ms</span>
              </div>
            )}
          </div>

          {/* ELITE: Provider Health Monitoring */}
          {!isCollapsed && (
            <div className="space-y-3 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">
                <span>Neural Providers</span>
                <span className="text-emerald-500/50">Elite_v4</span>
              </div>

              <div className="space-y-2">
                {[
                  { id: "Gemini", status: "Optimal", color: "text-electric", latency: "140ms" },
                  { id: "Groq", status: "Ready", color: "text-amber-400", latency: "80ms" },
                  { id: "HuggingFace", status: "Active", color: "text-slate-400", latency: "210ms" }
                ].map(p => (
                  <div key={p.id} className="flex items-center justify-between group cursor-default">
                    <div className="flex items-center gap-2">
                      <div className={`w-1 h-1 rounded-full ${p.color.replace('text-', 'bg-')} shadow-[0_0_8px_currentColor] animate-pulse`} />
                      <span className="text-[10px] font-bold text-slate-300 group-hover:text-white transition-colors">{p.id}</span>
                    </div>
                    <div className="text-[9px] font-mono text-slate-500 flex items-center gap-2">
                      <span>{p.latency}</span>
                      <span className={`${p.color} opacity-80`}>{p.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={toggleSidebar}
            className={`w-full p-2 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all ${isCollapsed ? "" : "gap-2 text-[10px] font-black uppercase tracking-widest"}`}
          >
            {isCollapsed ? <ChevronRight size={14} /> : (
              <>
                <ChevronLeft size={14} />
                <span>Inklappen</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 relative bg-black flex flex-col min-w-0">
        {/* Header Bar - Hidden in architecture module for full immersion */}
        {activeModule !== "architecture" && (
          <div className="h-16 border-b border-white/5 px-8 flex items-center justify-between bg-black/50 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <div className="text-xs font-mono text-slate-500 uppercase tracking-widest">
                Active Module
              </div>
              <div className="h-4 w-[1px] bg-white/10" />
              <div className="text-sm font-bold text-white uppercase tracking-wider">
                {modules.find((m) => m.id === activeModule)?.label(t)}
              </div>
            </div>

            {/* Quick Glances */}
            <div className="flex gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
                <HardDrive size={12} className="text-slate-400" />
                <span className="text-[10px] font-mono text-slate-300">
                  OPFS: READY
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-mono text-emerald-400">
                  SECURE SHELL
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Stage */}
        <div
          className={`flex-1 ${activeModule === "architecture" ? "overflow-hidden" : "overflow-y-auto p-8"} custom-scrollbar`}
        >
          <div
            className={`w-full h-full ${activeModule === "architecture" ? "" : "animate-in fade-in zoom-in-95 duration-300"}`}
          >
            {children}
          </div>
        </div>

        {/* Background Grid Ambience */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>
    </div>
  );
};
