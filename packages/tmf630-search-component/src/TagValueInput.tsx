"use client";

import * as React from "react";
import { slot } from "./utils.js";

export interface TagValueInputProps {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  unstyled?: boolean;
  inputType?: "text" | "number";
}

export function TagValueInput({
  values,
  onChange,
  placeholder = "Type and press Enter",
  className,
  unstyled,
  inputType = "text",
}: TagValueInputProps) {
  const [draft, setDraft] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const addValue = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    if (values.includes(trimmed)) return;
    onChange([...values, trimmed]);
    setDraft("");
  };

  const removeValue = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addValue(draft);
    }
    if (e.key === "Backspace" && draft === "" && values.length > 0) {
      removeValue(values.length - 1);
    }
  };

  const containerClass = slot(
    "flex min-w-[200px] flex-wrap items-center gap-1 rounded-lg border border-input bg-background px-2 py-1 text-sm shadow-sm ring-offset-background focus-within:ring-1 focus-within:ring-ring",
    className,
    unstyled,
  );

  const tagClass = unstyled
    ? ""
    : "inline-flex items-center gap-0.5 rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary";

  const tagRemoveClass = unstyled
    ? ""
    : "ml-0.5 cursor-pointer text-primary/50 hover:text-destructive";

  return (
    <div
      className={containerClass}
      data-slot="tag-value-input"
      onClick={() => inputRef.current?.focus()}
    >
      {values.map((v, i) => (
        <span key={`${v}-${i}`} className={tagClass} data-slot="tag">
          {v}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeValue(i);
            }}
            className={tagRemoveClass}
            aria-label={`Remove ${v}`}
            data-slot="tag-remove"
          >
            &times;
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type={inputType}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => addValue(draft)}
        placeholder={values.length === 0 ? placeholder : ""}
        className={unstyled ? "" : "min-w-[60px] flex-1 border-0 bg-transparent p-0.5 text-sm outline-none placeholder:text-muted-foreground"}
        data-slot="tag-input"
        aria-label="Add value"
      />
    </div>
  );
}
