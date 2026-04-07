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

describe("serializeToJsonPathFilter — date displayFormat='date' expansion", () => {
  const TZ_OFFSET = new Date("2026-01-15T00:00:00").getTimezoneOffset();
  const isUTC = TZ_OFFSET === 0;

  function dateField(
    name: string,
    type: "offsetDateTime" | "instant" | "dateTime" = "offsetDateTime",
  ): FieldConfig {
    return fc({
      name,
      type,
      displayFormat: "date",
      operators: ["eq", "ne", "gt", "gte", "lt", "lte", "between"],
      nullable: false,
    });
  }

  const configs = [dateField("createdOn")];

  it("expands eq to gte/lt day range", () => {
    const group: FilterGroup = {
      logic: "and",
      conditions: [{ field: "createdOn", operator: "eq", value: "2026-01-15" }],
    };
    const result = serializeToJsonPathFilter(group, configs);
    expect(result).toContain(">=");
    expect(result).toContain("<");
    expect(result).toContain("2026-01-15");
    expect(result).toContain("2026-01-16");
  });

  it("expands ne to lt/gte compound", () => {
    const group: FilterGroup = {
      logic: "and",
      conditions: [{ field: "createdOn", operator: "ne", value: "2026-01-15" }],
    };
    const result = serializeToJsonPathFilter(group, configs);
    expect(result).toContain("<");
    expect(result).toContain("||");
    expect(result).toContain(">=");
  });

  it("translates gt to gte(nextDay)", () => {
    const group: FilterGroup = {
      logic: "and",
      conditions: [{ field: "createdOn", operator: "gt", value: "2026-01-15" }],
    };
    const result = serializeToJsonPathFilter(group, configs);
    expect(result).toContain(">=");
    expect(result).toContain("2026-01-16");
  });

  it("translates gte to gte(startOfDay)", () => {
    const group: FilterGroup = {
      logic: "and",
      conditions: [{ field: "createdOn", operator: "gte", value: "2026-01-15" }],
    };
    const result = serializeToJsonPathFilter(group, configs);
    expect(result).toContain(">=");
    expect(result).toContain("2026-01-15");
  });

  it("translates lt to lt(startOfDay)", () => {
    const group: FilterGroup = {
      logic: "and",
      conditions: [{ field: "createdOn", operator: "lt", value: "2026-01-15" }],
    };
    const result = serializeToJsonPathFilter(group, configs);
    expect(result).toContain("<");
    expect(result).toContain("2026-01-15");
  });

  it("translates lte to lt(nextDay)", () => {
    const group: FilterGroup = {
      logic: "and",
      conditions: [{ field: "createdOn", operator: "lte", value: "2026-01-15" }],
    };
    const result = serializeToJsonPathFilter(group, configs);
    expect(result).toContain("<");
    expect(result).toContain("2026-01-16");
  });

  it("expands between to gte/lt range", () => {
    const group: FilterGroup = {
      logic: "and",
      conditions: [
        { field: "createdOn", operator: "between", value: ["2026-01-10", "2026-01-20"] },
      ],
    };
    const result = serializeToJsonPathFilter(group, configs);
    expect(result).toContain(">=");
    expect(result).toContain("<");
    expect(result).toContain("2026-01-10");
    expect(result).toContain("2026-01-21");
  });

  it("does NOT expand when displayFormat is datetime", () => {
    const datetimeConfigs = [fc({
      name: "modifiedOn", type: "offsetDateTime",
      displayFormat: "datetime",
      operators: ["eq"], nullable: false,
    })];
    const group: FilterGroup = {
      logic: "and",
      conditions: [{ field: "modifiedOn", operator: "eq", value: "2026-01-15" }],
    };
    const result = serializeToJsonPathFilter(group, datetimeConfigs);
    expect(result).toContain("==");
    expect(result).not.toContain(">=");
  });

  it("does NOT expand for pure date type (LocalDate)", () => {
    const localDateConfigs = [fc({
      name: "birthDate", type: "date",
      displayFormat: "date",
      operators: ["eq"], nullable: false,
    })];
    const group: FilterGroup = {
      logic: "and",
      conditions: [{ field: "birthDate", operator: "eq", value: "2026-01-15" }],
    };
    const result = serializeToJsonPathFilter(group, localDateConfigs);
    expect(result).toContain("==");
    expect(result).not.toContain(">=");
  });

  it("works with instant type", () => {
    const instantConfigs = [dateField("ts", "instant")];
    const group: FilterGroup = {
      logic: "and",
      conditions: [{ field: "ts", operator: "eq", value: "2026-01-15" }],
    };
    const result = serializeToJsonPathFilter(group, instantConfigs);
    expect(result).toContain(">=");
    expect(result).toContain("<");
    expect(result).toMatch(/Z/);
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
