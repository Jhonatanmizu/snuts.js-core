import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import chokidar from "chokidar";
import { glob } from "glob";

import { Watcher } from "./watcher";
import { Detector } from "./detector.interface";
import { DetectorRunner } from "./detector-runner";

import { TEST_FILE_PATTERNS } from "@/shared/constants";

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

describe("Watcher", () => {
  const mockDetector: Detector = {
    detect: vi.fn(),
  };
  const mockPaths = TEST_FILE_PATTERNS;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock implementations for each test
    (glob as vi.Mock).mockResolvedValue([]);
    (DetectorRunner as vi.Mock).mockClear();
    (chokidar.watch as vi.Mock).mockClear();

    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
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
    (glob as vi.Mock).mockImplementation((pattern, options) => {
      if (TEST_FILE_PATTERNS.includes(pattern)) {
        return Promise.resolve(mockFiles);
      }
      return Promise.resolve([]);
    });

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
    expect(mockRun).toHaveBeenCalledTimes(mockFiles.length * TEST_FILE_PATTERNS.length);
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
      ignored: ["node_modules/**", "**/node_modules/**"],
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
    await addCallback(newFile);

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
    await changeCallback(changedFile);

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
    await changeCallback(changedFile);

    expect(consoleSpy).toHaveBeenCalledWith("Watching for file changes...");
    expect(consoleSpy).toHaveBeenCalledWith("----------------------------------------");
    expect(consoleSpy).toHaveBeenCalledWith(`File: ${mockSmell.file}`);
    expect(consoleSpy).toHaveBeenCalledWith(
      `Location: ${mockSmell.start.line}:${mockSmell.start.column}`,
    );
    expect(consoleSpy).toHaveBeenCalledWith(`Smell: ${mockSmell.message}`);
    expect(consoleSpy).toHaveBeenCalledWith(`Code: \n${mockSmell.codeBlock}`);
    expect(consoleSpy).toHaveBeenCalledWith("----------------------------------------");
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
    await changeCallback(changedFile);

    expect(consoleSpy).toHaveBeenCalledWith("Watching for file changes...");
    expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining("Smell:"));
  });
});
