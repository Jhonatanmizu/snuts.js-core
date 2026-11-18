import { SMELL_DESCRIPTIONS } from "@/shared/smell-descriptions";

describe("SMELL_DESCRIPTIONS metadata coverage", () => {
  it("provides a non-empty description and explanation for every entry", () => {
    const entries = Object.values(SMELL_DESCRIPTIONS);

    expect(entries.length).toBeGreaterThan(0);
    expect(
      entries.every(
        (entry) => entry.description.trim().length > 0 && entry.explanation.trim().length > 0,
      ),
    ).toBe(true);
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

    expect(Object.keys(SMELL_DESCRIPTIONS)).toEqual(expectedKeys);
  });
});
