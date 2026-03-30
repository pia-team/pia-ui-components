"use client";

import * as React from "react";
import type { FieldType, FilterableField } from "./types.js";
import { slot } from "./utils.js";
import { filterRowDefaults } from "./defaults.js";
import { DefaultValueInput } from "./DefaultValueInput.js";

export interface BetweenValueInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  fieldType: FieldType;
  field?: FilterableField;
  className?: string;
  unstyled?: boolean;
  renderSingleInput?: (props: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    type: FieldType;
    enumOptions?: { value: string; label: string }[];
    displayFormat?: "date" | "datetime";
    betweenIndex: 0 | 1;
  }) => React.ReactNode;
}

export function BetweenValueInput({
  value,
  onChange,
  fieldType,
  field,
  className,
  unstyled,
  renderSingleInput,
}: BetweenValueInputProps) {
  const from = value[0] ?? "";
  const to = value[1] ?? "";

  const handleFromChange = (v: string) => onChange([v, to]);
  const handleToChange = (v: string) => onChange([from, v]);

  const inputClass = slot(filterRowDefaults.valueInput, className, unstyled);
  const isDate = fieldType === "date";
  const placeholderFrom = isDate
    ? (field?.displayFormat === "date" ? "YYYY-MM-DD" : "YYYY-MM-DD HH:mm")
    : "From";
  const placeholderTo = isDate
    ? (field?.displayFormat === "date" ? "YYYY-MM-DD" : "YYYY-MM-DD HH:mm")
    : "To";

  const fromInput = renderSingleInput
    ? renderSingleInput({
        value: from,
        onChange: handleFromChange,
        placeholder: placeholderFrom,
        className: inputClass,
        type: fieldType,
        enumOptions: field?.enumOptions,
        displayFormat: field?.displayFormat,
        betweenIndex: 0,
      })
    : (
        <DefaultValueInput
          value={from}
          onChange={handleFromChange}
          placeholder={placeholderFrom}
          className={className}
          unstyled={unstyled}
          type={fieldType}
          displayFormat={field?.displayFormat}
          betweenIndex={0}
        />
      );

  const toInput = renderSingleInput
    ? renderSingleInput({
        value: to,
        onChange: handleToChange,
        placeholder: placeholderTo,
        className: inputClass,
        type: fieldType,
        enumOptions: field?.enumOptions,
        displayFormat: field?.displayFormat,
        betweenIndex: 1,
      })
    : (
        <DefaultValueInput
          value={to}
          onChange={handleToChange}
          placeholder={placeholderTo}
          className={className}
          unstyled={unstyled}
          type={fieldType}
          displayFormat={field?.displayFormat}
          betweenIndex={1}
        />
      );

  return (
    <div
      className={unstyled ? "" : "flex items-center gap-1.5"}
      data-slot="between-input"
    >
      {fromInput}
      <span className={unstyled ? "" : "text-sm text-muted-foreground shrink-0"}>
        —
      </span>
      {toInput}
    </div>
  );
}
