"use client";

import * as React from "react";
import type { FilterCondition } from "@pia-team/pia-ui-tmf630-query-core";
import {
  getOperatorsForFieldType,
  operatorsRequireNoValue,
} from "@pia-team/pia-ui-tmf630-query-core";
import { FilterRow } from "./FilterRow.js";
import type { FilterableField, Labels } from "./types.js";

export interface FilterPanelProps {
  fields: FilterableField[];
  labels: Labels;
  onApply: (filters: FilterCondition[]) => void;
  initialFilters?: FilterCondition[];
  defaultFilter?: FilterCondition;
  renderValueInput?: React.ComponentProps<typeof FilterRow>["renderValueInput"];
  renderTrigger?: (props: {
    isOpen: boolean;
    onClick: () => void;
  }) => React.ReactNode;
  applyButtonClassName?: string;
  panelClassName?: string;
}

const DEFAULT_FILTER: FilterCondition = {
  field: "",
  operator: "eq",
  value: "",
};

function resolveDefaultRow(
  defaultFilter: FilterCondition,
  fields: FilterableField[],
): FilterCondition {
  const first = fields[0];
  if (
    defaultFilter.field &&
    fields.some((f) => f.name === defaultFilter.field)
  ) {
    return {
      field: defaultFilter.field,
      operator: defaultFilter.operator,
      value: defaultFilter.value ?? "",
    };
  }
  if (first) {
    return { field: first.name, operator: "eq", value: "" };
  }
  return defaultFilter;
}

function normalizeFilter(
  f: FilterCondition,
  fields: FilterableField[],
  fallback: FilterCondition,
): FilterCondition {
  const validField =
    f.field && fields.some((x) => x.name === f.field)
      ? f.field
      : fallback.field;
  const fieldType =
    fields.find((x) => x.name === validField)?.type ?? "text";
  const ops = getOperatorsForFieldType(fieldType);
  const validOperator = ops.some((o) => o.value === f.operator)
    ? f.operator
    : ops.some((o) => o.value === fallback.operator)
      ? fallback.operator
      : (ops[0]?.value ?? "eq");
  if (f.field === validField && f.operator === validOperator) return f;
  return {
    ...f,
    field: validField,
    operator: validOperator as FilterCondition["operator"],
  };
}

type DraftFilter = FilterCondition & { _id: string };

function toDraft(f: FilterCondition): DraftFilter {
  return { ...f, _id: crypto.randomUUID() };
}

function buildDraftList(
  initialFilters: FilterCondition[],
  defaultRow: FilterCondition,
): DraftFilter[] {
  const source = initialFilters.length > 0 ? initialFilters : [defaultRow];
  return source.map(toDraft);
}

export function FilterPanel({
  fields,
  labels,
  onApply,
  initialFilters = [],
  defaultFilter = DEFAULT_FILTER,
  renderValueInput,
  renderTrigger,
  applyButtonClassName,
  panelClassName,
}: FilterPanelProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const defaultRow = React.useMemo(
    () => resolveDefaultRow(defaultFilter, fields),
    [defaultFilter, fields],
  );

  const [draftFilters, setDraftFilters] = React.useState<DraftFilter[]>(() =>
    buildDraftList(initialFilters, resolveDefaultRow(defaultFilter, fields)),
  );

  React.useEffect(() => {
    setDraftFilters(buildDraftList(initialFilters, defaultRow));
  }, [initialFilters, defaultRow]);

  const openPanel = React.useCallback(() => {
    setIsOpen((prev) => {
      if (!prev && fields.length > 0) {
        setDraftFilters((rows) =>
          rows.map((f) => ({
            ...normalizeFilter(f, fields, defaultRow),
            _id: f._id,
          })),
        );
      }
      return !prev;
    });
  }, [fields, defaultRow]);

  const handleUpdate = React.useCallback(
    (index: number, filter: FilterCondition) => {
      setDraftFilters((prev) => {
        const next = [...prev];
        if (prev[index]) {
          next[index] = { ...filter, _id: prev[index]!._id };
        }
        return next;
      });
    },
    [],
  );

  const handleRemove = React.useCallback(
    (index: number) => {
      setDraftFilters((prev) => {
        const next = prev.filter((_, i) => i !== index);
        return next.length > 0 ? next : [toDraft(defaultRow)];
      });
    },
    [defaultRow],
  );

  const handleAddFilter = React.useCallback(() => {
    setDraftFilters((prev) => [...prev, toDraft(defaultRow)]);
  }, [defaultRow]);

  const handleApply = React.useCallback(() => {
    setDraftFilters((current) => {
      const activeFilters = current
        .map(({ _id: _, ...rest }) => rest)
        .filter((f) => {
          if (operatorsRequireNoValue(f.operator)) return true;
          if (Array.isArray(f.value))
            return f.value.some((v) => String(v).trim() !== "");
          return String(f.value ?? "").trim() !== "";
        });
      onApply(activeFilters);
      return current;
    });
    setIsOpen(false);
  }, [onApply]);

  const handleClearAll = React.useCallback(() => {
    setDraftFilters([toDraft(defaultRow)]);
    onApply([]);
  }, [defaultRow, onApply]);

  return (
    <div className="relative">
      {renderTrigger ? (
        renderTrigger({ isOpen, onClick: openPanel })
      ) : (
        <button
          type="button"
          onClick={openPanel}
          aria-label={labels.title}
          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-input bg-background text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <span aria-hidden>&#x22EE;</span>
        </button>
      )}

      {isOpen && (
        <div
          className={[
            "absolute right-0 top-full z-50 mt-2 w-[640px] rounded-xl border bg-card p-5 shadow-lg animate-in fade-in-0 zoom-in-95",
            panelClassName ?? "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-tight">
              {labels.title}
            </h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close"
            >
              &#215;
            </button>
          </div>

          <div className="space-y-3">
            {draftFilters.map((filter, index) => (
              <FilterRow
                key={filter._id}
                filter={filter}
                index={index}
                fields={fields}
                labels={labels}
                onUpdate={handleUpdate}
                onRemove={handleRemove}
                renderValueInput={renderValueInput}
              />
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
            <button
              type="button"
              onClick={handleAddFilter}
              className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {labels.addFilter}
            </button>
            <button
              type="button"
              onClick={handleApply}
              className={[
                "inline-flex h-9 cursor-pointer items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus:outline-none focus:ring-1 focus:ring-ring",
                applyButtonClassName ?? "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {labels.apply}
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-destructive focus:outline-none"
            >
              {labels.clearAll}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
