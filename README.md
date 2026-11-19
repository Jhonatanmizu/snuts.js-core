# @snutsjs/core

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

## 🎯 Goal

`@snutsjs/core` aims to be a robust and extensible static analysis tool designed to identify and report common "smells" or anti-patterns in JavaScript and TypeScript test files. By integrating with your development workflow, it helps maintain high-quality, readable, and effective test suites.

## 📦 Installation

```bash
npm install @snutsjs/core
```

## 🚀 Library Usage (Extension-Friendly)

```ts
import {
  createDetectorInstances,
  DetectorRunner,
  ProjectAnalyzer,
  RefactorService,
  LangChainProviderRegistry,
} from "@snutsjs/core";

const detectors = createDetectorInstances();

// 1. Single-file AST analysis
const runner = new DetectorRunner(detectors);
const fileSmells = await runner.run("/absolute/path/to/example.test.ts");

// 2. Parallel batch analysis across files and directories
const projectAnalyzer = new ProjectAnalyzer(detectors);
const projectSmells = await projectAnalyzer.analyze(["./src", "./tests"]);

// 3. Single-file or batch AI refactoring
const refactorService = new RefactorService(detectors, new LangChainProviderRegistry());
const batchResult = await refactorService.refactorBatch({
  paths: ["./src"],
  apply: false,
  provider: "openai",
  model: "gpt-4.1-mini",
  apiKey: process.env.OPENAI_API_KEY!,
  concurrency: 3,
});
```

## 👀 Runtime Watcher Entry

Use the runtime subpath when you want the side-effectful watcher behavior:

```ts
import "@snutsjs/core/runtime/watch";
```

The root package import is side-effect free and safe for VS Code extension integration.

## CLI Usage

### `watch` command

```bash
npx @snutsjs/core watch .
```

You can also point to a specific directory:

```bash
npx @snutsjs/core watch src
```

### `analyze` command

Analyze your project for test smells and generate reports.

```bash
npx @snutsjs/core analyze <path> --format <format> [--output <file>] [--config <file>] [--smell <SmellType>] [--watch]
```

- `<path>`: One or more paths to directories or files to analyze (e.g., `.`, `src`, `src/my-test.test.ts`). Defaults to `.` if not provided.
- `--format <format>`: **Required**. The output format for the report. Can be `json` or `csv`.
- `--output <file>`: **Optional**. The file path to write the report to. If omitted, the report will be printed to `stdout`.
- `--config <file>`: **Optional**. Path to a JSON configuration file (`SnutsConfig`) with custom per-smell threshold overrides.
- `--smell <SmellType>`: **Optional** (repeatable). Filter reported smells by canonical smell key (e.g., `--smell AnonymousTest --smell VerboseTest`) or description.
- `--watch`: **Optional**. Start the interactive file watcher on the resolved target paths.

**Examples:**

Analyze the current directory and output a JSON report to stdout:

```bash
npx @snutsjs/core analyze . --format json
```

Analyze the `src` directory and save a CSV report to `report.csv`:

```bash
npx @snutsjs/core analyze src --format csv --output report.csv
```

Analyze a specific file and output a JSON report to `stdout`:

```bash
npx @snutsjs/core analyze lib/test/mock-test-file.test.ts --format json
```

Analyze with a custom threshold config and filter for specific smells:

```bash
npx @snutsjs/core analyze src --format json --config snuts.config.json --smell VerboseTest --smell AnonymousTest
```

### Custom Threshold Configuration (`--config`)

You can pass `--config <path>` to `analyze` with a JSON file matching `SnutsConfig` to override per-smell detection thresholds without modifying source code:

```json
{
  "thresholds": {
    "VerboseTest": { "maxStatements": 20 },
    "ComplexSnapshot": { "maxLines": 30 },
    "AnonymousTest": { "maxWords": 3 },
    "OvercommentedTest": { "maxComments": 8 }
  }
}
```

### `refactor` command (AI-assisted single-file & batch refactoring)

Run AI-powered refactoring for a single test file or in batch across multiple files and directories using LangChain-backed providers.

