/**
 * TMF630 QueryDSL operator definitions — Full operator reference.
 * Field-type → operator mapping for UI and validation.
 */

import type { FilterOperator } from "./types.js";

export type FieldType = "text" | "date" | "numeric" | "enum";

export interface OperatorDefinition {
  value: FilterOperator;
  /** Does this operator require a value input? */
  requiresValue: boolean;
  /** Does this operator take multiple values? (between, in, nin) */
  isMultiValue: boolean;
}

const MULTI_VALUE_OPS = new Set<FilterOperator>(["between", "in", "nin"]);
const NULL_CHECK_OPS = new Set<FilterOperator>(["isnull", "isnotnull"]);

/** All text/string operators per TMF630 */
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

/** Date/comparable operators (in/nin valid per TMF630 "Any type" rule) */
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

/** Numeric operators (in/nin/isnull/isnotnull valid per TMF630 "Any type" rule) */
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

/** Enum: eq, ne, in, nin + isnull/isnotnull (Any type) + comparable ops */
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

const BY_FIELD_TYPE: Record<FieldType, OperatorDefinition[]> = {
  text: TEXT_OPERATORS,
  date: DATE_OPERATORS,
  numeric: NUMERIC_OPERATORS,
  enum: ENUM_OPERATORS,
};

export function getOperatorsForFieldType(
  fieldType: FieldType,
): OperatorDefinition[] {
  return BY_FIELD_TYPE[fieldType];
}

export function operatorsRequireNoValue(op: FilterOperator): boolean {
  return NULL_CHECK_OPS.has(op);
}

export function isMultiValueOperator(op: FilterOperator): boolean {
  return MULTI_VALUE_OPS.has(op);
}
