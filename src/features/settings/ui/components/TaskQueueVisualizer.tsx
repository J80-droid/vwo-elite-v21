import { useTaskQueueStore } from "@shared/api/ai-brain/taskQueue";
import type { AITask } from "@shared/types/ai-brain";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Clock,
  Cpu,
  LayoutList,
  Loader2,
  PlayCircle,
  Server,
} from "lucide-react";

// --- COMPONENTS ---

const safeStringify = (data: unknown): string => {
  try {
    const str = JSON.stringify(data);
    if (str.length > 50) return str.substring(0, 47) + "...";
    return str;
  } catch {
    return "[Complex Data]";
  }
};

const TaskCard = ({ task, isActive }: { task: AITask; isActive?: boolean }) => {
  let statusColor = "slate";
  let icon = Circle;

  switch (task.status) {
    case "running":
      statusColor = "blue";
      icon = Loader2;
      break;
    case "completed":
      statusColor = "emerald";
      icon = CheckCircle2;
      break;
    case "failed":
      statusColor = "red";
      icon = Circle; // AlertCircle
      break;
    case "pending":
    default:
      statusColor = "slate";
      icon = Clock;
      break;
  }

  const Icon = icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`
                relative p-4 rounded-xl border border-white/5 
                ${isActive ? `bg-${statusColor}-500/10 border-${statusColor}-500/30` : "bg-zinc-900/50"}
                flex items-start gap-4 transition-colors
            `}
    >
      <div
        className={`p-2 rounded-lg bg-${statusColor}-500/10 text-${statusColor}-400 shrink-0`}
      >
        <Icon size={18} className={isActive ? "animate-spin" : ""} />
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex justify-between items-start">
          <h4
            className={`text-sm font-bold ${isActive ? "text-white" : "text-slate-300"} truncate`}
          >
            {task.intent.toUpperCase()} Task
          </h4>
          <span className="text-[10px] font-mono text-slate-500 uppercase">
            {task.priority} PRI
          </span>
        </div>

        <p className="text-xs text-slate-500 line-clamp-2 font-mono">
          {task.prompt.slice(0, 80)}...
        </p>

        <div className="flex items-center gap-2 pt-2 text-[10px]">
          <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-slate-400">
            {task.modelId || "Auto-Route"}
          </span>
          {task.completedAt && (
            <span className="text-emerald-500">
              {((task.completedAt - task.createdAt) / 1000).toFixed(2)}s
            </span>
          )}
        </div>

        {/* Thought Process Steps */}
        {task.steps && task.steps.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
            <div className="text-[9px] text-slate-600 uppercase font-bold tracking-widest pl-1">
              Thought Process:
            </div>
            {task.steps.map((step) => (
              <div
                key={step.id}
                className="flex items-center gap-2 px-2 py-1.5 bg-black/20 rounded-lg border border-white/5"
              >
                {step.status === "running" ? (
                  <Loader2 size={10} className="text-blue-400 animate-spin" />
                ) : step.status === "completed" ? (
                  <CheckCircle2 size={10} className="text-emerald-400" />
                ) : step.status === "failed" ? (
                  <AlertCircle size={10} className="text-red-400" />
                ) : (
                  <Circle size={10} className="text-slate-600" />
                )}
                <span
                  className={`text-[10px] font-mono ${isActive ? "text-slate-300" : "text-slate-500"}`}
                >
                  {step.name}
                </span>
                {step.data !== undefined && step.data !== null && (
                  <div
                    className="ml-auto text-[8px] text-slate-600 font-mono truncate max-w-[100px]"
                    title={JSON.stringify(step.data, null, 2)}
                  >
                    {safeStringify(step.data)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {isActive && (
        <div className="absolute right-4 top-4 w-2 h-2 rounded-full bg-blue-500 animate-ping" />
      )}
    </motion.div>
  );
};

export const TaskQueueVisualizer = () => {
  // Force re-render on store updates
  const localQueue = useTaskQueueStore((s) => s.localQueue);
  const cloudQueue = useTaskQueueStore((s) => s.cloudQueue);
  const isLocalRunning = useTaskQueueStore((s) => s.isLocalRunning);

  const activeLocalTask = localQueue.find((t) => t.status === "running");

  // Derived lists
  const pendingLocal = localQueue.filter((t) => t.status === "pending");
  const completedLocal = localQueue
    .filter((t) => t.status === "completed" || t.status === "failed")
    .slice(0, 3); // Last 3

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[400px]">
      {/* LEFT: Local Execution Lane (Serial) */}
      <div className="bg-zinc-950/50 border border-white/10 rounded-2xl p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <Cpu size={20} className="text-blue-400" />
          <div>
            <h3 className="font-bold text-white text-sm">
              Local Execution Lane
            </h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">
              Serial Processing • On-Device
            </p>
          </div>
          <div
            className={`ml-auto px-2 py-0.5 rounded text-[10px] font-bold ${isLocalRunning ? "bg-blue-500 text-white animate-pulse" : "bg-slate-800 text-slate-400"}`}
          >
            {isLocalRunning ? "PROCESSING" : "IDLE"}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
          {/* Active Task */}
          {activeLocalTask && (
            <div className="mb-6">
              <div className="text-[10px] text-slate-500 uppercase mb-2 pl-1">
                Processing Now
              </div>
              <TaskCard task={activeLocalTask} isActive />
              <div className="h-4 border-l-2 border-dashed border-white/10 ml-8 my-1" />
            </div>
          )}

          {/* Pending Queue */}
          {pendingLocal.length > 0 && (
            <div>
              <div className="text-[10px] text-slate-500 uppercase mb-2 pl-1">
                Up Next ({pendingLocal.length})
              </div>
              <div className="space-y-2">
                {pendingLocal.map((t) => (
                  <TaskCard key={t.id} task={t} />
                ))}
              </div>
            </div>
          )}

          {/* Completed History (Recent) */}
          {completedLocal.length > 0 && (
            <div className="mt-6 pt-4 border-t border-white/5 opacity-60">
              <div className="text-[10px] text-slate-500 uppercase mb-2 pl-1">
                Recent History
              </div>
              <div className="space-y-2">
                {completedLocal.map((t) => (
                  <TaskCard key={t.id} task={t} />
                ))}
              </div>
            </div>
          )}

          {localQueue.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2">
              <PlayCircle size={32} className="opacity-20" />
              <span className="text-xs">Queue Empty</span>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Cloud Execution Lane (Parallel) */}
      <div className="bg-zinc-950/50 border border-white/10 rounded-2xl p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <Server size={20} className="text-purple-400" />
          <div>
            <h3 className="font-bold text-white text-sm">
              Cloud Parallel Lane
            </h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">
              Async Processing • Multi-Thread
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 gap-3">
            {cloudQueue.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2 py-12">
                <LayoutList size={32} className="opacity-20" />
                <span className="text-xs">No Active Cloud Jobs</span>
              </div>
            ) : (
              cloudQueue.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  isActive={t.status === "running"}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