```bash
npx @snutsjs/core refactor <file|dir...> --provider <provider> [--model <model>] [--concurrency <n>] [--apply] [--format <text|json>] [--output <file>] [--smell <description>] [--temperature <number>] [--max-tokens <number>]
```

- `<file|dir...>`: One or more target test files or directories to refactor. When directories or multiple files are given, SNUTS runs in batch mode—automatically pre-filtering to only test files that contain matching smells.
- `--provider`: Required. One of `openai`, `google`, `anthropic`, `deepseek`, `kimi`.
- `--model`: Optional model override. If omitted, SNUTS uses a provider-specific default.
- `--concurrency <n>`: Optional bounded concurrency for batch refactoring (default: `3`).
- `--apply`: Optional. When omitted, command runs in preview mode without modifying the source file(s).
- `--format`: Optional output format (`text` or `json`, default: `text`).
- `--output <file>`: Optional file path to save the command result.
- `--smell <description>`: Optional smell description filter to focus refactoring context.
- `--temperature <number>` and `--max-tokens <number>`: Optional LLM tuning options.

Examples:

```bash
npx @snutsjs/core refactor lib/test/mock-test-file.test.ts --provider openai
npx @snutsjs/core refactor src/ tests/ --provider openai --concurrency 3 --apply
npx @snutsjs/core refactor lib/test/mock-test-file.test.ts --provider anthropic --apply --format json
```

### `evaluate` command (Benchmark & Oracle Evaluation)

Evaluate detection precision, recall, and F1 score against a ground-truth oracle file (either by passing precomputed tool results or by analyzing target paths directly).

```bash
npx @snutsjs/core evaluate --oracle <file> (--tool-results <file> | --target <path>) [options]
```

- `--oracle <file>`: **Required**. Path to the ground-truth oracle JSON file.
- `--tool-results <file>`: Path to a JSON file containing tool detection results.
- `--target <path>`: One or more target directories or files to analyze live before evaluating (alternative to `--tool-results`).
- `--granularity <class|fine-grained>`: Optional evaluation granularity (default: `fine-grained`).
  - `fine-grained`: Matches individual smell instances by file, smell type, and line number within `--line-tolerance`.
  - `class`: Evaluates file-level presence/absence of each smell type.
- `--output-format <console|json|csv>` (or `--format`): Optional report format (default: `console`).
- `--line-tolerance <n>`: Optional non-negative integer line tolerance for fine-grained matching (default: `1`).
- `--match-mode <start-line|range|overlap>`: Optional line matching strategy (default: `start-line`).
- `--only-oracle-files`: Optional flag to restrict evaluation to files present in the oracle dataset.
- `--smell <SmellType>`: Optional (repeatable) filter to evaluate only specific smell types.
- `--output <file>`: Optional file path to save the evaluation report.

**Examples:**

```bash
npx @snutsjs/core evaluate --tool-results=results.json --oracle=oracle.json --granularity=fine-grained --output-format=console --line-tolerance=1
npx @snutsjs/core evaluate --oracle=oracle.json --target=src --granularity=class --format=json --output=eval-report.json
```

You can also use `MetricsEvaluator` and `formatEvaluationReport` programmatically:

```ts
import { MetricsEvaluator, formatEvaluationReport } from "@snutsjs/core";

const evaluator = new MetricsEvaluator();
const report = evaluator.evaluate(toolResults, oracleData, {
  granularity: "fine-grained",
  lineTolerance: 1,
  matchMode: "start-line",
});

console.log(formatEvaluationReport(report, "console"));
```

### AI provider configuration

You can pass an API key via `--api-key`, or configure environment variables:

- OpenAI: `OPENAI_API_KEY`
- Google: `GOOGLE_API_KEY` (or `GOOGLE_GENERATIVE_AI_API_KEY`)
- Anthropic: `ANTHROPIC_API_KEY`
- DeepSeek: `DEEPSEEK_API_KEY` (`DEEPSEEK_BASE_URL` optional)
- Kimi: `KIMI_API_KEY` (or `MOONSHOT_API_KEY`, `KIMI_BASE_URL` optional)

Optional shared defaults:

