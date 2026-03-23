import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  outDir: "dist",
  splitting: false,
  external: [
    "react",
    "react-dom",
    "@radix-ui/react-select",
    "@pia-team/pia-ui-tmf630-query-core",
  ],
  banner: {
    js: '"use client";',
  },
});
