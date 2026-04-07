import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { FilterChips } from "../FilterChips.js";
import type { FilterableField } from "../types.js";
import type { FilterCondition } from "@pia-team/pia-ui-tmf630-query-core";

const sampleFields: FilterableField[] = [
  { name: "name", label: "Name", type: "text" },
  { name: "status", label: "Status", type: "enum" },
  { name: "amount", label: "Amount", type: "numeric" },
  {
    name: "createdOn",
    label: "Created On",
    type: "date",
    displayFormat: "date",
    displayPattern: "dd/MM/yyyy",
    responseDisplayFormat: "date",
  },
  {
    name: "modifiedOn",
    label: "Modified On",
    type: "date",
    displayFormat: "datetime",
    displayPattern: "dd/MM/yyyy HH:mm",
  },
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

const dateFilters: FilterCondition[] = [
  { field: "createdOn", operator: "eq", value: "2026-03-15" },
  { field: "modifiedOn", operator: "gte", value: "2026-03-15T14:30" },
  { field: "createdOn", operator: "between", value: ["2026-01-01", "2026-12-31"] },
];

function DateChipsTemplate() {
  const [filters, setFilters] = useState(dateFilters);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>
        Date chips use <code>displayPattern</code> for formatting.
        <strong> createdOn</strong>: date-only (<code>dd/MM/yyyy</code>),
        <strong> modifiedOn</strong>: date+time (<code>dd/MM/yyyy HH:mm</code>).
      </p>
      <FilterChips
        filters={filters}
        fields={sampleFields}
        onRemove={(idx) => setFilters((prev) => prev.filter((_, i) => i !== idx))}
        onClearAll={() => setFilters([])}
      />
    </div>
  );
}

export const DateDisplayPatterns: Story = {
  render: () => <DateChipsTemplate />,
  name: "Date display patterns",
};
