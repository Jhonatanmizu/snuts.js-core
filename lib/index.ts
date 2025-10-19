import { Watcher } from "./core/watcher";
import { ConditionalTestLogicDetector } from "./detectors/conditionalTestLogic";

const watcher = new Watcher({
  paths: [process.cwd()],
  detectors: [new ConditionalTestLogicDetector()],
});

watcher.watch();
