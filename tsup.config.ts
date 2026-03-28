import { defineConfig } from "tsup";

export default defineConfig({
  tsconfig: "tsconfig.build.json",
  entry: {
    "bin/cli": "lib/bin/cli.ts",
    index: "lib/index.ts",
    "detectors/index": "lib/detectors/index.ts",
    "runtime/watch": "lib/runtime/watch.ts",
  },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  outDir: "dist",
  target: "es2022",
});
