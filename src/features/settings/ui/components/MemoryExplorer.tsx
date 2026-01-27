import { getMemoryStore } from "@shared/api/memory/memoryStore";
import type {
  SearchResult,
  VectorDocument,
  VectorMetadata,
} from "@shared/types/ai-brain";
import { NeuralConfirmModal } from "@shared/ui/NeuralConfirmModal";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  BookOpen,
  Brain,
  ChevronDown,
  Cpu,
  Database,
  FileText,
  type LucideIcon,
  Network,
  RefreshCw,
  Search,
  Share2,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

// --- TYPES ---

// Local type extension to ensure UI works even if shared-types build lags
interface EliteMetadata extends VectorMetadata {
  title?: string;
  path?: string;
  subject?: string;
  topic?: string;
}

interface Stats {
  totalDocuments: number;
  byType: Record<string, number>;
  bySubject: Record<string, number>;
  totalSize: number;
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  delay: number;
}

// --- COMPONENTS ---

const StatCard = ({
  label,
  value,
  icon: Icon,
  color,
  delay,
}: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className={`bg-zinc-950/50 backdrop-blur-md border border-white/5 rounded-xl p-4 flex items-center gap-4 relative overflow-hidden group`}
  >
    <div
      className={`p-3 rounded-lg bg-${color}-500/10 text-${color}-400 relative z-10`}
    >
      <Icon size={20} />
    </div>
    <div className="relative z-10">
      <div className="text-2xl font-bold text-white font-mono tracking-tight">
        {value}
      </div>
      <div className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
        {label}
      </div>
    </div>
    {/* Ambient Glow */}
    <div
      className={`absolute -right-4 -bottom-4 w-24 h-24 bg-${color}-500/10 blur-2xl rounded-full group-hover:bg-${color}-500/20 transition-all duration-500`}
    />
  </motion.div>
);

const TrustBadge = ({ score }: { score: number }) => {
  let color = "red";
  let tier = "LOW";
  if (score >= 0.9) {
    color = "emerald";
    tier = "VERIFIED";
  } else if (score >= 0.7) {
    color = "amber";
    tier = "VALID";
  }

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-0.5 rounded bg-${color}-500/10 border border-${color}-500/20 text-${color}-400 shadow-[0_0_10px_rgba(var(--color-${color}-500),0.1)]`}
    >
      <ShieldCheck size={10} />
      <span className="text-[9px] font-bold font-mono tracking-wider">
        {tier} {(score * 100).toFixed(0)}%
      </span>
    </div>
  );
};

// --- CUSTOM ELITE DROPDOWN (PREMIUM) ---

interface EliteDropdownProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

const EliteDropdown = ({
  options,
  value,
  onChange,
  label,
}: EliteDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-3 bg-zinc-950/80 backdrop-blur-xl border ${isOpen ? "border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]" : "border-white/10 hover:border-white/20"} text-slate-300 rounded-xl px-4 py-2.5 text-xs font-bold uppercase transition-all duration-300 min-w-[180px] group`}
      >
        <span
          className={
            value === "all"
              ? "text-slate-400 group-hover:text-slate-200"
              : "text-white text-shadow-glow"
          }
        >
          {value === "all" ? label || "ALL" : value}
        </span>
        <ChevronDown
          size={14}
          className={`text-slate-500 transition-transform duration-300 ${isOpen ? "rotate-180 text-indigo-400" : "group-hover:text-slate-300"}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, scale: 0.95, filter: "blur(10px)" }}
            transition={{ duration: 0.2, ease: "circOut" }}
            className="absolute top-full left-0 mt-2 w-full min-w-[220px] bg-zinc-950/90 backdrop-blur-2xl border border-white/10 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] overflow-hidden z-[100] py-1 ring-1 ring-white/5"
          >
            <div className="max-h-[250px] overflow-y-auto custom-scrollbar p-1">
              <button
                onClick={() => {
                  onChange("all");
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase rounded-lg transition-all border border-transparent ${value === "all" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.1)]" : "text-slate-500 hover:bg-white/5 hover:text-white"}`}
              >
                {label || "ALL"}
              </button>
              {options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase rounded-lg transition-all border border-transparent ${value === opt ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.1)]" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- NEURAL VISUALIZATION COMPONENT ---

interface NeuralNodeProps {
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
  pulseDelay: number;
}

const NeuralNode = ({
  x,
  y,
  size,
  color,
  delay,
  pulseDelay,
}: NeuralNodeProps) => (
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: [0.3, 0.8, 0.3] }}
    transition={{
      scale: { duration: 0.5, delay },
      opacity: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
        delay: pulseDelay,
      },
    }}
    className={`absolute rounded-full bg-${color}-400 blur-[1px]`}
    style={{ left: `${x}%`, top: `${y}%`, width: size, height: size }}
  />
);

