import {
  Database as SqliteDatabase,
  initDatabase,
  sqliteDelete,
  sqliteInsert,
  sqliteSelect,
} from "@shared/api/sqliteService";
import { MeshViewer } from "@shared/ui/components/MeshViewer";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Database,
  Edit2,
  FileJson,
  Filter,
  RefreshCw,
  Search,
  Terminal,
  Trash2,
  X,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

// --- TYPES ---

interface TableMeta {
  name: string;
  count: number;
}

const NEON_COLORS = [
  {
    text: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
    glow: "shadow-[0_0_15px_rgba(16,185,129,0.2)]",
    accent: "bg-emerald-400",
    hoverBg: "hover:bg-emerald-400/20",
  },
  {
    text: "text-cyan-400",
    bg: "bg-cyan-400/10",
    border: "border-cyan-400/20",
    glow: "shadow-[0_0_15px_rgba(34,211,238,0.2)]",
    accent: "bg-cyan-400",
    hoverBg: "hover:bg-cyan-400/20",
  },
  {
    text: "text-indigo-400",
    bg: "bg-indigo-400/10",
    border: "border-indigo-400/20",
    glow: "shadow-[0_0_15px_rgba(99,102,241,0.2)]",
    accent: "bg-indigo-400",
    hoverBg: "hover:bg-indigo-400/20",
  },
  {
    text: "text-rose-400",
    bg: "bg-rose-400/10",
    border: "border-rose-400/20",
    glow: "shadow-[0_0_15px_rgba(244,63,94,0.2)]",
    accent: "bg-rose-400",
    hoverBg: "hover:bg-rose-400/20",
  },
  {
    text: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
    glow: "shadow-[0_0_15px_rgba(245,158,11,0.2)]",
    accent: "bg-amber-400",
    hoverBg: "hover:bg-amber-400/20",
  },
  {
    text: "text-violet-400",
    bg: "bg-violet-400/10",
    border: "border-violet-400/20",
    glow: "shadow-[0_0_15px_rgba(139,92,246,0.2)]",
    accent: "bg-violet-400",
    hoverBg: "hover:bg-violet-400/20",
  },
];

const getTableColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return NEON_COLORS[Math.abs(hash) % NEON_COLORS.length]!;
};

// --- EXPLORER COMPONENT ---

