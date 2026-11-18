import path from "node:path";

import { glob } from "glob";

import { Detector, Smell } from "@/core/detector.interface";
import { DetectorRunner } from "@/core/detector-runner";
import { logger } from "@/shared/logger";
import { TEST_FILE_PATTERNS } from "@/shared/constants";
import { SnutsConfig } from "@/config/snuts-config";

async function getFsStats(filePath: string) {
  try {
    const { stat } = await import("node:fs/promises");
    return await stat(filePath);
  } catch (error) {
    logger.warn(`Could not get stats for ${filePath}: ${error}`);
    return undefined;
  }
}

export async function resolveTestFiles(paths: string[]): Promise<string[]> {
  const discovered: string[] = [];

  for (const targetPath of paths) {
    const resolvedPath = path.resolve(process.cwd(), targetPath);
    const stats = await getFsStats(resolvedPath);
    if (!stats) {
      continue;
    }

    if (stats.isDirectory()) {
      const patterns = TEST_FILE_PATTERNS.map((pattern) => `${resolvedPath}/${pattern}`);
      const filesInDir = await glob(patterns, { ignore: "node_modules/**" });
      discovered.push(...filesInDir);
    } else {
      discovered.push(resolvedPath);
    }
  }

  return [...new Set(discovered)];
}

export class ProjectAnalyzer {
  constructor(
    private detectors: Detector[],
    private config?: SnutsConfig,
  ) {}

  async analyze(paths: string[]): Promise<Smell[]> {
    const filesToAnalyze = await resolveTestFiles(paths);

    logger.info(`Found ${filesToAnalyze.length} files to analyze.`);

    const detectorRunner = new DetectorRunner(this.detectors);
    const smellsPerFile = await Promise.all(
      filesToAnalyze.map(async (file) => {
        logger.debug(`Analyzing file: ${file}`);
        return await detectorRunner.run(file);
      }),
    );

    return smellsPerFile.flat();
  }
}
