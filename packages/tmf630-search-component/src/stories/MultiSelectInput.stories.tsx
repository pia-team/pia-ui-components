import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { MultiSelectInput } from "../MultiSelectInput.js";

const meta: Meta<typeof MultiSelectInput> = {
  title: "Components/MultiSelectInput",
  component: MultiSelectInput,
  parameters: {
    docs: {
      description: {
        component:
          "Checkbox dropdown for TMF630 `in` and `nin` operators on enum fields. " +
          "Renders a trigger button showing selected values and a dropdown with checkboxes.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof MultiSelectInput>;

const engineOptions = [
  { value: "JSLT", label: "JSLT" },
  { value: "XSLT", label: "XSLT" },
  { value: "JSONata", label: "JSONata" },
  { value: "JQ", label: "JQ" },
];

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
];

function DefaultTemplate() {
  const [values, setValues] = useState<string[]>(["JSLT"]);
  return (
    <div className="space-y-4">
      <MultiSelectInput
        values={values}
        options={engineOptions}
        onChange={setValues}
        placeholder="Select engines..."
      />
      <pre className="text-xs text-muted-foreground">
        selected: {JSON.stringify(values)}
      </pre>
    </div>
  );
}

export const Default: Story = {
  render: () => <DefaultTemplate />,
  name: "Default (engine enum)",
};

function MultipleSelectedTemplate() {
  const [values, setValues] = useState<string[]>(["active", "draft"]);
  return (
    <div className="space-y-4">
      <MultiSelectInput
        values={values}
        options={statusOptions}
        onChange={setValues}
        placeholder="Select status..."
      />
      <pre className="text-xs text-muted-foreground">
        selected: {JSON.stringify(values)}
      </pre>
    </div>
  );
}

export const MultipleSelected: Story = {
  render: () => <MultipleSelectedTemplate />,
  name: "Multiple pre-selected",
};

function EmptyTemplate() {
  const [values, setValues] = useState<string[]>([]);
  return (
    <div className="space-y-4">
      <MultiSelectInput
        values={values}
        options={engineOptions}
        onChange={setValues}
      />
      <pre className="text-xs text-muted-foreground">
        selected: {JSON.stringify(values)}
      </pre>
    </div>
  );
}

export const Empty: Story = {
  render: () => <EmptyTemplate />,
  name: "Empty state",
};

function NoOptionsTemplate() {
  const [values, setValues] = useState<string[]>([]);
  return (
    <MultiSelectInput
      values={values}
      options={[]}
      onChange={setValues}
      placeholder="No options available"
    />
  );
}

export const NoOptions: Story = {
  render: () => <NoOptionsTemplate />,
  name: "No options",
};

function UnstyledTemplate() {
  const [values, setValues] = useState<string[]>(["JSLT"]);
  return (
    <MultiSelectInput
      values={values}
      options={engineOptions}
      onChange={setValues}
      unstyled
    />
  );
}

export const Unstyled: Story = {
  render: () => <UnstyledTemplate />,
  name: "Unstyled",
};
