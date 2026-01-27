import { Check, Pencil } from "lucide-react";
import React, { useEffect, useState } from "react";

interface ApiKeyInputProps {
  label: string;
  link: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showKey: boolean;
  onToggleShow: () => void;
}

export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({
  label,
  link,
  description,
  value,
  onChange,
  placeholder,
  showKey,
  onToggleShow,
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleBlur = () => {
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  const hasValue = localValue && localValue.length > 5;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center transition-all h-6">
        <label className="text-sm font-bold text-white flex items-center gap-2">
          {label}
          {hasValue && (
            <span className="text-matrix-green animate-in fade-in slide-in-from-left-2 duration-300 flex items-center gap-1 text-xs">
              <Check size={14} /> Gekoppeld
            </span>
          )}
        </label>
        {!hasValue && (
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-rose-400 hover:underline animate-in fade-in"
          >
            Vraag Key Aan (Gratis)
          </a>
        )}
      </div>
      <div
        className={`relative transition-all duration-300 ${hasValue ? "shadow-[0_0_20px_-5px_#39ff14] border-[#39ff14]" : ""}`}
      >
        <input
          type={showKey ? "text" : "password"}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`w-full bg-obsidian-950 border rounded-xl px-4 py-4 pr-12 text-white outline-none transition-all font-mono
                    ${
                      hasValue
                        ? "border-[#39ff14]/50 focus:border-[#39ff14] text-[#39ff14]"
                        : "border-white/10 focus:border-rose-500"
                    }`}
        />
        <button
          onClick={onToggleShow}
          className={`absolute right-4 top-1/2 -translate-y-1/2 hover:text-white transition-colors ${hasValue ? "text-[#39ff14]" : "text-slate-500"}`}
        >
          {showKey ? <Check size={20} /> : <Pencil size={20} />}
        </button>
      </div>
      {description && (
        <p className="text-[11px] text-slate-500">{description}</p>
      )}
    </div>
  );
};
