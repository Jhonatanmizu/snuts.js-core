import {
  SMELL_CATALOG,
  getSmellMetadata,
  normalizeOracleInput,
  normalizeSmellType,
  normalizeToolInput,
  resolveCanonicalFileKey,
} from "./normalizer";
import {
  EvaluationOptions,
  EvaluationReport,
  LineMatchMode,
  MacroAverageMetrics,
  NormalizedSmellInstance,
  SmellEvaluationMetrics,
} from "./types";

export interface ComputedRates {
  precision: number;
  recall: number;
  f1Score: number;
  hasActivity: boolean;
}

/**
 * Calculates Precision, Recall, and F1-Score according to Requirement 2:
 * - Precision: TP / (TP + FP) (1.0 if TP + FP == 0 and FN == 0, else 0.0 if TP + FP == 0)
 * - Recall: TP / (TP + FN) (1.0 if TP + FN == 0, else TP / (TP + FN))
 * - F1-Score: 2 * (Precision * Recall) / (Precision + Recall) (0.0 if Precision + Recall == 0)
 */
export function computeRates(tp: number, fp: number, fn: number): ComputedRates {
  const hasActivity = tp + fp + fn > 0;

  let precision: number;
  if (tp + fp === 0) {
    precision = fn === 0 ? 1.0 : 0.0;
  } else {
    precision = tp / (tp + fp);
  }

  let recall: number;
  if (tp + fn === 0) {
    recall = 1.0;
  } else {
    recall = tp / (tp + fn);
  }

  const f1Score =
    precision + recall === 0 ? 0.0 : (2 * (precision * recall)) / (precision + recall);

  return {
    precision,
    recall,
    f1Score,
    hasActivity,
  };
}

export function isInstanceMatch(
  tool: NormalizedSmellInstance,
  oracle: NormalizedSmellInstance,
  tolerance: number,
  matchMode: LineMatchMode,
): boolean {
  if (tool.type !== oracle.type) {
    return false;
  }

  if (matchMode === "range") {
    return (
      Math.abs(tool.startLine - oracle.startLine) <= tolerance &&
      Math.abs(tool.endLine - oracle.endLine) <= tolerance
    );
  }

  if (matchMode === "overlap") {
    return (
      tool.startLine <= oracle.endLine + tolerance && oracle.startLine <= tool.endLine + tolerance
    );
  }

  // Default: "start-line"
  return Math.abs(tool.startLine - oracle.startLine) <= tolerance;
}

function lineDistance(a: NormalizedSmellInstance, b: NormalizedSmellInstance): number {
  return Math.abs(a.startLine - b.startLine) * 1000 + Math.abs(a.endLine - b.endLine);
}

/**
 * Finds a 1-to-1 matching between tool detections and oracle annotations
 * within the same (file, smellType) bucket that maximizes True Positives
 * while prioritizing closest line numbers.
 */
export function matchInstancesOneToOne(
  toolInstances: NormalizedSmellInstance[],
  oracleInstances: NormalizedSmellInstance[],
  tolerance: number,
  matchMode: LineMatchMode,
): { tp: number; fp: number; fn: number } {
  if (toolInstances.length === 0 || oracleInstances.length === 0) {
    return {
      tp: 0,
      fp: toolInstances.length,
      fn: oracleInstances.length,
    };
  }

  // Sort both arrays by startLine then endLine for deterministic matching
  const sortedTool = [...toolInstances].sort(
    (a, b) => a.startLine - b.startLine || a.endLine - b.endLine,
  );
  const sortedOracle = [...oracleInstances].sort(
    (a, b) => a.startLine - b.startLine || a.endLine - b.endLine,
  );

  // Build adjacency list for each tool instance ordered by closest line distance
  const adj: number[][] = sortedTool.map((toolItem) => {
    const candidates: Array<{ oracleIdx: number; dist: number }> = [];
    for (let oIdx = 0; oIdx < sortedOracle.length; oIdx++) {
      const oracleItem = sortedOracle[oIdx]!;
      if (isInstanceMatch(toolItem, oracleItem, tolerance, matchMode)) {
        candidates.push({
          oracleIdx: oIdx,
          dist: lineDistance(toolItem, oracleItem),
        });
      }
    }
    candidates.sort((a, b) => a.dist - b.dist || a.oracleIdx - b.oracleIdx);
    return candidates.map((c) => c.oracleIdx);
  });

  const matchedToolForOracle = new Array<number>(sortedOracle.length).fill(-1);

  function tryAugment(toolIdx: number, visitedOracle: boolean[]): boolean {
    const neighbors = adj[toolIdx] ?? [];
    for (const oracleIdx of neighbors) {
      if (visitedOracle[oracleIdx]) {
        continue;
      }
      visitedOracle[oracleIdx] = true;
      const existingTool = matchedToolForOracle[oracleIdx]!;
      if (existingTool === -1 || tryAugment(existingTool, visitedOracle)) {
        matchedToolForOracle[oracleIdx] = toolIdx;
        return true;
      }
    }
    return false;
  }

  let tp = 0;
  for (let tIdx = 0; tIdx < sortedTool.length; tIdx++) {
    const visited = new Array<boolean>(sortedOracle.length).fill(false);
    if (tryAugment(tIdx, visited)) {
      tp++;
    }
  }

  return {
    tp,
    fp: sortedTool.length - tp,
    fn: sortedOracle.length - tp,
  };
}

