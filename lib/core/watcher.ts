import chokidar from "chokidar";
import { glob } from "glob";

import { DetectorRunner } from "./detector-runner";
import { Smell, Detector } from "./detector.interface";

import { TEST_FILE_PATTERNS } from "@/shared/constants";

interface WatcherOptions {
  paths: string[];
  detectors: Detector[];
}

export class Watcher {
  private detectorRunner: DetectorRunner;

  constructor(private options: WatcherOptions) {
    this.detectorRunner = new DetectorRunner(options.detectors);
  }

  async watch() {
    const files = await this.findFiles();
    await this.runDetections(files);

    const watcher = chokidar.watch(this.options.paths, {
      persistent: true,
      ignoreInitial: true,
      ignored: ["node_modules/**", "**/node_modules/**"],
    });

    watcher.on("add", async (file) => await this.runDetections([file]));
    watcher.on("change", async (file) => await this.runDetections([file]));

    console.log("Watching for file changes...");
  }

  private async findFiles(): Promise<string[]> {
    const patternsToGlob = TEST_FILE_PATTERNS;
    const files = await Promise.all(
      patternsToGlob.map((pattern) =>
        glob(pattern, {
          absolute: true,
          nodir: true,
          ignore: ["node_modules", "**/node_modules/**"],
        }),
      ),
    );
    return files.flat();
  }

  private async runDetections(files: string[]) {
    for (const file of files) {
      const smells = await this.detectorRunner.run(file);
      this.logSmells(smells);
    }
  }

  private logSmells(smells: Smell[]) {
    if (smells.length === 0) {
      return;
    }

    for (const smell of smells) {
      console.log("----------------------------------------");
      console.log(`File: ${smell.file}`);
      console.log(`Location: ${smell.start.line}:${smell.end.line}`);
      console.log(`Smell: ${smell.message}`);
      console.log(`Code: \n${smell.codeBlock}`);
      console.log("----------------------------------------");
    }
  }
}
