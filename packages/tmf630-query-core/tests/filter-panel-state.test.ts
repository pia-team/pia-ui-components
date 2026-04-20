import { describe, it, expect } from "vitest";
import {
  resolveDefaultRow,
  getFieldOperators,
  normalizeFilterRow,
  createFilterPanelState,
  addFilterRow,
  removeFilterRow,
  updateFilterRow,
  applyFilterRows,
  clearFilterRows,
  validateFilterRows,
  changeRowField,
  changeRowOperator,
  type FilterPanelField,
} from "../src/index.js";

const fields: FilterPanelField[] = [
  { name: "name", label: "Name", type: "text" },
  { name: "age", label: "Age", type: "numeric" },
  {
    name: "status",
    label: "Status",
    type: "enum",
    enumOptions: [
      { value: "ACTIVE", label: "Active" },
      { value: "INACTIVE", label: "Inactive" },
    ],
  },
  {
    name: "createdOn",
    label: "Created On",
    type: "date",
    displayFormat: "date",
    displayPattern: "dd/MM/yyyy",
  },
];

const restrictedFields: FilterPanelField[] = [
  { name: "email", label: "Email", type: "text", operators: ["eq", "ne", "in"] },
  { name: "engine", label: "Engine", type: "enum", operators: ["eq", "ne"] },
];

/* ------------------------------------------------------------------ */
/*  resolveDefaultRow                                                  */
/* ------------------------------------------------------------------ */

describe("resolveDefaultRow", () => {
  it("returns default filter when field exists in fields list", () => {
    const result = resolveDefaultRow(
      { field: "age", operator: "gte", value: "18" },
      fields,
    );
    expect(result).toEqual({ field: "age", operator: "gte", value: "18" });
  });

  it("falls back to first field when default field is invalid", () => {
    const result = resolveDefaultRow(
      { field: "nonexistent", operator: "eq", value: "" },
      fields,
    );
    expect(result.field).toBe("name");
    expect(result.operator).toBe("eq");
  });

  it("falls back to first field when no default is provided", () => {
    const result = resolveDefaultRow(undefined, fields);
    expect(result.field).toBe("name");
  });

  it("returns empty filter when fields list is empty and no default", () => {
    const result = resolveDefaultRow(undefined, []);
    expect(result.field).toBe("");
  });
});

/* ------------------------------------------------------------------ */
/*  getFieldOperators                                                  */
/* ------------------------------------------------------------------ */

