import { enContent } from "./en";
import { zhTwContent } from "./zh-TW";
import type { SiteContent } from "./types";

export const locales = ["en", "zh-TW"] as const;

export type Locale = (typeof locales)[number];

const contentByLocale: Record<Locale, SiteContent> = {
  en: enContent,
  "zh-TW": zhTwContent,
};

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function getContent(locale: Locale): SiteContent {
  return contentByLocale[locale];
}

export function getAlternateLocale(locale: Locale): Locale {
  return locale === "en" ? "zh-TW" : "en";
}

export type { SiteContent };
