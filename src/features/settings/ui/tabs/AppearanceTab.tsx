/* eslint-disable @typescript-eslint/no-explicit-any -- translation object type */
import type { AppTheme, UserSettings } from "@features/settings/types";
import { Palette } from "lucide-react";
import React from "react";

interface AppearanceTabProps {
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => void;
  t: any;
  themes: AppTheme[];
}

export const AppearanceTab: React.FC<AppearanceTabProps> = ({
  settings,
  updateSettings,
  t,
  themes,
}) => {
  return (
    <div className="glass rounded-xl p-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">
        <Palette className="inline-block mr-2 text-cyan-400" size={20} />
        {t.settings.appearance.title}
      </h2>

      {/* Gamification Toggle */}
      <div className="mb-8 p-4 bg-obsidian-950 rounded-xl border border-white/10 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-white">
            {t.settings.appearance.gamification}
          </h3>
          <p className="text-xs text-slate-500">
            {t.settings.appearance.gamification_desc}
          </p>
        </div>
        <button
          onClick={() =>
            updateSettings({
              gamificationEnabled: !settings.gamificationEnabled,
            })
          }
          className={`w-12 h-6 rounded-full transition-all duration-300 relative border ${settings.gamificationEnabled ? "border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.4)]" : "border-white/20 bg-black"}`}
        >
          <div
            className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${settings.gamificationEnabled ? "left-6 bg-amber-400 shadow-[0_0_8px_currentColor]" : "left-0.5 bg-slate-500"}`}
          />
        </button>
      </div>

      <div className="mb-8 p-4 bg-obsidian-950 rounded-xl border border-white/10 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-white">
            {t.settings.appearance.graphics}
          </h3>
          <p className="text-xs text-slate-500">
            {t.settings.appearance.graphics_desc}
          </p>
        </div>
        <div className="flex rounded-lg p-1 border border-white/10">
          <button
            onClick={() => updateSettings({ graphicsQuality: "low" })}
            className={`px-3 py-1.5 text-xs rounded-md transition-all duration-300 ${settings.graphicsQuality === "low" ? "text-orange-400 border border-orange-500/40 shadow-[0_0_12px_rgba(249,115,22,0.3)]" : "text-slate-500 hover:text-white border border-transparent"}`}
          >
            Low (Saver)
          </button>
          <button
            onClick={() => updateSettings({ graphicsQuality: "high" })}
            className={`px-3 py-1.5 text-xs rounded-md transition-all duration-300 ${settings.graphicsQuality === "high" ? "text-orange-400 border border-orange-500/40 shadow-[0_0_12px_rgba(249,115,22,0.3)]" : "text-slate-500 hover:text-white border border-transparent"}`}
          >
            High (Ultra)
          </button>
        </div>
      </div>

      <h3 className="font-bold text-white mb-4">
        {t.settings.appearance.themes}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {themes.map((theme) => (
          <button
            key={theme}
            onClick={() => updateSettings({ theme })}
            className={`group relative p-4 rounded-xl border transition-all overflow-hidden ${settings.theme === theme
                ? "border-white ring-2 ring-white/20"
                : "border-white/10 hover:border-white/30"
              }`}
          >
            <div
              className={`absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity ${theme === "electric"
                  ? "bg-blue-500"
                  : theme === "cyberpunk"
                    ? "bg-pink-500"
                    : theme === "matrix"
                      ? "bg-green-500"
                      : theme === "gold"
                        ? "bg-yellow-500"
                        : "bg-rose-500"
                }`}
            />
            <div className="relative z-10 font-bold capitalize text-center text-white">
              {theme}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
