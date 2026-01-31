/* eslint-disable no-empty */
import { getSettingsSQL, saveSettingsSQL } from "@shared/api/sqliteService";
import { DEFAULT_PERSONA_PROMPTS } from "@shared/config/personaPrompts";
import { AppTheme, UserSettings } from "@shared/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";

const DEFAULT_SETTINGS: UserSettings = {
  id: "current_user",
  profile: {
    name: "VWO Student",
    grade: "5",
    profile: "NT",
    examYear: new Date().getFullYear(),
    targetGrades: {},
    avatar: "./profilepic.jpg",
  },
  theme: "electric",
  language: "nl",
  aiConfig: {
    persona: "socratic",
    customPrompts: DEFAULT_PERSONA_PROMPTS,

    modelConfig: {
      provider: "openai",
      modelId: "gpt-4o",
      contextWindow: 128000,
    },
    promptConfig: {
      systemPrompt: "",
      fewShotExamples: [],
      negativePrompt: "",
      enableChainOfThought: true,
      historyContextLength: 10,
      coachSpeaksFirst: false,
      coachGreeting: "Hoi, hoe gaat het? Waarmee kan ik ik jou helpen vandaag?",
    },
    inferenceConfig: {
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 2048,
      stopSequences: [],
      frequencyPenalty: 0,
      presencePenalty: 0,
    },
    knowledgeConfig: {
      enableRAG: true,
      ragSources: ["textbooks", "user-notes"],
    },
    advancedConfig: {
      jsonMode: false,
      functionCalling: true,
      logitBias: {},
    },
  },
  shortcuts: {
    search: "Ctrl+K",
    ai: "Ctrl+Enter",
  },
  pomodoroWork: 25,
  pomodoroBreak: 5,
  streak: 0,
  gamificationEnabled: true,
  audioFocusMode: "alpha",
  audioVolume: 50,
  graphicsQuality: "high",
  pythonMode: "standard",
  timerStartSound: "zen-bell",
  timerBreakSound: "success-chord",
  speechRecognitionEnabled: true,
  xp: 0,
  level: 1,
  unlockedAchievements: [],
};

const THEMES: Record<AppTheme, Record<string, string>> = {
  electric: {
    "--color-electric": "#3b82f6",
    "--color-electric-glow": "#60a5fa",
    "--color-gold": "#eab308",
  },
  cyberpunk: {
    "--color-electric": "#f472b6", // Pink
    "--color-electric-glow": "#fbcfe8",
    "--color-gold": "#22d3ee", // Cyan for contrast
  },
  matrix: {
    "--color-electric": "#22c55e", // Green
    "--color-electric-glow": "#86efac",
    "--color-gold": "#166534",
  },
  gold: {
    "--color-electric": "#eab308", // Yellow/Gold
    "--color-electric-glow": "#fde047",
    "--color-gold": "#f59e0b",
  },
  rose: {
    "--color-electric": "#f43f5e", // Rose
    "--color-electric-glow": "#fb7185",
    "--color-gold": "#fff1f2",
  },
  nebula: {
    "--color-electric": "#8b5cf6", // Violet
    "--color-electric-glow": "#a78bfa",
    "--color-gold": "#f472b6", // Pink
  },
};

