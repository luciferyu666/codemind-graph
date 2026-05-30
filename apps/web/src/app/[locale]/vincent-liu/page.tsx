import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAlternateLocale, getContent, isLocale, locales, type Locale } from "@/content";
import {
  getAbsoluteUrl,
  getLanguageAlternates,
  getLocalizedPath,
  getOpenGraphImagePath,
  seoKeywords,
  siteName,
} from "@/content/seo";

type ProfilePageProps = {
  readonly params: Promise<{
    readonly locale: string;
  }>;
};

type ProfileProject = {
  readonly name: string;
  readonly description: string;
  readonly href: string;
};

type ProfileContent = {
  readonly pageTitle: string;
  readonly pageDescription: string;
  readonly eyebrow: string;
  readonly role: string;
  readonly tagline: string;
  readonly summary: string;
  readonly contactLabel: string;
  readonly emailLabel: string;
  readonly signalsLabel: string;
  readonly expertiseTitle: string;
  readonly projectsTitle: string;
  readonly statusTitle: string;
  readonly statusSummary: string;
  readonly primaryAction: string;
  readonly secondaryAction: string;
  readonly signals: readonly string[];
  readonly expertise: readonly string[];
  readonly projects: readonly ProfileProject[];
  readonly statusItems: readonly string[];
};

const profilePath = "/vincent-liu";
const email = "a0933881062@gmail.com";

