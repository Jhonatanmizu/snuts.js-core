# snuts.js-core

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

## 🎯 Goal

`snuts.js-core` aims to be a robust and extensible static analysis tool designed to identify and report common "smells" or anti-patterns in JavaScript and TypeScript test files. By integrating with your development workflow, it helps maintain high-quality, readable, and effective test suites.

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
│   │   ├── anonymousTesLogic.ts
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
```

---

## License

This project is licensed under the GPL-3.0 License. See the [LICENSE](LICENSE) file for details.

---

## ✨ Features

- 🔧 **Static Analysis**: Identifies anti-patterns in test files using AST parsing.
- 💬 **Extensible Detectors**: Easily add new test smell detection logic.
- 🛠️ **Real-time File Watching**: Monitors your codebase for changes and re-runs detectors automatically.
- 🧪 **Jest Testing**: Integrated testing setup for robust development.
- 💡 **TypeScript Support**: Built with TypeScript for type safety and improved developer experience.
- 🚀 **CLI Tool**: Command-line interface for easy interaction.

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

    `snuts.js-core` will automatically watch all files in the current directory and its subdirectories and report findings.

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
- Check for any system-level file watch limits (e.g., `fs.inotify.max_user_watches` on Linux) that might be preventing `chokidar` from functioning correctly in large projects.
