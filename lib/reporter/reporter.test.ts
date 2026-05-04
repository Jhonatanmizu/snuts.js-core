import path from "node:path";

import { ProjectAnalyzer } from "./project-analyzer";
import { CsvReportGenerator } from "./csv-report-generator";
import { JsonReportGenerator } from "./json-report-generator";

import { AnonymousTestLogicDetector } from "@/detectors/anonymousTestLogic";

const mockFilePath = path.resolve(__dirname, "..", "test", "mock-test-file.test.ts");

describe("ProjectAnalyzer", () => {
  it("should analyze a project and return smells", async () => {
    const detector = new AnonymousTestLogicDetector();
    const analyzer = new ProjectAnalyzer([detector]);
    const smells = await analyzer.analyze([mockFilePath]);

    expect(smells).toBeInstanceOf(Array);
    expect(smells.length).toBeGreaterThan(0);
    expect(smells[0]).toHaveProperty("file", mockFilePath);
  });

  it("should handle non-existent paths gracefully", async () => {
    const detector = new AnonymousTestLogicDetector();
    const analyzer = new ProjectAnalyzer([detector]);
    const smells = await analyzer.analyze(["./non-existent-path"]);

    expect(smells).toEqual([]);
  });
});

describe("CsvReportGenerator", () => {
  it("should generate a CSV report", () => {
    const smells = [
      {
        file: mockFilePath,
        start: { line: 1, column: 0 },
        end: { line: 2, column: 0 },
        message: "AnonymousTestLogic",
        codeBlock: "",
        description: "Test has anonymous logic",
        explanation: "",
      },
    ];
    const generator = new CsvReportGenerator();
    const report = generator.generate(smells);

    expect(report).toContain("Smell Type,File Path,Start Line,End Line,Message,Description");
    expect(report).toContain(
      `"AnonymousTestLogic","${mockFilePath}",1,2,"AnonymousTestLogic","Test has anonymous logic"`,
    );
  });
});

describe("JsonReportGenerator", () => {
  it("should generate a JSON report", () => {
    const smells = [
      {
        file: mockFilePath,
        start: { line: 1, column: 0 },
        end: { line: 2, column: 0 },
        message: "AnonymousTestLogic",
        codeBlock: "",
        description: "Test has anonymous logic",
        explanation: "",
      },
    ];
    const generator = new JsonReportGenerator();
    const report = generator.generate(smells);
    const parsedReport = JSON.parse(report);

    expect(parsedReport).toBeInstanceOf(Array);
    expect(parsedReport.length).toBe(1);
    expect(parsedReport[0]).toHaveProperty("filePath", mockFilePath);
    expect(parsedReport[0]).toHaveProperty("smellType", "AnonymousTestLogic");
  });
});
