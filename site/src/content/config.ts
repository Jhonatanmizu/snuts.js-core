import { defineCollection, z } from "astro:content";

const tokenSchema = z.object({
  text: z.string(),
  color: z.enum(["accent-hover", "text", "ok", "rose", "warn", "muted", "accent"]),
});

const codeLineSchema = z.object({
  ln: z.string(),
  tokens: z.array(tokenSchema),
  diagnostic: z
    .object({
      label: z.string(),
      variant: z.enum(["warn", "accent"]),
    })
    .optional(),
});

const siteSectionSchema = z.object({
  sectionType: z.literal("site"),
  brandName: z.string(),
  version: z.string(),
  fullVersion: z.string(),
  npmInstallCmd: z.string(),
  githubUrl: z.string(),
  githubRepoShort: z.string(),
  githubStars: z.string(),
  getStartedLabel: z.string(),
  getStartedHref: z.string(),
  vscodeMarketplaceUrl: z.string(),
  vscodeRepoUrl: z.string(),
  navLinks: z.array(
    z.object({
      label: z.string(),
      href: z.string(),
    }),
  ),
  footerTagline: z.string(),
  footerCopyright: z.string(),
  footerColumns: z.array(
    z.object({
      heading: z.string(),
      showOnMobile: z.boolean(),
      links: z.array(
        z.object({
          desktopLabel: z.string(),
          mobileLabel: z.string(),
          href: z.string(),
        }),
      ),
    }),
  ),
});

const heroSectionSchema = z.object({
  sectionType: z.literal("hero"),
  desktopEyebrow: z.string(),
  mobileEyebrow: z.string(),
  desktopH1Line1: z.string(),
  desktopH1Line2: z.string(),
  mobileH1: z.string(),
  desktopSubhead: z.string(),
  mobileSubhead: z.string(),
  installCommand: z.string(),
  installChip: z.string(),
  desktopPrimaryCta: z.object({ label: z.string(), href: z.string() }),
  desktopSecondaryCta: z.object({ label: z.string(), href: z.string() }),
  mobilePrimaryCta: z.object({ label: z.string(), href: z.string() }),
  mobileSecondaryCta: z.object({ label: z.string(), href: z.string() }),
  trustStrip: z.array(z.string()),
  desktopCodeWindow: z.object({
    fileName: z.string(),
    detectedBadge: z.string(),
    beforeTag: z.string(),
    beforeHint: z.string(),
    beforeCountBadge: z.string(),
    beforeLines: z.array(codeLineSchema),
    aiToolbar: z.object({
      title: z.string(),
      model: z.string(),
      actionLabel: z.string(),
    }),
    afterLines: z.array(codeLineSchema),
    footerPill: z.string(),
    footerMeta: z.string(),
  }),
  mobileCodeWindow: z.object({
    fileName: z.string(),
    detectedBadge: z.string(),
    beforeLabel: z.string(),
    beforeLines: z.array(z.string()),
    afterLabel: z.string(),
    afterLines: z.array(z.string()),
  }),
});

const workflowSectionSchema = z.object({
  sectionType: z.literal("workflow"),
  kicker: z.string(),
  desktopTitle: z.string(),
  mobileTitle: z.string(),
  steps: z.array(
    z.object({
      num: z.string(),
      title: z.string(),
      icon: z.enum(["layers", "bug", "sparkles"]),
      desktopDesc: z.string(),
      mobileDesc: z.string(),
    }),
  ),
});

const detectorsSectionSchema = z.object({
  sectionType: z.literal("detectors-section"),
  kicker: z.string(),
  desktopTitle: z.string(),
  mobileTitle: z.string(),
  desktopSub: z.string(),
  mobileSub: z.string(),
  searchPlaceholder: z.string(),
  categories: z.array(
    z.object({
      id: z.enum([
        "All",
        "Assertions",
        "Structure & Clarity",
        "Logic & Flow",
        "Flakiness & Isolation",
      ]),
      desktopLabel: z.string(),
      mobileLabel: z.string(),
      desktopWidth: z.number().optional(),
    }),
  ),
  moreHeaderLabel: z.string(),
  viewAllLabel: z.string(),
  mobileMoreLabel: z.string(),
});

const aiRefactorSectionSchema = z.object({
  sectionType: z.literal("ai-refactor"),
  desktopEyebrow: z.string(),
  mobileEyebrow: z.string(),
  desktopTitle: z.string(),
  mobileTitle: z.string(),
  mobileSub: z.string(),
  providers: z.array(
    z.object({
      name: z.string(),
      mobileName: z.string(),
      model: z.string(),
      dotColor: z.string(),
    }),
  ),
  diffFileName: z.string(),
  diffSmellsBadge: z.string(),
  desktopDiffLines: z.array(
    z.object({
      sign: z.string(),
      code: z.string(),
      type: z.enum(["remove", "add", "neutral"]),
    }),
  ),
  desktopFooterNote: z.string(),
  mobileBeforeHeader: z.string(),
  mobileBeforeLines: z.array(z.string()),
  mobileRefactorChip: z.string(),
  mobileAfterHeader: z.string(),
  mobileAfterBadge: z.string(),
  mobileAfterLines: z.array(z.string()),
  mobileFooterNote: z.string(),
  capabilities: z.array(
    z.object({
      icon: z.enum(["eye", "layers", "target"]),
      title: z.string(),
      desc: z.string(),
    }),
  ),
});

