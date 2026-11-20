# Spec Delta

## Purpose

Defines the visual, responsive, and interactive requirements for the SNUTS.js landing page across desktop (`HRgjU`) and mobile (`KpfL5`) layouts using the SNUTS design token palette, typography, and interactive UI components.

## ADDED Requirements

### Requirement: Custom SNUTS Design System Tokens

The landing page SHALL apply the custom SNUTS dark espresso and rose color tokens, typography families (`Space Grotesk`, `Inter`, `JetBrains Mono`), and border radii defined in the design specification.

#### Scenario: Theme tokens render accurately on page load

- **WHEN** a user loads the landing page in a web browser
- **THEN** the page background uses `#261B1F` (`snuts-canvas`), surfaces use `#35262B` (`snuts-espresso`), `#3F2D33` (`snuts-card`), and `#1D1417` (`snuts-well`), borders use `#543E45`, accents use `#DC6781` and `#EA7E96`, and display, body, and code text render in `Space Grotesk`, `Inter`, and `JetBrains Mono` respectively

### Requirement: Responsive Desktop and Mobile Layouts

The landing page SHALL adapt smoothly between the 1440px desktop design (`HRgjU`) and the 390px mobile design (`KpfL5`) across all eight sections without horizontal overflow.

#### Scenario: Desktop layout rendering

- **WHEN** the viewport width is at least 1024px
- **THEN** the navigation displays inline section links and GitHub/Get Started actions, the Hero displays a two-column split with the `auth.test.ts` code comparison window, the Workflow displays three horizontal step cards connected by dashed chestnut dividers, the Detectors section displays a 3-column card grid plus chip rows, and the AI Refactor, CLI & SDK, and VS Code sections display side-by-side split layouts

#### Scenario: Mobile layout rendering

- **WHEN** the viewport width is 390px
- **THEN** the navigation collapses links into a 44x44 menu button alongside a 44x44 GitHub button, the Hero stacks copy and CTAs above a compact before/after code card, the Workflow stacks steps vertically, the Detectors filter bar scrolls horizontally above stacked cards, the AI Refactor section stacks provider chips and before/after diff panels vertically, and the CLI & SDK and VS Code sections stack vertically

### Requirement: Interactive Navigation and Mobile Menu

The navigation header SHALL provide anchor links to page sections (`#workflow`, `#detectors`, `#ai-refactor`, `#cli-sdk`, `#vscode`), external links to GitHub and getting started, and an interactive mobile navigation drawer on small screens.

#### Scenario: Mobile user opens navigation menu

- **WHEN** a user on a mobile viewport taps the menu toggle button in the top navigation bar
- **THEN** an accessible navigation drawer or menu opens displaying the section links and primary actions, and selecting a link closes the menu and scrolls to that section

### Requirement: Hero Code Comparison and Clipboard Copy

The Hero section and Final CTA section SHALL provide one-click clipboard copy controls for CLI commands (`npm install @snutsjs/core` and `npx @snutsjs/core analyze . --format json`) with visual confirmation feedback.

#### Scenario: User copies CLI install command

- **WHEN** a user clicks the `Copy` button inside the Hero CLI install pill or CTA CLI bar
- **THEN** the command text is copied to the system clipboard and the button displays a temporary copied confirmation state

### Requirement: Interactive 28 Detectors Catalog Filtering and Search

The Detectors section SHALL allow users to filter the 28 built-in test smell detectors by category tab (`All (28)`, `Assertions (8)`, `Structure & Clarity (8)`, `Logic & Flow (6)`, `Flakiness & Isolation (6)`), search by detector name, description, or trigger keyword, and expand or collapse the full catalog of 28 detectors.

#### Scenario: Filtering detectors by category tab

- **WHEN** a user selects a category tab such as `Assertions (8)` or `Flakiness & Isolation (6)`
- **THEN** only detectors belonging to the selected category are displayed and the active tab is styled with the `#DC6781` (`snuts-accent`) pill fill and `#261B1F` text

#### Scenario: Searching detectors by keyword

- **WHEN** a user types a search query into the `Filter 28 detectors...` input field
- **THEN** the displayed detector cards and chips filter in real time to show only detectors matching the query in their name, category, description, or trigger expression

#### Scenario: Viewing all 28 detectors

- **WHEN** a user clicks `View all 28 detectors` (or `+ 24 more detectors available` on mobile) or filters the catalog
- **THEN** the additional detectors are revealed with their full metadata or accessible in the catalog view

### Requirement: Interactive CLI and TypeScript SDK Tabbed Showcase

The CLI & SDK section SHALL allow users to switch among the five tabs (`CLI: analyze`, `CLI: refactor`, `CLI: watch`, `snuts.config.json`, `TypeScript SDK`) to inspect the corresponding terminal commands, configuration JSON, and TypeScript SDK usage.

#### Scenario: Switching CLI and SDK tabs

- **WHEN** a user clicks one of the five tabs in the CLI & SDK code card
- **THEN** the active tab displays the `#DC6781` underline indicator and `#EA7E96` label text, and the terminal/code panel updates or highlights the corresponding command and code snippet

### Requirement: Multi-LLM AI Refactor and VS Code Extension Showcases

The landing page SHALL render the AI Refactor section with the five LLM provider badges, `payment.spec.ts` unified diff view, and three capability cards, and the VS Code section with the four feature highlights, editor mockup (`Explorer`, `auth.test.ts` editor, `PROBLEMS (4)` panel, and floating `Context Menu` / `Quick Fix` menus), and custom vector Mascot Poses A, B, C, and D.

#### Scenario: Inspecting AI Refactor and VS Code mockups

- **WHEN** a user scrolls through the AI Refactor and VS Code sections
- **THEN** all five LLM provider badges (`OpenAI`, `Google Gemini`, `Anthropic Claude`, `DeepSeek`, `Moonshot Kimi`), the `payment.spec.ts` diff lines, the VS Code mockup window with `PROBLEMS (4)` and floating menus, and the corresponding Mascot Pose illustrations render accurately
