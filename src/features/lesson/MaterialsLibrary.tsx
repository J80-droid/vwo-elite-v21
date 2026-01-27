import {
  useDeleteStudyMaterial,
  useStudyMaterials,
} from "@shared/hooks/useLocalData";
import { StudyMaterial } from "@shared/types/index";
import React, { useState } from "react";

interface MaterialsLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  t: {
    title?: string;
    search?: string;
    empty?: string;
    delete?: string;
    cancel?: string;
    delete_confirm?: string;
  };
}

export const MaterialsLibrary: React.FC<MaterialsLibraryProps> = ({
  isOpen,
  onClose,
  t,
}) => {
  const {
    data: materials = [],
    isLoading: loading,
    refetch,
  } = useStudyMaterials();
  const deleteMutation = useDeleteStudyMaterial();

  const [searchQuery, setSearchQuery] = useState("");
  const [materialToDelete, setMaterialToDelete] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      setMaterialToDelete(null);
      refetch();
    } catch (error) {
      console.error("Failed to delete material:", error);
    }
  };

  if (!isOpen) return null;

  // Filter by search query
  const filteredMaterials = materials.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.subject.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Group by subject
  const groupedMaterials = filteredMaterials.reduce(
    (acc, mat) => {
      const subject = mat.subject || "Overig";
      if (!acc[subject]) acc[subject] = [];
      acc[subject].push(mat);
      return acc;
    },
    {} as Record<string, StudyMaterial[]>,
  );

  const subjects = Object.keys(groupedMaterials).sort();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "image":
        return (
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
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
          </svg>
        );
      case "pdf":
        return (
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
        );
      default:
        return (
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
            <line x1="16" x2="8" y1="13" y2="13" />
            <line x1="16" x2="8" y1="17" y2="17" />
          </svg>
        );
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("nl-NL", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="glass p-6 rounded-xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-electric"
            >
              <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
            </svg>
            {t.title || "Materialen Bibliotheek"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" x2="6" y1="6" y2="18" />
              <line x1="6" x2="18" y1="6" y2="18" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder={t.search || "Zoek op naam of vak..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-obsidian-950 border border-obsidian-800 rounded-lg pl-10 pr-4 py-3 text-white outline-none focus:border-electric"
          />
        </div>

        {/* Stats */}
        <div className="flex gap-4 mb-4 text-sm">
          <span className="text-slate-400">
            Totaal:{" "}
            <span className="text-white font-medium">{materials.length}</span>{" "}
            materialen
          </span>
          <span className="text-slate-400">
            Vakken:{" "}
            <span className="text-white font-medium">{subjects.length}</span>
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <svg
                className="animate-spin h-8 w-8 text-electric"
                viewBox="0 0 24 24"
              >
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
            </div>
          ) : subjects.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mx-auto mb-4 opacity-50"
              >
                <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
              </svg>
              {t.empty || "Geen materialen gevonden"}
            </div>
          ) : (
            <div className="space-y-6">
              {subjects.map((subject) => (
                <div key={subject}>
                  <h3 className="text-lg font-semibold text-electric mb-3 flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                    </svg>
                    {subject}
                    <span className="text-sm text-slate-500 font-normal">
                      ({groupedMaterials[subject].length})
                    </span>
                  </h3>
                  <div className="grid gap-2">
                    {groupedMaterials[subject].map((mat: StudyMaterial) => (
                      <div
                        key={mat.id}
                        className="bg-obsidian-950 border border-obsidian-800 rounded-lg p-3 flex items-center gap-3 group hover:border-slate-600 transition-colors"
                      >
                        <div className="text-slate-400">
                          {getTypeIcon(mat.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm truncate">
                            {mat.name}
                          </p>
                          <p className="text-slate-500 text-xs">
                            {formatDate(mat.createdAt)}
                          </p>
                        </div>
                        <button
                          onClick={() => setMaterialToDelete(mat.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all"
                          title={t.delete || "Verwijderen"}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete Confirmation */}
        {materialToDelete && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
            <div className="bg-obsidian-900 p-6 rounded-xl max-w-sm text-center">
              <p className="text-white mb-4">
                {t.delete_confirm ||
                  "Weet je zeker dat je dit materiaal wilt verwijderen?"}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setMaterialToDelete(null)}
                  className="flex-1 bg-obsidian-800 text-white py-2 rounded-lg hover:bg-obsidian-700"
                >
                  {t.cancel || "Annuleren"}
                </button>
                <button
                  onClick={() => handleDelete(materialToDelete)}
                  className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
                >
                  {t.delete || "Verwijderen"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
