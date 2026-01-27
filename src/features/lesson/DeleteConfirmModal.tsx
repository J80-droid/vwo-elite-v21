import React from "react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  t: {
    delete_confirm_title?: string;
    delete_confirm_message?: string;
    cancel?: string;
    delete?: string;
  };
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  t,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="glass p-8 rounded-xl max-w-md w-full text-center">
        <div className="text-red-400 mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">
          {t.delete_confirm_title || "Les verwijderen?"}
        </h2>
        <p className="text-slate-400 mb-6">
          {t.delete_confirm_message ||
            "Weet je zeker dat je deze les wilt verwijderen? Dit kan niet ongedaan worden gemaakt."}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-obsidian-800 text-white py-3 rounded-lg font-medium hover:bg-obsidian-700"
          >
            {t.cancel || "Annuleren"}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-500 text-white py-3 rounded-lg font-bold hover:bg-red-600"
          >
            {t.delete || "Verwijderen"}
          </button>
        </div>
      </div>
    </div>
  );
};
