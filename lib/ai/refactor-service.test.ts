import path from "node:path";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";

import { RefactorService } from "./refactor-service";
import { AIProviderRegistry } from "./providers/registry";

import { Detector } from "@/core/detector.interface";

describe("RefactorService", () => {
  it("returns preview result without changing file", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "snuts-refactor-"));
    const file = path.join(dir, "sample.test.ts");
    const initialCode = "test('a', () => {\n  expect(true).toBe(true);\n});\n";
    await writeFile(file, initialCode, "utf8");

    const registry: AIProviderRegistry = {
      getProvider: () => ({
        generate: async () => ({
          content: JSON.stringify({
            summary: "Rename test",
            edits: [
              {
                startLine: 1,
                endLine: 1,
                replacement: "test('better name', () => {",
                reason: "Make test descriptive",
              },
            ],
          }),
        }),
      }),
    };

    const service = new RefactorService([], registry);
    const result = await service.refactorFile({
      file,
      apply: false,
      provider: "openai",
      model: "gpt-4.1-mini",
      apiKey: "x",
    });

    const currentCode = await readFile(file, "utf8");
    expect(result.summary).toBe("Rename test");
    expect(result.patch.edits).toHaveLength(1);
    expect(currentCode).toBe(initialCode);

    await rm(dir, { recursive: true, force: true });
  });

  it("applies and rollbacks file changes", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "snuts-refactor-"));
    const file = path.join(dir, "sample.test.ts");
    const initialCode = "const value = 1;\n";
    await writeFile(file, initialCode, "utf8");

    const registry: AIProviderRegistry = {
      getProvider: () => ({
        generate: async () => ({
          content: JSON.stringify({
            summary: "Update const",
            edits: [
              {
                startLine: 1,
                endLine: 1,
                replacement: "const value = 2;",
                reason: "Refactor sample",
              },
            ],
          }),
        }),
      }),
    };

    const service = new RefactorService([], registry);
    const result = await service.refactorFile({
      file,
      apply: true,
      provider: "openai",
      model: "gpt-4.1-mini",
      apiKey: "x",
    });

    expect(await readFile(file, "utf8")).toContain("const value = 2;");
    expect(result.rollbackToken).toBeDefined();

    await service.rollback(result.rollbackToken!);
    expect(await readFile(file, "utf8")).toBe(initialCode);

    await rm(dir, { recursive: true, force: true });
  });

  it("refactors only smelly files in batch and isolates per-file errors", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "snuts-batch-"));
    const smellyFile = path.join(dir, "smelly.test.ts");
    const cleanFile = path.join(dir, "clean.test.ts");
    await writeFile(smellyFile, "const a = 1;\n", "utf8");
    await writeFile(cleanFile, "const b = 2;\n", "utf8");

    const stubDetector: Detector = {
      detect: (_ast, _src, file) =>
        file.endsWith("smelly.test.ts")
          ? [
              {
                file,
                start: { line: 1, column: 0 },
                end: { line: 1, column: 10 },
                message: "AnonymousTestLogic",
                codeBlock: "const a = 1;",
                description: "Anonymous Test",
                explanation: "Add a descriptive title",
              },
            ]
          : [],
    };

    const registry: AIProviderRegistry = {
      getProvider: () => ({
        generate: async () => ({
          content: JSON.stringify({
            summary: "Fix smell in batch",
            edits: [
              { startLine: 1, endLine: 1, replacement: "const a = 2;", reason: "Batch edit" },
            ],
          }),
        }),
      }),
    };

    const service = new RefactorService([stubDetector], registry);
    const batchResult = await service.refactorBatch({
      paths: [smellyFile, cleanFile],
      apply: true,
      provider: "openai",
      model: "gpt-4.1-mini",
      apiKey: "x",
      concurrency: 2,
    });

    expect(batchResult.totalFilesDiscovered).toBe(2);
    expect(batchResult.filesWithSmells).toBe(1);
    expect(batchResult.filesRefactored).toBe(1);

    await rm(dir, { recursive: true, force: true });
  });
});
