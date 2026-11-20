# Design

## Context

`snuts.js-core` is an ESM TypeScript library and CLI (`@snutsjs/core`) built with `tsup`, tested with `jest`, and linted with `eslint` under strict rules (`strict: true`, zero `any`, zero `console.*`, self-documenting code). The design specification in `ui/snuts-js-design.pen` contains two complete responsive landing page frames:

- **Node `HRgjU` (`02 — Desktop Landing Page`, 1440px width)**: 8 sections (Sticky Nav, Hero with `auth.test.ts` Before/After + AI Refactor window, 3-Step Workflow with dashed chestnut connectors, 28 Built-in Test Smell Detectors with category tabs + search + 12 featured cards + 16 detector chips, LangChain AI Refactor section with 5 provider pills + `payment.spec.ts` diff + 3 capability cards, 5-tab CLI & SDK code showcase, Official VS Code Extension banner with full editor mockup + floating context/quick-fix menus, and Final CTA + 3-column Footer).
- **Node `KpfL5` (`03 — Mobile Landing Page`, 390px width)**: Responsive mobile counterpart with 64px nav bar (`44x44` GitHub and Menu buttons), compact Hero `payment.spec.ts` Before/After preview, stacked Workflow cards, horizontally scrollable Detector category tabs + 4 compact cards + `+ 24 more detectors available` trigger, stacked AI Refactor Before/After panels with `AI refactor with preview` chip, horizontally scrollable CLI & SDK tabs, stacked VS Code feature list + compact editor mockup, and stacked CTA + 2-column Footer.
- **Assets**: `ui/assets/mascot.png` (Pose A raster image) and three custom vector illustrations embedded directly as path trees in the `.pen` file (`Mascot Pose B` in node `GoTxw`, `Mascot Pose C` in node `XCZKY`, and `Mascot Pose D` in nodes `vxGgs` / `eaRCp`).

See `proposal.md` for motivation and `specs/` for behavioral requirements.

## Goals / Non-Goals

**Goals:**

- Deliver a pixel-perfect Astro + Tailwind CSS + shadcn/ui landing page in `snuts.js-core/site/` that matches `HRgjU` at desktop breakpoints and `KpfL5` at mobile breakpoints.
- Enable 100% Markdown-driven editing of landing page copy, code examples, navigation/footer links, and all 28 detector catalog items via Astro Content Collections (`site/src/content/`).
- Provide interactive React + shadcn/ui islands for detector filtering/search/expansion, CLI & SDK tab switching, one-click clipboard copy pills, and the mobile navigation drawer.
- Extract the vector path nodes (`GoTxw`, `XCZKY`, `eaRCp`) from `ui/snuts-js-design.pen` into clean SVG components/assets alongside `mascot.png` so every mascot pose renders identically to the `.pen` canvas.
- Configure static GitHub Pages output and an automated `.github/workflows/deploy-pages.yml` workflow while keeping root `@snutsjs/core` build, test, lint, and npm package publishing completely isolated.

**Non-Goals:**

- Running live Babel AST analysis or live LLM API calls in the browser (code windows and diffs are deterministic, Markdown-editable showcases).
- Modifying `@snutsjs/core` runtime detectors, CLI commands, or public library exports.

## Decisions

### 1. Sub-Project Isolation in `snuts.js-core/site/`

- **Decision**: Place the Astro application in `snuts.js-core/site/` with its own `package.json`, `tsconfig.json`, `astro.config.mjs`, and Tailwind/shadcn configuration, and add `"site/**"` to root `eslint.config.js` ignores and `"site"` to root `tsconfig.json` `exclude`. Add root `package.json` scripts (`site:install`, `site:dev`, `site:build`, `site:preview`, `site:check`) that delegate via `yarn --cwd site`.
- **Rationale**: `@snutsjs/core` is published to npm (`"files": ["bin", "dist", "README.md", "LICENSE"]`) and uses `tsup` + `jest` with Node/CommonJS interop. Mixing Astro, React, Tailwind CSS, and browser DOM types into the root `package.json` and root `tsconfig.json` would pollute `@snutsjs/core`'s dependency graph and slow down library CI. A dedicated `site/` directory guarantees zero impact on `npm pack` and root quality gates while keeping the landing page co-located in the repo.
- **Alternatives Considered**:
  - _Root-level Astro config_: Rejected because root `package.json` is the published `@snutsjs/core` library manifest.

### 2. Styling & Design System Architecture (Tailwind CSS + CSS Variables + shadcn/ui)

