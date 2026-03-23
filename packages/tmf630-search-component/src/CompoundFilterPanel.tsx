"use client";

import * as React from "react";
import type {
  FilterCondition,
  FilterGroup,
  FilterNode,
  FilterLogic,
  OperatorDefinition,
} from "@pia-team/pia-ui-tmf630-query-core";
import {
  isFilterGroup,
  addToGroup,
  removeFromGroup,
  toggleGroupLogic,
  createGroup,
} from "@pia-team/pia-ui-tmf630-query-core";
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
import { useFilterTheme } from "./FilterThemeContext.js";
import { useFocusTrap } from "./useFocusTrap.js";

/* ------------------------------------------------------------------ */
/*  Compound Panel ClassNames                                          */
/* ------------------------------------------------------------------ */

export interface CompoundFilterPanelClassNames extends FilterPanelClassNames {
  group?: string;
  groupHeader?: string;
  logicToggle?: string;
  addGroupButton?: string;
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface CompoundFilterPanelProps {
  fields: FilterableField[];
  value: FilterGroup;
  onChange: (group: FilterGroup) => void;
  onApply?: (group: FilterGroup) => void;
  maxDepth?: number;
  labels?: Labels;
  classNames?: CompoundFilterPanelClassNames;
  rowClassNames?: FilterRowClassNames;
  unstyled?: boolean;
  icons?: FilterIcons;
  customFieldTypes?: Record<string, OperatorDefinition[]>;
  renderTrigger?: (props: { isOpen: boolean; toggle: () => void }) => React.ReactNode;
  renderValueInput?: (props: any) => React.ReactNode;
  rowSlots?: FilterRowSlots;
}

/* ------------------------------------------------------------------ */
/*  Immutable tree helpers                                             */
/* ------------------------------------------------------------------ */

function updateNodeAtPath(
  root: FilterGroup,
  path: number[],
  updater: (node: FilterNode) => FilterNode,
): FilterGroup {
  if (path.length === 0) return root;

  const [head, ...rest] = path;
  const newConditions = [...root.conditions];
  const target = newConditions[head!];

  if (rest.length === 0) {
    newConditions[head!] = updater(target!);
  } else if (isFilterGroup(target!)) {
    newConditions[head!] = updateNodeAtPath(target, rest, updater);
  }

  return { ...root, conditions: newConditions };
}

function removeNodeAtPath(root: FilterGroup, path: number[]): FilterGroup {
  if (path.length === 0) return root;

  const [head, ...rest] = path;

  if (rest.length === 0) {
    return {
      ...root,
      conditions: root.conditions.filter((_, i) => i !== head),
    };
  }

  const target = root.conditions[head!];
  if (!isFilterGroup(target!)) return root;

  const newConditions = [...root.conditions];
  newConditions[head!] = removeNodeAtPath(target, rest);
  return { ...root, conditions: newConditions };
}

function addNodeAtPath(
  root: FilterGroup,
  path: number[],
  node: FilterNode,
): FilterGroup {
  if (path.length === 0) {
    return addToGroup(root, node);
  }

  const [head, ...rest] = path;
  const target = root.conditions[head!];
  if (!isFilterGroup(target!)) return root;

  const newConditions = [...root.conditions];
  newConditions[head!] = addNodeAtPath(target, rest, node);
  return { ...root, conditions: newConditions };
}

/* ------------------------------------------------------------------ */
/*  FilterGroupView (recursive)                                        */
/* ------------------------------------------------------------------ */

interface FilterGroupViewProps {
  group: FilterGroup;
  path: number[];
  depth: number;
  maxDepth: number;
  fields: FilterableField[];
  labels: Labels;
  cls: CompoundFilterPanelClassNames;
  rowCls: FilterRowClassNames;
  unstyled?: boolean;
  icons: FilterIcons;
  customFieldTypes?: Record<string, OperatorDefinition[]>;
  renderValueInput?: (props: any) => React.ReactNode;
  rowSlots?: FilterRowSlots;
  onChange: (root: FilterGroup) => void;
  root: FilterGroup;
}

const EMPTY_CONDITION: FilterCondition = { field: "", operator: "eq", value: "" };

function FilterGroupView(props: FilterGroupViewProps) {
  const {
    group,
    path,
    depth,
    maxDepth,
    fields,
    labels,
    cls,
    rowCls,
    unstyled,
    icons,
    customFieldTypes,
    renderValueInput,
    rowSlots,
    onChange,
    root,
  } = props;

  const logicLabel = group.logic === "and" ? "AND" : "OR";
  const altLogicLabel = group.logic === "and" ? "OR" : "AND";

  const handleToggleLogic = () => {
    if (path.length === 0) {
      onChange(toggleGroupLogic(root));
    } else {
      onChange(
        updateNodeAtPath(root, path, (n) =>
          isFilterGroup(n) ? toggleGroupLogic(n) : n,
        ),
      );
    }
  };

  const handleAddCondition = () => {
    const cond: FilterCondition =
      fields.length > 0
        ? { field: fields[0]!.name, operator: "eq", value: "" }
        : EMPTY_CONDITION;
    onChange(addNodeAtPath(root, path, cond));
  };

  const handleAddGroup = () => {
    const newGroup = createGroup(group.logic === "and" ? "or" : "and");
    onChange(addNodeAtPath(root, path, newGroup));
  };

  const handleRemoveChild = (index: number) => {
    onChange(removeNodeAtPath(root, [...path, index]));
  };

  const handleUpdateCondition = (
    index: number,
    filter: FilterCondition,
  ) => {
    onChange(
      updateNodeAtPath(root, [...path, index], () => filter),
    );
  };

  const groupStyle = unstyled
    ? cls.group || ""
    : `rounded-lg border border-dashed p-3 ${
        depth % 2 === 0 ? "border-violet-300 bg-violet-50/30" : "border-sky-300 bg-sky-50/30"
      } ${cls.group || ""}`;

  return (
    <div className={groupStyle} data-slot="filter-group" data-depth={depth}>
      {/* Group header: logic toggle */}
      <div
        className={
          unstyled
            ? cls.groupHeader || ""
            : `mb-2 flex items-center gap-2 ${cls.groupHeader || ""}`
        }
        data-slot="group-header"
      >
        <button
          type="button"
          onClick={handleToggleLogic}
          className={
            unstyled
              ? cls.logicToggle || ""
              : `rounded px-2 py-0.5 text-xs font-semibold transition-colors ${
                  group.logic === "and"
                    ? "bg-violet-100 text-violet-700 hover:bg-violet-200"
                    : "bg-sky-100 text-sky-700 hover:bg-sky-200"
                } ${cls.logicToggle || ""}`
          }
          data-slot="logic-toggle"
          aria-label={`Switch to ${altLogicLabel}`}
        >
          {logicLabel}
        </button>
        {depth > 0 && (
          <span className="text-xs text-muted-foreground">group</span>
        )}
      </div>

      {/* Children */}
      <div className="flex flex-col gap-2">
        {group.conditions.map((child, i) => {
          if (isFilterGroup(child)) {
            return (
              <div key={i} className="relative">
                <FilterGroupView
                  {...props}
                  group={child}
                  path={[...path, i]}
                  depth={depth + 1}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveChild(i)}
                  className={
                    unstyled
                      ? ""
                      : "absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-xs text-red-600 hover:bg-red-200"
                  }
                  data-slot="remove-group"
                  aria-label="Remove group"
                >
                  {icons.remove ?? "×"}
                </button>
              </div>
            );
          }

          return (
            <FilterRow
              key={i}
              index={i}
              filter={child}
              fields={fields}
              labels={labels}
              onUpdate={handleUpdateCondition}
              onRemove={handleRemoveChild}
              classNames={rowCls}
              unstyled={unstyled}
              icons={icons}
              customFieldTypes={customFieldTypes}
              renderValueInput={renderValueInput}
              slots={rowSlots}
            />
          );
        })}
      </div>

      {/* Actions */}
      <div className={unstyled ? "" : "mt-2 flex gap-2"}>
        <button
          type="button"
          onClick={handleAddCondition}
          className={
            unstyled
              ? ""
              : "rounded border bg-white px-2 py-1 text-xs shadow-sm hover:bg-gray-50"
          }
          data-slot="add-condition"
        >
          {icons.add ?? "+"} Condition
        </button>
        {depth < maxDepth && (
          <button
            type="button"
            onClick={handleAddGroup}
            className={
              unstyled
                ? cls.addGroupButton || ""
                : `rounded border bg-white px-2 py-1 text-xs shadow-sm hover:bg-gray-50 ${
                    cls.addGroupButton || ""
                  }`
            }
            data-slot="add-group"
          >
            {icons.add ?? "+"} Group
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CompoundFilterPanel                                                */
/* ------------------------------------------------------------------ */

export const CompoundFilterPanel = React.forwardRef<
  HTMLDivElement,
  CompoundFilterPanelProps
>(function CompoundFilterPanel(props, ref) {
  const {
    fields,
    value,
    onChange,
    onApply,
    maxDepth = 3,
    labels: propLabels,
    classNames: propClassNames = {},
    rowClassNames = {},
    unstyled: propUnstyled,
    icons: propIcons = {},
    customFieldTypes,
    renderTrigger,
    renderValueInput,
    rowSlots,
  } = props;

  const theme = useFilterTheme();
  const unstyled = propUnstyled ?? theme.unstyled;
  const themePanel = typeof theme.classNames?.panel === "object" ? theme.classNames.panel : {};
  const cls: CompoundFilterPanelClassNames = {
    ...themePanel,
    ...propClassNames,
  };
  const icons: FilterIcons = { ...theme.icons, ...propIcons };
  const labels = theme.labels
    ? ({ ...theme.labels, ...propLabels } as Labels)
    : propLabels;

  const [isOpen, setIsOpen] = React.useState(false);
  const focusTrapRef = useFocusTrap<HTMLDivElement>(isOpen);

  const toggle = React.useCallback(() => setIsOpen((prev) => !prev), []);

  const handleApply = React.useCallback(() => {
    onApply?.(value);
    setIsOpen(false);
  }, [value, onApply]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleApply();
      }
    },
    [handleApply],
  );

  const triggerElement = renderTrigger ? (
    renderTrigger({ isOpen, toggle })
  ) : (
    <button
      type="button"
      onClick={toggle}
      className={slot(filterPanelDefaults.trigger, cls.trigger, unstyled)}
      data-slot="filter-trigger"
      aria-expanded={isOpen}
      aria-label="Toggle filters"
    >
      {icons.filter ?? "⚡"}
    </button>
  );

  return (
    <div
      ref={ref}
      className={slot(filterPanelDefaults.root, cls.root, unstyled)}
      data-slot="compound-filter-panel-root"
    >
      {triggerElement}

      {isOpen && (
        <div
          ref={focusTrapRef}
          className={slot(filterPanelDefaults.panel, cls.panel, unstyled)}
          role="dialog"
          aria-label="Compound filter panel"
          data-slot="compound-filter-panel"
          onKeyDown={handleKeyDown}
        >
          {/* Header */}
          <div
            className={slot(filterPanelDefaults.header, cls.header, unstyled)}
            data-slot="filter-header"
          >
            <h3
              className={slot(filterPanelDefaults.title, cls.title, unstyled)}
              data-slot="filter-title"
            >
              {labels?.title ?? "Advanced Filters"}
            </h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className={slot(filterPanelDefaults.closeButton, cls.closeButton, unstyled)}
              data-slot="filter-close"
              aria-label="Close filter panel"
            >
              {icons.close ?? "✕"}
            </button>
          </div>

          {/* Compound group tree */}
          <FilterGroupView
            group={value}
            path={[]}
            depth={0}
            maxDepth={maxDepth}
            fields={fields}
            labels={labels ?? ({} as Labels)}
            cls={cls}
            rowCls={rowClassNames}
            unstyled={unstyled}
            icons={icons}
            customFieldTypes={customFieldTypes}
            renderValueInput={renderValueInput}
            rowSlots={rowSlots}
            onChange={onChange}
            root={value}
          />

          {/* Apply / Clear */}
          <div
            className={slot(filterPanelDefaults.actions, cls.actions, unstyled)}
            data-slot="filter-actions"
          >
            <button
              type="button"
              onClick={handleApply}
              className={slot(filterPanelDefaults.applyButton, cls.applyButton, unstyled)}
              data-slot="filter-apply"
            >
              {icons.apply ?? null} {labels?.apply ?? "Apply"}
            </button>
            <button
              type="button"
              onClick={() => onChange(createGroup("and"))}
              className={slot(filterPanelDefaults.clearButton, cls.clearButton, unstyled)}
              data-slot="filter-clear"
            >
              {labels?.clearAll ?? "Clear all"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
