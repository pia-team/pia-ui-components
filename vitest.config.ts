import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@pia-team/pia-ui-tmf630-query-core": path.resolve(
        __dirname,
        "packages/tmf630-query-core/src/index.ts",
      ),
      "@pia-team/pia-ui-tmf630-search": path.resolve(
        __dirname,
        "packages/tmf630-search-component/src/index.ts",
      ),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    include: ["packages/**/tests/**/*.test.{ts,tsx}"],
  },
});
