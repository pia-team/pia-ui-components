import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { TagValueInput } from "../TagValueInput.js";

const meta: Meta<typeof TagValueInput> = {
  title: "Components/TagValueInput",
  component: TagValueInput,
  parameters: {
    docs: {
      description: {
        component:
          "Tag/chip input for TMF630 `in` and `nin` operators. " +
          "Type a value and press Enter or comma to add it as a tag. " +
          "Press Backspace on empty input to remove the last tag.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof TagValueInput>;

function TextTagsTemplate() {
  const [values, setValues] = useState<string[]>(["Alice", "Bob"]);
  return (
    <div className="space-y-4">
      <TagValueInput
        values={values}
        onChange={setValues}
        placeholder="Type a name and press Enter"
      />
      <pre className="text-xs text-muted-foreground">
        values: {JSON.stringify(values)}
      </pre>
    </div>
  );
}

export const TextTags: Story = {
  render: () => <TextTagsTemplate />,
  name: "Text tags (default)",
};

function NumericTagsTemplate() {
  const [values, setValues] = useState<string[]>(["1", "2", "3"]);
  return (
    <div className="space-y-4">
      <TagValueInput
        values={values}
        onChange={setValues}
        placeholder="Type a number"
        inputType="number"
      />
      <pre className="text-xs text-muted-foreground">
        values: {JSON.stringify(values)}
      </pre>
    </div>
  );
}

export const NumericTags: Story = {
  render: () => <NumericTagsTemplate />,
  name: "Numeric tags",
};

function EmptyTemplate() {
  const [values, setValues] = useState<string[]>([]);
  return (
    <div className="space-y-4">
      <TagValueInput
        values={values}
        onChange={setValues}
        placeholder="Type and press Enter to add"
      />
      <pre className="text-xs text-muted-foreground">
        values: {JSON.stringify(values)}
      </pre>
    </div>
  );
}

export const Empty: Story = {
  render: () => <EmptyTemplate />,
  name: "Empty state",
};

function ManyTagsTemplate() {
  const [values, setValues] = useState<string[]>([
    "Alpha", "Bravo", "Charlie", "Delta", "Echo",
    "Foxtrot", "Golf", "Hotel", "India", "Juliet",
  ]);
  return (
    <div className="space-y-4 max-w-md">
      <TagValueInput
        values={values}
        onChange={setValues}
        placeholder="Add more..."
      />
      <pre className="text-xs text-muted-foreground">
        {values.length} tags
      </pre>
    </div>
  );
}

export const ManyTags: Story = {
  render: () => <ManyTagsTemplate />,
  name: "Many tags (wrapping)",
};

function UnstyledTemplate() {
  const [values, setValues] = useState<string[]>(["A", "B"]);
  return (
    <TagValueInput values={values} onChange={setValues} unstyled />
  );
}

export const Unstyled: Story = {
  render: () => <UnstyledTemplate />,
  name: "Unstyled",
};
