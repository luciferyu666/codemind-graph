import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAlternateLocale, getContent, isLocale, locales, type Locale, type SiteContent } from "@/content";
import {
  getAbsoluteUrl,
  getLanguageAlternates,
  getLocalizedPath,
  getOpenGraphImagePath,
  seoKeywords,
  siteName,
} from "@/content/seo";

type EngineeringPageProps = {
  readonly params: Promise<{
    readonly locale: string;
  }>;
};

const engineeringPath = "/engineering";

export function generateStaticParams(): { locale: Locale }[] {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: EngineeringPageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) {
    return {};
  }

  const content = getContent(rawLocale);
  const canonicalPath = getLocalizedPath(content.locale, engineeringPath);
  const openGraphImagePath = getOpenGraphImagePath(content.locale);

  return {
    title: content.engineering.pageTitle,
    description: content.engineering.pageDescription,
    keywords: seoKeywords,
    alternates: {
      canonical: canonicalPath,
      languages: getLanguageAlternates(engineeringPath),
    },
    openGraph: {
      title: `${content.engineering.pageTitle} | ${siteName}`,
      description: content.engineering.pageDescription,
      locale: content.meta.ogLocale,
      alternateLocale: locales
        .filter((locale) => locale !== content.locale)
        .map((locale) => getContent(locale).meta.ogLocale),
      siteName,
      type: "article",
      url: getAbsoluteUrl(canonicalPath),
      images: [
        {
          url: openGraphImagePath,
          width: 1200,
          height: 630,
          alt: content.engineering.pageTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${content.engineering.pageTitle} | ${siteName}`,
      description: content.engineering.pageDescription,
      images: [openGraphImagePath],
    },
  };
}

export default async function EngineeringPage({ params }: EngineeringPageProps): Promise<React.ReactNode> {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) {
    notFound();
  }

  const content = getContent(rawLocale);
  return <EngineeringPracticesPage content={content} />;
}

function EngineeringPracticesPage({ content }: { readonly content: SiteContent }): React.ReactNode {
  const alternateLocale = getAlternateLocale(content.locale);
  const alternateContent = getContent(alternateLocale);
  const alternateEngineeringHref = alternateLocale === "en" ? "/en/engineering" : "/zh-TW/engineering";

  return (
    <main className="site-shell practice-page">
      <nav className="top-nav" aria-label="Primary">
        <Link className="brand-mark" href={`/${content.locale}`}>
          <span className="brand-node" aria-hidden="true" />
          <span>CodeMind Graph</span>
        </Link>
        <div className="nav-links">
          <Link href={`/${content.locale}`}>{content.nav.product}</Link>
          <a href={content.cta.link}>{content.nav.github}</a>
          <Link className="language-switch" href={alternateEngineeringHref} hrefLang={alternateLocale}>
            {alternateContent.languageName}
          </Link>
        </div>
      </nav>

      <article className="practice-article">
        <header className="practice-hero">
          <p className="eyebrow">{content.engineering.eyebrow}</p>
          <h1>{content.engineering.pageTitle}</h1>
          <p>{content.engineering.pageDescription}</p>
        </header>

        <section className="practice-block" aria-labelledby="principles-title">
          <div className="section-heading">
            <p className="eyebrow">{content.engineering.eyebrow}</p>
            <h2 id="principles-title">{content.engineering.title}</h2>
            <p>{content.engineering.summary}</p>
          </div>
          <div className="practice-grid">
            {content.engineering.principles.map((principle) => (
              <article className="practice-card" key={principle.title}>
                <h3>{principle.title}</h3>
                <p>{principle.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="practice-block" aria-labelledby="architecture-title">
          <div className="architecture-band">
            <div>
              <p className="eyebrow">{content.engineering.architecture.eyebrow}</p>
              <h2 id="architecture-title">{content.engineering.architecture.title}</h2>
              <p>{content.engineering.architecture.body}</p>
            </div>
            <div className="architecture-list">
              {content.engineering.architecture.items.map((item) => (
                <article key={item.label}>
                  <strong>{item.label}</strong>
                  <span>{item.body}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="practice-block" aria-labelledby="standards-title">
          <div className="section-heading">
            <p className="eyebrow">{content.engineering.standards.eyebrow}</p>
            <h2 id="standards-title">{content.engineering.standards.title}</h2>
          </div>
          <div className="standards-grid">
            {content.engineering.standards.items.map((item) => (
              <article className="standard-item" key={item.label}>
                <span>{item.label}</span>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="practice-block" aria-labelledby="why-title">
          <div className="section-heading">
            <p className="eyebrow">{content.why.eyebrow}</p>
            <h2 id="why-title">{content.why.title}</h2>
            <p>{content.why.summary}</p>
          </div>
          <div className="positioning-grid">
            <div className="plain-panel">
              <span className="panel-kicker">{content.why.limitationsLabel}</span>
              {content.why.limitations.map((item) => (
                <article className="compact-row" key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
            <div className="plain-panel highlight-panel">
              <span className="panel-kicker">{content.why.solutionsLabel}</span>
              {content.why.solutions.map((item) => (
                <article className="compact-row" key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="practice-block" aria-labelledby="positioning-title">
          <div className="section-heading">
            <p className="eyebrow">{content.positioning.eyebrow}</p>
            <h2 id="positioning-title">{content.positioning.title}</h2>
            <p>{content.positioning.summary}</p>
          </div>
          <div className="positioning-grid">
            <div className="plain-panel">
              <span className="panel-kicker">{content.positioning.notLabel}</span>
              <ul>
                {content.positioning.not.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="plain-panel highlight-panel">
              <span className="panel-kicker">{content.positioning.isLabel}</span>
              <ul>
                {content.positioning.is.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </article>
    </main>
  );
}
