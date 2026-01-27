/* eslint-disable @typescript-eslint/no-explicit-any -- translation object type */
import type { UserSettings } from "@features/settings/types";
import { Activity, User } from "lucide-react";
import React from "react";

import { AutoSaveInput } from "../AutoSaveInput";

interface ProfileTabProps {
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => void;
  t: any;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  settings,
  updateSettings,
  t,
}) => {
  return (
    <div className="glass rounded-xl p-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">
        <User className="inline-block mr-2 text-electric" size={20} />
        {t.settings.profile.title}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400 ml-1">
              {t.settings.profile.name}
            </label>
            <AutoSaveInput
              value={settings.profile.name || ""}
              onSave={(val: string) =>
                updateSettings({ profile: { ...settings.profile, name: val } })
              }
              placeholder="Naam"
              className="w-full bg-obsidian-950 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-electric"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400 ml-1">
              {t.settings.profile.exam_year}
            </label>
            <AutoSaveInput
              type="number"
              value={settings.profile.examYear || ""}
              onSave={(val: string) =>
                updateSettings({
                  profile: { ...settings.profile, examYear: parseInt(val) },
                })
              }
              placeholder="Bijv. 2025"
              className="w-full bg-obsidian-950 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-electric"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400 ml-1">
              {t.settings.profile.profile_type}
            </label>
            <AutoSaveInput
              value={settings.profile.profile || ""}
              onSave={(val: string) =>
                updateSettings({
                  profile: { ...settings.profile, profile: val as any },
                })
              }
              placeholder="Bijv. NT"
              className="w-full bg-obsidian-950 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-electric"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400 ml-1">
              {t.settings.profile.app_language}
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() =>
                  updateSettings({
                    profile: { ...settings.profile, avatar: "./profilepic.jpg" },
                  })
                }
                className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${settings.profile.avatar === "./profilepic.jpg" ? "border-electric" : "border-transparent hover:border-white/20"}`}
              >
                <img
                  src="./profilepic.jpg"
                  alt="Default"
                  className="w-full h-full object-cover"
                />
              </button>
              {Array.from({ length: 10 }).map((_, i) => {
                const path = `./Profile${i + 2}.png`;
                return (
                  <button
                    key={path}
                    onClick={() =>
                      updateSettings({
                        profile: { ...settings.profile, avatar: path },
                      })
                    }
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${settings.profile.avatar === path ? "border-electric" : "border-transparent hover:border-white/20"}`}
                  >
                    <img
                      src={path}
                      alt={`Avatar ${i + 2}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Target Grades */}
      <div className="mt-8">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <Activity size={18} className="text-emerald-400" />
          {t.settings.profile.target_grades}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            "Nederlands",
            "Engels",
            "Wiskunde A/B",
            "Natuurkunde",
            "Scheikunde",
            "Biologie",
            "Economie",
            "Geschiedenis",
          ].map((subject) => (
            <div
              key={subject}
              className="bg-obsidian-950/50 p-3 rounded-lg border border-white/5"
            >
              <label className="block text-xs text-slate-400 mb-1">
                {subject}
              </label>
              <AutoSaveInput
                type="number"
                min="1"
                max="10"
                step="0.1"
                value={settings.profile.targetGrades?.[subject] || 7.5}
                onSave={(val: string) =>
                  updateSettings({
                    profile: {
                      ...settings.profile,
                      targetGrades: {
                        ...(settings.profile.targetGrades || {}),
                        [subject]: parseFloat(val),
                      },
                    },
                  })
                }
                className="w-full bg-transparent text-white font-bold outline-none border-b border-white/10 focus:border-electric"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
