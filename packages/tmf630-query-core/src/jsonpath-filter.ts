/**
 * JsonPath filter= serialization for TMF630 compound filters.
 * Converts FilterGroup tree ↔ $[?(...)] expression.
 *
 * Operator mapping: eq→==, ne→!=, gt→>, gte→>=, lt→<, lte→<=
 * String values single-quoted, numbers bare, booleans true/false.
 */

import type { FilterCondition, FilterGroup, FilterNode } from "./types.js";
import { isFilterGroup } from "./types.js";
import type { FieldConfig } from "./config.js";
import { isTemporalType } from "./config.js";
import { formatDateValue } from "./serialize.js";

/* ================================================================ */
/*  Operator mapping                                                 */
/* ================================================================ */

const OP_MAP: Record<string, string> = {
  eq: "==",
  ne: "!=",
  gt: ">",
  gte: ">=",
  lt: "<",
  lte: "<=",
};

const REVERSE_OP_MAP: Record<string, string> = {};
for (const [k, v] of Object.entries(OP_MAP)) {
  REVERSE_OP_MAP[v] = k;
}

const LOGIC_MAP: Record<string, string> = {
  and: "&&",
  or: "||",
};

/* ================================================================ */
/*  Serialize: FilterGroup → $[?(...)]                               */
/* ================================================================ */

function formatValue(value: string): string {
  if (value === "true" || value === "false") return value;
  if (value === "null") return value;
  const num = Number(value);
  if (!Number.isNaN(num) && value.trim() !== "") return value;
  return `'${value.replace(/'/g, "\\'")}'`;
}

/* ---------------------------------------------------------------- */
/*  Date displayFormat="date" → compound expression translation      */
/* ---------------------------------------------------------------- */

function computeNextDay(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dayBoundary(dateStr: string, fieldType: FieldConfig["type"]): string {
  return formatDateValue(`${dateStr} 00:00:00`, fieldType);
}

function nextDayBoundary(dateStr: string, fieldType: FieldConfig["type"]): string {
  return formatDateValue(`${computeNextDay(dateStr)} 00:00:00`, fieldType);
}

/**
 * When displayFormat="date" but the backend stores timestamps,
 * expand eq/ne/gt/gte/lt/lte/between to day-boundary range expressions.
 * Returns null when no translation is needed.
 */
function translateDateForJsonPath(
  condition: FilterCondition,
  field: FieldConfig,
): string | null {
  if (!field.displayFormat || field.displayFormat !== "date") return null;
  if (field.type === "date") return null;
  if (!isTemporalType(field.type)) return null;

  const f = `@.${condition.field}`;
  const type = field.type;

  if (condition.operator === "between") {
    const vals = Array.isArray(condition.value) ? condition.value : [];
    if (vals.length < 2) return null;
    const s = vals[0]!.trim();
    const e = vals[1]!.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || !/^\d{4}-\d{2}-\d{2}$/.test(e)) return null;
    return `(${f} >= ${formatValue(dayBoundary(s, type))} && ${f} < ${formatValue(nextDayBoundary(e, type))})`;
  }

  const rawValue = Array.isArray(condition.value)
    ? condition.value[0] ?? ""
    : condition.value;
  const trimmed = rawValue.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;

  const start = dayBoundary(trimmed, type);
  const nextStart = nextDayBoundary(trimmed, type);

  switch (condition.operator) {
    case "eq":
      return `(${f} >= ${formatValue(start)} && ${f} < ${formatValue(nextStart)})`;
    case "ne":
      return `(${f} < ${formatValue(start)} || ${f} >= ${formatValue(nextStart)})`;
    case "gt":
      return `${f} >= ${formatValue(nextStart)}`;
    case "gte":
      return `${f} >= ${formatValue(start)}`;
    case "lt":
      return `${f} < ${formatValue(start)}`;
    case "lte":
      return `${f} < ${formatValue(nextStart)}`;
    default:
      return null;
  }
}

/* ---------------------------------------------------------------- */

function serializeNode(
  node: FilterNode,
  fieldConfigMap: Map<string, FieldConfig>,
): string {
  if (isFilterGroup(node)) {
    return serializeGroup(node, fieldConfigMap);
  }

  const condition = node as FilterCondition;
  const fieldConfig = fieldConfigMap.get(condition.field);

  if (fieldConfig) {
    const translated = translateDateForJsonPath(condition, fieldConfig);
    if (translated) return translated;
  }

  const op = OP_MAP[condition.operator];
  if (!op) {
    throw new Error(
      `Unsupported operator "${condition.operator}" for JsonPath filter`,
    );
  }

  let rawValue = Array.isArray(condition.value)
    ? condition.value[0] ?? ""
    : condition.value;

  if (fieldConfig && fieldConfig.type !== "text" && fieldConfig.type !== "enum") {
    rawValue = formatDateValue(rawValue, fieldConfig.type);
  }

  return `@.${condition.field} ${op} ${formatValue(rawValue)}`;
}

function serializeGroup(
  group: FilterGroup,
  fieldConfigMap: Map<string, FieldConfig>,
): string {
  const logicOp = LOGIC_MAP[group.logic] ?? "&&";
  const parts = group.conditions.map((node) => {
    const expr = serializeNode(node, fieldConfigMap);
    if (isFilterGroup(node) && node.conditions.length > 1) {
      return `(${expr})`;
    }
    return expr;
  });
  return parts.join(` ${logicOp} `);
}

