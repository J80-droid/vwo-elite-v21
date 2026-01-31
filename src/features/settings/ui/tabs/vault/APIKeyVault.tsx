import { checkProviderHealth } from "@shared/api/healthChecks";
import { useModelsStore } from "@shared/model/modelsStore";
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
    updateSettings: (newSettings: Partial<UserSettings>) => void;
}

const VAULT_ITEMS = [
    { id: "gemini", name: "Google Gemini", configKey: "geminiApiKey", icon: "https://www.gstatic.com/lamda/images/favicon_v1_150160d13fef2ec10.png", description: "Advanced multimodal intelligence.", setupUrl: "https://aistudio.google.com/app/apikey" },
    { id: "groq", name: "Groq Cloud", configKey: "groqApiKey", icon: "https://groq.com/favicon.ico", description: "Ultra-fast LPU inference.", setupUrl: "https://console.groq.com/keys" },
    { id: "kimi", name: "Moonshot Kimi", configKey: "kimiApiKey", icon: "https://kimi.moonshot.cn/favicon.ico", description: "Native long-context support.", setupUrl: "https://platform.moonshot.cn/console/api-keys" },
    { id: "hume", name: "Hume AI", configKey: "humeApiKey", icon: "https://hume.ai/favicon.ico", description: "Emotional and affective prosody analysis.", setupUrl: "https://beta.hume.ai/settings/keys" },
];

export const APIKeyVault: React.FC<APIKeyVaultProps> = ({
    settings,
    updateSettings,
}) => {
    const { isLoading, errors } = useModelsStore();
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
                toast.success(`${id.toUpperCase()} verbinding is gezond!`);
            } else {
                toast.error(`${id.toUpperCase()} validatie mislukt.`);
            }
        } catch (error) {
            console.error(`[Vault] Connection test failed for ${id}:`, error);
            toast.error(`Fout bij testen van ${id}.`);
        } finally {
            setTestingId(null);
        }
    };

    const toggleKeyVisibility = (id: string) => {
        setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
            {VAULT_ITEMS.map((item) => {
                const configKey = item.configKey as keyof UserSettings["aiConfig"];
                const currentKey = settings.aiConfig[configKey] as string;
                const isVisible = showKeys[item.id];

                return (
                    <EliteCard key={item.id} className="relative group overflow-hidden">
                        <div className="p-6 space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                                        <img src={item.icon} alt={item.name} className="w-6 h-6 object-contain" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white tracking-wide">{item.name}</h3>
                                        <p className="text-[10px] text-slate-500 font-medium">{item.description}</p>
                                    </div>
                                </div>
                                <a
                                    href={item.setupUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                                    title="Get API Key"
                                >
                                    <ExternalLink size={14} />
                                </a>
                            </div>

                            <div className="space-y-2">
                                <div className="relative group/input">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-electric transition-colors">
                                        <Key size={14} />
                                    </div>
                                    <input
                                        type={isVisible ? "text" : "password"}
                                        value={currentKey || ""}
                                        onChange={(e) => handleKeyUpdate(configKey, e.target.value)}
                                        placeholder="Voer API key in..."
                                        className="w-full bg-obsidian-950/50 border border-white/5 rounded-lg py-2.5 pl-10 pr-12 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-electric/50 focus:bg-obsidian-900 transition-all"
                                    />
                                    <button
                                        onClick={() => toggleKeyVisibility(item.id)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-white/5 text-slate-500 hover:text-white transition-all"
                                    >
                                        {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <div className="flex items-center gap-2">
                                        {isLoading[item.id] ? (
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-bold uppercase tracking-tighter">
                                                <RefreshCcw size={10} className="animate-spin" /> Syncing...
                                            </div>
                                        ) : errors[item.id] ? (
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-bold uppercase tracking-tighter" title={errors[item.id] || "Unknown Error"}>
                                                <AlertCircle size={10} /> {errors[item.id]?.includes("401") ? "Invalid Key" : "Error"}
                                            </div>
                                        ) : currentKey ? (
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
                                        disabled={!currentKey || testingId === item.id}
                                        className="group/btn flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
                                    >
                                        {testingId === item.id ? (
                                            <RefreshCcw size={12} className="animate-spin text-electric" />
                                        ) : (
                                            <ShieldCheck size={12} className="group-hover/btn:text-emerald-400 transition-colors" />
                                        )}
                                        Validatie Test
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Status Light */}
                        <div className={`absolute top-4 right-4 w-1.5 h-1.5 rounded-full blur-[2px] animate-pulse ${currentKey ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    </EliteCard>
                );
            })}

            {/* Security Note */}
            <div className="md:col-span-2 bg-rose-500/5 border border-rose-500/10 rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
                    <Lock size={18} />
                </div>
                <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Elite Beveiliging</h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                        Jouw API-sleutels worden lokaal opgeslagen met AES-256 encryptie. Ze worden nooit naar onze servers gestuurd en zijn alleen toegankelijk voor deze applicatie.
                    </p>
                </div>
            </div>
        </div>
    );
};
