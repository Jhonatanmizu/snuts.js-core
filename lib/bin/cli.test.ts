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
      return { isDirectory: () => false };
    }
    if (filePath.endsWith(path.sep) || !path.extname(filePath)) {
      return { isDirectory: () => true };
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

jest.mock("@/detectors", () => {
  const actual = jest.requireActual("@/detectors") as Record<string, unknown>;
  return {
    ...actual,
    AnonymousTestLogicDetector: jest.fn(() => ({
      detect: jest.fn(async (ast: unknown, sourceCode: unknown, file: string) => {
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
  };
});

const mockFilePath = path.resolve(__dirname, "..", "test", "mock-test-file.test.ts");

const mockRefactorFile = jest.fn(async () => ({
  file: mockFilePath,
  apply: false,
  summary: "Refactor summary",
  smells: [],
  patch: { summary: "Refactor summary", edits: [] },
  diagnostics: {
    smellsDetected: 0,
    smellsUsedInPrompt: 0,
    provider: "openai",
    model: "gpt-4.1-mini",
  },
  updatedContent: "const x = 1;",
}));

jest.mock("@/ai", () => ({
  resolveAIConfig: jest.fn((input: { provider: string; model?: string; apiKey?: string }) => ({
    provider: input.provider,
    model: input.model ?? "gpt-4.1-mini",
    apiKey: input.apiKey ?? "test-key",
    temperature: 0.1,
    maxTokens: 1400,
  })),
  LangChainProviderRegistry: jest.fn(),
  RefactorService: jest.fn(() => ({
    refactorFile: mockRefactorFile,
  })),
}));

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
      config: undefined,
      watch: undefined,
      smells: undefined,
    });
  });

  it("parses analyze command with csv format to file", () => {
    expect(parseCliArgs(["analyze", "src", "--format", "csv", "--output", "report.csv"])).toEqual({
      type: "analyze",
      paths: ["src"],
      format: "csv",
      output: "report.csv",
      config: undefined,
      watch: undefined,
      smells: undefined,
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

  it("parses analyze command with --config flag", () => {
    expect(
      parseCliArgs(["analyze", ".", "--format", "json", "--config", "snuts.config.json"]),
    ).toEqual({
      type: "analyze",
      paths: ["."],
      format: "json",
      output: undefined,
      config: "snuts.config.json",
      watch: undefined,
      smells: undefined,
    });
  });

  it("returns an error if --config is missing its value", () => {
    expect(parseCliArgs(["analyze", ".", "--format", "json", "--config"])).toEqual({
      type: "error",
      message: "Missing value for --config.",
    });
  });

  it("parses --watch flag on analyze command", () => {
    expect(parseCliArgs(["analyze", ".", "--format", "json", "--watch"])).toEqual({
      type: "analyze",
      paths: ["."],
      format: "json",
      output: undefined,
      config: undefined,
      watch: true,
      smells: undefined,
    });
  });

  it("parses single --smell flag on analyze command", () => {
    expect(parseCliArgs(["analyze", ".", "--format", "json", "--smell", "OnlyTest"])).toEqual({
      type: "analyze",
      paths: ["."],
      format: "json",
      output: undefined,
      config: undefined,
      watch: undefined,
      smells: ["OnlyTest"],
    });
  });

  it("parses multiple --smell flags on analyze command", () => {
    expect(
      parseCliArgs([
        "analyze",
        ".",
        "--format",
        "json",
        "--smell",
        "OnlyTest",
        "--smell",
        "VerboseTest",
      ]),
    ).toEqual({
      type: "analyze",
      paths: ["."],
      format: "json",
      output: undefined,
      config: undefined,
      watch: undefined,
      smells: ["OnlyTest", "VerboseTest"],
    });
  });

  it("returns an error if --smell is missing its value", () => {
    expect(parseCliArgs(["analyze", ".", "--format", "json", "--smell"])).toEqual({
      type: "error",
      message: "Missing value for --smell.",
    });
  });

  it("parses refactor command in preview mode", () => {
    expect(parseCliArgs(["refactor", "src/sample.test.ts", "--provider", "openai"])).toEqual({
      type: "refactor",
      file: "src/sample.test.ts",
      provider: "openai",
      model: undefined,
      apiKey: undefined,
      apply: false,
      output: undefined,
      format: "text",
      smellDescriptionFilter: undefined,
      temperature: undefined,
      maxTokens: undefined,
    });
  });

  it("parses refactor command in apply mode with json output", () => {
    expect(
      parseCliArgs([
        "refactor",
        "src/sample.test.ts",
        "--provider",
        "google",
        "--model",
        "gemini-2.0-flash",
        "--format",
        "json",
        "--apply",
      ]),
    ).toEqual({
      type: "refactor",
      file: "src/sample.test.ts",
      provider: "google",
      model: "gemini-2.0-flash",
      apiKey: undefined,
      apply: true,
      output: undefined,
      format: "json",
      smellDescriptionFilter: undefined,
      temperature: undefined,
      maxTokens: undefined,
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
    mockRefactorFile.mockClear();
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

  it("should run refactor command and output result to stdout", async () => {
    const exitCode = await runCli(["refactor", mockFilePath, "--provider", "openai"]);

    expect(exitCode).toBe(0);
    expect(mockRefactorFile).toHaveBeenCalledTimes(1);
    expect(spyStdout).toHaveBeenCalled();
    const output = spyStdout.mock.calls.at(-1)?.[0] as string;
    expect(output).toContain("--- a/");
    expect(output).toContain("+++ b/");
  });
});
