/**
 * Configurable class name merger.
 *
 * By default, joins strings with spaces. Consumers can plug in tailwind-merge:
 *
 *   import { setClassMerger } from "@pia-team/pia-ui-tmf630-search";
 *   import { twMerge } from "tailwind-merge";
 *   setClassMerger(twMerge);
 */

type ClassMerger = (...classes: string[]) => string;

let merger: ClassMerger = (...classes) => classes.filter(Boolean).join(" ");

export function setClassMerger(fn: ClassMerger): void {
  merger = fn;
}

export function cn(
  ...classes: (string | undefined | false | null)[]
): string {
  const filtered = classes.filter((c): c is string => typeof c === "string" && c.length > 0);
  if (filtered.length === 0) return "";
  return merger(...filtered);
}

/**
 * Resolve a slot class: returns override-only when unstyled, merged otherwise.
 */
export function slot(
  defaultClass: string,
  override?: string,
  unstyled?: boolean,
): string {
  if (unstyled) return override ?? "";
  if (!override) return defaultClass;
  return merger(defaultClass, override);
}
