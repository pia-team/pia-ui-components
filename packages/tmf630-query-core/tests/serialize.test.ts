import { describe, it, expect } from "vitest";
import { serializeFilters, normalizeDateToISO, normalizeDateTimeForDisplay, formatDateValue, getLocalTimezoneOffset } from "../src/serialize.js";
import { deserializeFilters } from "../src/deserialize.js";
import type { FilterCondition } from "../src/types.js";
import type { FieldConfig } from "../src/config.js";

const TZ = getLocalTimezoneOffset();

function makeTextConfig(name: string): FieldConfig {
  return {
    name, type: "text", displayName: name, displayFormat: null,
    displayPattern: null, values: null, defaultOperator: null, validation: null,
    operators: [], nullable: false,
  };
}

function makeDateConfig(name: string, type: FieldConfig["type"] = "offsetDateTime", displayFormat: FieldConfig["displayFormat"] = "datetime"): FieldConfig {
  return {
    name, type, displayName: name, displayFormat,
    displayPattern: null, values: null, defaultOperator: null, validation: null,
    operators: [], nullable: false,
  };
}

const EMPTY_OPTS = { fieldConfigs: [] as FieldConfig[] };

describe("serializeFilters", () => {
  it("serializes simple eq filter", () => {
    const filters: FilterCondition[] = [
      { field: "name", operator: "eq", value: "test" },
    ];
    expect(serializeFilters(filters, { fieldConfigs: [makeTextConfig("name")] })).toEqual({ "name.eq": "test" });
  });

  it("skips filters with empty value", () => {
    const filters: FilterCondition[] = [
      { field: "name", operator: "eq", value: "" },
    ];
    expect(serializeFilters(filters, EMPTY_OPTS)).toEqual({});
  });

  it("skips filters with empty field", () => {
    const filters: FilterCondition[] = [
      { field: "", operator: "eq", value: "test" },
    ];
    expect(serializeFilters(filters, EMPTY_OPTS)).toEqual({});
  });

  it("serializes isnull without value", () => {
    const filters: FilterCondition[] = [
      { field: "name", operator: "isnull", value: "" },
    ];
    expect(serializeFilters(filters, EMPTY_OPTS)).toEqual({ "name.isnull": "true" });
  });

  it("serializes multi-value operators as arrays", () => {
    const filters: FilterCondition[] = [
      { field: "status", operator: "in", value: ["active", "pending"] },
    ];
    expect(serializeFilters(filters, { fieldConfigs: [makeTextConfig("status")] })).toEqual({
      "status.in": ["active", "pending"],
    });
  });

  it("expands date eq to gte/lt range for date displayFormat with instant type", () => {
    const filters: FilterCondition[] = [
      { field: "createdOn", operator: "eq", value: "2026-01-15" },
    ];
    const result = serializeFilters(filters, {
      fieldConfigs: [makeDateConfig("createdOn", "instant", "date")],
    });
    expect(result["createdOn.gte"]).toBeDefined();
    expect(result["createdOn.lt"]).toBeDefined();
  });

  it("expands date eq to gte/lt range for date displayFormat with offsetDateTime", () => {
    const filters: FilterCondition[] = [
      { field: "createdOn", operator: "eq", value: "2026-01-15" },
    ];
    const result = serializeFilters(filters, {
      fieldConfigs: [makeDateConfig("createdOn", "offsetDateTime", "date")],
    });
    expect(result["createdOn.gte"]).toMatch(/^2026-01-15T00:00:00[Z+-]/);
    expect(result["createdOn.lt"]).toMatch(/^2026-01-16T00:00:00[Z+-]/);
  });

  it("serializes datetime with time using formatDateValue for offsetDateTime", () => {
    const filters: FilterCondition[] = [
      { field: "createdOn", operator: "gte", value: "2026-01-15 14:30" },
    ];
    const result = serializeFilters(filters, {
      fieldConfigs: [makeDateConfig("createdOn", "offsetDateTime", "datetime")],
    });
    expect(result["createdOn.gte"]).toMatch(/^2026-01-15T14:30:00[Z+-]/);
  });

  it("translates gt to gte(nextDay) for date displayFormat", () => {
    const filters: FilterCondition[] = [
      { field: "createdOn", operator: "gt", value: "2026-01-15" },
    ];
    const result = serializeFilters(filters, {
      fieldConfigs: [makeDateConfig("createdOn", "offsetDateTime", "date")],
    });
    expect(result["createdOn.gte"]).toMatch(/^2026-01-16T00:00:00/);
  });

  it("maps enum displayName to serverValue", () => {
    const enumConfig: FieldConfig = {
      name: "engine", type: "enum", displayName: "Engine", displayFormat: null,
      displayPattern: null, defaultOperator: null, validation: null,
      operators: [], nullable: false,
      values: [
        { displayName: "JSLT", serverValue: "JSLT" },
        { displayName: "JSONata", serverValue: "JSONATA" },
      ],
    };
    const filters: FilterCondition[] = [
      { field: "engine", operator: "eq", value: "JSONata" },
    ];
    const result = serializeFilters(filters, { fieldConfigs: [enumConfig] });
    expect(result["engine.eq"]).toBe("JSONATA");
  });
});

