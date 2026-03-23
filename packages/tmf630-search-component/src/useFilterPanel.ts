"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import {
  getOperatorsForFieldType,
  operatorsRequireNoValue,
} from "@pia-team/pia-ui-tmf630-query-core";
import type { FilterCondition, OperatorDefinition } from "@pia-team/pia-ui-tmf630-query-core";
import type {
  UseFilterPanelOptions,
  UseFilterPanelReturn,
  DraftFilter,
  FilterableField,
} from "./types.js";

const EMPTY_FILTER: FilterCondition = { field: "", operator: "eq", value: "" };
const EMPTY_INITIAL: FilterCondition[] = [];

function toDraft(f: FilterCondition): DraftFilter {
  return { ...f, _id: crypto.randomUUID() };
}

function resolveDefaultRow(
  defaultFilter: FilterCondition | undefined,
  fields: FilterableField[],
): FilterCondition {
  const df = defaultFilter ?? EMPTY_FILTER;
  const first = fields[0];
  if (df.field && fields.some((f) => f.name === df.field)) {
    return { field: df.field, operator: df.operator, value: df.value ?? "" };
  }
  if (first) return { field: first.name, operator: "eq", value: "" };
  return df;
}

function normalizeFilter(
  f: FilterCondition,
  fields: FilterableField[],
  fallback: FilterCondition,
  customFieldTypes?: Record<string, OperatorDefinition[]>,
): FilterCondition {
  const validField =
    f.field && fields.some((x) => x.name === f.field) ? f.field : fallback.field;
  const fieldDef = fields.find((x) => x.name === validField);
  const fieldType = fieldDef?.type ?? "text";
  const ops = getOperatorsForFieldType(fieldType, customFieldTypes);
  const validOperator = ops.some((o) => o.value === f.operator)
    ? f.operator
    : ops.some((o) => o.value === fallback.operator)
      ? fallback.operator
      : (ops[0]?.value ?? "eq");
  if (f.field === validField && f.operator === validOperator) return f;
  return { ...f, field: validField, operator: validOperator as FilterCondition["operator"] };
}

/**
 * Headless hook for filter panel state management.
 * Provides all logic without any UI — consumers build their own components.
 */
export function useFilterPanel(options: UseFilterPanelOptions): UseFilterPanelReturn {
  const {
    fields,
    initialFilters = EMPTY_INITIAL,
    defaultFilter,
    customFieldTypes,
    onApply,
    onFilterAdd,
    onFilterRemove,
    onFilterChange,
    onOpenChange,
    open: controlledOpen,
    validate,
  } = options;

  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  const defaultRow = useMemo(
    () => resolveDefaultRow(defaultFilter, fields),
    [defaultFilter, fields],
  );

  const [filters, setFilters] = useState<DraftFilter[]>(() => {
    const source = initialFilters.length > 0 ? initialFilters : [defaultRow];
    return source.map(toDraft);
  });

  const [errors, setErrors] = useState<Map<string, string>>(new Map());

  const initialKey = useMemo(() => JSON.stringify(initialFilters), [initialFilters]);
  const prevInitialKey = useRef<string | null>(null);
  if (prevInitialKey.current === null) {
    prevInitialKey.current = initialKey;
  } else if (initialKey !== prevInitialKey.current) {
    prevInitialKey.current = initialKey;
    const source = initialFilters.length > 0 ? initialFilters : [defaultRow];
    setFilters(source.map(toDraft));
  }

  const runValidation = useCallback(
    (drafts: DraftFilter[]): Map<string, string> => {
      const errs = new Map<string, string>();
      for (const draft of drafts) {
        const fieldDef = fields.find((f) => f.name === draft.field);
        const globalErr = validate?.(draft, fieldDef);
        const fieldErr = fieldDef?.validate?.(draft.value);
        const err = globalErr ?? fieldErr;
        if (err) errs.set(draft._id, err);
      }
      return errs;
    },
    [fields, validate],
  );

  const openFn = useCallback(() => {
    if (!isOpen && fields.length > 0) {
      setFilters((rows) =>
        rows.map((f) => ({
          ...normalizeFilter(f, fields, defaultRow, customFieldTypes),
          _id: f._id,
        })),
      );
    }
    setOpen(true);
  }, [isOpen, fields, defaultRow, customFieldTypes, setOpen]);

  const closeFn = useCallback(() => setOpen(false), [setOpen]);

  const toggle = useCallback(() => {
    if (isOpen) closeFn();
    else openFn();
  }, [isOpen, openFn, closeFn]);

  const addFilter = useCallback(() => {
    const newFilter = toDraft(defaultRow);
    setFilters((prev) => [...prev, newFilter]);
    onFilterAdd?.(defaultRow);
  }, [defaultRow, onFilterAdd]);

  const removeFilter = useCallback(
    (index: number) => {
      setFilters((prev) => {
        const removed = prev[index];
        const next = prev.filter((_, i) => i !== index);
        if (removed) onFilterRemove?.(index, removed);
        return next.length > 0 ? next : [toDraft(defaultRow)];
      });
    },
    [defaultRow, onFilterRemove],
  );

  const updateFilter = useCallback(
    (index: number, filter: FilterCondition) => {
      setFilters((prev) => {
        const next = [...prev];
        if (prev[index]) {
          next[index] = { ...filter, _id: prev[index]!._id };
        }
        return next;
      });
      onFilterChange?.(index, filter);
    },
    [onFilterChange],
  );

  const apply = useCallback(() => {
    const validationErrors = runValidation(filters);
    setErrors(validationErrors);
    if (validationErrors.size > 0) return;

    const activeFilters = filters
      .map(({ _id: _, ...rest }) => rest)
      .filter((f) => {
        if (operatorsRequireNoValue(f.operator)) return true;
        if (Array.isArray(f.value))
          return f.value.some((v) => String(v).trim() !== "");
        return String(f.value ?? "").trim() !== "";
      });
    onApply?.(activeFilters);
    setOpen(false);
  }, [filters, runValidation, onApply, setOpen]);

  const clearAll = useCallback(() => {
    setFilters([toDraft(defaultRow)]);
    setErrors(new Map());
    onApply?.([]);
  }, [defaultRow, onApply]);

  const getFieldOperators = useCallback(
    (fieldName: string): OperatorDefinition[] => {
      const fieldDef = fields.find((f) => f.name === fieldName);
      const fieldType = fieldDef?.type ?? "text";
      return getOperatorsForFieldType(fieldType, customFieldTypes);
    },
    [fields, customFieldTypes],
  );

  return {
    isOpen,
    open: openFn,
    close: closeFn,
    toggle,
    filters,
    addFilter,
    removeFilter,
    updateFilter,
    apply,
    clearAll,
    errors,
    getFieldOperators,
  };
}
