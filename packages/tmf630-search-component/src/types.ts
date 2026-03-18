import type { FilterCondition } from "@pia-team/pia-ui-tmf630-query-core";

export type FieldType = "text" | "date" | "numeric" | "enum";

/** Field definition for the filter panel (name, label, type, optional enum options) */
export interface FilterableField {
  name: string;
  label: string;
  type: FieldType;
  /** For type "enum", optional list of options */
  enumOptions?: { value: string; label: string }[];
}

/** Labels for panel and operators — pass from app i18n or use default from i18n/en.ts */
export interface Labels {
  title: string;
  addFilter: string;
  apply: string;
  clearAll: string;
  activeFilters: string;
  removeFilter: string;
  /** Operator display names: key = operator value (eq, ne, ...) */
  operators: Record<string, string>;
}

export type { FilterCondition };
