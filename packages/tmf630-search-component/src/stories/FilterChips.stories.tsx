import type { Meta, StoryObj } from "@storybook/react";
import { FilterChips } from "../FilterChips.js";
import type { FilterableField } from "../types.js";
import type { FilterCondition } from "@pia-team/pia-ui-tmf630-query-core";

const sampleFields: FilterableField[] = [
  { name: "name", label: "Name", type: "text" },
  { name: "status", label: "Status", type: "enum" },
  { name: "amount", label: "Amount", type: "numeric" },
];

const sampleFilters: FilterCondition[] = [
  { field: "name", operator: "contains", value: "test" },
  { field: "status", operator: "eq", value: "active" },
  { field: "amount", operator: "gte", value: "100" },
];

const meta: Meta<typeof FilterChips> = {
  title: "Components/FilterChips",
  component: FilterChips,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof FilterChips>;

export const Default: Story = {
  args: {
    filters: sampleFilters,
    fields: sampleFields,
    onRemove: (idx) => console.log("Remove filter at index", idx),
    onClearAll: () => console.log("Clear all"),
  },
};

export const Empty: Story = {
  args: {
    filters: [],
    fields: sampleFields,
    onRemove: () => {},
    onClearAll: () => {},
  },
};

export const SingleFilter: Story = {
  args: {
    filters: [sampleFilters[0]],
    fields: sampleFields,
    onRemove: () => {},
    onClearAll: () => {},
  },
};
