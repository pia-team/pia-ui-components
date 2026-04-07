/**
 * Search configuration types, normalization, validation, and conversion helpers.
 * Parses simplified JSON config (map format, shorthands) into canonical form.
 */

import type { FilterOperator } from "./types.js";
import type { BuiltInFieldType } from "./operators.js";

/* ================================================================ */
/*  Field Config Types                                               */
/* ================================================================ */

export type FieldConfigType =
  | "text"
  | "numeric"
  | "enum"
  | "email"
  | "url"
  | "date"
  | "dateTime"
  | "offsetDateTime"
  | "instant";

export type DateDisplayFormat = "date" | "datetime";

export interface EnumValue {
  displayName: string;
  serverValue: string;
}

export interface FieldValidation {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  patternMessage?: string;
}

/* ================================================================ */
/*  Raw (Input) types — what the JSON config file looks like         */
/* ================================================================ */

export interface RawFieldConfigValue {
  type?: FieldConfigType;
  displayName?: string;
  displayFormat?: DateDisplayFormat;
  displayPattern?: string;
  responseDisplayFormat?: DateDisplayFormat;
  values?: EnumValue[];
  defaultOperator?: FilterOperator;
  validation?: FieldValidation;
  nullable?: boolean;
  operatorSet?: string;
  operators?: FilterOperator[];
}

export type RawFieldsMap = Record<string, RawFieldConfigValue>;

export interface RawSearchContextConfig {
  fields: RawFieldsMap;
  defaults?: {
    defaultField?: string;
    defaultOperator?: FilterOperator;
  };
  responseFields?: string[];
  displayPattern?: string;
}

export type RawSearchConfig =
  | RawSearchContextConfig
  | { version?: string; contexts: Record<string, RawSearchContextConfig> };

/* ================================================================ */
/*  Canonical (Normalized) types — fully expanded, no optionals      */
/* ================================================================ */

export interface FieldConfig {
  name: string;
  type: FieldConfigType;
  displayName: string;
  displayFormat: DateDisplayFormat | null;
  displayPattern: string | null;
  /** Display format for table/response rendering. Falls back to displayFormat. */
  responseDisplayFormat: DateDisplayFormat | null;
  values: EnumValue[] | null;
  defaultOperator: FilterOperator | null;
  validation: FieldValidation | null;
  operators: FilterOperator[];
  nullable: boolean;
}

export interface SearchContextConfig {
  fields: FieldConfig[];
  defaults: {
    defaultField: string | null;
    defaultOperator: FilterOperator | null;
  };
  responseFields: string[] | null;
  displayPattern: string | null;
}

export interface SearchConfig {
  version: string;
  contexts: Record<string, SearchContextConfig>;
}

/* ================================================================ */
/*  Constants                                                        */
/* ================================================================ */

const TEMPORAL_TYPES = new Set<FieldConfigType>([
  "date",
  "dateTime",
  "offsetDateTime",
  "instant",
]);

const ALL_TYPES = new Set<FieldConfigType>([
  "text",
  "numeric",
  "enum",
  "email",
  "url",
  "date",
  "dateTime",
  "offsetDateTime",
  "instant",
]);

const TYPE_TO_OPERATOR_GROUP: Record<FieldConfigType, BuiltInFieldType> = {
  text: "text",
  email: "text",
  url: "text",
  date: "date",
  dateTime: "date",
  offsetDateTime: "date",
  instant: "date",
  numeric: "numeric",
  enum: "enum",
};

const DEFAULT_DISPLAY_FORMAT: Partial<
  Record<FieldConfigType, DateDisplayFormat>
> = {
  date: "date",
  dateTime: "datetime",
  offsetDateTime: "datetime",
  instant: "datetime",
};

export const OPERATOR_PRESETS: Record<string, FilterOperator[]> = {
  "text-search": [
    "eq", "ne", "contains", "containsi",
    "startswith", "startswithi", "endswith", "endswithi", "in", "nin",
  ],
  "text-exact": ["eq", "ne", "eqi", "nei", "in", "nin"],
  "selection": ["eq", "ne", "in", "nin"],
  "date-range": ["eq", "ne", "gt", "gte", "lt", "lte", "between"],
  "numeric": ["eq", "ne", "gt", "gte", "lt", "lte", "between", "in", "nin"],
};

