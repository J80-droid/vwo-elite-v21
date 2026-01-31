import { useModels } from "@shared/hooks/useModels";
import { useTranslations } from "@shared/hooks/useTranslations";
import { encryptValue } from "@shared/lib/keyResolver";
import { COMMON_HF_IMAGE_MODELS } from "@shared/lib/modelDefaults";
import { useAIAnalyticsStore } from "@shared/model/aiStatusStore";
import type { CustomAIProvider, ModelInfo, UserSettings } from "@shared/types/config";
import { Cpu, Download, Globe, Key, Plus, Shield, Upload, X, Zap } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import { ApiKeyInput } from "../ApiKeyInput";
import { GlobalHealthDashboard, UsageTracker } from "../components/MatrixDashboard";
import { MatrixLatencyTest } from "../components/MatrixLatencyTest";
import { GeminiVoiceSelector, IntelligenceGrid, ProviderSettings } from "../components/ProviderSettings";
import { ModelSelectorCard } from "../ModelSelectorCard";

// --- Configuration Data ---

type ProviderId = "gemini" | "groq" | "kimi" | "openai" | "anthropic" | "openrouter" | "deepseek" | "cohere" | "mistral" | "replicate";

interface ProviderConfigItem {
  id: ProviderId;
  title: string;
  configKey: keyof UserSettings["aiConfig"];
  link: string;
  placeholder: string;
  hasVoiceSelector?: boolean; // Special flag for Gemini
}

const STANDARD_PROVIDERS: ProviderConfigItem[] = [
  { id: "gemini", title: "Google Gemini", configKey: "geminiApiKey", link: "https://aistudio.google.com/app/apikey", placeholder: "AIzaSy...", hasVoiceSelector: true },
  { id: "groq", title: "Groq Cloud", configKey: "groqApiKey", link: "https://console.groq.com/keys", placeholder: "gsk_..." },
  { id: "kimi", title: "Kimi (Moonshot AI)", configKey: "kimiApiKey", link: "https://platform.moonshot.ai/console/api-keys", placeholder: "sk-..." },
  { id: "openai", title: "OpenAI (Unified)", configKey: "openaiApiKey", link: "https://platform.openai.com/api-keys", placeholder: "sk-..." },
  { id: "anthropic", title: "Anthropic (Claude)", configKey: "anthropicApiKey", link: "https://console.anthropic.com/settings/keys", placeholder: "sk-ant-..." },
  { id: "openrouter", title: "OpenRouter (Unified)", configKey: "openRouterApiKey", link: "https://openrouter.ai/keys", placeholder: "sk-or-..." },
  { id: "deepseek", title: "DeepSeek (Native)", configKey: "deepSeekApiKey", link: "https://platform.deepseek.com/api_keys", placeholder: "sk-..." },
  { id: "cohere", title: "Cohere", configKey: "cohereApiKey", link: "https://dashboard.cohere.com/api-keys", placeholder: "COHERE_KEY..." },
  { id: "mistral", title: "Mistral AI", configKey: "mistralApiKey", link: "https://console.mistral.ai/api-keys/", placeholder: "sk-..." },
  { id: "replicate", title: "Replicate (3D & Visual)", configKey: "replicateApiKey", link: "https://replicate.com/account/api-tokens", placeholder: "r8_..." },
];

interface ApiConfigTabProps {
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => void;
  showApiKey: Record<string, boolean>;
  setShowApiKey: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  exportBackup: () => void;
  importBackup: () => void;
}

const LOCAL_PRESETS = [
  { name: "Ollama", baseUrl: "http://localhost:11434/v1", color: "text-orange-400" },
  { name: "LM Studio", baseUrl: "http://localhost:1234/v1", color: "text-blue-400" },
  { name: "Jan", baseUrl: "http://localhost:1337/v1", color: "text-green-400" },
];

