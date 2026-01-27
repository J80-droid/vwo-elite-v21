import { getDefaultConfig } from "@shared/lib/intelligenceDefaults";
import type { IntelligenceEngineConfig, UserSettings } from "@shared/types/config";
import { ELITE_INTELLIGENCES, IntelligenceDefinition, IntelligenceTier } from "@shared/types/intelligence";
import { AnimatePresence, motion } from "framer-motion";
import {
    Cpu,
    HelpCircle,
    RefreshCcw,
    RotateCcw,
    Settings2,
    Target,
    Zap,
} from "lucide-react";
import React, { useState } from "react";

import { EliteCard } from "../../components/EliteCard";
import { ModelSelector } from "../../components/ModelSelector";

// ═══════════════════════════════════════════════════════════════════════════
// PARAMETER TOOLTIPS - Kort & bondig uitleg per parameter
// ═══════════════════════════════════════════════════════════════════════════
const PARAM_TOOLTIPS: Record<string, string> = {
    // Core
    temperature: "Creativiteit niveau. Laag (0-0.3) = deterministisch & precies. Hoog (0.7-1.5) = creatief & gevarieerd.",

    // Sampling
    topP: "Nucleus sampling. Beperkt keuzes tot tokens die samen P% kans vormen. Lager = meer gefocust.",
    topK: "Beperkt keuzes tot de K meest waarschijnlijke tokens. Lager = meer deterministisch.",
    minP: "Minimum waarschijnlijkheid filter. Tokens onder deze drempel worden genegeerd.",
    typicalP: "Selecteert tokens met 'typische' waarschijnlijkheid. Vermijdt zowel te voorspelbaar als te random.",
    tfsZ: "Tail Free Sampling. Verwijdert tokens in de 'staart' van de distributie. 1.0 = uit.",
    topA: "Top-A sampling. Dynamisch alternatief voor Top-K gebaseerd op waarschijnlijkheidsverschillen.",
    mirostat: "Adaptieve sampling die perplexiteit target. 0=uit, 1=v1, 2=v2 (aanbevolen).",
    mirostatTau: "Mirostat target perplexiteit. Lager = meer coherent, hoger = meer gevarieerd.",

    // Penalties
    frequencyPenalty: "Straft tokens die vaak voorkomen. Vermijd repetitie van woorden.",
    presencePenalty: "Straft tokens die al zijn gebruikt. Stimuleert nieuwe onderwerpen.",
    repetitionPenalty: "Algemene herhaling straf. 1.0 = uit, 1.1-1.2 = mild, >1.3 = sterk.",
    noRepeatNGramSize: "Verbiedt herhaling van N-gram sequenties. 0 = uit.",
    maxTokens: "Maximum aantal tokens in de respons. Beïnvloedt kosten en lengte.",
    seed: "Vaste seed voor reproduceerbare outputs. Leeg = random.",

    // DRY
    dryMultiplier: "DRY penalty sterkte. 0 = uit, hoger = sterker anti-repetitie.",
    dryBase: "DRY basis waarde voor penalty berekening.",
    dryAllowedLength: "Minimale sequentie lengte voordat DRY penalty actief wordt.",
    repetitionPenaltyRange: "Aantal tokens om te controleren voor repetitie. 0 = hele context.",

    // Structure
    grammarGBNF: "GBNF grammatica voor gestructureerde output (bijv. JSON schema, code syntax).",
    jsonModeForced: "Forceert JSON output formaat. Handig voor API responses.",

    // Search
    beamSearch: "Beam search i.p.v. greedy. Exploreert meerdere paden voor betere kwaliteit.",
    numBeams: "Aantal parallelle beams. Meer = betere kwaliteit maar langzamer.",
    contrastiveSearch: "Contrastive decoding. Vermijdt repetitie door diversiteit te stimuleren.",

    // Memory
    numCtx: "Context grootte in tokens. Meer = meer geheugen maar langzamer & duurder.",
    kvCacheQuantization: "KV-cache bits. Lager = minder VRAM maar lagere precisie.",
    ropeFrequencyBase: "RoPE basis frequentie. Beïnvloedt context window extrapolatie.",
    ropeFrequencyScale: "RoPE schaal factor. <1 = compacter, >1 = uitgerekt.",

    // Guidance
    cfgScale: "Classifier-Free Guidance sterkte. Hoger = meer prompt-adherent.",
    negativePrompt: "Negatieve prompt om van weg te sturen (bijv. 'wees niet vaag').",

    // Local
    loraPath: "Pad naar LoRA adapter bestand (.safetensors). Alleen lokale engines.",
    loraScale: "LoRA sterkte. 1.0 = volledig, <1 = zwakker effect.",
    quantizationLevel: "Model kwantisatie. FP16 = beste kwaliteit, Q4_K_M = kleinst.",
    promptTemplate: "Chat template formaat. Kies de juiste voor je model.",

    // Runtime
    flashAttention: "Flash Attention 2. Sneller & minder VRAM. Aan aanbevolen.",
    speculativeDecoding: "Speculative decoding met draft model. Tot 2-3x sneller.",
    dynamicTemperature: "Varieer temperatuur per token voor balans tussen coherentie en variatie.",
    threadCount: "CPU threads voor inferentie. Leeg = auto-detectie.",
};


