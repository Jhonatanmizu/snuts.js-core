# Tasks

## 1. Astro Project Scaffolding & Workspace Isolation

- [x] 1.1 Create `snuts.js-core/site/` with `package.json`, `astro.config.mjs`, `tsconfig.json`, and `.nojekyll`, and verify dependencies install cleanly via `yarn --cwd site install`
- [x] 1.2 Update root `eslint.config.js`, `tsconfig.json`, `.gitignore`, `.prettierignore`, and `package.json` scripts (`site:dev`, `site:build`, `site:preview`, `site:check`) so `site/` is isolated from `@snutsjs/core` library builds, and verify `yarn lint`, `yarn typecheck`, `yarn test`, `yarn build`, and `npm pack --dry-run` pass in root

## 2. Design System Tokens, Assets & shadcn/ui Primitives

- [x] 2.1 Configure Tailwind CSS and `site/src/styles/global.css` with all custom SNUTS color variables (`--snuts-canvas` through `--snuts-chestnut-10`), radii (`16px`, `14px`, `10px`, `999px`), Google Fonts (`Space Grotesk`, `Inter`, `JetBrains Mono`), and shadcn/ui semantic token mappings, and verify `site/src/styles/global.css` compiles without errors
- [x] 2.2 Copy `ui/assets/mascot.png` and `ui/assets/mascot-wide.png` into `site/public/assets/` and extract the exact vector path nodes for Mascot Pose B (`GoTxw`), Mascot Pose C (`XCZKY`), and Mascot Pose D (`eaRCp`) from `ui/snuts-js-design.pen` into `site/public/assets/mascot-pose-b.svg`, `mascot-pose-c.svg`, and `mascot-pose-d.svg`, verifying all SVG files are valid and render with exact viewBoxes
- [x] 2.3 Implement strict TypeScript (zero `any`, zero `console.*`) shadcn/ui primitives (`Button`, `Badge`, `Card`, `Input`, `Tabs`, and mobile menu drawer/sheet) plus a `withBase` path helper in `site/src/lib/utils.ts`, and verify they pass `yarn --cwd site astro check`

## 3. Markdown Content Collections & Schema Validation

- [x] 3.1 Define Astro Content Collections in `site/src/content/config.ts` with strict Zod schemas for `sections` (`site`, `hero`, `workflow`, `detectors-section`, `ai-refactor`, `cli-sdk`, `vscode`, `cta`) and `detectors` (all 28 built-in test smell detectors), and verify `astro sync` generates strict TypeScript types
- [x] 3.2 Author the section Markdown files in `site/src/content/sections/` (`site.md`, `hero.md`, `workflow.md`, `detectors-section.md`, `ai-refactor.md`, `cli-sdk.md`, `vscode.md`, `cta.md`) matching every desktop (`HRgjU`) and mobile (`KpfL5`) string, code snippet, diff line, and link, and verify schema validation succeeds
- [x] 3.3 Author Markdown content files in `site/src/content/detectors/` for all 28 built-in test smell detectors (12 featured cards with category, description, trigger, and threshold plus 16 additional detectors across `Assertions (8)`, `Structure & Clarity (8)`, `Logic & Flow (6)`, and `Flakiness & Isolation (6)`), and verify all 28 entries load and validate at build time

## 4. Pixel-Perfect Responsive Landing Page Sections & Interactive Islands

- [x] 4.1 Implement the root `Layout.astro`, Sticky Navigation bar (`Nav.astro`), and interactive `MobileNav.tsx` island matching `HRgjU` (`YZCkV`) on desktop and `KpfL5` (`VXZAr`) on mobile, and verify anchor links and mobile drawer toggle work
- [x] 4.2 Implement the Hero section (`Hero.astro`) and interactive `CopyCommandPill.tsx` island with the dual-line 54px/33px display headline, CLI install pill (`npm install @snutsjs/core`), CTAs, trust strip, radial pink/warm ambient glows, desktop `auth.test.ts` Before/After + AI Refactor window, and mobile `payment.spec.ts` compact Before/After window, verifying visual parity with `b4AoyP` and `cI95g`
- [x] 4.3 Implement Section 3 · Workflow (`Workflow.astro`) with Mascot Pose A (`mascot.png`), three numbered step cards (`01 Parse AST`, `02 Detect 28 Smells`, `03 Report or Refactor`), and desktop dashed chestnut connectors, verifying layout parity with `QfuKs` and `wMMZi`
- [x] 4.4 Implement Section 4 · 28 Detectors Catalog (`DetectorsSection.astro` and interactive `DetectorsCatalog.tsx` island) with Mascot Pose B (`GoTxw`), category filter tabs (`All (28)`, `Assertions (8)`, `Structure & Clarity (8)`, `Logic & Flow (6)`, `Flakiness & Isolation (6)`), live search input (`Filter 28 detectors...`), 3-column detector cards with triggers and thresholds, and the expandable `+ 16 more built-in detectors` (mobile `+ 24 more detectors available`) section, verifying filtering, search, and expansion behavior
- [x] 4.5 Implement Section 5 · AI Refactor (`AiRefactor.astro`) with Mascot Pose C (`XCZKY`), the 5 LLM provider pills (`OpenAI`, `Google Gemini`, `Anthropic Claude`, `DeepSeek`, `Moonshot Kimi`), desktop unified `payment.spec.ts` diff panel, mobile stacked Before/After diff panels with `AI refactor with preview` chip, and the 3 capability cards, verifying visual parity with `fm6iO` and `H6DTi`
- [x] 4.6 Implement Section 6 · CLI & SDK (`CliSdkSection.astro` and interactive `CliSdkTabs.tsx` island) with the 5 interactive tabs (`CLI: analyze`, `CLI: refactor`, `CLI: watch`, `snuts.config.json`, `TypeScript SDK`), terminal command window, programmatic SDK and `snuts.config.json` code wells, and side-effect-free safety banner, verifying tab switching on desktop (`gUqqk`) and mobile (`zOYxy`)
- [x] 4.7 Implement Section 7 · VS Code Extension (`VsCodeSection.astro`) with the 3px top accent bar, `Official VS Code Extension · snuts-js` badge, 4 checkmarked features, Marketplace CTA + repo link, Mascot Pose D (`vxGgs`), and the VS Code editor mockup (`Explorer`, `auth.test.ts` tabs and tokenized code, `PROBLEMS (4)` panel, and floating `Context Menu` and `Quick Fix` overlays), verifying visual parity with `FQKoc` and `SWQaU`
- [x] 4.8 Implement Section 8 · Final CTA Card & Footer (`CtaFooter.astro`) with Mascot Pose D (`eaRCp`), copyable `npx @snutsjs/core analyze . --format json` bar, primary/secondary buttons, 5 compatibility pills, and multi-column footer (`CORE`, `ECOSYSTEM`, `COMMUNITY`), verifying visual parity with `qSsQd` and `Zu2nN`

## 5. GitHub Pages Deployment Pipeline, Documentation & End-to-End Verification

- [x] 5.1 Create `.github/workflows/deploy-pages.yml` to build `site/` with GitHub Pages base-path configuration and deploy `site/dist` via `actions/upload-pages-artifact` and `actions/deploy-pages`, and document landing page development, Markdown content editing, and GitHub Pages deployment in `README.md`
- [x] 5.2 Run `yarn site:check` and `yarn site:build` to verify zero TypeScript/Astro errors and static HTML/asset generation in `site/dist`, and run `yarn lint`, `yarn typecheck`, `yarn test`, and `yarn build` in `snuts.js-core/` to verify all repository quality gates pass
