import { describe, it, expect } from "vitest";
import {
  camelToTitle,
  normalizeSearchConfig,
  parseSearchConfig,
  getContext,
  configToFilterableFields,
  buildValidator,
  createSearchFilter,
  OPERATOR_PRESETS,
  type FieldConfig,
} from "../src/config.js";

describe("camelToTitle", () => {
  it("maps common field names to title case", () => {
    expect(camelToTitle("createdOn")).toBe("Created On");
    expect(camelToTitle("transformationId")).toBe("Transformation ID");
    expect(camelToTitle("engine")).toBe("Engine");
    expect(camelToTitle("modifiedBy")).toBe("Modified By");
  });
});

describe("normalizeSearchConfig — flat single-context format", () => {
  it("creates default context with normalized fields", () => {
    const config = normalizeSearchConfig({
      fields: {
        name: {},
        createdOn: { type: "instant" },
      },
    });

    expect(Object.keys(config.contexts)).toEqual(["default"]);
    const ctx = getContext(config);
    expect(ctx.fields).toHaveLength(2);

    const nameField = ctx.fields.find((f) => f.name === "name");
    expect(nameField).toMatchObject({
      type: "text",
      displayName: "Name",
    });

    const created = ctx.fields.find((f) => f.name === "createdOn");
    expect(created).toMatchObject({
      type: "instant",
      displayFormat: "datetime",
    });
  });
});

describe("normalizeSearchConfig — map-to-array ordering", () => {
  it("preserves object key order for fields array", () => {
    const config = normalizeSearchConfig({
      fields: { a: {}, b: {}, c: {} },
    });
    const names = getContext(config).fields.map((f) => f.name);
    expect(names).toEqual(["a", "b", "c"]);
  });
});

describe("normalizeSearchConfig — empty object shorthand", () => {
  it("defaults type to text and derives displayName", () => {
    const config = normalizeSearchConfig({
      fields: { fieldName: {} },
    });
    const f = getContext(config).fields[0]!;
    expect(f.type).toBe("text");
    expect(f.displayName).toBe("Field Name");
  });
});

describe("normalizeSearchConfig — smart displayFormat defaults", () => {
  it("sets displayFormat for temporal types and null for text", () => {
    const raw = {
      fields: {
        d: { type: "date" as const },
        i: { type: "instant" as const },
        o: { type: "offsetDateTime" as const },
        t: { type: "text" as const },
      },
    };
    const ctx = getContext(normalizeSearchConfig(raw));
    const byName = Object.fromEntries(ctx.fields.map((f) => [f.name, f]));

    expect(byName.d!.displayFormat).toBe("date");
    expect(byName.i!.displayFormat).toBe("datetime");
    expect(byName.o!.displayFormat).toBe("datetime");
    expect(byName.t!.displayFormat).toBeNull();
  });
});

describe("normalizeSearchConfig — global displayPattern inheritance", () => {
  it("inherits context displayPattern for temporal fields only; field overrides context", () => {
    const config = normalizeSearchConfig({
      fields: {
        title: { type: "text" },
        startDate: { type: "date" },
        endDate: { type: "date", displayPattern: "yyyy-MM-dd" },
      },
      displayPattern: "dd/MM/yyyy",
    });
    const ctx = getContext(config);
    const byName = Object.fromEntries(ctx.fields.map((f) => [f.name, f]));

    expect(byName.title!.displayPattern).toBeNull();
    expect(byName.startDate!.displayPattern).toBe("dd/MM/yyyy");
    expect(byName.endDate!.displayPattern).toBe("yyyy-MM-dd");
  });
});

