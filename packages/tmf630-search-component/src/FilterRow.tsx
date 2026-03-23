"use client";

import * as React from "react";
import type { FilterCondition } from "@pia-team/pia-ui-tmf630-query-core";
import {
  getOperatorsForFieldType,
  type OperatorDefinition,
} from "@pia-team/pia-ui-tmf630-query-core";
import { normalizeDateTimeForDisplay } from "@pia-team/pia-ui-tmf630-query-core";
import type {
  FilterableField,
  Labels,
  FilterRowClassNames,
  FilterIcons,
  SelectSlotProps,
  ValueInputSlotProps,
  FieldType,
} from "./types.js";
import { filterRowDefaults } from "./defaults.js";
import { slot } from "./utils.js";
import { DefaultSelect } from "./DefaultSelect.js";
import { useFilterTheme } from "./FilterThemeContext.js";

/* ------------------------------------------------------------------ */
/*  Slots                                                              */
/* ------------------------------------------------------------------ */

export interface FilterRowSlots {
  fieldSelect?: (props: SelectSlotProps) => React.ReactNode;
  operatorSelect?: (props: SelectSlotProps) => React.ReactNode;
  valueInput?: (props: ValueInputSlotProps) => React.ReactNode;
  removeButton?: (props: { onClick: () => void; "aria-label": string }) => React.ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface FilterRowProps {
  filter: FilterCondition;
  index: number;
  fields: FilterableField[];
  labels: Labels;
  onUpdate: (index: number, filter: FilterCondition) => void;
  onRemove: (index: number) => void;
  classNames?: FilterRowClassNames;
  unstyled?: boolean;
  icons?: FilterIcons;
  error?: string;
  customFieldTypes?: Record<string, OperatorDefinition[]>;
  slots?: FilterRowSlots;
  /** @deprecated Use slots.valueInput instead */
  renderValueInput?: (props: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    type: FieldType;
    multiValue?: boolean;
    enumOptions?: { value: string; label: string }[];
  }) => React.ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getFieldType(fieldName: string, fields: FilterableField[]): FieldType {
  const field = fields.find((f) => f.name === fieldName);
  return field?.type ?? "text";
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const FilterRow = React.forwardRef<HTMLDivElement, FilterRowProps>(
  function FilterRow(props, ref) {
    const theme = useFilterTheme();
    const {
      filter,
      index,
      fields,
      labels,
      onUpdate,
      onRemove,
      classNames: propClassNames,
      unstyled: propUnstyled,
      icons: propIcons,
      error,
      customFieldTypes,
      slots,
      renderValueInput,
    } = props;

    const unstyled = propUnstyled ?? theme.unstyled ?? false;
    const cls = { ...theme.classNames?.row, ...propClassNames };
    const icons = { ...theme.icons, ...propIcons };

    const fieldType = getFieldType(filter.field, fields);
    const operators = getOperatorsForFieldType(fieldType, customFieldTypes);
    const currentOperator = operators.find((op) => op.value === filter.operator);
    const requiresValue = currentOperator?.requiresValue ?? true;
    const isDateSingleValue =
      fieldType === "date" && currentOperator?.isMultiValue !== true;
    const rawDisplayValue = Array.isArray(filter.value)
      ? filter.value.join(", ")
      : (filter.value ?? "");
    const displayValue =
      isDateSingleValue && rawDisplayValue
        ? normalizeDateTimeForDisplay(String(rawDisplayValue)) || rawDisplayValue
        : rawDisplayValue;

    const handleFieldChange = (fieldName: string) => {
      const field = fields.find((f) => f.name === fieldName);
      const newType = field?.type ?? "text";
      const newOperators = getOperatorsForFieldType(newType, customFieldTypes);
      const defaultOp = newOperators[0];
      onUpdate(index, {
        field: fieldName,
        operator: defaultOp?.value ?? "eq",
        value: defaultOp?.requiresValue === false ? "" : displayValue,
      });
    };

    const handleOperatorChange = (operator: string) => {
      const op = operators.find((o) => o.value === operator);
      onUpdate(index, {
        ...filter,
        operator: operator as FilterCondition["operator"],
        value: op?.requiresValue === false ? "" : displayValue,
      });
    };

    const handleValueChange = (value: string) => {
      const op = operators.find((o) => o.value === filter.operator);
      if (op?.isMultiValue === true) {
        onUpdate(index, {
          ...filter,
          value: value.split(",").map((s) => s.trim()).filter(Boolean),
        });
      } else if (isDateSingleValue && value) {
        onUpdate(index, {
          ...filter,
          value: normalizeDateTimeForDisplay(value) || value,
        });
      } else {
        onUpdate(index, { ...filter, value });
      }
    };

    const valuePlaceholder = currentOperator?.isMultiValue
      ? fieldType === "date"
        ? "YYYY-MM-DD HH:mm, YYYY-MM-DD HH:mm"
        : "value1, value2"
      : fieldType === "date"
        ? "YYYY-MM-DD HH:mm"
        : "";

    const currentField = fields.find((f) => f.name === filter.field);
    const displayFieldValue =
      filter.field && currentField ? filter.field : undefined;
    const displayOperatorValue =
      filter.operator && operators.some((o) => o.value === filter.operator)
        ? filter.operator
        : undefined;
    const fieldLabel = currentField?.label ?? displayFieldValue ?? "";
    const operatorLabel =
      (displayOperatorValue &&
        (labels.operators[displayOperatorValue] ?? displayOperatorValue)) ??
      "";

    const fieldOptions = fields.map((f) => ({ value: f.name, label: f.label }));
    const operatorOptions = operators.map((op) => ({
      value: op.value,
      label: labels.operators[op.value] ?? op.value,
    }));

    const resolvedValueClass = slot(filterRowDefaults.valueInput, cls.valueInput, unstyled);

    const valueInputElement = (() => {
      if (!requiresValue) return null;

      const slotProps: ValueInputSlotProps = {
        value: displayValue,
        onChange: handleValueChange,
        placeholder: valuePlaceholder,
        className: resolvedValueClass,
        type: fieldType,
        multiValue: currentOperator?.isMultiValue,
        enumOptions: currentField?.enumOptions,
      };

      if (slots?.valueInput) return slots.valueInput(slotProps);

      if (renderValueInput) {
        return renderValueInput({
          value: displayValue,
          onChange: handleValueChange,
          placeholder: valuePlaceholder,
          className: resolvedValueClass,
          type: fieldType,
          multiValue: currentOperator?.isMultiValue,
          enumOptions: currentField?.enumOptions,
        });
      }

      if (fieldType === "enum" && currentField?.enumOptions?.length) {
        return (
          <DefaultSelect
            value={displayValue}
            options={currentField.enumOptions}
            onChange={handleValueChange}
            placeholder="Select..."
            displayLabel={
              currentField.enumOptions.find((o) => o.value === displayValue)?.label
            }
            triggerClassName={resolvedValueClass}
            contentClassName={slot(filterRowDefaults.fieldContent, cls.fieldContent, unstyled)}
            itemClassName={slot(filterRowDefaults.fieldItem, cls.fieldItem, unstyled)}
            data-slot="value-input"
            aria-label="Filter value"
          />
        );
      }

      return (
        <input
          type="text"
          value={displayValue}
          onChange={(e) => handleValueChange(e.target.value)}
          placeholder={valuePlaceholder}
          className={resolvedValueClass}
          data-slot="value-input"
          aria-label="Filter value"
        />
      );
    })();

    const fieldSelectElement = slots?.fieldSelect ? (
      slots.fieldSelect({
        value: displayFieldValue ?? "",
        options: fieldOptions,
        onChange: handleFieldChange,
        placeholder: "Field",
        className: slot(filterRowDefaults.fieldTrigger, cls.fieldTrigger, unstyled),
        "data-slot": "field-select",
        "aria-label": "Select field",
      })
    ) : (
      <DefaultSelect
        value={displayFieldValue ?? ""}
        options={fieldOptions}
        onChange={handleFieldChange}
        placeholder="Field"
        displayLabel={fieldLabel ? String(fieldLabel) : undefined}
        triggerClassName={slot(filterRowDefaults.fieldTrigger, cls.fieldTrigger, unstyled)}
        contentClassName={slot(filterRowDefaults.fieldContent, cls.fieldContent, unstyled)}
        itemClassName={slot(filterRowDefaults.fieldItem, cls.fieldItem, unstyled)}
        data-slot="field-select"
        aria-label="Select field"
      />
    );

    const operatorSelectElement = slots?.operatorSelect ? (
      slots.operatorSelect({
        value: displayOperatorValue ?? "",
        options: operatorOptions,
        onChange: handleOperatorChange,
        placeholder: "Operator",
        className: slot(filterRowDefaults.operatorTrigger, cls.operatorTrigger, unstyled),
        "data-slot": "operator-select",
        "aria-label": "Select operator",
      })
    ) : (
      <DefaultSelect
        value={displayOperatorValue ?? ""}
        options={operatorOptions}
        onChange={handleOperatorChange}
        placeholder="Operator"
        displayLabel={operatorLabel ? String(operatorLabel) : undefined}
        triggerClassName={slot(filterRowDefaults.operatorTrigger, cls.operatorTrigger, unstyled)}
        contentClassName={slot(filterRowDefaults.operatorContent, cls.operatorContent, unstyled)}
        itemClassName={slot(filterRowDefaults.operatorItem, cls.operatorItem, unstyled)}
        data-slot="operator-select"
        aria-label="Select operator"
      />
    );

    const removeElement = slots?.removeButton ? (
      slots.removeButton({
        onClick: () => onRemove(index),
        "aria-label": labels.removeFilter,
      })
    ) : (
      <button
        type="button"
        onClick={() => onRemove(index)}
        aria-label={labels.removeFilter}
        className={slot(filterRowDefaults.removeButton, cls.removeButton, unstyled)}
        data-slot="remove-button"
      >
        {icons.remove ?? <span aria-hidden>&times;</span>}
      </button>
    );

    return (
      <div
        ref={ref}
        className={slot(filterRowDefaults.root, cls.root, unstyled)}
        data-slot="filter-row"
        role="group"
        aria-label={`Filter ${index + 1}`}
      >
        {fieldSelectElement}
        {operatorSelectElement}
        {valueInputElement}
        {removeElement}
        {error && (
          <div
            className={slot(filterRowDefaults.error, cls.error, unstyled)}
            role="alert"
            data-slot="filter-error"
          >
            {error}
          </div>
        )}
      </div>
    );
  },
);
