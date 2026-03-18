/**
 * TMF630 QueryDSL core — framework-agnostic types and serialization.
 * Use from React, Angular, Node, or any consumer.
 */

export type {
  FilterCondition,
  FilterOperator,
  QueryParamValue,
  SearchParams,
  SortDirection,
  SortState,
} from "./types.js";

export {
  getOperatorsForFieldType,
  isMultiValueOperator,
  operatorsRequireNoValue,
} from "./operators.js";
export type { FieldType, OperatorDefinition } from "./operators.js";

export { deserializeFilters } from "./deserialize.js";

export {
  normalizeDateToISO,
  normalizeDateToYYYYMMDD,
  serializeFilters,
} from "./serialize.js";
export type { SerializeFiltersOptions } from "./serialize.js";
