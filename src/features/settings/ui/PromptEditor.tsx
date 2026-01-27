import React from "react";

interface PromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: string;
  placeholder?: string;
}

export const PromptEditor: React.FC<PromptEditorProps> = ({
  value,
  onChange,
  height = "200px",
  placeholder = "Enter prompt...",
}) => {
  return (
    <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/20 focus-within:border-indigo-500/50 transition-colors">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent p-4 text-sm font-mono text-slate-300 resize-none outline-none custom-scrollbar"
        style={{ height }}
        placeholder={placeholder}
        spellCheck={false}
      />
      <div className="absolute bottom-2 right-2 text-[10px] text-slate-600 pointer-events-none">
        {value.length} chars
      </div>
    </div>
  );
};