const cliSdkCommandSchema = z.object({
  comment: z.string(),
  prefix: z.string(),
  pkg: z.string(),
  args: z.string(),
  mobileFullCommand: z.string().optional(),
});

const cliSdkSectionSchema = z.object({
  sectionType: z.literal("cli-sdk"),
  desktopTitle: z.string(),
  desktopSub: z.string(),
  mobileTitle: z.string(),
  mobileSub: z.string(),
  tabs: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      mobileWidth: z.number(),
      commands: z.array(cliSdkCommandSchema),
      sdkLines: z.array(
        z.object({
          text: z.string(),
          color: z.enum(["rose", "text", "ok", "warn", "accent-hover"]),
        }),
      ),
      configLines: z.array(
        z.object({
          text: z.string(),
          color: z.enum(["text", "ok", "warn"]),
        }),
      ),
    }),
  ),
  desktopSafeNote: z.string(),
  mobileSafeNote: z.string(),
});

const vscodeSectionSchema = z.object({
  sectionType: z.literal("vscode"),
  desktopBadge: z.string(),
  mobileBadge: z.string(),
  desktopHeading: z.string(),
  mobileKicker: z.string(),
  mobileHeading: z.string(),
  features: z.array(
    z.object({
      desktopTitle: z.string(),
      desktopDesc: z.string(),
      mobileTitle: z.string(),
      mobileDesc: z.string(),
      showOnMobile: z.boolean(),
    }),
  ),
  primaryCtaLabel: z.string(),
  secondaryCtaLabel: z.string(),
  mockup: z.object({
    windowTitle: z.string(),
    mobileWindowTitle: z.string(),
    projectName: z.string(),
    explorerItems: z.array(
      z.object({
        name: z.string(),
        kind: z.enum(["folder", "file"]),
        active: z.boolean(),
      }),
    ),
    editorTabs: z.array(
      z.object({
        name: z.string(),
        active: z.boolean(),
      }),
    ),
    codeLines: z.array(codeLineSchema),
    problemsCount: z.string(),
    problems: z.array(
      z.object({
        dot: z.enum(["warn", "accent", "err"]),
        msg: z.string(),
        file: z.string(),
        loc: z.string(),
        showOnMobile: z.boolean(),
      }),
    ),
    contextMenu: z.array(
      z.object({
        icon: z.enum(["sparkles", "download"]),
        label: z.string(),
        active: z.boolean(),
      }),
    ),
    quickFixTitle: z.string(),
    quickFixMenu: z.array(
      z.object({
        icon: z.enum(["sparkles", "check"]),
        label: z.string(),
        active: z.boolean(),
      }),
    ),
  }),
});

const ctaSectionSchema = z.object({
  sectionType: z.literal("cta"),
  eyebrow: z.string(),
  title: z.string(),
  desktopSub: z.string(),
  mobileSub: z.string(),
  desktopCliPrefix: z.string(),
  desktopCliPkg: z.string(),
  desktopCliArgs: z.string(),
  mobileCliArgs: z.string(),
  primaryCta: z.object({ label: z.string(), href: z.string() }),
  secondaryCta: z.object({ label: z.string(), href: z.string() }),
  compatibilityPills: z.array(
    z.object({
      icon: z.enum(["check", "braces", "terminal", "code", "scale"]),
      label: z.string(),
    }),
  ),
});

const sectionsCollection = defineCollection({
  type: "content",
  schema: z.discriminatedUnion("sectionType", [
    siteSectionSchema,
    heroSectionSchema,
    workflowSectionSchema,
    detectorsSectionSchema,
    aiRefactorSectionSchema,
    cliSdkSectionSchema,
    vscodeSectionSchema,
    ctaSectionSchema,
  ]),
});

const detectorsCollection = defineCollection({
  type: "content",
  schema: z.object({
    order: z.number(),
    name: z.string(),
    category: z.enum([
      "Assertions",
      "Structure & Clarity",
      "Logic & Flow",
      "Flakiness & Isolation",
    ]),
    categoryVariant: z.enum(["accent", "chestnut", "warn", "ok"]),
    trigger: z.string(),
    threshold: z.string().optional(),
    featured: z.boolean(),
    mobileFeatured: z.boolean(),
    chipRow: z.number().optional(),
  }),
});

export const collections = {
  sections: sectionsCollection,
  detectors: detectorsCollection,
};
