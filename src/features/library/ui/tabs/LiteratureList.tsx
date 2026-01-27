import {
  LiteratureItem,
  useLiteratureStore,
} from "@shared/model/literatureStore";
import html2pdf from "html2pdf.js";
import {
  AlertTriangle,
  BookOpen,
  Check,
  Edit3,
  FileDown,
  MessageCircle,
  Plus,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";
import React, { useState } from "react";

import { SUBJECT_THEME_CONFIG } from "../../types/library.types";

interface LiteratureListProps {
  subjectName: string;
  themeKey: string;
}

export const LiteratureList: React.FC<LiteratureListProps> = ({
  subjectName,
  themeKey,
}) => {
  const theme = SUBJECT_THEME_CONFIG[themeKey] || SUBJECT_THEME_CONFIG.default!;
  const { items, addItem, updateItem, deleteItem, getFinishedCount } =
    useLiteratureStore();

  const subjectItems = items[subjectName] || [];
  const finishedCount = getFinishedCount(subjectName);

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");

  const statusConfig = {
    unread: {
      label: "Te lezen",
      color: "text-slate-500",
      bg: "bg-slate-500/10",
    },
    reading: { label: "Bezig", color: "text-amber-400", bg: "bg-amber-500/10" },
    finished: {
      label: "Afgerond",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
  };

  const handleAddItem = () => {
    if (!newTitle.trim()) return;

    addItem(subjectName, {
      title: newTitle,
      author: newAuthor,
      status: "unread",
    });

    setNewTitle("");
    setNewAuthor("");
    setIsAddingNew(false);
  };

  const handleStatusChange = (
    id: string,
    currentStatus: LiteratureItem["status"],
  ) => {
    const statusOrder: LiteratureItem["status"][] = [
      "unread",
      "reading",
      "finished",
    ];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length]!;

    updateItem(subjectName, id, { status: nextStatus });
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Weet je zeker dat je dit boek wilt verwijderen?")) {
      deleteItem(subjectName, id);
    }
  };

  const handleExportPDF = () => {
    const element = document.getElementById("literature-list-container");
    const opt = {
      margin: 1,
      filename: `Leesdossier_${subjectName}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    };
    html2pdf().set(opt).from(element).save();
  };

  const totalRequired = subjectName === "Nederlands" ? 12 : 8; // VWO requirements

  return (
    <div
      id="literature-list-container"
      className="h-full flex flex-col gap-6 animate-in fade-in duration-500"
    >
      {/* Header Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${theme.bg}`}>
            <BookOpen size={24} className={theme.text} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">
              Literatuurlijst
            </h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              Mondeling Voorbereiding
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div
            className={`px-4 py-2 rounded-xl ${finishedCount >= totalRequired ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-amber-500/10 border border-amber-500/30"}`}
          >
            <span
              className={`text-sm font-black ${finishedCount >= totalRequired ? "text-emerald-400" : "text-amber-400"}`}
            >
              {finishedCount}/{totalRequired}
            </span>
            <span className="text-[10px] text-slate-500 font-bold uppercase ml-2">
              VEREIST
            </span>
          </div>
          <button
            onClick={handleExportPDF}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
            title="Exporteer naar PDF"
          >
            <FileDown size={20} />
          </button>
          <button
            onClick={() => setIsAddingNew(true)}
            className={`p-3 rounded-xl ${theme.bg} ${theme.text} hover:scale-105 active:scale-95 transition-all`}
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Add New Form */}
      {isAddingNew && (
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 animate-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Titel van het boek..."
              className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
            />
            <input
              type="text"
              value={newAuthor}
              onChange={(e) => setNewAuthor(e.target.value)}
              placeholder="Auteur..."
              className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleAddItem}
              className={`px-6 py-2 ${theme.bg} ${theme.text} rounded-xl font-bold text-sm uppercase tracking-widest`}
            >
              Toevoegen
            </button>
            <button
              onClick={() => setIsAddingNew(false)}
              className="px-6 py-2 bg-white/5 text-slate-400 rounded-xl font-bold text-sm uppercase tracking-widest"
            >
              Annuleren
            </button>
          </div>
        </div>
      )}

      {/* Literature List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
        {subjectItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-white/5 rounded-3xl p-10 text-center">
            <BookOpen size={48} className="mb-4 opacity-10" />
            <p className="text-sm font-bold uppercase tracking-widest opacity-50">
              Voeg je eerste boek toe aan je lijst
            </p>
          </div>
        ) : (
          subjectItems.map((item) => (
            <div
              key={item.id}
              className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl hover:bg-white/[0.04] transition-all group flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleStatusChange(item.id, item.status)}
                  className={`w-10 h-10 rounded-xl ${statusConfig[item.status].bg} flex items-center justify-center transition-all hover:scale-110`}
                >
                  {item.status === "finished" ? (
                    <Check
                      size={20}
                      className={statusConfig[item.status].color}
                    />
                  ) : item.status === "reading" ? (
                    <BookOpen
                      size={20}
                      className={statusConfig[item.status].color}
                    />
                  ) : (
                    <AlertTriangle
                      size={20}
                      className={statusConfig[item.status].color}
                    />
                  )}
                </button>
                <div>
                  <h4 className="font-black text-white text-base group-hover:text-blue-400 transition-colors">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    <span>{item.author}</span>
                    {item.period && (
                      <>
                        <span className="text-slate-700">•</span>
                        <span>{item.period}</span>
                      </>
                    )}
                    {item.theme && (
                      <>
                        <span className="text-slate-700">•</span>
                        <span className="text-slate-400">{item.theme}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {item.rating && (
                  <div className="flex items-center gap-1 mr-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={
                          i < item.rating!
                            ? "text-amber-400 fill-amber-400"
                            : "text-slate-700"
                        }
                      />
                    ))}
                  </div>
                )}
                <button className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-all">
                  <MessageCircle size={16} />
                </button>
                <button className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-all">
                  <Edit3 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 hover:bg-rose-500/10 rounded-lg text-slate-500 hover:text-rose-400 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* AI Insight Footer */}
      <div
        className={`bg-black/40 border ${theme.border} rounded-2xl p-5 flex items-start gap-4`}
      >
        <div className={`p-3 rounded-xl ${theme.bg}`}>
          <Sparkles size={20} className={theme.text} />
        </div>
        <div>
          <h4 className="text-sm font-black text-white uppercase tracking-tight mb-1">
            AI Mondeling Coach
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            {finishedCount < 3
              ? "Je hebt nog niet genoeg boeken gelezen. Streef naar minimaal 3 om een sterke basis te hebben voor je mondeling."
              : `Je hebt ${finishedCount} boeken afgerond. Overweeg om je thema's te vergelijken en een verbindend essay voor te bereiden.`}
          </p>
        </div>
      </div>
    </div>
  );
};
