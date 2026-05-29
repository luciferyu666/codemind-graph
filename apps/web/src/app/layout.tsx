import type { Metadata } from "next";
import { getAbsoluteUrl, seoKeywords, siteName, siteUrl } from "@/content/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  applicationName: siteName,
  authors: [{ name: siteName, url: getAbsoluteUrl("/en") }],
  creator: siteName,
  publisher: siteName,
  keywords: seoKeywords,
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: "AI-native graph platform for persistent engineering workspaces.",
  openGraph: {
    title: siteName,
    description: "AI-native graph platform for persistent engineering workspaces.",
    siteName,
    type: "website",
    url: getAbsoluteUrl("/en"),
  },
  robots: {
    index: true,
    follow: true,
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: "AI-native graph platform for persistent engineering workspaces.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactNode {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
