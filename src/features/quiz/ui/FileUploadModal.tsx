/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { cascadeGenerate } from "@shared/api/aiCascadeService";
import { useSaveStudyMaterial } from "@shared/hooks/useLocalData";
import { useSettings } from "@shared/hooks/useSettings";
import { Check, FileText, Image, Loader2, Upload, X } from "lucide-react";
import React, { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (content: string, savedToLibrary: boolean) => void;
}

interface UploadedFile {
  file: File;
  preview?: string;
  extractedText?: string;
  fingerprint?: string;
  isProcessing: boolean;
  error?: string;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadComplete,
}) => {
  const { settings } = useSettings();
  const { mutateAsync: saveMaterial } = useSaveStudyMaterial();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [documentName, setDocumentName] = useState("");
  const [documentSubject, setDocumentSubject] = useState("");
  const [saveToLibrary, _setSaveToLibrary] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const calculateFingerprint = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  const processFile = async (file: File) => {
    const isImage = file.type.startsWith("image/");
    const isPDF = file.type === "application/pdf";

    if (!isImage && !isPDF) {
      toast.error("Alleen afbeeldingen en PDF-bestanden worden ondersteund.");
      return;
    }

    // Set initial name from filename
    setDocumentName(file.name.replace(/\.[^/.]+$/, ""));

    // Create preview for images
    let preview: string | undefined;
    if (isImage) {
      preview = URL.createObjectURL(file);
    }

    setUploadedFile({
      file,
      preview,
      isProcessing: true,
    } as UploadedFile);

    try {
      // 1. Calculate Fingerprint
      const fingerprint = await calculateFingerprint(file);

      // 2. Check for deduplication
      const { getMaterialByFingerprint } = await import(
        "@shared/api/indexedDBService"
      );
      const existing = await getMaterialByFingerprint(fingerprint);

      let extractedText = "";

      if (existing) {
        toast.success("Document herkend! Tekst hersteld uit bibliotheek.");
        extractedText = existing.content;
        setDocumentSubject(existing.subject as string);
        setDocumentName(existing.name || documentName);
      } else {
        // 3. Normal extraction
        if (isPDF) {
          extractedText = await extractTextFromPDF(file);
        } else if (isImage) {
          extractedText = await extractTextFromImage(file);
        }
      }

      setUploadedFile((prev) =>
        prev
          ? {
            ...prev,
            extractedText,
            fingerprint, // Temporarily store it here or handle separately
            isProcessing: false,
          }
          : null,
      );
    } catch (error: any) {
      console.error("Text extraction failed:", error);
      setUploadedFile((prev) =>
        prev
          ? {
            ...prev,
            isProcessing: false,
            error: error.message || "Kon tekst niet extraheren",
          }
          : null,
      );
    }
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    // Use pdf.js to extract text
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      fullText += pageText + "\n\n";
    }

    return fullText.trim();
  };

  const extractTextFromImage = async (file: File): Promise<string> => {
    // Convert image to base64
    await fileToBase64(file);

    // Use Gemini Vision for OCR
    const prompt = `Je bent een OCR-systeem. Extraheer ALLE tekst uit deze afbeelding.
Behoud de originele structuur zoveel mogelijk (paragrafen, lijsten, opsommingen).
Als er formules zijn, geef ze weer in LaTeX-notatie.
Geef alleen de geëxtraheerde tekst terug, geen extra uitleg.`;

    const response = await cascadeGenerate(
      prompt,
      "Je bent een OCR-specialist die tekst uit afbeeldingen haalt.",
      {
        aiConfig: settings.aiConfig,
        maxTokens: 4096,
      },
    );

    return response.content;
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleConfirm = async () => {
    if (!uploadedFile?.extractedText) return;

    setIsSaving(true);

    try {
      // Save to library if requested
      if (saveToLibrary) {
        await saveMaterial({
          id: `upload-${Date.now()}`,
          name: documentName || "Geüpload Document",
          subject: documentSubject || "Algemeen",
          type: uploadedFile.file.type.startsWith("image/")
            ? "afbeelding"
            : "pdf",
          content: uploadedFile.extractedText,
          date: new Date().toISOString(),
          createdAt: Date.now(),
          fileFingerprint: uploadedFile.fingerprint,
        });
      }

      onUploadComplete(uploadedFile.extractedText, saveToLibrary);
      handleClose();
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (uploadedFile?.preview) {
      URL.revokeObjectURL(uploadedFile.preview);
    }
    setUploadedFile(null);
    setDocumentName("");
    setDocumentSubject("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-500/20 rounded-lg">
              <Upload className="w-5 h-5 text-violet-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Materiaal Uploaden</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Zone */}
        {!uploadedFile ? (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 border-2 border-dashed border-gray-700 hover:border-violet-500 rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer transition-colors"
          >
            <Upload className="w-12 h-12 text-gray-500 mb-4" />
            <p className="text-white font-medium mb-2">
              Sleep je bestand hierheen
            </p>
            <p className="text-sm text-gray-400 mb-4">
              of klik om te selecteren
            </p>
            <div className="flex gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <FileText className="w-4 h-4" /> PDF
              </span>
              <span className="flex items-center gap-1">
                <Image className="w-4 h-4" /> Afbeeldingen
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-4">
            {/* File Info */}
            <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-xl">
              {uploadedFile.preview ? (
                <img
                  src={uploadedFile.preview}
                  alt="Preview"
                  className="w-16 h-16 object-cover rounded-lg"
                />
              ) : (
                <div className="w-16 h-16 bg-violet-500/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-8 h-8 text-violet-400" />
                </div>
              )}
              <div className="flex-1">
                <p className="font-medium text-white">
                  {uploadedFile.file.name}
                </p>
                <p className="text-sm text-gray-400">
                  {(uploadedFile.file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              {uploadedFile.isProcessing && (
                <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
              )}
              {uploadedFile.extractedText && (
                <Check className="w-5 h-5 text-emerald-400" />
              )}
            </div>

            {/* Processing Status */}
            {uploadedFile.isProcessing && (
              <div className="p-4 bg-violet-500/10 border border-violet-500/30 rounded-xl">
                <p className="text-violet-300 text-sm">
                  Tekst wordt geëxtraheerd... Dit kan even duren.
                </p>
              </div>
            )}

            {/* Error */}
            {uploadedFile.error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-red-300 text-sm">{uploadedFile.error}</p>
              </div>
            )}

            {/* Extracted Text Preview */}
            {uploadedFile.extractedText && (
              <>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">
                      Document Naam
                    </label>
                    <input
                      type="text"
                      value={documentName}
                      onChange={(e) => setDocumentName(e.target.value)}
                      placeholder="Bijv. Hoofdstuk 3 - Fotosynthese"
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">
                      Vak
                    </label>
                    <input
                      type="text"
                      value={documentSubject}
                      onChange={(e) => setDocumentSubject(e.target.value)}
                      placeholder="Bijv. Biologie, Natuurkunde"
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-4 bg-gray-800 rounded-xl max-h-48 overflow-y-auto">
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">
                    Geëxtraheerde tekst
                  </p>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap line-clamp-6">
                    {uploadedFile.extractedText.substring(0, 500)}
                    {uploadedFile.extractedText.length > 500 && "..."}
                  </p>
                </div>

                {/* Save to Library Toggle */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${saveToLibrary
                      ? "bg-violet-500 border-violet-500"
                      : "border-gray-600"
                      }`}
                  >
                    {saveToLibrary && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-gray-300">Opslaan in Bibliotheek</span>
                </label>
              </>
            )}
          </div>
        )}

        {/* Footer */}
        {uploadedFile?.extractedText && (
          <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-gray-700">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Annuleren
            </button>
            <button
              onClick={handleConfirm}
              disabled={isSaving}
              className="px-6 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 text-white font-bold rounded-lg transition-all flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Opslaan...
                </>
              ) : (
                "Genereer Quiz"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