const TYPE_TO_PRESET: Record<FieldConfigType, string> = {
  text: "text-search",
  email: "text-search",
  url: "text-search",
  enum: "selection",
  date: "date-range",
  dateTime: "date-range",
  offsetDateTime: "date-range",
  instant: "date-range",
  numeric: "numeric",
};

function resolveOperators(
  raw: RawFieldConfigValue,
  type: FieldConfigType,
): FilterOperator[] {
  let ops: FilterOperator[];

  if (raw.operators && raw.operators.length > 0) {
    ops = [...raw.operators];
  } else {
    const presetName = raw.operatorSet ?? TYPE_TO_PRESET[type];
    ops = [...(OPERATOR_PRESETS[presetName] ?? OPERATOR_PRESETS["text-search"]!)];
  }

  if (raw.nullable) {
    if (!ops.includes("isnull")) ops.push("isnull");
    if (!ops.includes("isnotnull")) ops.push("isnotnull");
  }

  return ops;
}

const EMAIL_REGEX = /^[\w.+-]+@[\w.-]+\.\w{2,}$/;
const URL_REGEX = /^https?:\/\/\S+$/;

const ABBREVIATIONS: Record<string, string> = {
  Id: "ID",
  Url: "URL",
  Api: "API",
  Ui: "UI",
  Ip: "IP",
};

/* ================================================================ */
/*  Utility functions                                                */
/* ================================================================ */

export function isTemporalType(type: FieldConfigType): boolean {
  return TEMPORAL_TYPES.has(type);
}

export function getOperatorGroupForType(
  type: FieldConfigType,
): BuiltInFieldType {
  return TYPE_TO_OPERATOR_GROUP[type] ?? "text";
}

export function getDefaultDisplayFormat(
  type: FieldConfigType,
): DateDisplayFormat | null {
  return DEFAULT_DISPLAY_FORMAT[type] ?? null;
}

/**
 * Convert camelCase field name to Title Case display name.
 * Handles known abbreviations: Id→ID, Url→URL, Api→API, etc.
 */
export function camelToTitle(name: string): string {
  const words = name.replace(/([a-z])([A-Z])/g, "$1 $2").split(" ");
  return words
    .map((word) => {
      const capitalized = word.charAt(0).toUpperCase() + word.slice(1);
      return ABBREVIATIONS[capitalized] ?? capitalized;
    })
    .join(" ");
}

/* ================================================================ */
/*  Normalization                                                    */
/* ================================================================ */

function isMultiContextConfig(
  raw: unknown,
): raw is { version?: string; contexts: Record<string, RawSearchContextConfig> } {
  return (
    typeof raw === "object" &&
    raw !== null &&
    "contexts" in raw &&
    typeof (raw as Record<string, unknown>).contexts === "object"
  );
}

function normalizeField(
  name: string,
  raw: RawFieldConfigValue,
  contextDisplayPattern: string | null,
): FieldConfig {
  const type: FieldConfigType = raw.type ?? "text";
  const isTemporal = isTemporalType(type);

  if (!isTemporal && raw.displayFormat != null) {
    throw new Error(
      `Field "${name}": displayFormat is only valid for temporal types, not "${type}"`,
    );
  }

  const displayFormat = isTemporal
    ? (raw.displayFormat ?? getDefaultDisplayFormat(type))
    : null;

  return {
    name,
    type,
    displayName: raw.displayName ?? camelToTitle(name),
    displayFormat,
    displayPattern: isTemporal
      ? (raw.displayPattern ?? contextDisplayPattern)
      : null,
    responseDisplayFormat: isTemporal
      ? (raw.responseDisplayFormat ?? displayFormat)
      : null,
    values: raw.values ?? null,
    defaultOperator: raw.defaultOperator ?? null,
    validation: raw.validation ?? null,
    operators: resolveOperators(raw, type),
    nullable: raw.nullable ?? false,
  };
}

function normalizeContext(raw: RawSearchContextConfig): SearchContextConfig {
  const contextPattern = raw.displayPattern ?? null;

  const fields = Object.entries(raw.fields).map(([name, value]) =>
    normalizeField(name, value ?? {}, contextPattern),
  );

  return {
    fields,
    defaults: {
      defaultField: raw.defaults?.defaultField ?? null,
      defaultOperator: raw.defaults?.defaultOperator ?? null,
    },
    responseFields: raw.responseFields ?? null,
    displayPattern: contextPattern,
  };
}

/**
 * Expand all shorthands (map→array, auto displayName, smart displayFormat
 * defaults, global displayPattern inheritance, flat single-context wrapping).
 */