describe("getFieldOperators", () => {
  it("returns all operators for a field type", () => {
    const ops = getFieldOperators("name", fields);
    expect(ops.some((o) => o.value === "contains")).toBe(true);
    expect(ops.some((o) => o.value === "eq")).toBe(true);
  });

  it("returns numeric operators for numeric field", () => {
    const ops = getFieldOperators("age", fields);
    expect(ops.some((o) => o.value === "gte")).toBe(true);
    expect(ops.some((o) => o.value === "contains")).toBe(false);
  });

  it("respects operators allowlist on field definition", () => {
    const ops = getFieldOperators("email", restrictedFields);
    expect(ops.map((o) => o.value)).toEqual(
      expect.arrayContaining(["eq", "ne", "in"]),
    );
    expect(ops.some((o) => o.value === "contains")).toBe(false);
  });

  it("returns default text operators for unknown field", () => {
    const ops = getFieldOperators("unknown", fields);
    expect(ops.some((o) => o.value === "eq")).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/*  normalizeFilterRow                                                 */
/* ------------------------------------------------------------------ */

describe("normalizeFilterRow", () => {
  const fallback = { field: "name", operator: "eq" as const, value: "" };

  it("returns the same filter when field and operator are valid", () => {
    const f = { field: "name", operator: "eq" as const, value: "test" };
    const result = normalizeFilterRow(f, fields, fallback);
    expect(result).toBe(f);
  });

  it("corrects invalid field to fallback field", () => {
    const f = { field: "invalid", operator: "eq" as const, value: "x" };
    const result = normalizeFilterRow(f, fields, fallback);
    expect(result.field).toBe("name");
  });

  it("corrects invalid operator to fallback operator", () => {
    const f = { field: "age", operator: "contains" as any, value: "5" };
    const result = normalizeFilterRow(f, fields, fallback);
    expect(result.field).toBe("age");
    expect(result.operator).not.toBe("contains");
  });
});

/* ------------------------------------------------------------------ */
/*  createFilterPanelState                                             */
/* ------------------------------------------------------------------ */

describe("createFilterPanelState", () => {
  it("creates state with initial filters", () => {
    const state = createFilterPanelState([
      { field: "name", operator: "eq", value: "John" },
      { field: "age", operator: "gte", value: "18" },
    ]);
    expect(state.rows).toHaveLength(2);
    expect(state.rows[0].field).toBe("name");
    expect(state.rows[1].field).toBe("age");
    expect(state.errors.size).toBe(0);
  });

  it("creates state with default row when no initial filters", () => {
    const defaultRow = { field: "name", operator: "eq" as const, value: "" };
    const state = createFilterPanelState([], defaultRow);
    expect(state.rows).toHaveLength(1);
    expect(state.rows[0].field).toBe("name");
  });

  it("assigns unique ids to each row", () => {
    const state = createFilterPanelState([
      { field: "name", operator: "eq", value: "a" },
      { field: "age", operator: "eq", value: "1" },
    ]);
    expect(state.rows[0].id).not.toBe(state.rows[1].id);
  });
});

/* ------------------------------------------------------------------ */
/*  addFilterRow / removeFilterRow                                     */
/* ------------------------------------------------------------------ */

describe("addFilterRow", () => {
  it("adds a new row to the state", () => {
    const defaultRow = { field: "name", operator: "eq" as const, value: "" };
    const state = createFilterPanelState([defaultRow]);
    const next = addFilterRow(state, defaultRow);
    expect(next.rows).toHaveLength(2);
  });
});

describe("removeFilterRow", () => {
  const defaultRow = { field: "name", operator: "eq" as const, value: "" };

  it("removes a row at the given index", () => {
    const state = createFilterPanelState([
      { field: "name", operator: "eq", value: "a" },
      { field: "age", operator: "gte", value: "18" },
    ]);
    const next = removeFilterRow(state, 0, defaultRow);
    expect(next.rows).toHaveLength(1);
    expect(next.rows[0].field).toBe("age");
  });

  it("never goes below 1 row — replaces with default", () => {
    const state = createFilterPanelState([defaultRow]);
    const next = removeFilterRow(state, 0, defaultRow);
    expect(next.rows).toHaveLength(1);
    expect(next.rows[0].field).toBe("name");
  });
});

/* ------------------------------------------------------------------ */
/*  updateFilterRow                                                    */
/* ------------------------------------------------------------------ */

describe("updateFilterRow", () => {
  it("updates a row while preserving its id", () => {
    const state = createFilterPanelState([
      { field: "name", operator: "eq", value: "" },
    ]);
    const originalId = state.rows[0].id;
    const next = updateFilterRow(state, 0, {
      field: "age",
      operator: "gte",
      value: "18",
    });
    expect(next.rows[0].field).toBe("age");
    expect(next.rows[0].operator).toBe("gte");
    expect(next.rows[0].value).toBe("18");
    expect(next.rows[0].id).toBe(originalId);
  });
});

/* ------------------------------------------------------------------ */
/*  applyFilterRows                                                    */
/* ------------------------------------------------------------------ */

describe("applyFilterRows", () => {
  it("returns active filters, skipping empty values", () => {
    const state = createFilterPanelState([
      { field: "name", operator: "eq", value: "John" },
      { field: "age", operator: "eq", value: "" },
    ]);
    const result = applyFilterRows(state);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ field: "name", operator: "eq", value: "John" });
  });

  it("keeps isnull operator even with empty value", () => {
    const state = createFilterPanelState([
      { field: "name", operator: "isnull", value: "" },
    ]);
    const result = applyFilterRows(state);
    expect(result).toHaveLength(1);
    expect(result[0].operator).toBe("isnull");
  });

  it("keeps between filter with array values", () => {
    const state = createFilterPanelState([
      { field: "age", operator: "between", value: ["10", "30"] },
    ]);
    const result = applyFilterRows(state);
    expect(result).toHaveLength(1);
    expect(result[0].value).toEqual(["10", "30"]);
  });

  it("skips array values where all entries are empty", () => {
    const state = createFilterPanelState([
      { field: "name", operator: "in", value: ["", ""] },
    ]);
    const result = applyFilterRows(state);
    expect(result).toHaveLength(0);
  });
});

/* ------------------------------------------------------------------ */
/*  clearFilterRows                                                    */
/* ------------------------------------------------------------------ */

describe("clearFilterRows", () => {
  it("resets to a single default row with no errors", () => {
    const defaultRow = { field: "name", operator: "eq" as const, value: "" };
    const state = clearFilterRows(defaultRow);
    expect(state.rows).toHaveLength(1);
    expect(state.rows[0].field).toBe("name");
    expect(state.errors.size).toBe(0);
  });
});

/* ------------------------------------------------------------------ */
/*  validateFilterRows                                                 */
/* ------------------------------------------------------------------ */

describe("validateFilterRows", () => {
  it("returns empty map when all rows are valid", () => {
    const state = createFilterPanelState([
      { field: "name", operator: "eq", value: "test" },
    ]);
    const errors = validateFilterRows(state, fields);
    expect(errors.size).toBe(0);
  });

  it("returns errors from global validate function", () => {
    const state = createFilterPanelState([
      { field: "name", operator: "eq", value: "x" },
    ]);
    const errors = validateFilterRows(state, fields, () => "Required");
    expect(errors.size).toBe(1);
  });

  it("returns errors from field-level validate function", () => {
    const fieldsWithValidation: FilterPanelField[] = [
      {
        name: "age",
        label: "Age",
        type: "numeric",
        validate: (v) => (Number(v) < 0 ? "Must be positive" : null),
      },
    ];
    const state = createFilterPanelState([
      { field: "age", operator: "eq", value: "-1" },
    ]);
    const errors = validateFilterRows(state, fieldsWithValidation);
    expect(errors.size).toBe(1);
    expect([...errors.values()][0]).toBe("Must be positive");
  });
});

/* ------------------------------------------------------------------ */
/*  changeRowField                                                     */
/* ------------------------------------------------------------------ */

describe("changeRowField", () => {
  it("changes field and keeps operator when still valid", () => {
    const state = createFilterPanelState([
      { field: "name", operator: "eq", value: "test" },
    ]);
    const next = changeRowField(state, 0, "age", fields);
    expect(next.rows[0].field).toBe("age");
    expect(next.rows[0].operator).toBe("eq");
    expect(next.rows[0].value).toBe("test");
  });

  it("resets operator and value when operator is not valid for new field", () => {
    const state = createFilterPanelState([
      { field: "name", operator: "contains", value: "test" },
    ]);
    const next = changeRowField(state, 0, "age", fields);
    expect(next.rows[0].field).toBe("age");
    expect(next.rows[0].operator).not.toBe("contains");
    expect(next.rows[0].value).toBe("");
  });

  it("preserves row id after field change", () => {
    const state = createFilterPanelState([
      { field: "name", operator: "eq", value: "" },
    ]);
    const originalId = state.rows[0].id;
    const next = changeRowField(state, 0, "age", fields);
    expect(next.rows[0].id).toBe(originalId);
  });

  it("does nothing for invalid index", () => {
    const state = createFilterPanelState([
      { field: "name", operator: "eq", value: "" },
    ]);
    const next = changeRowField(state, 5, "age", fields);
    expect(next).toBe(state);
  });
});

/* ------------------------------------------------------------------ */
/*  changeRowOperator                                                  */
/* ------------------------------------------------------------------ */

describe("changeRowOperator", () => {
  it("changes operator and preserves single value", () => {
    const state = createFilterPanelState([
      { field: "name", operator: "eq", value: "test" },
    ]);
    const next = changeRowOperator(state, 0, "ne", fields);
    expect(next.rows[0].operator).toBe("ne");
    expect(next.rows[0].value).toBe("test");
  });

  it("converts single value to array when switching to multi-value operator", () => {
    const state = createFilterPanelState([
      { field: "name", operator: "eq", value: "hello" },
    ]);
    const next = changeRowOperator(state, 0, "in", fields);
    expect(next.rows[0].operator).toBe("in");
    expect(Array.isArray(next.rows[0].value)).toBe(true);
    expect((next.rows[0].value as string[])[0]).toBe("hello");
  });

  it("converts array value to single when switching from multi-value", () => {
    const state = createFilterPanelState([
      { field: "name", operator: "in", value: ["hello", "world"] },
    ]);
    const next = changeRowOperator(state, 0, "eq", fields);
    expect(next.rows[0].operator).toBe("eq");
    expect(next.rows[0].value).toBe("hello");
  });

  it("preserves value for isnull operator", () => {
    const state = createFilterPanelState([
      { field: "name", operator: "eq", value: "test" },
    ]);
    const next = changeRowOperator(state, 0, "isnull", fields);
    expect(next.rows[0].operator).toBe("isnull");
    expect(next.rows[0].value).toBe("test");
  });

  it("preserves row id after operator change", () => {
    const state = createFilterPanelState([
      { field: "name", operator: "eq", value: "" },
    ]);
    const originalId = state.rows[0].id;
    const next = changeRowOperator(state, 0, "ne", fields);
    expect(next.rows[0].id).toBe(originalId);
  });
});

/* ------------------------------------------------------------------ */
/*  FilterPanelField type compatibility with SearchableField           */
/* ------------------------------------------------------------------ */

describe("FilterPanelField type compatibility", () => {
  it("accepts fields with enumOptions", () => {
    const enumFields: FilterPanelField[] = [
      {
        name: "status",
        label: "Status",
        type: "enum",
        enumOptions: [
          { value: "ACTIVE", label: "Active" },
          { value: "INACTIVE", label: "Inactive" },
        ],
      },
    ];
    const ops = getFieldOperators("status", enumFields);
    expect(ops.some((o) => o.value === "eq")).toBe(true);
  });

  it("accepts fields with displayFormat and displayPattern", () => {
    const dateFields: FilterPanelField[] = [
      {
        name: "createdOn",
        label: "Created",
        type: "date",
        displayFormat: "date",
        displayPattern: "dd/MM/yyyy",
        responseDisplayFormat: "date",
      },
    ];
    const state = createFilterPanelState([
      { field: "createdOn", operator: "eq", value: "2026-01-01" },
    ]);
    const result = applyFilterRows(state);
    expect(result).toHaveLength(1);
    expect(dateFields[0].displayFormat).toBe("date");
    expect(dateFields[0].displayPattern).toBe("dd/MM/yyyy");
    expect(dateFields[0].responseDisplayFormat).toBe("date");
  });
});
