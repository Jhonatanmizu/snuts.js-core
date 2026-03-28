import { parseCliArgs } from "./cli-args";

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
});
