/**
 * FileUploadZone Component
 *
 * Drag & drop file upload zone for study materials.
 */

import React from "react";

interface FileUploadZoneProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileDrop: (files: FileList) => void;
  translations: {
    drop_files: string;
  };
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  fileInputRef,
  onFileUpload,
  onFileDrop,
  translations,
}) => {
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add("border-electric");
    e.currentTarget.classList.add("bg-electric/10");
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove("border-electric");
    e.currentTarget.classList.remove("bg-electric/10");
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove("border-electric");
    e.currentTarget.classList.remove("bg-electric/10");

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFileDrop(files);
    }
  };

  return (
    <div
      className="glass p-8 rounded-xl border-2 border-dashed border-obsidian-800 hover:border-electric/50 transition-colors cursor-pointer text-center"
      onClick={() => fileInputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="text-electric mb-4">
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
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" x2="12" y1="3" y2="15" />
        </svg>
      </div>
      <p className="text-white font-medium">{translations.drop_files}</p>
      <p className="text-slate-500 text-sm mt-2">
        .txt, .png, .jpeg, .webp, .pdf
      </p>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".txt,.png,.jpg,.jpeg,.webp,.pdf"
        className="hidden"
        onChange={onFileUpload}
      />
    </div>
  );
};
