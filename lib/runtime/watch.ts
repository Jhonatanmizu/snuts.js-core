import type { Detector } from "../core/detector.interface";
import { Watcher } from "../core/watcher";
import * as detectorModule from "../detectors";

interface DetectorConstructor {
  new (): Detector;
}

const detectorEntries = Object.values(detectorModule) as DetectorConstructor[];
const detectors = detectorEntries.map((DetectorClass) => new DetectorClass());

const watcher = new Watcher({
  paths: [process.cwd()],
  detectors,
});

void watcher.watch();