- **Decision**: Map every design variable from `ui/snuts-js-design.pen` (`variables`) into CSS custom properties and Tailwind theme utilities in `site/src/styles/global.css`:
  - Colors:
    - `--snuts-canvas: #261B1F`
    - `--snuts-espresso: #35262B`
    - `--snuts-card: #3F2D33`
    - `--snuts-card-hover: #4A363D`
    - `--snuts-well: #1D1417`
    - `--snuts-border: #543E45`
    - `--snuts-accent: #DC6781`
    - `--snuts-accent-hover: #EA7E96`
    - `--snuts-rose: #CD6E80`
    - `--snuts-chestnut: #885C52`
    - `--snuts-heading: #FCE7D8`
    - `--snuts-text: #F0DAC6`
    - `--snuts-muted: #B8A39B`
    - `--snuts-meta: #856F6A`
    - `--snuts-ok: #89C7A1`
    - `--snuts-warn: #E8B46D`
    - `--snuts-err: #E56B7A`
    - Alpha tokens: `--snuts-accent-12: #DC67811F`, `--snuts-accent-14: #DC678124`, `--snuts-accent-35: #DC678159`, `--snuts-ok-12: #89C7A11F`, `--snuts-warn-14: #E8B46D24`, `--snuts-err-14: #E56B7A24`, `--snuts-chestnut-10: #885C521A`
  - Fonts: Load `Space Grotesk` (600, 700), `Inter` (400, 500, 600, 700), and `JetBrains Mono` (400, 500, 600) via Google Fonts and bind to `--font-display`, `--font-body`, and `--font-mono`.
  - Radii: `--snuts-r-card: 16px`, `--snuts-r-code: 14px`, `--snuts-r-btn: 10px`, `--snuts-r-pill: 999px`.
  - Bridge shadcn/ui semantic tokens (`--background`, `--foreground`, `--card`, `--primary`, `--secondary`, `--muted`, `--accent`, `--border`, `--input`, `--ring`) directly to the SNUTS palette so all shadcn/ui components (`Button`, `Badge`, `Card`, `Tabs`, `Input`, `Sheet` / mobile drawer) inherit the exact SNUTS look out of the box.
- **Rationale**: Preserves 1:1 visual fidelity with `HRgjU` and `KpfL5` while leveraging accessible shadcn/ui primitives.

### 3. Markdown Content Collections Schema (`site/src/content/`)

- **Decision**: Use Astro Content Collections (`site/src/content/config.ts`) backed by Zod schemas with two collections:
  1. `sections` (`site/src/content/sections/*.md`):
     - `site.md`: Brand metadata (`name`, `version`, `githubUrl`, `githubStars`, `npmPackage`, `vscodeMarketplaceUrl`, `vscodeRepoUrl`), navigation links, and footer columns (`CORE`, `ECOSYSTEM`, `COMMUNITY` for desktop + mobile).
     - `hero.md`: Desktop and mobile eyebrow labels, H1 lines, subheads, CLI install command, primary/secondary CTAs, trust strip items, desktop `auth.test.ts` before/after code lines + diagnostics + AI toolbar metadata, and mobile `payment.spec.ts` compact before/after lines.
     - `workflow.md`: Kicker (`HOW IT WORKS`), desktop and mobile titles, and the 3 steps (`01 Parse AST`, `02 Detect 28 Smells`, `03 Report or Refactor`) with icon names and desktop/mobile descriptions.
     - `detectors-section.md`: Kicker (`THE CATALOG`), desktop and mobile titles/subtitles, search placeholder, category tab definitions (`All`, `Assertions`, `Structure & Clarity`, `Logic & Flow`, `Flakiness & Isolation`), and expandable bar labels.
     - `ai-refactor.md`: Eyebrow, desktop and mobile titles/subtitles, the 5 LLM providers (`OpenAI`, `Google Gemini`, `Anthropic Claude`, `DeepSeek`, `Moonshot Kimi` with dot colors and model names), `payment.spec.ts` diff lines, footer note, and the 3 capability cards (`Safe Preview-First Workflow`, `Bounded Batch Concurrency`, `Targeted Smell Filtering`).
     - `cli-sdk.md`: Desktop and mobile titles/subtitles, the 5 tabs (`CLI: analyze`, `CLI: refactor`, `CLI: watch`, `snuts.config.json`, `TypeScript SDK`) with terminal commands, programmatic SDK code block, `snuts.config.json` snippet, and side-effect-free note.
     - `vscode.md`: Badge text, desktop and mobile headings, 4 checkmarked feature items (with desktop/mobile descriptions), CTA labels, and VS Code editor mockup data (explorer tree, editor lines, 4 problems, context menu items, and quick fix items).
     - `cta.md`: Eyebrow (`FREE & OPEN SOURCE`), desktop and mobile titles/subtitles, CLI command (`npx @snutsjs/core analyze . --format json`), primary/secondary buttons, and 5 compatibility pills (`Jest & ts-jest`, `JavaScript / TypeScript`, `Zero configuration`, `VS Code ready`, `GPL-3.0`).
  2. `detectors` (`site/src/content/detectors/*.md`):
     - Individual Markdown files (or grouped Markdown entries) for all 28 detectors (`order`, `name`, `category`, `trigger`, `threshold`, `featured`, `mobileFeatured`, and Markdown body/description).
     - The 12 featured cards (`Conditional Test Logic`, `Assertion Roulette`, `Magic Number Test`, `Verbose Test`, `Mystery Guest`, `Sleepy Test`, `Dependent Test`, `Complex Snapshot`, `Sensitive Equality`, `Focused / Isolated Test`, `Anonymous Test`, `Assertion in Setup`) and the 16 additional built-in detectors (`Comments-Only Test`, `Duplicate Assert`, `Eager Test`, `Exception Handling`, `General Fixture`, `Identical Description`, `Ignored Test`, `Lazy Test`, `Overcommented Test`, `Redundant Assertion`, `Resource Optimism`, `Test Without Description`, `Non-Functional Statement`, `Suboptimal Assertion`, `Transcripting Test`, `Unknown Test`) all share the same schema so filtering, searching, and expanding work seamlessly across all 28 detectors.