export const ApiConfigTab: React.FC<ApiConfigTabProps> = ({
  settings,
  updateSettings,
  showApiKey,
  setShowApiKey,
  exportBackup,
  importBackup,
}) => {
  const {
    availableModels,
    isLoading,
    errors,
    refreshGeminiModels,
    refreshGroqModels,
    refreshKimiModels,
    refreshOpenAIModels,
    refreshCohereModels,
    refreshAnthropicModels,
    refreshOpenRouterModels,
    refreshDeepSeekModels,
    refreshMistralModels,
    refreshCustomModels,
    getModel,
    setModel,
    setCustomModel,
  } = useModels();

  const { t } = useTranslations();
  const analytics = useAIAnalyticsStore();
  const stats = analytics.getAggregatedStats();

  const refreshActions: Record<string, () => Promise<void>> = useMemo(() => ({
    gemini: refreshGeminiModels,
    groq: refreshGroqModels,
    kimi: refreshKimiModels,
    openai: refreshOpenAIModels,
    cohere: refreshCohereModels,
    anthropic: refreshAnthropicModels,
    openrouter: refreshOpenRouterModels,
    deepseek: refreshDeepSeekModels,
    mistral: refreshMistralModels,
    replicate: async () => { },
  }), [refreshGeminiModels, refreshGroqModels, refreshKimiModels, refreshOpenAIModels, refreshCohereModels, refreshAnthropicModels, refreshOpenRouterModels, refreshDeepSeekModels, refreshMistralModels]);

  const handleApiKeyUpdate = useCallback(async (key: keyof UserSettings["aiConfig"], label: string, val: string) => {
    const encryptedKey = val ? await encryptValue(val) : "";

    updateSettings({
      aiConfig: {
        ...settings.aiConfig,
        [key]: encryptedKey as unknown as UserSettings["aiConfig"][typeof key],
        apiVault: {
          ...(settings.aiConfig?.apiVault || {}),
          [key]: {
            key: encryptedKey,
            status: val ? "active" : "revoked",
            label: label
          }
        }
      },
    });
  }, [settings.aiConfig, updateSettings]);

  const handleSimpleKeyUpdate = useCallback(async (key: keyof UserSettings["aiConfig"], val: string) => {
    const encryptedKey = val ? await encryptValue(val) : "";
    updateSettings({
      aiConfig: {
        ...settings.aiConfig,
        [key]: encryptedKey as unknown as UserSettings["aiConfig"][typeof key]
      }
    });
  }, [settings.aiConfig, updateSettings]);

  const providersForLatency = useMemo(() => [
    ...STANDARD_PROVIDERS.map((p: ProviderConfigItem) => ({
      id: p.id,
      name: p.title,
      key: (settings.aiConfig?.[p.configKey] as string) || ""
    })),
    { id: "huggingface", name: "Hugging Face", key: settings.aiConfig?.hfToken || "" },
    ...(settings.aiConfig?.customProviders || []).map((p: CustomAIProvider) => ({ id: p.id, name: p.name, key: p.apiKey })),
  ], [settings.aiConfig]);

  const [newProvider, setNewProvider] = useState({
    name: "",
    baseUrl: "",
    apiKey: "",
  });
  const [isAdding, setIsAdding] = useState(false);

  const addProvider = useCallback(
    async (name: string, baseUrl: string, plainApiKey: string, id: string) => {
      const providers = settings.aiConfig?.customProviders || [];

      if (providers.some((p: CustomAIProvider) => p.baseUrl === baseUrl)) {
        alert("Deze provider (URL) is al geconfigureerd.");
        return;
      }

      const encryptedKey = plainApiKey && plainApiKey !== "none"
        ? await encryptValue(plainApiKey)
        : plainApiKey;

      updateSettings({
        aiConfig: {
          ...settings.aiConfig,
          customProviders: [
            ...providers,
            {
              id: id,
              name: name,
              baseUrl: baseUrl,
              apiKey: encryptedKey,
              enabled: true,
              models: { chat: "", reasoning: "", vision: "", live: "" },
            },
          ],
        },
      });
    },
    [settings.aiConfig, updateSettings],
  );

  const handleAddCustomProvider = useCallback(async () => {
    if (!newProvider.name || !newProvider.baseUrl || !newProvider.apiKey)
      return;

    const id = `custom_${uuidv4().substring(0, 8)}`;
    const cleanUrl = newProvider.baseUrl.trim().replace(/\/+$/, "");

    await addProvider(newProvider.name, cleanUrl, newProvider.apiKey, id);

    // Trigger refresh immediately
    const customProviders = settings.aiConfig?.customProviders || [];
    const provider = customProviders.find((p: CustomAIProvider) => p.id === id);
    if (provider) refreshCustomModels(provider);

    setNewProvider({ name: "", baseUrl: "", apiKey: "" });
    setIsAdding(false);
  }, [newProvider, addProvider, refreshCustomModels, settings.aiConfig?.customProviders]);

  const handleDeleteCustomProvider = useCallback(
    (id: string) => {
      if (!confirm("Weet je zeker dat je deze provider wilt verwijderen?"))
        return;
      const providers = (settings.aiConfig?.customProviders || []) as CustomAIProvider[];
      updateSettings({
        aiConfig: {
          ...settings.aiConfig,
          customProviders: providers.filter((p: CustomAIProvider) => p.id !== id),
        },
      });
    },
    [settings.aiConfig, updateSettings],
  );

  return (
    <div className="glass rounded-xl p-8 animate-in fade-in slide-in-from-right-4 duration-300 space-y-8">
      <h2 className="text-xl font-bold text-white border-b border-white/10 pb-4">
        <Key className="inline-block mr-2 text-rose-500" size={20} />
        {t.api.title}
      </h2>

      <GlobalHealthDashboard />
      <UsageTracker stats={stats} />
      <MatrixLatencyTest providers={providersForLatency} />

      {/* --- STANDARD PROVIDERS LOOP --- */}
      {STANDARD_PROVIDERS.map((provider: ProviderConfigItem) => (
        <React.Fragment key={provider.id}>
          <ProviderSettings
            title={provider.title}
            providerId={provider.id}
            apiKey={(settings.aiConfig?.[provider.configKey] as string) || ""}
            setApiKey={(val) => handleApiKeyUpdate(provider.configKey, provider.title, val)}
            models={(availableModels as unknown as Record<string, ModelInfo[] | string[]>)[provider.id] || []}
            isLoading={isLoading[provider.id] ?? false}
            error={errors?.[provider.id]}
            onRefresh={() => {
              const action = refreshActions[provider.id];
              if (action) {
                action();
              }
            }}
            getModel={(type) => getModel(provider.id, type)}
            setModel={(type, m) => setModel(provider.id, type, m)}
            showKey={showApiKey[provider.id] ?? false}
            toggleShowKey={() => setShowApiKey((prev: Record<string, boolean>) => ({ ...prev, [provider.id]: !prev[provider.id] }))}
            apiKeyLink={provider.link}
            apiKeyPlaceholder={provider.placeholder}
          />

          {/* Gemini Specific Voice Selector */}
          {provider.hasVoiceSelector && settings.aiConfig?.geminiApiKey && (
            <GeminiVoiceSelector
              currentVoice={settings.aiConfig?.geminiVoice || "Puck"}
              onSelect={(name) => updateSettings({ aiConfig: { ...settings.aiConfig, geminiVoice: name } })}
              apiKey={settings.aiConfig?.geminiApiKey || ""}
              model={getModel("gemini", "live")}
            />
          )}
        </React.Fragment>
      ))}

      {/* --- SPECIALTY PROVIDERS --- */}

      {/* Hume AI */}
      <div className="bg-obsidian-950 rounded-xl p-6 border border-white/10 space-y-6">
        <div className="space-y-4">
          <ApiKeyInput
            label="Hume AI Key"
            link="https://beta.hume.ai/settings/keys"
            value={settings.aiConfig?.humeApiKey || ""}
            onChange={(val) => handleApiKeyUpdate("humeApiKey", "Hume AI", val)}
            placeholder="HUME_API_KEY..."
            showKey={showApiKey["hume"] ?? false}
            onToggleShow={() =>
              setShowApiKey((prev: Record<string, boolean>) => ({ ...prev, hume: !prev.hume }))
            }
          />
          <ApiKeyInput
            label="Hume Secret Key"
            link="https://beta.hume.ai/settings/keys"
            value={settings.aiConfig?.humeSecretKey || ""}
            onChange={(val) => handleApiKeyUpdate("humeSecretKey", "Hume Secret", val)}
            placeholder="HUME_SECRET_KEY..."
            showKey={showApiKey["hume-secret"] ?? false}
            onToggleShow={() =>
              setShowApiKey((prev: Record<string, boolean>) => ({ ...prev, "hume-secret": !prev["hume-secret"] }))
            }
          />
        </div>

        {(settings.aiConfig?.humeApiKey || settings.aiConfig?.humeSecretKey) && (
          <IntelligenceGrid
            provider="hume"
            models={availableModels.hume}
            isLoading={isLoading.hume ?? false}
            error={errors?.hume}
            onRefresh={() => { }}
            getModel={(type) => getModel("hume", type)}
            setModel={(type, m) => setModel("hume", type, m)}
            hasApiKey={!!settings.aiConfig?.humeApiKey}
          />
        )}
      </div>

      {/* Hugging Face */}
      <div className="bg-obsidian-950 rounded-xl p-6 border border-white/10 space-y-6">
        <ApiKeyInput
          label="Hugging Face Token"
          link="https://huggingface.co/settings/tokens"
          value={settings.aiConfig?.hfToken || ""}
          onChange={(val: string) => handleApiKeyUpdate("hfToken", "Hugging Face", val)}
          placeholder="hf_..."
          showKey={showApiKey["hf"] ?? false}
          onToggleShow={() =>
            setShowApiKey((prev: Record<string, boolean>) => ({ ...prev, hf: !prev.hf }))
          }
        />
        {settings.aiConfig?.hfToken && (
          <div className="pt-4 border-t border-white/5">
            <ModelSelectorCard
              label="Image Model"
              provider="huggingface"
              type="image"
              models={COMMON_HF_IMAGE_MODELS}
              isLoading={false}
              icon={Globe}
              currentModel={getModel("huggingface", "image")}
              onSelect={(m) => setModel("huggingface", "image", m)}
              hasApiKey={true}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Research & Citations Section */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
            <Globe size={16} className="text-blue-500" />
            {t.api.research}
          </h3>
          <div className="bg-obsidian-950 rounded-xl p-6 border border-white/10 space-y-4">
            <ApiKeyInput
              label="Tavily AI (Web Search)"
              link="https://tavily.com"
              value={settings.aiConfig?.tavilyApiKey || ""}
              onChange={(val) => handleSimpleKeyUpdate("tavilyApiKey", val)}
              placeholder="tvly-..."
              showKey={showApiKey["tavily"] ?? false}
              onToggleShow={() => setShowApiKey((prev: Record<string, boolean>) => ({ ...prev, tavily: !prev.tavily }))}
            />
            <ApiKeyInput
              label="Perplexity AI"
              link="https://www.perplexity.ai/settings/api"
              value={settings.aiConfig?.perplexityApiKey || ""}
              onChange={(val) => handleSimpleKeyUpdate("perplexityApiKey", val)}
              placeholder="pplx-..."
              showKey={showApiKey["perplexity"] ?? false}
              onToggleShow={() => setShowApiKey((prev: Record<string, boolean>) => ({ ...prev, perplexity: !prev.perplexity }))}
            />
            <ApiKeyInput
              label="Brave Search API"
              link="https://brave.com/search/api/"
              value={settings.aiConfig?.braveSearchApiKey || ""}
              onChange={(val) => handleSimpleKeyUpdate("braveSearchApiKey", val)}
              placeholder="brave_..."
              showKey={showApiKey["brave"] ?? false}
              onToggleShow={() => setShowApiKey((prev: Record<string, boolean>) => ({ ...prev, brave: !prev.brave }))}
            />
          </div>
        </div>

        {/* Audio & Stemmen Section */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
            <Zap size={16} className="text-rose-500" />
            {t.api.audio}
          </h3>
          <div className="bg-obsidian-950 rounded-xl p-6 border border-white/10 space-y-4">
            <ApiKeyInput
              label="ElevenLabs Key"
              link="https://elevenlabs.io"
              value={settings.aiConfig?.elevenLabsApiKey || ""}
              onChange={(val) => handleSimpleKeyUpdate("elevenLabsApiKey", val)}
              placeholder="sk_..."
              showKey={showApiKey["elevenlabs"] ?? false}
              onToggleShow={() => setShowApiKey((prev: Record<string, boolean>) => ({ ...prev, elevenlabs: !prev.elevenlabs }))}
            />
            <ApiKeyInput
              label="Deepgram API (Fast STT)"
              link="https://console.deepgram.com"
              value={settings.aiConfig?.deepgramApiKey || ""}
              onChange={(val) => handleSimpleKeyUpdate("deepgramApiKey", val)}
              placeholder="dg_..."
              showKey={showApiKey["deepgram"] ?? false}
              onToggleShow={() => setShowApiKey((prev: Record<string, boolean>) => ({ ...prev, deepgram: !prev.deepgram }))}
            />
          </div>
        </div>
      </div>

      {/* Custom Providers */}
      <div className="bg-obsidian-950 rounded-xl p-6 border border-white/10 space-y-6">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Globe size={18} className="text-purple-400" />
              Custom & Lokale Providers
            </h3>
            <button
              onClick={() => setIsAdding(!isAdding)}
              className={`p-2 rounded-lg transition-colors ${isAdding
                ? "bg-rose-500/20 text-rose-400"
                : "bg-electric/20 text-electric hover:bg-electric/30"
                }`}
            >
              {isAdding ? <X size={18} /> : <Plus size={18} />}
            </button>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <p className="text-xs text-slate-400 mb-3 uppercase tracking-wider font-bold">
              Quick Connect (Local AI)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {LOCAL_PRESETS.map((preset: { name: string; baseUrl: string; color: string }) => (
                <button
                  key={preset.name}
                  onClick={() =>
                    addProvider(
                      preset.name,
                      preset.baseUrl,
                      "none",
                      `local_${preset.name
                        .toLowerCase()
                        .replace(/\s+/g, "_")}_${uuidv4().substring(0, 8)}`
                    )
                  }
                  className="flex items-center gap-3 bg-obsidian-900/50 hover:bg-white/10 border border-white/5 rounded-lg px-4 py-3 transition-all group"
                >
                  <div className={`text-lg group-hover:scale-110 transition-transform ${preset.color}`}>
                    <Cpu size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-white leading-none mb-1">
                      {preset.name}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      localhost
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {isAdding && (
          <div className="bg-black/20 rounded-lg p-4 space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">
                  Provider Name
                </label>
                <input
                  type="text"
                  value={newProvider.name}
                  onChange={(e) =>
                    setNewProvider({ ...newProvider, name: e.target.value })
                  }
                  placeholder="e.g. DeepSeek"
                  className="w-full bg-obsidian-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-electric"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">
                  Base URL
                </label>
                <input
                  type="text"
                  value={newProvider.baseUrl}
                  onChange={(e) =>
                    setNewProvider({ ...newProvider, baseUrl: e.target.value })
                  }
                  placeholder="e.g. https://api.deepseek.com/v1"
                  className="w-full bg-obsidian-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-electric"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">
                API Key
              </label>
              <input
                type="password"
                value={newProvider.apiKey}
                onChange={(e) =>
                  setNewProvider({ ...newProvider, apiKey: e.target.value })
                }
                placeholder="sk-..."
                className="w-full bg-obsidian-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-electric"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleAddCustomProvider}
                disabled={
                  !newProvider.name ||
                  !newProvider.baseUrl ||
                  !newProvider.apiKey
                }
                className="bg-electric hover:bg-electric-glow text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Zap size={16} /> Add Provider
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {settings.aiConfig?.customProviders?.map((provider: CustomAIProvider) => (
            <ProviderSettings
              key={provider.id}
              title={provider.name}
              icon={Globe}
              providerId={provider.id}
              baseUrl={provider.baseUrl}
              apiKey={provider.apiKey}
              setApiKey={async (val) => {
                const encrypted = val && val !== "none" ? await encryptValue(val) : "none";
                const updated = (
                  settings.aiConfig?.customProviders || []
                ) as CustomAIProvider[];
                updateSettings({
                  aiConfig: {
                    ...settings.aiConfig,
                    customProviders: updated.map((p: CustomAIProvider) =>
                      p.id === provider.id ? { ...p, apiKey: encrypted as string } : p
                    ),
                  },
                });
              }}
              models={availableModels.custom[provider.id] || []}
              isLoading={isLoading[provider.id] ?? false}
              error={errors?.[provider.id]}
              onRefresh={() => refreshCustomModels(provider)}
              getModel={(type) =>
                (provider.models as Record<string, string | undefined>)?.[
                type
                ] || ""
              }
              setModel={(type, m) => setCustomModel(provider.id, type, m)}
              showKey={showApiKey[provider.id] ?? false}
              toggleShowKey={() =>
                setShowApiKey((prev: Record<string, boolean>) => ({
                  ...prev,
                  [provider.id]: !prev[provider.id],
                }))
              }
              onDelete={() => handleDeleteCustomProvider(provider.id)}
              apiKeyLink={
                provider.baseUrl.includes("ollama") ? "https://ollama.com" : ""
              }
              apiKeyPlaceholder={
                provider.apiKey === "none"
                  ? "Lokale verbinding - Geen Key nodig"
                  : "sk-..."
              }
            />
          ))}
          {(!settings.aiConfig?.customProviders ||
            settings.aiConfig.customProviders.length === 0) &&
            !isAdding && (
              <div className="text-center py-4 text-slate-500 text-sm">
                Geen custom providers geconfigureerd.
              </div>
            )}
        </div>

        <div className="pt-8 border-t border-white/5 space-y-6">
          <div className="flex items-center gap-2">
            <Shield className="text-emerald-500" size={18} />
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Backup & Herstel</h3>
          </div>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={exportBackup}
              className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3 text-sm font-bold text-white hover:bg-white/10 hover:border-white/20 transition-all group"
            >
              <Download className="text-blue-400 group-hover:scale-110 transition-transform" size={18} />
              Elite Vault Exporteren
            </button>
            <button
              onClick={importBackup}
              className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3 text-sm font-bold text-white hover:bg-white/10 hover:border-white/20 transition-all group"
            >
              <Upload className="text-emerald-400 group-hover:scale-110 transition-transform" size={18} />
              Elite Vault Importeren
            </button>
          </div>
          <p className="text-[10px] text-slate-500 uppercase tracking-tighter italic">
            Beveiligingswaarschuwing: Je API-keys worden versleuteld geëxporteerd, maar bewaar dit bestand veilig.
          </p>
        </div>
      </div>
    </div>
  );
};
