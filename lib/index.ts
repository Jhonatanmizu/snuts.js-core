export { Watcher } from "./core/watcher";
export { DetectorRunner } from "./core/detector-runner";
export type { Detector, Smell } from "./core/detector.interface";

export { setLogger, silentLogger } from "./shared/logger";
export type { ILogger } from "./shared/logger";

export { ProjectAnalyzer } from "./reporter/project-analyzer";
export type { ReportEntry, ReportGenerator } from "./reporter/report.interface";
export { CsvReportGenerator } from "./reporter/csv-report-generator";
export { JsonReportGenerator } from "./reporter/json-report-generator";

export * from "./detectors";
export * as detectors from "./detectors";
