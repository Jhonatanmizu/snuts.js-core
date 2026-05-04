import path from "node:path";
import { writeFile } from "node:fs/promises";

import pino from "pino";
import pretty from "pino-pretty";

import { parseCliArgs, usageText } from "./cli-args";

import { setLogger } from "@/shared/logger";
import { startWatch } from "@/runtime/watch-runner";
import { ProjectAnalyzer } from "@/reporter/project-analyzer";
import { CsvReportGenerator } from "@/reporter/csv-report-generator";
import { JsonReportGenerator } from "@/reporter/json-report-generator";
import {
  AnonymousTestLogicDetector,
  CommentsOnlyLogicTestDetector,
  ComplexSnapshotTestLogicDetector,
  ConditionalTestLogicDetector,
  GeneralFixtureTestLogicDetector,
  IdenticalDescriptionTestLogicDetector,
  OvercommentedTestLogicDetector,
  DetectorTestWithoutDescriptionLogic,
} from "@/detectors";

function createCliLogger() {
  const stream = pretty({
    colorize: true,
    sync: true,
    translateTime: "SYS:HH:MM:ss",
    ignore: "pid,hostname",
    levelFirst: true,
  });

  return pino(
    {
      name: "snuts",
      level: process.env["LOG_LEVEL"] ?? "info",
    },
    stream,
  );
}

function writeOutput(message: string, target: "stdout" | "stderr"): void {
  const content = `${message}\n`;

  if (target === "stderr") {
    process.stderr.write(content);
    return;
  }

  process.stdout.write(content);
}

export async function runCli(argv: string[]): Promise<number> {
  setLogger(createCliLogger());

  const parsedCommand = parseCliArgs(argv);

  if (parsedCommand.type === "help") {
    writeOutput(usageText(), "stdout");
    return 0;
  }

  if (parsedCommand.type === "error") {
    writeOutput(parsedCommand.message, "stderr");
    writeOutput(usageText(), "stderr");
    return 1;
  }

  const resolvedPaths = parsedCommand.paths.map((targetPath) =>
    path.resolve(process.cwd(), targetPath),
  );

  if (parsedCommand.type === "watch") {
    await startWatch(resolvedPaths);
    return 0;
  }

  if (parsedCommand.type === "analyze") {
    const allDetectors = [
      new AnonymousTestLogicDetector(),
      new CommentsOnlyLogicTestDetector(),
      new ComplexSnapshotTestLogicDetector(),
      new ConditionalTestLogicDetector(),
      new GeneralFixtureTestLogicDetector(),
      new IdenticalDescriptionTestLogicDetector(),
      new OvercommentedTestLogicDetector(),
      new DetectorTestWithoutDescriptionLogic(),
    ];
    const projectAnalyzer = new ProjectAnalyzer(allDetectors);
    const smells = await projectAnalyzer.analyze(resolvedPaths);

    let reportContent: string;
    if (parsedCommand.format === "csv") {
      reportContent = new CsvReportGenerator().generate(smells);
    } else {
      reportContent = new JsonReportGenerator().generate(smells);
    }

    if (parsedCommand.output) {
      await writeFile(parsedCommand.output, reportContent, "utf8");
      writeOutput(`Report successfully written to ${parsedCommand.output}`, "stdout");
    } else {
      writeOutput(reportContent, "stdout");
    }
    return 0;
  }

  return 0;
}

// Check if this file is run directly (e.g., via `node bin/snuts.js` or `ts-node lib/bin/cli.ts`)
if (process.argv[1] && process.argv[1].endsWith("snuts.js")) {
  void runCli(process.argv.slice(2)).then(
    (exitCode) => {
      process.exitCode = exitCode;
    },
    (error: unknown) => {
      const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
      process.stderr.write(`${message}\n`);
      process.exitCode = 1;
    },
  );
}