export const NeuralDataExplorer: React.FC = () => {
  const [tables, setTables] = useState<TableMeta[]>([]);
  const [activeTable, setActiveTable] = useState<string | null>(null);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [editRow, setEditRow] = useState<string | null>(null);
  const [sqlQuery, setSqlQuery] = useState("");
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalResult, setTerminalResult] = useState<unknown>(null);

  // 1. Fetch all tables on mount
  const fetchTables = async () => {
    try {
      setLoading(true);
      const db: SqliteDatabase = await initDatabase();
      const res = await db.exec(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
      );

      if (res && res.length > 0) {
        const tableNames = res[0].values.map((v: unknown[]) => v[0]);
        const tablesWithCount = await Promise.all(
          tableNames.map(async (name: string) => {
            const countRes = await db.exec(`SELECT COUNT(*) FROM ${name}`);
            return {
              name: String(name),
              count:
                countRes.length > 0
                  ? ((countRes[0].values[0] as unknown[])[0] as number)
                  : 0,
            };
          }),
        );
        setTables(tablesWithCount);
        if (!activeTable && tablesWithCount.length > 0) {
          setActiveTable(tablesWithCount[0].name);
        }
      }
    } catch (err) {
      console.error("Failed to fetch tables", err);
      toast.error("Database connection failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Fetch rows when active table changes
  const loadRows = async () => {
    if (!activeTable) return;
    setLoading(true);
    try {
      const data = await sqliteSelect<Record<string, unknown>>(activeTable);
      setRows(data);
    } catch (err) {
      console.error(`Load failed for ${activeTable}`, err);
      toast.error(`Could not load ${activeTable}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTable) {
      loadRows();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTable]);

  // 3. Filtered Rows
  const filteredRows = useMemo(() => {
    if (!search) return rows;
    const lowerSearch = search.toLowerCase();
    return rows.filter((row) =>
      Object.values(row).some((val) =>
        String(val).toLowerCase().includes(lowerSearch),
      ),
    );
  }, [rows, search]);

  // 4. Actions
  const handleDelete = async (row: Record<string, unknown>) => {
    if (!activeTable) return;
    const id = row.id ?? row.ID ?? row.rowid; // Heuristic for primary key
    if (id === undefined || id === null) {
      toast.error("Cannot delete: No primary key (id) found.");
      return;
    }

    if (
      window.confirm(
        `Are you sure you want to delete this record from ${activeTable}? This action is irreversible.`,
      )
    ) {
      try {
        await sqliteDelete(activeTable, String(id));
        setRows(rows.filter((r) => (r.id ?? r.ID ?? r.rowid) !== id));
        toast.success("Record purged from neural grid.");
      } catch {
        toast.error("Deletion failed.");
      }
    }
  };

  const handleRunSQL = async () => {
    if (!sqlQuery.trim()) return;
    try {
      setLoading(true);
      const db = await initDatabase();
      const res = db.exec(sqlQuery);
      setTerminalResult(res);
      toast.success("Query executed successfully.");
      fetchTables(); // Refresh metadata
      if (activeTable) loadRows();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setTerminalResult({ error: message });
      toast.error("SQL Error: " + message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRow = async (updatedRow: Record<string, unknown>) => {
    if (!activeTable) return;
    try {
      await sqliteInsert(activeTable, updatedRow);
      const idKey =
        updatedRow.id !== undefined
          ? "id"
          : updatedRow.ID !== undefined
            ? "ID"
            : "rowid";
      if (typeof idKey === "string") {
        setRows(
          rows.map((r) => (r[idKey] === updatedRow[idKey] ? updatedRow : r)),
        );
      }
      setEditRow(null);
      toast.success("Database synchronized.");
    } catch {
      toast.error("Save failed.");
    }
  };

  // --- RENDER ---

  const activeTableColor = activeTable
    ? getTableColor(activeTable)
    : NEON_COLORS[0]!;

  return (
    <div className="flex h-[700px] bg-zinc-950/20 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md animate-in fade-in zoom-in-95 duration-500">
      {/* 1. SIDEBAR (Tables) */}
      <div className="w-64 border-r border-white/5 bg-black/40 flex flex-col">
        <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
          <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
            <Database size={12} /> Layers
          </h3>
          <button
            onClick={fetchTables}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
          {tables.map((t) => {
            const color = getTableColor(t.name);
            const isActive = activeTable === t.name;
            return (
              <button
                key={t.name}
                onClick={() => setActiveTable(t.name)}
                className={`w-full px-4 py-2.5 flex items-center justify-between text-[11px] font-bold transition-all group relative overflow-hidden
                                    ${isActive
                    ? `${color.text} ${color.bg} ${color.border} border ${color.glow}`
                    : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
                  }
                                `}
              >
                <div className="flex items-center gap-3 relative z-10">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${isActive ? color.accent : "bg-white/10"} shadow-[0_0_5px_currentColor]`}
                  />
                  <span className="truncate">{t.name}</span>
                </div>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-md relative z-10 transition-all
                                    ${isActive
                      ? `${color.bg} ${color.text} font-black border ${color.border}`
                      : "bg-white/5 text-zinc-600 font-medium"
                    }
                                `}
                >
                  {t.count}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="active-layer-indicator"
                    className={`absolute left-0 w-1 inset-y-0 ${color.accent}`}
                  />
                )}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setShowTerminal(!showTerminal)}
          className={`p-4 border-t border-white/5 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all
                        ${showTerminal ? "bg-emerald-400/10 text-emerald-400" : "text-zinc-500 hover:text-white hover:bg-white/5"}
                    `}
        >
          <Terminal size={14} /> SQL Terminal
        </button>
      </div>

      {/* 2. MAIN AREA (Data Grid) */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Toolbar */}
        <div className="p-4 border-b border-white/5 bg-black/30 flex items-center gap-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
              size={14}
            />
            <input
              type="text"
              placeholder={`Search in ${activeTable || "database"}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-600 focus:border-white/20 focus:bg-white/[0.07] outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`px-3 py-1.5 rounded-lg border text-[10px] font-mono flex items-center gap-2 tracking-tighter
                            ${filteredRows.length > 0
                  ? `${activeTableColor.border} ${activeTableColor.text} ${activeTableColor.bg}`
                  : "border-white/10 text-zinc-500"
                }
                        `}
            >
              <Filter size={10} /> {filteredRows.length} RECORDS
            </div>
          </div>
        </div>

        {/* Grid Container */}
        <div className="flex-1 overflow-auto custom-scrollbar relative">
          <AnimatePresence mode="wait">
            {!activeTable ? (
              <div
                key="empty"
                className="h-full flex flex-col items-center justify-center p-12 text-zinc-500 gap-8 relative overflow-hidden"
              >
                {/* 3D Neural Core Visualization */}
                <div className="w-64 h-64 relative group">
                  <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full group-hover:bg-indigo-500/30 transition-all duration-1000" />
                  <MeshViewer url="models/data/neural_core.glb" autoRotate shadows={false} />

                  {/* Data Pulse HUD */}
                  <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-center space-y-2 w-full">
                    <span className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.5em] animate-pulse">Neural Grid Integrity: 99.8%</span>
                    <div className="text-[8px] text-zinc-700 font-mono">IDLE // STANDBY_MODE</div>
                  </div>
                </div>

                <div className="text-center mt-12 space-y-2 opacity-40">
                  <Database size={24} className="mx-auto text-zinc-800" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">Select a data layer to explore records</p>
                </div>
              </div>
            ) : filteredRows.length === 0 ? (
              <div
                key="no-results"
                className="h-full flex flex-col items-center justify-center text-zinc-500 gap-4 opacity-50"
              >
                <Search size={48} className="text-zinc-800" />
                <p className="text-sm font-bold uppercase tracking-widest">
                  No matching records found
                </p>
              </div>
            ) : (
              <motion.table
                key={activeTable}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full text-left border-collapse min-w-max"
              >
                <thead className="sticky top-0 bg-zinc-900/90 backdrop-blur-md z-10 border-b border-white/5">
                  <tr>
                    <th className="px-6 py-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-r border-white/5">
                      Actions
                    </th>
                    {Object.keys(filteredRows[0] || {}).map((key) => (
                      <th
                        key={key}
                        className="px-6 py-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-r border-white/5"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredRows.map((row, i) => (
                    <tr
                      key={i}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="px-4 py-2 border-r border-white/5 flex items-center gap-2">
                        <button
                          onClick={() =>
                            setEditRow(JSON.stringify(row, null, 2))
                          }
                          className={`p-1.5 rounded-lg border flex items-center justify-center transition-all opacity-0 group-hover:opacity-100
                                                        ${activeTableColor.bg} ${activeTableColor.text} ${activeTableColor.border} ${activeTableColor.hoverBg} hover:text-white
                                                    `}
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(row)}
                          className="p-1.5 rounded-lg border border-rose-400/20 bg-rose-400/10 text-rose-400 hover:bg-rose-400/20 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                      {Object.values(row).map((val, j) => (
                        <td
                          key={j}
                          className="px-6 py-3 text-[11px] font-mono text-zinc-300 border-r border-white/5 max-w-xs truncate"
                        >
                          {typeof val === "object" && val !== null ? (
                            <span className="flex items-center gap-1.5 text-indigo-400 font-bold italic">
                              <FileJson size={10} /> JSON
                            </span>
                          ) : (
                            String(val)
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </motion.table>
            )}
          </AnimatePresence>
        </div>

        {/* 3. TERMINAL OVERLAY */}
        <AnimatePresence>
          {showTerminal && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "40%" }}
              exit={{ height: 0 }}
              className="absolute bottom-0 inset-x-0 bg-black/95 backdrop-blur-3xl border-t border-emerald-400/30 z-20 flex flex-col shadow-[0_-10px_40px_rgba(16,185,129,0.1)]"
            >
              <div className="flex items-center justify-between px-6 py-3 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <Terminal size={14} className="text-emerald-400" />
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                    Master SQL Core
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleRunSQL}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-emerald-400/10 text-emerald-400 border border-emerald-400/30 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400/20 hover:text-white transition-all disabled:opacity-50"
                  >
                    Execute
                  </button>
                  <button
                    onClick={() => setShowTerminal(false)}
                    className="text-zinc-600 hover:text-white transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="flex-1 flex font-mono text-xs overflow-hidden">
                <textarea
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  placeholder="SELECT * FROM user_settings..."
                  className="flex-1 bg-transparent p-6 outline-none text-emerald-50 resize-none placeholder-zinc-800 custom-scrollbar"
                />
                <div className="w-1/3 border-l border-white/5 p-6 overflow-auto custom-scrollbar bg-white/[0.02]">
                  <div className="text-[10px] font-black text-zinc-600 uppercase mb-4 tracking-widest">
                    Output
                  </div>
                  {terminalResult ? (
                    (terminalResult as { error?: string }).error ? (
                      <div className="text-rose-500 break-words">
                        {(terminalResult as { error?: string }).error}
                      </div>
                    ) : (
                      <pre className="text-emerald-400/80 text-[10px]">
                        {JSON.stringify(terminalResult, null, 2)}
                      </pre>
                    )
                  ) : (
                    <div className="text-zinc-800 italic">Queue empty...</div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4. EDIT MODAL */}
        <AnimatePresence>
          {editRow && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/80 backdrop-blur-xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[80vh]"
              >
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                  <div className="flex items-center gap-3">
                    <Edit2 size={18} className={activeTableColor.text} />
                    <div>
                      <h4 className="text-lg font-black text-white">
                        Neural Data Patch
                      </h4>
                      <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
                        Patching: {activeTable} // LIVE_SYNC
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditRow(null)}
                    className="p-2 rounded-xl hover:bg-white/10 text-zinc-500 hover:text-white transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-hidden p-6 relative">
                  <div className="absolute top-2 right-8 flex items-center gap-2 text-[10px] text-rose-400 font-black animate-pulse bg-rose-400/10 px-3 py-1 rounded-full border border-rose-400/20 z-10">
                    <AlertTriangle size={10} /> DANGER: DIRECT DB MANIPULATION
                  </div>
                  <textarea
                    value={editRow}
                    onChange={(e) => setEditRow(e.target.value)}
                    className="w-full h-full bg-black/40 border border-white/5 rounded-2xl p-6 font-mono text-sm text-emerald-50 outline-none focus:border-emerald-400/30 transition-all resize-none custom-scrollbar shadow-inner"
                  />
                </div>

                <div className="p-6 border-t border-white/5 bg-white/5 flex items-center justify-between">
                  <div className="text-[10px] font-mono text-zinc-600 max-w-[60%] leading-relaxed">
                    <span className="text-emerald-500 font-bold">INFO:</span>{" "}
                    Erase fields carefully. Missing indices or corrupted JSON
                    blobs may destabilize the application orbit.
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setEditRow(null)}
                      className="px-6 py-2.5 rounded-xl border border-white/10 text-zinc-400 font-bold text-xs hover:bg-white/5 transition-all outline-none"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        try {
                          if (editRow) handleSaveRow(JSON.parse(editRow));
                        } catch {
                          toast.error(
                            "JSON Syntax Error: Verification failed.",
                          );
                        }
                      }}
                      className={`px-8 py-2.5 rounded-xl border font-black text-xs transition-all outline-none
                                                ${activeTableColor.bg} ${activeTableColor.text} ${activeTableColor.border} ${activeTableColor.glow} hover:bg-white/10
                                            `}
                    >
                      Save Patch
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Loading Overlay */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center"
            >
              <div className="flex flex-col items-center gap-4">
                <RefreshCw
                  size={32}
                  className="text-emerald-400 animate-spin"
                />
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] animate-pulse">
                  Syncing Neural Core...
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
