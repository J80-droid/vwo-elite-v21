import Editor from "@monaco-editor/react";
import { Check, FileCode, Play, RotateCcw } from "lucide-react";
import React, { useState } from "react";

import { useExamContext } from "../../../hooks/ExamContext";
import { useConsole } from "../../../hooks/useConsole";

const DEFAULT_CODE = `/**
 * ELITE SIMULATOR KERNEL V2.5
 * Subject: Kinematics & Dynamics
 */

function calculateMetrics(input: {
  velocity: number;
  time: number;
  acceleration: number;
}) {
  // s = v0*t + 0.5*a*t^2
  const displacement = input.velocity * input.time + 0.5 * input.acceleration * Math.pow(input.time, 2);
  
  return {
    displacement,
    finalVelocity: input.velocity + input.acceleration * input.time
  };
}

// System Execution
const result = calculateMetrics({ velocity: 5, time: 10, acceleration: 9.81 });
console.log("Trajectory calculated:", result);
`;

export const SimulatorInput: React.FC = () => {
  const { examData, updateExamData } = useExamContext();
  const terminal = useConsole();
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const code = examData.simulator?.code ?? DEFAULT_CODE;

  const handleEditorChange = (value: string | undefined) => {
    updateExamData("simulator", { code: value || "" });
  };

  const handleRun = async () => {
    setIsRunning(true);
    terminal.clear();
    terminal.info("Compiling script...", "Kernel");

    // Simulate processing time
    setTimeout(() => {
      try {
        terminal.success("Execution successful. Metrics updated.", "Runtime");
        terminal.info(
          `Code length: ${code.length} chars analyzed.`,
          "Analytics",
        );
        setIsRunning(false);
      } catch {
        terminal.error("Critical Runtime Error", "Kernel");
        setIsRunning(false);
      }
    }, 800);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEditorDidMount = (_editor: unknown, monaco: any) => {
    monaco.editor.defineTheme("elite-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#020617", // bg-slate-950
        "editor.lineHighlightBackground": "#1e293b", // slate-800
        "editorLineNumber.foreground": "#475569", // slate-600
        "editor.selectionBackground": "#3b82f640", // blue selection
      },
    });
    monaco.editor.setTheme("elite-dark");
    setIsEditorReady(true);
  };

  return (
    <div className="h-full flex flex-col bg-slate-950">
      <div className="h-10 border-b border-white/5 bg-slate-900/50 flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <FileCode size={14} className="text-indigo-400" />
          <span className="font-mono">script_v1.ts</span>
          {isEditorReady ? (
            <span className="flex items-center gap-1 text-[10px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              <Check size={8} /> READY
            </span>
          ) : (
            <span className="text-[10px] animate-pulse">LOADING KERNEL...</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => updateExamData("simulator", { code: DEFAULT_CODE })}
            className="p-1.5 hover:bg-white/5 rounded text-slate-500 hover:text-white transition-colors"
            title="Reset Code"
          >
            <RotateCcw size={14} />
          </button>
          <div className="w-[1px] h-4 bg-white/10 mx-1" />
          <button
            onClick={handleRun}
            disabled={!isEditorReady || isRunning}
            className={`
              flex items-center gap-2 px-3 py-1 rounded text-xs font-bold tracking-wide transition-all
              ${
                isRunning
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]"
              }
            `}
          >
            <Play
              size={12}
              fill={isRunning ? "none" : "currentColor"}
              className={isRunning ? "animate-spin" : ""}
            />
            {isRunning ? "EXECUTING..." : "RUN"}
          </button>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage="typescript"
          value={code}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          loading={
            <div className="flex items-center gap-2 text-slate-500 text-xs font-mono p-4">
              Initializing Monaco Engine...
            </div>
          }
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontLigatures: true,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 16, bottom: 16 },
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            renderLineHighlight: "all",
            contextmenu: true,
            scrollbar: {
              useShadows: false,
              verticalScrollbarSize: 10,
              vertical: "visible",
            },
          }}
        />
      </div>

      <div className="h-6 border-t border-white/5 bg-slate-950 flex items-center justify-between px-3 text-[10px] text-slate-500 font-mono select-none">
        <div>TypeScript 5.0 // UTF-8</div>
        <div className="flex gap-3">
          <span>Ln {code.split("\n").length}</span>
          <span>ELITE_MODE: ACTIVE</span>
        </div>
      </div>
    </div>
  );
};
