"use client";

import * as React from "react";
import { slot } from "./utils.js";
import { filterRowDefaults } from "./defaults.js";

export interface DateInputProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  unstyled?: boolean;
  disabled?: boolean;
  /** "date" = date-only, "datetime" = date + time */
  mode?: "date" | "datetime";
}

export function DateInput({
  value,
  onChange,
  placeholder,
  className,
  unstyled,
  disabled,
  mode = "datetime",
}: DateInputProps) {
  const isDateOnly = mode === "date";
  const resolvedPlaceholder =
    placeholder ?? (isDateOnly ? "YYYY-MM-DD" : "YYYY-MM-DD HH:mm");
  const inputType = isDateOnly ? "date" : "datetime-local";

  const nativeValue = React.useMemo(() => {
    if (!value?.trim()) return "";
    if (isDateOnly) {
      return value.substring(0, 10);
    }
    const normalized = value.trim().replace(" ", "T");
    return normalized.substring(0, 16);
  }, [value, isDateOnly]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (!raw) {
      onChange("");
      return;
    }
    if (isDateOnly) {
      onChange(raw);
    } else {
      onChange(raw.replace("T", " "));
    }
  };

  const inputClass = slot(filterRowDefaults.valueInput, className, unstyled);

  return (
    <input
      type={inputType}
      value={nativeValue}
      onChange={handleChange}
      placeholder={resolvedPlaceholder}
      className={inputClass}
      disabled={disabled}
      data-slot="date-input"
      aria-label="Date value"
    />
  );
}
