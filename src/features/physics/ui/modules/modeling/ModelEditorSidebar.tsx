import {
  Code,
  FileText,
  FolderOpen,
  Play,
  RotateCcw,
  Save,
} from "lucide-react";
import React, { useState } from "react";

import { useModuleState } from "../../../hooks/usePhysicsLabContext";
import { useModelStorage } from "./hooks/useModelStorage";
import { ModelBrowser } from "./ModelBrowser";
import { NumericalModel } from "./types";

export const ModelEditorSidebar: React.FC = () => {
  // We use the shared state to sync code and run actions
  // However, the registry defines `SidebarComponent: React.ComponentType` without specific props in generics.
  // Usually these receive `{ state, setState, ... }` via context or props.
  // Use useModuleState with 'modeling' ID.
  const [moduleState, setModuleState] = useModuleState("modeling");
  const { saveModel } = useModelStorage();

  const [activeTab, setActiveTab] = useState<"code" | "files">("code");

  // Helper to update code
  const handleCodeChange = (newCode: string) => {
    setModuleState({ ...moduleState, code: newCode });
  };

  const handleRun = () => {
    setModuleState({
      ...moduleState,
      runVersion: (moduleState.runVersion || 0) + 1,
    });
  };

  const handleSave = () => {
    const modelToSave: NumericalModel = {
      id: crypto.randomUUID(), // New ID for new save, or handle update logic if we track current ID
      name: moduleState.name || "Mijn Model",
      timeStep: moduleState.dt || 0.1,
      duration: moduleState.duration || 10,
      constants: moduleState.constants || [],
      initialValues: moduleState.initialValues || [],
      equations: (moduleState.code || "").split("\n"),
    };
    saveModel(modelToSave, {
      name: prompt("Naam van model:", "Mijn Model") || "Naamloos",
      description: "Opgeslagen vanuit editor",
    });
  };

  const handleLoad = (model: NumericalModel) => {
    setModuleState({
      ...moduleState,
      code: model.equations.join("\n"),
      constants: model.constants,
      initialValues: model.initialValues,
      dt: model.timeStep,
      duration: model.duration,
      runVersion: 0, // Reset run
    });
    setActiveTab("code");
  };

  return (
    <div className="flex flex-col h-full bg-obsidian-950 text-white">
      {/* Header Tabs */}
      <div className="flex items-center border-b border-white/5 p-1 gap-1">
        <button
          onClick={() => setActiveTab("code")}
          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 rounded-lg transition-all ${activeTab === "code" ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20" : "text-slate-500 hover:text-white hover:bg-white/5"}`}
        >
          <Code size={14} /> Code
        </button>
        <button
          onClick={() => setActiveTab("files")}
          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 rounded-lg transition-all ${activeTab === "files" ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20" : "text-slate-500 hover:text-white hover:bg-white/5"}`}
        >
          <FolderOpen size={14} /> Bibliotheek
        </button>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {/* CODE TAB */}
        <div
          className={`absolute inset-0 flex flex-col transition-opacity duration-300 ${activeTab === "code" ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"}`}
        >
          {/* Toolbar */}
          <div className="h-12 border-b border-white/10 flex items-center justify-between px-4 bg-white/5">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-slate-500" />
              <span className="text-xs font-bold text-slate-300">model.js</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                className="btn-elite-neon btn-elite-neon-emerald !p-2"
                title="Opslaan"
              >
                <Save size={16} />
              </button>
              <button
                onClick={() => handleCodeChange("")}
                className="btn-elite-neon btn-elite-neon-rose !p-2"
                title="Reset"
              >
                <RotateCcw size={16} />
              </button>
              <div className="h-4 w-px bg-white/10 mx-1" />
              <button
                onClick={handleRun}
                className="btn-elite-neon btn-elite-neon-emerald active !py-1.5 !px-3 !text-[10px]"
              >
                <Play size={12} fill="currentColor" /> Run
              </button>
            </div>
          </div>

          {/* Editor Area */}
          <div className="flex-1 relative">
            <textarea
              value={moduleState.code || ""}
              onChange={(e) => handleCodeChange(e.target.value)}
              // Spellcheck false is important for code
              spellCheck={false}
              className="w-full h-full bg-transparent p-4 font-mono text-sm leading-6 text-slate-300 resize-none outline-none focus:bg-white/[0.02] transition-colors selection:bg-emerald-500/30"
              placeholder="// Definieer je model hier...&#10;v = v + a * dt&#10;x = x + v * dt"
            />
            {/* Line Numbers Sidebar can be added later if needed */}
          </div>

          {/* Status Bar */}
          <div className="h-6 bg-black/20 border-t border-white/5 flex items-center px-4 justify-between text-[10px] text-slate-500 font-mono">
            <span>Euler Integratie</span>
            <span>Ln {(moduleState.code || "").split("\n").length}, Col 1</span>
          </div>
        </div>

        {/* FILES TAB */}
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${activeTab === "files" ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"}`}
        >
          <ModelBrowser onLoad={handleLoad} />
        </div>
      </div>
    </div>
  );
};
