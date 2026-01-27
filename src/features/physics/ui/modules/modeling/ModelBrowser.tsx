import { Clock, FileCode, FolderOpen, ShieldAlert, Trash2 } from "lucide-react";
import React from "react";

import { useModelStorage } from "./hooks/useModelStorage";
import { NumericalModel } from "./types";

interface Props {
  onLoad: (model: NumericalModel) => void;
  currentModelId?: string;
}

export const ModelBrowser: React.FC<Props> = ({ onLoad, currentModelId }) => {
  const { savedModels, deleteModel } = useModelStorage();

  // Sorteren: Scenario's eerst, dan nieuwste user files
  const sortedModels = [...savedModels].sort((a, b) => {
    if (a.type !== b.type) return a.type === "scenario" ? -1 : 1;
    return b.updatedAt - a.updatedAt;
  });

  return (
    <div className="flex flex-col h-full bg-obsidian-950 text-white">
      <div className="p-4 border-b border-white/10 bg-white/5">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <FolderOpen size={14} className="text-emerald-400" /> Model
          Bibliotheek
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
        {sortedModels.map((item) => (
          <div
            key={item.id}
            onClick={() => onLoad(item.model)}
            className={`
                            group relative p-3 rounded-xl border transition-all cursor-pointer
                            hover:border-emerald-500/50 hover:bg-white/5
                            ${currentModelId === item.id ? "border-emerald-500 bg-emerald-500/10" : "border-white/5 bg-black/20"}
                        `}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${item.type === "scenario" ? "bg-amber-500/10 text-amber-400" : "bg-blue-500/10 text-blue-400"}`}
                >
                  {item.type === "scenario" ? (
                    <ShieldAlert size={16} />
                  ) : (
                    <FileCode size={16} />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {item.name}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                    <Clock size={10} />{" "}
                    {new Date(item.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {item.type === "user" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Zeker weten?")) deleteModel(item.id);
                  }}
                  className="p-1.5 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            {item.description && (
              <p className="mt-2 text-xs text-slate-400 line-clamp-2 pl-11 border-l-2 border-white/5">
                {item.description}
              </p>
            )}

            {item.type === "scenario" && (
              <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
                Opgave
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
