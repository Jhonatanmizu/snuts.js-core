# Spec Delta

## Purpose

Provides static site build configuration, asset base-path resolution, workspace isolation, and automated GitHub Actions deployment so the Astro landing page deploys cleanly to GitHub Pages without affecting the `@snutsjs/core` npm library.

## ADDED Requirements

### Requirement: Static GitHub Pages Output and Base Path Support

The Astro application SHALL build to a static HTML/CSS/JS output directory (`site/dist`) with configurable `site` URL and `base` path resolution so all assets, mascot images, fonts, and links work when hosted under a GitHub Pages repository subpath (`/snuts.js-core/`) or root domain.

#### Scenario: Static build for GitHub Pages subpath

- **WHEN** the landing page is built for GitHub Pages deployment
- **THEN** Astro generates static assets in `site/dist` including a `.nojekyll` file, and all asset URLs (`mascot.png`, stylesheets, client island bundles) resolve relative to the configured base path without broken 404 requests

### Requirement: Automated GitHub Actions Deployment Workflow

The repository SHALL include a GitHub Actions workflow (`.github/workflows/deploy-pages.yml`) that builds the Astro landing page and deploys it to GitHub Pages on pushes to `main` affecting `site/` or the deployment workflow, as well as on manual `workflow_dispatch`.

#### Scenario: Automated deployment triggered on push to main

- **WHEN** changes to `site/**` or `.github/workflows/deploy-pages.yml` are pushed to the `main` branch (or triggered manually via `workflow_dispatch`)
- **THEN** the GitHub Actions workflow installs dependencies, builds the static site in `site/dist`, uploads the Pages artifact via `actions/upload-pages-artifact`, and deploys it via `actions/deploy-pages`

### Requirement: Isolation from Core Library Package and Quality Gates

The `site/` directory SHALL remain isolated from the root `@snutsjs/core` npm package build (`dist/`), `npm pack`, Jest test runner, and root TypeScript/ESLint library checks while maintaining its own strict zero-`any` TypeScript and zero-`console.*` compliance.

#### Scenario: Running root library quality gates and npm pack

- **WHEN** `yarn lint`, `yarn typecheck`, `yarn test`, `yarn build`, and `npm pack --dry-run` are executed in `snuts.js-core/`
- **THEN** all root quality gates pass and the resulting npm tarball contains only `bin/`, `dist/`, `README.md`, `LICENSE`, and `package.json` with zero files from `site/`
