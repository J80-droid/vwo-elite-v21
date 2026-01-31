import { useLanguageLabContext } from "@features/language/hooks/LanguageLabContext";
import { useTranslations } from "@shared/hooks/useTranslations";
import { ChevronLeft, LayoutGrid } from "lucide-react";
import React, { Suspense, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getAllModules } from "../api/registry";
import { LanguageModuleConfig } from "../types";
import { LanguageLabHub } from "./LanguageLabHub";
import { LanguageLabRootHub } from "./LanguageLabRootHub";

export { LanguageLabProvider } from "../hooks/LanguageLabContext";

const MODULE_COMPONENTS: Record<
  string,
  {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Sidebar?: React.LazyExoticComponent<React.ComponentType<any>>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Stage: React.LazyExoticComponent<React.ComponentType<any>>;
  }
> = {
  scenarios: {
    Sidebar: React.lazy(() =>
      import("./modules/LanguageComponents").then((m) => ({
        default: m.ScenarioSidebar,
      })),
    ),
    Stage: React.lazy(() =>
      import("./modules/scenarios/ScenariosStage").then((m) => ({
        default: m.ScenariosStage,
      })),
    ),
  },
  idioms: {
    Sidebar: React.lazy(() =>
      import("./modules/LanguageComponents").then((m) => ({
        default: m.IdiomSidebar,
      })),
    ),
    Stage: React.lazy(() =>
      import("./modules/idioms/IdiomStage").then((m) => ({
        default: m.IdiomStage,
      })),
    ),
  },
  sjt: {
    Sidebar: React.lazy(() =>
      import("./modules/LanguageComponents").then((m) => ({
        default: m.SJTSidebar,
      })),
    ),
    Stage: React.lazy(() =>
      import("./modules/sjt/SJTStage").then((m) => ({ default: m.SJTStage })),
    ),
  },
  presentation: {
    Stage: React.lazy(() =>
      import("./modules/presentation/PresentationStage").then((m) => ({
        default: m.PresentationStage,
      })),
    ),
  },
  gym: {
    Stage: React.lazy(() =>
      import("./gym/LanguageGymStage").then((m) => ({
        default: m.LanguageGymStage,
      })),
    ),
  },
};

export const LanguageLabLayout: React.FC = () => {
  const { activeModule, setActiveModule, activeLanguage, setActiveLanguage } =
    useLanguageLabContext();
  const navigate = useNavigate();
  const activeComponents = activeModule
    ? MODULE_COMPONENTS[activeModule]
    : null;
  const { t } = useTranslations();
  const { lang: urlLang, module: urlModule } = useParams();
  const [isSidebarCollapsed] = useState(false);

  // Sync URL params to context
  useEffect(() => {
    if (urlLang) {
      setActiveLanguage(urlLang);
    } else {
      setActiveLanguage(null);
    }

    if (urlModule) {
      setActiveModule(urlModule);
    } else {
      setActiveModule("");
    }
  }, [urlLang, urlModule, setActiveLanguage, setActiveModule]);

  // LEVEL 1: ROOT HUB (FLAGS)
  if (!activeLanguage) {
    return <LanguageLabRootHub />;
  }

  // LEVEL 2: LANGUAGE HUB (MODULE SQUARES)
  if (!activeModule) {
    return (
      <div className="flex h-full bg-[#0d1117] text-white font-outfit overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* Back Button for Language Selection */}
          <div className="absolute top-4 left-4 z-50">
            <button
              onClick={() => navigate("/language")}
              className="flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-md rounded-full border border-white/10 hover:bg-white/10 transition-colors text-sm font-bold text-slate-300"
            >
              <ChevronLeft size={16} /> Change Language (
              {activeLanguage.toUpperCase()})
            </button>
          </div>

          <div className="flex-1 relative overflow-hidden bg-grid-pattern">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-900/10 to-amber-900/10">
              <LanguageLabHub />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // LEVEL 3: MODULE ACTIVE
  return (
    <div className="flex h-full bg-[#0d1117] text-white font-outfit overflow-hidden">
      {/* Main Sidebar (Navigation) */}
      <div
        className={`
                ${isSidebarCollapsed ? "w-16" : "w-64"}
                transition-all duration-300 ease-in-out
                bg-[#010409] border-r border-white/10 flex flex-col shrink-0 relative z-20 shadow-xl
            `}
      >
        {/* Module List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-2 px-2 custom-scrollbar">
          {getAllModules().map((module: LanguageModuleConfig) => (
            <button
              key={module.id}
              onClick={() =>
                navigate(`/language/${activeLanguage}/${module.id}`)
              }
              className={`
                                w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group relative
                                ${activeModule === module.id
                  ? "bg-orange-600/10 text-orange-400 border border-orange-500/20 shadow-lg shadow-orange-500/5"
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
        {/* 2. STAGE */}
        <div className="flex-1 relative overflow-hidden bg-black">
          <div className="absolute inset-0">
            <Suspense
              fallback={
                <div className="p-10 text-orange-400 animate-pulse font-mono">
                  {">"} Initializing Polyglot Engine...
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

        {/* 3. RIGHT SIDEBAR: Controls (If module has one) */}
        {activeComponents?.Sidebar && (
          <div className="w-80 h-full bg-obsidian-950/80 backdrop-blur-sm border-l border-white/5 flex flex-col z-20 relative overflow-y-auto custom-scrollbar">
            <Suspense
              fallback={
                <div className="p-4 text-slate-500">Loading controls...</div>
              }
            >
              <activeComponents.Sidebar />
            </Suspense>
          </div>
        )}
      </div>
    </div>
  );
};
