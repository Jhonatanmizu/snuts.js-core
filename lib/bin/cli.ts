import path from "node:path";
import { writeFile, readFile, stat } from "node:fs/promises";

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
import { MetricsEvaluator, formatEvaluationReport } from "@/evaluator";

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

    let snutsConfig: SnutsConfig | undefined;
    if (parsedCommand.config) {
      try {
        snutsConfig = loadSnutsConfig(path.resolve(cwd, parsedCommand.config));
      } catch (err) {
        writeOutput(String(err), "stderr");
        return 1;
      }
    }

    if (parsedCommand.watch) {
      await startWatch(resolvedPaths);
      return 0;
    }

    const projectAnalyzer = new ProjectAnalyzer(createDetectorInstances(), snutsConfig);
    let smells = await projectAnalyzer.analyze(resolvedPaths);

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

    const targetPaths = parsedCommand.paths ?? [parsedCommand.file];
    const resolvedPaths = targetPaths.map((p) => path.resolve(process.cwd(), p));
    const resolvedFile = resolvedPaths[0]!;

    let isBatchMode = resolvedPaths.length > 1;
    if (!isBatchMode) {
      try {
        const fileStats = await stat(resolvedFile);
        isBatchMode = fileStats.isDirectory();
      } catch {
        isBatchMode = false;
      }
    }

    const service = new RefactorService(createDetectorInstances(), new LangChainProviderRegistry());

    if (isBatchMode) {
      const batchResult = await service.refactorBatch({
        paths: resolvedPaths,
        apply: parsedCommand.apply,
        provider: refactorConfig.provider,
        model: refactorConfig.model,
        apiKey: refactorConfig.apiKey,
        temperature: refactorConfig.temperature,
        maxTokens: refactorConfig.maxTokens,
        concurrency: parsedCommand.concurrency,
        smellDescriptionFilter: parsedCommand.smellDescriptionFilter,
        onProgress: ({ stage, message }) => {
          writeOutput(`[${stage}] ${message}`, "stderr");
        },
      });

      const outputContent =
        parsedCommand.format === "json"
          ? JSON.stringify(batchResult, null, 2)
          : [
              `Mode: ${parsedCommand.apply ? "apply" : "preview"} (batch)`,
              `Provider: ${refactorConfig.provider}`,
              `Model: ${refactorConfig.model}`,
              `Files discovered: ${batchResult.totalFilesDiscovered}`,
              `Files with smells: ${batchResult.filesWithSmells}`,
              `Files refactored: ${batchResult.filesRefactored}`,
              `Files unchanged: ${batchResult.filesUnchanged}`,
              `Files failed: ${batchResult.filesFailed}`,
              ...batchResult.results.map(
                (item) => `  - ${item.file}: ${item.summary} (${item.patch.edits.length} edits)`,
              ),
              ...batchResult.failures.map((item) => `  ! ${item.file}: ${item.error}`),
            ].join("\n");

      if (parsedCommand.output) {
        await writeFile(parsedCommand.output, outputContent, "utf8");
        writeOutput(`Refactor output successfully written to ${parsedCommand.output}`, "stdout");
      } else {
        writeOutput(outputContent, "stdout");
      }
      return batchResult.filesFailed > 0 && batchResult.filesRefactored === 0 ? 1 : 0;
    }

    let originalSource: string | undefined;
    if (!parsedCommand.apply && parsedCommand.format === "text") {
      try {
        originalSource = await readFile(resolvedFile, "utf8");
      } catch {
        // Fallback to summary output if original file cannot be read
      }
    }

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

  if (parsedCommand.type === "evaluate") {
    const cwd = process.cwd();
    const oraclePath = path.resolve(cwd, parsedCommand.oracle);

    let rawOracle: unknown;
    try {
      const oracleContent = await readFile(oraclePath, "utf8");
      rawOracle = JSON.parse(oracleContent);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      writeOutput(`Failed to load oracle file (${oraclePath}): ${msg}`, "stderr");
      return 1;
    }

    let rawToolInput: unknown;
    if (parsedCommand.toolResults) {
      const toolResultsPath = path.resolve(cwd, parsedCommand.toolResults);
      try {
        const toolContent = await readFile(toolResultsPath, "utf8");
        rawToolInput = JSON.parse(toolContent);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        writeOutput(`Failed to load tool results file (${toolResultsPath}): ${msg}`, "stderr");
        return 1;
      }
    } else if (parsedCommand.targetPaths && parsedCommand.targetPaths.length > 0) {
      const resolvedTargets = parsedCommand.targetPaths.map((p) => path.resolve(cwd, p));
      const projectAnalyzer = new ProjectAnalyzer(createDetectorInstances());
      rawToolInput = await projectAnalyzer.analyze(resolvedTargets);
    }

    const evaluator = new MetricsEvaluator();
    const evaluationReport = evaluator.evaluate(rawToolInput, rawOracle, {
      granularity: parsedCommand.granularity,
      lineTolerance: parsedCommand.lineTolerance,
      matchMode: parsedCommand.matchMode,
      onlyOracleFiles: parsedCommand.onlyOracleFiles,
      smellTypes: parsedCommand.smells,
    });

    const formattedOutput = formatEvaluationReport(evaluationReport, parsedCommand.outputFormat);

    if (parsedCommand.output) {
      await writeFile(parsedCommand.output, formattedOutput, "utf8");
      writeOutput(`Evaluation report successfully written to ${parsedCommand.output}`, "stdout");
    } else {
      writeOutput(formattedOutput, "stdout");
    }
    return 0;
  }

  return 0;
}

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
