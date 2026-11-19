export interface SmellDescription {
  description: string;
  explanation: string;
}

export const SMELL_DESCRIPTIONS = {
  AnonymousTest: {
    description: "Anonymous Test",
    explanation:
      "A test case with a very short or vague description (two words or fewer) makes it difficult to understand what behavior is being verified. Tests should have meaningful names that clearly express the intent, the scenario, and the expected outcome.",
  },

  CommentsOnlyTest: {
    description: "Comments-Only Test",
    explanation:
      "A test case whose body is empty or contains only comments provides no real verification. These tests always pass regardless of the code under test, creating a false sense of coverage and hiding untested behavior.",
  },

  ComplexSnapshotTest: {
    description: "Complex Snapshot",
    explanation:
      "A snapshot test that spans too many lines is difficult to review, understand, and maintain. When such a snapshot breaks, it is hard to identify what actually changed. Consider asserting only the relevant parts of the output or breaking the test into smaller, focused assertions.",
  },

  ConditionalTestLogic: {
    description: "Conditional Test Logic",
    explanation:
      "Conditional statements (if/switch) inside a test case introduce branching paths that make the test harder to read and reason about. A single test should verify one clear scenario; branches often indicate that multiple test cases should be written instead, one for each code path.",
  },

  GeneralFixture: {
    description: "General Fixture",
    explanation:
      "A variable defined in a setup hook (beforeAll/beforeEach) that is never referenced in any test case adds unnecessary complexity to the test suite. This usually means the fixture is outdated, was set up speculatively, or belongs to a different test group. Remove or scope it appropriately.",
  },

  IdenticalDescription: {
    description: "Identical Description",
    explanation:
      "Multiple test cases sharing the same description make it impossible to distinguish between them when a test fails. Each test case must have a unique name that precisely identifies the specific scenario and expected outcome being verified.",
  },

  OvercommentedTest: {
    description: "Overcommented Test",
    explanation:
      "A test case with an excessive number of comments often signals that the test logic is too complex or poorly structured. Well-written tests should be self-explanatory through clear naming and simple assertions. Relying heavily on comments to explain what a test does is a sign it should be refactored.",
  },

  TestWithoutDescription: {
    description: "Test Without Description",
    explanation:
      "A test case with no description at all makes it completely impossible to understand its purpose from the test report. Every test must have a descriptive name that communicates what behavior is being tested, under what conditions, and what the expected result is.",
  },

  NonFunctionalStatement: {
    description: "Non-Functional Statement",
    explanation:
      "An empty block with no explanatory comments usually indicates dead code, an unfinished test, or a mistaken placeholder. Either remove the empty block or document why it intentionally does nothing.",
  },

  OnlyTest: {
    description: "Focused / Isolated Test",
    explanation:
      "Using `it.only`, `test.only`, or `describe.only` restricts which tests run and is meant for temporary debugging. Shipping focused tests hides failures in the rest of the suite and should not remain in committed code.",
  },

  SensitiveEquality: {
    description: "Sensitive Equality",
    explanation:
      "Comparing values via `.toString()` (for example `expect(x.toString())`) or comparing expression results that rely on default string conversion is brittle: formatting can change without logical bugs. Prefer stable matchers and explicit expectations.",
  },

  SubOptimalAssert: {
    description: "Suboptimal Assertion",
    explanation:
      "Some assertion shapes are harder to read or easier to misuse than dedicated matchers—for example checking undefined/null via `toBe` instead of `toBeUndefined`/`toBeNull`, using raw binary expressions inside `expect`, or relying on awkward patterns that obscure intent.",
  },

  TranscriptingTest: {
    description: "Transcripting Test",
    explanation:
      "Logging to the console from a test (`console.log`, `console.warn`, etc.) clutters CI output and often signals leftover debugging code. Tests should assert behavior instead of printing transcripts.",
  },

  VerboseTest: {
    description: "Verbose Test",
    explanation:
      "A test body with a very large number of statements is difficult to follow and usually verifies too much at once. Splitting it into smaller, focused tests improves readability and failure diagnostics.",
  },

  VerifyInSetup: {
    description: "Assertion in Setup",
    explanation:
      "Assertions placed inside lifecycle hooks (such as `beforeEach`) combine setup with verification, making failures harder to trace to a specific test case. Prefer arranging state in hooks and asserting inside individual tests.",
  },

  AssertionRoulette: {
    description: "Assertion Roulette",
    explanation:
      "A test case containing multiple assertions without explanatory failure messages makes it difficult to identify which specific check failed. Add descriptive failure messages or split unrelated assertions into dedicated test cases.",
  },

  DependentTest: {
    description: "Dependent Test",
    explanation:
      "A test case that relies on state mutated by a previous test case (without being reset in `beforeEach`) violates test isolation and can fail unpredictably when test execution order changes.",
  },

  DuplicateAssert: {
    description: "Duplicate Assert",
    explanation:
      "Repeating the exact same assertion multiple times within a single test case adds redundancy without increasing test coverage. Remove duplicate assertions or split distinct state transitions into separate test cases.",
  },

  EagerTest: {
    description: "Eager Test",
    explanation:
      "A single test case that invokes multiple distinct methods on the object under test verifies too many behaviors at once. Split eager tests into focused unit tests that verify one behavior per test.",
  },

  ExceptionHandling: {
    description: "Exception Handling",
    explanation:
      "Manually catching or throwing exceptions via `try/catch` or `throw` inside a test case obscures failure semantics and can cause tests to pass silently when an expected error is not thrown. Use framework assertion helpers like `expect(() => ...).toThrow()` or `expect(...).rejects`.",
  },

  IgnoredTest: {
    description: "Ignored Test",
    explanation:
      "Skipped or placeholder tests (`it.skip`, `test.skip`, `describe.skip`, `xit`, `xtest`, `it.todo`) suppress test execution and accumulate stale or unverified code. Fix and re-enable the test or remove it if obsolete.",
  },

  LazyTest: {
    description: "Lazy Test",
    explanation:
      "Multiple test cases in the same suite that invoke the exact same single method on the system under test often indicate fragmented verification that can be consolidated or parameterized.",
  },

  MagicNumberTest: {
    description: "Magic Number Test",
    explanation:
      "Using unexplained raw numeric literals inside assertions makes it difficult to understand the business rule or domain meaning behind the expected value. Extract magic numbers into well-named constants.",
  },

  MysteryGuest: {
    description: "Mystery Guest",
    explanation:
      "A test that directly accesses external resources (such as the file system, network sockets, HTTP clients, or browser storage) depends on hidden external state and can become slow or flaky. Mock external dependencies or use in-memory fixtures.",
  },

  RedundantAssertion: {
    description: "Redundant Assertion",
    explanation:
      "An assertion comparing identical literals or identifiers (such as `expect(true).toBe(true)` or `assert.strictEqual(x, x)`) is tautological and cannot detect regressions. Assert actual computed output against expected values.",
  },

  ResourceOptimism: {
    description: "Resource Optimism",
    explanation:
      "A test case that reads, writes, or deletes external files or paths without verifying their existence or availability makes optimistic assumptions about the environment. Check or provision resources explicitly before use, or mock the file system.",
  },

  SleepyTest: {
    description: "Sleepy Test",
    explanation:
      "Using explicit time delays (`setTimeout` or timer-based sleeps) inside a test case slows down test execution and leads to non-deterministic, flaky failures. Use fake timers, event callbacks, or deterministic condition polling instead.",
  },

  UnknownTest: {
    description: "Unknown Test",
    explanation:
      "A test case with executable statements but no assertions (`expect`, `assert`, or expected-error matchers) does not verify any outcome, making its intent unclear and allowing regressions to go unnoticed.",
  },
} as const satisfies Record<string, SmellDescription>;