export class MetricsEvaluator {
  evaluate(
    rawToolInput: unknown,
    rawOracleInput: unknown,
    options: EvaluationOptions = {},
  ): EvaluationReport {
    const granularity = options.granularity ?? "fine-grained";
    const lineTolerance = options.lineTolerance ?? 1;
    const matchMode = options.matchMode ?? "start-line";
    const onlyOracleFiles = options.onlyOracleFiles ?? false;

    if (!Number.isFinite(lineTolerance) || lineTolerance < 0) {
      throw new Error(`Invalid lineTolerance: ${lineTolerance}. Expected a non-negative number.`);
    }

    const { instances: rawOracleInstances, oracleFiles } = normalizeOracleInput(rawOracleInput);
    const rawToolInstances = normalizeToolInput(rawToolInput);

    // Align file keys between tool and oracle
    const allCanonicalFiles = new Set<string>(oracleFiles);
    const alignedToolInstances: NormalizedSmellInstance[] = [];

    for (const toolInst of rawToolInstances) {
      const canonicalFile = resolveCanonicalFileKey(toolInst.file, allCanonicalFiles);
      if (onlyOracleFiles && !oracleFiles.has(canonicalFile)) {
        continue;
      }
      allCanonicalFiles.add(canonicalFile);
      alignedToolInstances.push({
        ...toolInst,
        file: canonicalFile,
      });
    }

    // Determine smell types to evaluate
    let targetSmellTypes: string[];
    if (options.smellTypes && options.smellTypes.length > 0) {
      targetSmellTypes = Array.from(new Set(options.smellTypes.map((s) => normalizeSmellType(s))));
    } else {
      const seenTypes = new Set<string>(SMELL_CATALOG.map((m) => m.type));
      for (const inst of rawOracleInstances) {
        seenTypes.add(inst.type);
      }
      for (const inst of alignedToolInstances) {
        seenTypes.add(inst.type);
      }
      targetSmellTypes = Array.from(seenTypes);
    }

    const allowedSmellSet = new Set<string>(targetSmellTypes);
    const filteredOracle = rawOracleInstances.filter((i) => allowedSmellSet.has(i.type));
    const filteredTool = alignedToolInstances.filter((i) => allowedSmellSet.has(i.type));

    const perSmell: SmellEvaluationMetrics[] = [];
    let totalTp = 0;
    let totalFp = 0;
    let totalFn = 0;

    for (const smellType of targetSmellTypes) {
      let tp = 0;
      let fp = 0;
      let fn = 0;

      if (granularity === "class") {
        for (const file of allCanonicalFiles) {
          const toolHas = filteredTool.some((t) => t.file === file && t.type === smellType);
          const oracleHas = filteredOracle.some((o) => o.file === file && o.type === smellType);

          if (toolHas && oracleHas) {
            tp++;
          } else if (toolHas && !oracleHas) {
            fp++;
          } else if (!toolHas && oracleHas) {
            fn++;
          }
        }
      } else {
        for (const file of allCanonicalFiles) {
          const fileTool = filteredTool.filter((t) => t.file === file && t.type === smellType);
          const fileOracle = filteredOracle.filter((o) => o.file === file && o.type === smellType);
          const matchResult = matchInstancesOneToOne(
            fileTool,
            fileOracle,
            lineTolerance,
            matchMode,
          );
          tp += matchResult.tp;
          fp += matchResult.fp;
          fn += matchResult.fn;
        }
      }

      totalTp += tp;
      totalFp += fp;
      totalFn += fn;

      const rates = computeRates(tp, fp, fn);
      const meta = getSmellMetadata(smellType);

      perSmell.push({
        type: meta.type,
        label: meta.label,
        shortCode: meta.shortCode,
        tp,
        fp,
        fn,
        precision: rates.precision,
        recall: rates.recall,
        f1Score: rates.f1Score,
        hasActivity: rates.hasActivity,
      });
    }

    const overallRates = computeRates(totalTp, totalFp, totalFn);
    const activeSmells = perSmell.filter((s) => s.hasActivity);
    const macroAverage: MacroAverageMetrics =
      activeSmells.length > 0
        ? {
            precision: activeSmells.reduce((sum, s) => sum + s.precision, 0) / activeSmells.length,
            recall: activeSmells.reduce((sum, s) => sum + s.recall, 0) / activeSmells.length,
            f1Score: activeSmells.reduce((sum, s) => sum + s.f1Score, 0) / activeSmells.length,
            activeSmellCount: activeSmells.length,
          }
        : {
            precision: 1.0,
            recall: 1.0,
            f1Score: 1.0,
            activeSmellCount: 0,
          };

    return {
      granularity,
      lineTolerance,
      matchMode,
      onlyOracleFiles,
      evaluatedFilesCount: allCanonicalFiles.size,
      perSmell,
      overall: {
        tp: totalTp,
        fp: totalFp,
        fn: totalFn,
        precision: overallRates.precision,
        recall: overallRates.recall,
        f1Score: overallRates.f1Score,
        hasActivity: overallRates.hasActivity,
      },
      macroAverage,
    };
  }
}