describe("parseSearchConfig — validation errors", () => {
  it("rejects date with displayFormat datetime", () => {
    expect(() =>
      parseSearchConfig({
        fields: {
          d: { type: "date", displayFormat: "datetime" },
        },
      }),
    ).toThrow(/displayFormat "datetime"/);
  });

  it("allows enum without values (for dynamic enums)", () => {
    const config = parseSearchConfig({
      fields: { e: { type: "enum" } },
    });
    const ctx = config.contexts.default;
    expect(ctx.fields[0]!.type).toBe("enum");
    expect(ctx.fields[0]!.values).toBeNull();
  });

  it("rejects text with values", () => {
    expect(() =>
      parseSearchConfig({
        fields: {
          t: {
            type: "text",
            values: [{ displayName: "A", serverValue: "a" }],
          },
        },
      }),
    ).toThrow(/values.*only valid for type "enum"/);
  });

  it("rejects text with displayFormat", () => {
    expect(() =>
      parseSearchConfig({
        fields: {
          t: { type: "text", displayFormat: "date" },
        },
      }),
    ).toThrow(/displayFormat is only valid for temporal types/);
  });
});

describe("configToFilterableFields", () => {
  const baseField = (
    overrides: Partial<FieldConfig> & Pick<FieldConfig, "name" | "type">,
  ): FieldConfig => ({
    displayName: overrides.displayName ?? overrides.name,
    displayFormat: overrides.displayFormat ?? null,
    displayPattern: overrides.displayPattern ?? null,
    values: overrides.values ?? null,
    defaultOperator: overrides.defaultOperator ?? null,
    validation: overrides.validation ?? null,
    operators: overrides.operators ?? [],
    nullable: overrides.nullable ?? false,
    ...overrides,
  });

  it("maps FieldConfig[] to SearchableField with i18n and enum options", () => {
    const ctx = {
      fields: [
        baseField({
          name: "status",
          type: "enum",
          displayName: "Status",
          values: [
            { displayName: "Open", serverValue: "OPEN" },
            { displayName: "Done", serverValue: "DONE" },
          ],
        }),
        baseField({ name: "title", type: "text", displayName: "Title" }),
      ],
      defaults: { defaultField: null, defaultOperator: null },
      responseFields: null,
      displayPattern: null,
    };

    const fields = configToFilterableFields(ctx, { title: "Translated Title" });

    expect(fields).toHaveLength(2);
    const title = fields.find((f) => f.name === "title")!;
    expect(title.label).toBe("Translated Title");

    const status = fields.find((f) => f.name === "status")!;
    expect(status.enumOptions).toEqual([
      { value: "OPEN", label: "Open" },
      { value: "DONE", label: "Done" },
    ]);
  });

  it("adds validate for email type", () => {
    const ctx = {
      fields: [baseField({ name: "mail", type: "email", displayName: "Email" })],
      defaults: { defaultField: null, defaultOperator: null },
      responseFields: null,
      displayPattern: null,
    };
    const [field] = configToFilterableFields(ctx);
    expect(field.validate).toBeDefined();
    expect(typeof field.validate).toBe("function");
  });
});

describe("buildValidator", () => {
  const field = (overrides: Partial<FieldConfig> & Pick<FieldConfig, "name" | "type">): FieldConfig => ({
    displayName: overrides.displayName ?? overrides.name,
    displayFormat: overrides.displayFormat ?? null,
    displayPattern: overrides.displayPattern ?? null,
    values: overrides.values ?? null,
    defaultOperator: overrides.defaultOperator ?? null,
    validation: overrides.validation ?? null,
    operators: overrides.operators ?? [],
    nullable: overrides.nullable ?? false,
    ...overrides,
  });

  it("validates email: valid returns null, invalid returns error", () => {
    const v = buildValidator(field({ name: "e", type: "email" }));
    expect(v).not.toBeNull();
    expect(v!("user@example.com")).toBeNull();
    expect(v!("not-an-email")).toBe("Invalid email address");
  });

  it("enforces maxLength", () => {
    const v = buildValidator(
      field({
        name: "x",
        type: "text",
        validation: { maxLength: 3 },
      }),
    );
    expect(v).not.toBeNull();
    expect(v!("ab")).toBeNull();
    expect(v!("abcd")).toBe("Maximum 3 characters");
  });

  it("enforces min and max for numeric range", () => {
    const v = buildValidator(
      field({
        name: "n",
        type: "numeric",
        validation: { min: 1, max: 10 },
      }),
    );
    expect(v).not.toBeNull();
    expect(v!("5")).toBeNull();
    expect(v!("0")).toBe("Minimum value is 1");
    expect(v!("11")).toBe("Maximum value is 10");
  });
});

