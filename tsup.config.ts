import { defineConfig } from "tsup";

export default defineConfig({
  tsconfig: "tsconfig.build.json",
  entry: {
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
