#!/usr/bin/env node

import { Command } from "commander";
import { Watcher } from "../lib/core/watcher";
import { ConditionalTestLogicDetector } from "../lib/detectors/conditionalTestLogic";

const program = new Command();

program.name("snuts").description("A CLI tool to detect test smells in your code").version("1.0.0");

program
  .command("watch")
  .description("Watch files for changes and detect test smells")
  .argument("<paths>")
  .action(async (pathsString) => {
    const paths = pathsString.split(",");
    const watcher = new Watcher({
      paths,
      detectors: [new ConditionalTestLogicDetector()],
    });

    await watcher.watch();
  });

program.parse();
