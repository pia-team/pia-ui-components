"use client";

import * as React from "react";
import type { FilterCondition, OperatorDefinition } from "@pia-team/pia-ui-tmf630-query-core";
import { FilterRow } from "./FilterRow.js";
import type {
  FilterableField,
  Labels,
  FilterPanelClassNames,
  FilterRowClassNames,
  FilterIcons,
} from "./types.js";
import type { FilterRowSlots } from "./FilterRow.js";
import { filterPanelDefaults } from "./defaults.js";
import { slot } from "./utils.js";
import { useFilterPanel } from "./useFilterPanel.js";
import { useFilterTheme } from "./FilterThemeContext.js";
import { useFocusTrap } from "./useFocusTrap.js";
import { resolveLabels } from "./resolveLabels.js";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface FilterPanelProps {
  fields: FilterableField[];
  labels?: Partial<Labels>;
  onApply: (filters: FilterCondition[]) => void;
  initialFilters?: FilterCondition[];
  defaultFilter?: FilterCondition;
  customFieldTypes?: Record<string, OperatorDefinition[]>;

  /** Controlled open state */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;

  /** Event callbacks */
  onFilterAdd?: (filter: FilterCondition) => void;
  onFilterRemove?: (index: number, filter: FilterCondition) => void;
  onFilterChange?: (index: number, filter: FilterCondition) => void;

  /** Validation */
  validate?: (filter: FilterCondition, field?: FilterableField) => string | null;

  /** Styling */
  classNames?: FilterPanelClassNames;
  rowClassNames?: FilterRowClassNames;
  unstyled?: boolean;
  icons?: FilterIcons;

  /** Render slots */
  renderTrigger?: (props: { isOpen: boolean; onClick: () => void }) => React.ReactNode;
  renderValueInput?: React.ComponentProps<typeof FilterRow>["renderValueInput"];
  rowSlots?: FilterRowSlots;

  /** @deprecated Use classNames.applyButton instead */
  applyButtonClassName?: string;
  /** @deprecated Use classNames.panel instead */
  panelClassName?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const FilterPanel = React.forwardRef<HTMLDivElement, FilterPanelProps>(
  function FilterPanel(props, ref) {
    const theme = useFilterTheme();
    const {
      fields,
      labels: propLabels,
      onApply,
      initialFilters = [],
      defaultFilter,
      customFieldTypes,
      open: controlledOpen,
      onOpenChange,
      onFilterAdd,
      onFilterRemove,
      onFilterChange,
      validate,
      classNames: propClassNames,
      rowClassNames: propRowClassNames,
      unstyled: propUnstyled,
      icons: propIcons,
      renderTrigger,
      renderValueInput,
      rowSlots,
      applyButtonClassName,
      panelClassName,
    } = props;

    const unstyled = propUnstyled ?? theme.unstyled ?? false;
    const cls = { ...theme.classNames?.panel, ...propClassNames };
    const rowCls = { ...theme.classNames?.row, ...propRowClassNames };
    const icons = { ...theme.icons, ...propIcons };
    const labels = resolveLabels(theme.labels, propLabels);

    const hook = useFilterPanel({
      fields,
      initialFilters,
      defaultFilter,
      customFieldTypes,
      onApply,
      onFilterAdd,
      onFilterRemove,
      onFilterChange,
      onOpenChange,
      open: controlledOpen,
      validate,
    });

    const focusTrapRef = useFocusTrap<HTMLDivElement>(hook.isOpen);

    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          hook.close();
        }
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
          e.preventDefault();
          hook.apply();
        }
      },
      [hook],
    );

    return (
      <div
        ref={ref}
        className={slot(filterPanelDefaults.root, cls.root, unstyled)}
        data-slot="filter-panel-root"
      >
        {renderTrigger ? (
          renderTrigger({ isOpen: hook.isOpen, onClick: hook.toggle })
        ) : (
          <button
            type="button"
            onClick={hook.toggle}
            aria-label={labels.title}
            aria-expanded={hook.isOpen}
            className={slot(filterPanelDefaults.trigger, cls.trigger, unstyled)}
            data-slot="filter-trigger"
          >
            {icons.trigger ?? <span aria-hidden>&#x22EE;</span>}
          </button>
        )}

        {hook.isOpen && (
          <div
            ref={focusTrapRef}
            className={slot(
              filterPanelDefaults.panel,
              panelClassName ?? cls.panel,
              unstyled,
            )}
            role="dialog"
            aria-label={labels.title}
            data-slot="filter-panel"
            onKeyDown={handleKeyDown}
          >
            <div
              className={slot(filterPanelDefaults.header, cls.header, unstyled)}
              data-slot="filter-header"
            >
              <h3
                className={slot(filterPanelDefaults.title, cls.title, unstyled)}
                data-slot="filter-title"
              >
                {labels.title}
              </h3>
              <button
                type="button"
                onClick={hook.close}
                className={slot(filterPanelDefaults.closeButton, cls.closeButton, unstyled)}
                aria-label={labels.close ?? "Close"}
                data-slot="filter-close"
              >
                {icons.close ?? <span aria-hidden>&#215;</span>}
              </button>
            </div>

            <div
              className={slot(filterPanelDefaults.filterList, cls.filterList, unstyled)}
              data-slot="filter-list"
            >
              {hook.filters.map((filter, index) => (
                <FilterRow
                  key={filter._id}
                  filter={filter}
                  index={index}
                  fields={fields}
                  labels={labels}
                  onUpdate={hook.updateFilter}
                  onRemove={hook.removeFilter}
                  classNames={rowCls}
                  unstyled={unstyled}
                  icons={icons}
                  error={hook.errors.get(filter._id)}
                  customFieldTypes={customFieldTypes}
                  slots={rowSlots}
                  renderValueInput={renderValueInput}
                />
              ))}
            </div>

            <div
              className={slot(filterPanelDefaults.actions, cls.actions, unstyled)}
              data-slot="filter-actions"
            >
              <button
                type="button"
                onClick={hook.addFilter}
                className={slot(filterPanelDefaults.addButton, cls.addButton, unstyled)}
                data-slot="filter-add"
              >
                {icons.add ? (
                  <>
                    {icons.add}
                    <span>{labels.addFilter}</span>
                  </>
                ) : (
                  labels.addFilter
                )}
              </button>
              <button
                type="button"
                onClick={hook.apply}
                className={slot(
                  filterPanelDefaults.applyButton,
                  applyButtonClassName ?? cls.applyButton,
                  unstyled,
                )}
                data-slot="filter-apply"
              >
                {labels.apply}
              </button>
              <button
                type="button"
                onClick={hook.clearAll}
                className={slot(filterPanelDefaults.clearButton, cls.clearButton, unstyled)}
                data-slot="filter-clear"
              >
                {labels.clearAll}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  },
);
