/**
 * Framework-agnostic filter panel state management.
 * Pure functions with no side effects — usable from React, Angular, Vue, or vanilla JS.
 */

import type { FilterCondition, FilterOperator } from "./types.js";
import type { OperatorDefinition } from "./operators.js";
import {
  getOperatorsForFieldType,
  operatorsRequireNoValue,
  isMultiValueOperator,
} from "./operators.js";
import type { SerializeFiltersOptions } from "./serialize.js";
import { serializeFilters } from "./serialize.js";
import type { DateDisplayFormat } from "./config.js";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface FilterPanelField {
  name: string;
  label: string;
  type: string;
  displayFormat?: DateDisplayFormat;
  displayPattern?: string;
  responseDisplayFormat?: DateDisplayFormat;
  enumOptions?: { value: string; label: string }[];
  operators?: string[];
  validate?: (value: string | string[]) => string | null;
}

export interface FilterPanelRow {
  id: string;
  field: string;
  operator: string;
  value: string | string[];
}

export interface FilterPanelState {
  rows: FilterPanelRow[];
  errors: Map<string, string>;
}

/* ------------------------------------------------------------------ */
/*  ID generation                                                      */
/* ------------------------------------------------------------------ */

let counter = 0;

function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `fp-${Date.now()}-${++counter}`;
}

function toRow(f: FilterCondition): FilterPanelRow {
  return { id: generateId(), field: f.field, operator: f.operator, value: f.value };
}

/* ------------------------------------------------------------------ */
/*  Pure helpers (extracted from useFilterPanel)                        */
/* ------------------------------------------------------------------ */

const EMPTY_FILTER: FilterCondition = { field: "", operator: "eq", value: "" };

/**
 * Resolve the default row to use when the panel opens or resets.
 * Falls back to the first field in the list if the provided default is invalid.
 */
export function resolveDefaultRow(
  defaultFilter: FilterCondition | undefined,
  fields: FilterPanelField[],
): FilterCondition {
  const df = defaultFilter ?? EMPTY_FILTER;
  const first = fields[0];
  if (df.field && fields.some((f) => f.name === df.field)) {
    return { field: df.field, operator: df.operator, value: df.value ?? "" };
  }
  if (first) return { field: first.name, operator: "eq", value: "" };
  return df;
}

/**
 * Get the allowed operators for a field, respecting the field's `operators` allowlist.
 */
export function getFieldOperators(
  fieldName: string,
  fields: FilterPanelField[],
  customFieldTypes?: Record<string, OperatorDefinition[]>,
): OperatorDefinition[] {
  const fieldDef = fields.find((f) => f.name === fieldName);
  const fieldType = fieldDef?.type ?? "text";
  const all = getOperatorsForFieldType(fieldType, customFieldTypes);
  if (fieldDef?.operators) {
    return all.filter((op) => fieldDef.operators!.includes(op.value));
  }
  return all;
}

/**
 * Normalize a filter row so that its field and operator are valid
 * given the current field list. Corrects invalid field/operator combinations.
 */
export function normalizeFilterRow(
  f: FilterCondition,
  fields: FilterPanelField[],
  fallback: FilterCondition,
  customFieldTypes?: Record<string, OperatorDefinition[]>,
): FilterCondition {
  const validField =
    f.field && fields.some((x) => x.name === f.field) ? f.field : fallback.field;
  const ops = getFieldOperators(validField, fields, customFieldTypes);
  const validOperator = ops.some((o) => o.value === f.operator)
    ? f.operator
    : ops.some((o) => o.value === fallback.operator)
      ? fallback.operator
      : (ops[0]?.value ?? "eq");
  if (f.field === validField && f.operator === validOperator) return f;
  return { ...f, field: validField, operator: validOperator as FilterOperator };
}

/* ------------------------------------------------------------------ */
/*  State management (pure reducers)                                   */
/* ------------------------------------------------------------------ */

/**
 * Create the initial filter panel state.
 */
export function createFilterPanelState(
  initialFilters?: FilterCondition[],
  defaultRow?: FilterCondition,
): FilterPanelState {
  const fallback = defaultRow ?? EMPTY_FILTER;
  const source =
    initialFilters && initialFilters.length > 0 ? initialFilters : [fallback];
  return {
    rows: source.map(toRow),
    errors: new Map(),
  };
}

/**
 * Add a new filter row using the default row template.
 */
export function addFilterRow(
  state: FilterPanelState,
  defaultRow: FilterCondition,
): FilterPanelState {
  return {
    ...state,
    rows: [...state.rows, toRow(defaultRow)],
  };
}

/**
 * Remove a filter row at the given index.
 * Guarantees at least one row remains (replaces with defaultRow if needed).
 */
export function removeFilterRow(
  state: FilterPanelState,
  index: number,
  defaultRow: FilterCondition,
): FilterPanelState {
  const next = state.rows.filter((_, i) => i !== index);
  return {
    ...state,
    rows: next.length > 0 ? next : [toRow(defaultRow)],
  };
}

