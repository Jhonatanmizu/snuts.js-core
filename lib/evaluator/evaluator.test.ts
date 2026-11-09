import {
  MetricsEvaluator,
  computeRates,
  formatEvaluationConsole,
  formatEvaluationCsv,
  formatEvaluationJson,
  normalizeOracleInput,
  normalizeSmellType,
  normalizeToolInput,
  pathsMatch,
} from "./index";

describe("Normalizer", () => {
  it("normalizes canonical names, prompt legacy names, short codes, and human descriptions", () => {
    expect(normalizeSmellType("AnonymousTest")).toBe("AnonymousTest");
    expect(normalizeSmellType("AT")).toBe("AnonymousTest");
    expect(normalizeSmellType("Anonymous Test")).toBe("AnonymousTest");
    expect(normalizeSmellType("AnonymousTestLogic")).toBe("AnonymousTest");

    expect(normalizeSmellType("Overcommented")).toBe("OvercommentedTest");
    expect(normalizeSmellType("OvercommentedTest")).toBe("OvercommentedTest");
    expect(normalizeSmellType("OT")).toBe("OvercommentedTest");
    expect(normalizeSmellType("Overcommented Test")).toBe("OvercommentedTest");

    expect(normalizeSmellType("GF")).toBe("GeneralFixture");
    expect(normalizeSmellType("SE")).toBe("SensitiveEquality");
    expect(normalizeSmellType("TWD")).toBe("TestWithoutDescription");
    expect(normalizeSmellType("COT")).toBe("CommentsOnlyTest");
    expect(normalizeSmellType("Comments-Only Test")).toBe("CommentsOnlyTest");
    expect(normalizeSmellType("TT")).toBe("TranscriptingTest");
  });

  it("matches relative and absolute POSIX/Windows file paths", () => {
    expect(
      pathsMatch(
        "/Users/dev/work/chartjs/Chart/test/specs/scale.logarithmic.tests.js",
        "chartjs/Chart/test/specs/scale.logarithmic.tests.js",
      ),
    ).toBe(true);
    expect(
      pathsMatch(
        "./chartjs/Chart/test/specs/scale.logarithmic.tests.js",
        "chartjs\\Chart\\test\\specs\\scale.logarithmic.tests.js",
      ),
    ).toBe(true);
    expect(
      pathsMatch(
        "chartjs/Chart/test/specs/scale.linear.tests.js",
        "chartjs/Chart/test/specs/scale.logarithmic.tests.js",
      ),
    ).toBe(false);
  });

  it("normalizes both grouped SNUTS.js API output and flat ReportEntry output", () => {
    const groupedApiOutput = [
      {
        file: "chartjs/Chart/test/specs/scale.logarithmic.tests.js",
        type: "AnonymousTest",
        smells: [
          { startLine: 8, endLine: 12 },
          { startLine: 20, endLine: 25 },
        ],
        info: {
          itCount: 27,
          describeCount: 8,
        },
      },
    ];

    const flatReportEntries = [
      {
        smellType: "Overcommented test detected",
        filePath: "./chartjs/Chart/test/specs/scale.logarithmic.tests.js",
        startLine: 30,
        endLine: 45,
        message: "Overcommented test detected",
        description: "Overcommented Test",
        severity: "low",
      },
    ];

    const normalizedGrouped = normalizeToolInput(groupedApiOutput);
    expect(normalizedGrouped).toEqual([
      {
        file: "chartjs/Chart/test/specs/scale.logarithmic.tests.js",
        type: "AnonymousTest",
        startLine: 8,
        endLine: 12,
      },
      {
        file: "chartjs/Chart/test/specs/scale.logarithmic.tests.js",
        type: "AnonymousTest",
        startLine: 20,
        endLine: 25,
      },
    ]);

    const normalizedFlat = normalizeToolInput(flatReportEntries);
    expect(normalizedFlat).toEqual([
      {
        file: "chartjs/Chart/test/specs/scale.logarithmic.tests.js",
        type: "OvercommentedTest",
        startLine: 30,
        endLine: 45,
      },
    ]);
  });

  it("normalizes oracle schema and preserves empty oracle files", () => {
    const oracleData = [
      {
        file: "chartjs/Chart/test/specs/scale.logarithmic.tests.js",
        smells: [
          { type: "AnonymousTest", startLine: 8, endLine: 12 },
          { type: "Overcommented", startLine: 30, endLine: 45 },
        ],
      },
      {
        file: "chartjs/Chart/test/specs/clean.tests.js",
        smells: [],
      },
    ];

    const normalized = normalizeOracleInput(oracleData);
    expect(normalized.oracleFiles.size).toBe(2);
    expect(normalized.instances).toHaveLength(2);
    expect(normalized.instances[1]?.type).toBe("OvercommentedTest");
  });
});

