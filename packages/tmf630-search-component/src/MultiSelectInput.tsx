"use client";

import * as React from "react";
import { slot } from "./utils.js";

export interface MultiSelectInputProps {
  values: string[];
  options: { value: string; label: string }[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  unstyled?: boolean;
}

export function MultiSelectInput({
  values,
  options,
  onChange,
  placeholder = "Select...",
  className,
  unstyled,
}: MultiSelectInputProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const toggleValue = (val: string) => {
    if (values.includes(val)) {
      onChange(values.filter((v) => v !== val));
    } else {
      onChange([...values, val]);
    }
  };

  const triggerClass = slot(
    "flex h-9 min-w-[200px] cursor-pointer items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring",
    className,
    unstyled,
  );

  const selectedLabels = values
    .map((v) => options.find((o) => o.value === v)?.label ?? v)
    .join(", ");

  return (
    <div ref={containerRef} className="relative" data-slot="multi-select-input">
      <button
        type="button"
        className={triggerClass}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
        data-slot="multi-select-trigger"
      >
        <span className={unstyled ? "" : "truncate"}>
          {selectedLabels || (
            <span className={unstyled ? "" : "text-muted-foreground"}>
              {placeholder}
            </span>
          )}
        </span>
        <svg
          className={unstyled ? "" : "h-4 w-4 shrink-0 opacity-50"}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className={
            unstyled
              ? ""
              : "absolute left-0 top-full z-50 mt-1 max-h-60 min-w-full overflow-auto rounded-lg border bg-popover p-1 shadow-md animate-in fade-in-0 zoom-in-95"
          }
          role="listbox"
          aria-multiselectable="true"
          data-slot="multi-select-content"
        >
          {options.map((opt) => {
            const checked = values.includes(opt.value);
            return (
              <label
                key={opt.value}
                className={
                  unstyled
                    ? ""
                    : "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                }
                data-slot="multi-select-item"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleValue(opt.value)}
                  className={unstyled ? "" : "h-4 w-4 rounded border-input accent-primary"}
                  data-slot="multi-select-checkbox"
                />
                {opt.label}
              </label>
            );
          })}
          {options.length === 0 && (
            <div className={unstyled ? "" : "px-2 py-1.5 text-sm text-muted-foreground"}>
              No options
            </div>
          )}
        </div>
      )}
    </div>
  );
}