/**
 * Update a filter row at the given index, preserving its id.
 */
export function updateFilterRow(
  state: FilterPanelState,
  index: number,
  filter: FilterCondition,
): FilterPanelState {
  const rows = [...state.rows];
  const existing = rows[index];
  if (existing) {
    rows[index] = { ...filter, id: existing.id };
  }
  return { ...state, rows };
}

/**
 * Extract active (non-empty) filter conditions from the panel state.
 * Strips internal `id` field. Keeps isnull/isnotnull even with empty values.
 */
export function applyFilterRows(state: FilterPanelState): FilterCondition[] {
  return state.rows
    .map(({ id: _, ...rest }) => rest as FilterCondition)
    .filter((f) => {
      if (operatorsRequireNoValue(f.operator)) return true;
      if (Array.isArray(f.value))
        return f.value.some((v) => String(v).trim() !== "");
      return String(f.value ?? "").trim() !== "";
    });
}

/**
 * Reset the panel to a single default row with no errors.
 */
export function clearFilterRows(defaultRow: FilterCondition): FilterPanelState {
  return {
    rows: [toRow(defaultRow)],
    errors: new Map(),
  };
}

/**
 * Run validation on all rows. Returns a Map of row id -> error message.
 * Empty map means all rows are valid.
 */
export function validateFilterRows(
  state: FilterPanelState,
  fields: FilterPanelField[],
  globalValidate?: (filter: FilterCondition, field?: FilterPanelField) => string | null,
): Map<string, string> {
  const errors = new Map<string, string>();
  for (const row of state.rows) {
    const fieldDef = fields.find((f) => f.name === row.field);
    const condition: FilterCondition = {
      field: row.field,
      operator: row.operator as FilterOperator,
      value: row.value,
    };
    const globalErr = globalValidate?.(condition, fieldDef);
    const fieldErr = fieldDef?.validate?.(row.value);
    const err = globalErr ?? fieldErr;
    if (err) errors.set(row.id, err);
  }
  return errors;
}

/* ------------------------------------------------------------------ */
/*  Smart field/operator change helpers                                */
/* ------------------------------------------------------------------ */

/**
 * Change the field of a row, auto-correcting the operator if needed.
 * Preserves the value when the new field's operators still include the
 * current operator; otherwise picks the first valid operator and resets
 * the value.
 */
export function changeRowField(
  state: FilterPanelState,
  index: number,
  newFieldName: string,
  fields: FilterPanelField[],
  customFieldTypes?: Record<string, OperatorDefinition[]>,
): FilterPanelState {
  const row = state.rows[index];
  if (!row) return state;
  const newOps = getFieldOperators(newFieldName, fields, customFieldTypes);
  const operatorStillValid = newOps.some((o) => o.value === row.operator);
  const newOperator = operatorStillValid
    ? row.operator
    : (newOps[0]?.value ?? "eq");
  const newValue = operatorStillValid ? row.value : "";
  return updateFilterRow(state, index, {
    field: newFieldName,
    operator: newOperator as FilterOperator,
    value: newValue,
  });
}

/**
 * Change the operator of a row, adapting the value to the new operator's
 * input type.
 * - Single → multi-value: wraps existing value in an array
 * - Multi-value → single: takes the first element
 * - No-value operators (isnull/isnotnull): preserves value internally
 */
export function changeRowOperator(
  state: FilterPanelState,
  index: number,
  newOperator: string,
  fields: FilterPanelField[],
  customFieldTypes?: Record<string, OperatorDefinition[]>,
): FilterPanelState {
  const row = state.rows[index];
  if (!row) return state;
  const ops = getFieldOperators(row.field, fields, customFieldTypes);
  const opDef = ops.find((o) => o.value === newOperator);
  const wasMulti = isMultiValueOperator(row.operator as FilterOperator);
  const isNowMulti = opDef?.isMultiValue ?? false;

  let newValue = row.value;
  if (!wasMulti && isNowMulti) {
    const single = typeof row.value === "string" ? row.value : row.value[0] ?? "";
    newValue = single ? [single, ""] : ["", ""];
  } else if (wasMulti && !isNowMulti) {
    newValue = Array.isArray(row.value) ? (row.value[0] ?? "") : row.value;
  }

  return updateFilterRow(state, index, {
    field: row.field,
    operator: newOperator as FilterOperator,
    value: newValue,
  });
}

/* ------------------------------------------------------------------ */
/*  Convenience: apply + serialize in one step                         */
/* ------------------------------------------------------------------ */

/**
 * Apply active filters and serialize them to TMF630 query params in one step.
 * Combines `applyFilterRows` + `serializeFilters` for convenience.
 */
export function applyAndSerialize(
  state: FilterPanelState,
  serializeOptions: SerializeFiltersOptions,
): Record<string, string | string[]> {
  const conditions = applyFilterRows(state);
  return serializeFilters(conditions, serializeOptions);
}
