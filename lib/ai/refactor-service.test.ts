import path from "node:path";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";

import { RefactorService } from "./refactor-service";
import { AIProviderRegistry } from "./providers/registry";

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

    const changedCode = await readFile(file, "utf8");
    expect(changedCode).toContain("const value = 2;");
    expect(result.rollbackToken).toBeDefined();

    await service.rollback(result.rollbackToken!);
    const rolledBackCode = await readFile(file, "utf8");
    expect(rolledBackCode).toBe(initialCode);

    await rm(dir, { recursive: true, force: true });
  });
});
