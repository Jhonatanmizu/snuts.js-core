---
description: "Use when implementing or modifying TypeScript AST detectors, rules, code analysis, or transformations in snuts-js core. Enforces strict typing, esquery-based matching, pino logging, and rule-focused unit testing."
applyTo: "**/*.ts"
---

# snuts-js Core Project Rules

TypeScript static analysis library for deterministic, extensible AST-based detection and transformation.

## Non-Negotiable Rules

- Never use `any`.
- Always type function inputs and outputs explicitly.
- Prefer pure functions and composable helpers.
- Keep detector/rule logic isolated and independently testable.
- Never use `console.log`; use pino structured logs.

## Type Safety

- Prefer `unknown`, discriminated unions, generics, and explicit interfaces.
- Preserve strict mode compatibility.

```ts
// Bad
function parse(node: any) {}

// Good
function parse(node: TSESTree.Node): ParsedResult {
  return toParsedResult(node);
}
```

## Rule Architecture

Use this shape for detectors/rules:

```ts
export interface Rule {
  name: string;
  description: string;
  create(context: RuleContext): RuleListener;
}
```

Constraints:

- Do not share mutable state across rules.
- Keep parsing, matching, reporting, and logging concerns separated.

## AST Matching with esquery

- Prefer esquery selectors over manual AST traversal.
- Use specific, readable selectors.
- Split complex selectors and document intent for non-trivial patterns.

```ts
import esquery from "esquery";

const matches = esquery(ast, "CallExpression[callee.name='setTimeout']");
```

```ts
// Async function without await
"FunctionDeclaration[async=true]:not(:has(AwaitExpression))";
```

## Logging with pino

- Use structured logs with context fields.
- Include rule and node metadata on detections.

```ts
logger.info(
  {
    rule: rule.name,
    nodeType: node.type,
  },
  "Rule triggered"
);
```

## Testing Requirements

Each detector/rule test suite must cover:

- valid inputs (no report)
- invalid inputs (report expected)
- edge cases (boundary/ambiguous structures)

```ts
describe("no-console rule", () => {
  it("reports console usage", () => {
    // test logic
  });
});
```

## Performance Guidelines

- Avoid repeated traversals over the same AST.
- Cache reusable computed results where appropriate.
- Prefer batch processing when evaluating multiple detectors.

## Rule Documentation Expectations

For each rule, include:

- short description
- invalid and valid examples
- explanation of why and how the rule works

## AI Output Expectations

When generating or reviewing code for this project:

- follow strict TypeScript patterns
- use esquery for matching unless there is a clear reason not to
- use pino for observability
- keep modules deterministic, small, and testable
- think as a reusable library author, not an app author