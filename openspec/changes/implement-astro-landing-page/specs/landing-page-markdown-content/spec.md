# Spec Delta

## Purpose

Enables maintainers to edit all landing page copy, navigation links, workflow steps, 28 test smell detector entries, AI provider/capability descriptions, CLI/SDK code tabs, VS Code feature highlights, and CTA/footer links through typed Markdown files without modifying UI component source code.

## ADDED Requirements

### Requirement: Markdown Content Collections for All Landing Page Sections

The landing page SHALL source its section text, navigation metadata, workflow steps, AI refactoring content, CLI & SDK tabs, VS Code showcase items, and CTA/footer links from Markdown files stored in `site/src/content/`.

#### Scenario: Editing landing page section copy via Markdown

- **WHEN** a maintainer modifies a title, subtitle, CTA label, CLI command, or feature description in a section Markdown file under `site/src/content/` and rebuilds the site
- **THEN** the rendered HTML reflects the updated text without any changes to `.astro` or `.tsx` component files

### Requirement: Markdown-Editable Catalog of 28 Test Smell Detectors

The 28 built-in test smell detectors SHALL be defined in Markdown content files with structured metadata (name, category, short description, trigger code snippet, optional threshold badge, featured status, and display order).

#### Scenario: Editing or adding detector metadata in Markdown

- **WHEN** a maintainer edits a detector's description, category, trigger snippet, or threshold in its Markdown content file
- **THEN** both the desktop/mobile detector cards and the interactive filter/search island automatically display the updated detector metadata

### Requirement: Build-Time Schema Validation for Markdown Content

All Markdown content files SHALL be validated at build time against strict schemas so missing required fields or invalid category names fail the build with a descriptive error.

#### Scenario: Invalid Markdown frontmatter fails build

- **WHEN** a Markdown content file omits a required field or uses an unknown detector category
- **THEN** the Astro content collection check fails at build time with a schema validation error identifying the invalid file and field