/* ================================================================ */
/*  Operator preset system                                           */
/* ================================================================ */

describe("operator preset — auto-derived from type", () => {
  it("text field gets text-search operators", () => {
    const config = normalizeSearchConfig({
      fields: { title: {} },
    });
    const f = getContext(config).fields[0]!;
    expect(f.operators).toEqual(OPERATOR_PRESETS["text-search"]);
    expect(f.nullable).toBe(false);
  });

  it("email field gets text-search operators", () => {
    const config = normalizeSearchConfig({
      fields: { mail: { type: "email" } },
    });
    const f = getContext(config).fields[0]!;
    expect(f.operators).toEqual(OPERATOR_PRESETS["text-search"]);
  });

  it("enum field gets selection operators (no gt/gte/lt/lte/between)", () => {
    const config = normalizeSearchConfig({
      fields: { status: { type: "enum" } },
    });
    const f = getContext(config).fields[0]!;
    expect(f.operators).toEqual(OPERATOR_PRESETS["selection"]);
    expect(f.operators).not.toContain("gt");
    expect(f.operators).not.toContain("between");
  });

  it("date field gets date-range operators", () => {
    const config = normalizeSearchConfig({
      fields: { created: { type: "offsetDateTime" } },
    });
    const f = getContext(config).fields[0]!;
    expect(f.operators).toEqual(OPERATOR_PRESETS["date-range"]);
    expect(f.operators).not.toContain("contains");
    expect(f.operators).not.toContain("in");
  });

  it("numeric field gets numeric operators", () => {
    const config = normalizeSearchConfig({
      fields: { count: { type: "numeric" } },
    });
    const f = getContext(config).fields[0]!;
    expect(f.operators).toEqual(OPERATOR_PRESETS["numeric"]);
  });

  it("url field gets text-search operators", () => {
    const config = normalizeSearchConfig({
      fields: { website: { type: "url" } },
    });
    const f = getContext(config).fields[0]!;
    expect(f.operators).toEqual(OPERATOR_PRESETS["text-search"]);
  });
});

describe("operator preset — nullable flag", () => {
  it("nullable: true appends isnull and isnotnull", () => {
    const config = normalizeSearchConfig({
      fields: { note: { nullable: true } },
    });
    const f = getContext(config).fields[0]!;
    expect(f.nullable).toBe(true);
    expect(f.operators).toContain("isnull");
    expect(f.operators).toContain("isnotnull");
  });

  it("nullable: false (default) does NOT include isnull/isnotnull", () => {
    const config = normalizeSearchConfig({
      fields: { name: {} },
    });
    const f = getContext(config).fields[0]!;
    expect(f.nullable).toBe(false);
    expect(f.operators).not.toContain("isnull");
    expect(f.operators).not.toContain("isnotnull");
  });
});

describe("operator preset — operatorSet override", () => {
  it("uses named preset instead of auto-derived", () => {
    const config = normalizeSearchConfig({
      fields: { code: { operatorSet: "text-exact" } },
    });
    const f = getContext(config).fields[0]!;
    expect(f.operators).toEqual(OPERATOR_PRESETS["text-exact"]);
    expect(f.operators).toContain("eqi");
    expect(f.operators).not.toContain("contains");
  });

  it("operatorSet combined with nullable appends isnull/isnotnull", () => {
    const config = normalizeSearchConfig({
      fields: { modified: { type: "offsetDateTime", operatorSet: "date-range", nullable: true } },
    });
    const f = getContext(config).fields[0]!;
    expect(f.operators).toEqual([...OPERATOR_PRESETS["date-range"], "isnull", "isnotnull"]);
  });
});

