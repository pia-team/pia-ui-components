/**
 * Default Tailwind class names for every component slot.
 * Consumers can override any slot via `classNames` props or `unstyled` mode.
 * Exported so consumers can extend or reference individual defaults.
 */

export const filterRowDefaults = {
  root: "flex flex-nowrap items-center gap-2 rounded-lg bg-muted/30 p-2",
  fieldTrigger:
    "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 [&>span]:line-clamp-1 min-w-[170px]",
  fieldContent:
    "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
  fieldItem:
    "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
  operatorTrigger:
    "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 [&>span]:line-clamp-1 min-w-[170px]",
  operatorContent:
    "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
  operatorItem:
    "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
  valueInput:
    "flex h-9 min-w-[200px] rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring whitespace-nowrap",
  removeButton:
    "flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive",
  error: "mt-1 text-xs text-destructive",
} as const;

export const filterPanelDefaults = {
  root: "relative",
  trigger:
    "inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-input bg-background text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-1 focus:ring-ring",
  panel:
    "absolute right-0 top-full z-50 mt-2 min-w-[640px] rounded-xl border bg-card p-5 shadow-lg animate-in fade-in-0 zoom-in-95",
  header: "mb-4 flex items-center justify-between",
  title: "text-sm font-semibold tracking-tight",
  closeButton:
    "flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
  filterList: "space-y-3",
  actions: "mt-4 flex flex-wrap items-center gap-2 border-t pt-4",
  addButton:
    "inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-1 focus:ring-ring",
  applyButton:
    "inline-flex h-9 cursor-pointer items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus:outline-none focus:ring-1 focus:ring-ring",
  clearButton:
    "inline-flex h-9 cursor-pointer items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-destructive focus:outline-none",
} as const;

export const filterChipsDefaults = {
  root: "flex flex-wrap items-center gap-2",
  label: "text-xs font-medium text-muted-foreground",
  chip: "inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 pr-1 text-xs text-primary",
  chipRemove:
    "inline-flex h-4 w-4 cursor-pointer items-center justify-center rounded p-0 text-primary/60 hover:text-destructive",
  clearAll:
    "cursor-pointer text-xs text-muted-foreground hover:text-destructive focus:outline-none",
} as const;
