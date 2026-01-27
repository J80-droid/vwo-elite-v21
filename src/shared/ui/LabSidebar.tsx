import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react";
import React from "react";

import { type TFunction } from "../types/i18n";

export interface LabModule {
  id: string;
  icon: LucideIcon;
  label: (t: TFunction) => string;
}

export interface LabNavCategory {
  id: string;
  label: (t: TFunction) => string;
  modules: string[];
}

export interface LabTheme {
  border: string;
  bg: string;
  text: string;
  shadow: string;
  icon: string;
  glow: string;
}

interface LabSidebarProps {
  activeModule: string;
  onSelect: (id: string) => void;
  isCollapsed: boolean;
  onToggle: () => void;
  t: TFunction;
  modules: LabModule[];
  categories: LabNavCategory[];
  themes: Record<string, LabTheme>;
  defaultTheme: LabTheme;
  labTitle?: string;
  footerProtocol?: string;
  onBack?: () => void;
}

export const LabSidebar: React.FC<LabSidebarProps> = ({
  activeModule,
  onSelect,
  isCollapsed,
  onToggle,
  t,
  modules,
  categories,
  themes,
  defaultTheme,
  labTitle = "Lab Modules",
  footerProtocol = "Elite-CORE Protocol v2.5",
}) => {
  return (
    <div
      className={`
            ${isCollapsed ? "w-16" : "w-64"}
            border-r border-white/10 bg-black/40 backdrop-blur-xl flex flex-col h-full z-40
            transition-all duration-300 ease-in-out
        `}
    >
      {/* Sidebar Header with Toggle */}
      <div
        className={`flex items-center p-4 border-b border-white/5 bg-white/[0.02] ${isCollapsed ? "justify-center" : "justify-between"}`}
      >
        {!isCollapsed && (
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 whitespace-nowrap">
            {labTitle}
          </span>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 transition-colors"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-6">
        {categories.map((cat) => (
          <div key={cat.id} className="space-y-3">
            {!isCollapsed ? (
              <div className="px-3 flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500/50">
                  {cat.label(t)}
                </span>
                <div className="flex-1 h-px bg-white/5" />
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="w-8 h-px bg-white/5" />
              </div>
            )}

            <div className="space-y-1">
              {cat.modules.map((modId) => {
                const mod = modules.find((m) => m.id === modId);
                if (!mod) return null;
                const isActive = activeModule === modId;
                const theme = themes[modId] || defaultTheme;

                return (
                  <button
                    key={modId}
                    onClick={() => onSelect(modId)}
                    className={`
                                            w-full group relative px-2.5 py-2.5 rounded-xl transition-all duration-300
                                            flex items-center gap-3 text-left
                                            ${isActive
                        ? `bg-white/5 ${theme.text} shadow-lg shadow-black/20`
                        : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]"
                      }
                                            ${isCollapsed ? "justify-center" : ""}
                                        `}
                  >
                    <div
                      className={`
                                            p-1.5 rounded-lg border transition-all duration-500 shrink-0
                                            ${isActive
                          ? `${theme.border} ${theme.bg} ${theme.text} scale-110 shadow-glow`
                          : `border-white/5 bg-black/20 ${theme.text} opacity-40 group-hover:opacity-100 group-hover:border-white/10 group-hover:bg-white/5`
                        }
                                        `}
                    >
                      <mod.icon size={16} />
                    </div>

                    {!isCollapsed && (
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold leading-none mb-1 truncate">
                          {mod.label(t)}
                        </span>
                        {isActive && (
                          <motion.span
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-[8px] font-black uppercase tracking-widest opacity-50"
                          >
                            Active Stage
                          </motion.span>
                        )}
                      </div>
                    )}

                    {/* Tooltip for collapsed mode */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-4 px-3 py-2 bg-slate-800 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity border border-white/10">
                        {mod.label(t)}
                        {/* Arrow */}
                        <div className="absolute top-1/2 right-full -mt-1 -mr-1 border-4 border-transparent border-r-slate-800"></div>
                      </div>
                    )}

                    {isActive && (
                      <motion.div
                        layoutId="sidebarActive"
                        className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-gradient-to-b ${theme.glow}`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div
        className={`p-4 border-t border-white/5 bg-black/20 ${isCollapsed ? "flex justify-center" : ""}`}
      >
        <div
          className={`flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 border border-white/5 ${isCollapsed ? "w-8 h-8 justify-center overflow-hidden" : ""}`}
        >
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          {!isCollapsed && (
            <span className="text-[10px] font-mono text-slate-400 tracking-tighter">
              {footerProtocol}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
