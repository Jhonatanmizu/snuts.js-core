import { PromptComposer } from "./prompt-composer";

describe("PromptComposer", () => {
  it("builds prompts including smells and source", () => {
    const composer = new PromptComposer();
    const systemPrompt = composer.composeSystemPrompt();
    const userPrompt = composer.composeUserPrompt(
      "/tmp/file.test.ts",
      "test('x', () => expect(true).toBe(true));",
      [
        {
          file: "/tmp/file.test.ts",
          start: { line: 1, column: 0 },
          end: { line: 1, column: 35 },
          message: "Anonymous test case detected.",
          codeBlock: "",
          description: "Anonymous Test",
          explanation: "Too short",
        },
      ],
    );

    expect(systemPrompt).toContain("Return only valid JSON");
    expect(userPrompt).toContain("Detected smells:");
    expect(userPrompt).toContain("Anonymous Test");
    expect(userPrompt).toContain("Current source code:");
  });
});