- `SNUTS_AI_PROVIDER`
- `SNUTS_AI_MODEL`
- `SNUTS_AI_TEMPERATURE`
- `SNUTS_AI_MAX_TOKENS`

---

## 🧷 Built-in Test Smell Detectors (28 Detectors)

These 28 detectors ship with the library (see `lib/detectors`). Instantiate all of them via `createDetectorInstances()` or import individual detector classes from `@snutsjs/core` / `@snutsjs/core/detectors`. Report entries expose a human-readable **`description`** (`Smell.description`) and **`explanation`** (`Smell.explanation`); JSON/CSV exports also include the detector **`message`** in both **`message`** and **`smellType`**.

| Report `description`     | Exported detector                       | What it catches                                                                                                                              |
| ------------------------ | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Anonymous Test           | `AnonymousTestLogicDetector`            | Jest-style tests whose description is extremely short (configurable threshold: at most **two words** after trimming).                        |
| Assertion Roulette       | `AssertionRouletteDetector`             | Multiple assertions in a single test case where assertions omit explanatory failure messages.                                                |
| Comments-Only Test       | `CommentsOnlyLogicTestDetector`         | `it` / `test` bodies that are empty or contain only comments, so nothing is asserted.                                                        |
| Complex Snapshot         | `ComplexSnapshotTestLogicDetector`      | Snapshot matchers whose template spans too many lines (`toMatchInlineSnapshot`, `toMatchSnapshot`), making failures hard to review.          |
| Conditional Test Logic   | `ConditionalTestLogicDetector`          | Branching and loops (`if`, `switch`, `for`, `for..in`, `for..of`, `while`, `do..while`, ternary `ConditionalExpression`) inside a test body. |
| Dependent Test           | `DependentTestDetector`                 | Tests that read shared mutable suite state written by a prior test without being reset in `beforeEach`.                                      |
| Duplicate Assert         | `DuplicateAssertDetector`               | Identical assertion statements repeated within the same test case.                                                                           |
| Eager Test               | `EagerTestDetector`                     | A single test case that invokes multiple distinct methods on the same System Under Test (SUT) instance.                                      |
| Exception Handling       | `ExceptionHandlingDetector`             | Manual `try/catch` or `throw` statements inside test cases instead of framework matchers (`toThrow`, `rejects`).                             |
| General Fixture          | `GeneralFixtureTestLogicDetector`       | Variables declared in `beforeAll` / `beforeEach` that never appear in test bodies (`after*` hooks intentionally ignored in v1-style parity). |
| Identical Description    | `IdenticalDescriptionTestLogicDetector` | Duplicate test titles across the file so failures are ambiguous in output.                                                                   |
| Ignored Test             | `IgnoredTestDetector`                   | Skipped or placeholder tests (`it.skip`, `test.skip`, `describe.skip`, `xit`, `xtest`, `xdescribe`, `it.todo`, `test.todo`).                 |
| Lazy Test                | `LazyTestDetector`                      | Multiple test cases in the same suite that invoke the exact same single method on the SUT.                                                   |
| Magic Number Test        | `MagicNumberTestDetector`               | Unexplained raw numeric literals (excluding `0`, `1`, `-1`) used directly in assertion matchers.                                             |
| Mystery Guest            | `MysteryGuestDetector`                  | Direct access to external resources (`fs`, `fetch`, `axios`, `http`, `child_process`, `localStorage`, etc.) inside test cases.               |
| Overcommented Test       | `OvercommentedTestLogicDetector`        | More than **`MAX_COMMENTS_PER_TEST`** (default **5** in `shared/constants.ts`) distinct comment anchors on a single test.                    |
| Redundant Assertion      | `RedundantAssertionDetector`            | Tautological assertions comparing identical literals or identifiers (e.g. `expect(true).toBe(true)`, `assert.strictEqual(x, x)`).            |
| Resource Optimism        | `ResourceOptimismDetector`              | File system operations (`fs.readFileSync`, `fs.unlinkSync`, etc.) in a test without a preceding existence or stat check.                     |
| Sleepy Test              | `SleepyTestDetector`                    | Explicit timer delays (`setTimeout`, `setInterval`, `sleep(ms)`) inside test cases.                                                          |
| Test Without Description | `DetectorTestWithoutDescriptionLogic`   | `it()` / `test()` calls missing a leading string description.                                                                                |
| Non-Functional Statement | `NonFunctionalStatementDetector`        | Effectively empty blocks with no explanatory comments.                                                                                       |
| Focused / Isolated Test  | `OnlyTestDetector`                      | `*.only` on `it`, `test`, or `describe` (leftover focused tests).                                                                            |
| Sensitive Equality       | `SensitiveEqualityDetector`             | Assertions that hinge on brittle string coercion (for example `.toString()` in expectations).                                                |
| Suboptimal Assertion     | `SubOptimalAssertDetector`              | Assertion shapes that obscure intent vs. idiomatic matchers.                                                                                 |
| Transcripting Test       | `TranscriptingTestDetector`             | `console.log` / `error` / `warn` / `info` usage inside tests.                                                                                |
| Unknown Test             | `UnknownTestDetector`                   | Non-empty test cases that execute code without making any assertions.                                                                        |
| Verbose Test             | `VerboseTestDetector`                   | Blocks whose body exceeds **13** statements (`VERBOSE_BLOCK_BODY_STATEMENT_THRESHOLD`), suggesting multiple scenarios in one test.           |
| Assertion in Setup       | `VerifyInSetupDetector`                 | Expectations inside lifecycle hooks (`beforeAll`, `beforeEach`, `afterAll`, `afterEach`).                                                    |

