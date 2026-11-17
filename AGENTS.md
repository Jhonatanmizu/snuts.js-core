# @snutsjs/core — AI Agent Rules

Every AI agent working in `snuts.js-core` MUST strictly adhere to these engineering rules and repository conventions.

---

## 1. Strict TypeScript — Zero `any`

- **Never use `any`**: Explicit `any`, `as any`, `<any>`, and untyped parameters/returns are forbidden across `lib/` and `*.test.ts` (enforced by `@typescript-eslint/no-explicit-any: "error"`).
- **Safe Type Narrowing**:
  - Use `unknown` for untrusted inputs (JSON payloads, CLI arguments, caught exceptions) and narrow with explicit type guards.
  - When working with Babel AST nodes (`@babel/types`), narrow using `t.is*` predicates (e.g., `t.isCallExpression`, `t.isIdentifier`, `t.isStringLiteral`) or cast the result of `astService.query(ast, selector)` to the specific `t.Node` subtype matched by the selector.
- **Path Aliases**: Always use the `@/` path alias (e.g., `import { logger } from "@/shared/logger"`) instead of deep relative imports (`../../../`).
- **Import Ordering**: Maintain grouped imports separated by a blank line in the order: `builtin` -> `external` -> `internal` (`@/*`) -> `parent` -> `sibling` -> `index` (enforced by `eslint-plugin-import`).

---

## 2. Logging Policy — Zero `console.*` & No Debug Logs

- **Never use `console.*`**: `console.log`, `console.debug`, `console.info`, `console.warn`, and `console.error` are strictly prohibited across all implementation and test files (enforced by ESLint `no-console: "error"`).
- **No Unnecessary Logging**: Do not add debug, trace, or progress logs when implementing features or fixing bugs.
- **Structured Logger Only When Required**:
  - In library modules (`lib/`), use `logger` from `@/shared/logger` only where architectural error/warning reporting is required (such as `logger.error({ err, file }, ...)` in detector `catch` blocks or config validation warnings).
  - Never instantiate `pino` outside `lib/shared/logger` and `lib/bin/cli.ts`. The root library entry (`lib/index.ts`) must remain side-effect free so consumers (like the VS Code extension) can inject a custom `ILogger` via `setLogger()`.
  - CLI terminal output in `lib/bin/cli.ts` must use `process.stdout.write` / `process.stderr.write` via `writeOutput()`.

---

## 3. Comments Policy — Self-Documenting Code Only

- **No Unnecessary Comments**: Do not write comments that restate what the code does, narrate control flow, add visual section banners, or leave `TODO` / `FIXME` notes.
- **No Commented-Out Code**: Remove dead code completely.
- **Allowed Comments**:
  - Concise JSDoc on exported public interfaces, types, and entry functions when documenting contracts or non-obvious parameters.
  - Brief _"why"_ comments only when explaining non-obvious AST edge cases or intentional v1 parity decisions.

---

## 4. Architecture & Design Principles — SOLID & DRY

- **Single Responsibility Principle (SRP)**:
  - `lib/ast/`: AST parsing and `esquery` selector execution only.
  - `lib/detectors/`: One detector class per smell, implementing `Detector` from `@/core/detector.interface`.
  - `lib/core/`: Orchestration (`DetectorRunner`, `Watcher`).
  - `lib/reporter/`: Project traversal (`ProjectAnalyzer`) and single-format report serialization (`JsonReportGenerator`, `CsvReportGenerator`).
  - `lib/ai/`: LLM provider abstraction (`AIProvider`), prompt composition (`PromptComposer`), patch generation (`patch-utils`), and refactoring workflow (`RefactorService`).
  - `lib/evaluator/`: Benchmark normalization, TP/FP/FN metric calculation (`MetricsEvaluator`), and report formatting (`formatters`).
- **Open/Closed Principle (OCP)**:
  - Add new detectors by implementing `Detector`, adding metadata in `@/shared/smell-descriptions`, and exporting from `lib/detectors/index.ts`.
  - Add new report formats or AI providers by implementing `ReportGenerator` or `AIProvider` without modifying core runners.
- **Liskov Substitution & Interface Segregation (LSP & ISP)**:
  - Every `Detector.detect()` implementation must catch internal AST traversal errors, log via `logger.error`, and return `Smell[]` (never reject or throw unhandled exceptions).
  - Keep interfaces small and focused on consumer needs.
- **Dependency Inversion Principle (DIP)**:
  - Inject `Detector[]`, `SnutsConfig`, and `AIProviderRegistry` into services (`DetectorRunner`, `ProjectAnalyzer`, `RefactorService`) via constructors rather than hardcoding concrete dependencies.
- **Don't Repeat Yourself (DRY)**:
  - Centralize thresholds and AST constants in `@/shared/constants`.
  - Centralize reusable `esquery` selectors in `@/shared/selectors`.
  - Centralize smell descriptions, explanations, and severities in `@/shared/smell-descriptions`.

---

## 5. Testing Standards — Dogfooding SNUTS.js

- Pair every module or detector with a focused `<name>.test.ts` unit test file.
- For detectors, cover at least: one invalid example (triggers smell), one valid example (does not trigger), one edge case, and one mixed sample.
- **Zero Test Smells in Our Own Tests**: All unit tests in this repository (outside string literal code fixtures passed to `astService.parseToAst`) must be free of all 15 SNUTS.js test smells:
  - Descriptive test titles (> 2 words), unique per file.
  - No conditional logic (`if`, `switch`, loops) inside test bodies.
  - No assertions inside `beforeEach` / `beforeAll` / `afterEach` / `afterAll`.
  - No unused setup variables (`GeneralFixture`).
  - Keep test bodies concise (<= 13 statements).
  - Idiomatic Jest matchers (`toBe`, `toEqual`, `toHaveLength`, etc.), no `.only`, no `console.*`, and no redundant comments.

---

## 6. Verification & Documentation Gates

Before finishing any task:

1. Run and pass all checks:
   ```bash
   yarn lint
   yarn typecheck
   yarn test
   yarn build
   ```
2. Update `README.md` whenever CLI commands, flags, detectors, thresholds, or public exports change.
