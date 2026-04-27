import type { AppId } from "../types/skills";

export type Language = "en" | "zh-CN";

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

export function getAppLabels(language: Language) {
  return APP_LABELS[language];
}

export function getLocaleForLanguage(language: Language) {
  return LOCALES[language];
}
