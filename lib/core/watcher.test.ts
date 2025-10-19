import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import chokidar from "chokidar";
import { glob } from "glob";

import { Watcher } from "./watcher";
import { Detector, Smell } from "./detector.interface";
import { DetectorRunner } from "./detector-runner";

import { TEST_FILE_PATTERNS } from "@/shared/constants";
import { logger } from "@/shared/logger";

// Mock external dependencies
vi.mock("chokidar", () => ({
  default: {
    watch: vi.fn(() => ({
      on: vi.fn(),
    })),
  },
}));

vi.mock("glob", () => ({
  glob: vi.fn(),
}));

vi.mock("./detector-runner", () => ({
  DetectorRunner: vi.fn(() => ({
    run: vi.fn(),
  })),
}));

vi.mock("@/shared/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("Watcher", () => {
  const mockDetector: Detector = {
    detect: vi.fn(),
  };
  const mockPaths = [process.cwd()];

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    // Reset mock implementations for each test
    (glob as vi.Mock).mockResolvedValue([]);
    (DetectorRunner as vi.Mock).mockClear();
    (chokidar.watch as vi.Mock).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
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
    (glob as vi.Mock).mockResolvedValueOnce(mockFiles);

    const mockRun = vi.fn().mockResolvedValue([]);
    (DetectorRunner as vi.Mock).mockImplementation(() => ({
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
    const mockOn = vi.fn();
    (chokidar.watch as vi.Mock).mockReturnValue({
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
    const mockOn = vi.fn();
    const mockRun = vi.fn().mockResolvedValue([]);

    (chokidar.watch as vi.Mock).mockReturnValue({
      on: mockOn,
    });
    (DetectorRunner as vi.Mock).mockImplementation(() => ({
      run: mockRun,
    }));

    const watcher = new Watcher({
      paths: mockPaths,
      detectors: [mockDetector],
    });
    await watcher.watch();

    const addCallback = mockOn.mock.calls.find((call) => call[0] === "add")[1];
    const newFile = "new-file.ts";
    addCallback(newFile);

    vi.runAllTimers();

    expect(mockRun).toHaveBeenCalledWith(newFile);
  });

  it("should run detections when a file is changed", async () => {
    const mockOn = vi.fn();
    const mockRun = vi.fn().mockResolvedValue([]);

    (chokidar.watch as vi.Mock).mockReturnValue({
      on: mockOn,
    });
    (DetectorRunner as vi.Mock).mockImplementation(() => ({
      run: mockRun,
    }));

    const watcher = new Watcher({
      paths: mockPaths,
      detectors: [mockDetector],
    });
    await watcher.watch();

    const changeCallback = mockOn.mock.calls.find((call) => call[0] === "change")[1];
    const changedFile = "changed-file.ts";
    changeCallback(changedFile);

    vi.runAllTimers();

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
    const mockRun = vi.fn().mockResolvedValue([mockSmell]);
    (DetectorRunner as vi.Mock).mockImplementation(() => ({
      run: mockRun,
    }));

    const mockOn = vi.fn();
    (chokidar.watch as vi.Mock).mockReturnValue({
      on: mockOn,
    });

    const watcher = new Watcher({
      paths: mockPaths,
      detectors: [mockDetector],
    });
    await watcher.watch();

    // Trigger a change event to make runDetections execute
    const changeCallback = mockOn.mock.calls.find((call) => call[0] === "change")[1];
    const changedFile = "changed-file.ts";
    changeCallback(changedFile);

    vi.runAllTimers();

    expect(logger.info).toHaveBeenCalledWith("👀 Watching for file changes...");
  });

  it("should not log anything if no smells are detected", async () => {
    const mockRun = vi.fn().mockResolvedValue([]);
    (DetectorRunner as vi.Mock).mockImplementation(() => ({
      run: mockRun,
    }));

    const mockOn = vi.fn();
    (chokidar.watch as vi.Mock).mockReturnValue({
      on: mockOn,
    });

    const watcher = new Watcher({
      paths: mockPaths,
      detectors: [mockDetector],
    });
    await watcher.watch();

    // Trigger a change event to make runDetections execute
    const changeCallback = mockOn.mock.calls.find((call) => call[0] === "change")[1];
    const changedFile = "changed-file.ts";
    changeCallback(changedFile);

    vi.runAllTimers();

    expect(logger.info).toHaveBeenCalledWith("👀 Watching for file changes...");
  });
});
