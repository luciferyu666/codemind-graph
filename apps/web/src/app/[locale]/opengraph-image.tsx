import { ImageResponse } from "next/og";
import { getContent, isLocale } from "@/content";

export const runtime = "edge";
export const alt = "CodeMind Graph social preview";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

type OpenGraphImageProps = {
  readonly params: Promise<{
    readonly locale: string;
  }>;
};

export default async function OpenGraphImage({ params }: OpenGraphImageProps): Promise<ImageResponse> {
  const { locale: rawLocale } = await params;
  const content = getContent(isLocale(rawLocale) ? rawLocale : "en");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#071012",
          color: "#f3fbf8",
          fontFamily: "Arial, sans-serif",
          padding: 64,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 28,
            color: "#7eeadf",
          }}
        >
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 999,
              background: "#7eeadf",
              boxShadow: "0 0 48px rgba(126, 234, 223, 0.72)",
            }}
          />
          CodeMind Graph
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 28, color: "#d8f7ee", letterSpacing: 0 }}>{content.hero.eyebrow}</div>
          <div style={{ fontSize: 84, fontWeight: 700, letterSpacing: 0, lineHeight: 1 }}>{content.hero.title}</div>
          <div style={{ maxWidth: 840, fontSize: 34, color: "#a8c8c0", lineHeight: 1.32 }}>{content.meta.description}</div>
        </div>
        <div style={{ display: "flex", gap: 18 }}>
          {content.hero.stats.map((stat) => (
            <div
              key={stat.value}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                border: "1px solid rgba(126, 234, 223, 0.26)",
                background: "rgba(255, 255, 255, 0.06)",
                borderRadius: 12,
                padding: "18px 22px",
                minWidth: 220,
              }}
            >
              <div style={{ fontSize: 24, color: "#f7fffc", fontWeight: 700 }}>{stat.value}</div>
              <div style={{ fontSize: 18, color: "#9ebbb5" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
