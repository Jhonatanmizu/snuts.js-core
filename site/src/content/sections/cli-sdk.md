---
sectionType: "cli-sdk"
desktopTitle: "Built for your terminal, CI pipeline, and custom tools"
desktopSub: "Run zero-setup CLI commands with npx or import the side-effect-free TypeScript API directly."
mobileTitle: "Built for your terminal"
mobileSub: "Zero-setup CLI commands with npx, or import the side-effect-free TypeScript API."
tabs:
  - id: "analyze"
    label: "CLI: analyze"
    mobileWidth: 80
    commands:
      - comment: "# Analyze & export structured JSON/CSV reports"
        prefix: "npx "
        pkg: "@snutsjs/core"
        args: " analyze src --format json --config snuts.config.json"
        mobileFullCommand: "npx @snutsjs/core analyze . --format json"
      - comment: "# Watch files in real time"
        prefix: "npx "
        pkg: "@snutsjs/core"
        args: " watch src"
      - comment: "# Batch AI refactor with bounded concurrency"
        prefix: "npx "
        pkg: "@snutsjs/core"
        args: " refactor src/ tests/ --provider openai --concurrency 3 --apply"
        mobileFullCommand: "npx @snutsjs/core refactor src/ --provider openai"
    sdkLines:
      - text: "import { createDetectorInstances,"
        color: "rose"
      - text: '  ProjectAnalyzer } from "@snutsjs/core";'
        color: "text"
      - text: ""
        color: "text"
      - text: "const runner = new ProjectAnalyzer(config);"
        color: "text"
      - text: "const report = await runner.analyze();"
        color: "text"
    configLines:
      - text: "{"
        color: "text"
      - text: '  "VerboseTest": { "maxStatements": 20 },'
        color: "ok"
      - text: '  "ComplexSnapshot": { "maxLines": 30 }'
        color: "ok"
      - text: "}"
        color: "text"
  - id: "refactor"
    label: "CLI: refactor"
    mobileWidth: 88
    commands:
      - comment: "# Preview AI refactor patch in terminal (default safe mode)"
        prefix: "npx "
        pkg: "@snutsjs/core"
        args: " refactor tests/auth.test.ts --provider openai --model gpt-4.1-mini"
        mobileFullCommand: "npx @snutsjs/core refactor tests/auth.test.ts"
      - comment: "# Target a single smell across folders in parallel"
        prefix: "npx "
        pkg: "@snutsjs/core"
        args: ' refactor src/ tests/ --smell "Conditional Test Logic" --concurrency 3'
      - comment: "# Write refactored patches directly to disk"
        prefix: "npx "
        pkg: "@snutsjs/core"
        args: " refactor src/ tests/ --provider gemini --concurrency 3 --apply"
        mobileFullCommand: "npx @snutsjs/core refactor src/ --provider gemini --apply"
    sdkLines:
      - text: "import { RefactorService,"
        color: "rose"
      - text: '  AIProviderRegistry } from "@snutsjs/core";'
        color: "text"
      - text: ""
        color: "text"
      - text: "const service = new RefactorService(registry);"
        color: "text"
      - text: "const patch = await service.refactorFile(file);"
        color: "text"
    configLines:
      - text: "{"
        color: "text"
      - text: '  "ai": { "provider": "openai", "temperature": 0.2 },'
        color: "ok"
      - text: '  "concurrency": 3'
        color: "ok"
      - text: "}"
        color: "text"
  - id: "watch"
    label: "CLI: watch"
    mobileWidth: 68
    commands:
      - comment: "# Watch test files in real time on save"
        prefix: "npx "
        pkg: "@snutsjs/core"
        args: " watch src"
        mobileFullCommand: "npx @snutsjs/core watch src"
      - comment: "# Watch with custom threshold configuration"
        prefix: "npx "
        pkg: "@snutsjs/core"
        args: " watch tests --config snuts.config.json"
      - comment: "# Evaluate benchmark datasets"
        prefix: "npx "
        pkg: "@snutsjs/core"
        args: " evaluate ./benchmarks --format csv"
        mobileFullCommand: "npx @snutsjs/core watch tests --config snuts.config.json"
    sdkLines:
      - text: "import { startWatchMode } from"
        color: "rose"
      - text: '  "@snutsjs/core/runtime/watch";'
        color: "text"
      - text: ""
        color: "text"
      - text: 'await startWatchMode({ targetPath: "./src" });'
        color: "text"
    configLines:
      - text: "{"
        color: "text"
      - text: '  "AnonymousTest": { "maxWords": 2 },'
        color: "ok"
      - text: '  "OvercommentedTest": { "maxComments": 5 }'
        color: "ok"
      - text: "}"
        color: "text"
  - id: "config"
    label: "snuts.config.json"
    mobileWidth: 114
    commands:
      - comment: "# Pass custom threshold config to analyze"
        prefix: "npx "
        pkg: "@snutsjs/core"
        args: " analyze src --format json --config snuts.config.json"
        mobileFullCommand: "npx @snutsjs/core analyze . --config snuts.config.json"
      - comment: "# Pass custom threshold config to watch"
        prefix: "npx "
        pkg: "@snutsjs/core"
        args: " watch src --config snuts.config.json"
      - comment: "# Export CSV report with custom detector rules"
        prefix: "npx "
        pkg: "@snutsjs/core"
        args: " analyze tests --format csv --config snuts.config.json"
        mobileFullCommand: "npx @snutsjs/core analyze . --format csv"
    sdkLines:
      - text: "import { loadConfig,"
        color: "rose"
      - text: '  createDetectorInstances } from "@snutsjs/core";'
        color: "text"
      - text: ""
        color: "text"
      - text: 'const cfg = await loadConfig("snuts.config.json");'
        color: "text"
      - text: "const detectors = createDetectorInstances(cfg);"
        color: "text"
    configLines:
      - text: "{"
        color: "text"
      - text: '  "VerboseTest": { "maxStatements": 20 },'
        color: "ok"
      - text: '  "ComplexSnapshot": { "maxLines": 30 }'
        color: "ok"
      - text: "}"
        color: "text"
  - id: "sdk"
    label: "TypeScript SDK"
    mobileWidth: 94
    commands:
      - comment: "# Install @snutsjs/core for programmatic AST usage"
        prefix: "npm "
        pkg: "install @snutsjs/core"
        args: ""
        mobileFullCommand: "npm install @snutsjs/core"
      - comment: "# Or add with Yarn"
        prefix: "yarn "
        pkg: "add @snutsjs/core"
        args: ""
      - comment: "# Subpath exports for detectors and watch runtime"
        prefix: "npx "
        pkg: "tsc"
        args: " --noEmit"
        mobileFullCommand: "yarn add @snutsjs/core"
    sdkLines:
      - text: "import { createDetectorInstances,"
        color: "rose"
      - text: '  ProjectAnalyzer } from "@snutsjs/core";'
        color: "text"
      - text: ""
        color: "text"
      - text: "const runner = new ProjectAnalyzer(config);"
        color: "text"
      - text: "const report = await runner.analyze();"
        color: "text"
    configLines:
      - text: "{"
        color: "text"
      - text: '  "VerboseTest": { "maxStatements": 20 },'
        color: "ok"
      - text: '  "ComplexSnapshot": { "maxLines": 30 }'
        color: "ok"
      - text: "}"
        color: "text"
desktopSafeNote: "Side-effect free — safe to import from the VS Code extension host."
mobileSafeNote: "Side-effect free — safe for VS Code extension hosts."
---

CLI and TypeScript SDK tabbed showcase content.
