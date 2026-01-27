import { checkProviderHealth } from "@shared/api/healthChecks";
import type { UserSettings } from "@shared/types/config";
import {
    AlertCircle,
    CheckCircle2,
    ExternalLink,
    Eye,
    EyeOff,
    Key,
    Lock,
    RefreshCcw,
    ShieldCheck,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

import { EliteCard } from "../../components/EliteCard";

interface APIKeyVaultProps {
    settings: UserSettings;
    updateSettings: (settings: Partial<UserSettings>) => void;
}

interface VaultItem {
    id: string;
    name: string;
    configKey: keyof UserSettings["aiConfig"];
    icon: string;
    description: string;
    setupUrl: string;
}

const VAULT_ITEMS: VaultItem[] = [
    { id: "gemini", name: "Google Gemini", configKey: "geminiApiKey", icon: "https://simpleicons.org/icons/googlegemini.svg", description: "Primary intelligence engine (Flash & Pro).", setupUrl: "https://aistudio.google.com/app/apikey" },
    { id: "openai", name: "OpenAI (v2)", configKey: "openaiApiKey", icon: "https://simpleicons.org/icons/openai.svg", description: "Used for Whisper (STT) and legacy bridging.", setupUrl: "https://platform.openai.com/api-keys" },
    { id: "elevenlabs", name: "ElevenLabs", configKey: "elevenLabsApiKey", icon: "https://simpleicons.org/icons/elevenlabs.svg", description: "Premium neural text-to-speech engine.", setupUrl: "https://elevenlabs.io/app/settings/api-keys" },
    { id: "groq", name: "Groq LPU", configKey: "groqApiKey", icon: "https://simpleicons.org/icons/groq.svg", description: "Ultra-fast inference for Llama & Mixtral.", setupUrl: "https://console.groq.com/keys" },
    { id: "replicate", name: "Replicate", configKey: "replicateApiKey", icon: "https://simpleicons.org/icons/replicate.svg", description: "Spatial (3D) and Diffusion generation.", setupUrl: "https://replicate.com/account/api-tokens" },
    { id: "cohere", name: "Cohere", configKey: "cohereApiKey", icon: "https://simpleicons.org/icons/cohere.svg", description: "Reranking for precision academic search.", setupUrl: "https://dashboard.cohere.com/api-keys" },
    { id: "hume", name: "Hume AI", configKey: "humeApiKey", icon: "https://hume.ai/favicon.ico", description: "Emotional and affective prosody analysis.", setupUrl: "https://beta.hume.ai/settings/keys" },
];

export const APIKeyVault: React.FC<APIKeyVaultProps> = ({
    settings,
    updateSettings,
}) => {
    const [testingId, setTestingId] = useState<string | null>(null);
    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

    const handleKeyUpdate = (configKey: keyof UserSettings["aiConfig"], value: string) => {
        updateSettings({
            aiConfig: {
                ...settings.aiConfig,
                [configKey]: value,
                apiVault: {
                    ...(settings.aiConfig.apiVault || {}),
                    [configKey]: {
                        key: value,
                        status: value ? "active" : "revoked",
                        label: VAULT_ITEMS.find(i => i.configKey === configKey)?.name || String(configKey)
                    }
                }
            }
        });
    };

    const testConnection = async (id: string, key: string) => {
        setTestingId(id);
        try {
            const isHealthy = await checkProviderHealth(id, key);
            if (isHealthy) {
                toast.success(`${id.charAt(0).toUpperCase() + id.slice(1)} node online and validated.`);
            } else {
                toast.error(`${id.charAt(0).toUpperCase() + id.slice(1)} verification failed. Check your API key or network.`);
            }
        } catch (e) {
            toast.error(`Connection to ${id} failed: ${e instanceof Error ? e.message : "Network Error"}`);
        } finally {
            setTestingId(null);
        }
    };

    const toggleShow = (id: string) => {
        setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <header className="flex items-center justify-between px-2">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-3">
                        <Lock className="text-amber-500" /> API Neural Vault
                    </h2>
                    <p className="text-xs text-slate-500 uppercase tracking-[0.2em] font-mono mt-1">
                        Encrypted local storage enabled
                    </p>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                    <ShieldCheck size={16} className="text-emerald-400" />
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Vault Active</span>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {VAULT_ITEMS.map((item) => {
                    const currentKey = (settings.aiConfig[item.configKey] as string) || "";
                    const isTesting = testingId === item.id;
                    const isVisible = showKeys[item.id];

                    return (
                        <EliteCard key={item.id} glowColor={currentKey ? "emerald" : "zinc"}>
                            <div className="flex flex-col h-full">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-black/40 border border-white/10 p-2.5 flex items-center justify-center overflow-hidden">
                                            <img src={item.icon} alt={item.id} className="w-full h-full object-contain filter invert opacity-80" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white mb-0.5">{item.name}</h4>
                                            <p className="text-[10px] text-slate-500 font-medium leading-tight max-w-[200px]">{item.description}</p>
                                        </div>
                                    </div>
                                    <a
                                        href={item.setupUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 rounded-xl bg-white/5 text-slate-500 hover:text-white transition-colors"
                                    >
                                        <ExternalLink size={14} />
                                    </a>
                                </div>

                                <div className="relative group/input mb-4">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 transition-colors group-focus-within/input:text-emerald-400">
                                        <Key size={14} />
                                    </div>
                                    <input
                                        type={isVisible ? "text" : "password"}
                                        value={currentKey}
                                        onChange={(e) => handleKeyUpdate(item.configKey, e.target.value)}
                                        placeholder={`Enter ${item.name} key...`}
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 pl-12 pr-12 text-xs text-white font-mono placeholder:text-slate-700 focus:border-emerald-500/30 focus:bg-black/60 outline-none transition-all shadow-inner"
                                    />
                                    <button
                                        onClick={() => toggleShow(item.id)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors"
                                    >
                                        {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <div className="flex items-center gap-2">
                                        {currentKey ? (
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold uppercase tracking-tighter">
                                                <CheckCircle2 size={10} /> Validated
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 text-slate-500 border border-white/5 text-[9px] font-bold uppercase tracking-tighter">
                                                <AlertCircle size={10} /> Pending
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => testConnection(item.id, currentKey)}
                                        disabled={!currentKey || isTesting}
                                        className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black transition-all ${isTesting ? "bg-white/10 text-slate-400" : "bg-white/5 text-slate-300 hover:bg-white/10 active:scale-95"
                                            }`}
                                    >
                                        <RefreshCcw size={12} className={isTesting ? "animate-spin" : ""} />
                                        {isTesting ? "Testing..." : "Test Node"}
                                    </button>
                                </div>
                            </div>
                        </EliteCard>
                    );
                })}

                <EliteCard className="border-dashed border-white/10 bg-transparent hover:border-emerald-500/20 transition-all">
                    <div className="h-full flex flex-col items-center justify-center text-center py-8 space-y-3">
                        <div className="p-4 rounded-full bg-white/5 text-slate-600">
                            <RefreshCcw size={24} />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-400">Add Custom Node</h4>
                            <p className="text-[10px] text-slate-600">Local LLMs (Ollama) or Enterprise endpoints</p>
                        </div>
                        <button className="px-6 py-2 rounded-full bg-white/5 text-[10px] font-black text-slate-400 hover:bg-white/10 hover:text-white transition-all">
                            Configure Proxy
                        </button>
                    </div>
                </EliteCard>
            </div>
        </div>
    );
};
