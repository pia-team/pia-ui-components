import { describe, it, expect } from "vitest";
import { serializeSort, deserializeSort, toggleSort } from "../src/sort.js";

describe("serializeSort", () => {
  it("returns undefined for null", () => {
    expect(serializeSort(null)).toBeUndefined();
  });

  it("serializes ascending as plain field name", () => {
    expect(serializeSort({ field: "createdOn", direction: "asc" })).toBe("createdOn");
  });

  it("serializes descending with minus prefix", () => {
    expect(serializeSort({ field: "createdOn", direction: "desc" })).toBe("-createdOn");
  });
});

describe("deserializeSort", () => {
  it("returns null for null input", () => {
    expect(deserializeSort(null)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(deserializeSort("")).toBeNull();
  });

  it("parses descending (minus prefix)", () => {
    expect(deserializeSort("-createdOn")).toEqual({
      field: "createdOn",
      direction: "desc",
    });
  });

  it("parses ascending (plus prefix)", () => {
    expect(deserializeSort("+name")).toEqual({
      field: "name",
      direction: "asc",
    });
  });

  it("parses ascending (no prefix)", () => {
    expect(deserializeSort("name")).toEqual({
      field: "name",
      direction: "asc",
    });
  });
});

describe("toggleSort", () => {
  it("starts with asc when no current sort", () => {
    expect(toggleSort(null, "name")).toEqual({
      field: "name",
      direction: "asc",
    });
  });

  it("starts with asc when switching to a different field", () => {
    expect(
      toggleSort({ field: "createdOn", direction: "desc" }, "name"),
    ).toEqual({ field: "name", direction: "asc" });
  });

  it("toggles asc to desc for the same field", () => {
    expect(
      toggleSort({ field: "name", direction: "asc" }, "name"),
    ).toEqual({ field: "name", direction: "desc" });
  });

  it("toggles desc to null (no sort) for the same field", () => {
    expect(
      toggleSort({ field: "name", direction: "desc" }, "name"),
    ).toBeNull();
  });
});

describe("round-trip", () => {
  it("serialize then deserialize returns equivalent sort state", () => {
    const original = { field: "createdOn", direction: "desc" as const };
    const serialized = serializeSort(original);
    const deserialized = deserializeSort(serialized!);
    expect(deserialized).toEqual(original);
  });

  it("round-trips ascending", () => {
    const original = { field: "name", direction: "asc" as const };
    const serialized = serializeSort(original);
    const deserialized = deserializeSort(serialized!);
    expect(deserialized).toEqual(original);
  });
});
