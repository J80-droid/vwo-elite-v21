import { useModelAvailability } from "@shared/hooks/useModelAvailability";
import { Badge } from "@shared/ui/Badge";
import { CustomSelect } from "@shared/ui/Select";
import { Bot, Sparkles, Zap } from "lucide-react";
import React, { useMemo } from "react";

interface ModelSelectorProps {
  apiKey?: string;
  value: string;
  onChange: (value: string) => void;
  filter?: (model: string) => boolean;
  recommendationKeyword?: string; // e.g. "native-audio"
  label?: string;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  apiKey,
  value,
  onChange,
  filter,
  recommendationKeyword,
  label,
}) => {
  const { models, loading, error, refresh } = useModelAvailability(apiKey);

  const filteredModels = useMemo(() => {
    if (!filter) return models;
    return models.filter(filter);
  }, [models, filter]);

  const selectOptions = useMemo(() => {
    return filteredModels.map((model) => {
      const isRecommended =
        recommendationKeyword && model.includes(recommendationKeyword);
      const isNew = model.includes("preview") || model.includes("exp");

      return {
        value: model,
        label: (
          <div className="flex items-center justify-between w-full gap-4">
            <span className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-primary/50" />
              {model}
            </span>
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              {isRecommended && (
                <Badge
                  variant="default"
                  className="bg-green-500/20 text-green-300 border-green-500/30 text-[10px] h-5"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Best
                </Badge>
              )}
              {isNew && !isRecommended && (
                <Badge
                  variant="secondary"
                  className="text-[10px] h-5 bg-blue-500/20 text-blue-300 border-blue-500/30"
                >
                  <Zap className="w-3 h-3 mr-1" />
                  New
                </Badge>
              )}
            </div>
          </div>
        ),
      };
    });
  }, [filteredModels, recommendationKeyword]);

  if (!apiKey) return null;

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-foreground/80">
          {label}
        </label>
      )}

      {error && (
        <div className="p-2 text-xs text-red-400">Kon modellen niet laden.</div>
      )}

      <CustomSelect
        value={value}
        onChange={onChange}
        options={selectOptions}
        placeholder={valOrPlaceholder(value, loading)}
      />

      <div className="flex justify-between px-1">
        <p className="text-xs text-muted-foreground">
          {loading
            ? "Modellen ophalen..."
            : `${filteredModels.length} modellen beschikbaar`}
        </p>
        <button
          onClick={(e) => {
            e.preventDefault();
            localStorage.removeItem("vwo-elite-gemini-models-cache");
            refresh();
          }}
          className="text-xs text-primary/70 hover:text-primary hover:underline cursor-pointer bg-transparent border-none p-0"
        >
          Ververs lijst
        </button>
      </div>
    </div>
  );
};

const valOrPlaceholder = (val: string, loading: boolean) => {
  if (loading) return "Laden...";
  return val || "Selecteer een model";
};
