/* eslint-disable @typescript-eslint/no-explicit-any */
import Editor from "@monaco-editor/react";
import { cascadeGenerate } from "@shared/api/aiCascadeService";
import { pythonService, PythonVariable } from "@shared/api/pythonService";
import { logActivitySQL } from "@shared/api/sqliteService";
import { useCodeStore } from "@shared/model/codeStore";
import { MarkdownRenderer } from "@shared/ui/MarkdownRenderer";
import {
  BookOpen,
  ChevronDown,
  Code2,
  Cpu,
  Database,
  Download,
  FileText,
  Play,
  Plus,
  RefreshCw,
  Sparkles,
  Table,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";

import { SNIPPETS } from "./snippets";

export const PythonStage: React.FC = () => {
  // Store
  const {
    projects,
    activeProjectId,
    activeFileName,
    createProject,
    setActiveProject,
    setActiveFile,
    updateFile,
    addFile,
    deleteFile,
    deleteProject,
  } = useCodeStore();

  // Derived State
  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) || projects[0],
    [projects, activeProjectId],
  );
  const activeFile = useMemo(
    () => activeProject?.files.find((f) => f.name === activeFileName),
    [activeProject, activeFileName],
  );

  // Runtime State
  const [output, setOutput] = useState<string>("");
  const [plots, setPlots] = useState<string[]>([]);
  const [variables, setVariables] = useState<PythonVariable[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [isAILoading, setIsAILoading] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  // Refs
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Init Python
  useEffect(() => {
    const init = async () => {
      await pythonService.init();
      setIsReady(true);
      setOutput(
        "🐍 Python 3.11 Ready\n📦 Packages: numpy, pandas, matplotlib, scipy\n\nKlik ▶ Run om je code uit te voeren.",
      );
    };
    init();
  }, []);

  // Sync Active File Content (debounced auto-save)
  const handleCodeChange = (value: string | undefined) => {
    if (activeProject && activeFile && value !== undefined) {
      updateFile(activeProject.id, activeFileName, value);
    }
  };

  const runCode = async () => {
    if (!activeProject || !activeFile || activeFile.language !== "python")
      return;
    setIsRunning(true);
    setOutput("⏳ Executing...\n");
    setPlots([]);
    setAiFeedback(null);
    setVariables([]);

    try {
      // Mount all project files to Pyodide FS
      for (const file of activeProject.files) {
        if (file.language !== "python") {
          await pythonService.writeFile(file.name, file.content);
        }
      }

      // Run the code
      const res = await pythonService.run(activeFile.content);

      if (res.error) {
        setOutput(`❌ Error:\n${res.error}`);
      } else {
        setOutput(res.output || "✅ [Process finished with exit code 0]");
        if (res.variables) setVariables(res.variables);

        // Log activity
        logActivitySQL("code", `Script uitgevoerd: ${activeFileName}`, 15);
      }

      if (res.plots) setPlots(res.plots);
    } catch (e: any) {
      setOutput(`💥 Critical Error: ${e.message}`);
    } finally {
      setIsRunning(false);
      setTimeout(
        () => consoleEndRef.current?.scrollIntoView({ behavior: "smooth" }),
        100,
      );
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !activeProject) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      const lang = file.name.endsWith(".csv")
        ? "csv"
        : file.name.endsWith(".json")
          ? "json"
          : "text";

      addFile(activeProject.id, { name: file.name, content, language: lang });
      setOutput(
        (prev) =>
          prev +
          `\n📁 Uploaded '${file.name}'\n💡 Load with: df = pd.read_csv('${file.name}')\n`,
      );
    };
    reader.readAsText(file);
    event.target.value = ""; // Reset input
  };

  const askAI = async (type: "explain" | "review" | "fix") => {
    if (!activeFile) return;
    setIsAILoading(true);
    setAiFeedback("Thinking...");

    const prompts = {
      explain: `Leg deze Python code uit aan een VWO 6 leerling. Gebruik duidelijke taal en leg elk concept uit:\n\n\`\`\`python\n${activeFile.content}\n\`\`\``,
      review: `Review deze code voor een VWO Informatica/NLT student. Focus op:\n1. Code kwaliteit (PEP8)\n2. Efficiëntie\n3. Verbeterpunten\n\n\`\`\`python\n${activeFile.content}\n\`\`\``,
      fix: `De student krijgt deze error. Leg uit wat er mis is en geef de verbeterde code:\n\nCode:\n\`\`\`python\n${activeFile.content}\n\`\`\`\n\nError:\n${output}`,
    };

    try {
      const response = await cascadeGenerate(
        prompts[type],
        "Je bent een Python expert en VWO informatica docent. Antwoord in het Nederlands.",
      );
      setAiFeedback(response.content);
    } catch {
      setAiFeedback("❌ AI kon even niet antwoorden. Probeer opnieuw.");
    } finally {
      setIsAILoading(false);
    }
  };

  const insertSnippet = (code: string) => {
    if (activeProject && activeFile) {
      const newContent = activeFile.content + "\n\n" + code;
      updateFile(activeProject.id, activeFileName, newContent);
    }
  };

  const downloadProject = () => {
    if (!activeProject) return;

    // Create a combined download with all files
    // Format: Each file separated by a header comment
    const projectName = activeProject.name.replace(/\s+/g, "_");

    if (activeProject.files.length === 1) {
      // Single file - direct download
      const file = activeProject.files[0]!;
      const blob = new Blob([file.content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectName}_${file.name}`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Multiple files - download each
      activeProject.files.forEach((file, index) => {
        setTimeout(() => {
          const blob = new Blob([file.content], { type: "text/plain" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${projectName}_${file.name}`;
          a.click();
          URL.revokeObjectURL(url);
        }, index * 200); // Stagger downloads
      });

      setOutput(
        (prev) =>
          prev +
          `\n📥 ${activeProject.files.length} bestanden worden gedownload...`,
      );
    }
  };

  return (
    <div className="flex h-full text-slate-300">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept=".csv,.txt,.json,.py"
      />

      {/* --- LEFT SIDEBAR: EXPLORER --- */}
      <div className="w-64 bg-[#010409] border-r border-white/10 flex flex-col shrink-0">
        {/* Project Selector */}
        <div className="p-4 border-b border-white/10">
          <div className="relative">
            <button
              onClick={() => setShowProjectMenu(!showProjectMenu)}
              className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white hover:bg-white/10 transition-colors"
            >
              <span className="truncate font-medium">
                {activeProject?.name || "Selecteer Project"}
              </span>
              <ChevronDown
                size={16}
                className={`transition-transform ${showProjectMenu ? "rotate-180" : ""}`}
              />
            </button>

            {showProjectMenu && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-obsidian-950 border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setActiveProject(p.id);
                      setShowProjectMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-white/10 flex items-center justify-between ${p.id === activeProjectId ? "bg-blue-500/20 text-blue-400" : ""}`}
                  >
                    <span className="truncate">{p.name}</span>
                    {p.id !== "default-pws" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteProject(p.id);
                        }}
                        className="text-slate-500 hover:text-red-400 p-1"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </button>
                ))}
                <div className="border-t border-white/10 p-2">
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Nieuw project..."
                    className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none mb-2"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newProjectName.trim()) {
                        createProject(newProjectName.trim());
                        setNewProjectName("");
                        setShowProjectMenu(false);
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (newProjectName.trim()) {
                        createProject(newProjectName.trim());
                        setNewProjectName("");
                        setShowProjectMenu(false);
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600/20 text-emerald-400 p-1.5 rounded text-xs hover:bg-emerald-600/30"
                  >
                    <Plus size={12} /> Nieuw Project
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* File Explorer */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-2">
            Bestanden
          </div>
          {activeProject?.files.map((file) => (
            <div
              key={file.name}
              onClick={() => setActiveFile(file.name)}
              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-sm transition-colors ${
                activeFileName === file.name
                  ? "bg-blue-500/20 text-blue-400"
                  : "hover:bg-white/5 text-slate-400"
              }`}
            >
              {file.language === "python" ? (
                <Code2 size={14} />
              ) : (
                <FileText size={14} />
              )}
              <span className="truncate flex-1">{file.name}</span>
              {file.name !== "main.py" && activeFileName === file.name && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFile(activeProject.id, file.name);
                    setActiveFile("main.py");
                  }}
                  className="text-slate-600 hover:text-red-400"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}

          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 w-full border border-dashed border-white/10 p-2.5 text-xs text-slate-500 hover:text-white hover:border-white/30 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Upload size={14} /> Upload Data (CSV/JSON)
          </button>
        </div>

        {/* Snippets */}
        <div className="p-3 border-t border-white/10">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-2 flex items-center gap-1">
            <BookOpen size={10} /> Snippets
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
            {SNIPPETS.map((s, i) => (
              <button
                key={i}
                onClick={() => insertSnippet(s.code)}
                className="w-full text-left px-2 py-1.5 rounded text-xs text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- MAIN CENTER: EDITOR & CONSOLE --- */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="h-12 bg-[#0d1117] border-b border-white/10 flex items-center px-4 justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-blue-400 font-mono text-sm font-medium">
              {activeFileName}
            </span>
            {activeFile?.language !== "python" && (
              <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                Preview Only
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => askAI("explain")}
              disabled={isAILoading}
              className="px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 text-xs hover:bg-purple-500/20 flex gap-1.5 items-center transition-colors disabled:opacity-50"
            >
              <Cpu size={12} /> Explain
            </button>
            <button
              onClick={() => askAI("review")}
              disabled={isAILoading}
              className="px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs hover:bg-cyan-500/20 flex gap-1.5 items-center transition-colors disabled:opacity-50"
            >
              <Sparkles size={12} /> Review
            </button>
            <button
              onClick={downloadProject}
              className="px-3 py-1.5 rounded-lg bg-white/5 text-slate-400 text-xs hover:bg-white/10 flex gap-1.5 items-center transition-colors"
            >
              <Download size={12} /> Export
            </button>
            <button
              onClick={runCode}
              disabled={
                !isReady || isRunning || activeFile?.language !== "python"
              }
              className={`px-5 py-1.5 rounded-lg font-bold text-xs flex gap-2 items-center text-white transition-all ${
                isReady && !isRunning && activeFile?.language === "python"
                  ? "bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/30"
                  : "bg-slate-700 cursor-not-allowed opacity-60"
              }`}
            >
              {isRunning ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Play size={14} fill="currentColor" />
              )}
              {isRunning ? "Running..." : "Run"}
            </button>
          </div>
        </div>

        {/* Split View: Editor (Top) / Console (Bottom) */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="h-[55%] min-h-0">
            <Editor
              height="100%"
              language={
                activeFile?.language === "python" ? "python" : "plaintext"
              }
              theme="vs-dark"
              value={activeFile?.content || "// Select a file"}
              onChange={handleCodeChange}
              options={{
                readOnly: activeFile?.language !== "python",
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 16, bottom: 16 },
                fontFamily:
                  "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                wordWrap: "on",
              }}
            />
          </div>

          <div className="h-[45%] min-h-0 bg-[#010409] border-t border-white/10 flex flex-col">
            <div className="h-8 bg-white/5 flex items-center px-4 gap-3 border-b border-white/5 shrink-0">
              <div
                className={`w-2 h-2 rounded-full ${isRunning ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`}
              />
              <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-widest">
                Terminal
              </span>
              {plots.length > 0 && (
                <span className="text-[10px] text-emerald-400 ml-auto">
                  📊 {plots.length} Grafieken
                </span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 font-mono text-sm custom-scrollbar">
              <pre className="whitespace-pre-wrap text-slate-300">{output}</pre>

              {/* Plots Grid */}
              {plots.length > 0 && (
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {plots.map((plot, i) => (
                    <div
                      key={i}
                      className="bg-white/5 p-3 rounded-xl border border-white/10 shadow-lg"
                    >
                      <img
                        src={`data:image/png;base64,${plot}`}
                        alt={`Plot ${i + 1}`}
                        className="w-full rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* AI Feedback */}
              {aiFeedback && (
                <div className="mt-6 p-4 bg-purple-900/20 border-l-2 border-purple-500 rounded-r-lg">
                  <div className="flex justify-between items-center mb-3">
                    <strong className="text-purple-400 flex items-center gap-2 text-sm">
                      <Cpu size={14} /> AI Coach
                    </strong>
                    <div className="flex gap-2">
                      {output.includes("Error") && (
                        <button
                          onClick={() => askAI("fix")}
                          className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded hover:bg-red-500/30"
                        >
                          Fix Error
                        </button>
                      )}
                      <button
                        onClick={() => setAiFeedback(null)}
                        className="text-slate-500 hover:text-white"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="prose prose-invert prose-sm max-w-none">
                    <MarkdownRenderer content={aiFeedback} />
                  </div>
                </div>
              )}
              <div ref={consoleEndRef} />
            </div>
          </div>
        </div>
      </div>

      {/* --- RIGHT SIDEBAR: VARIABLE INSPECTOR --- */}
      <div className="w-72 bg-[#010409] border-l border-white/10 flex flex-col shrink-0">
        <div className="p-3 border-b border-white/10 bg-white/5">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Table size={12} className="text-blue-400" /> Variabelen (
            {variables.length})
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
          {variables.length === 0 ? (
            <div className="text-center mt-10 text-slate-600 text-xs italic">
              Run je code om
              <br />
              variabelen te zien
            </div>
          ) : (
            <div className="space-y-2">
              {variables.map((v) => (
                <div
                  key={v.name}
                  className="bg-white/5 rounded-lg border border-white/5 p-2.5 hover:border-white/20 transition-colors"
                >
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-sm font-mono text-emerald-400 font-bold">
                      {v.name}
                    </span>
                    <span className="text-[9px] text-slate-500 uppercase bg-white/5 px-1.5 py-0.5 rounded">
                      {v.type}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 font-mono break-all">
                    {v.value}
                  </div>
                  {v.shape && (
                    <div className="text-[10px] text-slate-500 mt-1">
                      {v.shape}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Libraries Info */}
        <div className="p-3 border-t border-white/10 bg-blue-900/10">
          <h4 className="text-[9px] font-bold text-blue-300 mb-2 flex items-center gap-1 uppercase tracking-widest">
            <Database size={10} /> Beschikbare Packages
          </h4>
          <div className="flex flex-wrap gap-1">
            {["pandas", "numpy", "matplotlib", "scipy", "math", "random"].map(
              (lib) => (
                <span
                  key={lib}
                  className="text-[9px] px-1.5 py-0.5 bg-blue-500/20 text-blue-200 rounded"
                >
                  {lib}
                </span>
              ),
            )}
          </div>
        </div>

        {/* Quick Status */}
        <div className="p-3 border-t border-white/5 bg-black/30">
          <div className="flex items-center justify-between text-[9px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <div
                className={`w-1.5 h-1.5 rounded-full ${isReady ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`}
              />
              {isReady ? "Engine Ready" : "Loading..."}
            </span>
            <span>Python 3.11</span>
          </div>
        </div>
      </div>
    </div>
  );
};