Thresholds such as anonymous word count, comment budget, verbose statement count, and snapshot line span live in **`lib/shared/constants.ts`**. Long-form explanations live in **`lib/shared/smell-descriptions.ts`** (mirrored into each `Smell.explanation` at runtime).

---

## 📁 Project Structure

```text
├── lib/
│   ├── ai/                 # AI-assisted refactoring services, providers, prompts, and patch utils
│   │   ├── providers/
│   │   ├── config.ts
│   │   ├── context-builder.ts
│   │   ├── index.ts
│   │   ├── patch-utils.ts
│   │   ├── prompt-composer.ts
│   │   ├── provider.interface.ts
│   │   ├── refactor-service.ts
│   │   └── types.ts
│   ├── ast/                # AST (Abstract Syntax Tree) related services for parsing and querying
│   │   ├── ast.service.test.ts
│   │   └── ast.service.ts
│   ├── bin/                # CLI argument parsing and command execution
│   │   ├── cli-args.ts
│   │   ├── cli.test.ts
│   │   └── cli.ts
│   ├── config/             # Custom threshold configuration loader (SnutsConfig)
│   │   ├── snuts-config.test.ts
│   │   └── snuts-config.ts
│   ├── core/               # Core logic for detector runner and file watching
│   │   ├── detector.interface.ts
│   │   ├── detector-runner.test.ts
│   │   ├── detector-runner.ts
│   │   ├── watcher.test.ts
│   │   └── watcher.ts
│   ├── detectors/          # Collection of 28 built-in test smell detectors
│   │   ├── anonymousTestLogic.ts
│   │   ├── assertionRouletteLogic.ts
│   │   ├── commentsOnlyTestLogic.ts
│   │   ├── complexSnapshotTestLogic.ts
│   │   ├── conditionalTestLogic.ts
│   │   ├── dependentTestLogic.ts
│   │   ├── duplicateAssertLogic.ts
│   │   ├── eagerTestLogic.ts
│   │   ├── exceptionHandlingLogic.ts
│   │   ├── generalFixtureTestLogic.ts
│   │   ├── identicalDescriptionTestLogic.ts
│   │   ├── ignoredTestLogic.ts
│   │   ├── index.ts
│   │   ├── lazyTestLogic.ts
│   │   ├── magicNumberTestLogic.ts
│   │   ├── mysteryGuestLogic.ts
│   │   ├── nonFunctionalStatementLogic.ts
│   │   ├── onlyTestLogic.ts
│   │   ├── overcommentedTestLogic.ts
│   │   ├── redundantAssertionLogic.ts
│   │   ├── resourceOptimismLogic.ts
│   │   ├── sensitiveEqualityLogic.ts
│   │   ├── sleepyTestLogic.ts
│   │   ├── subOptimalAssertLogic.ts
│   │   ├── testWithoutDescriptionLogic.ts
│   │   ├── transcriptingTestLogic.ts
│   │   ├── unknownTestLogic.ts
│   │   ├── verboseTestLogic.ts
│   │   ├── verifyInSetupLogic.ts
│   │   └── *.test.ts      # Detector unit specs (paired with each logic file)
│   ├── evaluator/          # Benchmark evaluation engine (Precision, Recall, F1 against oracles)
│   │   ├── evaluator.test.ts
│   │   ├── formatters.ts
│   │   ├── index.ts
│   │   ├── metrics-evaluator.ts
│   │   ├── normalizer.ts
│   │   └── types.ts
│   ├── reporter/           # Logic for project analysis and report generation
│   │   ├── project-analyzer.ts
│   │   ├── csv-report-generator.ts
│   │   ├── json-report-generator.ts
│   │   └── report.interface.ts
│   ├── runtime/
│   │   ├── watch-runner.ts
│   │   └── watch.ts
│   ├── shared/             # Shared utilities, constants, and plugins
│   │   ├── aliases/        # Module aliases configuration
│   │   │   └── index.ts
│   │   ├── constants.ts
│   │   ├── selectors/       # Shared esquery selectors / AST matchers
│   │   │   └── index.ts
│   │   ├── smell-descriptions.ts
│   │   ├── logger/         # Logging utility
│   │   │   └── index.ts
│   │   └── plugins/        # Plugin system for extensibility
│   │       └── index.ts
│   ├── test/               # Internal testing utilities and builders
│   │   └── builders/
│   │       └── astNodeBuilder.ts
│   └── index.ts            # Main entry point for the library
├── .gitignore
├── .prettierignore
├── .prettierrc.json
├── AGENTS.md
├── eslint.config.js
├── jest.config.js
├── LICENSE
├── package.json
├── README.md
├── tsconfig.json
├── tsconfig.test.json
└── yarn.lock
```

