/**
 * TMF630 QueryDSL types — aligned with Full QueryDSL operator reference.
 * Framework-agnostic; use from React, Angular, Node, etc.
 */

/** All TMF630 filter operators */
export type FilterOperator =
  | "eq"
  | "ne"
  | "eqi"
  | "nei"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "between"
  | "in"
  | "nin"
  | "isnull"
  | "isnotnull"
  | "like"
  | "likei"
  | "contains"
  | "containsi"
  | "startswith"
  | "startswithi"
  | "endswith"
  | "endswithi"
  | "regex"
  | "regexi";

/** A single filter condition */
export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: string | string[];
}

/* ------------------------------------------------------------------ */
/*  V2 — Compound / grouped filters                                    */
/* ------------------------------------------------------------------ */

/** Logical join for compound filter groups */
export type FilterLogic = "and" | "or";

/**
 * A node in a compound filter tree.
 * Leaves are FilterCondition; branches are FilterGroup.
 */
export type FilterNode = FilterCondition | FilterGroup;

/** Compound filter group — recursive; can nest groups inside groups. */
export interface FilterGroup {
  logic: FilterLogic;
  conditions: FilterNode[];
}

/** Type guard: is a FilterNode a group? */
export function isFilterGroup(node: FilterNode): node is FilterGroup {
  return "logic" in node && "conditions" in node;
}

/** Sort direction */
export type SortDirection = "asc" | "desc";

/** Sort state for UI */
export interface SortState {
  field: string;
  direction: SortDirection;
}

/** TMF630 search params: offset, limit, sort, fields, filters */
export interface SearchParams {
  offset?: number;
  limit?: number;
  sort?: string;
  fields?: string;
  filters?: FilterCondition[];
  /** Config-driven field definitions for type-aware serialization */
  fieldConfigs?: import("./config.js").FieldConfig[];
}

/** Query param value for serialization (single or repeated for multi-value ops) */
export type QueryParamValue = string | string[];
