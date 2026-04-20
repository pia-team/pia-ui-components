"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import {
  resolveDefaultRow,
  getFieldOperators as coreGetFieldOperators,
  normalizeFilterRow,
  createFilterPanelState,
  addFilterRow,
  removeFilterRow,
  updateFilterRow,
  applyFilterRows,
  clearFilterRows,
  validateFilterRows,
  changeRowField,
  changeRowOperator,
} from "@pia-team/pia-ui-tmf630-query-core";
import type { FilterCondition, OperatorDefinition } from "@pia-team/pia-ui-tmf630-query-core";
import type {
  UseFilterPanelOptions,
  UseFilterPanelReturn,
  DraftFilter,
} from "./types.js";

const EMPTY_INITIAL: FilterCondition[] = [];

function toDraft(row: { id: string; field: string; operator: string; value: string | string[] }): DraftFilter {
  return { field: row.field, operator: row.operator as FilterCondition["operator"], value: row.value, _id: row.id };
}

/**
 * Headless hook for filter panel state management.
 * Provides all logic without any UI — consumers build their own components.
 *
 * Core state logic is delegated to @pia-team/pia-ui-tmf630-query-core
 * (framework-agnostic pure functions). This hook is a thin React wrapper.
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

  const [panelState, setPanelState] = useState(() =>
    createFilterPanelState(
      initialFilters.length > 0 ? initialFilters : undefined,
      defaultRow,
    ),
  );

  const initialKey = useMemo(() => JSON.stringify(initialFilters), [initialFilters]);
  const prevInitialKey = useRef<string | null>(null);
  if (prevInitialKey.current === null) {
    prevInitialKey.current = initialKey;
  } else if (initialKey !== prevInitialKey.current) {
    prevInitialKey.current = initialKey;
    setPanelState(
      createFilterPanelState(
        initialFilters.length > 0 ? initialFilters : undefined,
        defaultRow,
      ),
    );
  }

  const filters: DraftFilter[] = useMemo(
    () => panelState.rows.map(toDraft),
    [panelState.rows],
  );

  const errors = panelState.errors;

  const openFn = useCallback(() => {
    if (!isOpen && fields.length > 0) {
      setPanelState((prev) => ({
        ...prev,
        rows: prev.rows.map((row) => {
          const condition: FilterCondition = { field: row.field, operator: row.operator as FilterCondition["operator"], value: row.value };
          const normalized = normalizeFilterRow(condition, fields, defaultRow, customFieldTypes);
          return { ...row, field: normalized.field, operator: normalized.operator, value: normalized.value };
        }),
      }));
    }
    setOpen(true);
  }, [isOpen, fields, defaultRow, customFieldTypes, setOpen]);

  const closeFn = useCallback(() => setOpen(false), [setOpen]);

  const toggle = useCallback(() => {
    if (isOpen) closeFn();
    else openFn();
  }, [isOpen, openFn, closeFn]);

  const addFilter = useCallback(() => {
    setPanelState((prev) => addFilterRow(prev, defaultRow));
    onFilterAdd?.(defaultRow);
  }, [defaultRow, onFilterAdd]);

  const removeFilter = useCallback(
    (index: number) => {
      setPanelState((prev) => {
        const removed = prev.rows[index];
        if (removed) onFilterRemove?.(index, { field: removed.field, operator: removed.operator as FilterCondition["operator"], value: removed.value });
        return removeFilterRow(prev, index, defaultRow);
      });
    },
    [defaultRow, onFilterRemove],
  );

  const updateFilterCb = useCallback(
    (index: number, filter: FilterCondition) => {
      setPanelState((prev) => updateFilterRow(prev, index, filter));
      onFilterChange?.(index, filter);
    },
    [onFilterChange],
  );

  const changeFieldCb = useCallback(
    (index: number, fieldName: string) => {
      setPanelState((prev) => {
        const next = changeRowField(prev, index, fieldName, fields, customFieldTypes);
        const row = next.rows[index];
        if (row) onFilterChange?.(index, { field: row.field, operator: row.operator as FilterCondition["operator"], value: row.value });
        return next;
      });
    },
    [fields, customFieldTypes, onFilterChange],
  );

  const changeOperatorCb = useCallback(
    (index: number, operator: string) => {
      setPanelState((prev) => {
        const next = changeRowOperator(prev, index, operator, fields, customFieldTypes);
        const row = next.rows[index];
        if (row) onFilterChange?.(index, { field: row.field, operator: row.operator as FilterCondition["operator"], value: row.value });
        return next;
      });
    },
    [fields, customFieldTypes, onFilterChange],
  );

  const apply = useCallback(() => {
    const validationErrors = validateFilterRows(panelState, fields, validate);
    if (validationErrors.size > 0) {
      setPanelState((prev) => ({ ...prev, errors: validationErrors }));
      return;
    }
    setPanelState((prev) => ({ ...prev, errors: new Map() }));
    onApply?.(applyFilterRows(panelState));
    setOpen(false);
  }, [panelState, fields, validate, onApply, setOpen]);

  const clearAll = useCallback(() => {
    setPanelState(clearFilterRows(defaultRow));
    onApply?.([]);
  }, [defaultRow, onApply]);

  const getFieldOperatorsFn = useCallback(
    (fieldName: string): OperatorDefinition[] => {
      return coreGetFieldOperators(fieldName, fields, customFieldTypes);
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
    updateFilter: updateFilterCb,
    changeField: changeFieldCb,
    changeOperator: changeOperatorCb,
    apply,
    clearAll,
    errors,
    getFieldOperators: getFieldOperatorsFn,
  };
}