---

## 🔌 Core Libraries

### ⚛️ Core

- **TypeScript**: Primary language for the project.
- **@babel/parser & @babel/types**: Used for parsing JavaScript/TypeScript/JSX/TSX test files into an AST and inspecting nodes.
- **esquery**: Querying ASTs with CSS-like selectors.
- **@langchain/core, @langchain/openai, @langchain/anthropic, @langchain/google-genai**: Multi-provider AI refactoring engine (OpenAI, Google Gemini, Anthropic Claude, DeepSeek, and Moonshot Kimi).
- **chokidar & glob**: Real-time file watching and test file discovery.
- **pino & pino-pretty**: Structured logging with custom logger injection (`setLogger`) for IDE hosts.

### 🧪 Testing

- **Jest**: JavaScript testing framework.
- **ts-jest**: TypeScript preprocessor for Jest.

---

## 💡 VSCode Extension Integration

The `analyze` command and its reporting capabilities are designed to be easily consumable by external tools, such as a VSCode extension. The core `ProjectAnalyzer` and `ReportGenerator` classes are exported from the main library entry point (`@snutsjs/core`), allowing direct programmatic access.

For seamless integration, the VSCode extension can invoke the CLI command with the `--format json` option to get a structured output of detected smells:

```bash
npx @snutsjs/core analyze <path> --format json
```

The JSON output provides all necessary details (smell type, file path, line numbers, descriptions) to display results within the editor, link to specific code locations, and integrate with other extension features.

## 📄 Example Outputs

Here are example outputs from `npx @snutsjs/core analyze lib/test/mock-test-file.test.ts --format json` (paths on your machine will differ). The **`description`** field matches the short labels in **Built-in test smell detectors**; **`smellType`** repeats **`message`** in JSON and CSV exports.

### JSON Output

