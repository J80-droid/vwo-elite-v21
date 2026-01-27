import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Code2, Info, Save, Trash2, X } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

import { MCPToolState, useMcpToolStore } from "@/shared/model/mcpToolStore";

interface ToolEditorModalProps {
  tool: Partial<MCPToolState> | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ToolEditorModal: React.FC<ToolEditorModalProps> = ({
  tool,
  isOpen,
  onClose,
}) => {
  const { addTool, updateTool, deleteTool } = useMcpToolStore();
  const [formData, setFormData] = useState<Partial<MCPToolState>>(
    tool || {
      name: "",
      description: "",
      category: "General",
      parameters_schema: JSON.stringify(
        { type: "object", properties: {} },
        null,
        2,
      ),
      handler_code:
        "return { success: true, message: 'Tool executed', params: params };",
      enabled: true,
    },
  );
  const [activeTab, setActiveTab] = useState<"meta" | "schema" | "code">(
    "meta",
  );

  // Reset form when tool prop changes (standard React pattern for state sync)
  const [prevToolId, setPrevToolId] = useState(tool?.id);
  if (tool?.id !== prevToolId) {
    setPrevToolId(tool?.id);
    setFormData(
      tool || {
        name: "",
        description: "",
        category: "General",
        parameters_schema: JSON.stringify(
          { type: "object", properties: {} },
          null,
          2,
        ),
        handler_code:
          "return { success: true, message: 'Tool executed', params: params };",
        enabled: true,
      },
    );
  }

  const handleSave = async () => {
    if (!formData.name) {
      toast.error("Tool name is required");
      return;
    }

    try {
      if (tool?.id) {
        await updateTool(tool.id, formData);
      } else {
        await addTool(formData);
      }
      onClose();
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  const handleDelete = async () => {
    if (
      tool?.id &&
      window.confirm("Are you sure you want to delete this tool?")
    ) {
      await deleteTool(tool.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-orange-500/10 to-transparent">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400">
                <Code2 size={20} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">
                  {tool?.id ? "Edit Tool" : "New MCP Tool"}
                </h3>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">
                  Registry v1.0 // {formData.name || "UNNAMED"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-full text-slate-500 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/5 bg-black/20">
            {(["meta", "schema", "code"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-xs font-bold uppercase tracking-tighter transition-all relative ${activeTab === tab
                    ? "text-orange-400"
                    : "text-slate-500 hover:text-slate-300"
                  }`}
              >
                {tab === "meta" && "Metadata"}
                {tab === "schema" && "Parameters"}
                {tab === "code" && "Handler Logic"}
                {activeTab === tab && (
                  <motion.div
                    layoutId="modalTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
            {activeTab === "meta" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                      Internal Name
                    </label>
                    <input
                      type="text"
                      value={formData.name || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm text-white focus:border-orange-500 outline-none transition-all font-mono"
                      placeholder="e.g. calculate_entropy"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category || "General"}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm text-white focus:border-orange-500 outline-none cursor-pointer"
                    >
                      <option className="bg-[#0f172a] text-white">General</option>
                      <option className="bg-[#0f172a] text-white">Education</option>
                      <option className="bg-[#0f172a] text-white">Math</option>
                      <option className="bg-[#0f172a] text-white">Science</option>
                      <option className="bg-[#0f172a] text-white">Language</option>
                      <option className="bg-[#0f172a] text-white">Research</option>
                      <option className="bg-[#0f172a] text-white">Planning</option>
                      <option className="bg-[#0f172a] text-white">Media</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm text-white focus:border-orange-500 outline-none h-32 resize-none"
                      placeholder="Describe what the tool does..."
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "schema" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-4">
                  <Info size={16} className="text-blue-400" />
                  <p className="text-[11px] text-blue-300">
                    Define the input parameters using JSON Schema. This tells
                    the AI how to call your tool.
                  </p>
                </div>
                <textarea
                  value={formData.parameters_schema || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      parameters_schema: e.target.value,
                    })
                  }
                  className="w-full bg-black border border-white/10 rounded-xl p-4 text-xs text-white font-mono focus:border-blue-500 outline-none h-96 resize-none"
                  spellCheck={false}
                />
              </div>
            )}

            {activeTab === "code" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl mb-4">
                  <AlertCircle size={16} className="text-orange-400" />
                  <p className="text-[11px] text-orange-300">
                    Current implementation uses safe dynamic execution. Access
                    input via the <code>params</code> object.
                  </p>
                </div>
                <div className="relative group">
                  <div className="absolute top-4 left-4 text-[10px] text-slate-700 font-mono z-10 pointer-events-none">
                    ASYNC HANDLER(params, services) {"{"}
                  </div>
                  <textarea
                    value={formData.handler_code || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, handler_code: e.target.value })
                    }
                    className="w-full bg-black border border-white/10 rounded-xl pt-10 pb-4 px-4 text-xs text-orange-200/90 font-mono focus:border-orange-500 outline-none h-96 resize-none"
                    spellCheck={false}
                  />
                  <div className="absolute bottom-4 left-4 text-[10px] text-slate-700 font-mono z-10 pointer-events-none">
                    {"}"}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/5 bg-black flex items-center justify-between">
            <div className="flex gap-2">
              {tool?.id && (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all"
                >
                  <Trash2 size={14} /> Delete
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-xl bg-white/5 text-slate-400 text-xs font-bold hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-8 py-2 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-black hover:bg-orange-500/20 transition-all shadow-[0_0_20px_rgba(249,115,22,0.1)]"
              >
                <Save size={14} /> Save Changes
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
