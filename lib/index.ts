export { Watcher } from "./core/watcher";
export { DetectorRunner } from "./core/detector-runner";
export type { Detector, Smell } from "./core/detector.interface";

export { setLogger, silentLogger } from "./shared/logger";
export type { ILogger } from "./shared/logger";

export * from "./detectors";
export * as detectors from "./detectors";