interface IntelligenceEngineMatrixProps {
    settings: UserSettings;
    updateSettings: (settings: Partial<UserSettings>) => void;
}

export const IntelligenceEngineMatrix: React.FC<IntelligenceEngineMatrixProps> = ({
    settings,
    updateSettings,
}) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const tiers: { id: IntelligenceTier; label: string; sub: string; color: string }[] = [
        { id: "foundation", label: "De Fundering", sub: "Huidige Brain", color: "blue" },
        { id: "upgrade", label: "De Extensies", sub: "Elite Upgrade", color: "purple" },
        { id: "frontier", label: "De Frontier", sub: "God Mode", color: "rose" },
    ];

    const handleUpdateEngine = (id: string, config: Partial<IntelligenceEngineConfig>) => {
        const currentConfigs = settings.aiConfig.intelligencesConfig || {};
        const currentConfig = currentConfigs[id] || {
            modelId: "default",
            provider: "google",
            temperature: 0.7,
            topP: 1,
            maxTokens: 2048,
            active: true,
        };

        updateSettings({
            aiConfig: {
                ...settings.aiConfig,
                intelligencesConfig: {
                    ...currentConfigs,
                    [id]: { ...currentConfig, ...config },
                },
            },
        });
    };

    return (
        <div className="space-y-12 py-4">
            {tiers.map((tier) => (
                <div key={tier.id} className="space-y-6">
                    <div className="flex items-end gap-3 px-1">
                        <h3 className={`text-2xl font-black text-white leading-none uppercase tracking-tighter`}>
                            {tier.label}
                        </h3>
                        <span className={`text-[10px] font-mono font-bold text-${tier.color}-500/80 mb-0.5`}>
                            {tier.sub}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {ELITE_INTELLIGENCES.filter(i => i.tier === tier.id).map((intel, idx) => (
                            <EngineConfigCard
                                key={intel.id}
                                intel={intel}
                                tierColor={tier.color}
                                config={settings.aiConfig.intelligencesConfig?.[intel.id]}
                                isExpanded={expandedId === intel.id}
                                onToggleExpand={() => setExpandedId(expandedId === intel.id ? null : intel.id)}
                                onUpdate={(config) => handleUpdateEngine(intel.id, config)}
                                delay={idx * 0.05}
                                apiKey={settings.aiConfig.geminiApiKey}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

interface EngineConfigCardProps {
    intel: IntelligenceDefinition;
    tierColor: string;
    config?: IntelligenceEngineConfig;
    isExpanded: boolean;
    onToggleExpand: () => void;
    onUpdate: (config: Partial<IntelligenceEngineConfig>) => void;
    delay: number;
    apiKey?: string;
}

const ConfigSlider: React.FC<{
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (val: number) => void;
    color?: string;
    suffix?: string;
    tooltip?: string;
}> = ({ label, value, min, max, step, onChange, color = "blue", suffix = "", tooltip }) => (
    <div className="space-y-1.5 group/slider">
        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-1 flex justify-between items-center">
            <span className="flex items-center gap-1">
                {label}
                {tooltip && (
                    <span className="relative">
                        <HelpCircle size={10} className="text-slate-600 hover:text-slate-400 cursor-help" />
                        <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-[9px] text-slate-300 font-normal normal-case tracking-normal w-48 opacity-0 group-hover/slider:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                            {tooltip}
                        </span>
                    </span>
                )}
            </span>
            <span className={`text-[10px] font-mono font-bold text-${color}-400`}>{value.toFixed(step >= 1 ? 0 : 2)}{suffix}</span>
        </label>
        <div className="flex items-center gap-3 bg-black/40 border border-white/5 rounded-xl px-3 py-1.5">
            <input
                type="range"
                min={min} max={max} step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className={`flex-1 h-1 bg-white/10 rounded-full appearance-none accent-${color}-500 cursor-pointer`}
            />
        </div>
    </div>
);

type ExpertTab = "sampling" | "penalties" | "structure" | "search" | "memory" | "guidance" | "dry" | "local" | "runtime";

const EXPERT_TABS: { id: ExpertTab; label: string; color: string }[] = [
    { id: "sampling", label: "Sampling", color: "purple" },
    { id: "penalties", label: "Penalties", color: "rose" },
    { id: "structure", label: "Structure", color: "cyan" },
    { id: "search", label: "Search", color: "green" },
    { id: "memory", label: "Memory", color: "amber" },
    { id: "guidance", label: "Guidance", color: "pink" },
    { id: "dry", label: "DRY", color: "orange" },
    { id: "local", label: "Local", color: "lime" },
    { id: "runtime", label: "Runtime", color: "sky" },
];

const EngineConfigCard: React.FC<EngineConfigCardProps> = ({
    intel,
    tierColor,
    config,
    isExpanded,
    onToggleExpand,
    onUpdate,
    delay,
    apiKey,
}) => {
    const [expertMode, setExpertMode] = useState(true); // Default ON
    const [expertTab, setExpertTab] = useState<ExpertTab>("sampling");
    const active = config?.active !== false;

    // Check if provider is local (Ollama, LMStudio, KoboldCPP)
    const isLocalProvider = ["ollama", "lmstudio", "koboldcpp", "local", "jan"].includes(
        (config?.provider || "google").toLowerCase()
    );

    // Filter tabs - hide "local" if not using a local provider
    const visibleTabs = EXPERT_TABS.filter(tab =>
        tab.id !== "local" || isLocalProvider
    );

    const handleReset = () => {
        const defaults = getDefaultConfig(intel.id);
        onUpdate(defaults);
    };

    return (
        <EliteCard
            glowColor={active ? tierColor : "zinc"}
            delay={delay}
            className={`group transition-all duration-500 ${isExpanded ? "md:col-span-2 lg:col-span-2" : ""}`}
        >
            <div className="flex flex-col h-full">
                <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-xl bg-${tierColor}-500/10 text-${tierColor}-400 group-hover:scale-110 transition-all duration-500`}>
                        <intel.icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                            <h4 className="font-black text-white text-sm">
                                {intel.name}
                            </h4>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleReset(); }}
                                    title="Reset to Defaults"
                                    className="p-1 rounded-md bg-white/5 text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                                >
                                    <RotateCcw size={10} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onUpdate({ active: !active }); }}
                                    className={`w-8 h-4 rounded-full relative transition-all duration-300 ${active ? `bg-${tierColor}-500/40` : "bg-zinc-800"}`}
                                >
                                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all duration-300 ${active ? "left-4.5" : "left-0.5"}`} />
                                </button>
                            </div>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                            {intel.description}
                        </p>
                    </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                    <div className="flex gap-1">
                        {intel.techStack.slice(0, 2).map(tech => (
                            <span key={tech} className="text-[8px] font-mono text-slate-300 bg-white/5 px-2 py-0.5 rounded border border-white/5 uppercase tracking-tighter">
                                {tech}
                            </span>
                        ))}
                    </div>
                    <button
                        onClick={onToggleExpand}
                        className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-white transition-colors"
                    >
                        <Settings2 size={12} />
                        {isExpanded ? "Sluiten" : "Config"}
                    </button>
                </div>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-6 space-y-6">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between px-1">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            <Zap size={12} className="text-amber-500" /> Core Configuration
                                        </div>
                                        <button
                                            onClick={() => setExpertMode(!expertMode)}
                                            className={`text-[9px] font-black px-2 py-0.5 rounded border transition-all ${expertMode ? "bg-electric/20 border-electric/40 text-electric" : "bg-white/5 border-white/10 text-slate-500"}`}
                                        >
                                            {expertMode ? "EXPERT MODE: ON" : "EXPERT MODE: OFF"}
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <ModelSelector
                                            apiKey={apiKey || ""}
                                            value={config?.modelId || "default"}
                                            onChange={(val) => onUpdate({ modelId: val })}
                                            label="Intelligence Engine"
                                        />
                                        <ConfigSlider
                                            label="Temperature"
                                            value={config?.temperature || 0.7}
                                            min={0} max={1.5} step={0.1}
                                            onChange={(val) => onUpdate({ temperature: val })}
                                            color="blue"
                                            tooltip={PARAM_TOOLTIPS.temperature}
                                        />
                                    </div>

                                    {/* EXPERT MODE: TABBED NAVIGATION */}
                                    {expertMode && (
                                        <div className="flex flex-wrap gap-1.5 mb-4">
                                            {visibleTabs.map((tab) => (
                                                <button
                                                    key={tab.id}
                                                    onClick={() => setExpertTab(tab.id)}
                                                    className={`px-2 py-1 text-[8px] font-black uppercase tracking-wider rounded-lg border transition-all ${expertTab === tab.id
                                                        ? `bg-${tab.color}-500/20 border-${tab.color}-500/40 text-${tab.color}-400`
                                                        : "bg-white/5 border-white/10 text-slate-500 hover:text-white"
                                                        }`}
                                                >
                                                    {tab.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* EXPERT TAB: SAMPLING */}
                                    {expertMode && expertTab === "sampling" && (
                                        <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-4">
                                            <div className="text-[10px] font-black text-purple-400 uppercase tracking-widest border-b border-white/5 pb-2">
                                                Sampling Matrix
                                            </div>
                                            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                                <ConfigSlider label="Top-P (Nucleus)" value={config?.topP || 1.0} min={0} max={1} step={0.05} onChange={(val) => onUpdate({ topP: val })} color="purple" tooltip={PARAM_TOOLTIPS.topP} />
                                                <ConfigSlider label="Top-K" value={config?.topK || 40} min={0} max={100} step={1} onChange={(val) => onUpdate({ topK: val })} color="purple" tooltip={PARAM_TOOLTIPS.topK} />
                                                <ConfigSlider label="Min-P" value={config?.minP || 0.05} min={0} max={1} step={0.01} onChange={(val) => onUpdate({ minP: val })} color="indigo" tooltip={PARAM_TOOLTIPS.minP} />
                                                <ConfigSlider label="Typical-P" value={config?.typicalP || 1.0} min={0} max={1} step={0.05} onChange={(val) => onUpdate({ typicalP: val })} color="indigo" tooltip={PARAM_TOOLTIPS.typicalP} />
                                                <ConfigSlider label="TFS-Z (Tail Free)" value={config?.tfsZ || 1.0} min={0} max={2} step={0.1} onChange={(val) => onUpdate({ tfsZ: val })} color="violet" tooltip={PARAM_TOOLTIPS.tfsZ} />
                                                <ConfigSlider label="Top-A" value={config?.topA || 0} min={0} max={1} step={0.05} onChange={(val) => onUpdate({ topA: val })} color="violet" tooltip={PARAM_TOOLTIPS.topA} />
                                                <div className="space-y-1.5 text-center flex flex-col justify-center group/miro">
                                                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center justify-center gap-1">
                                                        Mirostat
                                                        <span className="relative">
                                                            <HelpCircle size={10} className="text-slate-600 hover:text-slate-400 cursor-help" />
                                                            <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-[9px] text-slate-300 font-normal normal-case tracking-normal w-48 opacity-0 group-hover/miro:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                                                                {PARAM_TOOLTIPS.mirostat}
                                                            </span>
                                                        </span>
                                                    </label>
                                                    <div className="flex gap-2 justify-center">
                                                        {[0, 1, 2].map((v) => (
                                                            <button key={v} onClick={() => onUpdate({ mirostat: v })} className={`w-8 h-8 rounded-lg font-mono text-xs border transition-all ${config?.mirostat === v ? "bg-amber-500/20 border-amber-500/40 text-amber-400" : "bg-white/5 border-white/10 text-slate-500"}`}>{v}</button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <ConfigSlider label="Mirostat Tau" value={config?.mirostatTau || 5.0} min={0} max={10} step={0.5} onChange={(val) => onUpdate({ mirostatTau: val })} color="amber" tooltip={PARAM_TOOLTIPS.mirostatTau} />
                                            </div>
                                        </div>
                                    )}

                                    {/* EXPERT TAB: PENALTIES */}
                                    {expertMode && expertTab === "penalties" && (
                                        <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-4">
                                            <div className="text-[10px] font-black text-rose-400 uppercase tracking-widest border-b border-white/5 pb-2">
                                                Penalty Overrides
                                            </div>
                                            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                                <ConfigSlider label="Frequency Penalty" value={config?.frequencyPenalty || 0.0} min={0} max={2} step={0.1} onChange={(val) => onUpdate({ frequencyPenalty: val })} color="rose" tooltip={PARAM_TOOLTIPS.frequencyPenalty} />
                                                <ConfigSlider label="Presence Penalty" value={config?.presencePenalty || 0.0} min={0} max={2} step={0.1} onChange={(val) => onUpdate({ presencePenalty: val })} color="rose" tooltip={PARAM_TOOLTIPS.presencePenalty} />
                                                <ConfigSlider label="Repetition Penalty" value={config?.repetitionPenalty || 1.1} min={1} max={2} step={0.1} onChange={(val) => onUpdate({ repetitionPenalty: val })} color="orange" tooltip={PARAM_TOOLTIPS.repetitionPenalty} />
                                                <ConfigSlider label="No Repeat N-Gram" value={config?.noRepeatNGramSize || 0} min={0} max={16} step={1} onChange={(val) => onUpdate({ noRepeatNGramSize: val })} color="orange" tooltip={PARAM_TOOLTIPS.noRepeatNGramSize} />
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-1">Max Tokens</label>
                                                    <div className="flex items-center gap-2 bg-black/40 border border-white/5 rounded-xl px-3 py-1.5">
                                                        <input type="number" value={config?.maxTokens || 4096} onChange={(e) => onUpdate({ maxTokens: parseInt(e.target.value) })} className="bg-transparent text-[10px] font-mono text-white outline-none w-full" />
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-1">Seed (Determinism)</label>
                                                    <div className="flex items-center gap-2 bg-black/40 border border-white/5 rounded-xl px-3 py-1.5">
                                                        <input type="number" value={config?.seed ?? ""} placeholder="Random" onChange={(e) => onUpdate({ seed: e.target.value ? parseInt(e.target.value) : undefined })} className="bg-transparent text-[10px] font-mono text-white outline-none w-full placeholder:text-slate-600" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* EXPERT TAB: STRUCTURE */}
                                    {expertMode && expertTab === "structure" && (
                                        <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-4">
                                            <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest border-b border-white/5 pb-2">
                                                Structural Constraints (Guided Generation)
                                            </div>
                                            <div className="grid grid-cols-1 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-1">Grammar (GBNF)</label>
                                                    <textarea value={config?.grammarGBNF || ""} onChange={(e) => onUpdate({ grammarGBNF: e.target.value })} placeholder="Enter GBNF grammar for structured output..." className="w-full h-20 bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-[10px] font-mono text-white outline-none placeholder:text-slate-600 resize-none" />
                                                </div>
                                                <div className="flex items-center justify-between bg-black/40 border border-white/5 rounded-xl px-3 py-2 group/json">
                                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                                        Json Mode Forced
                                                        <span className="relative">
                                                            <HelpCircle size={10} className="text-slate-600 hover:text-slate-400 cursor-help" />
                                                            <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-[9px] text-slate-300 font-normal normal-case tracking-normal w-48 opacity-0 group-hover/json:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                                                                {PARAM_TOOLTIPS.jsonModeForced}
                                                            </span>
                                                        </span>
                                                    </span>
                                                    <button onClick={() => onUpdate({ jsonModeForced: !config?.jsonModeForced })} className={`w-10 h-5 rounded-full relative transition-all ${config?.jsonModeForced ? "bg-blue-500/40" : "bg-zinc-800"}`}>
                                                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${config?.jsonModeForced ? "left-5.5" : "left-0.5"}`} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* EXPERT TAB: SEARCH */}
                                    {expertMode && expertTab === "search" && (
                                        <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-4">
                                            <div className="text-[10px] font-black text-green-400 uppercase tracking-widest border-b border-white/5 pb-2">
                                                Advanced Search Strategies
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="flex items-center justify-between bg-black/40 border border-white/5 rounded-xl px-3 py-2 group/beam">
                                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                                        Beam Search
                                                        <span className="relative">
                                                            <HelpCircle size={10} className="text-slate-600 hover:text-slate-400 cursor-help" />
                                                            <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-[9px] text-slate-300 font-normal normal-case tracking-normal w-48 opacity-0 group-hover/beam:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                                                                {PARAM_TOOLTIPS.beamSearch}
                                                            </span>
                                                        </span>
                                                    </span>
                                                    <button onClick={() => onUpdate({ beamSearch: !config?.beamSearch })} className={`w-10 h-5 rounded-full relative transition-all ${config?.beamSearch ? "bg-green-500/40" : "bg-zinc-800"}`}>
                                                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${config?.beamSearch ? "left-5.5" : "left-0.5"}`} />
                                                    </button>
                                                </div>
                                                <ConfigSlider label="Num Beams" value={config?.numBeams || 1} min={1} max={8} step={1} onChange={(val) => onUpdate({ numBeams: val })} color="green" tooltip={PARAM_TOOLTIPS.numBeams} />
                                                <div className="flex items-center justify-between bg-black/40 border border-white/5 rounded-xl px-3 py-2 col-span-2 group/contra">
                                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                                        Contrastive Search
                                                        <span className="relative">
                                                            <HelpCircle size={10} className="text-slate-600 hover:text-slate-400 cursor-help" />
                                                            <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-[9px] text-slate-300 font-normal normal-case tracking-normal w-48 opacity-0 group-hover/contra:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                                                                {PARAM_TOOLTIPS.contrastiveSearch}
                                                            </span>
                                                        </span>
                                                    </span>
                                                    <button onClick={() => onUpdate({ contrastiveSearch: !config?.contrastiveSearch })} className={`w-10 h-5 rounded-full relative transition-all ${config?.contrastiveSearch ? "bg-green-500/40" : "bg-zinc-800"}`}>
                                                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${config?.contrastiveSearch ? "left-5.5" : "left-0.5"}`} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* EXPERT TAB: MEMORY */}
                                    {expertMode && expertTab === "memory" && (
                                        <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-4">
                                            <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest border-b border-white/5 pb-2">
                                                Context & Memory Management
                                            </div>
                                            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                                <ConfigSlider label="Context Size (numCtx)" value={config?.numCtx || 4096} min={512} max={131072} step={512} onChange={(val) => onUpdate({ numCtx: val })} color="amber" tooltip={PARAM_TOOLTIPS.numCtx} />
                                                <ConfigSlider label="KV Cache Quant (bits)" value={config?.kvCacheQuantization || 16} min={4} max={16} step={4} onChange={(val) => onUpdate({ kvCacheQuantization: val })} color="amber" tooltip={PARAM_TOOLTIPS.kvCacheQuantization} />
                                                <ConfigSlider label="RoPE Freq Base" value={config?.ropeFrequencyBase || 10000} min={1000} max={1000000} step={1000} onChange={(val) => onUpdate({ ropeFrequencyBase: val })} color="yellow" tooltip={PARAM_TOOLTIPS.ropeFrequencyBase} />
                                                <ConfigSlider label="RoPE Freq Scale" value={config?.ropeFrequencyScale || 1.0} min={0.1} max={4} step={0.1} onChange={(val) => onUpdate({ ropeFrequencyScale: val })} color="yellow" tooltip={PARAM_TOOLTIPS.ropeFrequencyScale} />
                                            </div>
                                        </div>
                                    )}

                                    {/* EXPERT TAB: GUIDANCE */}
                                    {expertMode && expertTab === "guidance" && (
                                        <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-4">
                                            <div className="text-[10px] font-black text-pink-400 uppercase tracking-widest border-b border-white/5 pb-2">
                                                Guidance & Control (CFG)
                                            </div>
                                            <div className="grid grid-cols-1 gap-4">
                                                <ConfigSlider label="CFG Scale" value={config?.cfgScale || 1.0} min={1} max={20} step={0.5} onChange={(val) => onUpdate({ cfgScale: val })} color="pink" tooltip={PARAM_TOOLTIPS.cfgScale} />
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-1">Negative Prompt</label>
                                                    <textarea value={config?.negativePrompt || ""} onChange={(e) => onUpdate({ negativePrompt: e.target.value })} placeholder="Enter negative prompt to guide away from..." className="w-full h-16 bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-[10px] font-mono text-white outline-none placeholder:text-slate-600 resize-none" />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* EXPERT TAB: DRY */}
                                    {expertMode && expertTab === "dry" && (
                                        <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-4">
                                            <div className="text-[10px] font-black text-orange-400 uppercase tracking-widest border-b border-white/5 pb-2">
                                                DRY Sampling (Anti-Repetition)
                                            </div>
                                            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                                <ConfigSlider label="DRY Multiplier" value={config?.dryMultiplier || 0} min={0} max={3} step={0.1} onChange={(val) => onUpdate({ dryMultiplier: val })} color="orange" tooltip={PARAM_TOOLTIPS.dryMultiplier} />
                                                <ConfigSlider label="DRY Base" value={config?.dryBase || 1.75} min={1} max={3} step={0.05} onChange={(val) => onUpdate({ dryBase: val })} color="orange" tooltip={PARAM_TOOLTIPS.dryBase} />
                                                <ConfigSlider label="DRY Allowed Length" value={config?.dryAllowedLength || 2} min={0} max={10} step={1} onChange={(val) => onUpdate({ dryAllowedLength: val })} color="orange" tooltip={PARAM_TOOLTIPS.dryAllowedLength} />
                                                <ConfigSlider label="Rep Penalty Range" value={config?.repetitionPenaltyRange || 1024} min={0} max={8192} step={128} onChange={(val) => onUpdate({ repetitionPenaltyRange: val })} color="orange" tooltip={PARAM_TOOLTIPS.repetitionPenaltyRange} />
                                            </div>
                                        </div>
                                    )}

                                    {/* EXPERT TAB: LOCAL */}
                                    {expertMode && expertTab === "local" && (
                                        <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-4">
                                            <div className="text-[10px] font-black text-lime-400 uppercase tracking-widest border-b border-white/5 pb-2">
                                                Model Modifications (Local Only)
                                            </div>
                                            <p className="text-[9px] text-slate-500 italic">⚠️ These settings only apply to local inference engines (Ollama, LMStudio, KoboldCPP).</p>
                                            <div className="grid grid-cols-1 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-1">LoRA Path</label>
                                                    <input type="text" value={config?.loraPath || ""} onChange={(e) => onUpdate({ loraPath: e.target.value })} placeholder="/path/to/lora.safetensors" className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-[10px] font-mono text-white outline-none placeholder:text-slate-600" />
                                                </div>
                                                <ConfigSlider label="LoRA Scale" value={config?.loraScale || 1.0} min={0} max={2} step={0.1} onChange={(val) => onUpdate({ loraScale: val })} color="lime" tooltip={PARAM_TOOLTIPS.loraScale} />
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-1">Quantization Level</label>
                                                    <select value={config?.quantizationLevel || ""} onChange={(e) => onUpdate({ quantizationLevel: e.target.value })} className="w-full bg-black/60 border border-white/5 rounded-xl px-3 py-2 text-[10px] font-mono text-white outline-none">
                                                        <option value="">Auto</option>
                                                        <option value="FP16">FP16</option>
                                                        <option value="Q8_0">Q8_0</option>
                                                        <option value="Q6_K">Q6_K</option>
                                                        <option value="Q5_K_M">Q5_K_M</option>
                                                        <option value="Q4_K_M">Q4_K_M</option>
                                                        <option value="Q3_K_M">Q3_K_M</option>
                                                        <option value="Q2_K">Q2_K</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-1">Prompt Template</label>
                                                    <select value={config?.promptTemplate || ""} onChange={(e) => onUpdate({ promptTemplate: e.target.value })} className="w-full bg-black/60 border border-white/5 rounded-xl px-3 py-2 text-[10px] font-mono text-white outline-none">
                                                        <option value="">Auto</option>
                                                        <option value="chatml">ChatML</option>
                                                        <option value="llama3">Llama 3</option>
                                                        <option value="alpaca">Alpaca</option>
                                                        <option value="vicuna">Vicuna</option>
                                                        <option value="mistral">Mistral</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* EXPERT TAB: RUNTIME */}
                                    {expertMode && expertTab === "runtime" && (
                                        <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-4">
                                            <div className="text-[10px] font-black text-sky-400 uppercase tracking-widest border-b border-white/5 pb-2">
                                                Performance & Runtime
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="flex items-center justify-between bg-black/40 border border-white/5 rounded-xl px-3 py-2 group/flash">
                                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                                        Flash Attention
                                                        <span className="relative">
                                                            <HelpCircle size={10} className="text-slate-600 hover:text-slate-400 cursor-help" />
                                                            <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-[9px] text-slate-300 font-normal normal-case tracking-normal w-48 opacity-0 group-hover/flash:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                                                                {PARAM_TOOLTIPS.flashAttention}
                                                            </span>
                                                        </span>
                                                    </span>
                                                    <button onClick={() => onUpdate({ flashAttention: !config?.flashAttention })} className={`w-10 h-5 rounded-full relative transition-all ${config?.flashAttention ? "bg-cyan-500/40" : "bg-zinc-800"}`}>
                                                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${config?.flashAttention ? "left-5.5" : "left-0.5"}`} />
                                                    </button>
                                                </div>
                                                <div className="flex items-center justify-between bg-black/40 border border-white/5 rounded-xl px-3 py-2 group/spec">
                                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                                        Speculative Decoding
                                                        <span className="relative">
                                                            <HelpCircle size={10} className="text-slate-600 hover:text-slate-400 cursor-help" />
                                                            <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-[9px] text-slate-300 font-normal normal-case tracking-normal w-48 opacity-0 group-hover/spec:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                                                                {PARAM_TOOLTIPS.speculativeDecoding}
                                                            </span>
                                                        </span>
                                                    </span>
                                                    <button onClick={() => onUpdate({ speculativeDecoding: !config?.speculativeDecoding })} className={`w-10 h-5 rounded-full relative transition-all ${config?.speculativeDecoding ? "bg-cyan-500/40" : "bg-zinc-800"}`}>
                                                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${config?.speculativeDecoding ? "left-5.5" : "left-0.5"}`} />
                                                    </button>
                                                </div>
                                                <div className="flex items-center justify-between bg-black/40 border border-white/5 rounded-xl px-3 py-2 group/dynamic">
                                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                                        Dynamic Temperature
                                                        <span className="relative">
                                                            <HelpCircle size={10} className="text-slate-600 hover:text-slate-400 cursor-help" />
                                                            <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-[9px] text-slate-300 font-normal normal-case tracking-normal w-48 opacity-0 group-hover/dynamic:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                                                                {PARAM_TOOLTIPS.dynamicTemperature}
                                                            </span>
                                                        </span>
                                                    </span>
                                                    <button onClick={() => onUpdate({ dynamicTemperature: !config?.dynamicTemperature })} className={`w-10 h-5 rounded-full relative transition-all ${config?.dynamicTemperature ? "bg-cyan-500/40" : "bg-zinc-800"}`}>
                                                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${config?.dynamicTemperature ? "left-5.5" : "left-0.5"}`} />
                                                    </button>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-1">Thread Count</label>
                                                    <div className="flex items-center gap-2 bg-black/40 border border-white/5 rounded-xl px-3 py-1.5">
                                                        <input type="number" value={config?.threadCount ?? ""} placeholder="Auto" onChange={(e) => onUpdate({ threadCount: e.target.value ? parseInt(e.target.value) : undefined })} className="bg-transparent text-[10px] font-mono text-white outline-none w-full placeholder:text-slate-600" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* ADAPTIVE FOOTER */}
                                    {!expertMode && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-1">Top P</label>
                                                <div className="flex items-center gap-3 bg-black/20 rounded-xl px-3 py-1.5">
                                                    <input
                                                        type="range"
                                                        min="0" max="1" step="0.1"
                                                        value={config?.topP || 1.0}
                                                        onChange={(e) => onUpdate({ topP: parseFloat(e.target.value) })}
                                                        className="flex-1 h-0.5 bg-white/10 rounded-full appearance-none accent-purple-500 cursor-pointer"
                                                    />
                                                    <span className="text-[10px] font-mono text-purple-400 w-6">{(config?.topP || 1.0).toFixed(1)}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-1">Context Window</label>
                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-black/20 rounded-xl">
                                                    <Cpu size={12} className="text-slate-500" />
                                                    <span className="text-[10px] font-mono text-slate-500 uppercase">32k tokens</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-2 flex justify-between items-center border-t border-white/5">
                                        <div className="flex items-center gap-1.5">
                                            <Target size={12} className="text-slate-500" />
                                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{intel.useCase}</span>
                                        </div>
                                        <button className="p-1.5 rounded-lg bg-white/5 text-slate-500 hover:text-white transition-colors">
                                            <RefreshCcw size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </EliteCard>
    );
};
