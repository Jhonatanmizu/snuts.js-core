import { describe, it, expect, vi, beforeEach } from "vitest";
import * as t from "@babel/types";

import { DetectorRunner } from "./detector-runner";
import { Detector, Smell } from "./detector.interface";

import astService from "@/ast/ast.service";

// Mock astService to control its behavior
vi.mock("@/ast/ast.service", () => ({
  default: {
    parseFileToAst: vi.fn(),
    getSourceCode: vi.fn(),
    parseToAst: vi.fn(),
  },
}));

describe("DetectorRunner", () => {
  const mockFilePath = "/path/to/test-file.ts";
  const mockSourceCode = "const a = 1;";
  const mockAst = {} as t.File; // Mock AST object

  beforeEach(() => {
    // Reset mocks before each test
    (astService.parseFileToAst as vi.Mock).mockClear();
    (astService.getSourceCode as vi.Mock).mockClear();
    (astService.parseToAst as vi.Mock).mockClear();

    // Default mock implementations
    (astService.parseFileToAst as vi.Mock).mockReturnValue(mockAst);
    (astService.getSourceCode as vi.Mock).mockReturnValue(mockSourceCode);
  });

  it("should run all registered detectors on a file", async () => {
    const mockSmell1: Smell = {
      file: mockFilePath,
      start: { line: 1, column: 0 },
      end: { line: 1, column: 5 },
      message: "Smell 1",
      codeBlock: "const",
    };
    const mockSmell2: Smell = {
      file: mockFilePath,
      start: { line: 2, column: 0 },
      end: { line: 2, column: 5 },
      message: "Smell 2",
      codeBlock: "a = 1",
    };

    const mockDetector1: Detector = {
      detect: vi.fn().mockResolvedValue([mockSmell1]),
    };
    const mockDetector2: Detector = {
      detect: vi.fn().mockResolvedValue([mockSmell2]),
    };

    const runner = new DetectorRunner([mockDetector1, mockDetector2]);
    const smells = await runner.run(mockFilePath);

    expect(astService.parseFileToAst).toHaveBeenCalledWith(mockFilePath);
    expect(astService.getSourceCode).toHaveBeenCalledWith(mockFilePath);

    expect(mockDetector1.detect).toHaveBeenCalledWith(mockAst, mockSourceCode, mockFilePath);
    expect(mockDetector2.detect).toHaveBeenCalledWith(mockAst, mockSourceCode, mockFilePath);

    expect(smells).toHaveLength(2);
    expect(smells).toEqual(expect.arrayContaining([mockSmell1, mockSmell2]));
  });

  it("should return an empty array if no detectors are registered", async () => {
    const runner = new DetectorRunner([]);
    const smells = await runner.run(mockFilePath);

    expect(astService.parseFileToAst).toHaveBeenCalledWith(mockFilePath);
    expect(astService.getSourceCode).toHaveBeenCalledWith(mockFilePath);
    expect(smells).toHaveLength(0);
  });

  it("should return an empty array if parseFileToAst returns null", async () => {
    (astService.parseFileToAst as vi.Mock).mockReturnValue(null);

    const mockDetector: Detector = {
      detect: vi.fn().mockResolvedValue([]),
    };

    const runner = new DetectorRunner([mockDetector]);
    const smells = await runner.run(mockFilePath);

    expect(astService.parseFileToAst).toHaveBeenCalledWith(mockFilePath);
    expect(astService.getSourceCode).not.toHaveBeenCalled(); // Should not call getSourceCode if AST is null
    expect(mockDetector.detect).not.toHaveBeenCalled(); // Should not run detectors if AST is null
    expect(smells).toHaveLength(0);
  });

  it("should handle detectors returning no smells", async () => {
    const mockDetector: Detector = {
      detect: vi.fn().mockResolvedValue([]),
    };

    const runner = new DetectorRunner([mockDetector]);
    const smells = await runner.run(mockFilePath);

    expect(astService.parseFileToAst).toHaveBeenCalledWith(mockFilePath);
    expect(astService.getSourceCode).toHaveBeenCalledWith(mockFilePath);
    expect(mockDetector.detect).toHaveBeenCalledWith(mockAst, mockSourceCode, mockFilePath);
    expect(smells).toHaveLength(0);
  });

  it("should handle detectors throwing errors gracefully", async () => {
    const mockDetector1: Detector = {
      detect: vi.fn().mockRejectedValue(new Error("Detector error")),
    };
    const mockDetector2: Detector = {
      detect: vi.fn().mockResolvedValue([]),
    };

    const runner = new DetectorRunner([mockDetector1, mockDetector2]);
    const smells = await runner.run(mockFilePath);

    expect(astService.parseFileToAst).toHaveBeenCalledWith(mockFilePath);
    expect(astService.getSourceCode).toHaveBeenCalledWith(mockFilePath);
    expect(mockDetector1.detect).toHaveBeenCalled();
    expect(mockDetector2.detect).toHaveBeenCalled();
    expect(smells).toHaveLength(0); // Errors should not produce smells
  });
});
