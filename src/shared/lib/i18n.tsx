import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AppId } from "../types/skills";

export type Language = "en" | "zh-CN";

const STORAGE_KEY = "skill-studio.language";

const APP_LABELS: Record<Language, Record<AppId, string>> = {
  en: {
    claude: "Claude",
    codex: "Codex",
    gemini: "Gemini",
    opencode: "OpenCode",
    openclaw: "OpenClaw",
  },
  "zh-CN": {
    claude: "Claude",
    codex: "Codex",
    gemini: "Gemini",
    opencode: "OpenCode",
    openclaw: "OpenClaw",
  },
};

const LOCALES: Record<Language, string> = {
  en: "en-US",
  "zh-CN": "zh-CN",
};

type I18nContextValue = {
  language: Language;
  locale: string;
  isZh: boolean;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function detectInitialLanguage(): Language {
  if (typeof window === "undefined") {
    return "en";
  }

  const storedLanguage = window.localStorage.getItem(STORAGE_KEY);
  if (storedLanguage === "en" || storedLanguage === "zh-CN") {
    return storedLanguage;
  }

  return window.navigator.language.toLowerCase().startsWith("zh")
    ? "zh-CN"
    : "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => detectInitialLanguage());

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, language);
    }
  }, [language]);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      locale: LOCALES[language],
      isZh: language === "zh-CN",
      setLanguage,
      toggleLanguage: () =>
        setLanguage((currentLanguage) =>
          currentLanguage === "zh-CN" ? "en" : "zh-CN"
        ),
    }),
    [language]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }

  return context;
}

export function getAppLabels(language: Language) {
  return APP_LABELS[language];
}

export function getLocaleForLanguage(language: Language) {
  return LOCALES[language];
}
