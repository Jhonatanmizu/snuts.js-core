import path from "node:path";

import chokidar from "chokidar";
import { glob } from "glob";
import _ from "lodash";

import { DetectorRunner } from "./detector-runner";
import { Smell, Detector } from "./detector.interface";

import { TEST_FILE_PATTERNS } from "@/shared/constants";
import { logger } from "@/shared/logger";

interface WatcherOptions {
  paths: string[];
  detectors: Detector[];
  debounceMs?: number;
  concurrentFiles?: number;
}

export class Watcher {
  private detectorRunner: DetectorRunner;
  private debounceMs: number;
  private concurrentFiles: number;

  constructor(private options: WatcherOptions) {
    this.detectorRunner = new DetectorRunner(options.detectors);
    this.debounceMs = options.debounceMs ?? 200;
    this.concurrentFiles = options.concurrentFiles ?? 10;
  }

  async watch() {
    const files = await this.findFiles();
    await this.runDetections(files);

    const watcher = chokidar.watch(this.options.paths, {
      persistent: true,
      ignoreInitial: true,
      ignored: ["**/node_modules/**", "**/dist/**"],
    });

    const debouncedRun = _.debounce(
      async (file: string) => await this.runDetections([file]),
      this.debounceMs,
    );

    watcher.on("add", (file) => {
      logger.debug({ file }, "File added");
      debouncedRun(file);
    });

    watcher.on("change", (file) => {
      logger.debug({ file }, "File changed");
      debouncedRun(file);
    });

    logger.info("👀 Watching for file changes...");
  }

  private async findFiles(): Promise<string[]> {
    const patterns = TEST_FILE_PATTERNS;
    const all = await Promise.all(
      patterns.map((pattern) =>
        glob(pattern, {
          absolute: true,
          nodir: true,
          ignore: ["**/node_modules/**", "**/dist/**"],
        }),
      ),
    );
    const files = all.flat();
    logger.info({ count: files.length }, "Test files found");
    return files;
  }

  private async runDetections(files: string[]) {
    if (files.length === 0) return;

    const limited = files.slice(0, this.concurrentFiles);

    await Promise.allSettled(
      limited.map(async (file) => {
        try {
          const smells = await this.detectorRunner.run(file);
          this.logSmells(file, smells);
        } catch (err) {
          logger.error({ err, file }, "Error analyzing file");
        }
      }),
    );
  }

  private logSmells(file: string, smells: Smell[]) {
    const relativeFile = path.relative(process.cwd(), file);

    if (smells.length === 0) {
      logger.info({ file: relativeFile }, "No smells detected");
      return;
    }

    logger.warn({ file: relativeFile, count: smells.length }, "Smells detected");

    for (const smell of smells) {
      logger.warn({
        file: smell.file,
        location: `${smell.start.line}:${smell.end.line}`,
        message: smell.message,
        code: smell.codeBlock?.trim().slice(0, 200),
      });
    }
  }
}
