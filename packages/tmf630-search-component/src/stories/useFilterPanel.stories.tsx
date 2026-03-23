import type { Meta, StoryObj } from "@storybook/react";
import { useFilterPanel } from "../useFilterPanel.js";
import type { FilterableField } from "../types.js";

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
