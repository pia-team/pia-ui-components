import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FilterRow } from "../src/FilterRow.js";
import type { FilterableField, Labels, FilterRowSlots } from "../src/types.js";

const labels: Labels = {
  title: "Filters",
  addFilter: "Add filter",
  apply: "Apply",
  clearAll: "Clear all",
  activeFilters: "Active",
  removeFilter: "Remove filter",
  operators: {
    eq: "Equals",
    ne: "Not equals",
    gt: "Greater than",
    gte: "Greater or equal",
    lt: "Less than",
    lte: "Less or equal",
    between: "Between",
    in: "In",
    nin: "Not in",
    isnull: "Is null",
    isnotnull: "Is not null",
    contains: "Contains",
    containsi: "Contains (case-insensitive)",
  },
};

const fields: FilterableField[] = [
  { name: "name", label: "Name", type: "text" },
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
    ],
    operators: ["eq", "ne", "in", "nin"],
  },
  {
    name: "createdOn",
    label: "Created On",
    type: "date",
    displayFormat: "date",
    operators: ["eq", "ne", "gt", "gte", "lt", "lte", "between", "isnull", "isnotnull"],
  },
];

const nativeSlots: FilterRowSlots = {
  fieldSelect: ({ value, options, onChange }) => (
    <select
      data-testid="field-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Field</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  ),
  operatorSelect: ({ value, options, onChange }) => (
    <select
      data-testid="operator-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Operator</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  ),
};

describe("FilterRow — operator-aware value inputs", () => {
  it("renders a single text input for eq operator", () => {
    const onUpdate = vi.fn();
    render(
      <FilterRow
        filter={{ field: "name", operator: "eq", value: "" }}
        index={0}
        fields={fields}
        labels={labels}
        onUpdate={onUpdate}
        onRemove={vi.fn()}
        slots={nativeSlots}
      />,
    );
    expect(screen.getByLabelText("Filter value")).toBeTruthy();
    expect(screen.getByLabelText("Filter value").tagName).toBe("INPUT");
  });

  it("renders BetweenValueInput for between operator", () => {
    render(
      <FilterRow
        filter={{ field: "version", operator: "between", value: ["1", "10"] }}
        index={0}
        fields={fields}
        labels={labels}
        onUpdate={vi.fn()}
        onRemove={vi.fn()}
        slots={nativeSlots}
      />,
    );
    expect(document.querySelector('[data-slot="between-input"]')).toBeTruthy();
    const inputs = document.querySelectorAll('[data-slot="between-input"] input');
    expect(inputs).toHaveLength(2);
  });

  it("renders TagValueInput for in operator on text field", () => {
    render(
      <FilterRow
        filter={{ field: "name", operator: "in", value: ["Alice", "Bob"] }}
        index={0}
        fields={fields}
        labels={labels}
        onUpdate={vi.fn()}
        onRemove={vi.fn()}
        slots={nativeSlots}
      />,
    );
    expect(document.querySelector('[data-slot="tag-value-input"]')).toBeTruthy();
    expect(screen.getByText("Alice")).toBeTruthy();
    expect(screen.getByText("Bob")).toBeTruthy();
  });

  it("renders MultiSelectInput for in operator on enum field", () => {
    render(
      <FilterRow
        filter={{ field: "engine", operator: "in", value: ["JSLT"] }}
        index={0}
        fields={fields}
        labels={labels}
        onUpdate={vi.fn()}
        onRemove={vi.fn()}
        slots={nativeSlots}
      />,
    );
    expect(document.querySelector('[data-slot="multi-select-input"]')).toBeTruthy();
  });

  it("hides value input for isnull operator", () => {
    render(
      <FilterRow
        filter={{ field: "createdOn", operator: "isnull", value: "" }}
        index={0}
        fields={fields}
        labels={labels}
        onUpdate={vi.fn()}
        onRemove={vi.fn()}
        slots={nativeSlots}
      />,
    );
    expect(screen.queryByLabelText("Filter value")).toBeNull();
    expect(document.querySelector('[data-slot="between-input"]')).toBeNull();
    expect(document.querySelector('[data-slot="tag-value-input"]')).toBeNull();
    expect(document.querySelector('[data-slot="multi-select-input"]')).toBeNull();
  });

  it("initializes between value as two-element array on operator change", () => {
    const onUpdate = vi.fn();
    render(
      <FilterRow
        filter={{ field: "version", operator: "eq", value: "5" }}
        index={0}
        fields={fields}
        labels={labels}
        onUpdate={onUpdate}
        onRemove={vi.fn()}
        slots={nativeSlots}
      />,
    );
    const operatorSelect = screen.getByTestId("operator-select");
    fireEvent.change(operatorSelect, { target: { value: "between" } });

    expect(onUpdate).toHaveBeenCalledWith(0, {
      field: "version",
      operator: "between",
      value: ["", ""],
    });
  });

  it("initializes in value as empty array on operator change", () => {
    const onUpdate = vi.fn();
    render(
      <FilterRow
        filter={{ field: "name", operator: "eq", value: "test" }}
        index={0}
        fields={fields}
        labels={labels}
        onUpdate={onUpdate}
        onRemove={vi.fn()}
        slots={nativeSlots}
      />,
    );
    const operatorSelect = screen.getByTestId("operator-select");
    fireEvent.change(operatorSelect, { target: { value: "in" } });

    expect(onUpdate).toHaveBeenCalledWith(0, {
      field: "name",
      operator: "in",
      value: [],
    });
  });

  it("clears value when switching to isnull", () => {
    const onUpdate = vi.fn();
    render(
      <FilterRow
        filter={{ field: "createdOn", operator: "eq", value: "2026-01-01" }}
        index={0}
        fields={fields}
        labels={labels}
        onUpdate={onUpdate}
        onRemove={vi.fn()}
        slots={nativeSlots}
      />,
    );
    const operatorSelect = screen.getByTestId("operator-select");
    fireEvent.change(operatorSelect, { target: { value: "isnull" } });

    expect(onUpdate).toHaveBeenCalledWith(0, {
      field: "createdOn",
      operator: "isnull",
      value: "",
    });
  });

  it("renders number input for numeric field with eq operator", () => {
    render(
      <FilterRow
        filter={{ field: "version", operator: "eq", value: "" }}
        index={0}
        fields={fields}
        labels={labels}
        onUpdate={vi.fn()}
        onRemove={vi.fn()}
        slots={nativeSlots}
      />,
    );
    const input = screen.getByLabelText("Filter value");
    expect(input).toHaveAttribute("type", "number");
  });

  it("renders TagValueInput with number inputType for in on numeric field", () => {
    render(
      <FilterRow
        filter={{ field: "version", operator: "in", value: [] }}
        index={0}
        fields={fields}
        labels={labels}
        onUpdate={vi.fn()}
        onRemove={vi.fn()}
        slots={nativeSlots}
      />,
    );
    expect(document.querySelector('[data-slot="tag-value-input"]')).toBeTruthy();
    const tagInput = document.querySelector('[data-slot="tag-input"]');
    expect(tagInput).toHaveAttribute("type", "number");
  });
});