/**
 * Serialize a compound filter group to a TMF630 JsonPath filter= expression.
 *
 * @example
 * serializeToJsonPathFilter(group, fieldConfigs)
 * // "$[?(@.name == 'Alice' && (@.age > 18 || @.status == 'active'))]"
 */
export function serializeToJsonPathFilter(
  group: FilterGroup,
  fieldConfigs: FieldConfig[],
): string {
  const configMap = new Map<string, FieldConfig>();
  for (const fc of fieldConfigs) {
    configMap.set(fc.name, fc);
  }

  if (group.conditions.length === 0) return "";
  const inner = serializeGroup(group, configMap);
  return `$[?(${inner})]`;
}

/* ================================================================ */
/*  Deserialize: $[?(...)] → FilterGroup                             */
/* ================================================================ */

interface Token {
  type: "field" | "op" | "value" | "logic" | "paren";
  value: string;
}

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < expr.length) {
    if (/\s/.test(expr[i]!)) {
      i++;
      continue;
    }

    if (expr[i] === "(" || expr[i] === ")") {
      tokens.push({ type: "paren", value: expr[i]! });
      i++;
      continue;
    }

    if (expr.startsWith("&&", i)) {
      tokens.push({ type: "logic", value: "&&" });
      i += 2;
      continue;
    }
    if (expr.startsWith("||", i)) {
      tokens.push({ type: "logic", value: "||" });
      i += 2;
      continue;
    }

    if (expr.startsWith("@.", i)) {
      i += 2;
      let field = "";
      while (i < expr.length && /[\w.]/.test(expr[i]!)) {
        field += expr[i];
        i++;
      }
      tokens.push({ type: "field", value: field });
      continue;
    }

    for (const op of ["==", "!=", ">=", "<=", ">", "<"]) {
      if (expr.startsWith(op, i)) {
        tokens.push({ type: "op", value: op });
        i += op.length;
        break;
      }
    }

    if (expr[i] === "'") {
      i++;
      let val = "";
      while (i < expr.length && expr[i] !== "'") {
        if (expr[i] === "\\" && expr[i + 1] === "'") {
          val += "'";
          i += 2;
        } else {
          val += expr[i];
          i++;
        }
      }
      i++;
      tokens.push({ type: "value", value: val });
      continue;
    }

    if (/[\d\-]/.test(expr[i]!) || expr.startsWith("true", i) || expr.startsWith("false", i) || expr.startsWith("null", i)) {
      let val = "";
      if (expr.startsWith("true", i)) { val = "true"; i += 4; }
      else if (expr.startsWith("false", i)) { val = "false"; i += 5; }
      else if (expr.startsWith("null", i)) { val = "null"; i += 4; }
      else {
        while (i < expr.length && /[\d.\-eE+]/.test(expr[i]!)) {
          val += expr[i];
          i++;
        }
      }
      tokens.push({ type: "value", value: val });
      continue;
    }

    i++;
  }

  return tokens;
}

function parseTokens(tokens: Token[], pos: { i: number }): FilterNode {
  const conditions: FilterNode[] = [];
  let logic: "and" | "or" = "and";

  while (pos.i < tokens.length) {
    const token = tokens[pos.i]!;

    if (token.type === "paren" && token.value === ")") {
      pos.i++;
      break;
    }

    if (token.type === "paren" && token.value === "(") {
      pos.i++;
      const subGroup = parseTokens(tokens, pos);
      conditions.push(subGroup);
      continue;
    }

    if (token.type === "logic") {
      logic = token.value === "||" ? "or" : "and";
      pos.i++;
      continue;
    }

    if (token.type === "field") {
      const field = token.value;
      pos.i++;
      const opToken = tokens[pos.i];
      if (!opToken || opToken.type !== "op") {
        pos.i++;
        continue;
      }
      const operator = REVERSE_OP_MAP[opToken.value] ?? "eq";
      pos.i++;
      const valToken = tokens[pos.i];
      const value = valToken?.type === "value" ? valToken.value : "";
      if (valToken?.type === "value") pos.i++;
      conditions.push({
        field,
        operator: operator as FilterCondition["operator"],
        value,
      });
      continue;
    }

    pos.i++;
  }

  if (conditions.length === 1 && !isFilterGroup(conditions[0]!)) {
    return conditions[0]!;
  }

  return { logic, conditions };
}

/**
 * Parse a TMF630 JsonPath filter= expression back into a FilterGroup.
 *
 * @example
 * deserializeJsonPathFilter("$[?(@.name == 'Alice' && @.age > 18)]")
 */
export function deserializeJsonPathFilter(expr: string): FilterGroup {
  let inner = expr.trim();

  if (inner.startsWith("$[?(") && inner.endsWith(")]")) {
    inner = inner.slice(4, -2);
  } else if (inner.startsWith("[?(") && inner.endsWith(")]")) {
    inner = inner.slice(3, -2);
  }

  const tokens = tokenize(inner);
  const pos = { i: 0 };
  const result = parseTokens(tokens, pos);

  if (isFilterGroup(result)) return result;
  return { logic: "and", conditions: [result] };
}
