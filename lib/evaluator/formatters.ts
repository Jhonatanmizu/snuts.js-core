import { EvaluationOutputFormat, EvaluationReport } from "./types";

function padRight(value: string, width: number): string {
  if (value.length >= width) {
    return value;
  }
  return value + " ".repeat(width - value.length);
}

function formatPercentage(rate: number, hasActivity: boolean): string {
  if (!hasActivity) {
    return "N/A";
  }
  return `${(rate * 100).toFixed(2)}%`;
}

function formatF1(f1: number, hasActivity: boolean): string {
  if (!hasActivity) {
    return "N/A";
  }
  return f1.toFixed(3);
}

export function formatEvaluationConsole(report: EvaluationReport): string {
  const separator = "=".repeat(83);
  const divider = "-".repeat(83);

  const granularityLabel = report.granularity.toUpperCase();
  const headerDetails =
    report.granularity === "fine-grained"
      ? `Granularity: ${granularityLabel}, Line Tolerance: ±${report.lineTolerance}`
      : `Granularity: ${granularityLabel}`;

  const labelWidth = Math.max(
    25,
    ...report.perSmell.map((s) => s.label.length),
    "OVERALL TOTAL".length,
  );

  const lines: string[] = [
    separator,
    `SNUTS.js Evaluation Report (${headerDetails})`,
    separator,
    `${padRight("Smell Type", labelWidth)} | ${padRight("TP", 4)} | ${padRight("FP", 4)} | ${padRight("FN", 4)} | ${padRight("Precision", 9)} | ${padRight("Recall", 7)} | F1-Score`,
    divider,
  ];

  for (const row of report.perSmell) {
    const precisionText = formatPercentage(row.precision, row.hasActivity);
    const recallText = formatPercentage(row.recall, row.hasActivity);
    const f1Text = formatF1(row.f1Score, row.hasActivity);

    lines.push(
      `${padRight(row.label, labelWidth)} | ${padRight(String(row.tp), 4)} | ${padRight(String(row.fp), 4)} | ${padRight(String(row.fn), 4)} | ${padRight(precisionText, 9)} | ${padRight(recallText, 7)} | ${f1Text}`,
    );
  }

  const overallPrecision = formatPercentage(
    report.overall.precision,
    report.overall.hasActivity,
  );
  const overallRecall = formatPercentage(report.overall.recall, report.overall.hasActivity);
  const overallF1 = formatF1(report.overall.f1Score, report.overall.hasActivity);

  lines.push(divider);
  lines.push(
    `${padRight("OVERALL TOTAL", labelWidth)} | ${padRight(String(report.overall.tp), 4)} | ${padRight(String(report.overall.fp), 4)} | ${padRight(String(report.overall.fn), 4)} | ${padRight(overallPrecision, 9)} | ${padRight(overallRecall, 7)} | ${overallF1}`,
  );
  lines.push(separator);

  return lines.join("\n");
}

function escapeCsvCell(value: string | number): string {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function formatEvaluationCsv(report: EvaluationReport): string {
  const header = "Smell Type,Short Code,TP,FP,FN,Precision,Recall,F1-Score";
  const rows: string[] = [header];

  for (const row of report.perSmell) {
    const precisionText = formatPercentage(row.precision, row.hasActivity);
    const recallText = formatPercentage(row.recall, row.hasActivity);
    const f1Text = formatF1(row.f1Score, row.hasActivity);

    rows.push(
      [
        escapeCsvCell(row.type),
        escapeCsvCell(row.shortCode),
        row.tp,
        row.fp,
        row.fn,
        escapeCsvCell(precisionText),
        escapeCsvCell(recallText),
        escapeCsvCell(f1Text),
      ].join(","),
    );
  }

  rows.push(
    [
      "OVERALL TOTAL",
      "ALL",
      report.overall.tp,
      report.overall.fp,
      report.overall.fn,
      escapeCsvCell(formatPercentage(report.overall.precision, report.overall.hasActivity)),
      escapeCsvCell(formatPercentage(report.overall.recall, report.overall.hasActivity)),
      escapeCsvCell(formatF1(report.overall.f1Score, report.overall.hasActivity)),
    ].join(","),
  );

  return rows.join("\n");
}

export function formatEvaluationJson(report: EvaluationReport): string {
  return JSON.stringify(report, null, 2);
}

export function formatEvaluationReport(
  report: EvaluationReport,
  format: EvaluationOutputFormat,
): string {
  if (format === "json") {
    return formatEvaluationJson(report);
  }
  if (format === "csv") {
    return formatEvaluationCsv(report);
  }
  return formatEvaluationConsole(report);
}

