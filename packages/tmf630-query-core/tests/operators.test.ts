import { describe, it, expect } from "vitest";
import {
  getOperatorsForFieldType,
  operatorsRequireNoValue,
  isMultiValueOperator,
  TEXT_OPERATORS,
  DATE_OPERATORS,
  NUMERIC_OPERATORS,
  ENUM_OPERATORS,
} from "../src/operators.js";

describe("getOperatorsForFieldType", () => {
  it("returns text operators for text type", () => {
    const ops = getOperatorsForFieldType("text");
    expect(ops).toBe(TEXT_OPERATORS);
    expect(ops.length).toBeGreaterThan(10);
  });

  it("returns date operators for date type", () => {
    expect(getOperatorsForFieldType("date")).toBe(DATE_OPERATORS);
  });

  it("returns numeric operators for numeric type", () => {
    expect(getOperatorsForFieldType("numeric")).toBe(NUMERIC_OPERATORS);
  });

  it("returns enum operators for enum type", () => {
    expect(getOperatorsForFieldType("enum")).toBe(ENUM_OPERATORS);
  });

  it("falls back to text for unknown types", () => {
    expect(getOperatorsForFieldType("unknown")).toBe(TEXT_OPERATORS);
  });

  it("uses custom types when provided", () => {
    const custom = [{ value: "eq" as const, requiresValue: true, isMultiValue: false }];
    const result = getOperatorsForFieldType("boolean", { boolean: custom });
    expect(result).toBe(custom);
  });

  it("custom types override built-in types", () => {
    const custom = [{ value: "eq" as const, requiresValue: true, isMultiValue: false }];
    const result = getOperatorsForFieldType("text", { text: custom });
    expect(result).toBe(custom);
    expect(result.length).toBe(1);
  });
});

describe("operatorsRequireNoValue", () => {
  it("returns true for isnull", () => {
    expect(operatorsRequireNoValue("isnull")).toBe(true);
  });

  it("returns true for isnotnull", () => {
    expect(operatorsRequireNoValue("isnotnull")).toBe(true);
  });

  it("returns false for eq", () => {
    expect(operatorsRequireNoValue("eq")).toBe(false);
  });
});

describe("isMultiValueOperator", () => {
  it("returns true for between, in, nin", () => {
    expect(isMultiValueOperator("between")).toBe(true);
    expect(isMultiValueOperator("in")).toBe(true);
    expect(isMultiValueOperator("nin")).toBe(true);
  });

  it("returns false for single-value operators", () => {
    expect(isMultiValueOperator("eq")).toBe(false);
    expect(isMultiValueOperator("contains")).toBe(false);
  });
});
