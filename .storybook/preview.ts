import type { Preview } from "@storybook/react";

/* Tailwind + shadcn tarzı tokenlar — bileşen varsayılan sınıfları canvas’ta çözülür. */
import "./storybook.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      config: {
        rules: [
          /* Radix Select tetikleyicide bilinçli olarak gizli value; gürültüyü azalt */
          { id: "aria-hidden-focus", enabled: false },
        ],
      },
    },
    options: {
      storySort: {
        order: [
          "Query core",
          "Components",
          ["FilterPanel", "FilterChips", "CompoundFilterPanel"],
          "Hooks",
        ],
      },
    },
  },
};

export default preview;
