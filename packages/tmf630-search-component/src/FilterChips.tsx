"use client";

import * as React from "react";
import type { FilterCondition, FilterOperator } from "@pia-team/pia-ui-tmf630-query-core";
import {
  formatDateForDisplay,
  normalizeDateTimeForDisplay,
} from "@pia-team/pia-ui-tmf630-query-core";
import type {
  FilterableField,
  Labels,
  FilterChipsClassNames,
  FilterIcons,
} from "./types.js";
import { filterChipsDefaults } from "./defaults.js";
import { slot } from "./utils.js";
import { useFilterTheme } from "./FilterThemeContext.js";
import { resolveLabels } from "./resolveLabels.js";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface FilterChipsProps {
  filters: FilterCondition[];
  fields: FilterableField[];
  labels?: Partial<Labels>;
  onRemove: (index: number) => void;
  onClearAll: () => void;
  classNames?: FilterChipsClassNames;
  unstyled?: boolean;
  icons?: FilterIcons;
  renderChip?: (props: {
    filter: FilterCondition;
    index: number;
    label: string;
    onRemove: () => void;
  }) => React.ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatSingleFilterValue(raw: string, field?: FilterableField): string {
  if (field?.type === "enum" && field.enumOptions?.length) {
    const opt = field.enumOptions.find((o) => o.value === raw);
    return opt?.label ?? raw;
  }

  const isDateLike =
    field?.type === "date" ||
    field?.displayFormat === "date" ||
    field?.displayFormat === "datetime";

  if (isDateLike && raw) {
    if (field?.displayPattern) {
      return formatDateForDisplay(String(raw), field.displayPattern);
    }
    return normalizeDateTimeForDisplay(String(raw)) || raw;
  }

  return String(raw ?? "");
}

function formatFilterValue(
  value: string | string[],
  field?: FilterableField,
): string {
  if (Array.isArray(value)) {
    return value.map((v) => formatSingleFilterValue(String(v), field)).join(", ");
  }
  return formatSingleFilterValue(String(value ?? ""), field);
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const FilterChips = React.forwardRef<HTMLDivElement, FilterChipsProps>(
  function FilterChips(props, ref) {
    const theme = useFilterTheme();
    const {
      filters,
      fields,
      labels: propLabels,
      onRemove,
      onClearAll,
      classNames: propClassNames,
      unstyled: propUnstyled,
      icons: propIcons,
      renderChip,
    } = props;

    const unstyled = propUnstyled ?? theme.unstyled ?? false;
    const cls = { ...theme.classNames?.chips, ...propClassNames };
    const icons = { ...theme.icons, ...propIcons };
    const labels = resolveLabels(theme.labels, propLabels);

    if (filters.length === 0) return null;

    return (
      <div
        ref={ref}
        className={slot(filterChipsDefaults.root, cls.root, unstyled)}
        data-slot="filter-chips"
        role="list"
        aria-label={labels.activeFilters}
      >
        <span
          className={slot(filterChipsDefaults.label, cls.label, unstyled)}
          data-slot="chips-label"
        >
          {labels.activeFilters}:
        </span>
        {filters.map((filter, index) => {
          const fieldDef = fields.find((f) => f.name === filter.field);
          const fieldLabel = fieldDef?.label ?? filter.field;
          const opLabel =
            labels.operators[filter.operator as FilterOperator] ??
            filter.operator;
          const valueStr = formatFilterValue(filter.value, fieldDef);
          const chipLabel = valueStr
            ? `${fieldLabel} ${opLabel} "${valueStr}"`
            : `${fieldLabel} ${opLabel}`;

          if (renderChip) {
            return (
              <React.Fragment key={`${filter.field}-${filter.operator}-${index}`}>
                {renderChip({
                  filter,
                  index,
                  label: chipLabel,
                  onRemove: () => onRemove(index),
                })}
              </React.Fragment>
            );
          }

          return (
            <span
              key={`${filter.field}-${filter.operator}-${index}`}
              className={slot(filterChipsDefaults.chip, cls.chip, unstyled)}
              data-slot="chip"
              role="listitem"
            >
              {chipLabel}
              <button
                type="button"
                onClick={() => onRemove(index)}
                aria-label={`${labels.removeFilter}: ${chipLabel}`}
                className={slot(filterChipsDefaults.chipRemove, cls.chipRemove, unstyled)}
                data-slot="chip-remove"
              >
                {icons.remove ?? <span aria-hidden>&times;</span>}
              </button>
            </span>
          );
        })}
        <button
          type="button"
          onClick={onClearAll}
          className={slot(filterChipsDefaults.clearAll, cls.clearAll, unstyled)}
          data-slot="chips-clear-all"
        >
          {labels.clearAll}
        </button>
      </div>
    );
  },
);
