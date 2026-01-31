import {
    Activity, Brain, Cpu, Globe, HelpCircle, Info, Loader2, Mars, MessageSquare, Mic, Monitor, Play, RefreshCw, Sparkles, Trash2, Venus, Wifi, WifiOff, LucideIcon
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";

import { GEMINI_LIVE_VOICES, previewGeminiVoice } from "@shared/api/gemini";
import { useTranslations } from "@shared/hooks/useTranslations";
import { filterModelsForIntelligence } from "@shared/lib/modelClassifier";
import { ModelInfo } from "@shared/types/config";

import { ApiKeyInput } from "../ApiKeyInput";
import { ModelSelectorCard } from "../ModelSelectorCard";

// --- Sub-components ---

interface IntelligenceGridProps {
    provider: string;
    models: string[] | ModelInfo[];
    isLoading: boolean;
    error?: string | null;
    onRefresh: () => void;
    getModel: (type: string) => string;
    setModel: (type: string, model: string) => void;
    hasApiKey: boolean;
}

export const IntelligenceGrid: React.FC<IntelligenceGridProps> = React.memo(({
    provider,
    models,
    isLoading,
    error,
    onRefresh,
    getModel,
    setModel,
    hasApiKey,
}) => {
    const { t } = useTranslations();
    const chatModels = useMemo(() => filterModelsForIntelligence(models, "chat"), [models]);
    const reasoningModels = useMemo(() => filterModelsForIntelligence(models, "reasoning"), [models]);
    const visionModels = useMemo(() => filterModelsForIntelligence(models, "vision"), [models]);
    const liveModels = useMemo(() => filterModelsForIntelligence(models, "live"), [models]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-white/5">
            {chatModels.length > 0 && (
                <ModelSelectorCard
                    label={t.api.labels.chat}
                    provider={provider}
                    type="chat"
                    models={chatModels}
                    isLoading={isLoading}
                    error={error}
                    onRefresh={onRefresh}
                    icon={MessageSquare}
                    currentModel={getModel("chat")}
                    onSelect={(m) => setModel("chat", m)}
                    hasApiKey={hasApiKey}
                />
            )}
            {reasoningModels.length > 0 && (
                <ModelSelectorCard
                    label={t.api.labels.reasoning}
                    provider={provider}
                    type="reasoning"
                    models={reasoningModels}
                    isLoading={isLoading}
                    error={error}
                    onRefresh={onRefresh}
                    icon={Brain}
                    currentModel={getModel("reasoning")}
                    onSelect={(m) => setModel("reasoning", m)}
                    hasApiKey={hasApiKey}
                />
            )}
            {visionModels.length > 0 && (
                <ModelSelectorCard
                    label={t.api.labels.vision}
                    provider={provider}
                    type="vision"
                    models={visionModels}
                    isLoading={isLoading}
                    error={error}
                    onRefresh={onRefresh}
                    icon={Monitor}
                    currentModel={getModel("vision")}
                    onSelect={(m) => setModel("vision", m)}
                    hasApiKey={hasApiKey}
                />
            )}
            {liveModels.length > 0 && (
                <ModelSelectorCard
                    label={t.api.labels.live}
                    provider={provider}
                    type="live"
                    models={liveModels}
                    isLoading={isLoading}
                    error={error}
                    onRefresh={onRefresh}
                    icon={Mic}
                    currentModel={getModel("live")}
                    onSelect={(m) => setModel("live", m)}
                    hasApiKey={hasApiKey}
                />
            )}

            {provider === "replicate" && (
                <ModelSelectorCard
                    label="3D Generation"
                    provider={provider}
                    type="threed"
                    models={models}
                    isLoading={isLoading}
                    error={error}
                    onRefresh={onRefresh}
                    icon={Globe}
                    currentModel={getModel("threed")}
                    onSelect={(m) => setModel("threed", m)}
                    hasApiKey={hasApiKey}
                />
            )}

            {provider === "hume" && (
                <ModelSelectorCard
                    label="Emotion Model"
                    provider={provider}
                    type="emotion"
                    models={models}
                    isLoading={isLoading}
                    error={error}
                    onRefresh={onRefresh}
                    icon={Sparkles}
                    currentModel={getModel("emotion")}
                    onSelect={(m) => setModel("emotion", m)}
                    hasApiKey={hasApiKey}
                />
            )}
        </div>
    );
});

interface VoiceCardProps {
    name: string;
    isSelected: boolean;
    onSelect: () => void;
    apiKey: string;
    model: string;
}

export const VoiceCard: React.FC<VoiceCardProps> = ({ name, isSelected, onSelect, apiKey, model }) => {
    const [isPreviewing, setIsPreviewing] = useState(false);

    const handlePreview = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isPreviewing) return;

        try {
            setIsPreviewing(true);
            await previewGeminiVoice(name, apiKey, model);
        } catch (err) {
            console.error("Preview failed", err);
        } finally {
            setIsPreviewing(false);
        }
    };

    return (
        <button
            onClick={onSelect}
            className={`group relative flex items-center justify-between gap-2 p-2.5 rounded-lg border transition-all duration-200 ${isSelected
                ? "bg-electric/20 border-electric text-white shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                : "bg-obsidian-900 border-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200"
                }`}
        >
            <span className="text-xs font-bold tracking-wide truncate">{name}</span>
            <div
                onClick={handlePreview}
                className={`p-1.5 rounded-md transition-all flex items-center justify-center ${isPreviewing
                    ? "bg-electric text-white"
                    : isSelected
                        ? "bg-electric/20 text-electric hover:bg-electric hover:text-white"
                        : "bg-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-300"
                    }`}
                title="Luister naar sample"
            >
                {isPreviewing ? (
                    <Loader2 size={12} className="animate-spin" />
                ) : (
                    <Play size={12} fill={isSelected ? "currentColor" : "none"} />
                )}
            </div>
            {isSelected && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-electric rounded-full shadow-[0_0_8px_#3b82f6]" />
            )}
        </button>
    );
};

