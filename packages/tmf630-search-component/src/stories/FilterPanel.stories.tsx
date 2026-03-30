import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { useState } from "react";
import { FilterPanel } from "../FilterPanel.js";
import { FilterChips } from "../FilterChips.js";
import type { FilterableField } from "../types.js";
import type { FilterCondition } from "@pia-team/pia-ui-tmf630-query-core";
import { OPERATOR_PRESETS } from "@pia-team/pia-ui-tmf630-query-core";

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
  args: {
    onApply: fn(),
  },
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

const configDrivenFields: FilterableField[] = [
  {
    name: "transformationId",
    label: "Transformation ID",
    type: "text",
    operators: OPERATOR_PRESETS["text-search"],
  },
  {
    name: "engine",
    label: "Engine",
    type: "enum",
    operators: OPERATOR_PRESETS["selection"],
    enumOptions: [
      { value: "JSLT", label: "JSLT" },
      { value: "JOLT", label: "JOLT" },
    ],
  },
  {
    name: "createdOn",
    label: "Created On",
    type: "date",
    operators: OPERATOR_PRESETS["date-range"],
  },
  {
    name: "modifiedOn",
    label: "Modified On",
    type: "date",
    operators: [...OPERATOR_PRESETS["date-range"], "isnull", "isnotnull"],
  },
  {
    name: "transformationVersion",
    label: "Version",
    type: "numeric",
    operators: OPERATOR_PRESETS["numeric"],
  },
  {
    name: "createdBy",
    label: "Created By",
    type: "text",
    operators: ["eq", "ne", "eqi", "nei", "in", "nin"],
  },
];

function ConfigDrivenTemplate() {
  const [appliedFilters, setApplied] = useState<FilterCondition[]>([]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ fontSize: "0.8rem", color: "#64748b", maxWidth: "36rem" }}>
        <strong>Config-driven fields</strong> — each field has an explicit{" "}
        <code>operators</code> array from preset or custom list.
        <br />
        &bull; <em>transformationId</em>: text-search preset
        <br />
        &bull; <em>engine</em>: selection preset (dropdown)
        <br />
        &bull; <em>modifiedOn</em>: date-range + isnull/isnotnull (nullable)
        <br />
        &bull; <em>createdBy</em>: explicit custom operators (text-exact)
      </div>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
        <FilterChips
          filters={appliedFilters}
          fields={configDrivenFields}
          onRemove={(idx) => setApplied((prev) => prev.filter((_, i) => i !== idx))}
          onClearAll={() => setApplied([])}
        />
        <FilterPanel
          fields={configDrivenFields}
          initialFilters={appliedFilters}
          onApply={setApplied}
          defaultFilter={{
            field: "transformationId",
            operator: "containsi",
            value: "",
          }}
        />
      </div>
    </div>
  );
}

export const ConfigDriven: Story = {
  render: () => <ConfigDrivenTemplate />,
};

/* ------------------------------------------------------------------ */
/*  Operator-Aware Inputs Story                                        */
/* ------------------------------------------------------------------ */

const operatorAwareFields: FilterableField[] = [
  { name: "name", label: "Name", type: "text" },
  {
    name: "createdOn",
    label: "Created On",
    type: "date",
    displayFormat: "date",
  },
  {
    name: "modifiedOn",
    label: "Modified On",
    type: "date",
    displayFormat: "datetime",
  },
  { name: "version", label: "Version", type: "numeric" },
  {
    name: "engine",
    label: "Engine",
    type: "enum",
    enumOptions: [
      { value: "JSLT", label: "JSLT" },
      { value: "JOLT", label: "JOLT" },
      { value: "XSL", label: "XSL" },
    ],
  },
  {
    name: "note",
    label: "Note",
    type: "text",
    operators: ["eq", "ne", "isnull", "isnotnull"],
  },
];

function OperatorAwareTemplate() {
  const [appliedFilters, setApplied] = useState<FilterCondition[]>([]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ fontSize: "0.8rem", color: "#64748b", maxWidth: "40rem" }}>
        <strong>Operator-aware inputs</strong> — the value input changes based on
        the selected operator:
        <br />
        &bull; <strong>between</strong>: two side-by-side inputs (From — To)
        <br />
        &bull; <strong>in / nin + enum</strong>: multi-select checkbox dropdown
        <br />
        &bull; <strong>in / nin + text/numeric</strong>: tag input (type + Enter)
        <br />
        &bull; <strong>isnull / isnotnull</strong>: no value input
        <br />
        &bull; <strong>Single-value operators</strong>: standard text / date / enum input
        <br /><br />
        Try: <em>Version → Between</em>, <em>Engine → In</em>, <em>Name → In</em>,{" "}
        <em>Note → Is Null</em>
      </div>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
        <FilterChips
          filters={appliedFilters}
          fields={operatorAwareFields}
          onRemove={(idx) => setApplied((prev) => prev.filter((_, i) => i !== idx))}
          onClearAll={() => setApplied([])}
        />
        <FilterPanel
          fields={operatorAwareFields}
          initialFilters={appliedFilters}
          onApply={setApplied}
          defaultFilter={{
            field: "name",
            operator: "containsi",
            value: "",
          }}
        />
      </div>
      {appliedFilters.length > 0 && (
        <pre style={{ fontSize: "0.7rem", background: "#f1f5f9", padding: "0.5rem", borderRadius: "0.5rem" }}>
          {JSON.stringify(appliedFilters, null, 2)}
        </pre>
      )}
    </div>
  );
}

export const OperatorAwareInputs: Story = {
  render: () => <OperatorAwareTemplate />,
};