interface ConnectionLineProps {
  start: { x: number; y: number };
  end: { x: number; y: number };
}

const ConnectionLine = ({ start, end }: ConnectionLineProps) => (
  <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
    <motion.line
      x1={`${start.x}%`}
      y1={`${start.y}%`}
      x2={`${end.x}%`}
      y2={`${end.y}%`}
      stroke="url(#gradient-line)"
      strokeWidth="1"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 1.5, ease: "easeOut" }}
    />
    <defs>
      <linearGradient id="gradient-line" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="rgba(99, 102, 241, 0)" />
        <stop offset="50%" stopColor="rgba(99, 102, 241, 0.5)" />
        <stop offset="100%" stopColor="rgba(99, 102, 241, 0)" />
      </linearGradient>
    </defs>
  </svg>
);

// --- GROUPING LOGIC ---

type GroupedResults = Record<string, VectorDocument[]>;

const groupBySubject = (docs: VectorDocument[]): GroupedResults => {
  const groups: GroupedResults = {};
  docs.forEach((doc) => {
    if (!doc || !doc.metadata) return;

    const meta = doc.metadata as EliteMetadata;
    let subject = meta.subject || "Ongecategoriseerd";
    const titleLower = (meta.title || meta.sourceId || "").toLowerCase();

    if (subject === "Ongecategoriseerd") {
      if (titleLower.includes("filosofie")) subject = "Filosofie";
      else if (titleLower.includes("frans")) subject = "Frans";
      else if (titleLower.includes("wiskunde")) subject = "Wiskunde";
      else if (titleLower.includes("natuurkunde")) subject = "Natuurkunde";
      else if (titleLower.includes("scheikunde")) subject = "Scheikunde";
      else if (titleLower.includes("geschiedenis")) subject = "Geschiedenis";
    }

    if (!groups[subject]) {
      groups[subject] = [];
    }
    groups[subject]!.push(doc);
  });
  return groups;
};

// --- SMART TITLE LOGIC ---
const getDisplayTitle = (meta: EliteMetadata): string => {
  if (
    meta.title &&
    meta.title !== "Untitled Document" &&
    meta.title.length > 2
  ) {
    return meta.title;
  }
  if (meta.path) {
    const filename = meta.path.split(/[/\\]/).pop();
    if (filename) return filename;
  }
  return meta.sourceId || "Unknown Memory";
};

// --- HELPER: DERIVE STATS (Backend Fallback) ---
const deriveStats = (docs: VectorDocument[]): Stats => {
  const byType: Record<string, number> = {};
  const bySubject: Record<string, number> = {};

  docs.forEach((doc) => {
    const type = doc.metadata.type || "unknown";
    const meta = doc.metadata as EliteMetadata;
    const subject = meta.subject || "Unknown";

    byType[type] = (byType[type] || 0) + 1;
    bySubject[subject] = (bySubject[subject] || 0) + 1;
  });

  return {
    totalDocuments: docs.length,
    byType,
    bySubject,
    totalSize: docs.reduce((acc, doc) => acc + doc.text.length, 0),
  };
};

