import { Smell } from "@/core/detector.interface";
import { ReportEntry } from "@/reporter/report.interface";
import { SMELL_DESCRIPTIONS } from "@/shared/smell-descriptions";

export type CanonicalSmellType = keyof typeof SMELL_DESCRIPTIONS;

export type EvaluationGranularity = "class" | "fine-grained";

export type LineMatchMode = "start-line" | "range" | "overlap";

export type EvaluationOutputFormat = "console" | "json" | "csv";

export interface SmellLineRange {
  startLine: number;
  endLine: number;
}

export interface LegacyGroupedToolEntry {
  file: string;
  type: string;
  smells: SmellLineRange[];
  info?: {
    itCount?: number;
    describeCount?: number;
  };
}

export interface OracleSmellAnnotation {
  type: string;
  startLine: number;
  endLine?: number;
}

export interface OracleFileEntry {
  file: string;
  smells: OracleSmellAnnotation[];
}

export interface NormalizedSmellInstance {
  file: string;
  type: string;
  startLine: number;
  endLine: number;
}

export type RawToolInput =
  | ReportEntry[]
  | Smell[]
  | LegacyGroupedToolEntry[]
  | NormalizedSmellInstance[];

export type RawOracleInput = OracleFileEntry[] | NormalizedSmellInstance[];

export interface EvaluationOptions {
  granularity?: EvaluationGranularity;
  lineTolerance?: number;
  matchMode?: LineMatchMode;
  onlyOracleFiles?: boolean;
  smellTypes?: string[];
}

export interface SmellEvaluationMetrics {
  type: string;
  label: string;
  shortCode: string;
  tp: number;
  fp: number;
  fn: number;
  precision: number;
  recall: number;
  f1Score: number;
  hasActivity: boolean;
}

export interface MacroAverageMetrics {
  precision: number;
  recall: number;
  f1Score: number;
  activeSmellCount: number;
}

export interface EvaluationReport {
  granularity: EvaluationGranularity;
  lineTolerance: number;
  matchMode: LineMatchMode;
  onlyOracleFiles: boolean;
  evaluatedFilesCount: number;
  perSmell: SmellEvaluationMetrics[];
  overall: {
    tp: number;
    fp: number;
    fn: number;
    precision: number;
    recall: number;
    f1Score: number;
    hasActivity: boolean;
  };
  macroAverage: MacroAverageMetrics;
}

