import { UserSettings } from "@features/settings/types";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  Cpu,
  LayoutDashboard,
  Lock,
  MessageSquare,
  Save,
  Wrench,
} from "lucide-react";
import React, { useState } from "react";

import { PresetConfigurator } from "../components/PresetConfigurator";
import { AIDashboardSummary } from "./dashboard/AIDashboardSummary";
import { IntelligenceEngineMatrix } from "./matrix/IntelligenceEngineMatrix";
import { PersonaOrchestrator } from "./orchestra/PersonaOrchestrator";
import { ToolRegistry } from "./registry/ToolRegistry";
// Modular Tab Components
import { AdvancedTelemetry } from "./telemetry/AdvancedTelemetry";
import { APIKeyVault } from "./vault/APIKeyVault";

interface AIControlCenterProps {
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => void;
  t: (key: string) => string;
}

export const AIControlCenter: React.FC<AIControlCenterProps> = ({
  settings,
  updateSettings,
}) => {
  // NAVIGATION TABS
  const TABS = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, color: "cyan" },
    { id: "vault", label: "Vault", icon: Lock, color: "amber" },
    { id: "matrix", label: "Matrix", icon: Cpu, color: "emerald" },
    { id: "orchestra", label: "Orchestra", icon: MessageSquare, color: "blue" },
    { id: "registry", label: "Registry", icon: Wrench, color: "orange" },
    { id: "telemetry", label: "Telemetry", icon: BarChart3, color: "violet" },
    { id: "presets", label: "Presets", icon: Save, color: "rose" },
  ] as const;

  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["id"]>("dashboard");

  return (
    <div className="w-full max-w-[1400px] mx-auto pb-20 font-sans">
      {/* 1. ELITE TAB NAVIGATION */}
      <div className="flex items-center justify-center mb-10 mt-6">
        <div className="flex bg-black/40 backdrop-blur-md border border-white/10 p-1.5 rounded-full shadow-2xl">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                    relative flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300
                    ${active ? "text-white" : "text-slate-500 hover:text-slate-300"}
                `}
              >
                {active && (
                  <motion.div
                    layoutId="activeTabPill"
                    className={`absolute inset-0 bg-${tab.color}-500/10 border border-${tab.color}-500/20 rounded-full shadow-[0_0_20px_rgba(var(--color-${tab.color}-500),0.1)]`}
                    style={{ "--glow-color": `rgba(var(--color-${tab.color}-500), 0.2)` } as React.CSSProperties}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <tab.icon
                  size={16}
                  className={`relative z-10 ${active ? `text-${tab.color}-400` : ""}`}
                />
                <span className={`relative z-10 ${active ? `text-${tab.color}-100` : ""}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. TAB CONTENT PORTAL */}
      <div className="min-h-[600px] px-4 md:px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === "dashboard" && (
              <AIDashboardSummary settings={settings} updateSettings={updateSettings} />
            )}
            {activeTab === "vault" && (
              <APIKeyVault settings={settings} updateSettings={updateSettings} />
            )}
            {activeTab === "matrix" && (
              <IntelligenceEngineMatrix settings={settings} updateSettings={updateSettings} />
            )}
            {activeTab === "orchestra" && (
              <PersonaOrchestrator settings={settings} updateSettings={updateSettings} />
            )}
            {activeTab === "registry" && (
              <ToolRegistry />
            )}
            {activeTab === "telemetry" && (
              <AdvancedTelemetry />
            )}
            {activeTab === "presets" && (
              <PresetConfigurator />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
