import type { Meta, StoryObj } from "@storybook/react";
import { useFilterPanel } from "../useFilterPanel.js";
import type { FilterableField } from "../types.js";
import { OPERATOR_PRESETS } from "@pia-team/pia-ui-tmf630-query-core";

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
    ],
  },
];

const operatorRestrictedFields: FilterableField[] = [
  { name: "name", label: "Name", type: "text", operators: OPERATOR_PRESETS["text-search"] },
  { name: "email", label: "Email", type: "text", operators: ["eq", "ne", "contains", "containsi", "in", "nin"] },
  { name: "createdDate", label: "Created Date", type: "date", operators: OPERATOR_PRESETS["date-range"] },
  { name: "modifiedDate", label: "Modified Date", type: "date", operators: [...OPERATOR_PRESETS["date-range"], "isnull", "isnotnull"] },
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
];

function HeadlessDemo() {
  const hook = useFilterPanel({
    fields,
    onApply: (filters) => alert(JSON.stringify(filters, null, 2)),
  });

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <h3>Headless Hook Demo</h3>
      <p>Build your own UI — the hook handles all logic.</p>

      <button onClick={hook.toggle} style={{ marginBottom: 8 }}>
        {hook.isOpen ? "Close Panel" : "Open Panel"}
      </button>

      {hook.isOpen && (
        <div style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
          {hook.filters.map((filter, i) => (
            <div key={filter._id} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <select
                value={filter.field}
                onChange={(e) =>
                  hook.updateFilter(i, { ...filter, field: e.target.value })
                }
              >
                <option value="">Field...</option>
                {fields.map((f) => (
                  <option key={f.name} value={f.name}>
                    {f.label}
                  </option>
                ))}
              </select>

              <select
                value={filter.operator}
                onChange={(e) =>
                  hook.updateFilter(i, { ...filter, operator: e.target.value as any })
                }
              >
                {hook.getFieldOperators(filter.field).map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.value}
                  </option>
                ))}
              </select>

              <input
                value={typeof filter.value === "string" ? filter.value : filter.value.join(", ")}
                onChange={(e) =>
                  hook.updateFilter(i, { ...filter, value: e.target.value })
                }
                placeholder="Value"
              />

              <button onClick={() => hook.removeFilter(i)}>x</button>
            </div>
          ))}

          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button onClick={hook.addFilter}>+ Add Filter</button>
            <button onClick={hook.apply} style={{ fontWeight: "bold" }}>
              Apply
            </button>
            <button onClick={hook.clearAll}>Clear All</button>
          </div>
        </div>
      )}
    </div>
  );
}

const meta: Meta = {
  title: "Hooks/useFilterPanel",
  parameters: { layout: "padded" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

export const HeadlessUsage: Story = {
  render: () => <HeadlessDemo />,
};

function OperatorRestrictedDemo() {
  const hook = useFilterPanel({
    fields: operatorRestrictedFields,
    onApply: (filters) => alert(JSON.stringify(filters, null, 2)),
    defaultFilter: { field: "name", operator: "containsi", value: "" },
  });

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <h3>Operator-Restricted Fields</h3>
      <p style={{ fontSize: "0.8rem", color: "#64748b" }}>
        Each field has an explicit <code>operators</code> list from preset or custom.
        <br />
        &bull; <em>Name</em>: text-search preset (full text ops)
        <br />
        &bull; <em>Email</em>: custom list (eq, ne, contains, containsi, in, nin)
        <br />
        &bull; <em>Modified Date</em>: date-range + isnull/isnotnull (nullable)
        <br />
        &bull; <em>Engine</em>: selection preset (eq, ne, in, nin) with dropdown
      </p>

      <button onClick={hook.toggle} style={{ marginBottom: 8 }}>
        {hook.isOpen ? "Close Panel" : "Open Panel"}
      </button>

      {hook.isOpen && (
        <div style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
          {hook.filters.map((filter, i) => {
            const fieldDef = operatorRestrictedFields.find((f) => f.name === filter.field);
            return (
              <div key={filter._id} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <select
                  value={filter.field}
                  onChange={(e) =>
                    hook.updateFilter(i, { ...filter, field: e.target.value })
                  }
                >
                  <option value="">Field...</option>
                  {operatorRestrictedFields.map((f) => (
                    <option key={f.name} value={f.name}>
                      {f.label}
                    </option>
                  ))}
                </select>

                <select
                  value={filter.operator}
                  onChange={(e) =>
                    hook.updateFilter(i, { ...filter, operator: e.target.value as any })
                  }
                >
                  {hook.getFieldOperators(filter.field).map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.value}
                    </option>
                  ))}
                </select>

                {fieldDef?.type === "enum" && fieldDef.enumOptions ? (
                  <select
                    value={typeof filter.value === "string" ? filter.value : ""}
                    onChange={(e) => hook.updateFilter(i, { ...filter, value: e.target.value })}
                  >
                    <option value="">Select...</option>
                    {fieldDef.enumOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={typeof filter.value === "string" ? filter.value : filter.value.join(", ")}
                    onChange={(e) =>
                      hook.updateFilter(i, { ...filter, value: e.target.value })
                    }
                    placeholder="Value"
                  />
                )}

                <button onClick={() => hook.removeFilter(i)}>x</button>
              </div>
            );
          })}

          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button onClick={hook.addFilter}>+ Add Filter</button>
            <button onClick={hook.apply} style={{ fontWeight: "bold" }}>
              Apply
            </button>
            <button onClick={hook.clearAll}>Clear All</button>
          </div>
        </div>
      )}
    </div>
  );
}

export const OperatorRestricted: Story = {
  render: () => <OperatorRestrictedDemo />,
};
