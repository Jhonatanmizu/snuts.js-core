import type { Detector } from "../core/detector.interface";
import { Watcher } from "../core/watcher";
import * as detectorModule from "../detectors";

interface DetectorConstructor {
  new (): Detector;
}

export function createDetectorInstances(): Detector[] {
  const detectorEntries = Object.values(detectorModule) as DetectorConstructor[];
  return detectorEntries.map((DetectorClass) => new DetectorClass());
}

export async function startWatch(paths: string[]): Promise<void> {
  const watcher = new Watcher({
    paths,
    detectors: createDetectorInstances(),
  });

  await watcher.watch();
}
