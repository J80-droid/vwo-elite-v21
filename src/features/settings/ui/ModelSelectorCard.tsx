import { sortModelsByReliability } from "@shared/lib/modelClassifier";
import { calculateModelScore, RECOMMENDED_MODELS } from "@shared/lib/modelDefaults";
import { ModelInfo } from "@shared/types/config";
import { AnimatePresence, motion } from "framer-motion";
import { Brain, Check, ChevronDown, type LucideIcon, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

interface ModelSelectorCardProps {
  label: string;
  provider: string;
  type: string;
  models: string[] | ModelInfo[];
  isLoading: boolean;
  error?: string | null;
  onRefresh?: () => void;
  icon?: LucideIcon;
  currentModel: string;
  onSelect: (model: string) => void;
  hasApiKey: boolean;
}

export const ModelSelectorCard: React.FC<ModelSelectorCardProps> = React.memo(({
  label,
  provider,
  type,
  models,
  isLoading,
  error,
  onRefresh,
  icon: Icon = Brain,
  currentModel,
  onSelect,
  hasApiKey,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = () => setIsOpen(false);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [isOpen]);

  // ELITE CAPABILITIES CACHE (Memoized to prevent multiple localStorage reads)
  const capabilitiesCache = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("vwo-elite-capabilities-v1") || "{}");
    } catch {
      return {};
    }
  }, []); // Only read once on mount

  const { recommended, others } = useMemo(() => {
    // Get recommended list for this provider/type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recs = (RECOMMENDED_MODELS as any)[provider]?.[type] || [];

    // Normalize input to string array for sorting/filtering
    const modelIds = Array.isArray(models)
      ? models.map(m => typeof m === "string" ? m : m.id)
      : [];

    // Filter available models that match recommended list
    const recommendedModels = sortModelsByReliability(
      modelIds.filter(id => recs.includes(id)),
      calculateModelScore
    );

    // Filter everything else
    const otherModels = sortModelsByReliability(
      modelIds.filter(id => !recs.includes(id)),
      calculateModelScore
    );

    return { recommended: recommendedModels, others: otherModels };
  }, [models, provider, type]);

  const renderModelItem = (m: string) => {
    // const badge = getModelBadge(m); // Removed in favor of Score
    const score = calculateModelScore(m);
    const isSelected = currentModel === m;

    // 1. Controleer of het model geverifieerd is in de cache
    const isVerified = !!capabilitiesCache[m];

    // 2. Specifieke check voor 'live' ondersteuning indien het type 'live' is
    const supportsLive = type === "live" &&
      capabilitiesCache[m]?.methods.some((meth: string) => meth.toLowerCase().includes("bidigeneratecontent"));

    return (
      <button
        key={m}
        onClick={() => {
          onSelect(m);
          setIsOpen(false);
        }}
        className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all flex items-center justify-between group ${isSelected
          ? "bg-electric/20 text-white font-bold border border-electric/20"
          : "text-slate-400 hover:bg-white/5 hover:text-white"
          }`}
      >
        <div className="flex items-center gap-2 mr-4 overflow-hidden">
          <span className="whitespace-nowrap truncate">{m}</span>
          {/* VERIFIED BADGE */}
          {isVerified && (
            <div
              className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-tighter shrink-0 ${supportsLive
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]"
                : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                }`}
              title={supportsLive ? "Native Live Audio Verified" : "API Capabilities Verified"}
            >
              <ShieldCheck size={10} />
              {supportsLive ? "Live" : "Verified"}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Version/Experimental Tag (Optional) */}
          {m.includes("exp") && <span className="text-[9px] text-pink-400 opacity-70">EXP</span>}

          {/* ELO Score */}
          <span className={`text-[10px] font-mono font-bold ${score > 1300 ? "text-emerald-400" : score > 1200 ? "text-blue-400" : "text-slate-500"}`}>
            {score}
          </span>
          {isSelected && <Check size={12} className="text-electric ml-1" />}
        </div>
      </button>
    );
  };

  return (
    <motion.div
      layout
      className={`flex flex-col gap-3 p-4 rounded-xl border transition-all duration-300 relative ${hasApiKey ? "bg-obsidian-900/40 border-white/10 shadow-lg" : "bg-obsidian-950/20 border-white/5 opacity-50"
        }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${provider === "gemini" ? "bg-blue-500/20 text-blue-400" :
            provider === "groq" ? "bg-orange-500/20 text-orange-400" :
              "bg-yellow-500/20 text-yellow-400"
            }`}>
            <Icon size={16} />
          </div>
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            {label}
          </label>
        </div>
        {onRefresh && hasApiKey && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRefresh();
            }}
            disabled={isLoading}
            title={error || "Refresh models"}
            className={`p-1.5 rounded-lg transition-colors disabled:text-slate-600 ${error ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "hover:bg-white/5 text-electric"
              }`}
          >
            {isLoading ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : error ? (
              <RefreshCw size={14} />
            ) : (
              <RefreshCw size={14} />
            )}
          </button>
        )}
      </div>

      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (hasApiKey) setIsOpen(!isOpen);
          }}
          disabled={!hasApiKey}
          className={`w-full flex items-center justify-between bg-obsidian-950/60 border border-white/10 rounded-lg px-3 py-2 text-white text-xs transition-all text-left ${isOpen ? "border-electric/50 ring-1 ring-electric/20" : "hover:border-white/20"
            }`}
        >
          <span className="font-mono text-slate-300 text-[10px] break-all leading-tight pr-2">
            {currentModel || "Selecteer..."}
          </span>
          <ChevronDown size={14} className={`text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 5 }}
              className="absolute top-full left-0 min-w-full w-auto max-w-[95vw] mt-2 z-50 bg-obsidian-950 border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl"
            >
              <div className="max-h-60 overflow-y-auto p-2 custom-scrollbar space-y-3">

                {/* 1. RECOMMENDED SECTION */}
                {recommended.length > 0 && (
                  <div>
                    <div className="px-2 pb-1 text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                      <Sparkles size={10} /> Recommended
                    </div>
                    <div className="space-y-1">
                      {recommended.map(renderModelItem)}
                    </div>
                  </div>
                )}

                {/* 2. OTHERS SECTION */}
                {others.length > 0 && (
                  <div>
                    {recommended.length > 0 && (
                      <div className="h-px bg-white/5 my-2 mx-2" />
                    )}
                    <div className="px-2 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                      Available Models
                    </div>
                    <div className="space-y-1">
                      {others.map(renderModelItem)}
                    </div>
                  </div>
                )}

                {models.length === 0 && (
                  <div className="text-slate-500 text-xs text-center py-6 italic">
                    No models found. Check API Key.
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});
