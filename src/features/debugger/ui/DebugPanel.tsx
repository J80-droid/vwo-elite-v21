/* eslint-disable @typescript-eslint/no-explicit-any */
import { pruneDatabase } from "@shared/api/pruningService";
import {
  executeQuery,
  getSystemLogsSQL,
  persistDatabase,
} from "@shared/api/sqliteService";
import { useSettings } from "@shared/hooks/useSettings";
import { useDebugStore } from "@shared/model/debugStore";
import { useQuizProgressStore } from "@shared/model/quizProgressStore";
import { useUserStatsStore } from "@shared/model/userStatsStore";
import {
  Activity,
  Database,
  Play,
  RefreshCw,
  Terminal,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

export const DebugPanel: React.FC = () => {
  const {
    isOpen,
    activeTab,
    logs,
    toggle,
    setTab,
    clearLogs,
    addLog,
    restoreLogs,
  } = useDebugStore();
  const [query, setQuery] = useState(
    "SELECT * FROM activity_log ORDER BY date DESC LIMIT 10",
  );
  const [queryResult, setQueryResult] = useState<any[] | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);

  // Global Store Access
  const userStatsStore = useUserStatsStore();
  const quizProgressStore = useQuizProgressStore();
  const settingsStore = useSettings();

  // Key Listener for Toggle (Ctrl + -)
  // Key Listener for Toggle (Ctrl + -)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl + - (Minus key) or Numpad Subtract
      // Using e.code is more robust across layouts
      if (e.ctrlKey && (e.key === "-" || e.code === "Minus" || e.code === "NumpadSubtract")) {
        e.preventDefault();
        e.stopPropagation(); // Stop propagation to prevent browser zoom
        toggle();
      }
    };
    // Use capture phase to intercept before other handlers
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [toggle]);



  const runQuery = async () => {
    setQueryError(null);
    setQueryResult(null);
    try {
      const results = await executeQuery(query);
      if (results && results[0]?.status === "error") {
        setQueryError(results[0].message);
      } else {
        setQueryResult(results);
        addLog("info", `Query executed: ${query}`);
      }
    } catch (err: any) {
      setQueryError(err.message);
      addLog("error", `Query failed: ${err.message}`);
    }
  };

  const handleAction = async (action: string) => {
    try {
      switch (action) {
        case "reset_db":
          if (confirm("Are you sure? This will wipe the database!")) {
            await executeQuery(
              "DELETE FROM activity_log; DELETE FROM quiz_history; DELETE FROM saved_questions;",
            );
            await persistDatabase();
            addLog("warn", "Database cleared (partial)");
            window.location.reload();
          }
          break;
        case "prune":
          await pruneDatabase();
          addLog("info", "Database pruned");
          break;
        case "seed_xp":
          userStatsStore.addXp(100);
          addLog("info", "Added 100 XP");
          break;
      }
    } catch (e: any) {
      addLog("error", `Action failed: ${e.message}`);
    }
  };

  const handleLoadHistory = useCallback(async () => {
    try {
      const history = await getSystemLogsSQL(100);
      restoreLogs(history as any);
      addLog("info", `Loaded ${history.length} historical logs`);
    } catch (e: any) {
      addLog("error", `Failed to load history: ${e.message}`);
    }
  }, [restoreLogs, addLog]);

  // Auto-load history when opened
  useEffect(() => {
    if (isOpen) {
      handleLoadHistory();
    }
  }, [isOpen, handleLoadHistory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none flex items-end justify-center sm:items-center">
      <div className="bg-obsidian-950/95 backdrop-blur-md border border-white/10 w-full h-[60vh] sm:h-[80vh] sm:w-[90vw] max-w-6xl shadow-2xl rounded-t-2xl sm:rounded-2xl flex flex-col pointer-events-auto transition-all animate-in slide-in-from-bottom-10">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-electric" />
            <h2 className="font-bold text-white">VWO Elite Debugger</h2>
          </div>
          <div className="flex gap-4">
            <div className="flex bg-obsidian-900 rounded-lg p-1">
              {[
                { id: "logs", icon: Terminal, label: "Logs" },
                { id: "database", icon: Database, label: "Database" },
                { id: "state", icon: Activity, label: "State" },
                { id: "actions", icon: Play, label: "Actions" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id ? "bg-electric text-white" : "text-slate-400 hover:text-white"}`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
            <button
              onClick={toggle}
              className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-4">
          {activeTab === "logs" && (
            <div className="h-full flex flex-col">
              <div className="flex justify-between mb-2">
                <span className="text-xs text-slate-500">
                  {logs.length} events
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handleLoadHistory}
                    className="text-xs text-electric hover:underline flex items-center gap-1"
                  >
                    <Database className="w-3 h-3" /> Load History
                  </button>
                  <button
                    onClick={clearLogs}
                    className="text-xs text-rose-400 hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto font-mono text-xs space-y-1 bg-obsidian-900/50 p-2 rounded">
                {logs.map((log) => (
                  <div key={log.id} className="flex gap-2">
                    <span className="text-slate-500">
                      [{new Date(log.timestamp).toLocaleTimeString()}]
                    </span>
                    <span
                      className={`uppercase font-bold w-12 ${log.level === "error" ? "text-rose-500" : log.level === "warn" ? "text-amber-500" : "text-emerald-500"}`}
                    >
                      {log.level}
                    </span>
                    <span className="text-slate-300">{log.message}</span>
                    {log.data !== undefined && (
                      <span className="text-slate-500 truncate max-w-xl">
                        {JSON.stringify(log.data)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "database" && (
            <div className="h-full flex flex-col gap-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-obsidian-900 border border-white/10 rounded px-3 py-2 text-white font-mono text-sm focus:border-electric outline-none"
                />
                <button
                  onClick={runQuery}
                  className="bg-electric hover:bg-electric-glow text-white px-4 py-2 rounded font-medium text-sm"
                >
                  Run
                </button>
              </div>
              {queryError && (
                <div className="text-rose-500 text-sm bg-rose-500/10 p-2 rounded border border-rose-500/20">
                  {queryError}
                </div>
              )}
              <div className="flex-1 overflow-auto bg-obsidian-900/50 rounded border border-white/5">
                {queryResult && queryResult.length > 0 ? (
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-obsidian-800 sticky top-0">
                      <tr>
                        {Object.keys(queryResult[0]).map((k) => (
                          <th
                            key={k}
                            className="p-2 font-medium text-slate-400"
                          >
                            {k}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {queryResult.map((row, i) => (
                        <tr
                          key={i}
                          className="border-t border-white/5 hover:bg-white/5"
                        >
                          {Object.values(row).map((v: any, j) => (
                            <td
                              key={j}
                              className="p-2 whitespace-nowrap max-w-xs overflow-hidden text-ellipsis"
                            >
                              {typeof v === "object"
                                ? JSON.stringify(v)
                                : String(v)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                    No results
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "state" && (
            <div className="h-full overflow-auto grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-obsidian-900 p-4 rounded border border-white/5">
                <h3 className="text-electric font-bold mb-2">User Stats</h3>
                <pre className="text-xs text-slate-300 overflow-auto max-h-60">
                  {JSON.stringify(
                    {
                      xp: userStatsStore.xp,
                      streak: userStatsStore.streak,
                      achievements: userStatsStore.achievements.filter(
                        (a) => a.unlocked,
                      ).length,
                    },
                    null,
                    2,
                  )}
                </pre>
              </div>
              <div className="bg-obsidian-900 p-4 rounded border border-white/5">
                <h3 className="text-electric font-bold mb-2">Settings Store</h3>
                <pre className="text-xs text-slate-300 overflow-auto max-h-60">
                  {JSON.stringify(settingsStore.settings, null, 2)}
                </pre>
              </div>
              <div className="bg-obsidian-900 p-4 rounded border border-white/5">
                <h3 className="text-electric font-bold mb-2">Quiz Progress</h3>
                <pre className="text-xs text-slate-300 overflow-auto max-h-60">
                  {JSON.stringify(quizProgressStore.stats, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {activeTab === "actions" && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => handleAction("reset_db")}
                className="p-4 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 rounded flex flex-col items-center gap-2 group"
              >
                <Trash2 className="w-6 h-6 text-rose-500 group-hover:scale-110 transition-transform" />
                <span className="text-rose-500 font-medium">
                  Reset Database
                </span>
              </button>
              <button
                onClick={() => handleAction("prune")}
                className="p-4 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 rounded flex flex-col items-center gap-2 group"
              >
                <RefreshCw className="w-6 h-6 text-amber-500 group-hover:spin transition-transform" />
                <span className="text-amber-500 font-medium">Prune Data</span>
              </button>
              <button
                onClick={() => handleAction("seed_xp")}
                className="p-4 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 rounded flex flex-col items-center gap-2 group"
              >
                <Play className="w-6 h-6 text-emerald-500 group-hover:scale-110 transition-transform" />
                <span className="text-emerald-500 font-medium">+100 XP</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
