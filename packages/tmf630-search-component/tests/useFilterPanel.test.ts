import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFilterPanel } from "../src/useFilterPanel.js";
import type { FilterableField } from "../src/types.js";

const fields: FilterableField[] = [
  { name: "name", label: "Name", type: "text" },
  { name: "age", label: "Age", type: "numeric" },
  { name: "status", label: "Status", type: "enum", enumOptions: [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ] },
];

describe("useFilterPanel", () => {
  it("initializes with default filter", () => {
    const { result } = renderHook(() =>
      useFilterPanel({ fields }),
    );
    expect(result.current.filters).toHaveLength(1);
    expect(result.current.filters[0].field).toBe("name");
  });

  it("starts closed", () => {
    const { result } = renderHook(() =>
      useFilterPanel({ fields }),
    );
    expect(result.current.isOpen).toBe(false);
  });

  it("toggles open/close", () => {
    const { result } = renderHook(() =>
      useFilterPanel({ fields }),
    );
    act(() => result.current.toggle());
    expect(result.current.isOpen).toBe(true);
    act(() => result.current.toggle());
    expect(result.current.isOpen).toBe(false);
  });

  it("adds and removes filters", () => {
    const { result } = renderHook(() =>
      useFilterPanel({ fields }),
    );
    act(() => result.current.addFilter());
    expect(result.current.filters).toHaveLength(2);
    act(() => result.current.removeFilter(0));
    expect(result.current.filters).toHaveLength(1);
  });

  it("never goes below 1 filter on remove", () => {
    const { result } = renderHook(() =>
      useFilterPanel({ fields }),
    );
    expect(result.current.filters).toHaveLength(1);
    act(() => result.current.removeFilter(0));
    expect(result.current.filters).toHaveLength(1);
  });

  it("updates a filter", () => {
    const { result } = renderHook(() =>
      useFilterPanel({ fields }),
    );
    act(() =>
      result.current.updateFilter(0, {
        field: "age",
        operator: "gte",
        value: "18",
      }),
    );
    expect(result.current.filters[0].field).toBe("age");
    expect(result.current.filters[0].operator).toBe("gte");
    expect(result.current.filters[0].value).toBe("18");
  });

  it("calls onApply with active filters", () => {
    const onApply = vi.fn();
    const { result } = renderHook(() =>
      useFilterPanel({
        fields,
        onApply,
        initialFilters: [{ field: "name", operator: "eq", value: "John" }],
      }),
    );
    act(() => result.current.apply());
    expect(onApply).toHaveBeenCalledWith([
      { field: "name", operator: "eq", value: "John" },
    ]);
  });

  it("skips filters with empty values on apply", () => {
    const onApply = vi.fn();
    const { result } = renderHook(() =>
      useFilterPanel({ fields, onApply }),
    );
    act(() => result.current.apply());
    expect(onApply).toHaveBeenCalledWith([]);
  });

  it("calls event callbacks", () => {
    const onFilterAdd = vi.fn();
    const onFilterRemove = vi.fn();
    const onFilterChange = vi.fn();
    const { result } = renderHook(() =>
      useFilterPanel({
        fields,
        onFilterAdd,
        onFilterRemove,
        onFilterChange,
      }),
    );
    act(() => result.current.addFilter());
    expect(onFilterAdd).toHaveBeenCalled();

    act(() =>
      result.current.updateFilter(0, { field: "age", operator: "eq", value: "5" }),
    );
    expect(onFilterChange).toHaveBeenCalledWith(0, expect.objectContaining({ field: "age" }));

    act(() => result.current.removeFilter(0));
    expect(onFilterRemove).toHaveBeenCalled();
  });

  it("supports controlled open state", () => {
    const onOpenChange = vi.fn();
    const { result } = renderHook(() =>
      useFilterPanel({ fields, open: false, onOpenChange }),
    );
    expect(result.current.isOpen).toBe(false);
    act(() => result.current.open());
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("validates filters on apply", () => {
    const onApply = vi.fn();
    const validate = vi.fn(() => "Required");
    const { result } = renderHook(() =>
      useFilterPanel({
        fields,
        onApply,
        validate,
        initialFilters: [{ field: "name", operator: "eq", value: "x" }],
      }),
    );
    act(() => result.current.apply());
    expect(validate).toHaveBeenCalled();
    expect(onApply).not.toHaveBeenCalled();
    expect(result.current.errors.size).toBe(1);
  });

  it("clearAll resets filters and calls onApply with empty", () => {
    const onApply = vi.fn();
    const { result } = renderHook(() =>
      useFilterPanel({
        fields,
        onApply,
        initialFilters: [
          { field: "name", operator: "eq", value: "John" },
          { field: "age", operator: "gte", value: "18" },
        ],
      }),
    );
    expect(result.current.filters).toHaveLength(2);
    act(() => result.current.clearAll());
    expect(result.current.filters).toHaveLength(1);
    expect(onApply).toHaveBeenCalledWith([]);
  });

  it("getFieldOperators returns correct operators", () => {
    const { result } = renderHook(() =>
      useFilterPanel({ fields }),
    );
    const textOps = result.current.getFieldOperators("name");
    expect(textOps.some((o) => o.value === "contains")).toBe(true);

    const numOps = result.current.getFieldOperators("age");
    expect(numOps.some((o) => o.value === "gte")).toBe(true);
    expect(numOps.some((o) => o.value === "contains")).toBe(false);
  });

  it("getFieldOperators respects operators allowlist on fields", () => {
    const restrictedFields: FilterableField[] = [
      { name: "email", label: "Email", type: "text", operators: ["eq", "ne", "in"] },
      { name: "engine", label: "Engine", type: "enum", operators: ["eq", "ne"], enumOptions: [
        { value: "JSLT", label: "JSLT" },
      ] },
    ];
    const { result } = renderHook(() =>
      useFilterPanel({ fields: restrictedFields }),
    );
    const emailOps = result.current.getFieldOperators("email");
    expect(emailOps.map((o) => o.value)).toEqual(expect.arrayContaining(["eq", "ne", "in"]));
    expect(emailOps.some((o) => o.value === "contains")).toBe(false);
    expect(emailOps.some((o) => o.value === "gte")).toBe(false);

    const engineOps = result.current.getFieldOperators("engine");
    expect(engineOps.map((o) => o.value)).toEqual(["eq", "ne"]);
    expect(engineOps.some((o) => o.value === "in")).toBe(false);
  });

  it("applies isnull operator without value", () => {
    const onApply = vi.fn();
    const nullableFields: FilterableField[] = [
      { name: "note", label: "Note", type: "text", operators: ["eq", "isnull", "isnotnull"] },
    ];
    const { result } = renderHook(() =>
      useFilterPanel({
        fields: nullableFields,
        onApply,
        initialFilters: [{ field: "note", operator: "isnull", value: "" }],
      }),
    );
    act(() => result.current.apply());
    expect(onApply).toHaveBeenCalledWith([
      { field: "note", operator: "isnull", value: "" },
    ]);
  });

  it("applies between filter with array of 2 values", () => {
    const onApply = vi.fn();
    const { result } = renderHook(() =>
      useFilterPanel({
        fields,
        onApply,
        initialFilters: [{ field: "age", operator: "between", value: ["10", "30"] }],
      }),
    );
    act(() => result.current.apply());
    expect(onApply).toHaveBeenCalledWith([
      { field: "age", operator: "between", value: ["10", "30"] },
    ]);
  });

  it("applies in filter with array of values", () => {
    const onApply = vi.fn();
    const { result } = renderHook(() =>
      useFilterPanel({
        fields,
        onApply,
        initialFilters: [{ field: "name", operator: "in", value: ["Alice", "Bob"] }],
      }),
    );
    act(() => result.current.apply());
    expect(onApply).toHaveBeenCalledWith([
      { field: "name", operator: "in", value: ["Alice", "Bob"] },
    ]);
  });

  it("applies nin filter with enum array values", () => {
    const onApply = vi.fn();
    const { result } = renderHook(() =>
      useFilterPanel({
        fields,
        onApply,
        initialFilters: [{ field: "status", operator: "nin", value: ["active"] }],
      }),
    );
    act(() => result.current.apply());
    expect(onApply).toHaveBeenCalledWith([
      { field: "status", operator: "nin", value: ["active"] },
    ]);
  });

  /* ------------------------------------------------------------------ */
  /*  changeField / changeOperator                                       */
  /* ------------------------------------------------------------------ */

  it("changeField — keeps operator when valid for new field type", () => {
    const { result } = renderHook(() =>
      useFilterPanel({
        fields,
        initialFilters: [{ field: "name", operator: "eq", value: "Alice" }],
      }),
    );
    act(() => result.current.changeField(0, "age"));
    expect(result.current.filters[0].field).toBe("age");
    expect(result.current.filters[0].operator).toBe("eq");
  });

  it("changeField — auto-corrects operator when invalid for new field type", () => {
    const { result } = renderHook(() =>
      useFilterPanel({
        fields,
        initialFilters: [{ field: "name", operator: "contains", value: "foo" }],
      }),
    );
    act(() => result.current.changeField(0, "age"));
    expect(result.current.filters[0].field).toBe("age");
    expect(result.current.filters[0].operator).not.toBe("contains");
  });

  it("changeOperator — single to multi-value (in) converts value to array", () => {
    const { result } = renderHook(() =>
      useFilterPanel({
        fields,
        initialFilters: [{ field: "name", operator: "eq", value: "Alice" }],
      }),
    );
    act(() => result.current.changeOperator(0, "in"));
    expect(result.current.filters[0].operator).toBe("in");
    const val = result.current.filters[0].value;
    expect(Array.isArray(val)).toBe(true);
    expect(val).toContain("Alice");
  });

  it("changeOperator — multi to single (eq) converts array to string", () => {
    const { result } = renderHook(() =>
      useFilterPanel({
        fields,
        initialFilters: [{ field: "name", operator: "in", value: ["Alice", "Bob"] }],
      }),
    );
    act(() => result.current.changeOperator(0, "eq"));
    expect(result.current.filters[0].operator).toBe("eq");
    expect(typeof result.current.filters[0].value).toBe("string");
  });

  it("changeField / changeOperator — triggers onFilterChange callback", () => {
    const onFilterChange = vi.fn();
    const { result } = renderHook(() =>
      useFilterPanel({
        fields,
        onFilterChange,
        initialFilters: [{ field: "name", operator: "eq", value: "x" }],
      }),
    );
    act(() => result.current.changeField(0, "age"));
    expect(onFilterChange).toHaveBeenCalledWith(
      0,
      expect.objectContaining({ field: "age" }),
    );
    onFilterChange.mockClear();
    act(() => result.current.changeOperator(0, "gte"));
    expect(onFilterChange).toHaveBeenCalledWith(
      0,
      expect.objectContaining({ operator: "gte" }),
    );
  });
});
