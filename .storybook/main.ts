import type { StorybookConfig } from "@storybook/react-vite";
import path from "path";

const config: StorybookConfig = {
  stories: [
    "../packages/**/src/stories/**/*.stories.@(ts|tsx)",
  ],
  addons: ["@storybook/addon-essentials", "@storybook/addon-a11y"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  viteFinal: async (config, { configType }) => {
    /* GitHub Pages project site: https://<org>.github.io/<repo>/ — set in CI:
       STORYBOOK_BASE_PATH=/<repo-name>/ */
    if (configType === "PRODUCTION" && process.env.STORYBOOK_BASE_PATH) {
      let base = process.env.STORYBOOK_BASE_PATH.trim();
      if (!base.startsWith("/")) base = `/${base}`;
      if (!base.endsWith("/")) base = `${base}/`;
      config.base = base;
    }

    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      "@pia-team/pia-ui-tmf630-query-core": path.resolve(
        __dirname,
        "../packages/tmf630-query-core/src/index.ts",
      ),
      "@pia-team/pia-ui-tmf630-search": path.resolve(
        __dirname,
        "../packages/tmf630-search-component/src/index.ts",
      ),
    };

    config.build = config.build ?? {};
    config.build.chunkSizeWarningLimit = 1200;
    config.build.rollupOptions = config.build.rollupOptions ?? {};
    const prevOnWarn = config.build.rollupOptions.onwarn;
    config.build.rollupOptions.onwarn = (warning, defaultHandler) => {
      if (
        warning.message?.includes('"use client"') &&
        warning.message?.includes("was ignored")
      ) {
        return;
      }
      if (
        warning.message?.includes(
          "Can't resolve original location of error",
        )
      ) {
        return;
      }
      if (
        warning.code === "EVAL" &&
        warning.id?.includes("@storybook/core")
      ) {
        return;
      }
      prevOnWarn?.(warning, defaultHandler) ?? defaultHandler(warning);
    };

    return config;
  },
};

export default config;
