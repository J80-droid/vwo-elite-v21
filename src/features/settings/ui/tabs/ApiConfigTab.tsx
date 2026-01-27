import type { UserSettings } from "@features/settings/types";
import { useModels } from "@shared/hooks/useModels";
import { COMMON_HF_IMAGE_MODELS } from "@shared/lib/modelDefaults";
import {
  Brain,
  Cpu,
  Globe,
  Key,
  MessageSquare,
  Mic,
  Monitor,
  Plus,
  Rocket,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import React, { useState } from "react";

import { ApiKeyInput } from "../ApiKeyInput";
import { ModelSelectorCard } from "../ModelSelectorCard";

interface ApiConfigTabProps {
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => void;
  showApiKey: Record<string, boolean>;
  setShowApiKey: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export const ApiConfigTab: React.FC<ApiConfigTabProps> = ({
  settings,
  updateSettings,
  showApiKey,
  setShowApiKey,
}) => {
  const {
    availableModels,
    isLoading,
    error, // Extract globally
    refreshGeminiModels,
    refreshGroqModels,
    refreshCustomModels,
    getModel,
    setModel,
    setCustomModel,
  } = useModels();

  const [newProvider, setNewProvider] = useState({
    name: "",
    baseUrl: "",
    apiKey: "",
  });
  const [isAdding, setIsAdding] = useState(false);

  const handleAddCustomProvider = () => {
    if (!newProvider.name || !newProvider.baseUrl || !newProvider.apiKey)
      return;
    const providerId = `custom_${Date.now()} `;
    const providers = settings.aiConfig?.customProviders || [];
    updateSettings({
      aiConfig: {
        ...settings.aiConfig,
        customProviders: [
          ...providers,
          {
            id: providerId,
            name: newProvider.name,
            baseUrl: newProvider.baseUrl,
            apiKey: newProvider.apiKey,
            enabled: true,
            models: { chat: "" },
          },
        ],
      },
    });
    setNewProvider({ name: "", baseUrl: "", apiKey: "" });
    setIsAdding(false);
  };

  const handleDeleteCustomProvider = (id: string) => {
    if (!confirm("Weet je zeker dat je deze provider wilt verwijderen?"))
      return;
    const providers = (settings.aiConfig?.customProviders || []).filter(
      (p) => p.id !== id,
    );
    updateSettings({
      aiConfig: {
        ...settings.aiConfig,
        customProviders: providers,
      },
    });
  };

  return (
    <div className="glass rounded-xl p-8 animate-in fade-in slide-in-from-right-4 duration-300 space-y-8">
      <h2 className="text-xl font-bold text-white border-b border-white/10 pb-4">
        <Key className="inline-block mr-2 text-rose-500" size={20} />
        API Configuratie
      </h2>

      {/* Gemini */}
      <div className="bg-obsidian-950 rounded-xl p-6 border border-white/10 space-y-6">
        <ApiKeyInput
          label="Google Gemini Key"
          link="https://aistudio.google.com/app/apikey"
          value={settings.aiConfig?.geminiApiKey || ""}
          onChange={(val: string) =>
            updateSettings({
              aiConfig: { ...settings.aiConfig, geminiApiKey: val },
            })
          }
          placeholder="AIzaSy..."
          showKey={showApiKey["gemini"] ?? false}
          onToggleShow={() =>
            setShowApiKey((prev) => ({ ...prev, gemini: !prev.gemini }))
          }
        />
        {settings.aiConfig?.geminiApiKey && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-white/5">
            <ModelSelectorCard
              label="Chat"
              provider="gemini"
              type="chat"
              models={availableModels.gemini}
              isLoading={isLoading.gemini ?? false}
              error={error} // Pass global error
              onRefresh={refreshGeminiModels}
              icon={MessageSquare}
              currentModel={getModel("gemini", "chat")}
              onSelect={(m) => setModel("gemini", "chat", m)}
              hasApiKey={true}
            />
            <ModelSelectorCard
              label="Reasoning"
              provider="gemini"
              type="reasoning"
              models={availableModels.gemini}
              isLoading={isLoading.gemini ?? false}
              error={error}
              onRefresh={refreshGeminiModels}
              icon={Brain}
              currentModel={getModel("gemini", "reasoning")}
              onSelect={(m) => setModel("gemini", "reasoning", m)}
              hasApiKey={true}
            />
            <ModelSelectorCard
              label="Vision"
              provider="gemini"
              type="vision"
              models={availableModels.gemini}
              isLoading={isLoading.gemini ?? false}
              error={error}
              onRefresh={refreshGeminiModels}
              icon={Monitor}
              currentModel={getModel("gemini", "vision")}
              onSelect={(m) => setModel("gemini", "vision", m)}
              hasApiKey={true}
            />
            <ModelSelectorCard
              label="Coach Live"
              provider="gemini"
              type="live"
              models={availableModels.gemini}
              isLoading={isLoading.gemini ?? false}
              error={error}
              onRefresh={refreshGeminiModels}
              icon={Mic}
              currentModel={getModel("gemini", "live")}
              onSelect={(m) => setModel("gemini", "live", m)}
              hasApiKey={true}
            />
          </div>
        )}
      </div>

      {/* Groq */}
      <div className="bg-obsidian-950 rounded-xl p-6 border border-white/10 space-y-6">
        <ApiKeyInput
          label="Groq Key"
          link="https://console.groq.com/keys"
          value={settings.aiConfig?.groqApiKey || ""}
          onChange={(val: string) =>
            updateSettings({
              aiConfig: { ...settings.aiConfig, groqApiKey: val },
            })
          }
          placeholder="gsk_..."
          showKey={showApiKey["groq"] ?? false}
          onToggleShow={() =>
            setShowApiKey((prev) => ({ ...prev, groq: !prev.groq }))
          }
        />
        {settings.aiConfig?.groqApiKey && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5">
            <ModelSelectorCard
              label="Fast"
              provider="groq"
              type="fast"
              models={availableModels.groq}
              isLoading={isLoading.groq ?? false}
              error={error}
              onRefresh={refreshGroqModels}
              icon={Rocket}
              currentModel={getModel("groq", "fast")}
              onSelect={(m) => setModel("groq", "fast", m)}
              hasApiKey={true}
            />
            <ModelSelectorCard
              label="Complex"
              provider="groq"
              type="complex"
              models={availableModels.groq}
              isLoading={isLoading.groq ?? false}
              error={error}
              onRefresh={refreshGroqModels}
              icon={Cpu}
              currentModel={getModel("groq", "complex")}
              onSelect={(m) => setModel("groq", "complex", m)}
              hasApiKey={true}
            />
          </div>
        )}
      </div>

      {/* Hugging Face */}
      <div className="bg-obsidian-950 rounded-xl p-6 border border-white/10 space-y-6">
        <ApiKeyInput
          label="Hugging Face Token"
          link="https://huggingface.co/settings/tokens"
          value={settings.aiConfig?.hfToken || ""}
          onChange={(val: string) =>
            updateSettings({ aiConfig: { ...settings.aiConfig, hfToken: val } })
          }
          placeholder="hf_..."
          showKey={showApiKey["hf"] ?? false}
          onToggleShow={() =>
            setShowApiKey((prev) => ({ ...prev, hf: !prev.hf }))
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
              icon={Monitor}
              currentModel={getModel("huggingface", "image")}
              onSelect={(m) => setModel("huggingface", "image", m)}
              hasApiKey={true}
            />
          </div>
        )}
      </div>

      {/* Specialized Intelligences */}
      <div className="bg-obsidian-950 rounded-xl p-6 border border-white/10 space-y-8">
        <h3 className="font-bold text-white flex items-center gap-2 border-b border-white/5 pb-4">
          <Zap size={18} className="text-cyan-400" />
          Specialized Intelligences
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ApiKeyInput
            label="OpenAI Key (Whisper STT)"
            link="https://platform.openai.com/api-keys"
            value={settings.aiConfig?.openaiApiKey || ""}
            onChange={(val: string) =>
              updateSettings({
                aiConfig: { ...settings.aiConfig, openaiApiKey: val },
              })
            }
            placeholder="sk-..."
            showKey={showApiKey["openai"] ?? false}
            onToggleShow={() =>
              setShowApiKey((prev) => ({ ...prev, openai: !prev.openai }))
            }
          />

          <ApiKeyInput
            label="Cohere Key (Reranking)"
            link="https://dashboard.cohere.com/api-keys"
            value={settings.aiConfig?.cohereApiKey || ""}
            onChange={(val: string) =>
              updateSettings({
                aiConfig: { ...settings.aiConfig, cohereApiKey: val },
              })
            }
            placeholder="COHERE_KEY..."
            showKey={showApiKey["cohere"] ?? false}
            onToggleShow={() =>
              setShowApiKey((prev) => ({ ...prev, cohere: !prev.cohere }))
            }
          />

          <ApiKeyInput
            label="Replicate Key (3D Generation)"
            link="https://replicate.com/account/api-tokens"
            value={settings.aiConfig?.replicateApiKey || ""}
            onChange={(val: string) =>
              updateSettings({
                aiConfig: { ...settings.aiConfig, replicateApiKey: val },
              })
            }
            placeholder="r8_..."
            showKey={showApiKey["replicate"] ?? false}
            onToggleShow={() =>
              setShowApiKey((prev) => ({
                ...prev,
                replicate: !prev.replicate,
              }))
            }
          />

          <ApiKeyInput
            label="Hume AI Key (Emotional AI)"
            link="https://beta.hume.ai/settings/keys"
            value={settings.aiConfig?.humeApiKey || ""}
            onChange={(val: string) =>
              updateSettings({
                aiConfig: { ...settings.aiConfig, humeApiKey: val },
              })
            }
            placeholder="HUME_KEY..."
            showKey={showApiKey["hume"] ?? false}
            onToggleShow={() =>
              setShowApiKey((prev) => ({ ...prev, hume: !prev.hume }))
            }
          />
        </div>
      </div>

      {/* Custom Providers */}
      <div className="bg-obsidian-950 rounded-xl p-6 border border-white/10 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Globe size={18} className="text-purple-400" />
            Custom Providers (OpenAI Compatible)
          </h3>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className={`p - 2 rounded - lg transition - colors ${isAdding ? "bg-rose-500/20 text-rose-400" : "bg-electric/20 text-electric hover:bg-electric/30"} `}
          >
            {isAdding ? <X size={18} /> : <Plus size={18} />}
          </button>
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
          {settings.aiConfig?.customProviders?.map((provider) => (
            <div
              key={provider.id}
              className="bg-black/20 rounded-lg p-4 border border-white/5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Globe size={16} className="text-purple-400" />
                  <span className="font-bold text-white">{provider.name}</span>
                  <span className="text-xs text-slate-500 truncate max-w-[200px]">
                    {provider.baseUrl}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteCustomProvider(provider.id)}
                  className="text-slate-500 hover:text-rose-400 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="pt-3 border-t border-white/5">
                <ModelSelectorCard
                  label="Chat Model"
                  provider={provider.id}
                  type="chat"
                  models={availableModels.custom[provider.id] || []}
                  isLoading={isLoading[provider.id] ?? false}
                  onRefresh={() => refreshCustomModels(provider)}
                  icon={MessageSquare}
                  currentModel={provider.models?.chat || ""}
                  onSelect={(m) => setCustomModel(provider.id, m)}
                  hasApiKey={true}
                />
              </div>
            </div>
          ))}
          {(!settings.aiConfig?.customProviders ||
            settings.aiConfig.customProviders.length === 0) &&
            !isAdding && (
              <div className="text-center py-4 text-slate-500 text-sm">
                Geen custom providers geconfigureerd.
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
