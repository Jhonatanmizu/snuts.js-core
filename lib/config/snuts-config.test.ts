import fs from "node:fs";

import { loadSnutsConfig } from "./snuts-config";

import { setLogger, silentLogger } from "@/shared/logger";

beforeAll(() => {
  setLogger(silentLogger);
});

afterAll(() => {
  setLogger(silentLogger);
});

describe("loadSnutsConfig", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns a typed SnutsConfig when the file contains valid JSON", () => {
    const config = {
      thresholds: {
        VerboseTest: { maxStatements: 20 },
        ComplexSnapshotTest: { maxLines: 30 },
      },
    };

    jest.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify(config));

    const result = loadSnutsConfig("/some/path/snuts.config.json");

    expect(result).toEqual(config);
    expect(result.thresholds?.["VerboseTest"]).toEqual({ maxStatements: 20 });
    expect(result.thresholds?.["ComplexSnapshotTest"]).toEqual({ maxLines: 30 });
  });

  it("returns an empty SnutsConfig when the file contains an empty JSON object", () => {
    jest.spyOn(fs, "readFileSync").mockReturnValue("{}");

    const result = loadSnutsConfig("/some/path/snuts.config.json");

    expect(result).toEqual({});
    expect(result.thresholds).toBeUndefined();
  });

  it("returns a SnutsConfig with no thresholds when the field is absent", () => {
    jest.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify({ thresholds: undefined }));

    const result = loadSnutsConfig("/some/path/snuts.config.json");

    expect(result.thresholds).toBeUndefined();
  });

  it("throws a descriptive error when the file does not exist", () => {
    const configPath = "/nonexistent/snuts.config.json";
    const fsError = new Error("ENOENT: no such file or directory");

    jest.spyOn(fs, "readFileSync").mockImplementation(() => {
      throw fsError;
    });

    expect(() => loadSnutsConfig(configPath)).toThrow(
      `Failed to read config file at "${configPath}"`,
    );
  });

  it("includes the original error message in the thrown error for missing file", () => {
    const configPath = "/nonexistent/snuts.config.json";
    const originalMessage =
      "ENOENT: no such file or directory, open '/nonexistent/snuts.config.json'";

    jest.spyOn(fs, "readFileSync").mockImplementation(() => {
      throw new Error(originalMessage);
    });

    expect(() => loadSnutsConfig(configPath)).toThrow(originalMessage);
  });

  it("includes the config path in the thrown error for missing file", () => {
    const configPath = "/some/specific/path/snuts.config.json";

    jest.spyOn(fs, "readFileSync").mockImplementation(() => {
      throw new Error("ENOENT");
    });

    let thrownError: Error | undefined;
    try {
      loadSnutsConfig(configPath);
    } catch (err) {
      thrownError = err as Error;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError?.message).toContain(configPath);
  });

  it("throws a descriptive error when the file contains invalid JSON", () => {
    const configPath = "/some/path/snuts.config.json";

    jest.spyOn(fs, "readFileSync").mockReturnValue("{ not valid json }");

    expect(() => loadSnutsConfig(configPath)).toThrow(
      `Failed to parse config file at "${configPath}" as JSON`,
    );
  });

  it("includes the config path in the thrown error for invalid JSON", () => {
    const configPath = "/some/path/snuts.config.json";

    jest.spyOn(fs, "readFileSync").mockReturnValue("not-json-at-all");

    let thrownError: Error | undefined;
    try {
      loadSnutsConfig(configPath);
    } catch (err) {
      thrownError = err as Error;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError?.message).toContain(configPath);
    expect(thrownError?.message).toContain("JSON");
  });

  it("includes the JSON parse error detail in the thrown error", () => {
    const configPath = "/some/path/snuts.config.json";

    jest.spyOn(fs, "readFileSync").mockReturnValue("{bad json");

    expect(() => loadSnutsConfig(configPath)).toThrow(/Failed to parse config file/);
  });

  it("does not throw when thresholds contain an unknown smell key", () => {
    const config = {
      thresholds: {
        UnknownSmellKey: { someThreshold: 42 },
      },
    };

    jest.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify(config));

    expect(() => loadSnutsConfig("/some/path/snuts.config.json")).not.toThrow();
  });

  it("logs a warning for each unknown smell key in thresholds", () => {
    const warnMock = jest.fn();
    setLogger({
      debug: () => {},
      info: () => {},
      warn: warnMock,
      error: () => {},
    });

    const config = {
      thresholds: {
        UnknownSmellA: { threshold: 10 },
        UnknownSmellB: { threshold: 20 },
      },
    };

    jest.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify(config));

    loadSnutsConfig("/some/path/snuts.config.json");

    expect(warnMock).toHaveBeenCalledTimes(2);

    // Restore silent logger after this test
    setLogger(silentLogger);
  });

  it("includes the unknown key name in the warning message", () => {
    const warnMock = jest.fn();
    setLogger({
      debug: () => {},
      info: () => {},
      warn: warnMock,
      error: () => {},
    });

    const unknownKey = "TotallyMadeUpSmell";
    const config = {
      thresholds: {
        [unknownKey]: { someValue: 99 },
      },
    };

    jest.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify(config));

    loadSnutsConfig("/some/path/snuts.config.json");

    const warnCall = warnMock.mock.calls[0];
    // The logger.warn is called with (obj, msg) — check either the obj or the message
    const callArgs = warnCall.flat().join(" ");
    expect(callArgs).toContain(unknownKey);

    setLogger(silentLogger);
  });

  it("does not warn for known smell keys in thresholds", () => {
    const warnMock = jest.fn();
    setLogger({
      debug: () => {},
      info: () => {},
      warn: warnMock,
      error: () => {},
    });

    const config = {
      thresholds: {
        VerboseTest: { maxStatements: 15 },
        OnlyTest: { someThreshold: 1 },
      },
    };

    jest.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify(config));

    loadSnutsConfig("/some/path/snuts.config.json");

    expect(warnMock).not.toHaveBeenCalled();

    setLogger(silentLogger);
  });

  it("returns the full config even when some keys are unknown", () => {
    const config = {
      thresholds: {
        VerboseTest: { maxStatements: 25 },
        UnknownKey: { someValue: 5 },
      },
    };

    jest.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify(config));

    const result = loadSnutsConfig("/some/path/snuts.config.json");

    expect(result.thresholds?.["VerboseTest"]).toEqual({ maxStatements: 25 });
    expect(result.thresholds?.["UnknownKey"]).toEqual({ someValue: 5 });
  });
});