describe("computeRates", () => {
  it("returns 1.0 precision, recall, and f1Score with hasActivity=false when TP=0, FP=0, FN=0", () => {
    expect(computeRates(0, 0, 0)).toEqual({
      precision: 1.0,
      recall: 1.0,
      f1Score: 1.0,
      hasActivity: false,
    });
  });

  it("returns 0.0 precision and 0.0 F1 when TP=0, FP=0, FN>0", () => {
    const res = computeRates(0, 0, 3);
    expect(res.precision).toBe(0.0);
    expect(res.recall).toBe(0.0);
    expect(res.f1Score).toBe(0.0);
    expect(res.hasActivity).toBe(true);
  });

  it("returns 0.0 precision and 1.0 recall when TP=0, FP>0, FN=0", () => {
    const res = computeRates(0, 2, 0);
    expect(res.precision).toBe(0.0);
    expect(res.recall).toBe(1.0);
    expect(res.f1Score).toBe(0.0);
    expect(res.hasActivity).toBe(true);
  });
});

describe("MetricsEvaluator", () => {
  const evaluator = new MetricsEvaluator();

  it("evaluates class-level presence accurately (TP, FP, FN)", () => {
    const oracle = [
      {
        file: "test/a.spec.js",
        smells: [
          { type: "AnonymousTest", startLine: 10, endLine: 15 },
          { type: "AnonymousTest", startLine: 30, endLine: 35 },
          { type: "GeneralFixture", startLine: 2, endLine: 6 },
        ],
      },
      {
        file: "test/b.spec.js",
        smells: [{ type: "SensitiveEquality", startLine: 12, endLine: 14 }],
      },
    ];

    const tool = [
      {
        file: "test/a.spec.js",
        type: "AnonymousTest",
        smells: [{ startLine: 99, endLine: 105 }], // Different line, still class-level TP!
      },
      {
        file: "test/b.spec.js",
        type: "AnonymousTest",
        smells: [{ startLine: 5, endLine: 8 }], // Class-level FP in b.spec.js
      },
    ];

    const report = evaluator.evaluate(tool, oracle, {
      granularity: "class",
      smellTypes: ["AnonymousTest", "GeneralFixture", "SensitiveEquality"],
    });

    const at = report.perSmell.find((s) => s.type === "AnonymousTest")!;
    const gf = report.perSmell.find((s) => s.type === "GeneralFixture")!;
    const se = report.perSmell.find((s) => s.type === "SensitiveEquality")!;

    expect(at).toMatchObject({ tp: 1, fp: 1, fn: 0, precision: 0.5, recall: 1.0 });
    expect(gf).toMatchObject({ tp: 0, fp: 0, fn: 1, precision: 0.0, recall: 0.0, f1Score: 0.0 });
    expect(se).toMatchObject({ tp: 0, fp: 0, fn: 1, precision: 0.0, recall: 0.0, f1Score: 0.0 });
    expect(report.overall).toMatchObject({ tp: 1, fp: 1, fn: 2, precision: 0.5, recall: 1 / 3 });
  });

  it("evaluates fine-grained line matching with tolerance and 1-to-1 assignment", () => {
    const oracle = [
      {
        file: "chartjs/Chart/test/specs/scale.logarithmic.tests.js",
        smells: [
          { type: "AnonymousTest", startLine: 8, endLine: 12 },
          { type: "GeneralFixture", startLine: 8, endLine: 12 },
        ],
      },
    ];

    const tool = [
      {
        file: "/workspace/chartjs/Chart/test/specs/scale.logarithmic.tests.js",
        type: "AnonymousTest",
        smells: [
          { startLine: 9, endLine: 12 }, // within ±1 tolerance of 8
          { startLine: 9, endLine: 12 }, // duplicate detection on same line -> should be 1 FP
        ],
      },
      {
        file: "chartjs/Chart/test/specs/scale.logarithmic.tests.js",
        type: "GeneralFixture",
        smells: [{ startLine: 8, endLine: 12 }],
      },
    ];

    const report = evaluator.evaluate(tool, oracle, {
      granularity: "fine-grained",
      lineTolerance: 1,
      smellTypes: ["AnonymousTest", "GeneralFixture"],
    });

    const at = report.perSmell.find((s) => s.type === "AnonymousTest")!;
    const gf = report.perSmell.find((s) => s.type === "GeneralFixture")!;

    expect(at).toMatchObject({ tp: 1, fp: 1, fn: 0, precision: 0.5, recall: 1.0 });
    expect(gf).toMatchObject({ tp: 1, fp: 0, fn: 0, precision: 1.0, recall: 1.0, f1Score: 1.0 });
  });

  it("handles edge case: file present in tool output but missing in oracle", () => {
    const oracle = [
      {
        file: "src/known.test.js",
        smells: [{ type: "AnonymousTest", startLine: 10, endLine: 14 }],
      },
    ];

    const tool = [
      {
        file: "src/known.test.js",
        type: "AnonymousTest",
        smells: [{ startLine: 10, endLine: 14 }],
      },
      {
        file: "src/untracked.test.js",
        type: "AnonymousTest",
        smells: [{ startLine: 5, endLine: 9 }],
      },
    ];

    // Default: untracked file counts as FP
    const defaultReport = evaluator.evaluate(tool, oracle, {
      smellTypes: ["AnonymousTest"],
    });
    expect(defaultReport.evaluatedFilesCount).toBe(2);
    expect(defaultReport.overall).toMatchObject({
      tp: 1,
      fp: 1,
      fn: 0,
      precision: 0.5,
      recall: 1.0,
    });

    // With onlyOracleFiles: untracked file is ignored
    const scopedReport = evaluator.evaluate(tool, oracle, {
      onlyOracleFiles: true,
      smellTypes: ["AnonymousTest"],
    });
    expect(scopedReport.evaluatedFilesCount).toBe(1);
    expect(scopedReport.overall).toMatchObject({
      tp: 1,
      fp: 0,
      fn: 0,
      precision: 1.0,
      recall: 1.0,
      f1Score: 1.0,
    });
  });

  it("handles edge case: zero detections overall", () => {
    const oracle = [
      {
        file: "src/clean.test.js",
        smells: [],
      },
    ];
    const tool: unknown[] = [];

    const report = evaluator.evaluate(tool, oracle);
    expect(report.overall).toEqual({
      tp: 0,
      fp: 0,
      fn: 0,
      precision: 1.0,
      recall: 1.0,
      f1Score: 1.0,
      hasActivity: false,
    });

    const consoleOutput = formatEvaluationConsole(report);
    expect(consoleOutput).toContain("N/A");
  });

  it("handles edge case: line range overlaps vs exact range matches", () => {
    const oracle = [
      {
        file: "src/range.test.js",
        smells: [{ type: "Overcommented", startLine: 10, endLine: 25 }],
      },
    ];
    const tool = [
      {
        file: "src/range.test.js",
        type: "OvercommentedTest",
        smells: [{ startLine: 15, endLine: 20 }], // Inside 10..25, but startLine differs by 5
      },
    ];

    const startLineReport = evaluator.evaluate(tool, oracle, {
      lineTolerance: 1,
      matchMode: "start-line",
      smellTypes: ["OvercommentedTest"],
    });
    expect(startLineReport.overall).toMatchObject({ tp: 0, fp: 1, fn: 1 });

    const rangeReport = evaluator.evaluate(tool, oracle, {
      lineTolerance: 1,
      matchMode: "range",
      smellTypes: ["OvercommentedTest"],
    });
    expect(rangeReport.overall).toMatchObject({ tp: 0, fp: 1, fn: 1 });

    const overlapReport = evaluator.evaluate(tool, oracle, {
      lineTolerance: 0,
      matchMode: "overlap",
      smellTypes: ["OvercommentedTest"],
    });
    expect(overlapReport.overall).toMatchObject({
      tp: 1,
      fp: 0,
      fn: 0,
      precision: 1.0,
      recall: 1.0,
      f1Score: 1.0,
    });
  });

  it("formats console, CSV, and JSON reports properly", () => {
    const oracle = [
      {
        file: "chartjs/scale.js",
        smells: [
          { type: "AnonymousTest", startLine: 8, endLine: 12 },
          { type: "Overcommented", startLine: 20, endLine: 30 },
          { type: "GeneralFixture", startLine: 40, endLine: 50 },
        ],
      },
    ];
    const tool = [
      {
        file: "chartjs/scale.js",
        type: "AnonymousTest",
        smells: [{ startLine: 8, endLine: 12 }],
      },
      {
        file: "chartjs/scale.js",
        type: "Overcommented",
        smells: [{ startLine: 20, endLine: 30 }],
      },
      {
        file: "chartjs/scale.js",
        type: "GeneralFixture",
        smells: [{ startLine: 40, endLine: 50 }],
      },
    ];

    const report = evaluator.evaluate(tool, oracle, {
      granularity: "fine-grained",
      lineTolerance: 1,
      smellTypes: [
        "AnonymousTest",
        "Overcommented",
        "GeneralFixture",
        "SensitiveEquality",
        "TestWithoutDescription",
        "CommentsOnlyTest",
        "TranscriptingTest",
      ],
    });

    const consoleText = formatEvaluationConsole(report);
    expect(consoleText).toContain(
      "SNUTS.js Evaluation Report (Granularity: FINE-GRAINED, Line Tolerance: ±1)",
    );
    expect(consoleText).toContain("AnonymousTest (AT)");
    expect(consoleText).toContain("Overcommented (OT)");
    expect(consoleText).toContain("SensitiveEquality (SE)");
    expect(consoleText).toContain("N/A");
    expect(consoleText).toContain("OVERALL TOTAL");

    const csvText = formatEvaluationCsv(report);
    expect(csvText).toContain("Smell Type,Short Code,TP,FP,FN,Precision,Recall,F1-Score");
    expect(csvText).toContain("AnonymousTest,AT,1,0,0,100.00%,100.00%,1.000");
    expect(csvText).toContain("SensitiveEquality,SE,0,0,0,N/A,N/A,N/A");
    expect(csvText).toContain("OVERALL TOTAL,ALL,3,0,0,100.00%,100.00%,1.000");

    const jsonText = formatEvaluationJson(report);
    const parsedJson = JSON.parse(jsonText);
    expect(parsedJson.overall).toMatchObject({
      tp: 3,
      fp: 0,
      fn: 0,
      precision: 1,
      recall: 1,
      f1Score: 1,
    });
  });
});

