import { ExecutionPlan, PlanStep } from "@shared/api/ai-brain/planExecutor";
import { cn } from "@shared/lib/utils";
import {
    AlertCircle,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Circle,
    Clock,
    Loader2,
    Workflow,
} from "lucide-react";
import React, { useState } from "react";

interface PlanVisualizerProps {
    plan: ExecutionPlan;
    className?: string;
}

export function PlanVisualizer({ plan, className }: PlanVisualizerProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    const getStatusColor = (status: PlanStep["status"]) => {
        switch (status) {
            case "completed":
                return "text-emerald-400";
            case "executing":
                return "text-blue-400";
            case "failed":
                return "text-red-400";
            case "pending":
                return "text-white/20";
            case "skipped":
                return "text-white/10";
            default:
                return "text-white/20";
        }
    };

    const getStatusIcon = (status: PlanStep["status"]) => {
        switch (status) {
            case "completed":
                return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
            case "executing":
                return (
                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                );
            case "failed":
                return <AlertCircle className="w-5 h-5 text-red-400" />;
            case "pending":
                return <Circle className="w-5 h-5 text-white/20" />;
            case "skipped":
                return <Clock className="w-5 h-5 text-white/10" />;
        }
    };

    const completedCount = plan.steps.filter(
        (s) => s.status === "completed",
    ).length;
    const progress = (completedCount / plan.steps.length) * 100;

    return (
        <div
            className={cn(
                "bg-obsidian-900/60 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-500",
                className,
            )}
        >
            {/* Header */}
            <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Workflow className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                            Execution Plan
                        </h3>
                        <p className="text-[10px] text-white/40 truncate max-w-[200px]">
                            {plan.goal}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-white">
                            {completedCount} / {plan.steps.length}
                        </span>
                        <div className="w-24 h-1 bg-white/5 rounded-full mt-1 overflow-hidden">
                            <div
                                className="h-full bg-blue-500 transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                    {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-white/40" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-white/40" />
                    )}
                </div>
            </div>

            {/* Steps List */}
            {isExpanded && (
                <div className="p-4 pt-0 space-y-3 border-t border-white/5 bg-black/20">
                    <div className="py-3">
                        {plan.steps.map((step, index) => (
                            <div
                                key={step.id}
                                className="relative flex gap-4 pb-6 last:pb-0"
                            >
                                {/* Connector line */}
                                {index < plan.steps.length - 1 && (
                                    <div className="absolute left-[10px] top-6 bottom-0 w-[2px] bg-white/5" />
                                )}

                                <div className="relative z-10 pt-0.5">
                                    {getStatusIcon(step.status)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h4
                                        className={cn(
                                            "text-sm font-bold transition-colors",
                                            getStatusColor(step.status),
                                        )}
                                    >
                                        {step.title}
                                    </h4>
                                    <p className="text-xs text-white/40 mt-1 leading-relaxed">
                                        {step.description}
                                    </p>

                                    {step.toolName && (
                                        <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-white/5 rounded text-[10px] font-mono text-white/30 border border-white/5">
                                            <span className="text-white/20">Tool:</span>
                                            {step.toolName}
                                        </div>
                                    )}

                                    {step.error && (
                                        <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] text-red-300">
                                            Error: {step.error}
                                        </div>
                                    )}

                                    {step.status === "completed" && !!step.result && (
                                        <div className="mt-2 p-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-[10px] text-white/30 truncate">
                                            {(typeof step.result === "string"
                                                ? step.result
                                                : "Resultaat ontvangen") as React.ReactNode}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
