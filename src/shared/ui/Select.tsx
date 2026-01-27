import { useClickOutside } from "@shared/hooks/useClickOutside";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { useRef, useState } from "react";

interface SelectOption {
  value: string;
  label: React.ReactNode;
}

interface Props {
  options: (string | SelectOption)[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  renderOption?: (option: SelectOption) => React.ReactNode;
}

export const CustomSelect = ({
  options,
  value,
  onChange,
  placeholder = "Selecteer...",
  renderOption,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useClickOutside(containerRef as React.RefObject<HTMLElement>, () =>
    setIsOpen(false),
  );

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setIsOpen(false);
          if (e.key === "ArrowDown" && !isOpen) setIsOpen(true);
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full bg-black/40 border ${isOpen ? "border-indigo-500 ring-1 ring-indigo-500/50" : "border-white/10"} rounded-xl px-4 py-2.5 text-white cursor-pointer flex justify-between items-center transition-all group hover:bg-black/60 hover:border-white/20`}
      >
        <span className={!value ? "text-slate-500" : ""}>
          {value || placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`text-slate-500 transition-transform duration-300 ${isOpen ? "rotate-180 text-indigo-400" : "group-hover:text-slate-300"}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-[#1a1b26] border border-white/10 rounded-xl shadow-xl shadow-black/50 overflow-hidden max-h-60 overflow-y-auto custom-scrollbar"
            role="listbox"
          >
            {options.map((option) => {
              const normalizedOpt =
                typeof option === "string"
                  ? { value: option, label: option }
                  : option;

              return (
                <li
                  key={normalizedOpt.value}
                  role="option"
                  aria-selected={value === normalizedOpt.value}
                  onClick={() => {
                    onChange(normalizedOpt.value);
                    setIsOpen(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      onChange(normalizedOpt.value);
                      setIsOpen(false);
                    }
                  }}
                  tabIndex={0}
                  className={`px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between group transition-colors focus:outline-none focus:bg-white/10 ${value === normalizedOpt.value
                      ? "bg-indigo-500/10 text-indigo-400"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
                >
                  <span>
                    {renderOption
                      ? renderOption(normalizedOpt)
                      : normalizedOpt.label}
                  </span>
                  {value === normalizedOpt.value && (
                    <Check size={14} className="text-indigo-400" />
                  )}
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};