const profileByLocale = {
  en: {
    pageTitle: "Vincent Liu | AI Workflow Architect",
    pageDescription:
      "Digital business card for Vincent Liu, an AI Workflow Architect focused on AI-native engineering, knowledge graph systems, edge AI platforms, SaaS architecture, VR training, and quantitative trading platforms.",
    eyebrow: "Digital business card",
    role: "AI Workflow Architect",
    tagline: "Building AI-native products for the next generation of engineering workflows.",
    summary:
      "Product builder and engineering architect focused on turning domain knowledge into deployed AI workflows, local-first knowledge systems, and production-ready SaaS platforms.",
    contactLabel: "Contact",
    emailLabel: "Email",
    signalsLabel: "Builder signals",
    expertiseTitle: "Core expertise",
    projectsTitle: "Featured projects",
    statusTitle: "Project status",
    statusSummary:
      "Active platforms are moving through production deployment, runtime validation, UI refinement, device testing, SaaS productization, and commercial launch preparation.",
    primaryAction: "Email Vincent",
    secondaryAction: "View CodeMind Graph",
    signals: ["AI Native Product Builder", "Knowledge Graph Engineer", "AI Agent System Architect"],
    expertise: [
      "AI Workflow Architecture",
      "AI Agent Engineering",
      "Knowledge Graph Design",
      "SaaS Platform Development",
      "Android Edge AI Runtime",
      "VR Training Simulation Systems",
      "Quantitative Trading Platforms",
      "Vercel Cloud Deployment",
      "GitHub CI/CD Workflow",
    ],
    projects: [
      {
        name: "GuardVision Edge",
        description: "Android safety-risk detection and behavior-analysis system for real-time field operations.",
        href: "https://guardvision-edge-official-website.vercel.app/zh-TW",
      },
      {
        name: "TAIFEX Quant Trading Platform",
        description: "AI-native quantitative trading platform for research, runtime validation, and productization.",
        href: "https://taifex-quant-trading-platform-websi.vercel.app/zh/",
      },
      {
        name: "Caregiver VR Training System",
        description: "Immersive VR caregiver training system for scenario learning and operational readiness.",
        href: "https://caregivervr-official-site.vercel.app/",
      },
      {
        name: "CodeMind Graph",
        description: "AI-native code knowledge graph platform for persistent engineering workflows.",
        href: "https://codemind-graph.vercel.app",
      },
    ],
    statusItems: [
      "Production Deployment",
      "Runtime Validation",
      "UI / UX Optimization",
      "Android Device Testing",
      "SaaS Productization",
      "Commercial Launch Preparation",
    ],
  },
  "zh-TW": {
    pageTitle: "Vincent Liu | AI 工作流架構師",
    pageDescription:
      "Vincent Liu 個人網路名片，聚焦 AI 原生工程、知識圖譜系統、Edge AI 平台、SaaS 產品架構、VR 訓練系統與量化交易平台。",
    eyebrow: "個人網路名片",
    role: "AI 工作流架構師",
    tagline: "Transforming knowledge into intelligent workflows.",
    summary:
      "專注於把領域知識轉換為可部署的 AI 工作流、local-first 知識系統與 production-ready SaaS 平台。",
    contactLabel: "聯絡方式",
    emailLabel: "Email",
    signalsLabel: "品牌定位",
    expertiseTitle: "核心能力",
    projectsTitle: "代表專案",
    statusTitle: "專案狀態",
    statusSummary:
      "目前平台持續進行 production deployment、runtime validation、UI / UX optimization、Android device testing、SaaS productization 與 commercial launch preparation。",
    primaryAction: "聯絡 Vincent",
    secondaryAction: "查看 CodeMind Graph",
    signals: ["AI Native Product Builder", "Knowledge Graph Engineer", "AI Agent System Architect"],
    expertise: [
      "AI Workflow Architecture",
      "AI Agent Engineering",
      "Knowledge Graph Design",
      "SaaS Platform Development",
      "Android Edge AI Runtime",
      "VR Training Simulation Systems",
      "Quantitative Trading Platforms",
      "Vercel Cloud Deployment",
      "GitHub CI/CD Workflow",
    ],
    projects: [
      {
        name: "GuardVision Edge",
        description: "即時場域安全風險偵測與行為分析 Android 系統。",
        href: "https://guardvision-edge-official-website.vercel.app/zh-TW",
      },
      {
        name: "台指期量化交易平台",
        description: "AI Native Quantitative Trading Platform，支援研究、驗證與產品化。",
        href: "https://taifex-quant-trading-platform-websi.vercel.app/zh/",
      },
      {
        name: "女性照護員 VR 訓練系統",
        description: "Immersive VR Caregiver Training System，支援情境學習與訓練準備。",
        href: "https://caregivervr-official-site.vercel.app/",
      },
      {
        name: "CodeMind Graph",
        description: "AI Native Code Knowledge Graph Platform，支援持久化工程工作流。",
        href: "https://codemind-graph.vercel.app",
      },
    ],
    statusItems: [
      "Production Deployment",
      "Runtime Validation",
      "UI / UX Optimization",
      "Android Device Testing",
      "SaaS Productization",
      "Commercial Launch Preparation",
    ],
  },
} as const satisfies Record<Locale, ProfileContent>;

export function generateStaticParams(): { locale: Locale }[] {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) {
    return {};
  }

  const profile = profileByLocale[rawLocale];
  const content = getContent(rawLocale);
  const canonicalPath = getLocalizedPath(rawLocale, profilePath);
  const openGraphImagePath = getOpenGraphImagePath(rawLocale);

  return {
    title: profile.pageTitle,
    description: profile.pageDescription,
    keywords: [
      ...seoKeywords,
      "Vincent Liu",
      "AI Workflow Architect",
      "AI Agent System Architect",
      "Knowledge Graph Engineer",
    ],
    alternates: {
      canonical: canonicalPath,
      languages: getLanguageAlternates(profilePath),
    },
    openGraph: {
      title: profile.pageTitle,
      description: profile.pageDescription,
      locale: content.meta.ogLocale,
      alternateLocale: locales
        .filter((locale) => locale !== rawLocale)
        .map((locale) => getContent(locale).meta.ogLocale),
      siteName,
      type: "profile",
      url: getAbsoluteUrl(canonicalPath),
      images: [
        {
          url: openGraphImagePath,
          width: 1200,
          height: 630,
          alt: profile.pageTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: profile.pageTitle,
      description: profile.pageDescription,
      images: [openGraphImagePath],
    },
  };
}

export default async function VincentLiuPage({ params }: ProfilePageProps): Promise<React.ReactNode> {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) {
    notFound();
  }

  return <DigitalBusinessCard locale={rawLocale} profile={profileByLocale[rawLocale]} />;
}

