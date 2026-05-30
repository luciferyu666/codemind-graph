import type { MetadataRoute } from "next";
import { getAbsoluteUrl, siteUrl } from "@/content/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/en",
        "/zh-TW",
        "/en/engineering",
        "/zh-TW/engineering",
        "/en/vincent-liu",
        "/zh-TW/vincent-liu",
        "/sitemap.xml",
      ],
      disallow: [
        "/.codemind/",
        "/Documentations/",
        "/docs/",
        "/docs/SESSION_STATE.md",
        "/docs/CURRENT_STATE.md",
        "/docs/ENGINEERING_STATE.md",
        "/api/",
      ],
    },
    sitemap: getAbsoluteUrl("/sitemap.xml"),
    host: siteUrl.origin,
  };
}
