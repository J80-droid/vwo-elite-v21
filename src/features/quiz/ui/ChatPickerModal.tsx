import { Check, MessageCircle, Search } from "lucide-react";
import React, { useMemo, useState } from "react";

import { StudyMaterial } from "../types";

interface ChatPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (materials: StudyMaterial[]) => void;
  materials: StudyMaterial[];
}

export const ChatPickerModal: React.FC<ChatPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  materials,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  // Filter to only chat-type materials
  const chatMaterials = useMemo(() => {
    let chats = (materials || []).filter((m) => m && m.type === "chat");
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      chats = chats.filter(
        (m) =>
          (m.name || "").toLowerCase().includes(query) ||
          (m.content || "").toLowerCase().includes(query),
      );
    }
    return chats;
  }, [materials, searchQuery]);

  const toggleChat = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    const selected = chatMaterials.filter((m) => selectedIds.has(m.id));
    onSelect(selected);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#050914] border border-white/10 rounded-3xl p-8 max-w-2xl w-full max-h-[80vh] flex flex-col shadow-3xl animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400">
              <MessageCircle size={24} />
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight">
              Kies Chat Context
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 text-slate-400"
          >
            ✕
          </button>
        </div>

        <div className="relative mb-6">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            size={18}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Zoek in chats..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
          {chatMaterials.map((chat) => (
            <button
              key={chat.id}
              onClick={() => toggleChat(chat.id)}
              className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-4 ${
                selectedIds.has(chat.id)
                  ? "border-indigo-500 bg-indigo-500/10"
                  : "border-white/5 bg-white/[0.02] hover:bg-white/5"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-1 ${
                  selectedIds.has(chat.id)
                    ? "bg-indigo-500 border-indigo-500"
                    : "border-slate-700"
                }`}
              >
                {selectedIds.has(chat.id) && (
                  <Check size={14} className="text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-white truncate">{chat.name}</h4>
                  <span className="text-[10px] font-black text-slate-500 uppercase">
                    {new Date(chat.createdAt || 0).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {chat.content}
                </p>
              </div>
            </button>
          ))}
          {chatMaterials.length === 0 && (
            <div className="text-center py-20 text-slate-500 font-bold uppercase tracking-widest text-xs opacity-50">
              Geen chats gevonden
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
          <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
            {selectedIds.size} geselecteerd
          </span>
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="px-6 py-3 text-slate-400 hover:text-white font-bold transition-colors uppercase text-xs tracking-widest"
            >
              Annuleren
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedIds.size === 0}
              className="px-10 py-3 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-xl transition-all uppercase text-xs tracking-widest shadow-lg shadow-indigo-500/20"
            >
              Bevestigen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
