import { StudyMaterial } from "@shared/types/study";
import React from "react";

interface SourcesPanelProps {
  sources: StudyMaterial[];
  onSummarize: (source: StudyMaterial) => void;
  onUpload: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const SourcesPanel: React.FC<SourcesPanelProps> = ({
  sources,
  onSummarize,
  onUpload,
  fileInputRef,
  onFileChange,
}) => {
  return (
    <>
      <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">
        Bronnen
      </h3>
      <div className="flex-1 overflow-y-auto space-y-2 mb-4 scrollbar-hide">
        {sources.map((s) => (
          <div
            key={s.id}
            className="group bg-obsidian-950 p-3 rounded text-sm text-slate-300 border border-white/5 hover:border-electric/30 transition-colors"
          >
            <div className="flex items-center gap-2 mb-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span className="truncate flex-1 font-medium" title={s.name}>
                {s.name}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSummarize(s);
              }}
              className="w-full text-xs bg-white/5 hover:bg-white/10 text-slate-400 py-1 rounded transition-colors opacity-0 group-hover:opacity-100"
            >
              Samenvatten
            </button>
          </div>
        ))}
        {sources.length === 0 && (
          <div className="text-center text-slate-500 py-8 text-sm">
            Nog geen bronnen.
            <br />
            Upload PDF's om te starten.
          </div>
        )}
      </div>

      <input
        type="file"
        accept=".pdf,.txt"
        multiple
        ref={fileInputRef}
        className="hidden"
        onChange={onFileChange}
      />
      <button
        onClick={onUpload}
        className="w-full bg-obsidian-800 hover:bg-obsidian-700 text-white py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
      >
        Bronnen Uploaden
      </button>
    </>
  );
};
