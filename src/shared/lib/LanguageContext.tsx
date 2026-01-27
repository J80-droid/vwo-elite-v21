/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import i18n from "./i18n";

// ------------------------------------------------------------------
// 1. Types
// ------------------------------------------------------------------
export type SupportedLanguage = "nl" | "en" | "es" | "fr";
type TranslationParams = Record<string, string | number>;

interface LanguageContextProps {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (path: string, params?: TranslationParams) => string;
}

// ------------------------------------------------------------------
// 2. Context Creation
// ------------------------------------------------------------------
const LanguageContext = createContext<LanguageContextProps | undefined>(
  undefined,
);

// ------------------------------------------------------------------
// 3. The Provider (Wrap your App with this)
// ------------------------------------------------------------------
export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const savedLang =
    typeof window !== "undefined"
      ? (localStorage.getItem("app_language") as SupportedLanguage) || "nl"
      : "nl";

  const [language, setLanguageState] = useState<SupportedLanguage>(savedLang);
  const { t: i18nT } = useTranslation();

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    setLanguageState(lang);
    i18n.changeLanguage(lang);
    localStorage.setItem("app_language", lang);
  }, []);

  /**
   * The translation function using i18next
   */
  const t = useCallback(
    (path: string, params?: TranslationParams): string => {
      return i18nT(path, params as Record<string, unknown>) as string;
    },
    [i18nT],
  );

  const value = { language, setLanguage, t };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

// ------------------------------------------------------------------
// 4. The Hook (Use this in your components)
// ------------------------------------------------------------------
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