export function normalizeSearchConfig(raw: unknown): SearchConfig {
  if (!raw || typeof raw !== "object") {
    throw new Error("Search config must be a non-null object");
  }

  if (isMultiContextConfig(raw)) {
    const typed = raw as {
      version?: string;
      contexts: Record<string, RawSearchContextConfig>;
    };
    const contexts: Record<string, SearchContextConfig> = {};
    for (const [id, ctx] of Object.entries(typed.contexts)) {
      contexts[id] = normalizeContext(ctx);
    }
    return { version: typed.version ?? "1.0", contexts };
  }

  const typed = raw as RawSearchContextConfig;
  if (!typed.fields || typeof typed.fields !== "object") {
    throw new Error(
      "Search config must have a 'fields' map or 'contexts' object",
    );
  }
  return {
    version: "1.0",
    contexts: { default: normalizeContext(typed) },
  };
}

/* ================================================================ */
/*  Validation                                                       */
/* ================================================================ */

function validateField(field: FieldConfig): void {
  if (!field.name) {
    throw new Error("Field has an empty name");
  }
  if (!ALL_TYPES.has(field.type)) {
    throw new Error(`Field "${field.name}": unknown type "${field.type}"`);
  }

  const isTemporal = isTemporalType(field.type);

  if (field.displayFormat && !isTemporal) {
    throw new Error(
      `Field "${field.name}": displayFormat is only valid for temporal types, not "${field.type}"`,
    );
  }

  if (field.type === "date" && field.displayFormat === "datetime") {
    throw new Error(
      `Field "${field.name}": type "date" (LocalDate) cannot have displayFormat "datetime" — backend has no time component`,
    );
  }

  if (field.displayPattern && !isTemporal) {
    throw new Error(
      `Field "${field.name}": displayPattern is only valid for temporal types, not "${field.type}"`,
    );
  }

  if (field.type !== "enum" && field.values && field.values.length > 0) {
    throw new Error(
      `Field "${field.name}": "values" is only valid for type "enum", not "${field.type}"`,
    );
  }

  if (
    field.displayFormat === "date" &&
    field.displayPattern &&
    /HH|mm|ss|hh/.test(field.displayPattern)
  ) {
    console.warn(
      `Field "${field.name}": displayFormat is "date" but displayPattern "${field.displayPattern}" contains time tokens`,
    );
  }
}

function validateConfig(config: SearchConfig): SearchConfig {
  for (const [contextId, ctx] of Object.entries(config.contexts)) {
    if (!ctx.fields || ctx.fields.length === 0) {
      throw new Error(`Context "${contextId}" has no fields`);
    }
    for (const field of ctx.fields) {
      validateField(field);
    }

    if (ctx.defaults.defaultField) {
      const fieldNames = new Set(ctx.fields.map((f) => f.name));
      if (!fieldNames.has(ctx.defaults.defaultField)) {
        throw new Error(
          `Context "${contextId}": defaultField "${ctx.defaults.defaultField}" does not match any field`,
        );
      }
    }
  }
  return config;
}

/* ================================================================ */
/*  Public API: parseSearchConfig                                    */
/* ================================================================ */

/** Normalize + validate raw JSON into a fully-typed SearchConfig. */
export function parseSearchConfig(json: unknown): SearchConfig {
  return validateConfig(normalizeSearchConfig(json));
}

/** Get a named context from a parsed config; defaults to "default". */
export function getContext(
  config: SearchConfig,
  contextId?: string,
): SearchContextConfig {
  const id = contextId ?? "default";
  const ctx = config.contexts[id];
  if (!ctx) {
    const available = Object.keys(config.contexts).join(", ");
    throw new Error(`Context "${id}" not found. Available: ${available}`);
  }
  return ctx;
}

/* ================================================================ */
/*  Conversion: config → UI-compatible field descriptors             */
/* ================================================================ */

export interface SearchableField {
  name: string;
  label: string;
  type: BuiltInFieldType;
  displayFormat?: DateDisplayFormat;
  displayPattern?: string;
  /** Display format for table/response columns. Falls back to displayFormat. */
  responseDisplayFormat?: DateDisplayFormat;
  enumOptions?: { value: string; label: string }[];
  operators?: string[];
  validate?: (value: string | string[]) => string | null;
}

/**
 * Convert a context config into an array of UI field descriptors.
 * Structurally compatible with search-component's FilterableField.
 */
