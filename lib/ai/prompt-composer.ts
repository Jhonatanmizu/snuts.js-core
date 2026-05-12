import { RefactorPatch } from "@/ai/types";
import { Smell } from "@/core/detector.interface";

function smellsToBullets(smells: Smell[]): string {
  if (smells.length === 0) {
    return "- No smells detected. Improve readability and maintainability conservatively.";
  }

  return smells
    .map(
      (smell) =>
        `- ${smell.description} (${smell.start.line}:${smell.start.column}-${smell.end.line}:${smell.end.column}): ${smell.message}`,
    )
    .join("\n");
}

export class PromptComposer {
  composeSystemPrompt(): string {
    return [
      "You are a senior JavaScript/TypeScript refactoring assistant for test files.",
      "Return only valid JSON, no markdown fences and no explanations.",
      "The JSON schema is:",
      JSON.stringify({
        summary: "short summary",
        edits: [
          {
            startLine: 1,
            endLine: 1,
            replacement: "updated code",
            reason: "why this change",
          },
        ],
      } satisfies RefactorPatch),
      "Rules:",
      "- Use 1-based inclusive line numbers.",
      "- Keep behavior equivalent.",
      "- Avoid broad rewrites; only touch lines needed by smells.",
      "- If no safe change exists, return edits as an empty array.",
    ].join("\n");
  }

  composeUserPrompt(file: string, sourceCode: string, smells: Smell[]): string {
    return [
      `Target file: ${file}`,
      "",
      "Detected smells:",
      smellsToBullets(smells),
      "",
      "Current source code:",
      "```ts",
      sourceCode,
      "```",
    ].join("\n");
  }
}
