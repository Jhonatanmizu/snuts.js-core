import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";
import chokidar from "chokidar";
import { glob } from "glob";
import * as t from "@babel/types";

import { Watcher } from "./watcher";
import { Detector, Smell } from "./detector.interface";
import { DetectorRunner } from "./detector-runner";

import { TEST_FILE_PATTERNS } from "@/shared/constants";
import { logger } from "@/shared/logger";

jest.mock("chokidar", () => ({
  __esModule: true,
  default: {
    watch: jest.fn(() => ({
      on: jest.fn(),
    })),
  },
}));

jest.mock("glob", () => ({
  __esModule: true,
  glob: jest.fn<(pattern: string | string[], options?: any) => Promise<string[]>>(),
}));

jest.mock("./detector-runner", () => ({
  __esModule: true,
  DetectorRunner: jest.fn(() => ({
    run: jest.fn(),
  })),
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

describe("Watcher", () => {
  const mockDetector: Detector = {
    detect: jest.fn<(ast: t.File, sourceCode: string, file: string) => Promise<Smell[]>>(),
  };
  const mockPaths = [process.cwd()];

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    (glob as jest.MockedFunction<typeof glob>).mockResolvedValue([]);
    (DetectorRunner as jest.Mock).mockClear();
    (chokidar.watch as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should initialize DetectorRunner with provided detectors", () => {
    new Watcher({
      paths: mockPaths,
      detectors: [mockDetector],
    });
    expect(DetectorRunner).toHaveBeenCalledWith([mockDetector]);
  });

  it("should find initial files and run detections", async () => {
    const mockFiles = ["file1.ts", "file2.ts"];
    (glob as jest.MockedFunction<typeof glob>).mockResolvedValueOnce(mockFiles);

    const mockRun = jest.fn<() => Promise<Smell[]>>().mockResolvedValue([]);
    (DetectorRunner as jest.Mock).mockImplementation(() => ({
      run: mockRun,
    }));

    const watcher = new Watcher({
      paths: mockPaths,
      detectors: [mockDetector],
    });
    await watcher.watch();

    expect(glob).toHaveBeenCalledTimes(TEST_FILE_PATTERNS.length);
    expect(mockRun).toHaveBeenCalledTimes(mockFiles.length);
    expect(mockRun).toHaveBeenCalledWith(mockFiles[0]);
    expect(mockRun).toHaveBeenCalledWith(mockFiles[1]);
  });

  it("should start watching for file changes", async () => {
    const mockOn = jest.fn();
    (chokidar.watch as jest.Mock).mockReturnValue({
      on: mockOn,
    });

    const watcher = new Watcher({
      paths: mockPaths,
      detectors: [mockDetector],
    });
    await watcher.watch();

    expect(chokidar.watch).toHaveBeenCalledWith(mockPaths, {
      persistent: true,
      ignoreInitial: true,
      ignored: ["**/node_modules/**", "**/dist/**"],
    });
    expect(mockOn).toHaveBeenCalledWith("add", expect.any(Function));
    expect(mockOn).toHaveBeenCalledWith("change", expect.any(Function));
  });

  it("should run detections when a file is added", async () => {
    const mockOn = jest.fn();
    const mockRun = jest.fn<() => Promise<Smell[]>>().mockResolvedValue([]);

    (chokidar.watch as jest.Mock).mockReturnValue({
      on: mockOn,
    });
    (DetectorRunner as jest.Mock).mockImplementation(() => ({
      run: mockRun,
    }));

    const watcher = new Watcher({
      paths: mockPaths,
      detectors: [mockDetector],
    });
    await watcher.watch();

    const addCallback = mockOn.mock.calls.find((call) => call[0] === "add")![1] as Function;
    const newFile = "new-file.ts";
    addCallback(newFile);

    jest.runAllTimers();

    expect(mockRun).toHaveBeenCalledWith(newFile);
  });

  it("should run detections when a file is changed", async () => {
    const mockOn = jest.fn();
    const mockRun = jest.fn<() => Promise<Smell[]>>().mockResolvedValue([]);

    (chokidar.watch as jest.Mock).mockReturnValue({
      on: mockOn,
    });
    (DetectorRunner as jest.Mock).mockImplementation(() => ({
      run: mockRun,
    }));

    const watcher = new Watcher({
      paths: mockPaths,
      detectors: [mockDetector],
    });
    await watcher.watch();

    const changeCallback = mockOn.mock.calls.find((call) => call[0] === "change")![1] as Function;
    const changedFile = "changed-file.ts";
    changeCallback(changedFile);

    jest.runAllTimers();

    expect(mockRun).toHaveBeenCalledWith(changedFile);
  });

  it("should log smells if detected", async () => {
    const mockSmell: Smell = {
      file: "smelly.ts",
      start: { line: 1, column: 0 },
      end: { line: 1, column: 10 },
      message: "Smell detected",
      codeBlock: "if (true) {}",
    };
    const mockRun = jest.fn<() => Promise<Smell[]>>().mockResolvedValue([mockSmell]);
    (DetectorRunner as jest.Mock).mockImplementation(() => ({
      run: mockRun,
    }));

    const mockOn = jest.fn();
    (chokidar.watch as jest.Mock).mockReturnValue({
      on: mockOn,
    });

    const watcher = new Watcher({
      paths: mockPaths,
      detectors: [mockDetector],
    });
    await watcher.watch();

    const changeCallback = mockOn.mock.calls.find((call) => call[0] === "change")![1] as Function;
    const changedFile = "changed-file.ts";
    changeCallback(changedFile);

    jest.runAllTimers();

    expect(logger.info).toHaveBeenCalledWith("👀 Watching for file changes...");
  });

  it("should not log anything if no smells are detected", async () => {
    const mockRun = jest.fn<() => Promise<Smell[]>>().mockResolvedValue([]);
    (DetectorRunner as jest.Mock).mockImplementation(() => ({
      run: mockRun,
    }));

    const mockOn = jest.fn();
    (chokidar.watch as jest.Mock).mockReturnValue({
      on: mockOn,
    });

    const watcher = new Watcher({
      paths: mockPaths,
      detectors: [mockDetector],
    });
    await watcher.watch();

    const changeCallback = mockOn.mock.calls.find((call) => call[0] === "change")![1] as Function;
    const changedFile = "changed-file.ts";
    changeCallback(changedFile);

    jest.runAllTimers();

    expect(logger.info).toHaveBeenCalledWith("👀 Watching for file changes...");
  });
});