export const MemoryExplorer = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<VectorDocument[]>([]);
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "graph">("list");
  const [filterType, setFilterType] = useState<"all" | "library" | "note">(
    "all",
  );
  const [activeSubject, setActiveSubject] = useState<string>("all");

  const memoryStore = getMemoryStore();

  const fetchStats = async () => {
    // 1. Try get real stats
    const s = await memoryStore.getStats();

    // 2. If empty (0) but we have results in state, fallback to derived stats
    // This happens when data is in Backend (IPC) but not in Local Store
    if (s.totalDocuments === 0 && results.length > 0) {
      setStats(deriveStats(results));
    } else {
      setStats(s);
    }
  };

  const handleSearch = async () => {
    const q = query.trim();
    const res = await memoryStore.search(q, { limit: 100 }); // Increased limit for better stats
    const typedRes = res.map((r) => r as VectorDocument);
    setResults(typedRes);

    // Refresh stats logic after search
    const s = await memoryStore.getStats();
    if (s.totalDocuments === 0 && typedRes.length > 0) {
      setStats(deriveStats(typedRes));
    } else if (s.totalDocuments > 0) {
      setStats(s);
    }
  };

  const handleClear = async () => {
    await memoryStore.clear();
    await fetchStats();
    handleSearch();
    setShowWipeConfirm(false);
  };

  const handleDeleteItem = async () => {
    if (deletingId) {
      await memoryStore.delete(deletingId);
      await fetchStats();
      handleSearch(); // Refresh list
      setDeletingId(null);
    }
  };

  useEffect(() => {
    const init = async () => {
      // Load initial browse data (all items)
      const r = await memoryStore.search("", { limit: 100 });
      const typedRes = r.map((x) => x as VectorDocument);
      setResults(typedRes);

      // Now fetch stats - logic handles fallback internally
      const s = await memoryStore.getStats();
      if (s.totalDocuments === 0 && typedRes.length > 0) {
        setStats(deriveStats(typedRes));
      } else {
        setStats(s);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredResults = results.filter((r) => {
    if (!r || !r.metadata) return false;

    const meta = r.metadata as EliteMetadata;
    const matchesType = filterType === "all" || r.metadata.type === filterType;
    let subject = meta.subject || "Ongecategoriseerd";
    const titleLower = (meta.title || meta.sourceId || "").toLowerCase();
    if (subject === "Ongecategoriseerd") {
      if (titleLower.includes("filosofie")) subject = "Filosofie";
      else if (titleLower.includes("frans")) subject = "Frans";
      else if (titleLower.includes("wiskunde")) subject = "Wiskunde";
      else if (titleLower.includes("natuurkunde")) subject = "Natuurkunde";
      else if (titleLower.includes("scheikunde")) subject = "Scheikunde";
      else if (titleLower.includes("geschiedenis")) subject = "Geschiedenis";
    }

    const matchesSubject = activeSubject === "all" || subject === activeSubject;

    return matchesType && matchesSubject;
  });

  const groupedResults = useMemo(
    () => groupBySubject(filteredResults),
    [filteredResults],
  );
  const subjects = Object.keys(groupBySubject(results)).sort();

  const graphNodes = useMemo(() => {
    if (results.length === 0) return [];
    const visualizeDocs = results.slice(0, 15);
    return visualizeDocs.map((doc, i) => {
      if (!doc || !doc.metadata)
        return { x: 50, y: 50, size: 4, color: "slate", pulseDelay: 0 };
      return {
        x: 20 + ((i * 13) % 60) + Math.random() * 10,
        y: 20 + ((i * 7) % 60) + Math.random() * 10,
        size: 4 + (doc.text.length % 10),
        color: doc.metadata.type === "library" ? "indigo" : "amber",
        pulseDelay: Math.random() * 2,
      };
    });
  }, [results]);

  const isBrowseMode = query.trim() === "";

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Vector Count"
          value={stats?.totalDocuments || 0}
          icon={Database}
          color="blue"
          delay={0}
        />
        <StatCard
          label="Knowledge Nodes"
          value={stats?.byType?.library || 0}
          icon={BookOpen}
          color="indigo"
          delay={0.1}
        />
        <StatCard
          label="Memory Fragments"
          value={stats?.byType?.note || 0}
          icon={FileText}
          color="amber"
          delay={0.2}
        />
        <StatCard
          label="Neural Density"
          value={`${((stats?.totalSize || 0) / 1024).toFixed(1)} KB`}
          icon={Activity}
          color="emerald"
          delay={0.3}
        />
      </div>

      {/* Neural Graph Visualizer Area */}
      {viewMode === "graph" && (
        <div className="relative h-64 bg-zinc-950/50 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-3xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(17,24,39,0)_0%,_rgba(0,0,0,0.8)_100%)]" />
          {graphNodes.map((node, i) => {
            const nextNode = graphNodes[i + 1];
            return nextNode ? (
              <ConnectionLine key={i} start={node} end={nextNode} />
            ) : null;
          })}
          {graphNodes.map((node, i) => (
            <NeuralNode key={i} {...node} delay={i * 0.1} />
          ))}
          {graphNodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-600 font-mono text-xs">
              NO NEURAL ACTIVITY
            </div>
          )}
          <div className="absolute bottom-4 left-6">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-emerald-500 animate-pulse" />
              <span className="text-xs font-mono text-emerald-500">
                NEURAL ACTIVITY DETECTED
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Controls & Tools */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 group w-full">
          <div className="absolute inset-0 bg-blue-500/5 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-hover:text-blue-400 transition-colors"
            size={18}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Query Neural Database..."
            className="w-full bg-black/60 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white font-mono placeholder:text-slate-600 focus:border-blue-500/50 focus:shadow-[0_0_20px_rgba(59,130,246,0.2)] focus:outline-none transition-all relative z-10"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <EliteDropdown
            options={subjects}
            value={activeSubject}
            onChange={setActiveSubject}
            label="ALL SUBJECTS"
          />
          <button
            onClick={() => setViewMode(viewMode === "list" ? "graph" : "list")}
            className={`px-4 py-2 rounded-xl border flex items-center gap-2 transition-all ${viewMode === "graph" ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300" : "bg-white/5 border-white/10 text-slate-400"}`}
          >
            <Network size={18} />
            <span className="hidden lg:inline font-bold text-xs">
              {viewMode === "graph" ? "GRAPH VIEW" : "LIST VIEW"}
            </span>
          </button>
          <button
            onClick={fetchStats}
            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={() => setShowWipeConfirm(true)}
            className="p-3 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/30 rounded-xl text-red-500/50 hover:text-red-400 transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Data Matrix (Results) */}
      <div className="flex-1 bg-zinc-950/50 border border-white/10 rounded-2xl overflow-hidden flex flex-col min-h-[400px]">
        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/5 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Brain size={18} className="text-indigo-400" />
            <span className="text-xs font-bold text-white uppercase tracking-widest hidden sm:inline">
              Memory Matrix
            </span>
            <div className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-mono text-slate-300">
              {filteredResults.length} RECORDS
            </div>
          </div>

          <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
            <button
              onClick={() => setFilterType("all")}
              className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${filterType === "all" ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"}`}
            >
              ALL
            </button>
            <button
              onClick={() => setFilterType("library")}
              className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${filterType === "library" ? "bg-indigo-500/20 text-indigo-300" : "text-slate-500 hover:text-slate-300"}`}
            >
              LIBRARY
            </button>
            <button
              onClick={() => setFilterType("note")}
              className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${filterType === "note" ? "bg-amber-500/20 text-amber-300" : "text-slate-500 hover:text-slate-300"}`}
            >
              NOTES
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
          <AnimatePresence>
            {Object.keys(groupedResults).length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50 space-y-4"
              >
                <Cpu size={48} strokeWidth={1} />
                <div className="text-center">
                  <div className="text-sm font-mono uppercase tracking-widest">
                    No Vectors Found
                  </div>
                  <div className="text-xs opacity-60">
                    Try refining your neural query
                  </div>
                </div>
              </motion.div>
            ) : (
              Object.entries(groupedResults).map(([subject, docs]) => (
                <div key={subject} className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      {subject}
                    </h3>
                    <span className="text-[10px] text-slate-500 font-mono">
                      ({docs.length})
                    </span>
                  </div>

                  {docs.map((doc, i) => {
                    const meta = doc.metadata as EliteMetadata;
                    return (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        // CLAMPED DELAY: Instant for index > 10, otherwise fast stagger
                        transition={{ delay: i > 10 ? 0 : i * 0.03 }}
                        className="group relative p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-indigo-500/30 transition-all cursor-pointer"
                      >
                        <div className="absolute left-0 top-4 bottom-4 w-1 bg-gradient-to-b from-transparent via-white/10 to-transparent group-hover:via-indigo-500 transition-colors" />
                        <div className="ml-3">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider border ${meta.type === "library" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" : meta.type === "note" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-slate-500/10 text-slate-400 border-slate-500/20"}`}
                              >
                                {meta.type.replace("_", " ")}
                              </span>
                              <span className="text-[10px] text-slate-600 font-mono tracking-wide">
                                ID: {doc.id.slice(0, 8)}...
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              {isBrowseMode ? (
                                <span className="text-[10px] font-mono text-emerald-500">
                                  INDEXED
                                </span>
                              ) : (
                                (doc as SearchResult).score && (
                                  <span className="text-[10px] font-mono text-cyan-500">
                                    SIM:{" "}
                                    {(
                                      (doc as SearchResult).score * 100
                                    ).toFixed(1)}
                                    %
                                  </span>
                                )
                              )}
                              <TrustBadge score={meta.trustScore} />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingId(doc.id);
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                                title="Delete Item"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          <div className="flex gap-4">
                            <div className="flex-1">
                              {isBrowseMode ? (
                                <div>
                                  <h4 className="text-base text-white font-bold mb-1">
                                    {getDisplayTitle(meta)}
                                  </h4>
                                  <div className="text-xs text-slate-500 font-mono flex gap-4">
                                    <span>
                                      UPLOADED:{" "}
                                      {new Date(
                                        meta.createdAt,
                                      ).toLocaleDateString()}
                                    </span>
                                    {meta.path && (
                                      <span>PATH: {meta.path}</span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-slate-300 font-serif leading-relaxed line-clamp-2 mix-blend-lighten pl-2 border-l-2 border-white/5 italic">
                                  "{doc.text}"
                                </p>
                              )}
                            </div>
                            <button className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-indigo-400 transition-all self-center">
                              <Share2 size={16} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      <NeuralConfirmModal
        isOpen={showWipeConfirm}
        onClose={() => setShowWipeConfirm(false)}
        onConfirm={handleClear}
        title="GLOBAL WIPE INITIATED"
        message="Are you sure you want to purge ALL long-term memory? This cannot be undone."
        confirmText="Yes, Wipe All"
        cancelText="Cancel"
        variant="danger"
      />
      <NeuralConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteItem}
        title="DELETE MEMORY FRAGMENT"
        message="Are you sure you want to delete this specific memory? This action is irreversible."
        confirmText="Confirm Deletion"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};
