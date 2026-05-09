import path from "node:path";
import { writeFile } from "node:fs/promises";

import pino from "pino";
import pretty from "pino-pretty";

import { parseCliArgs, usageText } from "./cli-args";

import { LangChainProviderRegistry, RefactorService, resolveAIConfig } from "@/ai";
import { setLogger } from "@/shared/logger";
import { createDetectorInstances, startWatch } from "@/runtime/watch-runner";
import { ProjectAnalyzer } from "@/reporter/project-analyzer";
import { CsvReportGenerator } from "@/reporter/csv-report-generator";
import { JsonReportGenerator } from "@/reporter/json-report-generator";

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

  if (parsedCommand.type === "watch") {
    const resolvedPaths = parsedCommand.paths.map((targetPath: string) =>
      path.resolve(process.cwd(), targetPath),
    );
    await startWatch(resolvedPaths);
    return 0;
  }

  if (parsedCommand.type === "analyze") {
    const resolvedPaths = parsedCommand.paths.map((targetPath: string) =>
      path.resolve(process.cwd(), targetPath),
    );
    const projectAnalyzer = new ProjectAnalyzer(createDetectorInstances());
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

  if (parsedCommand.type === "refactor") {
    const refactorConfig = resolveAIConfig({
      provider: parsedCommand.provider,
      model: parsedCommand.model,
      apiKey: parsedCommand.apiKey,
      temperature: parsedCommand.temperature,
      maxTokens: parsedCommand.maxTokens,
    });

    const service = new RefactorService(createDetectorInstances(), new LangChainProviderRegistry());
    const result = await service.refactorFile({
      file: path.resolve(process.cwd(), parsedCommand.file),
      apply: parsedCommand.apply,
      provider: refactorConfig.provider,
      model: refactorConfig.model,
      apiKey: refactorConfig.apiKey,
      temperature: refactorConfig.temperature,
      maxTokens: refactorConfig.maxTokens,
      smellDescriptionFilter: parsedCommand.smellDescriptionFilter,
      onProgress: ({ stage, message }) => {
        writeOutput(`[${stage}] ${message}`, "stderr");
      },
    });

    const outputContent =
      parsedCommand.format === "json"
        ? JSON.stringify(result, null, 2)
        : [
            `File: ${result.file}`,
            `Mode: ${result.apply ? "apply" : "preview"}`,
            `Provider: ${result.diagnostics.provider}`,
            `Model: ${result.diagnostics.model}`,
            `Smells detected: ${result.diagnostics.smellsDetected}`,
            `Smells used in prompt: ${result.diagnostics.smellsUsedInPrompt}`,
            `Summary: ${result.summary}`,
            `Edits: ${result.patch.edits.length}`,
          ].join("\n");

    if (parsedCommand.output) {
      await writeFile(parsedCommand.output, outputContent, "utf8");
      writeOutput(`Refactor output successfully written to ${parsedCommand.output}`, "stdout");
    } else {
      writeOutput(outputContent, "stdout");
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
