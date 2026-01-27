import { AlertTriangle, Brain } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

import { useKnowledgeBase } from "./hooks/useKnowledgeBase";

export const DocumentUpload: React.FC = () => {
  const { addDocument, uploadProgress, uploadStage, uploadTimeRemaining } =
    useKnowledgeBase();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");

  // Batch State
  const [batchTotal, setBatchTotal] = useState(0);
  const [batchCurrent, setBatchCurrent] = useState(0);
  const [batchStartTime, setBatchStartTime] = useState(0);
  const [bytesProcessed, setBytesProcessed] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // Update timer for speed calculation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (uploadStatus === "uploading") {
      interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 500);
    }
    return () => clearInterval(interval);
  }, [uploadStatus]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      setUploadStatus("uploading");
      setBatchTotal(files.length);
      setBatchCurrent(0);
      setBytesProcessed(0);
      setBatchStartTime(Date.now());
      setCurrentTime(Date.now());

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (!file) continue;

          setBatchCurrent(i + 1);

          await addDocument(file);

          setBytesProcessed((prev) => prev + file.size);
        }
        setUploadStatus("success");
        setTimeout(() => {
          setUploadStatus("idle");
          setBatchTotal(0);
        }, 3000);
      } catch (error) {
        console.error("Upload failed:", error);
        setUploadStatus("error");
      }
    },
    [addDocument],
  );

  // Format speed
  const getSpeed = () => {
    if (batchStartTime === 0 || bytesProcessed === 0) return "0.0MB/s";
    const durationSeconds = (currentTime - batchStartTime) / 1000;
    if (durationSeconds <= 0) return "0.0MB/s";
    const mb = bytesProcessed / (1024 * 1024);
    return `${(mb / durationSeconds).toFixed(1)}MB/s`;
  };

  // File Input Handler (Refactored to match batch logic)
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const files = Array.from(e.target.files);
        setUploadStatus("uploading");
        setBatchTotal(files.length);
        setBatchCurrent(0);
        setBytesProcessed(0);
        setBatchStartTime(Date.now());
        setCurrentTime(Date.now());

        try {
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!file) continue;

            setBatchCurrent(i + 1);
            await addDocument(file);
            setBytesProcessed((prev) => prev + file.size);
          }
          setUploadStatus("success");
          setTimeout(() => {
            setUploadStatus("idle");
            setBatchTotal(0);
          }, 3000);
        } catch (error) {
          console.error("Upload failed:", error);
          setUploadStatus("error");
        }
      }
    },
    [addDocument],
  );

  return (
    <div
      className={`p-8 border-2 border-dashed rounded-lg transition-colors text-center cursor-pointer relative overflow-hidden
                ${isDragging ? "border-blue-500 bg-blue-50/10" : "border-gray-600 hover:border-blue-400"}
                ${uploadStatus === "error" ? "border-red-500" : ""}
                ${uploadStatus === "success" ? "border-green-500" : ""}
            `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById("file-input")?.click()}
    >
      <input
        type="file"
        id="file-input"
        multiple
        accept=".pdf,.docx,.txt"
        className="hidden"
        onChange={handleFileSelect}
      />

      {uploadStatus === "idle" && (
        <div>
          <p className="text-lg mb-2">Sleep bestanden hiernaartoe</p>
          <p className="text-sm text-gray-400">
            of klik om te selecteren (PDF, DOCX)
          </p>
        </div>
      )}

      {uploadStatus === "uploading" && (
        <div className="flex flex-col items-center gap-2">
          {/* Batch Counter UI */}
          <div className="text-xs font-mono text-blue-400 mb-2">
            Verwerkt: {batchCurrent} / {batchTotal} | {getSpeed()}
          </div>

          {/* Brain Icon with slow pulse animation */}
          <div className="relative mb-2">
            <Brain className="w-12 h-12 text-blue-500 animate-[pulse_3s_ease-in-out_infinite]" />
            <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-[pulse_3s_ease-in-out_infinite]" />
          </div>

          <p className="text-lg font-semibold animate-pulse">
            {uploadStage === "parsing" ? "Lezen..." : "Leren..."}
          </p>

          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>

          <div className="flex justify-between w-full text-xs text-gray-400">
            <span>{uploadProgress}% (Huidig bestand)</span>
            {uploadTimeRemaining > 0 && (
              <span>nog ~{uploadTimeRemaining} sec</span>
            )}
          </div>
        </div>
      )}

      {uploadStatus === "success" && (
        <div className="text-green-400">
          <p>✓ Upload voltooid!</p>
          <p className="text-xs">
            Documenten zijn toegevoegd aan de Knowledge Base.
          </p>
        </div>
      )}

      {uploadStatus === "error" && (
        <div className="text-red-400 flex flex-col items-center justify-center gap-2">
          <AlertTriangle className="w-8 h-8" />
          <p>Fout bij uploaden</p>
        </div>
      )}
    </div>
  );
};
