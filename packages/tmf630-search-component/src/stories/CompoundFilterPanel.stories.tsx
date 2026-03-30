import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { CompoundFilterPanel } from "../CompoundFilterPanel.js";
import { FilterChips } from "../FilterChips.js";
import type { FilterableField } from "../types.js";
import type { FilterGroup, FilterCondition } from "@pia-team/pia-ui-tmf630-query-core";
import { createGroup, flattenToConditions } from "@pia-team/pia-ui-tmf630-query-core";

const fields: FilterableField[] = [
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

const operatorAwareFields: FilterableField[] = [
  {
    name: "name",
    label: "Name",
    type: "text",
    operators: ["eq", "ne", "contains", "containsi", "in", "nin", "isnull", "isnotnull"],
  },
  {
    name: "createdOn",
    label: "Created On",
    type: "date",
    displayFormat: "date",
    operators: ["eq", "ne", "gt", "gte", "lt", "lte", "between", "isnull", "isnotnull"],
  },
  {
    name: "modifiedOn",
    label: "Modified On",
    type: "date",
    displayFormat: "datetime",
    operators: ["eq", "ne", "gt", "gte", "lt", "lte", "between", "isnull", "isnotnull"],
  },
  {
    name: "version",
    label: "Version",
    type: "numeric",
    operators: ["eq", "ne", "gt", "gte", "lt", "lte", "between", "in", "nin"],
  },
  {
    name: "engine",
    label: "Engine",
    type: "enum",
    enumOptions: [
      { value: "JSLT", label: "JSLT" },
      { value: "XSLT", label: "XSLT" },
      { value: "JSONata", label: "JSONata" },
    ],
    operators: ["eq", "ne", "in", "nin"],
  },
];

function CompoundDemo() {
  const [group, setGroup] = useState<FilterGroup>(() =>
    createGroup("and"),
  );
  const [applied, setApplied] = useState<FilterCondition[]>([]);

  const handleApply = (g: FilterGroup) => {
    setApplied(flattenToConditions(g));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
        <FilterChips
          filters={applied}
          fields={fields}
          onRemove={(idx) => setApplied((prev) => prev.filter((_, i) => i !== idx))}
          onClearAll={() => setApplied([])}
        />
        <CompoundFilterPanel
          fields={fields}
          value={group}
          onChange={setGroup}
          onApply={handleApply}
          maxDepth={3}
        />
      </div>
      <pre style={{ fontSize: "0.75rem", background: "#f5f5f5", padding: "1rem", borderRadius: "0.5rem" }}>
        {JSON.stringify(group, null, 2)}
      </pre>
    </div>
  );
}

const meta: Meta<typeof CompoundFilterPanel> = {
  title: "Components/CompoundFilterPanel",
  component: CompoundFilterPanel,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof CompoundFilterPanel>;

export const Interactive: Story = {
  render: () => <CompoundDemo />,
};

export const WithInitialGroups: Story = {
  render: () => {
    const initialGroup: FilterGroup = {
      logic: "and",
      conditions: [
        { field: "name", operator: "contains", value: "test" },
        {
          logic: "or",
          conditions: [
            { field: "status", operator: "eq", value: "active" },
            { field: "status", operator: "eq", value: "pending" },
          ],
        },
      ],
    };

    const [group, setGroup] = useState(initialGroup);

    return (
      <CompoundFilterPanel
        fields={fields}
        value={group}
        onChange={setGroup}
        onApply={(g) => alert(JSON.stringify(g, null, 2))}
      />
    );
  },
};

function OperatorAwareDemo() {
  const [group, setGroup] = useState<FilterGroup>(() => createGroup("and"));
  const [applied, setApplied] = useState<FilterCondition[]>([]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <p style={{ fontSize: "0.875rem", color: "#666", margin: 0 }}>
        Try selecting <strong>between</strong> on date/numeric fields (dual inputs),{" "}
        <strong>in/nin</strong> on text (tag input) or enum (multi-select),{" "}
        or <strong>isnull/isnotnull</strong> (hidden value input).
      </p>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
        <FilterChips
          filters={applied}
          fields={operatorAwareFields}
          onRemove={(idx) => setApplied((prev) => prev.filter((_, i) => i !== idx))}
          onClearAll={() => setApplied([])}
        />
        <CompoundFilterPanel
          fields={operatorAwareFields}
          value={group}
          onChange={setGroup}
          onApply={(g) => {
            setApplied(flattenToConditions(g));
          }}
          maxDepth={3}
        />
      </div>
      <pre style={{ fontSize: "0.75rem", background: "#f5f5f5", padding: "1rem", borderRadius: "0.5rem" }}>
        {JSON.stringify(group, null, 2)}
      </pre>
    </div>
  );
}

export const OperatorAwareFields: Story = {
  render: () => <OperatorAwareDemo />,
  name: "Operator-aware fields",
};
