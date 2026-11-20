# Proposal

## Why

`@snutsjs/core` currently lacks a public-facing marketing and documentation landing page to showcase its 28 AST-based test smell detectors, three-step workflow, multi-provider LangChain AI refactoring engine, CLI/SDK capabilities, and official VS Code extension (`snuts-js`). Implementing a pixel-perfect Astro landing page from the `ui/snuts-js-design.pen` specifications (`HRgjU` desktop and `KpfL5` mobile frames) with Markdown-editable content and automated GitHub Pages deployment provides an interactive, maintainable web presence directly inside the repository without impacting the published npm package.

## What Changes

- **Isolated Astro Web Application (`site/`)**: Scaffold a standalone Astro project inside `snuts.js-core/site/` configured with Tailwind CSS, React + shadcn/ui primitives, Lucide icons, and Google Fonts (`Space Grotesk`, `Inter`, `JetBrains Mono`) so the root `@snutsjs/core` npm package and build artifacts remain completely untouched and zero-bloat.
- **Pixel-Perfect Design System & Responsive Sections**: Implement the exact custom SNUTS dark espresso/rose palette (`$snuts-canvas` `#261B1F`, `$snuts-espresso` `#35262B`, `$snuts-card` `#3F2D33`, `$snuts-well` `#1D1417`, `$snuts-border` `#543E45`, `$snuts-accent` `#DC6781`, `$snuts-accent-hover` `#EA7E96`, `$snuts-rose` `#CD6E80`, `$snuts-chestnut` `#885C52`, `$snuts-heading` `#FCE7D8`, `$snuts-text` `#F0DAC6`, `$snuts-muted` `#B8A39B`, `$snuts-meta` `#856F6A`, `$snuts-ok` `#89C7A1`, `$snuts-warn` `#E8B46D`, `$snuts-err` `#E56B7A`) and typography/radius tokens across all 8 sections matching `HRgjU` (1440px desktop) and `KpfL5` (390px mobile):
  1. **Sticky Navigation & Mobile Drawer**: Brand mascot badge, wordmark, version pill (`v1.4`), section anchor links, GitHub stars badge, primary CTA button, and responsive mobile menu drawer.
  2. **Hero Section**: Eyebrow badge, dual-color display headline, subhead, interactive CLI install pill with one-click clipboard copy (`npm install @snutsjs/core`), primary/secondary CTAs, trust strip, radial pink/warm ambient glows, and before/after `auth.test.ts` code comparison window with inline diagnostic badges and AI Refactor toolbar.
  3. **How It Works (3-Step Workflow)**: Section header with Mascot Pose A, three numbered step cards (`01 Parse AST`, `02 Detect 28 Smells`, `03 Report or Refactor`), and desktop dashed chestnut connectors.
  4. **28 Built-in Test Smell Detectors Catalog**: Section header with inline SVG Mascot Pose B, interactive category filter tabs (`All (28)`, `Assertions (8)`, `Structure & Clarity (8)`, `Logic & Flow (6)`, `Flakiness & Isolation (6)`), live search input (`Filter 28 detectors...`), 12 featured detector cards with category pills, trigger code chips, and configurable threshold pills, plus the expandable/searchable `+ 16 more built-in detectors` chip bar.
  5. **LangChain-Powered AI Refactor Section**: Section header with inline SVG Mascot Pose C, 5 LLM provider pills (`OpenAI gpt-4.1-mini`, `Google Gemini gemini-2.0-flash`, `Anthropic Claude claude-3-5-sonnet`, `DeepSeek deepseek-chat`, `Moonshot Kimi moonshot-v1-8k`), `payment.spec.ts` unified diff window (and mobile stacked before/after panels), and 3 capability cards (`Safe Preview-First Workflow`, `Bounded Batch Concurrency`, `Targeted Smell Filtering`).
  6. **CLI & TypeScript SDK Section**: Interactive 5-tab code card (`CLI: analyze`, `CLI: refactor`, `CLI: watch`, `snuts.config.json`, `TypeScript SDK`) with terminal command views, programmatic SDK + config side panels, and side-effect-free safety banner.
  7. **Official VS Code Extension (`snuts-js`) Banner**: Top accent bar, extension badge, 4 checkmarked feature items, Marketplace install CTA + repo link, Mascot Pose D, and detailed VS Code editor mockup with Explorer tree, active editor tabs, tokenized `auth.test.ts` lines, `PROBLEMS (4)` panel, and floating Context Menu / Quick Fix (`Cmd + .`) overlays.
  8. **Final CTA Card & Footer**: Call-to-action card with Mascot Pose D, copyable `npx @snutsjs/core analyze . --format json` bar, action buttons, 5 compatibility pills, and multi-column footer (`CORE`, `ECOSYSTEM`, `COMMUNITY`, copyright, and repo link).
- **Markdown-Driven Content Architecture**: Store all landing page copy, navigation links, hero code snippets, workflow steps, all 28 detector definitions, AI providers/capabilities/diff lines, CLI/SDK tabs, VS Code showcase items, and CTA/footer content in structured Markdown files (Astro Content Collections / Markdown frontmatter + body under `site/src/content/`) so non-code content edits require only editing Markdown files.
- **GitHub Pages Deployment Pipeline**: Configure Astro static output (`output: 'static'`) with automatic `site` and `base` path resolution for GitHub Pages (`https://jhonatanmizu.github.io/snuts.js-core/` or custom domain override), `.nojekyll` asset handling, root convenience scripts (`site:dev`, `site:build`, `site:preview`), and a dedicated GitHub Actions workflow (`.github/workflows/deploy-pages.yml`) using `actions/upload-pages-artifact` and `actions/deploy-pages`.

## Capabilities

### New Capabilities

- `landing-page-ui`: Pixel-perfect responsive Astro + Tailwind CSS + shadcn/ui landing page implementing desktop (`HRgjU`) and mobile (`KpfL5`) design frames, custom SNUTS theme tokens, custom mascot SVG illustrations, and interactive islands (detector category/search filtering, CLI/SDK tabs, clipboard copy buttons, mobile navigation menu).
- `landing-page-markdown-content`: Markdown-based content management using Astro Content Collections with strict TypeScript/Zod schemas so every section's copy, code examples, and 28 detector catalog items can be edited via Markdown files.
- `github-pages-deployment`: Static build configuration and GitHub Actions CI/CD workflow to build and deploy the Astro landing page to GitHub Pages while keeping `@snutsjs/core` library builds, ESLint, Jest, and TypeScript checks cleanly isolated.

### Modified Capabilities

## Impact

- **`snuts.js-core/site/`**: New standalone Astro application containing components, layouts, shadcn/ui primitives, styles, static assets (`mascot.png`, `mascot-wide.png`, extracted SVG mascot poses), and Markdown content collections.
- **`snuts.js-core/.github/workflows/deploy-pages.yml`**: New GitHub Actions workflow deploying `site/dist` to GitHub Pages on push to `main` (and `workflow_dispatch`).
- **`snuts.js-core/package.json`, `eslint.config.js`, `tsconfig.json`, `.gitignore`, `README.md`**: Root workspace ignore rules updated so `site/` build artifacts and Astro files do not interfere with `@snutsjs/core` library `tsup`, `tsc`, `jest`, or `npm pack` outputs; convenience scripts and documentation added.
