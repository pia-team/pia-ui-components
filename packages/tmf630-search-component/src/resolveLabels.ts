import type { Labels } from "./types.js";
import { labelsEn } from "./i18n/en.js";

/**
 * Merge partial label configs onto English defaults so `operators` and other
 * keys are always defined. Prevents crashes when Storybook or consumers omit
 * `operators` or pass only a subset of strings.
 */
export function resolveLabels(
  ...partials: (Partial<Labels> | undefined)[]
): Labels {
  const merged: Labels = {
    ...labelsEn,
    operators: { ...labelsEn.operators },
  };
  for (const p of partials) {
    if (!p) continue;
    const { operators: opPartial, ...rest } = p;
    Object.assign(merged, rest);
    if (opPartial) {
      merged.operators = { ...merged.operators, ...opPartial };
    }
  }
  return merged;
}
