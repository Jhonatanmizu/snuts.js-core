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

## 📁 Project Structure

````text
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
│   │   ├── anonymousTestLogic.test.ts
│   │   ├── commentsOnlyTestLogic.test.ts
│   │   ├── commentsOnlyTestLogic.ts
│   │   ├── conditionalTestLogic.test.ts
│   │   ├── conditionalTestLogic.ts
│   │   ├── identicalDescriptionTestLogic.test.ts
│   │   ├── identicalDescriptionTestLogic.ts
│   │   ├── index.ts
│   │   ├── overcommentedTestLogic.test.ts
│   │   └── overcommentedTestLogic.ts
│   ├── reporter/           # Logic for project analysis and report generation
│   │   ├── project-analyzer.ts
│   │   ├── report-generator.ts
│   │   ├── csv-report-generator.ts
│   │   ├── json-report-generator.ts
│   │   └── report.interface.ts
│   ├── runtime/
│   │   └── watch.ts
│   ├── shared/             # Shared utilities, constants, and plugins
│   │   ├── aliases/        # Module aliases configuration
│   │   │   └── index.ts
│   │   ├── constants.ts
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
````

The JSON output provides all necessary details (smell type, file path, line numbers, descriptions) to display results within the editor, link to specific code locations, and integrate with other extension features.

## 📄 Example Outputs

Here are example outputs generated by running the `analyze` command on `lib/test/mock-test-file.test.ts`.

### JSON Output

```json
[
  {
    "smellType": "AnonymousTestLogic",
    "filePath": "/home/jhonatanmizu/Developer/snuts.js-core/lib/test/mock-test-file.test.ts",
    "startLine": 2,
    "endLine": 5,
    "message": "AnonymousTestLogic",
    "description": "Test has anonymous logic. Consider giving this logic a meaningful name and extracting it into a helper function or a separate describe block."
  }
]
```

### CSV Output

```csv
Smell Type,File Path,Start Line,End Line,Message,Description
"AnonymousTestLogic","/home/jhonatanmizu/Developer/snuts.js-core/lib/test/mock-test-file.test.ts",2,5,"AnonymousTestLogic","Test has anonymous logic. Consider giving this logic a meaningful name and extracting it into a helper function or a separate describe block."
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
