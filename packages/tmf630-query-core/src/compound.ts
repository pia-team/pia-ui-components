/**
 * Compound filter serialization utilities.
 *
 * TMF630 query params only support flat AND semantics natively. For compound
 * AND/OR trees we produce a structured object suitable for a JSON request body
 * or a custom query parameter encoding.
 */

import type {
  FilterCondition,
  FilterGroup,
  FilterNode,
  FilterLogic,
  QueryParamValue,
} from "./types.js";
import { isFilterGroup } from "./types.js";
import { operatorsRequireNoValue, isMultiValueOperator } from "./operators.js";

/* ------------------------------------------------------------------ */
/*  Flatten utility                                                    */
/* ------------------------------------------------------------------ */

/**
 * Flatten a compound tree down to an AND-only list (strips OR groups).
 * Useful for consumers that only need flat TMF630 query params.
 */
export function flattenToConditions(node: FilterNode): FilterCondition[] {
  if (!isFilterGroup(node)) return [node];
  const result: FilterCondition[] = [];
  for (const child of node.conditions) {
    result.push(...flattenToConditions(child));
  }
  return result;
}

/* ------------------------------------------------------------------ */
/*  JSON serialization                                                 */
/* ------------------------------------------------------------------ */

interface CompoundConditionJSON {
  field: string;
  operator: string;
  value: string | string[];
}

interface CompoundGroupJSON {
  logic: FilterLogic;
  conditions: (CompoundConditionJSON | CompoundGroupJSON)[];
}

type CompoundNodeJSON = CompoundConditionJSON | CompoundGroupJSON;

function isGroupJSON(node: CompoundNodeJSON): node is CompoundGroupJSON {
  return "logic" in node && "conditions" in node;
}

/**
 * Serialize a compound filter tree to a plain JSON-serializable object.
 * Send as request body or store in application state.
 */
export function serializeCompound(root: FilterGroup): CompoundGroupJSON {
  return serializeNode(root) as CompoundGroupJSON;
}

function serializeNode(node: FilterNode): CompoundNodeJSON {
  if (isFilterGroup(node)) {
    return {
      logic: node.logic,
      conditions: node.conditions.map(serializeNode),
    };
  }
  return { field: node.field, operator: node.operator, value: node.value };
}

/**
 * Deserialize a JSON object back to a FilterGroup tree.
 */
export function deserializeCompound(json: CompoundGroupJSON): FilterGroup {
  return deserializeGroupJSON(json);
}

function deserializeGroupJSON(json: CompoundGroupJSON): FilterGroup {
  return {
    logic: json.logic,
    conditions: json.conditions.map((c) => {
      if (isGroupJSON(c)) return deserializeGroupJSON(c);
      return {
        field: c.field,
        operator: c.operator,
        value: c.value,
      } as FilterCondition;
    }),
  };
}

/* ------------------------------------------------------------------ */
/*  Builder helpers                                                    */
/* ------------------------------------------------------------------ */

/** Create a new empty group */
export function createGroup(logic: FilterLogic = "and"): FilterGroup {
  return { logic, conditions: [] };
}

/** Create a group from flat conditions (all joined by AND) */
export function groupFromFlat(
  conditions: FilterCondition[],
  logic: FilterLogic = "and",
): FilterGroup {
  return { logic, conditions: [...conditions] };
}

/** Add a condition or nested group to a group (immutable) */
export function addToGroup(
  group: FilterGroup,
  node: FilterNode,
): FilterGroup {
  return { ...group, conditions: [...group.conditions, node] };
}

/** Remove a node at an index from a group (immutable) */
export function removeFromGroup(
  group: FilterGroup,
  index: number,
): FilterGroup {
  return {
    ...group,
    conditions: group.conditions.filter((_, i) => i !== index),
  };
}

/** Toggle the logic of a group (immutable) */
export function toggleGroupLogic(group: FilterGroup): FilterGroup {
  return {
    ...group,
    logic: group.logic === "and" ? "or" : "and",
  };
}

/** Count the total number of leaf conditions in a tree */
export function countConditions(node: FilterNode): number {
  if (!isFilterGroup(node)) return 1;
  return node.conditions.reduce(
    (sum, child) => sum + countConditions(child),
    0,
  );
}
