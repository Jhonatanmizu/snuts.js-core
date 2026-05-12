import path from "node:path";
import { writeFile, readFile } from "node:fs/promises";

import pino from "pino";
import pretty from "pino-pretty";

import { parseCliArgs, usageText } from "./cli-args";

import { LangChainProviderRegistry, RefactorService, resolveAIConfig } from "@/ai";
import { generateUnifiedDiff } from "@/ai/patch-utils";
import { setLogger, logger } from "@/shared/logger";
import { SMELL_DESCRIPTIONS } from "@/shared/smell-descriptions";
import { loadSnutsConfig, SnutsConfig } from "@/config/snuts-config";
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
    const cwd = process.cwd();
    const resolvedPaths = parsedCommand.paths.map((targetPath: string) =>
      path.resolve(cwd, targetPath),
    );

    // Task 8.3: Load --config if provided
    let snutsConfig: SnutsConfig | undefined;
    if (parsedCommand.config) {
      try {
        snutsConfig = loadSnutsConfig(path.resolve(cwd, parsedCommand.config));
      } catch (err) {
        writeOutput(String(err), "stderr");
        return 1;
      }
    }

    // Task 9.2: Delegate to watch mode if --watch
    if (parsedCommand.watch) {
      await startWatch(resolvedPaths);
      return 0;
    }

    // Task 8.3: Pass snutsConfig to ProjectAnalyzer
    const projectAnalyzer = new ProjectAnalyzer(createDetectorInstances(), snutsConfig);
    let smells = await projectAnalyzer.analyze(resolvedPaths);

    // Task 9.2: Apply --smell post-analysis filter
    if (parsedCommand.smells && parsedCommand.smells.length > 0) {
      const knownTypes = new Set(Object.keys(SMELL_DESCRIPTIONS));
      for (const s of parsedCommand.smells) {
        if (!knownTypes.has(s)) {
          logger.warn(`Unknown smell type in --smell filter: ${s}`);
        }
      }
      const filterSet = new Set<string>(
        parsedCommand.smells.map(
          (s) => SMELL_DESCRIPTIONS[s as keyof typeof SMELL_DESCRIPTIONS]?.description ?? s,
        ),
      );
      smells = smells.filter((smell) => filterSet.has(smell.description));
    }

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

    const resolvedFile = path.resolve(process.cwd(), parsedCommand.file);

    // Task 7.2: Read original source before refactoring for diff generation in preview+text mode
    let originalSource: string | undefined;
    if (!parsedCommand.apply && parsedCommand.format === "text") {
      try {
        originalSource = await readFile(resolvedFile, "utf8");
      } catch {
        // If we can't read the file, we'll fall back to the summary output
      }
    }

    const service = new RefactorService(createDetectorInstances(), new LangChainProviderRegistry());
    const result = await service.refactorFile({
      file: resolvedFile,
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

    let outputContent: string;
    if (parsedCommand.format === "json") {
      outputContent = JSON.stringify(result, null, 2);
    } else if (!parsedCommand.apply && originalSource !== undefined) {
      // Task 7.2: Generate unified diff for preview mode
      outputContent = generateUnifiedDiff(originalSource, result.updatedContent, result.file);
    } else {
      outputContent = [
        `File: ${result.file}`,
        `Mode: ${result.apply ? "apply" : "preview"}`,
        `Provider: ${result.diagnostics.provider}`,
        `Model: ${result.diagnostics.model}`,
        `Smells detected: ${result.diagnostics.smellsDetected}`,
        `Smells used in prompt: ${result.diagnostics.smellsUsedInPrompt}`,
        `Summary: ${result.summary}`,
        `Edits: ${result.patch.edits.length}`,
      ].join("\n");
    }

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
