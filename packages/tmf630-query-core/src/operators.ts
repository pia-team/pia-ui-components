/**
 * TMF630 QueryDSL operator definitions — Full operator reference.
 * Field-type → operator mapping for UI and validation.
 */

import type { FilterOperator } from "./types.js";

export type BuiltInFieldType = "text" | "date" | "numeric" | "enum";
export type FieldType = BuiltInFieldType | (string & {});

export interface OperatorDefinition {
  value: FilterOperator;
  requiresValue: boolean;
  isMultiValue: boolean;
}

const MULTI_VALUE_OPS = new Set<FilterOperator>(["between", "in", "nin"]);
const NULL_CHECK_OPS = new Set<FilterOperator>(["isnull", "isnotnull"]);

const TEXT_OPERATORS: OperatorDefinition[] = [
  { value: "eq", requiresValue: true, isMultiValue: false },
  { value: "ne", requiresValue: true, isMultiValue: false },
  { value: "eqi", requiresValue: true, isMultiValue: false },
  { value: "nei", requiresValue: true, isMultiValue: false },
  { value: "like", requiresValue: true, isMultiValue: false },
  { value: "likei", requiresValue: true, isMultiValue: false },
  { value: "contains", requiresValue: true, isMultiValue: false },
  { value: "containsi", requiresValue: true, isMultiValue: false },
  { value: "startswith", requiresValue: true, isMultiValue: false },
  { value: "startswithi", requiresValue: true, isMultiValue: false },
  { value: "endswith", requiresValue: true, isMultiValue: false },
  { value: "endswithi", requiresValue: true, isMultiValue: false },
  { value: "regex", requiresValue: true, isMultiValue: false },
  { value: "regexi", requiresValue: true, isMultiValue: false },
  { value: "in", requiresValue: true, isMultiValue: true },
  { value: "nin", requiresValue: true, isMultiValue: true },
  { value: "isnull", requiresValue: false, isMultiValue: false },
  { value: "isnotnull", requiresValue: false, isMultiValue: false },
];

const DATE_OPERATORS: OperatorDefinition[] = [
  { value: "eq", requiresValue: true, isMultiValue: false },
  { value: "ne", requiresValue: true, isMultiValue: false },
  { value: "gt", requiresValue: true, isMultiValue: false },
  { value: "gte", requiresValue: true, isMultiValue: false },
  { value: "lt", requiresValue: true, isMultiValue: false },
  { value: "lte", requiresValue: true, isMultiValue: false },
  { value: "between", requiresValue: true, isMultiValue: true },
  { value: "in", requiresValue: true, isMultiValue: true },
  { value: "nin", requiresValue: true, isMultiValue: true },
  { value: "isnull", requiresValue: false, isMultiValue: false },
  { value: "isnotnull", requiresValue: false, isMultiValue: false },
];

const NUMERIC_OPERATORS: OperatorDefinition[] = [
  { value: "eq", requiresValue: true, isMultiValue: false },
  { value: "ne", requiresValue: true, isMultiValue: false },
  { value: "gt", requiresValue: true, isMultiValue: false },
  { value: "gte", requiresValue: true, isMultiValue: false },
  { value: "lt", requiresValue: true, isMultiValue: false },
  { value: "lte", requiresValue: true, isMultiValue: false },
  { value: "between", requiresValue: true, isMultiValue: true },
  { value: "in", requiresValue: true, isMultiValue: true },
  { value: "nin", requiresValue: true, isMultiValue: true },
  { value: "isnull", requiresValue: false, isMultiValue: false },
  { value: "isnotnull", requiresValue: false, isMultiValue: false },
];

const ENUM_OPERATORS: OperatorDefinition[] = [
  { value: "eq", requiresValue: true, isMultiValue: false },
  { value: "ne", requiresValue: true, isMultiValue: false },
  { value: "gt", requiresValue: true, isMultiValue: false },
  { value: "gte", requiresValue: true, isMultiValue: false },
  { value: "lt", requiresValue: true, isMultiValue: false },
  { value: "lte", requiresValue: true, isMultiValue: false },
  { value: "between", requiresValue: true, isMultiValue: true },
  { value: "in", requiresValue: true, isMultiValue: true },
  { value: "nin", requiresValue: true, isMultiValue: true },
  { value: "isnull", requiresValue: false, isMultiValue: false },
  { value: "isnotnull", requiresValue: false, isMultiValue: false },
];

const BY_FIELD_TYPE: Record<string, OperatorDefinition[]> = {
  text: TEXT_OPERATORS,
  date: DATE_OPERATORS,
  numeric: NUMERIC_OPERATORS,
  enum: ENUM_OPERATORS,
};

/**
 * Get operators for a field type. Supports built-in types and custom types
 * registered via the `customTypes` parameter.
 */
export function getOperatorsForFieldType(
  fieldType: FieldType,
  customTypes?: Record<string, OperatorDefinition[]>,
): OperatorDefinition[] {
  return customTypes?.[fieldType] ?? BY_FIELD_TYPE[fieldType] ?? BY_FIELD_TYPE.text;
}

export function operatorsRequireNoValue(op: FilterOperator): boolean {
  return NULL_CHECK_OPS.has(op);
}

export function isMultiValueOperator(op: FilterOperator): boolean {
  return MULTI_VALUE_OPS.has(op);
}

export {
  TEXT_OPERATORS,
  DATE_OPERATORS,
  NUMERIC_OPERATORS,
  ENUM_OPERATORS,
};
