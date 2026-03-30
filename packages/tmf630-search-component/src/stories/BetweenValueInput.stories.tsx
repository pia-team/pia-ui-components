import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { BetweenValueInput } from "../BetweenValueInput.js";

const meta: Meta<typeof BetweenValueInput> = {
  title: "Components/BetweenValueInput",
  component: BetweenValueInput,
  parameters: {
    docs: {
      description: {
        component:
          "Dual from/to input for the TMF630 `between` operator. " +
          "Renders two side-by-side inputs with a separator. " +
          "Supports custom renderers via `renderSingleInput` for date pickers, etc.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof BetweenValueInput>;

function TextTemplate() {
  const [value, setValue] = useState(["", ""]);
  return (
    <div className="space-y-4">
      <BetweenValueInput
        value={value}
        onChange={setValue}
        fieldType="text"
      />
      <pre className="text-xs text-muted-foreground">
        value: {JSON.stringify(value)}
      </pre>
    </div>
  );
}

export const TextBetween: Story = {
  render: () => <TextTemplate />,
  name: "Text (default inputs)",
};

function NumericTemplate() {
  const [value, setValue] = useState(["1", "100"]);
  return (
    <div className="space-y-4">
      <BetweenValueInput
        value={value}
        onChange={setValue}
        fieldType="numeric"
      />
      <pre className="text-xs text-muted-foreground">
        value: {JSON.stringify(value)}
      </pre>
    </div>
  );
}

export const NumericBetween: Story = {
  render: () => <NumericTemplate />,
  name: "Numeric (number inputs)",
};

function DateTemplate() {
  const [value, setValue] = useState(["", ""]);
  return (
    <div className="space-y-4">
      <BetweenValueInput
        value={value}
        onChange={setValue}
        fieldType="date"
        field={{
          name: "createdOn",
          label: "Created On",
          type: "date",
          displayFormat: "date",
        }}
      />
      <pre className="text-xs text-muted-foreground">
        value: {JSON.stringify(value)}
      </pre>
    </div>
  );
}

export const DateBetween: Story = {
  render: () => <DateTemplate />,
  name: "Date (date-only placeholders)",
};

function DateTimeTemplate() {
  const [value, setValue] = useState(["", ""]);
  return (
    <div className="space-y-4">
      <BetweenValueInput
        value={value}
        onChange={setValue}
        fieldType="date"
        field={{
          name: "modifiedOn",
          label: "Modified On",
          type: "date",
          displayFormat: "datetime",
        }}
      />
      <pre className="text-xs text-muted-foreground">
        value: {JSON.stringify(value)}
      </pre>
    </div>
  );
}

export const DateTimeBetween: Story = {
  render: () => <DateTimeTemplate />,
  name: "DateTime (datetime placeholders)",
};

function CustomRendererTemplate() {
  const [value, setValue] = useState(["2026-01-01", "2026-12-31"]);
  return (
    <div className="space-y-4">
      <BetweenValueInput
        value={value}
        onChange={setValue}
        fieldType="date"
        renderSingleInput={({ value: v, onChange, betweenIndex }) => (
          <input
            type="date"
            value={v}
            onChange={(e) => onChange(e.target.value)}
            className="rounded border px-2 py-1 text-sm"
            aria-label={betweenIndex === 0 ? "From" : "To"}
          />
        )}
      />
      <pre className="text-xs text-muted-foreground">
        value: {JSON.stringify(value)}
      </pre>
    </div>
  );
}

export const CustomRenderer: Story = {
  render: () => <CustomRendererTemplate />,
  name: "Custom renderer (native date input)",
};

function UnstyledTemplate() {
  const [value, setValue] = useState(["A", "Z"]);
  return (
    <BetweenValueInput
      value={value}
      onChange={setValue}
      fieldType="text"
      unstyled
    />
  );
}

export const Unstyled: Story = {
  render: () => <UnstyledTemplate />,
  name: "Unstyled",
};
