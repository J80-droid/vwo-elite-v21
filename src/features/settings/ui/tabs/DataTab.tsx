import { DocumentUpload } from "@features/knowledge-base";
import type { UserSettings } from "@features/settings/types";
import {
  checkActiveHandle,
  connectToHarddisk,
} from "@shared/api/sqliteService";
import {
  AlertTriangle,
  Check,
  Database,
  Download,
  HardDrive,
  Loader2,
  Lock,
  Settings,
  Trash2,
  Unlock,
  Upload,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

import { NeuralDataExplorer } from "./NeuralDataExplorer";

interface DataTabProps {
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: Record<string, any>;
  exportBackup: () => void;
  importBackup: () => void;
  factoryReset: () => void;
}

export const DataTab: React.FC<DataTabProps> = ({
  settings,
  updateSettings,
  t,
  exportBackup,
  importBackup,
  factoryReset,
}) => {
  const [isDiskLinked, setIsDiskLinked] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isExpertMode, setIsExpertMode] = useState(false);

  // Local safety state voor reset
  const [resetConfirm, setResetConfirm] = useState(false);

  useEffect(() => {
    // Check of we al een actieve file handle hebben (Persistence over reloads)
    const init = async () => {
      try {
        const hasHandle = await checkActiveHandle();
        setIsDiskLinked(hasHandle);
      } catch (e) {
        console.error("Handle check failed", e);
      }
    };
    init();
  }, []);

  const handleDiskConnect = async () => {
    setIsConnecting(true);
    try {
      const success = await connectToHarddisk();
      if (success) {
        setIsDiskLinked(true);
        toast.success(
          "Harde schijf gekoppeld! Data wordt live gesynchroniseerd.",
        );
      } else {
        toast.error("Koppelen geannuleerd.");
      }
    } catch {
      toast.error("Fout bij koppelen harde schijf.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleFactoryReset = () => {
    if (!resetConfirm) {
      setResetConfirm(true);
      // Reset de confirm state na 3 seconden als ze niet klikken
      setTimeout(() => setResetConfirm(false), 3000);
      return;
    }
    factoryReset();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* HEADER WITH TOGGLE */}
      <div className="flex items-center justify-between bg-black/40 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div
            className={`p-3 rounded-xl ${isExpertMode ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-zinc-400"}`}
          >
            <Database size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">
              {isExpertMode
                ? "Neural Data Explorer"
                : t.settings?.tabs?.data || "Data & Opslag"}
            </h2>
            <p className="text-xs text-zinc-500 font-medium">
              {isExpertMode
                ? "Direct database access // High-Level clearance required"
                : "Manage backups and storage settings"}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpertMode(!isExpertMode)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-500 group relative overflow-hidden
            ${isExpertMode
              ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/30 font-black shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:bg-emerald-400/20"
              : "bg-white/5 text-zinc-400 border-white/10 font-bold hover:text-white hover:bg-white/10"
            }
          `}
        >
          {isExpertMode ? (
            <Unlock size={14} className="animate-pulse" />
          ) : (
            <Lock size={14} />
          )}
          <span className="text-[10px] uppercase tracking-[0.15em] shrink-0">
            {isExpertMode ? "Expert Access Active" : "Expert Access Locked"}
          </span>
          {isExpertMode && (
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent pointer-events-none" />
          )}
        </button>
      </div>

      {isExpertMode ? (
        <div className="space-y-6">
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-4">
            <AlertTriangle
              className="text-amber-500 shrink-0 mt-0.5"
              size={18}
            />
            <div>
              <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest mb-1">
                Elite Warning: Unrestricted Data Access
              </h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                You are entering the **Neural Core**. Changes made here are
                persisted directly to the SQLite database. Corrupting these
                records can lead to application instability, loss of streak, or
                profile corruption.
                <span className="text-amber-500/80 font-bold">
                  {" "}
                  Proceed with mathematical precision.
                </span>
              </p>
            </div>
          </div>
          <NeuralDataExplorer />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: SETTINGS & STORAGE */}
          <div className="space-y-6">
            <div className="bg-black/40 border border-white/10 rounded-2xl p-6 h-full">
              <h3 className="text-white font-black flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400 mb-6">
                System Engines
              </h3>

              <div className="space-y-6">
                {/* PYTHON MODE SELECTOR */}
                <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-sm">
                      Python Runtime
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Toggle between standard and data science environments.
                    </p>
                  </div>
                  <select
                    value={settings.pythonMode || "standard"}
                    onChange={(e) =>
                      updateSettings({
                        pythonMode: e.target.value as
                          | "standard"
                          | "scientific",
                      })
                    }
                    className="bg-black border border-cyan-500/30 rounded-xl px-4 py-2 text-xs text-cyan-400 outline-none focus:border-cyan-400/50 transition-all cursor-pointer appearance-none"
                    style={{ colorScheme: "dark" }}
                  >
                    <option value="standard">Standard (Lite)</option>
                    <option value="scientific">Data Science (Full)</option>
                  </select>
                </div>

                {/* Hard Disk Sync */}
                <div className="p-4 border border-indigo-500/30 bg-indigo-500/5 rounded-xl flex justify-between items-center transition-colors hover:bg-indigo-500/10">
                  <div>
                    <h4 className="font-bold text-indigo-100 flex items-center gap-2 text-sm">
                      <HardDrive size={14} /> Harddisk Live-Sync
                    </h4>
                    <p className="text-[10px] text-indigo-200/70 mt-1">
                      Mirror SQLite data to your local filesystem.
                    </p>
                  </div>
                  <button
                    onClick={handleDiskConnect}
                    disabled={isConnecting}
                    className={`flex items-center gap-2 text-[10px] uppercase tracking-widest px-4 py-2 rounded-lg transition-all duration-300 font-black border ${isDiskLinked
                      ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/5 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                      : "text-indigo-400 border-indigo-400/30 bg-indigo-400/5 hover:bg-indigo-400/10 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                      }`}
                  >
                    {isConnecting ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : isDiskLinked ? (
                      <Check size={12} />
                    ) : (
                      <Settings size={12} />
                    )}
                    {isConnecting
                      ? "Syncing"
                      : isDiskLinked
                        ? "Linked"
                        : "Link Disk"}
                  </button>
                </div>

                {/* Knowledge Base Ingestion */}
                <div className="p-4 border border-blue-500/30 bg-blue-500/5 rounded-xl transition-colors hover:bg-blue-500/10">
                  <h4 className="font-bold text-blue-100 flex items-center gap-2 text-sm mb-3">
                    <Upload size={14} /> Knowledge Injection
                  </h4>
                  <DocumentUpload />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: BACKUP & DANGER */}
          <div className="space-y-6">
            <div className="bg-black/40 border border-white/10 rounded-2xl p-6">
              <h3 className="text-white font-black text-sm uppercase tracking-widest text-slate-400 mb-6">
                Vault Management
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <button
                  onClick={exportBackup}
                  className="p-6 border border-white/5 rounded-2xl bg-white/5 hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-3 group text-center"
                >
                  <Download
                    size={28}
                    className="text-cyan-400 group-hover:scale-110 transition-transform"
                  />
                  <div>
                    <span className="block font-black text-white text-[10px] uppercase tracking-widest">
                      Execute Backup
                    </span>
                    <span className="block text-[10px] text-slate-500 mt-1">
                      Saves as .JSON
                    </span>
                  </div>
                </button>

                <button
                  onClick={importBackup}
                  className="p-6 border border-white/5 rounded-2xl bg-white/5 hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-3 group text-center"
                >
                  <Upload
                    size={28}
                    className="text-emerald-400 group-hover:scale-110 transition-transform"
                  />
                  <div>
                    <span className="block font-black text-white text-[10px] uppercase tracking-widest">
                      Restore Vault
                    </span>
                    <span className="block text-[10px] text-slate-500 mt-1">
                      Load .VWO-VAULT
                    </span>
                  </div>
                </button>
              </div>

              {/* DANGER ZONE */}
              <div
                className={`p-5 border rounded-2xl flex justify-between items-center transition-all duration-300
                  ${resetConfirm ? "bg-rose-500/20 border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.2)]" : "bg-rose-500/5 border-rose-500/20"}
                `}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-2 rounded-lg ${resetConfirm ? "bg-rose-500 text-white" : "bg-rose-500/20 text-rose-500"}`}
                  >
                    <Trash2 size={18} />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-xs uppercase tracking-widest flex items-center gap-2">
                      {resetConfirm && (
                        <AlertTriangle
                          size={14}
                          className="animate-pulse text-rose-500"
                        />
                      )}
                      Factory Reset
                    </h3>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      {resetConfirm
                        ? "ABORT NOW OR CONFIRM TOTAL WIPE"
                        : "Purge all local data and configurations"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleFactoryReset}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all duration-300 font-black text-[10px] uppercase tracking-wider border
                      ${resetConfirm ? "bg-rose-500 text-white border-rose-400 shadow-lg animate-pulse" : "text-rose-500 border-rose-500/30 hover:bg-rose-500/10"}
                  `}
                >
                  {resetConfirm ? "YES, WIPE SYSTEM" : "Reset App"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
