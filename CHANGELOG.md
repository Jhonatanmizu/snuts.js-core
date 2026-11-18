# @snutsjs/core

## 1.3.0

### Minor Changes

- Implement 7 new test smell detectors (`NonFunctionalStatementDetector`, `OnlyTestDetector`, `SensitiveEqualityDetector`, `SubOptimalAssertDetector`, `TranscriptingTestDetector`, `VerboseTestDetector`, `VerifyInSetupLogicDetector`) for full 15-smell coverage.
- Add `analyze` CLI command with CSV and JSON report generation.
- Add `refactor` CLI command powered by LangChain (`openai`, `anthropic`, and `google` providers).
- Add `evaluate` CLI command and benchmark metrics evaluation module (TP, FP, FN, Precision, Recall, F1).
- Add React `.jsx` and `.tsx` test file glob patterns.

## 1.2.3

### Patch Changes

- add description and explanation in watcher logs

## 1.2.2

### Patch Changes

- Improve pino pretty to handle vscode extension and cli.

## 1.2.1

### Patch Changes

- Fix pino pretty not logging in cli

## 1.2.0

### Minor Changes

- a588911: Improve build resolution and add smell description and explanation.

## 1.1.0

### Minor Changes

- 1bc7191: Add a real CLI entrypoint so the package can be executed with `npx @snutsjs/core watch .`.