export function configToFilterableFields(
  ctx: SearchContextConfig,
  i18nMap?: Record<string, string>,
): SearchableField[] {
  return ctx.fields.map((field) => {
    const result: SearchableField = {
      name: field.name,
      label: i18nMap?.[field.name] ?? field.displayName,
      type: getOperatorGroupForType(field.type),
    };

    if (field.displayFormat) {
      result.displayFormat = field.displayFormat;
    }
    if (field.displayPattern) {
      result.displayPattern = field.displayPattern;
    }
    if (field.responseDisplayFormat) {
      result.responseDisplayFormat = field.responseDisplayFormat;
    }
    if (field.values) {
      result.enumOptions = field.values.map((v) => ({
        value: v.serverValue,
        label: v.displayName,
      }));
    }
    if (field.operators.length > 0) {
      result.operators = [...field.operators];
    }

    const validator = buildValidator(field);
    if (validator) {
      result.validate = validator;
    }

    return result;
  });
}

/* ================================================================ */
/*  Validation builder                                               */
/* ================================================================ */

/**
 * Build a validation function from declarative config rules.
 * Returns null when no validation is needed.
 */
export function buildValidator(
  field: FieldConfig,
): ((value: string | string[]) => string | null) | null {
  const checks: ((v: string) => string | null)[] = [];

  if (field.type === "email") {
    checks.push((v) =>
      v && !EMAIL_REGEX.test(v) ? "Invalid email address" : null,
    );
  }
  if (field.type === "url") {
    checks.push((v) => (v && !URL_REGEX.test(v) ? "Invalid URL" : null));
  }

  const val = field.validation;
  if (val) {
    if (val.required) {
      checks.push((v) => (!v || !v.trim() ? "This field is required" : null));
    }
    if (val.minLength != null) {
      const min = val.minLength;
      checks.push((v) =>
        v && v.length < min ? `Minimum ${min} characters` : null,
      );
    }
    if (val.maxLength != null) {
      const max = val.maxLength;
      checks.push((v) =>
        v && v.length > max ? `Maximum ${max} characters` : null,
      );
    }
    if (val.min != null) {
      const min = val.min;
      checks.push((v) => {
        if (!v) return null;
        const n = Number(v);
        return !Number.isNaN(n) && n < min ? `Minimum value is ${min}` : null;
      });
    }
    if (val.max != null) {
      const max = val.max;
      checks.push((v) => {
        if (!v) return null;
        const n = Number(v);
        return !Number.isNaN(n) && n > max ? `Maximum value is ${max}` : null;
      });
    }
    if (val.pattern) {
      const regex = new RegExp(val.pattern);
      const msg = val.patternMessage ?? "Value does not match required pattern";
      checks.push((v) => (v && !regex.test(v) ? msg : null));
    }
  }

  if (checks.length === 0) return null;

  return (value: string | string[]) => {
    const values = Array.isArray(value) ? value : [value];
    for (const v of values) {
      for (const check of checks) {
        const err = check(v);
        if (err) return err;
      }
    }
    return null;
  };
}

/* ================================================================ */
/*  Serialization helpers                                            */
/* ================================================================ */

/** Build field config array for serializeFilters(). */
export function buildSerializeOptions(ctx: SearchContextConfig): {
  fieldConfigs: FieldConfig[];
} {
  return { fieldConfigs: ctx.fields };
}

/** Build TMF630 `fields=` query parameter value from responseFields. */
export function serializeResponseFields(
  ctx: SearchContextConfig,
): string | undefined {
  if (!ctx.responseFields || ctx.responseFields.length === 0) return undefined;
  return ctx.responseFields.join(",");
}

/**
 * Create a FilterCondition from search text using config defaults.
 * Falls back to `field ?? "name"` and `operator ?? "containsi"` when no config
 * defaults are set.
 *
 * Returns `null` when `text` is empty/blank (no filter should be applied).
 */
export function createSearchFilter(
  ctx: SearchContextConfig | null | undefined,
  text: string,
  fallbackField = "name",
  fallbackOperator: FilterOperator = "containsi",
): { field: string; operator: FilterOperator; value: string } | null {
  const trimmed = text?.trim();
  if (!trimmed) return null;
  return {
    field: ctx?.defaults.defaultField ?? fallbackField,
    operator: ctx?.defaults.defaultOperator ?? fallbackOperator,
    value: trimmed,
  };
}
