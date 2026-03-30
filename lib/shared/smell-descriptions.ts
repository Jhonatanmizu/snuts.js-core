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
} as const satisfies Record<string, SmellDescription>;
