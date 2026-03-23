import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { FilterPanel } from "../FilterPanel.js";
import { FilterChips } from "../FilterChips.js";
import type { FilterableField } from "../types.js";
import type { FilterCondition } from "@pia-team/pia-ui-tmf630-query-core";

const sampleFields: FilterableField[] = [
  { name: "name", label: "Name", type: "text" },
  { name: "createdDate", label: "Created Date", type: "date" },
  { name: "amount", label: "Amount", type: "numeric" },
  {
    name: "status",
    label: "Status",
    type: "enum",
    enumOptions: [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
      { value: "pending", label: "Pending" },
    ],
  },
];

const meta: Meta<typeof FilterPanel> = {
  title: "Components/FilterPanel",
  component: FilterPanel,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof FilterPanel>;

export const Default: Story = {
  args: {
    fields: sampleFields,
  },
};

export const WithInitialFilters: Story = {
  args: {
    fields: sampleFields,
    initialFilters: [
      { field: "name", operator: "contains", value: "John" },
      { field: "status", operator: "eq", value: "active" },
    ],
  },
};

function WithChipsTemplate() {
  const [appliedFilters, setApplied] = useState<FilterCondition[]>([
    { field: "name", operator: "contains", value: "test" },
  ]);

  return (
    <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
      <FilterChips
        filters={appliedFilters}
        fields={sampleFields}
        onRemove={(idx) =>
          setApplied((prev) => prev.filter((_, i) => i !== idx))
        }
        onClearAll={() => setApplied([])}
      />
      <FilterPanel
        fields={sampleFields}
        initialFilters={appliedFilters}
        onApply={setApplied}
      />
    </div>
  );
}

export const WithChips: Story = {
  render: () => <WithChipsTemplate />,
};

export const Unstyled: Story = {
  args: {
    fields: sampleFields,
    unstyled: true,
  },
};

export const CustomClassNames: Story = {
  args: {
    fields: sampleFields,
    classNames: {
      panel: "bg-blue-50 border-blue-200",
      applyButton: "bg-blue-600 hover:bg-blue-700",
    },
  },
};
