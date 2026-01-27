import { Language } from "@shared/types/common";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

interface LanguageSwitcherProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
}

const nlFlag = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 90 60"
    className="w-5 h-3 shadow-sm rounded-sm"
  >
    <rect width="90" height="60" fill="#21468B" />
    <rect width="90" height="40" fill="#FFF" />
    <rect width="90" height="20" fill="#AE1C28" />
  </svg>
);

const enFlag = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 60 30"
    className="w-5 h-3 shadow-sm rounded-sm"
  >
    <clipPath id="s">
      <path d="M0,0 v30 h60 v-30 z" />
    </clipPath>
    <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4" />
    <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
    <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
  </svg>
);

const esFlag = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 750 500"
    className="w-5 h-3 shadow-sm rounded-sm"
  >
    <rect width="750" height="500" fill="#c60b1e" />
    <rect width="750" height="250" y="125" fill="#ffc400" />
  </svg>
);

const frFlag = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 3 2"
    className="w-5 h-3 shadow-sm rounded-sm"
  >
    <rect width="3" height="2" fill="#ED2939" />
    <rect width="2" height="2" fill="#fff" />
    <rect width="1" height="2" fill="#002395" />
  </svg>
);

const languages: { code: Language; label: string; flag: React.ReactNode }[] = [
  { code: "nl", label: "Nederlands", flag: nlFlag },
  { code: "en", label: "English", flag: enFlag },
  { code: "es", label: "Español", flag: esFlag },
  { code: "fr", label: "Français", flag: frFlag },
];

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  currentLang,
  onLanguageChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeLang =
    languages.find((l) => l.code === currentLang) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-obsidian-900/50 border border-white/10 rounded-xl hover:bg-white/5 transition-all text-sm text-slate-300 font-medium whitespace-nowrap"
      >
        <span className="text-base leading-none">
          {activeLang?.flag || languages[0]?.flag || ""}
        </span>
        <span className="hidden sm:inline">
          {activeLang?.label || languages[0]?.label || ""}
        </span>
        <ChevronDown
          size={14}
          className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-48 bg-obsidian-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[100] backdrop-blur-xl"
          >
            <div className="p-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    onLanguageChange(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                    currentLang === lang.code
                      ? "bg-electric/20 text-white font-bold"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base leading-none">{lang.flag}</span>
                    <span>{lang.label}</span>
                  </div>
                  {currentLang === lang.code && (
                    <Check size={14} className="text-electric" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