function DigitalBusinessCard({
  locale,
  profile,
}: {
  readonly locale: Locale;
  readonly profile: ProfileContent;
}): React.ReactNode {
  const alternateLocale = getAlternateLocale(locale);
  const alternateContent = getContent(alternateLocale);
  const homeHref = locale === "en" ? "/en" : "/zh-TW";
  const alternateProfileHref = alternateLocale === "en" ? "/en/vincent-liu" : "/zh-TW/vincent-liu";

  return (
    <main className="site-shell profile-page">
      <nav className="top-nav" aria-label="Primary">
        <Link className="brand-mark" href={homeHref}>
          <span className="brand-node" aria-hidden="true" />
          <span>Vincent Liu</span>
        </Link>
        <div className="nav-links">
          <Link href={homeHref}>CodeMind Graph</Link>
          <a href="mailto:a0933881062@gmail.com">{profile.contactLabel}</a>
          <Link className="language-switch" href={alternateProfileHref} hrefLang={alternateLocale}>
            {alternateContent.languageName}
          </Link>
        </div>
      </nav>

      <section className="profile-hero" aria-labelledby="profile-title">
        <div className="profile-copy">
          <p className="eyebrow">{profile.eyebrow}</p>
          <h1 id="profile-title">Vincent Liu</h1>
          <p className="profile-role">{profile.role}</p>
          <p className="profile-tagline">{profile.tagline}</p>
          <p className="profile-summary">{profile.summary}</p>
          <div className="profile-actions">
            <a className="primary-action" href={`mailto:${email}`}>
              {profile.primaryAction}
            </a>
            <a className="secondary-action" href="https://codemind-graph.vercel.app">
              {profile.secondaryAction}
            </a>
          </div>
        </div>

        <aside className="profile-portrait-panel" aria-label="Vincent Liu identity card">
          <div className="portrait-frame">
            <img
              src="/vincent-liu/portrait.jpg"
              alt="Portrait of Vincent Liu"
              width="960"
              height="1280"
              decoding="async"
            />
          </div>
          <div className="portrait-caption">
            <strong>Vincent Liu</strong>
            <span>{profile.role}</span>
          </div>
        </aside>
      </section>

      <section className="profile-strip" aria-labelledby="contact-title">
        <div>
          <p className="eyebrow">{profile.contactLabel}</p>
          <h2 id="contact-title">{profile.emailLabel}</h2>
          <a className="profile-email" href={`mailto:${email}`}>
            {email}
          </a>
        </div>
        <div>
          <p className="eyebrow">{profile.signalsLabel}</p>
          <div className="signal-list">
            {profile.signals.map((signal) => (
              <span key={signal}>{signal}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="profile-section" aria-labelledby="expertise-title">
        <div className="section-heading">
          <p className="eyebrow">Core</p>
          <h2 id="expertise-title">{profile.expertiseTitle}</h2>
        </div>
        <div className="expertise-grid">
          {profile.expertise.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section className="profile-section" aria-labelledby="projects-title">
        <div className="section-heading">
          <p className="eyebrow">Portfolio</p>
          <h2 id="projects-title">{profile.projectsTitle}</h2>
        </div>
        <div className="profile-project-grid">
          {profile.projects.map((project) => (
            <a className="profile-project-card" href={project.href} key={project.name}>
              <strong>{project.name}</strong>
              <span>{project.description}</span>
              <em>{new URL(project.href).hostname}</em>
            </a>
          ))}
        </div>
      </section>

      <section className="profile-status" aria-labelledby="status-title">
        <div className="section-heading">
          <p className="eyebrow">Operating mode</p>
          <h2 id="status-title">{profile.statusTitle}</h2>
          <p>{profile.statusSummary}</p>
        </div>
        <div className="status-list">
          {profile.statusItems.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>
    </main>
  );
}
