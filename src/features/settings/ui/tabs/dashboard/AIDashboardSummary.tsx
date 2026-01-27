import { getModelRecommendations, type SystemSpecs } from "@shared/lib/hardwareDetector";
import { useAIAnalyticsStore } from "@shared/model/aiStatusStore";
import { useModelRegistryStore } from "@shared/model/modelRegistryStore";
import type { UserSettings } from "@shared/types/config";
import { Activity, Database, Download, ShieldCheck, Zap } from "lucide-react";
import React from "react";

import { EliteCard } from "../../components/EliteCard";
import { ModelSelector } from "../../components/ModelSelector";

interface AIDashboardSummaryProps {
    settings: UserSettings;
    updateSettings: (settings: Partial<UserSettings>) => void;
}

export const AIDashboardSummary: React.FC<AIDashboardSummaryProps> = ({
    settings,
    updateSettings,
}) => {
    const { systemSpecs } = useModelRegistryStore();
    const { getAggregatedStats } = useAIAnalyticsStore();
    const stats = getAggregatedStats
        ? getAggregatedStats()
        : { totalRequests: 0, avgTps: 0, avgLatency: 0, errorRate: 0 };

    const defaultSpecs: SystemSpecs = {
        cpuCores: 8,
        cpuModel: "Standard CPU",
        ramTotalGB: 16,
        ramAvailableGB: 8,
        gpu: { available: false },
        availableDiskGB: 50,
        tier: "high",
    };

    const currentSpecs = systemSpecs || defaultSpecs;
    const recommendations = getModelRecommendations(currentSpecs);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* 1. STATUS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <EliteCard glowColor="cyan">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400">
                            <Activity size={24} />
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-black text-white">{(stats.avgTps || 0).toFixed(1)}</div>
                            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">TPS Avg</div>
                        </div>
                    </div>
                    <h4 className="font-bold text-slate-300 text-sm">Neural Velocity</h4>
                    <p className="text-[11px] text-slate-500 mt-1">Stroomsnelheid van de AI Brain.</p>
                </EliteCard>

                <EliteCard glowColor="emerald">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
                            <ShieldCheck size={24} />
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-black text-white">99.9%</div>
                            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Uptime</div>
                        </div>
                    </div>
                    <h4 className="font-bold text-slate-300 text-sm">System Guard</h4>
                    <p className="text-[11px] text-slate-500 mt-1">Alle 14 intelligenties zijn operationeel.</p>
                </EliteCard>

                <EliteCard glowColor="amber">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400">
                            <Zap size={24} />
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-black text-white">{stats.totalRequests}</div>
                            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Calls</div>
                        </div>
                    </div>
                    <h4 className="font-bold text-slate-300 text-sm">Cognitive Load</h4>
                    <p className="text-[11px] text-slate-500 mt-1">Totaal aantal verwerkte requests.</p>
                </EliteCard>
            </div>

            {/* 2. MODEL SELECTOR SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3">
                    <EliteCard glowColor="blue">
                        <h3 className="text-sm font-black text-white mb-4 uppercase tracking-widest flex items-center gap-2">
                            <Activity size={14} className="text-blue-400" /> Default Neural Node
                        </h3>
                        <p className="text-xs text-slate-500 mb-6">Select the primary model for general reasoning and task orchestration.</p>
                        <ModelSelector
                            apiKey={settings.aiConfig.geminiApiKey}
                            value={settings.aiConfig.modelConfig.modelId}
                            onChange={(val) => updateSettings({
                                aiConfig: {
                                    ...settings.aiConfig,
                                    modelConfig: { ...settings.aiConfig.modelConfig, modelId: val }
                                }
                            })}
                            label="Global Reasoning Engine"
                        />
                    </EliteCard>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recommendations.slice(0, 2).map((rec) => (
                            <div key={rec.category} className="p-4 rounded-3xl bg-white/5 border border-white/5">
                                <div className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-2 flex items-center justify-between">
                                    {rec.category} recommendation
                                    <Zap size={10} className="text-amber-500" />
                                </div>
                                <div className="text-xs font-bold text-white mb-1">{rec.recommended[0]?.name}</div>
                                <p className="text-[9px] text-slate-600 leading-relaxed">{rec.explanation}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <EliteCard glowColor="purple">
                        <h3 className="text-sm font-black text-white mb-4 uppercase tracking-widest flex items-center gap-2">
                            <Download size={14} className="text-purple-400" /> Model Backbone
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
                                <div>
                                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Primary Engine</div>
                                    <div className="text-sm font-black text-purple-400">
                                        {settings.aiConfig.intelligencesConfig?.text?.modelId && settings.aiConfig.intelligencesConfig?.text?.modelId !== "default"
                                            ? settings.aiConfig.intelligencesConfig.text.modelId
                                            : settings.aiConfig.modelConfig.modelId}
                                    </div>
                                </div>
                                <div className="text-[10px] font-mono text-slate-600 uppercase">
                                    {settings.aiConfig.intelligencesConfig?.text?.provider || settings.aiConfig.modelConfig.provider}
                                </div>
                            </div>
                            <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
                                <div>
                                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Vision Node</div>
                                    <div className="text-sm font-black text-emerald-400">
                                        {settings.aiConfig.intelligencesConfig?.vision?.modelId && settings.aiConfig.intelligencesConfig?.vision?.modelId !== "default"
                                            ? settings.aiConfig.intelligencesConfig.vision.modelId
                                            : "Auto-Vision"}
                                    </div>
                                </div>
                                <div className="text-[10px] font-mono text-slate-600 uppercase">
                                    {settings.aiConfig.intelligencesConfig?.vision?.provider || "Edge"}
                                </div>
                            </div>
                        </div>
                    </EliteCard>

                    <EliteCard glowColor="rose">
                        <h3 className="text-sm font-black text-white mb-4 uppercase tracking-widest flex items-center gap-2">
                            <Database size={14} className="text-rose-400" /> Vector Memory
                        </h3>
                        <div className="flex items-center gap-4 mb-2">
                            <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden">
                                <div className="h-full bg-rose-500 w-[65%]" />
                            </div>
                            <span className="text-[10px] font-mono text-rose-400 font-bold">65% Active</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium">Memory persistence active across all academic modules.</p>
                    </EliteCard>
                </div>
            </div>
        </div>
    );
};
