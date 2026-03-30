import path from "node:path";
import { pathToFileURL } from "node:url";

import pino from "pino";
import pretty from "pino-pretty";

import { parseCliArgs, usageText } from "./cli-args";

import { setLogger } from "@/shared/logger";
import { startWatch } from "@/runtime/watch-runner";

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

  await startWatch(resolvedPaths);
  return 0;
}

const executedFileUrl = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";

if (import.meta.url === executedFileUrl) {
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
