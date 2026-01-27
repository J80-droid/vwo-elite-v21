import { useModelRegistryStore } from "@shared/model/modelRegistryStore";
import { ModelCapability } from "@shared/types/ai-brain";
import { AnimatePresence, motion } from "framer-motion";
import {
  Brain,
  Code,
  Cpu,
  Database,
  Eye,
  type LucideIcon,
  Plus,
  Settings2,
  Trash2,
  Zap,
} from "lucide-react";
import { useState } from "react";

const CAPABILITIES: {
  type: ModelCapability;
  label: string;
  icon: LucideIcon;
  color: string;
}[] = [
    { type: "fast", label: "Speed / Chat", icon: Zap, color: "yellow" },
    {
      type: "reasoning",
      label: "Reasoning / Math",
      icon: Brain,
      color: "purple",
    },
    { type: "vision", label: "Vision / Image", icon: Eye, color: "pink" },
    { type: "code", label: "Coding", icon: Code, color: "blue" },
    {
      type: "embedding",
      label: "Memory Embeddings",
      icon: Database,
      color: "emerald",
    },
  ];

const MODULES = [
  "Physics",
  "Chemistry",
  "Biology",
  "MathLab",
  "Planner",
  "Research",
  "3D Studio",
];

export const PresetConfigurator = () => {
  const {
    presets,
    activePresetId,
    models,
    setActivePreset,
    addPreset,
    updatePreset,
    removePreset,
  } = useModelRegistryStore();

  const [isCreating, setIsCreating] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");

  const activePreset =
    presets.find((p) => p.id === activePresetId) || presets[0];

  // Safety check - should always have a preset
  if (!activePreset) return null;

  const handleCreatePreset = () => {
    if (!newPresetName.trim()) return;
    const id = addPreset({
      name: newPresetName,
      type: "custom",
      description: "Custom user preset",
      modelAssignments: {},
      maxParallelCloud: 3,
      localExecution: "linear",
      fallbackEnabled: true,
      isDefault: false,
      isBuiltIn: false,
    });
    setActivePreset(id);
    setNewPresetName("");
    setIsCreating(false);
  };

  const handleAssignmentChange = (type: ModelCapability, modelId: string) => {
    const assignments = { ...activePreset.modelAssignments };
    if (modelId === "auto") {
      delete assignments[type];
    } else {
      assignments[type] = modelId;
    }
    updatePreset(activePreset.id, { modelAssignments: assignments });
  };

  const handleAddOverride = () => {
    const overrides = activePreset.moduleOverrides
      ? { ...activePreset.moduleOverrides }
      : {};
    // Default new override
    if (!overrides["New Module"]) {
      overrides["New Module"] = {};
      updatePreset(activePreset.id, { moduleOverrides: overrides });
    }
  };

  const handleRemoveOverride = (moduleName: string) => {
    const overrides = activePreset.moduleOverrides
      ? { ...activePreset.moduleOverrides }
      : {};
    delete overrides[moduleName];
    updatePreset(activePreset.id, { moduleOverrides: overrides });
  };

  const updateOverrideModule = (oldName: string, newName: string) => {
    const overrides = activePreset.moduleOverrides
      ? { ...activePreset.moduleOverrides }
      : {};
    const data = overrides[oldName] || {};
    delete overrides[oldName];
    overrides[newName] = data;
    updatePreset(activePreset.id, { moduleOverrides: overrides });
  };

  const updateOverrideModel = (
    moduleName: string,
    type: ModelCapability,
    modelId: string,
  ) => {
    const overrides = activePreset.moduleOverrides
      ? { ...activePreset.moduleOverrides }
      : {};
    const moduleConfig = overrides[moduleName]
      ? { ...overrides[moduleName] }
      : {};

    if (modelId === "default") {
      delete moduleConfig[type];
    } else {
      moduleConfig[type] = modelId;
    }

    overrides[moduleName] = moduleConfig;
    updatePreset(activePreset.id, { moduleOverrides: overrides });
  };

  const getModelsForCap = (cap: ModelCapability) => {
    return models.filter((m) => m.capabilities.includes(cap));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* PRESET SELECTOR */}
      <div className="flex flex-col md:flex-row gap-4 items-end bg-zinc-950/50 p-6 rounded-2xl border border-white/10">
        <div className="flex-1 w-full space-y-2">
          <label className="text-xs font-mono text-slate-500 uppercase">
            Active Preset Profile
          </label>
          <div className="flex gap-2">
            <select
              value={activePresetId}
              onChange={(e) => setActivePreset(e.target.value)}
              className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-colors"
            >
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.isBuiltIn ? "(Built-in)" : ""}
                </option>
              ))}
            </select>
            <button
              onClick={() => setIsCreating(true)}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors"
              title="Create New Preset"
            >
              <Plus size={20} className="text-slate-400" />
            </button>
          </div>
        </div>

        {/* DELETE BUTTON (If custom) */}
        {!activePreset.isBuiltIn && (
          <button
            onClick={() => {
              if (confirm("Delete this preset?")) removePreset(activePreset.id);
            }}
            className="p-3 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-colors"
          >
            <Trash2 size={20} />
          </button>
        )}
      </div>

      {/* CREATE MODE */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-xl flex gap-4 items-center mb-6">
              <input
                type="text"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder="New Preset Name..."
                className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
              />
              <button
                onClick={handleCreatePreset}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold text-sm transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => setIsCreating(false)}
                className="text-slate-400 hover:text-white px-4 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ROUTING MATRIX */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* GLOBAL RULES */}
        <div className="bg-zinc-950/50 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
            <Cpu size={20} className="text-indigo-400" />
            <div>
              <h3 className="font-bold text-white">Global Routing Matrix</h3>
              <p className="text-xs text-slate-500">
                Default models per capability
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {CAPABILITIES.map((cap) => (
              <div key={cap.type} className="group">
                <div className="flex justify-between mb-1.5">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <cap.icon size={14} className={`text-${cap.color}-400`} />
                    <span>{cap.label}</span>
                  </div>
                </div>
                <select
                  value={activePreset.modelAssignments[cap.type] || "auto"}
                  onChange={(e) =>
                    handleAssignmentChange(cap.type, e.target.value)
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 group-hover:border-white/20 transition-colors"
                >
                  <option value="auto" className="text-slate-500">
                    Auto-Route (Best Available)
                  </option>
                  <optgroup label="Available Models">
                    {getModelsForCap(cap.type).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.provider})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* MODULE OVERRIDES */}
        <div className="bg-zinc-950/50 border border-white/10 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <Settings2 size={20} className="text-emerald-400" />
              <div>
                <h3 className="font-bold text-white">Module Overrides</h3>
                <p className="text-xs text-slate-500">
                  Exception rules per workspace
                </p>
              </div>
            </div>
            <button
              onClick={handleAddOverride}
              className="text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded border border-emerald-500/20 transition-colors"
            >
              + Add Rule
            </button>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-[400px]">
            {(!activePreset.moduleOverrides ||
              Object.keys(activePreset.moduleOverrides).length === 0) && (
                <div className="h-32 flex flex-col items-center justify-center text-slate-600 border border-dashed border-white/10 rounded-xl">
                  <Settings2 size={24} className="opacity-20 mb-2" />
                  <span className="text-xs">No active overrides</span>
                </div>
              )}

            {Object.entries(activePreset.moduleOverrides || {}).map(
              ([moduleName, config], idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 rounded-xl p-4 border border-white/5"
                >
                  <div className="flex justify-between items-center mb-3">
                    <select
                      value={moduleName}
                      onChange={(e) =>
                        updateOverrideModule(moduleName, e.target.value)
                      }
                      className="bg-transparent text-sm font-bold text-white outline-none border-b border-dashed border-slate-600 hover:border-white focus:border-emerald-500 pb-0.5"
                    >
                      <option value="New Module" disabled>
                        Select Module...
                      </option>
                      {MODULES.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleRemoveOverride(moduleName)}
                      className="text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {CAPABILITIES.slice(0, 3).map((cap) => (
                      <div key={cap.type} className="flex items-center gap-2">
                        <cap.icon
                          size={12}
                          className={`text-${cap.color}-400 shrink-0`}
                        />
                        <select
                          value={config[cap.type] || "default"}
                          onChange={(e) =>
                            updateOverrideModel(
                              moduleName,
                              cap.type,
                              e.target.value,
                            )
                          }
                          className="flex-1 bg-black/20 rounded px-2 py-1 text-xs text-slate-300 outline-none focus:bg-black/40"
                        >
                          <option value="default">Use Global Default</option>
                          {getModelsForCap(cap.type).map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
