import { createContext } from "react";
import type { Language } from "./i18n-config";

export type I18nContextValue = {
  language: Language;
  locale: string;
  isZh: boolean;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
};

export const I18nContext = createContext<I18nContextValue | null>(null);
