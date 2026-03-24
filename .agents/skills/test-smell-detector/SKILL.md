---
name: test-smell-detector
description: "Use when implementing or modifying a test smell detector in snuts.js-core using TypeScript AST analysis. Covers detector design, esquery selectors, smell reporting shape, pino logging, unit tests, exports, and validation."
argument-hint: "Describe the smell to detect, examples of bad/good tests, and detection thresholds"
---

# Test Smell Detector Workflow

Build or update a detector in this repository with deterministic AST logic, strict typing, and rule-focused tests.

## Use When

- adding a new detector in lib/detectors
- changing detector criteria or thresholds
- fixing false positives or false negatives in detector behavior
- adding coverage for an existing detector

## Inputs To Collect First

- smell name and short message shown to users
- invalid examples (must trigger)
- valid examples (must not trigger)
- threshold values (if any)
- whether detection applies to test calls, describe blocks, comments, or control-flow patterns

## Repository Conventions

- implement the Detector interface from @/core/detector.interface
- use astService.query for selector-based matching
- log only with @/shared/logger
- never use any
- return Smell objects with file, start, end, message, codeBlock

## Procedure

1. Define detection contract
- Write one sentence for what should be reported.
- Write one sentence for what should never be reported.
- Convert this into selector candidates and guard clauses.

2. Create or update detector class
- File pattern: lib/detectors/<smellName>.ts.
- Export a class named <SmellName>Detector implementing Detector.
- Build a smells array and return it from detect.
- Wrap detection logic in try/catch and log failure with logger.error.

3. Query AST with explicit selectors
- Prefer specific selectors over broad selectors.
- Use astService.query(ast, selector) and cast to the expected Babel node type.
- If selector complexity grows, split query and post-filter in code.

4. Build Smell payloads deterministically
- Use node.start/node.end for source slices.
- Use node.loc for line and column metadata with safe fallbacks.
- Include a stable, human-readable message.
- Include a codeBlock slice from sourceCode.

5. Add focused unit tests
- File pattern: lib/detectors/<smellName>.test.ts.
- Include at least:
	- one invalid example
	- one valid example
	- one edge case
	- one multi-case sample with mixed valid/invalid nodes
- Parse test code with astService.parseToAst and call detector.detect.
- Assert count and message text.

6. Register detector when introducing a new one
- Add export in lib/detectors/index.ts.
- If runner registration is centralized elsewhere, wire it there too.

7. Validate
- Run targeted tests for the detector file.
- Run full test suite if detector behavior affects shared logic.

## Decision Points

1. Selector or manual checks?
- Use selector-first when structure is expressible.
- Add manual guard checks when semantics depend on values or thresholds.

2. One-pass or multi-pass logic?
- Use one pass for simple node-level smells.
- Use aggregation maps for cross-node smells such as duplicate descriptions.

3. Parse-time safety handling
- If node metadata is missing, use safe defaults and continue.
- If unexpected node shape appears, skip node rather than throwing.

## Quality Gates

- Detector compiles in strict TypeScript without any.
- Logging uses logger with structured metadata, never console.
- All Smell fields are populated consistently.
- Tests prove valid, invalid, and edge behavior.
- Selector intent is readable and maintainable.

## Output Template

When using this skill, produce:

1. detector file implementation
2. corresponding test file updates
3. export/registration updates if needed
4. short summary of thresholds and known tradeoffs

## Example Prompt Starters

- Implement a detector for tests with identical assertion blocks.
- Add threshold-based detection for overly long test descriptions.
- Fix false positives in conditional test logic detector for nested callbacks.