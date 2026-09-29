import fs from "node:fs";

import { logger } from "@/shared/logger";
import { SMELL_DESCRIPTIONS } from "@/shared/smell-descriptions";

/**
 * Configuration object accepted via `--config <path>`.
 * Allows per-smell threshold overrides without modifying source code.
 *
 * @example
 * ```json
 * {
 *   "thresholds": {
 *     "VerboseTest": { "maxStatements": 20 },
 *     "ComplexSnapshotTest": { "maxLines": 30 }
 *   }
 * }
 * ```
 */
export interface SnutsConfig {
  /**
   * Per-smell threshold overrides.
   * Key: smell name (must match a key in SMELL_DESCRIPTIONS).
   * Value: map of threshold name → numeric value.
   */
  thresholds?: Record<string, Record<string, number>>;
}

/**
 * Load and parse a `SnutsConfig` from a JSON file at the given path.
 *
 * - Reads the file synchronously (config loading happens before analysis starts).
 * - Parses as JSON; throws a descriptive `Error` on parse failure.
 * - Throws a descriptive `Error` if the file does not exist or cannot be read.
 * - Logs a `warn` for any unrecognized smell key (keys not present in `SMELL_DESCRIPTIONS`).
 *
 * @param configPath - Absolute or relative path to the JSON config file.
 * @returns A typed `SnutsConfig` object.
 * @throws {Error} If the file does not exist or cannot be read.
 * @throws {Error} If the file contains invalid JSON.
 */
export function loadSnutsConfig(configPath: string): SnutsConfig {
  let raw: string;

  try {
    raw = fs.readFileSync(configPath, "utf-8");
  } catch (err) {
    throw new Error(
      `Failed to read config file at "${configPath}": ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `Failed to parse config file at "${configPath}" as JSON: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const config = parsed as SnutsConfig;

  if (config.thresholds) {
    const knownKeys = new Set(Object.keys(SMELL_DESCRIPTIONS));
    for (const key of Object.keys(config.thresholds)) {
      if (!knownKeys.has(key)) {
        logger.warn(
          { configPath, key },
          `Unknown smell key "${key}" in config thresholds — using built-in defaults`,
        );
      }
    }
  }

  return config;
}
