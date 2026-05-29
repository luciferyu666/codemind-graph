import type { Locale } from "./index";

export const siteName = "CodeMind Graph";
export const defaultSiteUrl = "https://codemind-graph.vercel.app";

const configuredSiteUrl =
  process.env.NEXT_PUBLIC_CODEMIND_SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? defaultSiteUrl;

export const siteUrl = new URL(configuredSiteUrl);
export const githubUrl = "https://github.com/luciferyu666/codemind-graph";

export const seoKeywords: string[] = [
  "CodeMind Graph",
  "AI-native graph platform",
  "code knowledge graph",
  "local-first engineering",
  "engineering practices",
  "persistent engineering workspace",
  "read-only MCP server",
  "TypeScript symbol graph",
];

export const languageAlternates: Record<Locale | "x-default", string> = {
  en: "/en",
  "zh-TW": "/zh-TW",
  "x-default": "/en",
};

export function getCanonicalPath(locale: Locale): string {
  return `/${locale}`;
}

export function getLocalizedPath(locale: Locale, path = ""): string {
  return `${getCanonicalPath(locale)}${path}`;
}

export function getLanguageAlternates(path = ""): Record<Locale | "x-default", string> {
  return {
    en: getLocalizedPath("en", path),
    "zh-TW": getLocalizedPath("zh-TW", path),
    "x-default": getLocalizedPath("en", path),
  };
}

export function getAbsoluteUrl(path: string): string {
  return new URL(path, siteUrl).toString();
}

export function getOpenGraphImagePath(locale: Locale): string {
  return `/${locale}/opengraph-image`;
}

export function getAbsoluteLanguageAlternates(path = ""): Record<string, string> {
  const alternates = path ? getLanguageAlternates(path) : languageAlternates;

  return Object.fromEntries(
    Object.entries(alternates).map(([locale, alternatePath]) => [locale, getAbsoluteUrl(alternatePath)])
  );
}
