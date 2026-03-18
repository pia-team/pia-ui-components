"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import type { FilterCondition } from "@pia-team/pia-ui-tmf630-query-core";
import {
  getOperatorsForFieldType,
  type FieldType,
} from "@pia-team/pia-ui-tmf630-query-core";
import { normalizeDateToYYYYMMDD } from "@pia-team/pia-ui-tmf630-query-core";
import type { FilterableField, Labels } from "./types.js";
import { cn } from "./utils.js";

const Select = SelectPrimitive.Root;
const SelectValue = SelectPrimitive.Value;
const SelectTrigger = SelectPrimitive.Trigger;
const SelectContent = SelectPrimitive.Content;
const SelectItem = SelectPrimitive.Item;

export interface FilterRowProps {
  filter: FilterCondition;
  index: number;
  fields: FilterableField[];
  labels: Labels;
  onUpdate: (index: number, filter: FilterCondition) => void;
  onRemove: (index: number) => void;
  renderValueInput?: (props: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    type: "text" | "date" | "numeric" | "enum";
    multiValue?: boolean;
  }) => React.ReactNode;
}

function getFieldType(fieldName: string, fields: FilterableField[]): FieldType {
  const field = fields.find((f) => f.name === fieldName);
  return field?.type ?? "text";
}

const triggerClass =
  "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 [&>span]:line-clamp-1 min-w-[170px]";
const contentClass =
  "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0";
const itemClass =
  "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50";

export function FilterRow({
  filter,
  index,
  fields,
  labels,
  onUpdate,
  onRemove,
  renderValueInput,
}: FilterRowProps) {
  const fieldType = getFieldType(filter.field, fields);
  const operators = getOperatorsForFieldType(fieldType);
  const currentOperator = operators.find((op) => op.value === filter.operator);
  const requiresValue = currentOperator?.requiresValue ?? true;
  const isDateSingleValue =
    fieldType === "date" && currentOperator?.isMultiValue !== true;
  const rawDisplayValue = Array.isArray(filter.value)
    ? filter.value.join(", ")
    : (filter.value ?? "");
  const displayValue =
    isDateSingleValue && rawDisplayValue
      ? normalizeDateToYYYYMMDD(String(rawDisplayValue)) || rawDisplayValue
      : rawDisplayValue;

  const handleFieldChange = (fieldName: string) => {
    const field = fields.find((f) => f.name === fieldName);
    const newType = field?.type ?? "text";
    const newOperators = getOperatorsForFieldType(newType);
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
        value: normalizeDateToYYYYMMDD(value) || value,
      });
    } else {
      onUpdate(index, { ...filter, value });
    }
  };

  const valuePlaceholder = currentOperator?.isMultiValue
    ? fieldType === "date"
      ? "YYYY-MM-DD, YYYY-MM-DD"
      : "value1, value2"
    : fieldType === "date"
      ? "YYYY-MM-DD"
      : "";

  const valueInput =
    renderValueInput && requiresValue ? (
      renderValueInput({
        value: displayValue,
        onChange: handleValueChange,
        placeholder: valuePlaceholder,
        className: "h-9 w-[170px] rounded-lg border border-input bg-background px-3 py-2 text-sm",
        type: fieldType,
        multiValue: currentOperator?.isMultiValue,
      })
    ) : requiresValue ? (
      <input
        type="text"
        value={displayValue}
        onChange={(e) => handleValueChange(e.target.value)}
        placeholder={valuePlaceholder}
        className="flex h-9 w-[170px] rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
      />
    ) : null;

  const currentField = fields.find((f) => f.name === filter.field);
  const displayFieldValue =
    filter.field && currentField ? filter.field : undefined;
  const displayOperatorValue =
    filter.operator && operators.some((o) => o.value === filter.operator)
      ? filter.operator
      : undefined;
  const fieldLabel = currentField?.label ?? displayFieldValue ?? "";
  const operatorLabel =
    (displayOperatorValue && (labels.operators[displayOperatorValue] ?? displayOperatorValue)) ?? "";

  return (
    <div className="flex flex-nowrap items-center gap-2 rounded-lg bg-muted/30 p-2">
      <Select
        value={displayFieldValue ?? ""}
        onValueChange={handleFieldChange}
      >
        <SelectTrigger className={triggerClass}>
          <SelectValue placeholder="Field">
            {fieldLabel ? String(fieldLabel) : null}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className={contentClass} position="popper">
          {fields.map((f) => (
            <SelectItem key={f.name} value={f.name} className={itemClass}>
              {f.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={displayOperatorValue ?? ""}
        onValueChange={handleOperatorChange}
      >
        <SelectTrigger className={triggerClass}>
          <SelectValue placeholder="Operator">
            {operatorLabel ? String(operatorLabel) : null}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className={contentClass} position="popper">
          {operators.map((op) => (
            <SelectItem key={op.value} value={op.value} className={itemClass}>
              {labels.operators[op.value] ?? op.value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {valueInput}

      <button
        type="button"
        onClick={() => onRemove(index)}
        aria-label={labels.removeFilter}
        className={cn(
          "flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive",
        )}
      >
        <span aria-hidden>&times;</span>
      </button>
    </div>
  );
}
