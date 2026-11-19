import { RefactorEdit, RefactorPatch } from "@/ai/types";

/**
 * Compute the Longest Common Subsequence (LCS) of two line arrays using
 * dynamic programming. Returns the LCS as an array of [indexA, indexB] pairs.
 */
function computeLcs(a: string[], b: string[]): Array<[number, number]> {
  const m = a.length;
  const n = b.length;

  // dp[i][j] = length of LCS of a[0..i-1] and b[0..j-1]
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0) as number[]);

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i]![j] = dp[i - 1]![j - 1]! + 1;
      } else {
        dp[i]![j] = Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!);
      }
    }
  }

  // Backtrack to find the actual LCS pairs
  const lcs: Array<[number, number]> = [];
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      lcs.push([i - 1, j - 1]);
      i--;
      j--;
    } else if (dp[i - 1]![j]! >= dp[i]![j - 1]!) {
      i--;
    } else {
      j--;
    }
  }
  lcs.reverse();
  return lcs;
}

type DiffOp = { op: "context" | "remove" | "add"; lineA: number; lineB: number; text: string };

/**
 * Produce a flat list of diff operations (context / remove / add) from two
 * line arrays using the LCS.
 */
function buildDiffOps(a: string[], b: string[]): DiffOp[] {
  const lcs = computeLcs(a, b);
  const ops: DiffOp[] = [];

  let ia = 0;
  let ib = 0;

  for (const [la, lb] of lcs) {
    while (ia < la) {
      ops.push({ op: "remove", lineA: ia, lineB: -1, text: a[ia] ?? "" });
      ia++;
    }
    while (ib < lb) {
      ops.push({ op: "add", lineA: -1, lineB: ib, text: b[ib] ?? "" });
      ib++;
    }
    ops.push({ op: "context", lineA: ia, lineB: ib, text: a[ia] ?? "" });
    ia++;
    ib++;
  }

  while (ia < a.length) {
    ops.push({ op: "remove", lineA: ia, lineB: -1, text: a[ia] ?? "" });
    ia++;
  }
  while (ib < b.length) {
    ops.push({ op: "add", lineA: -1, lineB: ib, text: b[ib] ?? "" });
    ib++;
  }

  return ops;
}

const CONTEXT_LINES = 3;

interface Hunk {
  startA: number;
  countA: number;
  startB: number;
  countB: number;
  lines: string[];
}

/**
 * Group diff operations into hunks with `CONTEXT_LINES` lines of context on
 * each side of each change region.
 */
function buildHunks(ops: DiffOp[]): Hunk[] {
  const changeIndices: number[] = [];
  for (let i = 0; i < ops.length; i++) {
    if (ops[i]!.op !== "context") changeIndices.push(i);
  }

  if (changeIndices.length === 0) return [];

  const ranges: Array<[number, number]> = [];
  let rangeStart = Math.max(0, changeIndices[0]! - CONTEXT_LINES);
  let rangeEnd = Math.min(ops.length - 1, changeIndices[0]! + CONTEXT_LINES);

  for (let k = 1; k < changeIndices.length; k++) {
    const ci = changeIndices[k]!;
    const newStart = Math.max(0, ci - CONTEXT_LINES);
    const newEnd = Math.min(ops.length - 1, ci + CONTEXT_LINES);

    if (newStart <= rangeEnd + 1) {
      rangeEnd = Math.max(rangeEnd, newEnd);
    } else {
      ranges.push([rangeStart, rangeEnd]);
      rangeStart = newStart;
      rangeEnd = newEnd;
    }
  }
  ranges.push([rangeStart, rangeEnd]);

  const hunks: Hunk[] = [];
  for (const [start, end] of ranges) {
    const lines: string[] = [];
    let startA = -1;
    let startB = -1;
    let countA = 0;
    let countB = 0;

    for (let i = start; i <= end; i++) {
      const op = ops[i]!;
      if (op.op === "context") {
        if (startA === -1) startA = op.lineA + 1;
        if (startB === -1) startB = op.lineB + 1;
        lines.push(` ${op.text}`);
        countA++;
        countB++;
      } else if (op.op === "remove") {
        if (startA === -1) startA = op.lineA + 1;
        lines.push(`-${op.text}`);
        countA++;
      } else {
        if (startB === -1) startB = op.lineB + 1;
        lines.push(`+${op.text}`);
        countB++;
      }
    }

    // If the hunk starts with only removals, startB needs to be derived from
    // the position just before the first add/context in the updated file.
    if (startB === -1) {
      // All lines in this hunk are removals; startB is the line after the
      // last context line before this hunk (or 1 if at the beginning).
      // Find the first add or context op after this range to anchor startB.
      let anchorB = 1;
      for (let i = end + 1; i < ops.length; i++) {
        if (ops[i]!.op !== "remove") {
          anchorB = ops[i]!.lineB + 1;
          break;
        }
      }
      // Walk back: startB = anchorB - countB (since all lines here are removals)
      startB = anchorB;
    }
    if (startA === -1) startA = 1;

    hunks.push({ startA, countA, startB, countB, lines });
  }

  return hunks;
}

/**
 * Generate a unified diff string for two versions of a file.
 *
 * - Emits `--- a/<filePath>` and `+++ b/<filePath>` headers.
 * - Groups changes into hunks with 3 lines of context.
 * - Emits `@@ -L,N +L,N @@` hunk headers.
 * - When `original === updated`, returns headers-only output (no hunks).
 *
 * No external dependencies — uses an LCS-based Myers diff on line arrays.
 */
export function generateUnifiedDiff(original: string, updated: string, filePath: string): string {
  const header = `--- a/${filePath}\n+++ b/${filePath}`;

  if (original === updated) {
    return header + "\n";
  }

  const aLines = original.split("\n");
  const bLines = updated.split("\n");

  const ops = buildDiffOps(aLines, bLines);
  const hunks = buildHunks(ops);

  if (hunks.length === 0) {
    return header + "\n";
  }

  const hunkStrings = hunks.map((h) => {
    const hunkHeader = `@@ -${h.startA},${h.countA} +${h.startB},${h.countB} @@`;
    return [hunkHeader, ...h.lines].join("\n");
  });

  return header + "\n" + hunkStrings.join("\n") + "\n";
}

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

function extractJsonPayload(rawContent: string): string {
  const trimmed = rawContent.trim();
  const fencedMatch = /^```(?:json|JSON)?\s*\r?\n([\s\S]*?)\r?\n```\s*$/.exec(trimmed);
  if (fencedMatch && fencedMatch[1]) {
    return fencedMatch[1].trim();
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
}

export function parseRefactorPatch(jsonContent: string): RefactorPatch {
  let raw: unknown;
  try {
    raw = JSON.parse(extractJsonPayload(jsonContent));
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
