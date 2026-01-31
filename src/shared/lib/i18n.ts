import i18n from "i18next";
import { initReactI18next } from "react-i18next";

/**
 * Dynamic Localization (i18n) - Performance Optimization
 *
 * Instead of statically importing 80+ JSON files, we use Vite's dynamic import.meta.glob
 * to load only the required language and namespace chunks on demand.
 */

// Mapping for namespaces that don't match their filename exactly
const NS_MAPPING: Record<string, string> = {
  SnapSolve: "snapsolve",
  formula: "formulas",
};

// Map all available locale JSONs to loader functions
const locales = import.meta.glob("../assets/locales/*/*.json");

const customBackend = {
  type: "backend" as const,
  read(
    language: string,
    namespace: string,
    callback: (err: Error | null, data: unknown) => void
  ) {
    const fileBase = NS_MAPPING[namespace] || namespace;
    const path = `../assets/locales/${language}/${fileBase}.json`;
    const loader = locales[path] as () => Promise<{ default: unknown }>;

    if (loader) {
      loader()
        .then((module) => {
          callback(null, module.default || module);
        })
        .catch((err: Error) => {
          console.error(`[i18n] Failed to load ${path}:`, err);
          callback(err, null);
        });
    } else {
      // Fallback: If not found in current language, try 'nl'
      if (language !== "nl") {
        const fallbackPath = `../assets/locales/nl/${fileBase}.json`;
        const fallbackLoader = locales[fallbackPath] as
          | (() => Promise<{ default: unknown }>)
          | undefined;
        if (fallbackLoader) {
          fallbackLoader()
            .then((module) => callback(null, module.default || module))
            .catch((err: Error) => callback(err, null));
          return;
        }
      }
      callback(new Error(`Locale not found: ${path}`), null);
    }
  },
};

// Get saved language or default to Dutch
const savedLang =
  typeof window !== "undefined"
    ? localStorage.getItem("app_language") || "nl"
    : "nl";

i18n
  .use(customBackend)
  .use(initReactI18next)
  .init({
    lng: savedLang,
    fallbackLng: "nl",
    defaultNS: "common",
    ns: [
      "common",
      "nav",
      "calculus",
      "coach",
      "career",
      "subjects",
      "live",
      "exam",
      "veo",
      "lesson",
      "planner",
      "SnapSolve",
      "dashboard",
      "settings",
      "formula",
      "physics",
      "biology",
      "studio_3d",
      "library",
      "chemistry",
      "philosophy",
      "api",
    ],
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false, // Keep false to matching existing app behavior, handling loading in UI where needed
    },
  });

export default i18n;