export const useSettings = () => {
  const queryClient = useQueryClient();

  const { data: settings = DEFAULT_SETTINGS } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      // STRATEGY: LocalStorage First (Most Reliable for Settings)
      // This prevents issues where SQLite resets to defaults/bootstrap and overwrites valid local data.

      let finalSettings = DEFAULT_SETTINGS;
      let loadedFrom = "default";

      // 1. Try LocalStorage (Primary)
      try {
        const backup = localStorage.getItem("vwo_elite_settings_backup");
        if (backup) {
          const parsed = JSON.parse(backup);
          if (parsed && parsed.profile) {
            console.log("[Settings] Loaded from LocalStorage (Primary)");
            // Deep merge to ensure new config fields (like aiConfig.modelConfig) are present
            finalSettings = {
              ...DEFAULT_SETTINGS,
              ...parsed,
              aiConfig: {
                ...DEFAULT_SETTINGS.aiConfig,
                ...(parsed.aiConfig || {}),
              },
            };
            loadedFrom = "localstorage";
          }
        }
      } catch (e) {
        console.warn("[Settings] LocalStorage read failed", e);
      }

      // 2. If LocalStorage missing, try SQL (Secondary / First Run)
      if (loadedFrom === "default") {
        try {
          const sqlStored = await getSettingsSQL();
          if (sqlStored) {
            console.log("[Settings] Loaded from SQL (Secondary)");
            finalSettings = {
              ...DEFAULT_SETTINGS,
              ...sqlStored,
              aiConfig: {
                ...DEFAULT_SETTINGS.aiConfig,
                ...(sqlStored.aiConfig || {}),
              },
            };
            loadedFrom = "sql";
            // Immediately back up to LS
            localStorage.setItem(
              "vwo_elite_settings_backup",
              JSON.stringify(finalSettings),
            );
          }
        } catch (e) {
          console.warn("[Settings] SQL load failed", e);
        }
      } else {
        // We loaded from LS, but we should ensure SQL is in sync
        // Fire and forget sync to SQL
        saveSettingsSQL(finalSettings).catch((err) =>
          console.warn("[Settings] Background sync to SQL failed", err),
        );
      }

      return finalSettings;
    },
    staleTime: Infinity, // Settings rarely change externally, don't auto-refetch
    initialData: () => {
      // Try to hydrate synchronously for instant render
      if (typeof localStorage !== "undefined") {
        try {
          const backup = localStorage.getItem("vwo_elite_settings_backup");
          if (backup) return JSON.parse(backup);
        } catch { }
      }
      return DEFAULT_SETTINGS;
    },
  });

  const mutation = useMutation({
    mutationFn: saveSettingsSQL,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  // Theme Effect
  useEffect(() => {
    if (settings?.theme && THEMES[settings.theme as keyof typeof THEMES]) {
      const themeColors = THEMES[settings.theme as keyof typeof THEMES];
      const root = document.documentElement;
      Object.entries(themeColors).forEach(([key, value]) => {
        root.style.setProperty(key, value as string);
      });
    }
  }, [settings?.theme]);

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    if (!settings) {
      console.error("[Settings] Cannot update: settings is null");
      return;
    }

    console.log("[Settings] Updating with:", newSettings);

    // Immediately apply theme if changed (optimistic update)
    if (newSettings.theme && THEMES[newSettings.theme]) {
      const themeColors = THEMES[newSettings.theme];
      const root = document.documentElement;
      Object.entries(themeColors).forEach(([key, value]) => {
        root.style.setProperty(key, value as string);
      });
    }

    // Handle language change side effects
    if (newSettings.language && newSettings.language !== settings.language) {
      console.log(`[Settings] Language changing to ${newSettings.language}`);
    }

    const merged = { ...settings, ...newSettings };

    // Critical: Save backup to LocalStorage immediately
    localStorage.setItem("vwo_elite_settings_backup", JSON.stringify(merged));

    mutation.mutate(merged, {
      onSuccess: () => console.log("[Settings] Save SUCCESS"),
      onError: (err) => console.error("[Settings] Save FAILED:", err),
    });
  };

  // ...

  const handleExportBackup = async () => {
    try {
      if (!window.vwoApi?.vault) {
        toast.error("Bak-up systeem niet beschikbaar.");
        return;
      }

      const success = await window.vwoApi.vault.export();
      if (success) {
        toast.success("Elite Vault succesvol geëxporteerd! 🍿🎬✨");
      }
    } catch (e) {
      console.error("Export failed", e);
      toast.error("Export van Elite Vault mislukt.");
    }
  };

  const handleImportBackup = async () => {
    try {
      if (!window.vwoApi?.vault) {
        toast.error("Herstel systeem niet beschikbaar.");
        return;
      }

      await window.vwoApi.vault.import();
    } catch (e) {
      console.error("Import failed", e);
      toast.error("Herstel van Elite Vault mislukt.");
    }
  };

  const handleFactoryReset = async () => {
    toast("Weet je het zeker? ALLES wordt gewist!", {
      action: {
        label: "Ja, Reset",
        onClick: () => {
          const req = indexedDB.deleteDatabase("VWOEliteSQLite");
          req.onsuccess = () => {
            window.location.href =
              window.location.origin + window.location.pathname;
          };
          req.onerror = () => {
            toast.error("Er ging iets mis bij het resetten. Probeer opnieuw.");
          };
        },
      },
      duration: 5000,
    });
  };

  return {
    settings: settings || DEFAULT_SETTINGS,
    updateSettings,
    exportBackup: handleExportBackup,
    importBackup: handleImportBackup,
    factoryReset: handleFactoryReset,
    themes: Object.keys(THEMES) as AppTheme[],
  };
};
