/**
 * MaterialGrid Component
 *
 * Displays study materials in a grid with selection and search.
 */

import { StudyMaterial } from "@shared/types/study";
import React from "react";

import { ProgressBar } from "./ProgressBar";

interface MaterialGridProps {
  materials: StudyMaterial[];
  selectedMaterials: Set<string>;
  searchQuery: string;
  loading: boolean;
  progress: number;
  progressStatus: string;
  onSearchChange: (query: string) => void;
  onToggleSelection: (id: string) => void;
  onDeleteMaterial: (id: string) => void;
  onGenerateLesson: () => void;
  translations: {
    library: string;
    search: string;
    generating: string;
    generate_btn: string;
  };
}

export const MaterialGrid: React.FC<MaterialGridProps> = ({
  materials,
  selectedMaterials,
  searchQuery,
  loading,
  progress,
  progressStatus,
  onSearchChange,
  onToggleSelection,
  onDeleteMaterial,
  onGenerateLesson,
  translations,
}) => {
  if (materials.length === 0) return null;

  return (
    <div className="glass p-6 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">{translations.library}</h2>
        <input
          type="text"
          placeholder={translations.search}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="bg-obsidian-950 border border-obsidian-800 rounded-lg px-4 py-2 text-sm outline-none focus:border-electric w-48"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {materials.map((mat) => (
          <div
            key={mat.id}
            onClick={() => onToggleSelection(mat.id)}
            className={`p-4 rounded-lg cursor-pointer transition-all ${
              selectedMaterials.has(mat.id)
                ? "bg-electric/20 border-electric"
                : "bg-obsidian-950 border-obsidian-800"
            } border flex items-center gap-3 group`}
          >
            <div
              className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                selectedMaterials.has(mat.id)
                  ? "bg-electric border-electric"
                  : "border-slate-600"
              }`}
            >
              {selectedMaterials.has(mat.id) && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white truncate text-sm font-medium">
                {mat.name}
              </p>
              <p className="text-slate-500 text-xs">{mat.type.toUpperCase()}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteMaterial(mat.id);
              }}
              className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-400"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {selectedMaterials.size > 0 && (
        <div className="mt-6 space-y-4">
          {loading && (
            <ProgressBar progress={progress} status={progressStatus} />
          )}

          <div className="flex justify-center">
            <button
              onClick={onGenerateLesson}
              disabled={loading}
              className="bg-electric hover:bg-electric-glow text-white px-8 py-3 rounded-full font-bold disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  {translations.generating}
                </>
              ) : (
                <>
                  {translations.generate_btn} ({selectedMaterials.size})
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
