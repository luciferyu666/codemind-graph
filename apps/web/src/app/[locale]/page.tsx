import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAlternateLocale, getContent, isLocale, locales, type Locale, type SiteContent } from "@/content";
import {
  getAbsoluteUrl,
  getCanonicalPath,
  getOpenGraphImagePath,
  languageAlternates,
  seoKeywords,
  siteName,
} from "@/content/seo";

type LocalePageProps = {
  readonly params: Promise<{
    readonly locale: string;
  }>;
};

export function generateStaticParams(): { locale: Locale }[] {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) {
    return {};
  }

  const content = getContent(rawLocale);
  const canonicalPath = getCanonicalPath(content.locale);
  const openGraphImagePath = getOpenGraphImagePath(content.locale);

  return {
    title: content.meta.title,
    description: content.meta.description,
    keywords: seoKeywords,
    alternates: {
      canonical: canonicalPath,
      languages: languageAlternates,
    },
    openGraph: {
      title: content.meta.title,
      description: content.meta.description,
      locale: content.meta.ogLocale,
      alternateLocale: locales
        .filter((locale) => locale !== content.locale)
        .map((locale) => getContent(locale).meta.ogLocale),
      siteName,
      type: "website",
      url: getAbsoluteUrl(canonicalPath),
      images: [
        {
          url: openGraphImagePath,
          width: 1200,
          height: 630,
          alt: content.meta.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: content.meta.title,
      description: content.meta.description,
      images: [openGraphImagePath],
    },
  };
}

export default async function LocalePage({ params }: LocalePageProps): Promise<React.ReactNode> {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) {
    notFound();
  }

  const content = getContent(rawLocale);
  return <MarketingPage content={content} />;
}

function MarketingPage({ content }: { readonly content: SiteContent }): React.ReactNode {
  const alternateLocale = getAlternateLocale(content.locale);
  const alternateContent = getContent(alternateLocale);
  const engineeringHref = content.locale === "en" ? "/en/engineering" : "/zh-TW/engineering";

  return (
    <main className="site-shell">
      <nav className="top-nav" aria-label="Primary">
        <Link className="brand-mark" href={`/${content.locale}`}>
          <span className="brand-node" aria-hidden="true" />
          <span>CodeMind Graph</span>
        </Link>
        <div className="nav-links">
          <a href="#product">{content.nav.product}</a>
          <a href="#engineering">{content.nav.engineering}</a>
          <a href="#features">{content.nav.features}</a>
          <a href="#workflow">{content.nav.workflow}</a>
          <a href={content.cta.link}>{content.nav.github}</a>
          <Link className="language-switch" href={`/${alternateLocale}`} hrefLang={alternateLocale}>
            {alternateContent.languageName}
          </Link>
        </div>
      </nav>

      <section className="hero-section" id="product">
        <GraphBackdrop content={content} />
        <div className="hero-copy">
          <p className="eyebrow">{content.hero.eyebrow}</p>
          <h1>{content.hero.title}</h1>
          <p className="hero-summary">{content.hero.summary}</p>
          <div className="hero-actions">
            <a className="primary-action" href={content.cta.link}>
              {content.hero.primaryCta}
            </a>
            <a className="secondary-action" href="#workflow">
              {content.hero.secondaryCta}
            </a>
          </div>
        </div>
        <div className="hero-stats" aria-label="Product attributes">
          {content.hero.stats.map((stat) => (
            <div className="stat-item" key={stat.value}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="why-section" aria-labelledby="why-title">
        <div className="section-heading">
          <p className="eyebrow">{content.why.eyebrow}</p>
          <h2 id="why-title">{content.why.title}</h2>
          <p>{content.why.summary}</p>
        </div>
        <div className="why-grid">
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

      <section className="showcase-section" aria-labelledby="showcase-title">
        <div className="section-heading">
          <p className="eyebrow">{content.showcase.eyebrow}</p>
          <h2 id="showcase-title">{content.showcase.title}</h2>
          <p>{content.showcase.summary}</p>
        </div>
        <div className="showcase-grid">
          <div className="graph-board" aria-label="Knowledge graph preview">
            {content.showcase.nodes.map((node, index) => (
              <div className={`graph-node node-${index + 1} tone-${node.tone}`} key={node.label}>
                <strong>{node.label}</strong>
                <span>{node.detail}</span>
              </div>
            ))}
            <span className="graph-edge edge-1" aria-hidden="true" />
            <span className="graph-edge edge-2" aria-hidden="true" />
            <span className="graph-edge edge-3" aria-hidden="true" />
          </div>
          <ol className="flow-list">
            {content.showcase.flows.map((flow, index) => (
              <li key={flow}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{flow}</strong>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="engineering-section" id="engineering" aria-labelledby="engineering-title">
        <div className="section-heading">
          <p className="eyebrow">{content.engineering.eyebrow}</p>
          <h2 id="engineering-title">{content.engineering.title}</h2>
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
        <div className="architecture-band">
          <div>
            <p className="eyebrow">{content.engineering.architecture.title}</p>
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
        <Link className="secondary-action" href={engineeringHref}>
          {content.engineering.readMore}
        </Link>
      </section>

      <section className="positioning-section" aria-labelledby="positioning-title">
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

      <section className="feature-section" id="features" aria-labelledby="features-title">
        <div className="section-heading">
          <p className="eyebrow">Core capabilities</p>
          <h2 id="features-title">{content.nav.features}</h2>
        </div>
        <div className="feature-grid">
          {content.features.map((feature) => (
            <article className="feature-card" key={feature.title}>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="workflow-section" id="workflow" aria-labelledby="workflow-title">
        <div className="section-heading">
          <p className="eyebrow">Agent workflow</p>
          <h2 id="workflow-title">{content.workflow.title}</h2>
        </div>
        <div className="workflow-grid">
          {content.workflow.steps.map((step, index) => (
            <article className="workflow-step" key={step.label}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{step.label}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cta-section" aria-labelledby="cta-title">
        <div>
          <p className="eyebrow">Developer-first</p>
          <h2 id="cta-title">{content.cta.title}</h2>
          <p>{content.cta.body}</p>
        </div>
        <pre aria-label="Example command">
          <code>{content.cta.command}</code>
        </pre>
        <a className="primary-action" href={content.cta.link}>
          {content.nav.github}
        </a>
      </section>
    </main>
  );
}

function GraphBackdrop({ content }: { readonly content: SiteContent }): React.ReactNode {
  return (
    <div className="hero-scene" aria-hidden="true">
      <span className="scene-grid" />
      {content.showcase.nodes.map((node, index) => (
        <div className={`scene-node scene-node-${index + 1} tone-${node.tone}`} key={node.label}>
          <span>{node.label}</span>
        </div>
      ))}
      <span className="scene-edge scene-edge-1" />
      <span className="scene-edge scene-edge-2" />
      <span className="scene-edge scene-edge-3" />
      <span className="scene-edge scene-edge-4" />
      <span className="scene-status scene-status-left">graph.json</span>
      <span className="scene-status scene-status-right">read-only MCP</span>
    </div>
  );
}
