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

/* -- Styled components --------------------------------------------- */
export { FilterPanel } from "./FilterPanel.js";
export type { FilterPanelProps } from "./FilterPanel.js";

export { FilterRow } from "./FilterRow.js";
export type { FilterRowProps, FilterRowSlots } from "./FilterRow.js";

export { FilterChips } from "./FilterChips.js";
export type { FilterChipsProps } from "./FilterChips.js";

export { DefaultSelect } from "./DefaultSelect.js";
export type { DefaultSelectProps } from "./DefaultSelect.js";

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
  SearchParams,
  SortState,
  SerializeFiltersOptions,
  FieldType as CoreFieldType,
  FilterLogic,
  FilterNode,
  FilterGroup,
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
