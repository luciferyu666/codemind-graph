import type { MetadataRoute } from "next";
import { getContent, locales } from "@/content";
import { getAbsoluteLanguageAlternates, getAbsoluteUrl, getLocalizedPath } from "@/content/seo";

const lastModified = new Date("2026-05-30T00:00:00.000Z");

const routes = [
  { path: "", priorityOffset: 0 },
  { path: "/engineering", priorityOffset: -0.12 },
  { path: "/vincent-liu", priorityOffset: -0.18 },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.flatMap((route) =>
    locales.map((locale) => {
      const content = getContent(locale);
      const basePriority = content.locale === "en" ? 1 : 0.9;

      return {
        url: getAbsoluteUrl(getLocalizedPath(content.locale, route.path)),
        lastModified,
        changeFrequency: "weekly",
        priority: basePriority + route.priorityOffset,
        alternates: {
          languages: getAbsoluteLanguageAlternates(route.path),
        },
      };
    })
  );
}