- **Rationale**: Storing content in Markdown files with typed frontmatter and Markdown bodies satisfies the requirement that all content is editable via Markdown while keeping strict TypeScript safety (`zero any`) throughout Astro templates and React islands.

### 4. Exact Vector Mascot Extraction

- **Decision**: Convert the vector path hierarchies for `Mascot Pose B` (`GoTxw`, 196x196 viewBox), `Mascot Pose C` (`XCZKY`, 196x196 viewBox), and `Mascot Pose D` (`eaRCp`, 98x98 viewBox) directly from `ui/snuts-js-design.pen` into static SVG files (`site/public/assets/mascot-pose-b.svg`, `mascot-pose-c.svg`, `mascot-pose-d.svg`) and copy `ui/assets/mascot.png` and `ui/assets/mascot-wide.png` into `site/public/assets/`.
- **Rationale**: In `ui/snuts-js-design.pen`, Pose A uses `assets/mascot.png`, whereas Poses B, C, and D are multi-path vector illustrations embedded in the `.pen` JSON. Extracting their exact `<path d="..." fill="..." transform="..."/>` nodes into SVGs guarantees 100% pixel-perfect visual parity with the design file.

### 5. GitHub Pages Configuration & CI/CD Workflow

- **Decision**:
  - In `site/astro.config.mjs`, set `output: "static"` and read `ASTRO_SITE` (defaulting to `"https://jhonatanmizu.github.io"`) and `ASTRO_BASE` (defaulting to `"/snuts.js-core"` in CI when deployed to project Pages, or `"/"` in local dev / custom domain).
  - Create a helper for prefixing static public asset paths with `import.meta.env.BASE_URL` so images (`mascot.png`, `mascot-pose-*.svg`) and internal links work regardless of whether `base` is `/` or `/snuts.js-core`.
  - Add `site/public/.nojekyll` so GitHub Pages serves `_astro/` assets without Jekyll filtering.
  - Create `.github/workflows/deploy-pages.yml` using `actions/configure-pages@v5`, `actions/upload-pages-artifact@v3` (pointing to `site/dist`), and `actions/deploy-pages@v4` with proper `pages: write` and `id-token: write` permissions.

## Risks / Trade-offs

- **[Risk] Subpath asset breakage on GitHub Pages (`/snuts.js-core/`)** → **Mitigation**: Use a typed `withBase(path)` utility around `import.meta.env.BASE_URL` for all public image URLs and configure `actions/configure-pages` in `.github/workflows/deploy-pages.yml` to inject the repository base path automatically during CI builds.
- **[Risk] Desktop (`1440px`) and Mobile (`390px`) designs have slightly different code window layouts (e.g., Hero shows `auth.test.ts` on desktop and compact `payment.spec.ts` diff on mobile; AI Refactor shows unified diff on desktop and split Before/After cards on mobile)** → **Mitigation**: Render responsive layouts using Tailwind breakpoint classes (`hidden lg:flex` / `flex lg:hidden`) where the mobile frame (`KpfL5`) intentionally presents a tailored compact structure, ensuring pixel-perfect fidelity to both `HRgjU` and `KpfL5`.
- **[Risk] Root ESLint/TypeScript/Jest picking up `site/` files** → **Mitigation**: Explicitly ignore `site/**` in root `eslint.config.js`, `tsconfig.json`, and `jest.config.js`, and run `astro check` + ESLint inside `site/` via dedicated `site:check` and `site:build` scripts.
