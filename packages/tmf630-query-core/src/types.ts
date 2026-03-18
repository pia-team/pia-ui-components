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

/** A single filter condition (flat; no AND/OR groups in V1) */
export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: string | string[];
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
}

/** Query param value for serialization (single or repeated for multi-value ops) */
export type QueryParamValue = string | string[];
