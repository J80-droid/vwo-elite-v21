import React from "react";

interface ChatMessage {
  role: "user" | "ai";
  content: string;
}

interface ChatPanelProps {
  chatHistory: ChatMessage[];
  chatQuery: string;
  isAnalyzing: boolean;
  onQueryChange: (query: string) => void;
  onSend: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  chatHistory,
  chatQuery,
  isAnalyzing,
  onQueryChange,
  onSend,
}) => {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {chatHistory.length === 0 ? (
          <div className="text-center text-slate-500 mt-20">
            <p className="text-xl mb-2">Stel een vraag over je bronnen</p>
            <p className="text-sm">
              Bijv: "Wat zeggen deze papers over klimaatverandering?"
            </p>
            <p className="text-xs mt-4 opacity-50 text-yellow-500">
              Let op: Grote PDF's kunnen even duren.
            </p>
          </div>
        ) : (
          chatHistory.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-xl ${
                  msg.role === "user"
                    ? "bg-electric text-obsidian-950 font-medium"
                    : "bg-obsidian-950 text-slate-300 whitespace-pre-wrap border border-white/10"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
        {isAnalyzing && (
          <div className="flex justify-start">
            <div className="bg-obsidian-950 p-4 rounded-xl border border-white/10 text-slate-400 flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4 text-electric"
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
              Bronnen analyseren...
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={chatQuery}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSend()}
          placeholder="Stel een vraag aan je bronnen..."
          className="flex-1 bg-obsidian-950 border border-obsidian-800 rounded-lg px-4 py-3 text-white outline-none focus:border-electric"
        />
        <button
          onClick={onSend}
          disabled={isAnalyzing || !chatQuery.trim()}
          className="bg-electric hover:bg-electric-glow text-obsidian-950 font-bold px-6 py-3 rounded-lg disabled:opacity-50 transition-all"
        >
          Verzenden
        </button>
      </div>
    </div>
  );
};
