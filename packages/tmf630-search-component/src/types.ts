import type * as React from "react";
import type {
  FilterCondition,
  OperatorDefinition,
} from "@pia-team/pia-ui-tmf630-query-core";

/* ------------------------------------------------------------------ */
/*  Field Types                                                        */
/* ------------------------------------------------------------------ */

export type BuiltInFieldType = "text" | "date" | "numeric" | "enum";
export type FieldType = BuiltInFieldType | (string & {});

export interface FilterableField {
  name: string;
  label: string;
  type: FieldType;
  displayFormat?: "date" | "datetime";
  displayPattern?: string;
  /** Display format for table/response columns. Falls back to displayFormat. */
  responseDisplayFormat?: "date" | "datetime";
  enumOptions?: { value: string; label: string }[];
  /** Allowed operator codes. When set, only these operators are shown. */
  operators?: string[];
  /** Per-field validation. Return error string or null. */
  validate?: (value: string | string[]) => string | null;
}

/* ------------------------------------------------------------------ */
/*  Labels                                                             */
/* ------------------------------------------------------------------ */

export interface Labels {
  title: string;
  addFilter: string;
  apply: string;
  clearAll: string;
  activeFilters: string;
  removeFilter: string;
  close?: string;
  operators: Record<string, string>;
}

/* ------------------------------------------------------------------ */
/*  Icons                                                              */
/* ------------------------------------------------------------------ */

export interface FilterIcons {
  close?: React.ReactNode;
  remove?: React.ReactNode;
  trigger?: React.ReactNode;
  filter?: React.ReactNode;
  add?: React.ReactNode;
  apply?: React.ReactNode;
}

/* ------------------------------------------------------------------ */
/*  ClassNames (slot-based overrides)                                  */
/* ------------------------------------------------------------------ */

export interface FilterRowClassNames {
  root?: string;
  fieldTrigger?: string;
  fieldContent?: string;
  fieldItem?: string;
  operatorTrigger?: string;
  operatorContent?: string;
  operatorItem?: string;
  valueInput?: string;
  removeButton?: string;
  error?: string;
}

export interface FilterPanelClassNames {
  root?: string;
  trigger?: string;
  panel?: string;
  header?: string;
  title?: string;
  closeButton?: string;
  filterList?: string;
  actions?: string;
  addButton?: string;
  applyButton?: string;
  clearButton?: string;
}

export interface FilterChipsClassNames {
  root?: string;
  label?: string;
  chip?: string;
  chipRemove?: string;
  clearAll?: string;
}

/* ------------------------------------------------------------------ */
/*  Render Slot Props                                                  */
/* ------------------------------------------------------------------ */

export interface SelectSlotProps {
  value: string;
  options: { value: string; label: string; disabled?: boolean }[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  "data-slot"?: string;
  "aria-label"?: string;
}

export interface ValueInputSlotProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  type: FieldType;
  multiValue?: boolean;
  enumOptions?: { value: string; label: string }[];
}

/* ------------------------------------------------------------------ */
/*  Theme                                                              */
/* ------------------------------------------------------------------ */

export interface FilterThemeConfig {
  classNames?: {
    panel?: FilterPanelClassNames;
    row?: FilterRowClassNames;
    chips?: FilterChipsClassNames;
  };
  labels?: Partial<Labels>;
  unstyled?: boolean;
  icons?: FilterIcons;
}

/* ------------------------------------------------------------------ */
/*  Headless Hook Types                                                */
/* ------------------------------------------------------------------ */

export interface UseFilterPanelOptions {
  fields: FilterableField[];
  initialFilters?: FilterCondition[];
  defaultFilter?: FilterCondition;
  customFieldTypes?: Record<string, OperatorDefinition[]>;
  onApply?: (filters: FilterCondition[]) => void;
  onFilterAdd?: (filter: FilterCondition) => void;
  onFilterRemove?: (index: number, filter: FilterCondition) => void;
  onFilterChange?: (index: number, filter: FilterCondition) => void;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  validate?: (filter: FilterCondition, field?: FilterableField) => string | null;
}

export interface DraftFilter extends FilterCondition {
  _id: string;
}

export interface UseFilterPanelReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  filters: DraftFilter[];
  addFilter: () => void;
  removeFilter: (index: number) => void;
  updateFilter: (index: number, filter: FilterCondition) => void;
  apply: () => void;
  clearAll: () => void;
  errors: Map<string, string>;
  getFieldOperators: (fieldName: string) => OperatorDefinition[];
}

export type { FilterCondition, OperatorDefinition };