describe("operator preset — explicit operators override", () => {
  it("uses exact operator list when operators array is provided", () => {
    const config = normalizeSearchConfig({
      fields: { tag: { operators: ["eq", "ne", "contains"] } },
    });
    const f = getContext(config).fields[0]!;
    expect(f.operators).toEqual(["eq", "ne", "contains"]);
  });

  it("nullable still appends to explicit operators", () => {
    const config = normalizeSearchConfig({
      fields: { tag: { operators: ["eq", "ne"], nullable: true } },
    });
    const f = getContext(config).fields[0]!;
    expect(f.operators).toEqual(["eq", "ne", "isnull", "isnotnull"]);
  });
});

describe("operator preset — priority chain", () => {
  it("operators takes precedence over operatorSet", () => {
    const config = normalizeSearchConfig({
      fields: {
        x: { operatorSet: "selection", operators: ["eq", "contains"] },
      },
    });
    const f = getContext(config).fields[0]!;
    expect(f.operators).toEqual(["eq", "contains"]);
  });

  it("operatorSet takes precedence over auto-derived", () => {
    const config = normalizeSearchConfig({
      fields: {
        x: { type: "numeric", operatorSet: "selection" },
      },
    });
    const f = getContext(config).fields[0]!;
    expect(f.operators).toEqual(OPERATOR_PRESETS["selection"]);
  });
});

describe("configToFilterableFields — operators propagation", () => {
  it("passes resolved operators to SearchableField", () => {
    const config = normalizeSearchConfig({
      fields: {
        status: { type: "enum" },
        notes: { nullable: true },
      },
    });
    const ctx = getContext(config);
    const fields = configToFilterableFields(ctx);

    const status = fields.find((f) => f.name === "status")!;
    expect(status.operators).toEqual(OPERATOR_PRESETS["selection"]);

    const notes = fields.find((f) => f.name === "notes")!;
    expect(notes.operators).toContain("isnull");
    expect(notes.operators).toContain("isnotnull");
  });

  it("passes explicit operators array to SearchableField", () => {
    const config = normalizeSearchConfig({
      fields: {
        email: { type: "email", operators: ["eq", "ne", "in", "nin"] },
      },
    });
    const ctx = getContext(config);
    const fields = configToFilterableFields(ctx);

    const email = fields.find((f) => f.name === "email")!;
    expect(email.operators).toEqual(["eq", "ne", "in", "nin"]);
    expect(email.operators).not.toContain("contains");
  });

  it("passes operatorSet+nullable resolved operators to SearchableField", () => {
    const config = normalizeSearchConfig({
      fields: {
        modified: { type: "offsetDateTime", operatorSet: "date-range", nullable: true },
      },
    });
    const ctx = getContext(config);
    const fields = configToFilterableFields(ctx);

    const modified = fields.find((f) => f.name === "modified")!;
    expect(modified.operators).toEqual([...OPERATOR_PRESETS["date-range"], "isnull", "isnotnull"]);
  });
});

