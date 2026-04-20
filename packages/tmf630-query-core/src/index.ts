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
  FilterLogic,
  FilterNode,
  FilterGroup,
} from "./types.js";
export { isFilterGroup } from "./types.js";

export {
  getOperatorsForFieldType,
  isMultiValueOperator,
  operatorsRequireNoValue,
  TEXT_OPERATORS,
  DATE_OPERATORS,
  NUMERIC_OPERATORS,
  ENUM_OPERATORS,
} from "./operators.js";
export type { FieldType, BuiltInFieldType, OperatorDefinition } from "./operators.js";

export { deserializeFilters } from "./deserialize.js";

export {
  normalizeDateToISO,
  normalizeDateToYYYYMMDD,
  normalizeDateTimeForDisplay,
  getLocalTimezoneOffset,
  formatDateValue,
  serializeFilters,
} from "./serialize.js";
export type { SerializeFiltersOptions } from "./serialize.js";

/* -- Sort ---------------------------------------------------------- */
export { serializeSort, deserializeSort, toggleSort } from "./sort.js";

/* -- Pagination (TMF630 headers) ----------------------------------- */
export { parseTMF630Headers } from "./pagination.js";
export type { PaginatedResult } from "./pagination.js";

/* -- V2: Compound / grouped filters -------------------------------- */
export {
  serializeCompound,
  deserializeCompound,
  flattenToConditions,
  createGroup,
  groupFromFlat,
  addToGroup,
  removeFromGroup,
  toggleGroupLogic,
  countConditions,
} from "./compound.js";

/* -- V3: Search configuration -------------------------------------- */
export {
  parseSearchConfig,
  normalizeSearchConfig,
  getContext,
  configToFilterableFields,
  buildSerializeOptions,
  buildValidator,
  serializeResponseFields,
  camelToTitle,
  isTemporalType,
  getOperatorGroupForType,
  getDefaultDisplayFormat,
  OPERATOR_PRESETS,
  createSearchFilter,
} from "./config.js";
export type {
  FieldConfigType,
  DateDisplayFormat,
  EnumValue,
  FieldValidation,
  RawFieldConfigValue,
  RawFieldsMap,
  RawSearchContextConfig,
  RawSearchConfig,
  FieldConfig,
  SearchContextConfig,
  SearchConfig,
  SearchableField,
} from "./config.js";

/* -- V3: Date display formatting ----------------------------------- */
export { formatDateForDisplay } from "./date-display.js";

/* -- V3: JsonPath filter= serialization ---------------------------- */
export {
  serializeToJsonPathFilter,
  deserializeJsonPathFilter,
} from "./jsonpath-filter.js";

/* -- V4: Filter panel state (framework-agnostic) ------------------- */
export {
  resolveDefaultRow,
  getFieldOperators,
  normalizeFilterRow,
  createFilterPanelState,
  addFilterRow,
  removeFilterRow,
  updateFilterRow,
  applyFilterRows,
  clearFilterRows,
  validateFilterRows,
  changeRowField,
  changeRowOperator,
  applyAndSerialize,
} from "./filter-panel-state.js";
export type {
  FilterPanelField,
  FilterPanelRow,
  FilterPanelState,
} from "./filter-panel-state.js";
