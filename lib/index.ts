import { Detector } from "./core/detector.interface";
import { Watcher } from "./core/watcher";

import * as detectors from "@/detectors";

const detectorsInstance: Detector[] = Object.values(detectors).map((d) => new d());

const watcher = new Watcher({
  paths: [process.cwd()],
  detectors: [...detectorsInstance],
});

watcher.watch();
