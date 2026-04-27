import { useEffect, useMemo, useState, type ReactNode } from "react";
import { I18nContext, type I18nContextValue } from "./i18n-context";
import { getLocaleForLanguage, type Language } from "./i18n-config";

const STORAGE_KEY = "skill-studio.language";

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
      locale: getLocaleForLanguage(language),
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
