import { applyEdits, generateUnifiedDiff, parseRefactorPatch } from "@/ai/patch-utils";

describe("generateUnifiedDiff", () => {
  describe("headers", () => {
    it("always emits --- a/<filePath> header", () => {
      const diff = generateUnifiedDiff("a\n", "b\n", "src/foo.ts");
      expect(diff).toContain("--- a/src/foo.ts");
    });

    it("always emits +++ b/<filePath> header", () => {
      const diff = generateUnifiedDiff("a\n", "b\n", "src/foo.ts");
      expect(diff).toContain("+++ b/src/foo.ts");
    });

    it("uses the exact filePath provided in both headers", () => {
      const diff = generateUnifiedDiff("x", "y", "lib/ai/patch-utils.ts");
      expect(diff).toContain("--- a/lib/ai/patch-utils.ts");
      expect(diff).toContain("+++ b/lib/ai/patch-utils.ts");
    });
  });

  describe("identical strings (Requirement 5.5)", () => {
    it("returns headers-only when original === updated (empty string)", () => {
      const diff = generateUnifiedDiff("", "", "file.ts");
      expect(diff).toContain("--- a/file.ts");
      expect(diff).toContain("+++ b/file.ts");
      expect(diff).not.toContain("@@");
    });

    it("returns headers-only when original === updated (non-empty string)", () => {
      const src = "const x = 1;\nconst y = 2;\n";
      const diff = generateUnifiedDiff(src, src, "file.ts");
      expect(diff).not.toContain("@@");
      expect(diff).not.toContain("-const");
      expect(diff).not.toContain("+const");
    });
  });

  describe("hunk format (Requirement 5.1, 5.2)", () => {
    it("emits @@ hunk header for a single-line change", () => {
      const original = "line1\nline2\nline3\n";
      const updated = "line1\nLINE2\nline3\n";
      const diff = generateUnifiedDiff(original, updated, "f.ts");
      expect(diff).toMatch(/@@ -\d+,\d+ \+\d+,\d+ @@/);
    });

    it("marks removed lines with - prefix", () => {
      const original = "hello\nworld\n";
      const updated = "hello\nearth\n";
      const diff = generateUnifiedDiff(original, updated, "f.ts");
      expect(diff).toContain("-world");
    });

    it("marks added lines with + prefix", () => {
      const original = "hello\nworld\n";
      const updated = "hello\nearth\n";
      const diff = generateUnifiedDiff(original, updated, "f.ts");
      expect(diff).toContain("+earth");
    });

    it("includes context lines with space prefix", () => {
      const original = "a\nb\nc\nd\ne\n";
      const updated = "a\nb\nX\nd\ne\n";
      const diff = generateUnifiedDiff(original, updated, "f.ts");
      expect(diff).toContain(" a");
      expect(diff).toContain(" b");
      expect(diff).toContain(" d");
      expect(diff).toContain(" e");
    });

    it("limits context to 3 lines on each side", () => {
      const lines = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
      const original = lines.join("\n");
      const updatedLines = [...lines];
      updatedLines[4] = "FIVE";
      const updated = updatedLines.join("\n");
      const diff = generateUnifiedDiff(original, updated, "f.ts");
      expect(diff).not.toContain(" 1\n");
      expect(diff).toContain(" 2");
      expect(diff).toContain(" 3");
      expect(diff).toContain(" 4");
      expect(diff).toContain(" 6");
      expect(diff).toContain(" 7");
      expect(diff).toContain(" 8");
      expect(diff).not.toContain(" 9\n");
    });
  });

  describe("pure additions", () => {
    it("handles adding lines to an empty file", () => {
      const diff = generateUnifiedDiff("", "new line\n", "f.ts");
      expect(diff).toContain("+new line");
      expect(diff).toMatch(/@@ /);
    });

    it("handles appending a line", () => {
      const original = "line1\n";
      const updated = "line1\nline2\n";
      const diff = generateUnifiedDiff(original, updated, "f.ts");
      expect(diff).toContain("+line2");
    });
  });

  describe("pure deletions", () => {
    it("handles removing all lines", () => {
      const diff = generateUnifiedDiff("old line\n", "", "f.ts");
      expect(diff).toContain("-old line");
      expect(diff).toMatch(/@@ /);
    });

    it("handles removing a line from the middle", () => {
      const original = "a\nb\nc\n";
      const updated = "a\nc\n";
      const diff = generateUnifiedDiff(original, updated, "f.ts");
      expect(diff).toContain("-b");
    });
  });

  describe("multiple hunks", () => {
    it("produces two separate hunks for changes far apart", () => {
      const lines = Array.from({ length: 20 }, (_, i) => `line${i + 1}`);
      const original = lines.join("\n");
      const updatedLines = [...lines];
      updatedLines[0] = "CHANGED_LINE1";
      updatedLines[19] = "CHANGED_LINE20";
      const updated = updatedLines.join("\n");
      const diff = generateUnifiedDiff(original, updated, "f.ts");
      const hunkCount = (diff.match(/@@ /g) ?? []).length;
      expect(hunkCount).toBe(2);
    });
  });

  describe("round-trip with applyEdits (Requirement 5.1)", () => {
    it("diff is non-empty when edits are non-empty", () => {
      const original = "const x = 1;\nconst y = 2;\nconst z = 3;\n";
      const edits = [{ startLine: 2, endLine: 2, replacement: "const y = 99;", reason: "test" }];
      const updated = applyEdits(original, edits);
      const diff = generateUnifiedDiff(original, updated, "src/test.ts");
      expect(diff.length).toBeGreaterThan(0);
      expect(diff).toContain("--- a/src/test.ts");
      expect(diff).toContain("+++ b/src/test.ts");
      expect(diff).toContain("-const y = 2;");
      expect(diff).toContain("+const y = 99;");
    });

    it("diff is headers-only when edits are empty", () => {
      const original = "const x = 1;\n";
      const updated = applyEdits(original, []);
      const diff = generateUnifiedDiff(original, updated, "src/test.ts");
      expect(diff).not.toContain("@@");
    });
  });
});

