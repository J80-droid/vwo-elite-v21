/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any -- catch block error types */
import {
  extractFromPDF,
  extractFromWikipedia,
  extractFromYouTube,
} from "@shared/api/contextExtractors";
import { ContextItem } from "@shared/hooks/useContextManager";
import {
  BookOpen,
  Check,
  Clipboard,
  FileText,
  Image,
  Link,
  Loader2,
  Plus,
  Trash2,
  Type,
  X,
  Youtube,
} from "lucide-react";
import React, { useRef, useState } from "react";

interface ContextManagerProps {
  isOpen: boolean;
  onClose: () => void;
  contexts: ContextItem[];
  onAddContext: (
    type: ContextItem["type"],
    title: string,
    content: string,
    imageBase64?: string,
  ) => void;
  onRemoveContext: (id: string) => void;
  onClearContexts: () => void;
  shouldPersist: boolean;
  onTogglePersist: () => void;
}

type ActiveInput = "text" | "url" | "youtube" | "wikipedia" | null;

export const ContextManager: React.FC<ContextManagerProps> = ({
  isOpen,
  onClose,
  contexts,
  onAddContext,
  onRemoveContext,
  onClearContexts,
  shouldPersist,
  onTogglePersist,
}) => {
  const [activeInput, setActiveInput] = useState<ActiveInput>(null);
  const [textInput, setTextInput] = useState("");
  const [textTitle, setTextTitle] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [youtubeInput, setYoutubeInput] = useState("");
  const [wikiInput, setWikiInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleAddText = () => {
    if (!textInput.trim()) return;
    const title = textTitle.trim() || "Notitie";
    onAddContext("text", title, textInput);
    setTextInput("");
    setTextTitle("");
    setActiveInput(null);
  };

  const handleAddClipboard = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        onAddContext("clipboard", "Klembord", text);
      } else {
        setError("Klembord is leeg");
      }
    } catch (err) {
      setError("Geen toegang tot klembord. Probeer handmatig plakken.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUrl = async () => {
    if (!urlInput.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      // Use a CORS proxy or backend endpoint for scraping
      const response = await fetch(
        `/api/scrape-url?url=${encodeURIComponent(urlInput)}`,
      );
      if (!response.ok) {
        throw new Error("Kon pagina niet ophalen");
      }
      const data = await response.json();
      const title = data.title || new URL(urlInput).hostname;
      onAddContext("url", title, data.content);
      setUrlInput("");
      setActiveInput(null);
    } catch (err: any) {
      // Fallback: just store the URL as context
      const hostname = new URL(urlInput).hostname;
      onAddContext(
        "url",
        hostname,
        `URL: ${urlInput}\n\n(Content kon niet worden opgehaald - de AI kan de URL mogelijk zelf bezoeken)`,
      );
      setUrlInput("");
      setActiveInput(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      const base64Data = base64.split(",")[1];
      onAddContext(
        "image",
        file.name,
        `[Afbeelding: ${file.name}]`,
        base64Data,
      );
      setIsLoading(false);
      setActiveInput(null);
    };
    reader.readAsDataURL(file);
  };

  // PDF file handler
  const handlePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    try {
      const result = await extractFromPDF(file);
      onAddContext("pdf", result.title, result.content);
    } catch (err: any) {
      setError(err.message || "Kon PDF niet lezen");
    } finally {
      setIsLoading(false);
      if (pdfInputRef.current) pdfInputRef.current.value = "";
    }
  };

  // YouTube handler
  const handleAddYouTube = async () => {
    if (!youtubeInput.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await extractFromYouTube(youtubeInput);
      onAddContext("youtube", result.title, result.content);
      setYoutubeInput("");
      setActiveInput(null);
    } catch (err: any) {
      setError(err.message || "Kon YouTube video niet verwerken");
    } finally {
      setIsLoading(false);
    }
  };

  // Wikipedia handler
  const handleAddWikipedia = async () => {
    if (!wikiInput.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await extractFromWikipedia(wikiInput);
      onAddContext("wikipedia", result.title, result.content);
      setWikiInput("");
      setActiveInput(null);
    } catch (err: any) {
      setError(err.message || "Kon Wikipedia artikel niet ophalen");
    } finally {
      setIsLoading(false);
    }
  };

  const contextSources = [
    {
      type: "text" as const,
      icon: Type,
      label: "TEXT",
      desc: "Notities toevoegen",
      color: "text-blue-400",
    },
    {
      type: "clipboard" as const,
      icon: Clipboard,
      label: "CLIPBOARD",
      desc: "Van klembord plakken",
      color: "text-green-400",
    },
    {
      type: "url" as const,
      icon: Link,
      label: "URL",
      desc: "Link naar website",
      color: "text-purple-400",
    },
    {
      type: "image" as const,
      icon: Image,
      label: "IMAGE",
      desc: "Afbeelding uploaden",
      color: "text-pink-400",
    },
    {
      type: "pdf" as const,
      icon: FileText,
      label: "PDF",
      desc: "PDF document lezen",
      color: "text-orange-400",
    },
    {
      type: "youtube" as const,
      icon: Youtube,
      label: "YOUTUBE",
      desc: "Video transcript",
      color: "text-red-400",
    },
    {
      type: "wikipedia" as const,
      icon: BookOpen,
      label: "WIKIPEDIA",
      desc: "Artikel ophalen",
      color: "text-cyan-400",
    },
  ];

  const getTypeIcon = (type: ContextItem["type"]) => {
    const iconMap: Record<
      ContextItem["type"],
      React.FC<{ size?: number | string; className?: string }>
    > = {
      text: Type,
      clipboard: Clipboard,
      url: Link,
      image: Image,
      file: FileText,
      pdf: FileText,
      youtube: Youtube,
      wikipedia: BookOpen,
    };
    const Icon = iconMap[type] || Type;
    return <Icon size={14} />;
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-obsidian-900 border border-obsidian-800 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-obsidian-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Plus className="text-electric" size={24} />
              Context Toevoegen
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Voeg extra context toe voor de AI
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-obsidian-950 px-3 py-1.5 rounded-lg border border-obsidian-800">
              <input
                type="checkbox"
                id="persistCtx"
                checked={shouldPersist}
                onChange={onTogglePersist}
                className="accent-electric cursor-pointer"
              />
              <label
                htmlFor="persistCtx"
                className="text-xs text-slate-400 cursor-pointer select-none"
              >
                Sessie bewaren
              </label>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-obsidian-800 text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-200px)]">
          {/* Context Source Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {contextSources.map((source) => (
              <button
                key={source.type}
                onClick={() => {
                  if (source.type === "clipboard") {
                    handleAddClipboard();
                  } else if (source.type === "image") {
                    fileInputRef.current?.click();
                  } else if (source.type === "pdf") {
                    pdfInputRef.current?.click();
                  } else if (
                    source.type === "text" ||
                    source.type === "url" ||
                    source.type === "youtube" ||
                    source.type === "wikipedia"
                  ) {
                    setActiveInput(source.type);
                  }
                }}
                disabled={isLoading}
                className={`p-4 rounded-xl border transition-all text-center group hover:scale-105 ${
                  activeInput === source.type
                    ? "bg-electric/20 border-electric"
                    : "bg-obsidian-950 border-obsidian-800 hover:border-slate-600"
                }`}
              >
                <source.icon
                  className={`mx-auto mb-2 ${source.color} group-hover:scale-110 transition-transform`}
                  size={28}
                />
                <div className="text-xs font-bold text-white">
                  {source.label}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {source.desc}
                </div>
              </button>
            ))}
          </div>

          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <input
            ref={pdfInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handlePDFUpload}
            className="hidden"
          />

          {/* Active Input Forms */}
          {activeInput === "text" && (
            <div className="bg-obsidian-950 rounded-xl p-4 border border-obsidian-800 mb-4">
              <input
                type="text"
                placeholder="Titel (optioneel)"
                value={textTitle}
                onChange={(e) => setTextTitle(e.target.value)}
                className="w-full bg-obsidian-900 border border-obsidian-700 rounded-lg px-4 py-2 mb-3 text-white focus:border-electric outline-none"
              />
              <textarea
                placeholder="Typ of plak je notities hier..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                rows={5}
                className="w-full bg-obsidian-900 border border-obsidian-700 rounded-lg px-4 py-3 text-white focus:border-electric outline-none resize-none"
              />
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => setActiveInput(null)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleAddText}
                  disabled={!textInput.trim()}
                  className="px-4 py-2 text-sm bg-electric text-white rounded-lg hover:bg-electric-glow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Check size={16} /> Toevoegen
                </button>
              </div>
            </div>
          )}

          {activeInput === "url" && (
            <div className="bg-obsidian-950 rounded-xl p-4 border border-obsidian-800 mb-4">
              <input
                type="url"
                placeholder="https://..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="w-full bg-obsidian-900 border border-obsidian-700 rounded-lg px-4 py-3 text-white focus:border-electric outline-none"
              />
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => setActiveInput(null)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleAddUrl}
                  disabled={!urlInput.trim() || isLoading}
                  className="px-4 py-2 text-sm bg-electric text-white rounded-lg hover:bg-electric-glow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Check size={16} />
                  )}
                  Toevoegen
                </button>
              </div>
            </div>
          )}

          {activeInput === "youtube" && (
            <div className="bg-obsidian-950 rounded-xl p-4 border border-obsidian-800 mb-4">
              <input
                type="url"
                placeholder="YouTube Video URL..."
                value={youtubeInput}
                onChange={(e) => setYoutubeInput(e.target.value)}
                className="w-full bg-obsidian-900 border border-obsidian-700 rounded-lg px-4 py-3 text-white focus:border-electric outline-none"
              />
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => setActiveInput(null)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleAddYouTube}
                  disabled={!youtubeInput.trim() || isLoading}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Check size={16} />
                  )}
                  Video Toevoegen
                </button>
              </div>
            </div>
          )}

          {activeInput === "wikipedia" && (
            <div className="bg-obsidian-950 rounded-xl p-4 border border-obsidian-800 mb-4">
              <input
                type="text"
                placeholder="Zoek onderwerp of plak Wikipedia URL..."
                value={wikiInput}
                onChange={(e) => setWikiInput(e.target.value)}
                className="w-full bg-obsidian-900 border border-obsidian-700 rounded-lg px-4 py-3 text-white focus:border-electric outline-none"
              />
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => setActiveInput(null)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleAddWikipedia}
                  disabled={!wikiInput.trim() || isLoading}
                  className="px-4 py-2 text-sm bg-[#3366cc] text-white rounded-lg hover:bg-[#4477dd] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Check size={16} />
                  )}
                  Artikel Toevoegen
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-2 mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Active Contexts List */}
          {contexts.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                  Actieve Context ({contexts.length})
                </h3>
                <button
                  onClick={onClearContexts}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                >
                  <Trash2 size={12} /> Alles wissen
                </button>
              </div>
              <div className="space-y-2">
                {contexts.map((ctx) => (
                  <div
                    key={ctx.id}
                    className="bg-obsidian-950 rounded-lg px-4 py-3 border border-obsidian-800 flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-slate-500">
                        {getTypeIcon(ctx.type)}
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm text-white font-medium truncate">
                          {ctx.title}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {ctx.preview}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => onRemoveContext(ctx.id)}
                      className="p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-obsidian-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-electric text-white rounded-lg font-medium hover:bg-electric-glow transition-colors flex items-center gap-2"
          >
            <Check size={18} />
            Klaar
          </button>
        </div>
      </div>
    </div>
  );
};
