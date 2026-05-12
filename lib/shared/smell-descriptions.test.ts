// Feature: performance-ux-improvements, Property 6
// Validates: Requirements 4.3

import { SMELL_DESCRIPTIONS } from "@/shared/smell-descriptions";

describe("SMELL_DESCRIPTIONS severity coverage", () => {
  const validSeverities = new Set(["low", "medium", "high"]);

  /**
   * Property 6: All `SMELL_DESCRIPTIONS` entries have a valid severity.
   * For every key in SMELL_DESCRIPTIONS, the `severity` field SHALL be
   * one of 'low', 'medium', or 'high'.
   *
   * Validates: Requirements 4.3
   */
  it("every entry has a severity of 'low', 'medium', or 'high'", () => {
    const keys = Object.keys(SMELL_DESCRIPTIONS) as Array<keyof typeof SMELL_DESCRIPTIONS>;

    expect(keys.length).toBeGreaterThan(0);

    for (const key of keys) {
      const entry = SMELL_DESCRIPTIONS[key];
      // Use toContain so the key name appears in the failure message via the matcher
      expect(validSeverities).toContain(entry.severity);
    }
  });

  it("covers all 15 expected smell keys", () => {
    const expectedKeys = [
      "AnonymousTest",
      "CommentsOnlyTest",
      "ComplexSnapshotTest",
      "ConditionalTestLogic",
      "GeneralFixture",
      "IdenticalDescription",
      "OvercommentedTest",
      "TestWithoutDescription",
      "NonFunctionalStatement",
      "OnlyTest",
      "SensitiveEquality",
      "SubOptimalAssert",
      "TranscriptingTest",
      "VerboseTest",
      "VerifyInSetup",
    ];

    for (const key of expectedKeys) {
      expect(Object.keys(SMELL_DESCRIPTIONS)).toContain(key);
    }

    expect(Object.keys(SMELL_DESCRIPTIONS)).toHaveLength(expectedKeys.length);
  });
});