describe("parseSearchConfig — full transformation-ui config", () => {
  it("parses a realistic search-config.json with all field types and overrides", () => {
    const config = parseSearchConfig({
      displayPattern: "dd/MM/yyyy HH:mm",
      fields: {
        transformationId: {
          operatorSet: "text-search",
          validation: { maxLength: 255 },
        },
        engine: {
          type: "enum",
          operatorSet: "selection",
          values: [{ displayName: "JSLT", serverValue: "JSLT" }],
        },
        createdBy: {
          type: "email",
          operators: ["eq", "ne", "contains", "containsi", "startswith", "startswithi", "in", "nin"],
        },
        createdOn: {
          type: "offsetDateTime",
          operatorSet: "date-range",
          displayFormat: "date",
        },
        modifiedBy: {
          type: "email",
          operatorSet: "text-search",
          nullable: true,
        },
        modifiedOn: {
          type: "offsetDateTime",
          operatorSet: "date-range",
          displayFormat: "date",
          nullable: true,
        },
        transformationVersion: {
          displayName: "Version",
          type: "numeric",
          operatorSet: "numeric",
          validation: { min: 1 },
        },
      },
      defaults: {
        defaultField: "transformationId",
        defaultOperator: "containsi",
      },
      responseFields: ["transformationId", "engine", "createdBy", "createdOn", "modifiedBy", "modifiedOn", "transformationVersion"],
    });

    const ctx = getContext(config);
    expect(ctx.fields).toHaveLength(7);

    const byName = Object.fromEntries(ctx.fields.map((f) => [f.name, f]));

    expect(byName.transformationId!.type).toBe("text");
    expect(byName.transformationId!.operators).toEqual(OPERATOR_PRESETS["text-search"]);

    expect(byName.engine!.type).toBe("enum");
    expect(byName.engine!.operators).toEqual(OPERATOR_PRESETS["selection"]);
    expect(byName.engine!.values).toEqual([{ displayName: "JSLT", serverValue: "JSLT" }]);

    expect(byName.createdBy!.type).toBe("email");
    expect(byName.createdBy!.operators).toEqual(["eq", "ne", "contains", "containsi", "startswith", "startswithi", "in", "nin"]);
    expect(byName.createdBy!.operators).not.toContain("endswith");

    expect(byName.createdOn!.displayFormat).toBe("date");
    expect(byName.createdOn!.displayPattern).toBe("dd/MM/yyyy HH:mm");

    expect(byName.modifiedBy!.nullable).toBe(true);
    expect(byName.modifiedBy!.operators).toContain("isnull");
    expect(byName.modifiedBy!.operators).toContain("isnotnull");

    expect(byName.modifiedOn!.nullable).toBe(true);
    expect(byName.modifiedOn!.operators).toEqual([...OPERATOR_PRESETS["date-range"], "isnull", "isnotnull"]);

    expect(byName.transformationVersion!.displayName).toBe("Version");
    expect(byName.transformationVersion!.operators).toEqual(OPERATOR_PRESETS["numeric"]);
    expect(byName.transformationVersion!.validation).toEqual({ min: 1 });

    expect(ctx.defaults.defaultField).toBe("transformationId");
    expect(ctx.defaults.defaultOperator).toBe("containsi");
    expect(ctx.responseFields).toHaveLength(7);
  });
});

describe("createSearchFilter", () => {
  const ctx = {
    fields: [],
    defaults: { defaultField: "transformationId", defaultOperator: "containsi" as const },
    responseFields: null,
    displayPattern: null,
  };

  it("creates filter from config defaults", () => {
    const result = createSearchFilter(ctx, "test");
    expect(result).toEqual({
      field: "transformationId",
      operator: "containsi",
      value: "test",
    });
  });

  it("trims search text", () => {
    const result = createSearchFilter(ctx, "  hello  ");
    expect(result!.value).toBe("hello");
  });

  it("returns null for empty text", () => {
    expect(createSearchFilter(ctx, "")).toBeNull();
    expect(createSearchFilter(ctx, "   ")).toBeNull();
  });

  it("uses fallback when ctx is null", () => {
    const result = createSearchFilter(null, "test", "name", "eq");
    expect(result).toEqual({
      field: "name",
      operator: "eq",
      value: "test",
    });
  });

  it("uses fallback when ctx defaults are null", () => {
    const emptyCtx = {
      fields: [],
      defaults: { defaultField: null, defaultOperator: null },
      responseFields: null,
      displayPattern: null,
    };
    const result = createSearchFilter(emptyCtx, "test");
    expect(result).toEqual({
      field: "name",
      operator: "containsi",
      value: "test",
    });
  });
});