describe("formatDateValue", () => {
  it("formats date type as YYYY-MM-DD", () => {
    expect(formatDateValue("2026-03-24 14:30", "date")).toBe("2026-03-24");
  });

  it("formats dateTime type without timezone", () => {
    expect(formatDateValue("2026-03-24 14:30", "dateTime")).toBe("2026-03-24T14:30:00");
  });

  it("formats offsetDateTime with local timezone", () => {
    const result = formatDateValue("2026-03-24 14:30", "offsetDateTime");
    expect(result).toMatch(/^2026-03-24T14:30:00[Z+-]/);
  });

  it("formats instant as UTC", () => {
    const result = formatDateValue("2026-03-24 14:30", "instant");
    expect(result).toMatch(/Z$/);
  });

  it("returns empty for empty input", () => {
    expect(formatDateValue("", "date")).toBe("");
  });
});

describe("normalizeDateToISO (legacy)", () => {
  it("handles date-only with local timezone", () => {
    const result = normalizeDateToISO("2026-03-15");
    expect(result).toMatch(/^2026-03-15T00:00:00[Z+-]/);
    expect(result).not.toBe("2026-03-15");
  });

  it("handles YYYY-MM-DD HH:mm with local timezone", () => {
    const result = normalizeDateToISO("2026-03-15 14:30");
    expect(result).toMatch(/^2026-03-15T14:30:00[Z+-]/);
  });

  it("handles YYYY-MM-DD HH:mm:ss with local timezone", () => {
    const result = normalizeDateToISO("2026-03-15 14:30:45");
    expect(result).toMatch(/^2026-03-15T14:30:45[Z+-]/);
  });

  it("returns empty for invalid", () => {
    expect(normalizeDateToISO("not-a-date")).toBe("");
  });
});

describe("normalizeDateTimeForDisplay", () => {
  it("preserves YYYY-MM-DD HH:mm", () => {
    expect(normalizeDateTimeForDisplay("2026-03-15 14:30")).toBe("2026-03-15 14:30");
  });

  it("appends 00:00 for date-only input", () => {
    expect(normalizeDateTimeForDisplay("2026-03-15")).toBe("2026-03-15 00:00");
  });

  it("parses ISO to datetime display", () => {
    expect(normalizeDateTimeForDisplay("2026-03-15T14:30:00Z")).toMatch(/2026-03-15/);
  });
});

describe("deserializeFilters", () => {
  it("parses simple filter", () => {
    const result = deserializeFilters({ "name.eq": "test" });
    expect(result).toEqual([
      { field: "name", operator: "eq", value: "test" },
    ]);
  });

  it("parses isnull filter", () => {
    const result = deserializeFilters({ "name.isnull": "true" });
    expect(result).toEqual([
      { field: "name", operator: "isnull", value: "" },
    ]);
  });

  it("parses multi-value filter from comma string", () => {
    const result = deserializeFilters({ "status.in": "a, b, c" });
    expect(result).toEqual([
      { field: "status", operator: "in", value: ["a", "b", "c"] },
    ]);
  });

  it("parses nested field paths", () => {
    const result = deserializeFilters({ "address.city.eq": "Istanbul" });
    expect(result).toEqual([
      { field: "address.city", operator: "eq", value: "Istanbul" },
    ]);
  });

  it("ignores non-filter keys", () => {
    const result = deserializeFilters({ offset: "0", limit: "20" });
    expect(result).toEqual([]);
  });
});

describe("round-trip", () => {
  it("serialize then deserialize returns equivalent filters", () => {
    const original: FilterCondition[] = [
      { field: "name", operator: "containsi", value: "test" },
      { field: "status", operator: "in", value: ["a", "b"] },
      { field: "age", operator: "gte", value: "18" },
    ];
    const configs = [
      makeTextConfig("name"),
      makeTextConfig("status"),
      makeTextConfig("age"),
    ];
    const params = serializeFilters(original, { fieldConfigs: configs });
    const restored = deserializeFilters(params);
    expect(restored).toHaveLength(3);
    expect(restored.find((f) => f.field === "name")?.operator).toBe("containsi");
    expect(restored.find((f) => f.field === "status")?.value).toEqual(["a", "b"]);
  });
});