describe("Property 9: Unified diff round-trip", () => {
  /** Generate a random integer in [min, max] (inclusive). */
  function randInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /** Generate a random alphanumeric string of length [1, maxLen]. */
  function randWord(maxLen = 12): string {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789_";
    const len = randInt(1, maxLen);
    return Array.from({ length: len }, () => chars[randInt(0, chars.length - 1)]).join("");
  }

  /** Generate a random source string with [1, maxLines] lines. */
  function randSource(maxLines = 20): string {
    const lineCount = randInt(1, maxLines);
    return Array.from({ length: lineCount }, () => randWord(20)).join("\n");
  }

  /** Generate a random file path like "src/foo/bar.ts". */
  function randFilePath(): string {
    const parts = randInt(1, 3);
    const segments = Array.from({ length: parts }, () => randWord(8));
    return segments.join("/") + ".ts";
  }

  /**
   * Generate a set of non-overlapping edits for a source string.
   * Returns an empty array if the source has fewer than 1 line.
   */
  function randNonOverlappingEdits(
    source: string,
    maxEdits = 3,
  ): Array<{ startLine: number; endLine: number; replacement: string; reason: string }> {
    const lines = source.split("\n");
    const totalLines = lines.length;
    if (totalLines < 1) return [];

    const editCount = randInt(0, Math.min(maxEdits, Math.floor(totalLines / 2)));
    if (editCount === 0) return [];

    const edits: Array<{
      startLine: number;
      endLine: number;
      replacement: string;
      reason: string;
    }> = [];
    const claimed = new Set<number>();

    let attempts = 0;
    while (edits.length < editCount && attempts < 200) {
      attempts++;
      const start = randInt(1, totalLines);
      const maxEnd = Math.min(start + 2, totalLines);
      const end = randInt(start, maxEnd);

      let overlaps = false;
      for (let l = start; l <= end; l++) {
        if (claimed.has(l)) {
          overlaps = true;
          break;
        }
      }
      if (overlaps) continue;

      for (let l = start; l <= end; l++) claimed.add(l);

      edits.push({
        startLine: start,
        endLine: end,
        replacement: randWord(15),
        reason: "property-test",
      });
    }

    return edits;
  }

  it("diff always contains --- a/ and +++ b/ headers for any source and edits", () => {
    const ITERATIONS = 100;

    for (let i = 0; i < ITERATIONS; i++) {
      const original = randSource(20);
      const filePath = randFilePath();
      const edits = randNonOverlappingEdits(original, 3);

      let updated: string;
      try {
        updated = applyEdits(original, edits);
      } catch {
        continue;
      }

      const diff = generateUnifiedDiff(original, updated, filePath);

      expect(diff).toContain(`--- a/${filePath}`);
      expect(diff).toContain(`+++ b/${filePath}`);
    }
  });

  it("diff is non-empty (contains hunks) when edits are non-empty", () => {
    const ITERATIONS = 100;
    let testedWithEdits = 0;

    for (let i = 0; i < ITERATIONS; i++) {
      const original = randSource(20);
      const filePath = randFilePath();
      const edits = randNonOverlappingEdits(original, 3);

      if (edits.length === 0) continue;

      let updated: string;
      try {
        updated = applyEdits(original, edits);
      } catch {
        continue;
      }

      if (original === updated) continue;

      const diff = generateUnifiedDiff(original, updated, filePath);

      expect(diff).toContain("@@");
      expect(diff.length).toBeGreaterThan(0);

      testedWithEdits++;
    }

    expect(testedWithEdits).toBeGreaterThan(10);
  });
});

describe("parseRefactorPatch", () => {
  it("parses a valid patch", () => {
    const json = JSON.stringify({
      summary: "test",
      edits: [{ startLine: 1, endLine: 1, replacement: "x", reason: "r" }],
    });
    const patch = parseRefactorPatch(json);
    expect(patch.summary).toBe("test");
    expect(patch.edits).toHaveLength(1);
  });

  it("parses a valid patch wrapped in markdown json fences", () => {
    const fencedJson = [
      "```json",
      JSON.stringify({
        summary: "fenced summary",
        edits: [{ startLine: 1, endLine: 1, replacement: "x", reason: "r" }],
      }),
      "```",
    ].join("\n");
    const patch = parseRefactorPatch(fencedJson);
    expect(patch.summary).toBe("fenced summary");
    expect(patch.edits).toHaveLength(1);
  });

  it("throws on invalid JSON", () => {
    expect(() => parseRefactorPatch("{bad}")).toThrow("invalid JSON");
  });
});

describe("applyEdits", () => {
  it("returns source unchanged when edits is empty", () => {
    const src = "hello\nworld\n";
    expect(applyEdits(src, [])).toBe(src);
  });

  it("applies a single replacement", () => {
    const src = "line1\nline2\nline3\n";
    const result = applyEdits(src, [
      { startLine: 2, endLine: 2, replacement: "REPLACED", reason: "r" },
    ]);
    expect(result).toBe("line1\nREPLACED\nline3\n");
  });
});
