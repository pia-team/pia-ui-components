import { describe, it, expect } from "vitest";
import { serializeFilters, normalizeDateToISO, normalizeDateTimeForDisplay, getLocalTimezoneOffset } from "../src/serialize.js";
import { deserializeFilters } from "../src/deserialize.js";
import type { FilterCondition } from "../src/types.js";

const TZ = getLocalTimezoneOffset();

describe("serializeFilters", () => {
  it("serializes simple eq filter", () => {
    const filters: FilterCondition[] = [
      { field: "name", operator: "eq", value: "test" },
    ];
    expect(serializeFilters(filters)).toEqual({ "name.eq": "test" });
  });

  it("skips filters with empty value", () => {
    const filters: FilterCondition[] = [
      { field: "name", operator: "eq", value: "" },
    ];
    expect(serializeFilters(filters)).toEqual({});
  });

  it("skips filters with empty field", () => {
    const filters: FilterCondition[] = [
      { field: "", operator: "eq", value: "test" },
    ];
    expect(serializeFilters(filters)).toEqual({});
  });

  it("serializes isnull without value", () => {
    const filters: FilterCondition[] = [
      { field: "name", operator: "isnull", value: "" },
    ];
    expect(serializeFilters(filters)).toEqual({ "name.isnull": "true" });
  });

  it("serializes multi-value operators as arrays", () => {
    const filters: FilterCondition[] = [
      { field: "status", operator: "in", value: ["active", "pending"] },
    ];
    expect(serializeFilters(filters)).toEqual({
      "status.in": ["active", "pending"],
    });
  });

  it("expands date eq to gte/lt range with local timezone", () => {
    const filters: FilterCondition[] = [
      { field: "createdOn", operator: "eq", value: "2026-01-15" },
    ];
    const result = serializeFilters(filters, {
      dateFields: ["createdOn"],
    });
    expect(result["createdOn.gte"]).toMatch(/^2026-01-15T00:00:00[Z+-]/);
    expect(result["createdOn.lt"]).toMatch(/^2026-01-16T00:00:00[Z+-]/);
  });

  it("serializes datetime with time using local timezone offset", () => {
    const filters: FilterCondition[] = [
      { field: "createdOn", operator: "gte", value: "2026-01-15 14:30" },
    ];
    const result = serializeFilters(filters, {
      dateFields: ["createdOn"],
    });
    expect(result["createdOn.gte"]).toMatch(/^2026-01-15T14:30:00[Z+-]/);
  });
});

describe("normalizeDateToISO", () => {
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
    const params = serializeFilters(original);
    const restored = deserializeFilters(params);
    expect(restored).toHaveLength(3);
    expect(restored.find((f) => f.field === "name")?.operator).toBe("containsi");
    expect(restored.find((f) => f.field === "status")?.value).toEqual(["a", "b"]);
  });
});
