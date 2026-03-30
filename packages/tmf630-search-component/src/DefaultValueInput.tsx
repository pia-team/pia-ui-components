"use client";

import * as React from "react";
import { DateInput } from "./DateInput.js";
import { DefaultSelect } from "./DefaultSelect.js";
import { slot } from "./utils.js";
import { filterRowDefaults } from "./defaults.js";
import type { FieldType } from "./types.js";

export interface DefaultValueInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  unstyled?: boolean;
  type: FieldType;
  enumOptions?: { value: string; label: string }[];
  displayFormat?: "date" | "datetime";
  betweenIndex?: 0 | 1;
}

export function DefaultValueInput({
  value,
  onChange,
  placeholder,
  className,
  unstyled,
  type,
  enumOptions,
  displayFormat,
  betweenIndex,
}: DefaultValueInputProps) {
  const resolvedClass = slot(filterRowDefaults.valueInput, className, unstyled);

  const resolvedPlaceholder =
    betweenIndex === 0
      ? "From"
      : betweenIndex === 1
        ? "To"
        : placeholder;

  if (type === "date") {
    return (
      <DateInput
        value={value || undefined}
        onChange={onChange}
        placeholder={resolvedPlaceholder}
        className={className}
        unstyled={unstyled}
        mode={displayFormat === "datetime" ? "datetime" : "date"}
      />
    );
  }

  if (type === "enum" && enumOptions?.length) {
    return (
      <DefaultSelect
        value={value}
        options={enumOptions}
        onChange={onChange}
        placeholder={resolvedPlaceholder || "Select..."}
        displayLabel={enumOptions.find((o) => o.value === value)?.label}
        triggerClassName={resolvedClass}
        data-slot="value-input"
        aria-label="Filter value"
      />
    );
  }

  return (
    <input
      type={type === "numeric" ? "number" : "text"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={resolvedPlaceholder}
      className={resolvedClass}
      data-slot="value-input"
      aria-label="Filter value"
    />
  );
}