export const GeminiVoiceSelector: React.FC<{
    currentVoice: string;
    onSelect: (name: string) => void;
    apiKey: string;
    model: string;
}> = ({ currentVoice, onSelect, apiKey, model }) => {
    const maleVoices = useMemo(() => GEMINI_LIVE_VOICES.filter(v => v.gender === "male"), []);
    const femaleVoices = useMemo(() => GEMINI_LIVE_VOICES.filter(v => v.gender === "female"), []);

    return (
        <div className="bg-obsidian-950/50 rounded-xl p-6 border border-white/5 animate-in fade-in slide-in-from-top-2 space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <label className="text-xs text-slate-500 uppercase tracking-wider font-bold flex items-center gap-2">
                    <Mic size={14} className="text-electric" />
                    Gemini Live Voice Persona
                </label>
                <span className="text-[10px] text-slate-500 font-medium bg-white/5 px-2 py-1 rounded-full border border-white/5">
                    {GEMINI_LIVE_VOICES.length} HD Voices
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-rose-400/80 text-xs font-bold uppercase tracking-widest pl-1">
                        <Venus size={14} />
                        Vrouwelijke Stemmen
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {femaleVoices.map((v) => (
                            <VoiceCard
                                key={v.name}
                                name={v.name}
                                isSelected={currentVoice === v.name}
                                onSelect={() => onSelect(v.name)}
                                apiKey={apiKey}
                                model={model}
                            />
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-blue-400/80 text-xs font-bold uppercase tracking-widest pl-1">
                        <Mars size={14} />
                        Mannelijke Stemmen
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {maleVoices.map((v) => (
                            <VoiceCard
                                key={v.name}
                                name={v.name}
                                isSelected={currentVoice === v.name}
                                onSelect={() => onSelect(v.name)}
                                apiKey={apiKey}
                                model={model}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

interface LocalNodeDiagnosticProps {
    name: string;
    baseUrl: string;
    isOnline: boolean;
    onRefresh: () => void;
    isLoading: boolean;
    error?: string | null;
}

export const LocalNodeDiagnostic: React.FC<LocalNodeDiagnosticProps> = ({
    name,
    baseUrl,
    isOnline,
    onRefresh,
    isLoading,
    error: _error,
}) => {
    const [showHelp, setShowHelp] = useState(false);

    return (
        <div className="bg-obsidian-900/50 border border-white/5 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isOnline ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                        {isOnline ? <Wifi size={18} /> : <WifiOff size={18} />}
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            Status: {isOnline ? "Online" : "Offline"}
                            {isOnline && (
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                            )}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-mono">{baseUrl}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowHelp(!showHelp)}
                        className={`p-2 rounded-lg transition-colors ${showHelp ? "bg-electric/20 text-electric" : "text-slate-500 hover:text-white hover:bg-white/5"}`}
                        title="Setup Hulp"
                    >
                        <HelpCircle size={18} />
                    </button>
                    <button
                        onClick={onRefresh}
                        disabled={isLoading}
                        className={`p-2 rounded-lg transition-colors ${isLoading ? "text-slate-600" : "text-electric hover:bg-electric/10"}`}
                    >
                        <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {showHelp && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="bg-electric/5 border border-electric/10 rounded-lg p-4 space-y-3 overflow-hidden"
                >
                    <p className="text-xs font-bold text-electric flex items-center gap-1.5 uppercase tracking-wider">
                        <Info size={12} /> Hoe verbind ik {name}?
                    </p>
                    <ol className="text-[11px] text-slate-300 space-y-2 list-decimal list-inside marker:text-electric marker:font-bold">
                        <li>Start de <strong>{name}</strong> applicatie op je computer.</li>
                        <li>Zoek naar de <strong>Local Server</strong> of <strong>Developer</strong> tab.</li>
                        <li>Klik op <strong>"Start Server"</strong>.</li>
                        <li>Zorg dat er minimaal één model is <strong>gedownload</strong> en geladen.</li>
                        <li>Klik hierboven op het <strong>ververs-icoontje</strong>.</li>
                    </ol>
                </motion.div>
            )}

            {!isOnline && !showHelp && (
                <div className="flex items-center gap-2 text-[11px] text-rose-400 bg-rose-500/5 px-3 py-2 rounded-lg border border-rose-500/10">
                    <Activity size={12} />
                    <span>Kon geen verbinding maken. Staat {name} wel aan?</span>
                </div>
            )}
        </div>
    );
};

interface ProviderSettingsProps {
    title: string;
    icon?: LucideIcon;
    providerId: string;
    baseUrl?: string;
    apiKey: string;
    setApiKey: (key: string) => void;
    models: string[] | ModelInfo[];
    isLoading: boolean;
    error?: string | null;
    onRefresh: () => void;
    getModel: (type: string) => string;
    setModel: (type: string, model: string) => void;
    showKey: boolean;
    toggleShowKey: () => void;
    onDelete?: () => void;
    apiKeyLink?: string;
    apiKeyPlaceholder?: string;
}

export const ProviderSettings: React.FC<ProviderSettingsProps> = React.memo(({
    title,
    icon: Icon,
    providerId,
    baseUrl,
    apiKey,
    setApiKey,
    models,
    isLoading,
    error,
    onRefresh,
    getModel,
    setModel,
    showKey,
    toggleShowKey,
    onDelete,
    apiKeyLink,
    apiKeyPlaceholder,
}) => {
    const isCustom = !!onDelete;
    const isLocal = baseUrl?.includes("localhost") || baseUrl?.includes("127.0.0.1") || providerId.includes("local");
    const isOnline = models.length > 0;

    return (
        <div className={`bg-obsidian-950 rounded-xl p-6 border transition-all duration-300 ${isOnline ? "border-emerald-500/20" : "border-white/10"} space-y-6`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isLocal ? "bg-purple-500/10 text-purple-400" : "bg-electric/10 text-electric"}`}>
                        {Icon ? <Icon size={20} /> : isLocal ? <Cpu size={20} /> : <Globe size={20} />}
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-lg">{title}</span>
                            {isLocal && (
                                <span className="px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-[9px] font-black uppercase tracking-tighter text-purple-400">
                                    Local Node
                                </span>
                            )}
                        </div>
                        {baseUrl && !isLocal && (
                            <span className="text-xs text-slate-500 truncate max-w-[200px] font-mono">
                                {baseUrl}
                            </span>
                        )}
                    </div>
                </div>

                {isCustom && onDelete && (
                    <button
                        onClick={onDelete}
                        className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 transition-all"
                        title="Verwijder Provider"
                    >
                        <Trash2 size={18} />
                    </button>
                )}
            </div>

            {isLocal && apiKey === "none" ? (
                <LocalNodeDiagnostic
                    name={title}
                    baseUrl={baseUrl || ""}
                    isOnline={isOnline}
                    onRefresh={onRefresh}
                    isLoading={isLoading}
                    error={error}
                />
            ) : (
                <ApiKeyInput
                    label={isLocal ? `${title} Key (Optioneel)` : `${title} Key`}
                    link={isLocal ? "" : (apiKeyLink || "")}
                    value={apiKey === "none" ? "" : apiKey}
                    onChange={setApiKey}
                    placeholder={apiKeyPlaceholder || "sk-..."}
                    showKey={showKey}
                    onToggleShow={toggleShowKey}
                />
            )}

            {(apiKey || (isLocal && apiKey === "none")) && (
                <IntelligenceGrid
                    provider={providerId}
                    models={models}
                    isLoading={isLoading}
                    error={error}
                    onRefresh={onRefresh}
                    getModel={getModel}
                    setModel={setModel}
                    hasApiKey={apiKey !== "none" ? !!apiKey : true}
                />
            )}
        </div>
    );
});
