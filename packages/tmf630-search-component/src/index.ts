/**
 * TMF630 QueryDSL Search UI — React components for rich filter panel.
 * Use with @pia-team/pia-ui-tmf630-query-core for serialization.
 *
 * Three usage modes:
 * 1. **Batteries included** — use FilterPanel/FilterChips directly
 * 2. **Customized** — pass classNames, slots, icons, unstyled
 * 3. **Headless** — use useFilterPanel() hook and build your own UI
 */

/* -- Headless hooks ------------------------------------------------ */
export { useFilterPanel } from "./useFilterPanel.js";
export { useFocusTrap } from "./useFocusTrap.js";

/* -- Utilities ----------------------------------------------------- */
export { setClassMerger } from "./utils.js";

/* -- Theme --------------------------------------------------------- */
export { FilterThemeProvider, useFilterTheme } from "./FilterThemeContext.js";

/* -- Search Config Provider ---------------------------------------- */
export { SearchConfigProvider, useSearchConfig, useSearchFields } from "./SearchConfigContext.js";

/* -- Styled components --------------------------------------------- */
export { FilterPanel } from "./FilterPanel.js";
export type { FilterPanelProps } from "./FilterPanel.js";

export { FilterRow } from "./FilterRow.js";
export type { FilterRowProps, FilterRowSlots } from "./FilterRow.js";

export { FilterChips } from "./FilterChips.js";
export type { FilterChipsProps } from "./FilterChips.js";

export { DefaultSelect } from "./DefaultSelect.js";
export type { DefaultSelectProps } from "./DefaultSelect.js";

export { BetweenValueInput } from "./BetweenValueInput.js";
export type { BetweenValueInputProps } from "./BetweenValueInput.js";

export { TagValueInput } from "./TagValueInput.js";
export type { TagValueInputProps } from "./TagValueInput.js";

export { MultiSelectInput } from "./MultiSelectInput.js";
export type { MultiSelectInputProps } from "./MultiSelectInput.js";

export { DateInput } from "./DateInput.js";
export type { DateInputProps } from "./DateInput.js";

export { DefaultValueInput } from "./DefaultValueInput.js";
export type { DefaultValueInputProps } from "./DefaultValueInput.js";

export { CompoundFilterPanel } from "./CompoundFilterPanel.js";
export type {
  CompoundFilterPanelProps,
  CompoundFilterPanelClassNames,
} from "./CompoundFilterPanel.js";

/* -- Default class constants --------------------------------------- */
export {
  filterPanelDefaults,
  filterRowDefaults,
  filterChipsDefaults,
} from "./defaults.js";

/* -- i18n presets -------------------------------------------------- */
export { labelsEn } from "./i18n/en.js";
export { labelsTr } from "./i18n/tr.js";
export { resolveLabels } from "./resolveLabels.js";

/* -- Types --------------------------------------------------------- */
export type {
  FilterableField,
  Labels,
  FilterIcons,
  FieldType,
  BuiltInFieldType,
  FilterRowClassNames,
  FilterPanelClassNames,
  FilterChipsClassNames,
  SelectSlotProps,
  ValueInputSlotProps,
  FilterThemeConfig,
  UseFilterPanelOptions,
  UseFilterPanelReturn,
  DraftFilter,
  FilterCondition,
  OperatorDefinition,
} from "./types.js";

/* -- Re-exports from core ------------------------------------------ */
export {
  serializeFilters,
  deserializeFilters,
  normalizeDateToISO,
  normalizeDateToYYYYMMDD,
  normalizeDateTimeForDisplay,
  getOperatorsForFieldType,
  operatorsRequireNoValue,
  isMultiValueOperator,
  TEXT_OPERATORS,
  DATE_OPERATORS,
  NUMERIC_OPERATORS,
  ENUM_OPERATORS,
} from "@pia-team/pia-ui-tmf630-query-core";
export type {
  FilterOperator,
  QueryParamValue,
  SearchParams,
  SortState,
  SortDirection,
  SerializeFiltersOptions,
  FieldType as CoreFieldType,
  FilterLogic,
  FilterNode,
  FilterGroup,
  PaginatedResult,
} from "@pia-team/pia-ui-tmf630-query-core";

export type {
  FieldConfig,
  FieldConfigType,
  SearchConfig,
  SearchContextConfig,
  SearchableField,
  EnumValue,
  FieldValidation,
  DateDisplayFormat,
  RawFieldConfigValue,
  RawFieldsMap,
  RawSearchContextConfig,
  RawSearchConfig,
} from "@pia-team/pia-ui-tmf630-query-core";

export {
  parseSearchConfig,
  normalizeSearchConfig,
  getContext,
  configToFilterableFields,
  buildSerializeOptions,
  buildValidator,
  serializeResponseFields,
  formatDateForDisplay,
  formatDateValue,
  getLocalTimezoneOffset,
  serializeToJsonPathFilter,
  deserializeJsonPathFilter,
  serializeSort,
  deserializeSort,
  toggleSort,
  parseTMF630Headers,
  camelToTitle,
  isTemporalType,
  getOperatorGroupForType,
  getDefaultDisplayFormat,
  OPERATOR_PRESETS,
  createSearchFilter,
} from "@pia-team/pia-ui-tmf630-query-core";

/* -- V2: Compound filter helpers ----------------------------------- */
export {
  isFilterGroup,
  serializeCompound,
  deserializeCompound,
  flattenToConditions,
  createGroup,
  groupFromFlat,
  addToGroup,
  removeFromGroup,
  toggleGroupLogic,
  countConditions,
} from "@pia-team/pia-ui-tmf630-query-core";

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
} from "@pia-team/pia-ui-tmf630-query-core";
export type {
  FilterPanelField,
  FilterPanelRow,
  FilterPanelState,
} from "@pia-team/pia-ui-tmf630-query-core";
