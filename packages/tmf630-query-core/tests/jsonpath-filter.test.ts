import { describe, it, expect } from "vitest";
import {
  serializeToJsonPathFilter,
  deserializeJsonPathFilter,
} from "../src/jsonpath-filter.js";
import type { FilterGroup } from "../src/types.js";
import type { FieldConfig } from "../src/config.js";

function fc(partial: Partial<FieldConfig> & Pick<FieldConfig, "name" | "type">): FieldConfig {
  return {
    displayName: partial.displayName ?? partial.name,
    displayFormat: partial.displayFormat ?? null,
    displayPattern: partial.displayPattern ?? null,
    values: partial.values ?? null,
    defaultOperator: partial.defaultOperator ?? null,
    validation: partial.validation ?? null,
    ...partial,
  };
}

const fieldConfigs: FieldConfig[] = [
  fc({ name: "name", type: "text", displayName: "Name" }),
  fc({ name: "age", type: "numeric", displayName: "Age" }),
  fc({ name: "status", type: "text", displayName: "Status" }),
];

describe("serializeToJsonPathFilter", () => {
  it("serializes simple eq condition", () => {
    const group: FilterGroup = {
      logic: "and",
      conditions: [{ field: "name", operator: "eq", value: "Alice" }],
    };
    expect(serializeToJsonPathFilter(group, fieldConfigs)).toBe(
      "$[?(@.name == 'Alice')]",
    );
  });

  it("serializes numeric gt", () => {
    const group: FilterGroup = {
      logic: "and",
      conditions: [{ field: "age", operator: "gt", value: "18" }],
    };
    expect(serializeToJsonPathFilter(group, fieldConfigs)).toBe("$[?(@.age > 18)]");
  });

  it("serializes AND group", () => {
    const group: FilterGroup = {
      logic: "and",
      conditions: [
        { field: "name", operator: "eq", value: "Alice" },
        { field: "age", operator: "gt", value: "18" },
      ],
    };
    expect(serializeToJsonPathFilter(group, fieldConfigs)).toBe(
      "$[?(@.name == 'Alice' && @.age > 18)]",
    );
  });

  it("serializes OR group", () => {
    const group: FilterGroup = {
      logic: "or",
      conditions: [
        { field: "name", operator: "eq", value: "Alice" },
        { field: "name", operator: "eq", value: "Bob" },
      ],
    };
    expect(serializeToJsonPathFilter(group, fieldConfigs)).toBe(
      "$[?(@.name == 'Alice' || @.name == 'Bob')]",
    );
  });

  it("parenthesizes nested groups with multiple conditions", () => {
    const group: FilterGroup = {
      logic: "and",
      conditions: [
        {
          logic: "or",
          conditions: [
            { field: "name", operator: "eq", value: "Alice" },
            { field: "name", operator: "eq", value: "Bob" },
          ],
        },
        { field: "age", operator: "gt", value: "18" },
      ],
    };
    expect(serializeToJsonPathFilter(group, fieldConfigs)).toBe(
      "$[?((@.name == 'Alice' || @.name == 'Bob') && @.age > 18)]",
    );
  });

  it("returns empty string for empty group", () => {
    const group: FilterGroup = { logic: "and", conditions: [] };
    expect(serializeToJsonPathFilter(group, fieldConfigs)).toBe("");
  });
});

describe("deserializeJsonPathFilter", () => {
  it("round-trips serialize then deserialize", () => {
    const original: FilterGroup = {
      logic: "and",
      conditions: [
        { field: "name", operator: "eq", value: "Alice" },
        { field: "age", operator: "gt", value: "18" },
      ],
    };
    const expr = serializeToJsonPathFilter(original, fieldConfigs);
    const back = deserializeJsonPathFilter(expr);
    expect(back).toEqual(original);
  });
});
