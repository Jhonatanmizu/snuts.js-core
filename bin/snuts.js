#!/usr/bin/env node

import("../dist/bin/cli.js")
  .then(({ runCli }) => runCli(process.argv.slice(2)))
  .then((exitCode) => {
    process.exitCode = exitCode;
  })
  .catch((error) => {
    const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
    process.stderr.write(`${message}\n`);
    process.exit(1);
  });
