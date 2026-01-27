import { useClickOutside } from "@shared/hooks/useClickOutside";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Search } from "lucide-react";
import { useRef, useState } from "react";

interface Props {
  options: string[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export const CustomCombobox = ({
  options,
  value,
  onChange,
  placeholder = "Type of selecteer...",
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useClickOutside(containerRef as React.RefObject<HTMLElement>, () =>
    setIsOpen(false),
  );

  const listOptions = options.filter((opt) =>
    opt.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <input
          type="text"
          value={isOpen ? search : value}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!isOpen) setIsOpen(true);
            if (isOpen) {
              onChange(e.target.value);
            }
          }}
          onFocus={() => {
            setIsOpen(true);
            setSearch(value); // Prime search with current value
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setIsOpen(true);
            }
            if (e.key === "Escape") setIsOpen(false);
          }}
          placeholder={placeholder}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          role="combobox"
          className={`w-full bg-black/40 border ${isOpen ? "border-indigo-500 ring-1 ring-indigo-500/50" : "border-white/10"} rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none transition-all placeholder:text-slate-600`}
        />
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
        />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-[#1a1b26] border border-white/10 rounded-xl shadow-xl shadow-black/50 overflow-hidden max-h-60 overflow-y-auto custom-scrollbar"
            role="listbox"
          >
            {listOptions.length > 0
              ? listOptions.map((option) => (
                <li
                  key={option}
                  role="option"
                  aria-selected={value === option}
                  onClick={() => {
                    onChange(option);
                    setSearch(option);
                    setIsOpen(false);
                  }}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      onChange(option);
                      setSearch(option);
                      setIsOpen(false);
                    }
                  }}
                  className="px-4 py-2.5 text-sm cursor-pointer text-slate-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2 focus:bg-white/10 focus:outline-none"
                >
                  <span>{option}</span>
                </li>
              ))
              : search.trim() !== "" && (
                <li
                  role="option"
                  onClick={() => {
                    onChange(search);
                    setIsOpen(false);
                  }}
                  className="px-4 py-2.5 text-sm cursor-pointer text-indigo-400 hover:bg-indigo-500/10 flex items-center gap-2 font-medium"
                >
                  <Plus size={14} />
                  <span>"{search}" toevoegen</span>
                </li>
              )}
            {listOptions.length === 0 && search.trim() === "" && (
              <li className="px-4 py-3 text-xs text-slate-500 text-center italic">
                Begin met typen...
              </li>
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};
