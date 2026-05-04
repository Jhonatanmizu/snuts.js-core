import path from "node:path";

import { glob } from "glob";

import { Detector, Smell } from "@/core/detector.interface";
import { DetectorRunner } from "@/core/detector-runner";
import { logger } from "@/shared/logger";
import { TEST_FILE_PATTERNS } from "@/shared/constants";

export class ProjectAnalyzer {
  constructor(private detectors: Detector[]) {}

  async analyze(paths: string[]): Promise<Smell[]> {
    const allSmells: Smell[] = [];
    const filesToAnalyze: string[] = [];

    for (const targetPath of paths) {
      const resolvedPath = path.resolve(process.cwd(), targetPath);
      const isDirectory = (await this.getFsStats(resolvedPath))?.isDirectory();

      if (isDirectory) {
        const patterns = TEST_FILE_PATTERNS.map((pattern) => `${resolvedPath}/${pattern}`);
        const filesInDir = await glob(patterns, { ignore: "node_modules/**" });
        filesToAnalyze.push(...filesInDir);
      } else {
        filesToAnalyze.push(resolvedPath);
      }
    }

    logger.info(`Found ${filesToAnalyze.length} files to analyze.`);

    for (const file of filesToAnalyze) {
      logger.debug(`Analyzing file: ${file}`);
      const detectorRunner = new DetectorRunner(this.detectors);
      const smells = await detectorRunner.run(file);
      allSmells.push(...smells);
    }

    return allSmells;
  }

  private async getFsStats(filePath: string) {
    try {
      const { stat } = await import("node:fs/promises");
      return await stat(filePath);
    } catch (error) {
      logger.warn(`Could not get stats for ${filePath}: ${error}`);
      return undefined;
    }
  }
}
