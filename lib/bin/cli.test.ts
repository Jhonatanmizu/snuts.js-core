import path from "node:path";
import { readFileSync } from "node:fs";

import { parseCliArgs } from "./cli-args";
import { runCli } from "./cli";

const MOCK_TEST_FILE_CONTENT = readFileSync(
  path.resolve(__dirname, "..", "test", "mock-test-file.test.ts"),
  "utf8",
);

jest.mock("node:fs/promises", () => ({
  writeFile: jest.fn(async () => {}),
  stat: jest.fn(async (filePath: string) => {
    if (filePath.includes("mock-test-file.test.ts")) {
      return { isDirectory: () => false }; // It's a file
    }
    if (filePath.endsWith(path.sep) || !path.extname(filePath)) {
      return { isDirectory: () => true }; // Heuristic for directory
    }
    return { isDirectory: () => false }; // Default to file if not specifically mocked as a directory or known file
  }),
  readFile: jest.fn(async (filePath: string) => {
    if (filePath.includes("mock-test-file.test.ts")) {
      return MOCK_TEST_FILE_CONTENT;
    }
    throw new Error(`ReadFile not mocked for: ${filePath}`);
  }),
}));

const {
  writeFile: mockFsWriteFile,
  stat: mockFsStat,
  readFile: mockFsReadFile,
} = jest.requireMock("node:fs/promises");

// Mock all detectors to simplify testing the CLI integration
jest.mock("@/detectors", () => ({
  AnonymousTestLogicDetector: jest.fn(() => ({
    detect: jest.fn(async (ast, sourceCode, file) => {
      if (file.includes("mock-test-file.test.ts")) {
        return [
          {
            file,
            start: { line: 1, column: 0 },
            end: { line: 2, column: 0 },
            message: "AnonymousTestLogic",
            codeBlock: "",
            description: "Test has anonymous logic",
            explanation: "",
          },
        ];
      }
      return [];
    }),
  })),
  // Mock other detectors if needed, or create a generic mock
  CommentsOnlyLogicTestDetector: jest.fn(() => ({ detect: jest.fn(async () => []) })),
  ComplexSnapshotTestLogicDetector: jest.fn(() => ({ detect: jest.fn(async () => []) })),
  ConditionalTestLogicDetector: jest.fn(() => ({ detect: jest.fn(async () => []) })),
  GeneralFixtureTestLogicDetector: jest.fn(() => ({ detect: jest.fn(async () => []) })),
  IdenticalDescriptionTestLogicDetector: jest.fn(() => ({ detect: jest.fn(async () => []) })),
  OvercommentedTestLogicDetector: jest.fn(() => ({ detect: jest.fn(async () => []) })),
  DetectorTestWithoutDescriptionLogic: jest.fn(() => ({ detect: jest.fn(async () => []) })),
}));

const mockFilePath = path.resolve(__dirname, "..", "test", "mock-test-file.test.ts");

describe("parseCliArgs", () => {
  it("returns help when no arguments are provided", () => {
    expect(parseCliArgs([])).toEqual({ type: "help" });
  });

  it("returns help when help flag is provided", () => {
    expect(parseCliArgs(["--help"])).toEqual({ type: "help" });
  });

  it("parses watch command with explicit paths", () => {
    expect(parseCliArgs(["watch", ".", "src"])).toEqual({
      type: "watch",
      paths: [".", "src"],
    });
  });

  it("defaults watch command to current directory", () => {
    expect(parseCliArgs(["watch"])).toEqual({
      type: "watch",
      paths: ["."],
    });
  });

  it("returns an error for unknown commands", () => {
    expect(parseCliArgs(["scan"])).toEqual({
      type: "error",
      message: "Unknown command: scan",
    });
  });

  it("parses analyze command with json format to stdout", () => {
    expect(parseCliArgs(["analyze", ".", "--format", "json"])).toEqual({
      type: "analyze",
      paths: ["."],
      format: "json",
      output: undefined,
    });
  });

  it("parses analyze command with csv format to file", () => {
    expect(parseCliArgs(["analyze", "src", "--format", "csv", "--output", "report.csv"])).toEqual({
      type: "analyze",
      paths: ["src"],
      format: "csv",
      output: "report.csv",
    });
  });

  it("returns an error if analyze command is missing format", () => {
    expect(parseCliArgs(["analyze", "."])).toEqual({
      type: "error",
      message: "Missing report format. Use --format <csv|json>.",
    });
  });

  it("returns an error if analyze command has invalid format", () => {
    expect(parseCliArgs(["analyze", ".", "--format", "xml"])).toEqual({
      type: "error",
      message: "Invalid report format: xml. Supported formats are csv and json.",
    });
  });
});

describe("runCli", () => {
  const spyStdout = jest.spyOn(process.stdout, "write").mockImplementation(() => true);
  const spyStderr = jest.spyOn(process.stderr, "write").mockImplementation(() => true);

  beforeEach(() => {
    spyStdout.mockClear();
    spyStderr.mockClear();
    mockFsWriteFile.mockClear();
    mockFsStat.mockClear();
    mockFsReadFile.mockClear();
  });

  afterAll(() => {
    spyStdout.mockRestore();
    spyStderr.mockRestore();
  });

  it("should run analyze command and output JSON to stdout", async () => {
    const exitCode = await runCli(["analyze", mockFilePath, "--format", "json"]);

    expect(exitCode).toBe(0);
    expect(spyStdout).toHaveBeenCalledTimes(1);
    expect(spyStdout.mock.calls[0]).toBeDefined();
    const output = spyStdout.mock.calls[0]![0];
    expect(output).toBeDefined();
    const parsedOutput = JSON.parse(output as string);
    expect(parsedOutput).toBeInstanceOf(Array);
    expect(parsedOutput.length).toBeGreaterThan(0);
    expect(parsedOutput[0]).toHaveProperty("smellType", "AnonymousTestLogic");
    expect(mockFsWriteFile).not.toHaveBeenCalled();
  });

  it("should run analyze command and output CSV to a file", async () => {
    const outputPath = "./test-report.csv";
    const exitCode = await runCli([
      "analyze",
      mockFilePath,
      "--format",
      "csv",
      "--output",
      outputPath,
    ]);

    expect(exitCode).toBe(0);
    expect(spyStdout).toHaveBeenCalledWith(`Report successfully written to ${outputPath}\n`);
    expect(mockFsWriteFile).toHaveBeenCalledTimes(1);
    expect(mockFsWriteFile).toHaveBeenCalledWith(outputPath, expect.any(String), "utf8");
    expect(mockFsWriteFile.mock.calls[0]).toBeDefined();
    const writtenContent = mockFsWriteFile.mock.calls[0]![1];
    expect(writtenContent).toBeDefined();
    expect(writtenContent as string).toContain(
      "Smell Type,File Path,Start Line,End Line,Message,Description",
    );
    expect(writtenContent as string).toContain(
      `"AnonymousTestLogic","${mockFilePath}",1,2,"AnonymousTestLogic","Test has anonymous logic"`,
    );
  });
});
