"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";

export interface DefaultSelectProps {
  value: string;
  options: { value: string; label: string; disabled?: boolean }[];
  onChange: (value: string) => void;
  placeholder?: string;
  triggerClassName?: string;
  contentClassName?: string;
  itemClassName?: string;
  displayLabel?: string;
  "data-slot"?: string;
  "aria-label"?: string;
}

/**
 * Default Radix-based select. Used internally by FilterRow when no custom
 * `slots.fieldSelect` or `slots.operatorSelect` is provided.
 * Consumers can replace this entirely via render slots.
 */
export const DefaultSelect = React.forwardRef<HTMLButtonElement, DefaultSelectProps>(
  function DefaultSelect(
    {
      value,
      options,
      onChange,
      placeholder,
      triggerClassName,
      contentClassName,
      itemClassName,
      displayLabel,
      "data-slot": dataSlot,
      "aria-label": ariaLabel,
    },
    ref,
  ) {
    return (
      <SelectPrimitive.Root value={value} onValueChange={onChange}>
        <SelectPrimitive.Trigger
          ref={ref}
          className={triggerClassName}
          data-slot={dataSlot}
          aria-label={ariaLabel}
        >
          <SelectPrimitive.Value placeholder={placeholder}>
            {displayLabel ? String(displayLabel) : null}
          </SelectPrimitive.Value>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Content className={contentClassName} position="popper">
          {options.map((opt) => (
            <SelectPrimitive.Item
              key={opt.value}
              value={opt.value}
              className={itemClassName}
              disabled={opt.disabled}
            >
              {opt.label}
            </SelectPrimitive.Item>
          ))}
        </SelectPrimitive.Content>
      </SelectPrimitive.Root>
    );
  },
);
