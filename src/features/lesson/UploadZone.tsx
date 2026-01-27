/* eslint-disable @typescript-eslint/no-explicit-any */
import { useSaveStudyMaterial } from "@shared/hooks/useLocalData";
import { StudyMaterial } from "@shared/types/study";
import React, { useRef } from "react";

interface UploadZoneProps {
  subject: string;
  t: any;
  onUploadComplete: () => void;
}

/**
 * Drag-and-drop file upload zone for study materials
 */
export const UploadZone: React.FC<UploadZoneProps> = ({
  subject,
  t,
  onUploadComplete,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveMaterialMutation = useSaveStudyMaterial();

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1] || "");
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processFile = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    let type: "txt" | "image" | "pdf" = "txt";
    let content = "";

    if (ext === "txt") {
      content = await file.text();
      type = "txt";
    } else if (["png", "jpg", "jpeg", "webp"].includes(ext || "")) {
      content = await fileToBase64(file);
      type = "image";
    } else if (ext === "pdf") {
      content = await fileToBase64(file);
      type = "pdf";
    } else {
      return null;
    }

    const newMaterial: StudyMaterial = {
      id: crypto.randomUUID(),
      name: file.name,
      subject,
      type,
      content,
      date: new Date().toISOString(),
      createdAt: Date.now(),
    };

    return newMaterial;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files) as File[]) {
      const material = await processFile(file);
      if (material) {
        await saveMaterialMutation.mutateAsync(material);
      }
    }

    onUploadComplete();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove("border-electric", "bg-electric/10");

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files) as File[]) {
      const material = await processFile(file);
      if (material) {
        saveMaterialMutation.mutateAsync(material).then(onUploadComplete);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add("border-electric", "bg-electric/10");
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove("border-electric", "bg-electric/10");
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
      <p className="text-white font-medium">
        {t.lesson?.drop_files || "Klik of sleep bestanden hier"}
      </p>
      <p className="text-slate-500 text-sm mt-2">
        .txt, .png, .jpeg, .webp, .pdf
      </p>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".txt,.png,.jpg,.jpeg,.webp,.pdf"
        className="hidden"
        onChange={handleFileUpload}
      />
    </div>
  );
};
