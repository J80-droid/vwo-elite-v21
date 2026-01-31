import {
  buildSystemPrompt,
  PromptRole,
} from "@shared/lib/constants/systemPrompts";
import i18n from "@shared/lib/i18n";
import { useNavigationStore } from "@shared/model/navigationStore";
import { type TFunction } from "@shared/types/i18n";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

// For backward compatibility, we keep the list of namespaces
const NAMESPACES = [
  "common",
  "nav",
  "calculus",
  "coach",
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
  "blurting",
  "api",
];

/**
 * useTranslations hook (i18next-powered with backward compatibility)
 * Provides centralized access to localized strings and current language.
 * Supports both:
 *   - Function calls: t('calculus.title')
 *   - Property access: t.calculus.title (backward compatible via Proxy)
 */
export const useTranslations = () => {
  const { language: lang } = useNavigationStore();
  const { t: i18nT } = useTranslation(NAMESPACES);

  // Sync i18next language with store
  useEffect(() => {
    if (i18n.isInitialized && i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [lang]);

  const tFunction = (
    keyPath: string,
    defaultValueOrOptions?: string | Record<string, unknown>,
    options?: Record<string, unknown>,
  ) => {
    const firstPart = keyPath.split(".")[0];

    // Determine if first argument is a default value or options
    const isDefaultValue = typeof defaultValueOrOptions === "string";
    const finalOptions = isDefaultValue
      ? options
      : (defaultValueOrOptions as Record<string, unknown>);
    const defaultValue = isDefaultValue
      ? defaultValueOrOptions
      : (options?.defaultValue as string);

    if (firstPart && NAMESPACES.includes(firstPart)) {
      const restOfPath = keyPath.substring(firstPart.length + 1);
      return i18nT(restOfPath, {
        ns: firstPart,
        defaultValue,
        ...finalOptions,
      }) as string;
    }

    return i18nT(keyPath, {
      defaultValue,
      ...finalOptions,
    }) as string;
  };

  /**
   * Backward compatibility Proxy
   * Allows t.calculus.title to work by looking up resources in the i18n store.
   * Note: This only works if the namespace is already loaded.
   */
  const t = new Proxy(tFunction, {
    get(target, prop) {
      // Safety check for Symbols (toPrimitive, iterator, etc.)
      if (typeof prop === "symbol")
        return (target as unknown as Record<string | symbol, unknown>)[prop];
      if (prop in target)
        return (target as unknown as Record<string | symbol, unknown>)[prop];

      const propStr = String(prop);

      // Handle studio_3d.build special case if it was used as t.build
      if (propStr === "build") {
        const bundle = i18n.getResourceBundle(lang, "studio_3d");
        return bundle?.build;
      }

      // If someone accesses t.calculus, return the bundle from i18n store
      if (NAMESPACES.includes(propStr)) {
        return i18n.getResourceBundle(lang, propStr) || {};
      }

      return undefined;
    },
  }) as TFunction;

  /**
   * Helper to get a localized system prompt for AI roles
   */
  const getLocalizedPrompt = (role: PromptRole, additionalContext?: string) => {
    return buildSystemPrompt(role, lang, additionalContext);
  };

  return {
    t,
    lang,
    getLocalizedPrompt,
  };
};
