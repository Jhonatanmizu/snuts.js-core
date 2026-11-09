export {
  MetricsEvaluator,
  computeRates,
  isInstanceMatch,
  matchInstancesOneToOne,
} from "./metrics-evaluator";
export type { ComputedRates } from "./metrics-evaluator";

export {
  SMELL_CATALOG,
  getSmellMetadata,
  normalizeFilePath,
  normalizeOracleInput,
  normalizeSmellType,
  normalizeToolInput,
  pathsMatch,
  resolveCanonicalFileKey,
} from "./normalizer";
export type { NormalizedOracleData, SmellMetadata } from "./normalizer";

export {
  formatEvaluationConsole,
  formatEvaluationCsv,
  formatEvaluationJson,
  formatEvaluationReport,
} from "./formatters";

export type {
  CanonicalSmellType,
  EvaluationGranularity,
  EvaluationOptions,
  EvaluationOutputFormat,
  EvaluationReport,
  LegacyGroupedToolEntry,
  LineMatchMode,
  MacroAverageMetrics,
  NormalizedSmellInstance,
  OracleFileEntry,
  OracleSmellAnnotation,
  RawOracleInput,
  RawToolInput,
  SmellEvaluationMetrics,
  SmellLineRange,
} from "./types";

