"use client";

import * as React from "react";
import type { FilterCondition, FilterOperator } from "@pia-team/pia-ui-tmf630-query-core";
import { normalizeDateToYYYYMMDD } from "@pia-team/pia-ui-tmf630-query-core";
import type { FilterableField, Labels } from "./types.js";

export interface FilterChipsProps {
  filters: FilterCondition[];
  fields: FilterableField[];
  labels: Labels;
  onRemove: (index: number) => void;
  onClearAll: () => void;
}

function formatFilterValue(
  value: string | string[],
  isDateField?: boolean,
): string {
  if (Array.isArray(value)) {
    const formatted = isDateField
      ? value.map((v) => normalizeDateToYYYYMMDD(String(v)) || v).join(", ")
      : value.join(", ");
    return formatted;
  }
  if (isDateField && value) {
    return normalizeDateToYYYYMMDD(String(value)) || value;
  }
  return String(value ?? "");
}

export function FilterChips({
  filters,
  fields,
  labels,
  onRemove,
  onClearAll,
}: FilterChipsProps) {
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">
        {labels.activeFilters}:
      </span>
      {filters.map((filter, index) => {
        const fieldDef = fields.find((f) => f.name === filter.field);
        const label = fieldDef?.label ?? filter.field;
        const opLabel = labels.operators[filter.operator as FilterOperator] ?? filter.operator;
        const isDateField = fieldDef?.type === "date";
        const valueStr = formatFilterValue(filter.value, isDateField);
        const chipLabel = valueStr
          ? `${label} ${opLabel} "${valueStr}"`
          : `${label} ${opLabel}`;

        return (
          <span
            key={`${filter.field}-${filter.operator}-${index}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 pr-1 text-xs text-primary"
          >
            {chipLabel}
            <button
              type="button"
              onClick={() => onRemove(index)}
              aria-label={labels.removeFilter}
              className="inline-flex h-4 w-4 cursor-pointer items-center justify-center rounded p-0 text-primary/60 hover:text-destructive"
            >
              &times;
            </button>
          </span>
        );
      })}
      <button
        type="button"
        onClick={onClearAll}
        className="cursor-pointer text-xs text-muted-foreground hover:text-destructive focus:outline-none"
      >
        {labels.clearAll}
      </button>
    </div>
  );
}
