/* eslint-disable @typescript-eslint/no-explicit-any */
import { FolderOpen, Plus, Sparkles, Trash2, X } from "lucide-react";
import React from "react";

interface MindMapSidebarProps {
  topic: string;
  setTopic: (t: string) => void;
  context: string;
  setContext: (c: string) => void;
  handleGenerate: () => void;
  isGenerating: boolean;
  selectedNode: any;
  setSelectedNode: (n: any) => void;
  handleExpandNode: () => void;
  savedMaps: any[];
  loadMap: (map: any) => void;
  deleteMap: (id: string) => void;
}

export const MindMapSidebar: React.FC<MindMapSidebarProps> = ({
  topic,
  setTopic,
  context,
  setContext,
  handleGenerate,
  isGenerating,
  selectedNode,
  setSelectedNode,
  handleExpandNode,
  savedMaps,
  loadMap,
  deleteMap,
}) => {
  return (
    <div className="h-full flex flex-col gap-4 p-4 bg-[#010409]">
      {/* Generator Panel */}
      <div className="bg-obsidian-900 border border-white/10 p-5 rounded-xl space-y-4 shadow-lg shrink-0">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
            Onderwerp
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Bijv. Franse Revolutie"
            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-3 text-white text-sm focus:border-electric outline-none transition-colors"
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
            Context (Optioneel)
          </label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Plak hier leerdoelen of tekst..."
            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-3 text-white text-sm focus:border-electric outline-none resize-none h-24"
          />
        </div>
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !topic}
          className="w-full bg-electric hover:bg-electric-glow text-obsidian-950 font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-electric/20 disabled:opacity-50"
        >
          {isGenerating ? (
            <span className="animate-pulse">AI Denkt na...</span>
          ) : (
            <>
              <Sparkles size={16} /> Genereer Map
            </>
          )}
        </button>
      </div>

      {/* Node Details or Saved Maps */}
      <div className="flex-1 bg-obsidian-900 border border-white/10 p-5 rounded-xl overflow-y-auto shadow-lg relative custom-scrollbar">
        {selectedNode ? (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-start mb-3 border-b border-white/10 pb-3">
              <h3 className="font-bold text-lg text-white">
                {selectedNode.label}
              </h3>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-500 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
              {selectedNode.details || "Geen extra details beschikbaar."}
            </p>
            <div className="mt-4 pt-4 border-t border-white/5">
              <button
                onClick={handleExpandNode}
                disabled={isGenerating}
                className="w-full py-2 bg-white/5 hover:bg-white/10 rounded text-xs font-bold text-electric flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-electric"></div>
                ) : (
                  <Plus size={14} />
                )}
                Genereer Sub-takken
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              <FolderOpen size={12} /> Bibliotheek
            </div>
            {savedMaps.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs italic">
                Nog geen opgeslagen maps.
              </div>
            ) : (
              savedMaps
                .sort((a, b) => b.timestamp - a.timestamp)
                .map((map) => (
                  <div
                    key={map.id}
                    className="p-3 bg-white/5 rounded-lg border border-white/5 hover:border-white/20 group"
                  >
                    <div className="flex justify-between items-start">
                      <div className="font-bold text-sm text-white">
                        {map.topic}
                      </div>
                      <button
                        onClick={() => deleteMap(map.id)}
                        className="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-[10px] text-slate-500">
                        {new Date(map.timestamp).toLocaleDateString()}
                      </div>
                      <button
                        onClick={() => loadMap(map)}
                        className="text-[10px] bg-electric/10 text-electric px-2 py-0.5 rounded hover:bg-electric/20 font-bold"
                      >
                        Laden
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
