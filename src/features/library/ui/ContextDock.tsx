import {
  Archive,
  BookOpen,
  Clipboard,
  Database,
  Download,
  FileText,
  Folder,
  Github,
  Image as ImageIcon,
  Link,
  Save,
  Search,
  Type,
  Youtube,
} from "lucide-react";
import React from "react";

interface ContextDockProps {
  onAction: (id: string) => void;
}

export const ContextDock: React.FC<ContextDockProps> = ({ onAction }) => {
  const dockItems = [
    {
      id: "text",
      icon: Type,
      label: "TEXT",
      desc: "Add manual notes",
      color: "text-blue-400",
      border: "border-blue-500/30",
      bg: "bg-blue-500/10",
    },
    {
      id: "file",
      icon: FileText,
      label: "FILE",
      desc: "PDF, Word, Excel, PPT",
      color: "text-amber-400",
      border: "border-amber-500/30",
      bg: "bg-amber-500/10",
    },
    {
      id: "folder",
      icon: Folder,
      label: "FOLDER",
      desc: "Upload entire folder",
      color: "text-orange-400",
      border: "border-orange-500/30",
      bg: "bg-orange-500/10",
    },
    {
      id: "clipboard",
      icon: Clipboard,
      label: "CLIPBOARD",
      desc: "Paste from clipboard",
      color: "text-pink-400",
      border: "border-pink-500/30",
      bg: "bg-pink-500/10",
    },
    {
      id: "url",
      icon: Link,
      label: "URL",
      desc: "Link to a website",
      color: "text-cyan-400",
      border: "border-cyan-500/30",
      bg: "bg-cyan-500/10",
    },
    {
      id: "youtube",
      icon: Youtube,
      label: "YOUTUBE",
      desc: "Video info & metadata",
      color: "text-red-500",
      border: "border-red-500/30",
      bg: "bg-red-500/10",
    },
    {
      id: "wikipedia",
      icon: BookOpen,
      label: "WIKIPEDIA",
      desc: "Article extract",
      color: "text-slate-300",
      border: "border-slate-500/30",
      bg: "bg-slate-500/10",
    },
    {
      id: "github",
      icon: Github,
      label: "GITHUB",
      desc: "Scan repository (Full)",
      color: "text-purple-400",
      border: "border-purple-500/30",
      bg: "bg-purple-500/10",
    },
    {
      id: "zip",
      icon: Archive,
      label: "ZIP",
      desc: "Extract from archive",
      color: "text-yellow-200",
      border: "border-yellow-200/30",
      bg: "bg-yellow-200/10",
    },
    {
      id: "search",
      icon: Search,
      label: "SEARCH",
      desc: "Real-time web results",
      color: "text-teal-400",
      border: "border-teal-500/30",
      bg: "bg-teal-500/10",
    },
  ];

  const storageItems = [
    {
      id: "save",
      icon: Save,
      label: "SAVE SET",
      desc: "Save context set",
      color: "text-emerald-400",
      border: "border-emerald-500/30",
      bg: "bg-emerald-500/10",
    },
    {
      id: "load",
      icon: Download,
      label: "LOAD SET",
      desc: "Load saved set",
      color: "text-lime-400",
      border: "border-lime-500/30",
      bg: "bg-lime-500/10",
    },
  ];

  return (
    <div className="bg-[#050914] border border-white/5 rounded-2xl p-4 relative overflow-hidden shadow-2xl">
      {/* Background Grid Accent - More subtle as in image */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-4 mb-4 relative z-10 animate-in fade-in slide-in-from-left-4 duration-500">
        <div className="p-3.5 rounded-2xl bg-blue-500/20 border border-blue-500/30 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
          <Database size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase leading-none mb-1">
            Voeg Context Toe
          </h2>
          <p className="text-[10px] text-blue-400/50 font-black tracking-[0.2em] uppercase">
            Voeg bestanden, URL's of extra kennis toe voor de AI
          </p>
        </div>
      </div>

      {/* Layout Grid - matching the screenshot's columns/rows feel */}
      <div className="flex flex-col gap-2 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {[...dockItems].map((item) => (
            <button
              key={item.id}
              onClick={() => onAction(item.id)}
              className={`
                                group relative flex flex-col items-start justify-between min-h-[100px] p-4 rounded-2xl 
                                bg-white/[0.02] border border-white/[0.05]
                                hover:bg-white/[0.04] hover:border-white/10
                                transition-all duration-500 ease-out
                                hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] hover:-translate-y-1
                            `}
            >
              {/* Icon Box */}
              <div
                className={`p-2.5 rounded-xl mb-4 transition-all duration-500 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] ${item.bg} ${item.color}`}
              >
                <item.icon size={22} strokeWidth={2.5} />
              </div>

              {/* Text labels */}
              <div className="text-left">
                <div className="text-sm font-black text-white tracking-widest mb-1 items-center gap-2 flex">
                  {item.label}
                  <div
                    className={`w-1 h-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${item.bg.replace("10", "100")}`}
                  />
                </div>
                <div className="text-[10px] text-slate-500 font-bold leading-tight tracking-wide group-hover:text-slate-400 transition-colors">
                  {item.desc}
                </div>
              </div>

              {/* Hover Border Glow */}
              <div
                className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none border border-white/10`}
              />
            </button>
          ))}
        </div>

        {/* Storage / Meta Actions Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {storageItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onAction(item.id)}
              className={`
                                group flex flex-col items-start justify-between min-h-[100px] p-4 rounded-2xl 
                                bg-white/[0.02] border border-white/[0.05]
                                hover:bg-white/[0.04] hover:border-white/10
                                transition-all duration-500
                                hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] hover:-translate-y-1
                            `}
            >
              <div
                className={`p-2.5 rounded-xl mb-4 ${item.bg} ${item.color} group-hover:scale-110 transition-transform duration-500 uppercase`}
              >
                <item.icon size={22} strokeWidth={2.5} />
              </div>
              <div className="text-left">
                <div className="text-sm font-black text-white tracking-widest mb-1 uppercase">
                  {item.label}
                </div>
                <div className="text-[10px] text-slate-500 font-bold leading-tight tracking-wide uppercase">
                  {item.desc}
                </div>
              </div>
            </button>
          ))}

          {/* Placeholder for Vision as seen in UI image? If user has it. */}
          <button
            onClick={() => onAction("vision")}
            className={`
                            group flex items-center justify-center min-h-[100px] p-4 rounded-2xl 
                            bg-white/[0.01] border border-dashed border-white/5
                            hover:bg-white/5 hover:border-white/20 hover:border-solid
                            transition-all duration-500
                        `}
          >
            <ImageIcon
              size={24}
              className="text-slate-700 group-hover:text-pink-400 transition-colors"
            />
          </button>
        </div>
      </div>
    </div>
  );
};
