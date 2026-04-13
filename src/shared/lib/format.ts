import type { AppId, SkillApps } from "../types/skills";

export function formatUnixTime(value: number, locale: string) {
  return new Date(value * 1000).toLocaleString(locale);
}

export function countEnabledApps(apps: Record<AppId, boolean> | SkillApps) {
  return Object.values(apps).filter(Boolean).length;
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return null;
}

function stripDelimitedFrontmatter(content: string) {
  if (!content.startsWith("---\n") && !content.startsWith("---\r\n")) {
    return content;
  }

  const match = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  return match ? content.slice(match[0].length).trim() : content;
}

function stripInlineMetadataHeader(content: string) {
  const lines = content.split(/\r?\n/);
  const metadataKeyPattern = /^[A-Za-z][\w-]*:\s*/;

  if (!lines[0] || !metadataKeyPattern.test(lines[0])) {
    return content;
  }

  let index = 0;
  let hasMetadata = false;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      return hasMetadata ? lines.slice(index + 1).join("\n").trim() : content;
    }

    if (metadataKeyPattern.test(line) || /^\s+.+$/.test(line) || /^\s*-\s+.+$/.test(line)) {
      hasMetadata = true;
      index += 1;
      continue;
    }

    break;
  }

  return content;
}

export function stripMarkdownFrontmatter(content: string | null | undefined) {
  if (!content) {
    return null;
  }

  const normalized = content.trim();
  const withoutDelimitedFrontmatter = stripDelimitedFrontmatter(normalized);
  return stripInlineMetadataHeader(withoutDelimitedFrontmatter).trim();
}
