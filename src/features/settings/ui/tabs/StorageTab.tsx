/* eslint-disable @typescript-eslint/no-explicit-any -- translation object type */
import { Database, HardDrive } from "lucide-react";
import React from "react";

import { MemoryExplorer } from "../components/MemoryExplorer";

interface StorageTabProps {
  storageUsage: { used: number; quota: number } | null;
  t: any;
}

export const StorageTab: React.FC<StorageTabProps> = ({ storageUsage, t }) => {
  return (
    <div className="glass rounded-xl p-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">
        <HardDrive className="inline-block mr-2 text-slate-400" size={20} />
        {t.settings.tabs.storage}
      </h2>

      {/* Legacy Storage Bar */}
      <div className="p-6 bg-obsidian-950 rounded-xl border border-white/10 text-center mb-8">
        <div className="flex justify-between items-end mb-2">
          <div className="text-left">
            <div className="text-xs text-slate-500 uppercase">
              System Storage
            </div>
            <div className="text-2xl font-bold text-white">
              {storageUsage
                ? `${(storageUsage.used / (1024 * 1024)).toFixed(1)} MB`
                : "Calculating..."}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500 uppercase">Quota</div>
            <div className="text-white font-mono">
              {storageUsage
                ? (storageUsage.quota / (1024 * 1024 * 1024)).toFixed(1)
                : "0"}{" "}
              GB
            </div>
          </div>
        </div>

        {storageUsage && (
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-electric transition-all"
              style={{
                width: `${Math.min((storageUsage.used / storageUsage.quota) * 100, 100)}%`,
              }}
            />
          </div>
        )}
      </div>

      {/* Memory Explorer Integration */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Database className="text-slate-400" size={16} />
          <h3 className="text-sm font-bold text-slate-300 uppercase">
            Neural Memory Explorer
          </h3>
        </div>
        <MemoryExplorer />
      </div>
    </div>
  );
};
