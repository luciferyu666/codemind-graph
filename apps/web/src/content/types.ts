export interface SiteContent {
  readonly locale: "en" | "zh-TW";
  readonly languageName: string;
  readonly meta: {
    readonly title: string;
    readonly description: string;
    readonly ogLocale: string;
  };
  readonly nav: {
    readonly product: string;
    readonly engineering: string;
    readonly features: string;
    readonly workflow: string;
    readonly github: string;
  };
  readonly hero: {
    readonly eyebrow: string;
    readonly title: string;
    readonly summary: string;
    readonly primaryCta: string;
    readonly secondaryCta: string;
    readonly stats: readonly {
      readonly value: string;
      readonly label: string;
    }[];
  };
  readonly showcase: {
    readonly title: string;
    readonly summary: string;
    readonly eyebrow: string;
    readonly nodes: readonly {
      readonly label: string;
      readonly detail: string;
      readonly tone: "cyan" | "mint" | "amber" | "coral";
    }[];
    readonly flows: readonly string[];
  };
  readonly why: {
    readonly eyebrow: string;
    readonly title: string;
    readonly summary: string;
    readonly limitationsLabel: string;
    readonly solutionsLabel: string;
    readonly limitations: readonly {
      readonly title: string;
      readonly body: string;
    }[];
    readonly solutions: readonly {
      readonly title: string;
      readonly body: string;
    }[];
  };
  readonly engineering: {
    readonly eyebrow: string;
    readonly title: string;
    readonly summary: string;
    readonly pageTitle: string;
    readonly pageDescription: string;
    readonly readMore: string;
    readonly principles: readonly {
      readonly title: string;
      readonly body: string;
    }[];
    readonly architecture: {
      readonly eyebrow: string;
      readonly title: string;
      readonly body: string;
      readonly items: readonly {
        readonly label: string;
        readonly body: string;
      }[];
    };
    readonly standards: {
      readonly eyebrow: string;
      readonly title: string;
      readonly items: readonly {
        readonly label: string;
        readonly body: string;
      }[];
    };
  };
  readonly positioning: {
    readonly eyebrow: string;
    readonly title: string;
    readonly summary: string;
    readonly notLabel: string;
    readonly isLabel: string;
    readonly not: readonly string[];
    readonly is: readonly string[];
  };
  readonly features: readonly {
    readonly title: string;
    readonly body: string;
  }[];
  readonly workflow: {
    readonly title: string;
    readonly steps: readonly {
      readonly label: string;
      readonly body: string;
    }[];
  };
  readonly cta: {
    readonly title: string;
    readonly body: string;
    readonly command: string;
    readonly link: string;
  };
}
