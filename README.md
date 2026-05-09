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
import { DetectorRunner, detectors } from "@snutsjs/core";

const detectorInstances = Object.values(detectors).map((DetectorClass) => new DetectorClass());
const runner = new DetectorRunner(detectorInstances);

const smells = await runner.run("/absolute/path/to/example.test.ts");
console.log(smells);
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
npx @snutsjs/core analyze <path> --format <format> [--output <file>]
```

- `<path>`: The path to the directory or file to analyze (e.g., `.`, `src`, `src/my-test.test.ts`). Defaults to `.` if not provided.
- `--format <format>`: **Required**. The output format for the report. Can be `json` or `csv`.
- `--output <file>`: **Optional**. The file path to write the report to. If omitted, the report will be printed to `stdout`.

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

---

## 🧷 Built-in test smell detectors

These ship with the library (see `lib/detectors`). Import them individually or instantiate everything from `import * as detectors from "@snutsjs/core"` (`Object.values(detectors)` gives each constructor). Report entries expose a human-readable **`description`** (`Smell.description`); JSON/CSV also duplicate the detector **`message`** in both **`message`** and **`smellType`**.

| Report `description`     | Exported detector                       | What it catches                                                                                                                              |
| ------------------------ | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Anonymous Test           | `AnonymousTestLogicDetector`            | Jest-style tests whose description is extremely short (configurable threshold: at most **two words** after trimming).                        |
| Comments-Only Test       | `CommentsOnlyLogicTestDetector`         | `it` / `test` bodies that are empty or contain only comments, so nothing is asserted.                                                        |
| Complex Snapshot         | `ComplexSnapshotTestLogicDetector`      | Snapshot matchers whose template spans too many lines (`toMatchInlineSnapshot`, `toMatchSnapshot`), making failures hard to review.          |
| Conditional Test Logic   | `ConditionalTestLogicDetector`          | Branching (`if`, `switch`, …) inside a test body where separate cases are usually clearer.                                                   |
| General Fixture          | `GeneralFixtureTestLogicDetector`       | Variables declared in `beforeAll` / `beforeEach` that never appear in test bodies (`after*` hooks intentionally ignored in v1-style parity). |
| Identical Description    | `IdenticalDescriptionTestLogicDetector` | Duplicate test titles across the file so failures are ambiguous in output.                                                                   |
| Overcommented Test       | `OvercommentedTestLogicDetector`        | More than **`MAX_COMMENTS_PER_TEST`** (default **5** in `shared/constants.ts`) distinct comment anchors on a single test.                    |
| Test Without Description | `DetectorTestWithoutDescriptionLogic`   | `it()` / `test()` calls missing a leading string description.                                                                                |
| Non-Functional Statement | `NonFunctionalStatementDetector`        | Effectively empty blocks with no explanatory comments.                                                                                       |
| Focused / Isolated Test  | `OnlyTestDetector`                      | `*.only` on `it`, `test`, or `describe` (leftover focused tests).                                                                            |
| Sensitive Equality       | `SensitiveEqualityDetector`             | Assertions that hinge on brittle string coercion (for example `.toString()` in expectations).                                                |
| Suboptimal Assertion     | `SubOptimalAssertDetector`              | Assertion shapes that obscure intent vs. idiomatic matchers.                                                                                 |
| Transcripting Test       | `TranscriptingTestDetector`             | `console.log` / `error` / `warn` / `info` usage inside tests.                                                                                |
| Verbose Test             | `VerboseTestDetector`                   | Blocks whose body exceeds **13** statements (`VERBOSE_BLOCK_BODY_STATEMENT_THRESHOLD`), suggesting multiple scenarios in one test.           |
| Assertion in Setup       | `VerifyInSetupDetector`                 | Expectations inside lifecycle hooks (`beforeAll`, `beforeEach`, `afterAll`, `afterEach`).                                                    |

Thresholds such as anonymous word count, comment budget, verbose statement count, and snapshot line span live in **`lib/shared/constants.ts`**. Long-form explanations live in **`lib/shared/smell-descriptions.ts`** (mirrored into each `Smell.explanation` at runtime).

---

## 📁 Project Structure

```text
├── lib/
│   ├── ast/                # AST (Abstract Syntax Tree) related services for parsing and querying
│   │   ├── ast.service.test.ts
│   │   └── ast.service.ts
│   ├── core/               # Core logic for detector runner and file watching
│   │   ├── detector.interface.ts
│   │   ├── detector-runner.test.ts
│   │   ├── detector-runner.ts
│   │   ├── watcher.test.ts
│   │   └── watcher.ts
│   ├── detectors/          # Collection of predefined test smell detectors
│   │   ├── anonymousTestLogic.ts
│   │   ├── commentsOnlyTestLogic.ts
│   │   ├── complexSnapshotTestLogic.ts
│   │   ├── conditionalTestLogic.ts
│   │   ├── generalFixtureTestLogic.ts
│   │   ├── identicalDescriptionTestLogic.ts
│   │   ├── index.ts
│   │   ├── nonFunctionalStatementLogic.ts
│   │   ├── onlyTestLogic.ts
│   │   ├── overcommentedTestLogic.ts
│   │   ├── sensitiveEqualityLogic.ts
│   │   ├── subOptimalAssertLogic.ts
│   │   ├── testWithoutDescriptionLogic.ts
│   │   ├── transcriptingTestLogic.ts
│   │   ├── verboseTestLogic.ts
│   │   ├── verifyInSetupLogic.ts
│   │   └── *.test.ts      # Detector unit specs (paired with each logic file)
│   ├── reporter/           # Logic for project analysis and report generation
│   │   ├── project-analyzer.ts
│   │   ├── csv-report-generator.ts
│   │   ├── json-report-generator.ts
│   │   └── report.interface.ts
│   ├── runtime/
│   │   └── watch.ts
│   ├── shared/             # Shared utilities, constants, and plugins
│   │   ├── aliases/        # Module aliases configuration
│   │   │   └── index.ts
│   │   ├── constants.ts
│   │   ├── selectors/       # Shared esquery selectors / AST matchers
│   │   │   └── index.ts
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
- **@babel/parser**: Used for parsing JavaScript/TypeScript code into an AST.
- **@babel/types**: Utilities for working with Babel AST nodes.
- **esquery**: Powerful tool for querying ASTs with CSS-like selectors.
- **chokidar**: File system watcher for real-time monitoring of file changes.
- **commander**: Node.js command-line interfaces made easy.

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