```json
[
  {
    "smellType": "Anonymous test case detected.",
    "filePath": "/home/you/snuts.js-core/lib/test/mock-test-file.test.ts",
    "startLine": 10,
    "endLine": 12,
    "message": "Anonymous test case detected.",
    "description": "Anonymous Test"
  },
  {
    "smellType": "Test case with only comments or empty body detected.",
    "filePath": "/home/you/snuts.js-core/lib/test/mock-test-file.test.ts",
    "startLine": 10,
    "endLine": 12,
    "message": "Test case with only comments or empty body detected.",
    "description": "Comments-Only Test"
  }
]
```

### CSV Output

```csv
Smell Type,File Path,Start Line,End Line,Message,Description
"Anonymous test case detected.","/home/you/snuts.js-core/lib/test/mock-test-file.test.ts",10,12,"Anonymous test case detected.","Anonymous Test"
"Test case with only comments or empty body detected.","/home/you/snuts.js-core/lib/test/mock-test-file.test.ts",10,12,"Test case with only comments or empty body detected.","Comments-Only Test"
```

---

## 🚀 Getting Started

### 🔧 Prerequisites

To run this project, you will need:

- [Node.js](https://nodejs.org/) (recommended v18+)
- [Yarn](https://yarnpkg.com/) or npm as package manager
- A code editor (recommendation: [Visual Studio Code](https://code.visualstudio.com/))

### ▶️ Run Project

1.  Clone this repository to your local machine.
2.  Install the project dependencies:
    ```bash
    yarn install
    ```
3.  To start watching your files for smelly tests, run:

    ```bash
    yarn start
    ```

    `@snutsjs/core` will automatically watch all files in the selected directory and its subdirectories and report findings.

### 📚 Build and Validate

```bash
yarn lint
yarn test
yarn typecheck
yarn build
npm pack --dry-run
```

### 🧾 Release Automation (Changesets)

Create a changeset:

```bash
yarn changeset
```

Version packages and changelog:

```bash
yarn version-packages
```

Publish to npm:

```bash
yarn release
```

GitHub Actions workflows are configured to run CI on pull requests and publish through Changesets on merges to `main`.

---

## 🧑‍💻 Contributing

Want to contribute? Here's how you can help:

1.  Create a new branch for your changes:
    ```bash
    git checkout -b feature/your-feature-name
    ```
2.  Implement your changes and commit them with a meaningful message (e.g., `:sparkles: feat: Your message here`):
    ```bash
    git commit -m "feat: Add new detector for unused imports"
    ```
3.  Push your branch to the remote repository:
    ```bash
    git push origin feature/your-feature-name
    ```
4.  Open a pull request and request a code review.

---

## 🔁 Git Workflow

### Common Commands:

- **Create a new branch**:
  ```bash
  git checkout -b your-branch-name
  ```
- **Switch to a branch**:
  ```bash
  git checkout branch-name
  ```
- **Commit your changes**:
  ```bash
  git commit -m "Your commit message"
  ```
- **Push changes to remote**:
  ```bash
  git push
  ```
- **Pull updates from remote**:
  ```bash
  git pull
  ```

---

## 📚 Development Setup

### 🧭 Path Aliases

This project uses path aliases for cleaner imports. Instead of relative paths like `../../../shared/constants`, you can use:

```typescript
// Before
import { MY_CONSTANT } from "../../../shared/constants";

// After
import { MY_CONSTANT } from "@/shared/constants";
```

Path aliases are configured in:

- `tsconfig.json` - For TypeScript resolution
- `babel.config.js` - For Babel transpilation (if applicable)
- `jest.config.js` - For testing with Jest

---

## 🧪 Troubleshooting

### TypeScript and Aliases Issues

If VS Code or Jest doesn't recognize path aliases:

- Restart TypeScript server: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"
- Ensure `tsconfig.json` has correct `baseUrl` and `paths` configurations.
- Run `yarn tsc --noEmit` to verify TypeScript configuration.

### File Watcher Issues

If the file watcher (`chokidar`) doesn't seem to be picking up changes:

- Ensure you are running `yarn start` from the project's root directory.
- Check for any system-level file watch limits (e.g., `fs.inotify.max_user_watches` on Linux) that might be preventing `chokidar` from functioning correctly in large projects).
