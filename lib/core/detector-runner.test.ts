import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import * as t from "@babel/types";

import { DetectorRunner } from "./detector-runner";
import { Detector, Smell } from "./detector.interface";

import { ParsedFile } from "@/ast/ast.service";
import astService from "@/ast/ast.service";
import { logger } from "@/shared/logger";

jest.mock("@/ast/ast.service", () => ({
  __esModule: true,
  default: {
    parseFileToAst: jest.fn<() => Promise<ParsedFile | null>>(),
    getSourceCode: jest.fn<() => Promise<string>>(),
    parseToAst: jest.fn<() => t.File>(),
  },
}));

jest.mock("@/shared/logger", () => ({
  __esModule: true,
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("DetectorRunner", () => {
  const mockFilePath = "/path/to/test-file.ts";
  const mockSourceCode = "const a = 1;";
  const mockAst = {} as t.File;

  beforeEach(() => {
    (astService.parseFileToAst as jest.Mock<() => Promise<ParsedFile | null>>).mockClear();
    (astService.getSourceCode as jest.Mock<() => Promise<string>>).mockClear();
    (astService.parseToAst as jest.Mock<() => t.File>).mockClear();
    (logger.error as jest.Mock).mockClear();

    (astService.parseFileToAst as jest.Mock<() => Promise<ParsedFile | null>>).mockResolvedValue({
      ast: mockAst,
      code: mockSourceCode,
    });
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
      detect: jest
        .fn<(ast: t.File, sourceCode: string, file: string) => Promise<Smell[]>>()
        .mockResolvedValue([mockSmell1]),
    };
    const mockDetector2: Detector = {
      detect: jest
        .fn<(ast: t.File, sourceCode: string, file: string) => Promise<Smell[]>>()
        .mockResolvedValue([mockSmell2]),
    };

    const runner = new DetectorRunner([mockDetector1, mockDetector2]);
    const smells = await runner.run(mockFilePath);

    expect(astService.parseFileToAst).toHaveBeenCalledWith(mockFilePath);

    expect(mockDetector1.detect).toHaveBeenCalledWith(mockAst, mockSourceCode, mockFilePath);
    expect(mockDetector2.detect).toHaveBeenCalledWith(mockAst, mockSourceCode, mockFilePath);

    expect(smells).toHaveLength(2);
    expect(smells).toEqual(expect.arrayContaining([mockSmell1, mockSmell2]));
  });

  it("should return an empty array if no detectors are registered", async () => {
    const runner = new DetectorRunner([]);
    const smells = await runner.run(mockFilePath);

    expect(astService.parseFileToAst).toHaveBeenCalledWith(mockFilePath);
    expect(smells).toHaveLength(0);
  });

  it("should return an empty array if parseFileToAst returns null", async () => {
    (astService.parseFileToAst as jest.Mock<() => Promise<ParsedFile | null>>).mockResolvedValue(
      null,
    );

    const mockDetector: Detector = {
      detect: jest
        .fn<(ast: t.File, sourceCode: string, file: string) => Promise<Smell[]>>()
        .mockResolvedValue([]),
    };

    const runner = new DetectorRunner([mockDetector]);
    const smells = await runner.run(mockFilePath);

    expect(astService.parseFileToAst).toHaveBeenCalledWith(mockFilePath);
    expect(mockDetector.detect).not.toHaveBeenCalled();
    expect(smells).toHaveLength(0);
  });

  it("should handle detectors returning no smells", async () => {
    const mockDetector: Detector = {
      detect: jest
        .fn<(ast: t.File, sourceCode: string, file: string) => Promise<Smell[]>>()
        .mockResolvedValue([]),
    };

    const runner = new DetectorRunner([mockDetector]);
    const smells = await runner.run(mockFilePath);

    expect(astService.parseFileToAst).toHaveBeenCalledWith(mockFilePath);
    expect(mockDetector.detect).toHaveBeenCalledWith(mockAst, mockSourceCode, mockFilePath);
    expect(smells).toHaveLength(0);
  });

  it("should handle detectors throwing errors gracefully", async () => {
    (logger.error as jest.Mock).mockImplementation(() => {});

    const mockDetector1: Detector = {
      detect: jest
        .fn<(ast: t.File, sourceCode: string, file: string) => Promise<Smell[]>>()
        .mockRejectedValue(new Error("Detector error")),
    };
    const mockDetector2: Detector = {
      detect: jest
        .fn<(ast: t.File, sourceCode: string, file: string) => Promise<Smell[]>>()
        .mockResolvedValue([]),
    };

    const runner = new DetectorRunner([mockDetector1, mockDetector2]);
    const smells = await runner.run(mockFilePath);

    expect(astService.parseFileToAst).toHaveBeenCalledWith(mockFilePath);
    expect(mockDetector1.detect).toHaveBeenCalled();
    expect(mockDetector2.detect).toHaveBeenCalled();
    expect(smells).toHaveLength(0);
    expect(logger.error).toHaveBeenCalled();
  });
});
