/* eslint-disable @typescript-eslint/no-explicit-any -- translation object type */
import { UserSettings } from "@features/settings/types";
import { Monitor } from "lucide-react";
import React from "react";

interface ShortcutsTabProps {
  settings: UserSettings;
  t: any;
}

export const ShortcutsTab: React.FC<ShortcutsTabProps> = ({ settings, t }) => {
  return (
    <div className="glass rounded-xl p-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">
        <Monitor className="inline-block mr-2 text-matrix-green" size={20} />
        {t.settings.tabs.shortcuts}
      </h2>
      <p className="text-slate-400 mb-6 text-sm">
        Elite users gebruiken geen muis.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(
          settings.shortcuts || {
            "Global Search": "Ctrl + K",
            "AI Assistant": "Ctrl + Enter",
            "Next Flashcard": "Space",
            "Toggle Sidebar": "Ctrl + B",
          },
        ).map(([action, key]) => (
          <div
            key={action}
            className="flex justify-between items-center p-4 bg-obsidian-950 border border-white/10 rounded-lg"
          >
            <span className="text-slate-300 font-mono">{action}</span>
            <kbd className="bg-slate-800 text-white px-2 py-1 rounded text-xs font-mono border border-white/20 shadow-sm">
              {key as string}
            </kbd>
          </div>
        ))}
      </div>
    </div>
  );
};
