/* eslint-disable @typescript-eslint/no-explicit-any */
import "./modules"; // Trigger module registration

import { useTranslations } from "@shared/hooks/useTranslations";
import { ChevronLeft, ChevronRight, LayoutGrid, Terminal } from "lucide-react";
import React, { Suspense, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getAllModules } from "../api/registry";
import { useCodeLabContext } from "../hooks/CodeLabContext";
import { CodeModuleConfig } from "../types";
import { CodeLabHub } from "./CodeLabHub";

const MODULE_COMPONENTS: Record<
  string,
  {
    Sidebar?: React.LazyExoticComponent<any>;
    Stage: React.LazyExoticComponent<any>;
  }
> = {
  python: {
    Sidebar: React.lazy(() =>
      import("./modules/python/PythonComponents").then((m) => ({
        default: m.PythonSidebar,
      })),
    ),
    Stage: React.lazy(() =>
      import("./modules/python/PythonComponents").then((m) => ({
        default: m.PythonStage,
      })),
    ),
  },
  web: {
    Sidebar: React.lazy(() =>
      import("./modules/python/PythonComponents").then((m) => ({
        default: m.PlaceholderSidebar,
      })),
    ),
    Stage: React.lazy(() =>
      import("./modules/python/PythonComponents").then((m) => ({
        default: m.PlaceholderComponent,
      })),
    ),
  },
  sql: {
    Sidebar: React.lazy(() =>
      import("./modules/python/PythonComponents").then((m) => ({
        default: m.PlaceholderSidebar,
      })),
    ),
    Stage: React.lazy(() =>
      import("./modules/python/PythonComponents").then((m) => ({
        default: m.PlaceholderComponent,
      })),
    ),
  },
};

export { CodeLabProvider } from "../hooks/CodeLabContext";

export const CodeLabLayout: React.FC = () => {
  const {
    activeModule,
    setActiveModule,
    isSidebarCollapsed,
    setSidebarCollapsed,
  } = useCodeLabContext();
  const navigate = useNavigate();
  const activeComponents = activeModule
    ? MODULE_COMPONENTS[activeModule]
    : null;
  const { t } = useTranslations();
  const { module: urlModule } = useParams();

  useEffect(() => {
    if (urlModule) {
      setActiveModule(urlModule);
    } else {
      setActiveModule("");
    }
  }, [urlModule, setActiveModule]);

  // HUB VIEW
  if (!activeModule) {
    return (
      <div className="flex h-full bg-[#0d1117] text-white font-outfit overflow-hidden relative transition-all duration-300">
        <div className="flex-1 flex flex-col min-w-0 relative">
          <div className="flex-1 relative overflow-hidden bg-grid-pattern">
            <div className="absolute inset-0">
              <CodeLabHub />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-[#0d1117] text-white font-outfit overflow-hidden relative transition-all duration-300">
      {/* Main Sidebar (Navigation) */}
      <div
        className={`
                ${isSidebarCollapsed ? "w-16" : "w-64"}
                transition-all duration-300 ease-in-out
                bg-[#010409] border-r border-white/10 flex flex-col shrink-0 relative z-20 shadow-xl
            `}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-blue-900/20 to-transparent">
          {!isSidebarCollapsed && (
            <button
              onClick={() => navigate("/code")}
              className="flex items-center gap-2 hover:text-blue-400 transition-colors"
            >
              <Terminal className="text-blue-400" size={20} />
              <span className="font-bold tracking-tight text-lg">Code Lab</span>
            </button>
          )}
          <button
            onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 transition-colors"
          >
            {isSidebarCollapsed ? (
              <ChevronRight size={16} />
            ) : (
              <ChevronLeft size={16} />
            )}
          </button>
        </div>

        {/* Module List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-2 px-2 custom-scrollbar">
          {getAllModules().map((module: CodeModuleConfig) => (
            <button
              key={module.id}
              onClick={() => navigate(`/code/${module.id}`)}
              className={`
                                w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group relative
                                ${activeModule === module.id
                  ? "bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-lg shadow-blue-500/5"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent"
                }
                            `}
            >
              <module.icon
                size={20}
                className={`transition-transform duration-300 ${activeModule === module.id ? "scale-110" : "group-hover:scale-110"}`}
              />

              {!isSidebarCollapsed && (
                <div className="text-left flex-1 min-w-0">
                  <div className="font-bold truncate text-sm">
                    {module.label(t)}
                  </div>
                  <div className="text-[10px] opacity-60 truncate">
                    {module.description}
                  </div>
                </div>
              )}

              {/* Tooltip for collapsed mode */}
              {isSidebarCollapsed && (
                <div className="absolute left-full ml-4 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity border border-white/10">
                  <div className="font-bold">{module.label(t)}</div>
                  <div className="opacity-75">{module.description}</div>
                  {/* Arrow */}
                  <div className="absolute top-1/2 right-full -mt-1 -mr-1 border-4 border-transparent border-r-slate-800"></div>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/20">
          <button
            onClick={() => navigate("/dashboard")}
            className={`w-full flex items-center gap-3 p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors ${isSidebarCollapsed ? "justify-center" : ""}`}
          >
            <LayoutGrid size={18} />
            {!isSidebarCollapsed && (
              <span className="text-xs font-medium uppercase tracking-wider">
                Dashboard
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Module Stage */}
        <div className="flex-1 relative overflow-hidden">
          <div className="absolute inset-0">
            <Suspense
              fallback={
                <div className="p-10 text-blue-400 animate-pulse font-mono">
                  {">"} Initializing runtime...
                </div>
              }
            >
              {activeComponents ? (
                <activeComponents.Stage />
              ) : (
                <div className="p-10 text-white">Module not found</div>
              )}
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
};
