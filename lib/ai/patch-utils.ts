import { RefactorEdit, RefactorPatch } from "@/ai/types";

function isValidEdit(edit: Partial<RefactorEdit>): edit is RefactorEdit {
  return (
    Number.isInteger(edit.startLine) &&
    Number.isInteger(edit.endLine) &&
    (edit.startLine ?? 0) > 0 &&
    (edit.endLine ?? 0) > 0 &&
    (edit.startLine ?? 0) <= (edit.endLine ?? 0) &&
    typeof edit.replacement === "string" &&
    typeof edit.reason === "string"
  );
}

export function parseRefactorPatch(jsonContent: string): RefactorPatch {
  let raw: unknown;
  try {
    raw = JSON.parse(jsonContent);
  } catch (error) {
    throw new Error(`Model returned invalid JSON: ${String(error)}`);
  }

  if (!raw || typeof raw !== "object") {
    throw new Error("Model patch payload must be an object.");
  }

  const rawPatch = raw as Partial<RefactorPatch>;
  const edits = Array.isArray(rawPatch.edits) ? rawPatch.edits : [];

  for (const edit of edits) {
    if (!isValidEdit(edit as Partial<RefactorEdit>)) {
      throw new Error("Model patch payload contains an invalid edit.");
    }
  }

  if (typeof rawPatch.summary !== "string") {
    throw new Error("Model patch payload must include a summary string.");
  }

  return {
    summary: rawPatch.summary,
    edits: edits as RefactorEdit[],
  };
}

export function applyEdits(sourceCode: string, edits: RefactorEdit[]): string {
  if (edits.length === 0) {
    return sourceCode;
  }

  const lines = sourceCode.split("\n");
  const ordered = [...edits].sort((a, b) => b.startLine - a.startLine);

  let lastStart = Number.POSITIVE_INFINITY;
  for (const edit of ordered) {
    if (edit.endLine >= lastStart) {
      throw new Error("Overlapping edits detected. Refusing to apply patch.");
    }
    lastStart = edit.startLine;
  }

  for (const edit of ordered) {
    const startIndex = edit.startLine - 1;
    const deleteCount = edit.endLine - edit.startLine + 1;
    const replacementLines = edit.replacement.split("\n");
    lines.splice(startIndex, deleteCount, ...replacementLines);
  }

  return lines.join("\n");
}
