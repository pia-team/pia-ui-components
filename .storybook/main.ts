import type { StorybookConfig } from "@storybook/react-vite";
import path from "path";

const config: StorybookConfig = {
  stories: [
    "../packages/**/src/stories/**/*.stories.@(ts|tsx)",
  ],
  addons: ["@storybook/addon-essentials"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  viteFinal: async (config) => {
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
    return config;
  },
};

export default config;
