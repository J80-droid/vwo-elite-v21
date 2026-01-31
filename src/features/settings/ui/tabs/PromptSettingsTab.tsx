/* eslint-disable @typescript-eslint/no-explicit-any -- translation object type */
import {
  getBasePrompt,
  getRolePrompts,
  PromptRole,
} from "@shared/lib/constants/systemPrompts";
import { Language, UserSettings } from "@shared/types";
import { BrainCircuit, Cpu, Mic } from "lucide-react";
import React from "react";

import { PromptEditor } from "../../ui/PromptEditor";

interface PromptSettingsTabProps {
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => void;
  t: any;
}

export const PromptSettingsTab: React.FC<PromptSettingsTabProps> = ({
  settings,
  updateSettings,
  t,
}) => {
  return (
    <div className="glass rounded-xl p-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4 flex justify-between items-center">
        <span className="flex items-center gap-2">
          <Cpu className="text-violet-400" size={20} />
          {t.settings.tabs.prompts}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (confirm(t.settings.common.confirm_reset)) {
                updateSettings({
                  aiConfig: {
                    ...settings.aiConfig,
                    customPrompts: {},
                  } as any,
                });
              }
            }}
            className="text-xs bg-white/5 hover:bg-white/10 text-slate-400 px-3 py-1 rounded-full border border-white/10 transition-colors"
          >
            {t.settings.common.reset_standard}
          </button>
        </div>
      </h2>

      <div className="space-y-8">
        {/* Base System Prompt Editor */}
        <div>
          <label className="block text-sm font-medium text-electric mb-2 flex items-center gap-2">
            <BrainCircuit size={16} /> {t.settings.prompts.base_title}
          </label>
          <p className="text-xs text-slate-500 mb-2">
            {t.settings.prompts.base_subtitle}
          </p>
          <PromptEditor
            value={
              settings.aiConfig.customBasePrompt ||
              getBasePrompt((settings.language || "nl") as Language)
            }
            onChange={(val: string) => {
              updateSettings({
                aiConfig: {
                  ...settings.aiConfig,
                  customBasePrompt: val,
                },
              });
            }}
            height="300px"
          />
        </div>

        <div className="h-px bg-white/5 my-4" />

        {/* Socratic Coach Greeting Settings */}
        <div className="bg-obsidian-950/50 p-6 rounded-xl border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Mic size={18} className="text-electric" />
              <div>
                <h3 className="text-sm font-medium text-white">Socratic Coach: Begroeting</h3>
                <p className="text-[10px] text-slate-500">Coach spreekt de student als eerste aan bij aanvang.</p>
              </div>
            </div>
            <button
              onClick={() =>
                updateSettings({
                  aiConfig: {
                    ...settings.aiConfig,
                    promptConfig: {
                      ...settings.aiConfig.promptConfig,
                      coachSpeaksFirst: !settings.aiConfig.promptConfig.coachSpeaksFirst,
                    },
                  },
                })
              }
              className={`w-12 h-6 rounded-full transition-all relative ${settings.aiConfig.promptConfig.coachSpeaksFirst ? "bg-electric" : "bg-slate-700"}`}
            >
              <div
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.aiConfig.promptConfig.coachSpeaksFirst ? "left-7" : "left-1"}`}
              />
            </button>
          </div>

          {settings.aiConfig.promptConfig.coachSpeaksFirst && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex justify-between items-center">
                <label className="text-xs text-slate-400">Custom Begroeting:</label>
                <button
                  onClick={() =>
                    updateSettings({
                      aiConfig: {
                        ...settings.aiConfig,
                        promptConfig: {
                          ...settings.aiConfig.promptConfig,
                          coachGreeting: "Hoi, hoe gaat het? Waarmee kan ik ik jou helpen vandaag?",
                        },
                      },
                    })
                  }
                  className="text-[10px] text-slate-500 hover:text-white transition-colors"
                >
                  Reset naar default
                </button>
              </div>
              <PromptEditor
                value={settings.aiConfig.promptConfig.coachGreeting || ""}
                onChange={(val: string) =>
                  updateSettings({
                    aiConfig: {
                      ...settings.aiConfig,
                      promptConfig: {
                        ...settings.aiConfig.promptConfig,
                        coachGreeting: val,
                      },
                    },
                  })
                }
                height="100px"
                placeholder="Typ hier de begroeting..."
              />
            </div>
          )}
        </div>

        <div className="h-px bg-white/5 my-4" />

        {/* Role Prompts */}
        {Object.entries(settings.aiConfig.customPrompts || {}).map(
          ([key, value]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {t.settings.prompts[
                  key as keyof typeof t.settings.profile.prompts
                ] || key.replace(/_/g, " ")}
              </label>
              <PromptEditor
                value={
                  (value as string) ||
                  ((getRolePrompts((settings.language || "nl") as Language)[
                    key as PromptRole
                  ] || "") as string)
                }
                onChange={(val: string) => {
                  const newPrompts = {
                    ...settings.aiConfig.customPrompts,
                    [key]: val,
                  };
                  updateSettings({
                    aiConfig: {
                      ...settings.aiConfig,
                      customPrompts: newPrompts,
                    },
                  });
                }}
                height="200px"
              />
            </div>
          ),
        )}
      </div>
    </div>
  );
};
