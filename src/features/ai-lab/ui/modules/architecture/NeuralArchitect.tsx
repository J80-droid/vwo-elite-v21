import {
  Bot,
  Database,
  FileText,
  MessageSquare,
  Play,
  Search,
  Settings,
  Terminal,
  Workflow,
  Zap,
} from "lucide-react";
import React, { useState } from "react";

// --- TYPES VOOR DE VISUALISATIE ---
interface Node {
  id: string;
  type: "trigger" | "agent" | "tool" | "output";
  label: string;
  icon: React.ReactNode;
  status: "idle" | "running" | "completed" | "waiting";
  config: { model?: string; prompt?: string; tool?: string };
  x: number;
  y: number;
}

interface Log {
  timestamp: string;
  source: string;
  message: string;
  type: "info" | "action" | "result";
}

export const NeuralArchitect: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<Log[]>([]);

  // VISUELE NODES (Een typische "Research Agent" flow)
  const [nodes, setNodes] = useState<Node[]>([
    {
      id: "1",
      type: "trigger",
      label: "Start: User Input",
      icon: <MessageSquare size={16} />,
      status: "completed",
      config: { prompt: "Onderzoek de oorzaken van de Franse Revolutie" },
      x: 50,
      y: 150,
    },
    {
      id: "2",
      type: "agent",
      label: "Planner Agent",
      icon: <Bot size={16} />,
      status: "idle",
      config: { model: "GPT-4o", prompt: "Breek de vraag op in zoektermen..." },
      x: 300,
      y: 150,
    },
    {
      id: "3",
      type: "tool",
      label: "Google Search Tool",
      icon: <Search size={16} />,
      status: "idle",
      config: { tool: "SerpAPI" },
      x: 550,
      y: 50,
    },
    {
      id: "4",
      type: "tool",
      label: "Wikipedia Scraper",
      icon: <Database size={16} />,
      status: "idle",
      config: { tool: "WikiExtract" },
      x: 550,
      y: 250,
    },
    {
      id: "5",
      type: "agent",
      label: "Writer Agent",
      icon: <FileText size={16} />,
      status: "idle",
      config: {
        model: "Claude 3.5",
        prompt: "Schrijf synthese o.b.v. bronnen...",
      },
      x: 800,
      y: 150,
    },
  ]);

  // SIMULATIE VAN DE AGENT LOOP
  const runSimulation = () => {
    setIsRunning(true);
    setLogs([]);
    const addLog = (src: string, msg: string, type: Log["type"] = "info") => {
      setLogs((prev) => [
        ...prev,
        {
          timestamp: new Date().toLocaleTimeString([], {
            hour12: false,
            second: "2-digit",
            fractionalSecondDigits: 2,
          }),
          source: src,
          message: msg,
          type,
        },
      ]);
    };

    // Stap 1: Trigger
    addLog("System", "Workflow started.", "info");

    // Stap 2: Planner (Na 800ms)
    setTimeout(() => {
      updateNodeStatus("2", "running");
      addLog(
        "Planner Agent",
        'Analyzing request: "Oorzaken Franse Revolutie"',
        "info",
      );
      addLog("Planner Agent", "THOUGHT: I need factual data first.", "info");
    }, 800);

    // Stap 3: Tools (Na 2500ms)
    setTimeout(() => {
      updateNodeStatus("2", "completed");
      updateNodeStatus("3", "running");
      updateNodeStatus("4", "running");
      addLog(
        "Planner Agent",
        "ACTION: Invoking Search Tools in parallel.",
        "action",
      );
      addLog(
        "Google Tool",
        'Searching: "Economic causes french revolution 1789"',
        "info",
      );
      addLog("Wiki Tool", "Scraping: /wiki/French_Revolution", "info");
    }, 2500);

    // Stap 4: Resultaten (Na 4500ms)
    setTimeout(() => {
      updateNodeStatus("3", "completed");
      updateNodeStatus("4", "completed");
      addLog(
        "Tool Output",
        "Found 14 relevant articles & economic data.",
        "result",
      );
      updateNodeStatus("5", "running");
    }, 4500);

    // Stap 5: Writer (Na 6000ms)
    setTimeout(() => {
      updateNodeStatus("5", "completed");
      addLog("Writer Agent", "Synthesizing final report...", "action");
      addLog("System", "Workflow completed successfully.", "result");
      setIsRunning(false);
    }, 6500);
  };

  const updateNodeStatus = (id: string, status: Node["status"]) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, status } : n)));
  };

  return (
    <div className="h-full bg-obsidian-950 text-slate-200 flex flex-col overflow-hidden animate-in fade-in">
      {/* TOP BAR */}
      <header className="h-16 border-b border-white/5 bg-obsidian-900 px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="bg-electric/10 p-2 rounded text-electric">
            <Workflow size={20} />
          </div>
          <div>
            <h1 className="font-bold text-white leading-tight">
              Neural Architect
            </h1>
            <p className="text-xs text-slate-500">
              Agent & Workflow Orchestrator
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={runSimulation}
            disabled={isRunning}
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-6 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:shadow-none"
          >
            {isRunning ? (
              <Bot className="animate-bounce" size={18} />
            ) : (
              <Play fill="currentColor" size={18} />
            )}
            {isRunning ? "Agent Working..." : "Run Workflow"}
          </button>
          <button className="bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg border border-white/10">
            <Settings size={18} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* CANVAS (VISUAL EDITOR) */}
        <div className="flex-1 relative bg-radial-gradient from-obsidian-800 to-obsidian-950 overflow-hidden">
          {/* Grid Background */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: "radial-gradient(#4b5563 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          ></div>

          {/* CONNECTIONS (SVG LINES) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {/* Hardcoded lines matching the node coordinates */}
            <Connection
              start={{ x: 250, y: 190 }}
              end={{ x: 300, y: 190 }}
              active={nodes[1]?.status !== "idle"}
            />
            <Connection
              start={{ x: 500, y: 190 }}
              end={{ x: 550, y: 90 }}
              active={nodes[2]?.status !== "idle"}
            />
            <Connection
              start={{ x: 500, y: 190 }}
              end={{ x: 550, y: 290 }}
              active={nodes[3]?.status !== "idle"}
            />
            <Connection
              start={{ x: 750, y: 90 }}
              end={{ x: 800, y: 190 }}
              active={nodes[2]?.status === "completed"}
            />
            <Connection
              start={{ x: 750, y: 290 }}
              end={{ x: 800, y: 190 }}
              active={nodes[3]?.status === "completed"}
            />
          </svg>

          {/* NODES */}
          {nodes.map((node) => (
            <div
              key={node.id}
              className={`absolute w-40 md:w-48 p-3 md:p-4 rounded-xl border-2 shadow-2xl transition-all duration-500 z-10 
                                ${
                                  node.status === "running"
                                    ? "border-electric shadow-[0_0_20px_rgba(0,240,255,0.4)] scale-105 bg-obsidian-900"
                                    : node.status === "completed"
                                      ? "border-emerald-500 bg-obsidian-900"
                                      : "border-white/10 bg-obsidian-900/80 hover:border-white/30"
                                }`}
              style={{ left: node.x, top: node.y }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`p-2 rounded-lg ${
                    node.type === "agent"
                      ? "bg-purple-500/20 text-purple-400"
                      : node.type === "tool"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-white/10 text-slate-300"
                  }`}
                >
                  {node.icon}
                </div>
                <span className="font-bold text-xs md:text-sm text-white truncate">
                  {node.label}
                </span>
              </div>

              {/* Configuration Preview */}
              <div className="text-[10px] font-mono text-slate-400 bg-black/40 p-2 rounded border border-white/5 truncate">
                {node.config.model || node.config.tool || node.config.prompt}
              </div>

              {/* Status Indicator */}
              {node.status === "running" && (
                <div className="absolute -top-2 -right-2 bg-electric text-black text-[9px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                  THINKING
                </div>
              )}
            </div>
          ))}
        </div>

        {/* RIGHT PANEL: LIVE AGENT LOGS */}
        <div className="w-80 md:w-96 bg-obsidian-900 border-l border-white/10 flex flex-col absolute right-0 bottom-0 top-0 z-30 translate-x-full md:translate-x-0 transition-transform md:relative">
          <div className="p-4 border-b border-white/10 bg-black/20 flex justify-between items-center">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Terminal size={16} /> Execution Logs
            </h3>
            <button
              onClick={() => setLogs([])}
              className="text-xs text-slate-500 hover:text-white"
            >
              Clear
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs custom-scrollbar">
            {logs.length === 0 && (
              <div className="text-slate-600 text-center mt-10 italic">
                Ready to deploy agents...
              </div>
            )}
            {logs.map((log, i) => (
              <div
                key={i}
                className="animate-in slide-in-from-right-2 fade-in duration-300"
              >
                <div className="flex gap-2 mb-1">
                  <span className="text-slate-600">{log.timestamp}</span>
                  <span
                    className={`font-bold ${
                      log.type === "action"
                        ? "text-amber-400"
                        : log.type === "result"
                          ? "text-emerald-400"
                          : "text-electric"
                    }`}
                  >
                    [{log.source}]
                  </span>
                </div>
                <div className="text-slate-300 pl-16 border-l border-white/10 ml-3">
                  {log.message}
                </div>
              </div>
            ))}
            {/* Auto-scroll anchor */}
            <div className="h-1"></div>
          </div>

          {/* DEBUG INPUT */}
          <div className="p-4 border-t border-white/10 bg-black/20">
            <div className="flex gap-2">
              <input
                disabled
                placeholder="Waiting for user input..."
                className="w-full bg-obsidian-950 border border-white/10 rounded px-3 py-2 text-xs text-slate-500"
              />
              <button
                disabled
                className="p-2 bg-white/5 rounded text-slate-500"
              >
                <Zap size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// SVG Connection Helper
const Connection: React.FC<{
  start: { x: number; y: number };
  end: { x: number; y: number };
  active: boolean;
}> = ({ start, end, active }) => {
  // Bezier curve calculation for smooth wires
  const path = `M ${start.x + 150} ${start.y + 40} C ${start.x + 200} ${start.y + 40}, ${end.x - 50} ${end.y + 40}, ${end.x} ${end.y + 40}`;

  return (
    <>
      <path
        d={path}
        stroke={active ? "#00f0ff" : "#334155"}
        strokeWidth="2"
        fill="none"
        className="transition-colors duration-500"
      />
      {active && (
        <circle r="3" fill="#00f0ff">
          <animateMotion dur="1s" repeatCount="indefinite" path={path} />
        </circle>
      )}
    </>
  );
};
