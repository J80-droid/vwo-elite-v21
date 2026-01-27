/* eslint-disable @typescript-eslint/no-explicit-any -- translation object type */
import type { UserSettings } from "@features/settings/types";
import { Activity, Mic } from "lucide-react";
import React from "react";

import { AutoSaveInput } from "../AutoSaveInput";
import { AutoSaveSlider } from "../AutoSaveSlider";

interface FocusTabProps {
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => void;
  t: any;
}

export const FocusTab: React.FC<FocusTabProps> = ({
  settings,
  updateSettings,
  t,
}) => {
  return (
    <div className="glass rounded-xl p-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">
        <Activity className="inline-block mr-2 text-blue-400" size={20} />
        {t.settings.focus.title}
      </h2>
      <p className="text-slate-400 mb-6 text-sm">{t.settings.focus.subtitle}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-obsidian-950 p-6 rounded-xl border border-white/10">
          <h3 className="font-bold text-white mb-4">
            {t.settings.focus.pomodoro_title}
          </h3>
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <label className="text-xs text-slate-500 block mb-1">
                {t.settings.focus.focus_label}
              </label>
              <AutoSaveInput
                type="number"
                value={settings.pomodoroWork}
                onSave={(val: string) =>
                  updateSettings({ pomodoroWork: parseInt(val) })
                }
                className="w-full bg-obsidian-900 border border-white/10 rounded px-3 py-2 text-white"
              />
            </div>
            <div className="text-slate-500 font-bold">/</div>
            <div className="flex-1">
              <label className="text-xs text-slate-500 block mb-1">
                {t.settings.focus.break_label}
              </label>
              <AutoSaveInput
                type="number"
                value={settings.pomodoroBreak}
                onSave={(val: string) =>
                  updateSettings({ pomodoroBreak: parseInt(val) })
                }
                className="w-full bg-obsidian-900 border border-white/10 rounded px-3 py-2 text-white"
              />
            </div>
          </div>
        </div>

        <div className="bg-obsidian-950 p-6 rounded-xl border border-white/10">
          <h3 className="font-bold text-white mb-4">
            {t.settings.focus.audio_title}
          </h3>
          <div className="mb-4">
            <label className="text-xs text-slate-500 block mb-2">
              {t.settings.focus.audio_mode}
            </label>
            <div className="flex rounded-lg p-1 border border-white/10">
              {(["off", "alpha", "gamma"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => updateSettings({ audioFocusMode: mode })}
                  className={`flex-1 py-1.5 text-xs rounded-md capitalize transition-all duration-300 ${settings.audioFocusMode === mode ? "text-violet-400 border border-violet-500/40 shadow-[0_0_12px_rgba(139,92,246,0.3)]" : "text-slate-500 hover:text-white border border-transparent"}`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-2">
              {t.settings.focus.audio_volume} ({settings.audioVolume || 50}%)
            </label>
            <AutoSaveSlider
              min="0"
              max="100"
              value={settings.audioVolume || 50}
              onChange={(val: number) => updateSettings({ audioVolume: val })}
              className="w-full accent-electric bg-obsidian-900 h-2 rounded-lg appearance-none"
            />
          </div>
        </div>
      </div>

      {/* Speech Recognition Toggle */}
      <div className="bg-obsidian-950 p-6 rounded-xl border border-white/10 mt-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-electric/10 rounded-xl text-electric">
            <Mic size={24} />
          </div>
          <div>
            <h3 className="font-bold text-white">Spraakbesturing</h3>
            <p className="text-xs text-slate-500">
              Zet de microfoon en spraakcommando's aan of uit.
            </p>
          </div>
        </div>
        <button
          onClick={() =>
            updateSettings({
              speechRecognitionEnabled: !settings.speechRecognitionEnabled,
            })
          }
          className={`w-14 h-7 rounded-full transition-all relative ${settings.speechRecognitionEnabled ? "bg-electric shadow-[0_0_15px_rgba(59,130,246,0.4)]" : "bg-slate-700"}`}
        >
          <div
            className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${settings.speechRecognitionEnabled ? "left-8 shadow-sm" : "left-1"}`}
          />
        </button>
      </div>
    </div>
  );
};
