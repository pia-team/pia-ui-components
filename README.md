# PIA UI Components

TMF630 QueryDSL-compliant filter components for React applications.

## Packages

| Package | Description |
|---------|-------------|
| `@pia-team/pia-ui-tmf630-query-core` | Framework-agnostic types, operators, serialization/deserialization, compound filter helpers |
| `@pia-team/pia-ui-tmf630-search` | React filter panel, chips, compound panel, headless hook, theming |

## Installation

```bash
npm install @pia-team/pia-ui-tmf630-search
# Radix UI is optional — only needed if you use the default select components
npm install @radix-ui/react-select
```

Both ESM and CJS builds are included (`import` and `require` both work).

> Scoped to `@pia-team` on GitHub Packages. Add to your `.npmrc`:
> ```
> @pia-team:registry=https://npm.pkg.github.com
> //npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
> ```

## Three Usage Modes

### 1. Batteries Included

Drop-in components with Tailwind defaults:

```tsx
import { FilterPanel, FilterChips, labelsEn } from "@pia-team/pia-ui-tmf630-search";

<FilterPanel
  fields={fields}
  labels={labelsEn}
  onApply={handleApply}
/>
```

### 2. Customized

Override styling, icons, selects, and behavior:

```tsx
<FilterPanel
  fields={fields}
  labels={labels}
  onApply={handleApply}
  classNames={{
    panel: "my-custom-panel",
    applyButton: "my-btn-primary",
  }}
  rowClassNames={{
    root: "my-row-style",
    valueInput: "my-input",
  }}
  icons={{
    close: <XIcon />,
    remove: <TrashIcon />,
    filter: <FilterIcon />,
    apply: <CheckIcon />,
  }}
  unstyled   // removes ALL default Tailwind classes
  rowSlots={{
    fieldSelect: (props) => <MyCustomSelect {...props} />,
  }}
/>
```

### 3. Headless

Full control — use the hook, build your own UI:

```tsx
import { useFilterPanel } from "@pia-team/pia-ui-tmf630-search";

function MyFilterPanel() {
  const { filters, addFilter, removeFilter, updateFilter, apply, isOpen, toggle } =
    useFilterPanel({
      fields,
      onApply: handleApply,
      defaultFilter: { field: "name", operator: "containsi", value: "" },
    });

  return (
    <div>
      <button onClick={toggle}>Toggle</button>
      {isOpen && (
        <div>
          {filters.map((f, i) => (
            <div key={f._id}>
              {/* Build your own filter row UI */}
            </div>
          ))}
          <button onClick={apply}>Apply</button>
        </div>
      )}
    </div>
  );
}
```

## Compound Filters (AND/OR Groups) — V2

Build complex filter trees with nested AND/OR logic:

```tsx
import {
  CompoundFilterPanel,
  createGroup,
  flattenToConditions,
} from "@pia-team/pia-ui-tmf630-search";
import type { FilterGroup } from "@pia-team/pia-ui-tmf630-search";

function AdvancedFilters() {
  const [group, setGroup] = useState<FilterGroup>(() => createGroup("and"));

  return (
    <CompoundFilterPanel
      fields={fields}
      value={group}
      onChange={setGroup}
      onApply={(g) => {
        // Flatten to simple conditions for TMF630 query params
        const flat = flattenToConditions(g);
        const params = serializeFilters(flat);
        // Or serialize the full tree for a JSON body
        const json = serializeCompound(g);
      }}
      maxDepth={3}  // maximum nesting depth
    />
  );
}
```

### Compound Utility Functions

| Function | Description |
|----------|-------------|
| `createGroup(logic?)` | Create a new empty AND/OR group |
| `groupFromFlat(conditions, logic?)` | Wrap flat conditions into a group |
| `addToGroup(group, node)` | Add a condition or nested group (immutable) |
| `removeFromGroup(group, index)` | Remove by index (immutable) |
| `toggleGroupLogic(group)` | Switch AND ↔ OR (immutable) |
| `flattenToConditions(node)` | Flatten tree to leaf conditions (for serialization) |
| `countConditions(node)` | Count total leaf conditions in tree |
| `serializeCompound(group)` | Serialize tree to JSON object |
| `deserializeCompound(json)` | Deserialize JSON back to FilterGroup |
| `isFilterGroup(node)` | Type guard: is a node a group? |

## Theming

### Theme Provider

Set global defaults for all filter components:

```tsx
import { FilterThemeProvider } from "@pia-team/pia-ui-tmf630-search";

<FilterThemeProvider config={{
  unstyled: false,
  icons: { close: <XIcon />, remove: <MinusIcon /> },
  classNames: {
    panel: { applyButton: "btn-primary" },
    row: { root: "my-row" },
    chips: { chip: "my-chip" },
  },
}}>
  <App />
</FilterThemeProvider>
```

### CSS Custom Properties (No Tailwind)

For projects not using Tailwind, import the prebuilt CSS:

```css
@import "@pia-team/pia-ui-tmf630-search/variables.css";
@import "@pia-team/pia-ui-tmf630-search/filter-components.css";
```

Customize via CSS variables:

```css
:root {
  --filter-primary: #6d28d9;
  --filter-radius: 8px;
  --filter-font-size: 14px;
  --filter-bg: #ffffff;
  --filter-border-color: #e2e8f0;
}
```

### Class Merger Integration (tailwind-merge)

By default, class names are joined with spaces. Plug in `tailwind-merge` for conflict resolution:

```tsx
import { setClassMerger } from "@pia-team/pia-ui-tmf630-search";
import { twMerge } from "tailwind-merge";

setClassMerger(twMerge);
```

## Sort Serialization

TMF630 sort convention (`-field` for desc, `field` for asc):

```tsx
import { serializeSort, deserializeSort, toggleSort } from "@pia-team/pia-ui-tmf630-query-core";

// Serialize for API query parameter
serializeSort({ field: "createdOn", direction: "desc" }); // "-createdOn"
serializeSort({ field: "name", direction: "asc" });       // "name"
serializeSort(null);                                       // undefined

// Deserialize from query parameter
deserializeSort("-createdOn"); // { field: "createdOn", direction: "desc" }
deserializeSort("name");      // { field: "name", direction: "asc" }

// Three-way toggle: null → asc → desc → null
toggleSort(null, "name");                                    // { field: "name", direction: "asc" }
toggleSort({ field: "name", direction: "asc" }, "name");     // { field: "name", direction: "desc" }
toggleSort({ field: "name", direction: "desc" }, "name");    // null
```

## TMF630 Pagination Headers

Parse standard TMF630 pagination headers from HTTP responses:

```tsx
import { parseTMF630Headers } from "@pia-team/pia-ui-tmf630-query-core";
import type { PaginatedResult } from "@pia-team/pia-ui-tmf630-query-core";

const response = await fetch("/api/transformations?offset=0&limit=20");
const data = await response.json();
const page: PaginatedResult<Transformation> = parseTMF630Headers(
  data,
  response.headers,
  response.status,
);

// page.totalCount   → from X-Total-Count header
// page.resultCount  → from X-Result-Count header
// page.rangeStart   → from Content-Range: items 0-19/42
// page.rangeEnd     → from Content-Range
// page.isLastPage   → true if HTTP 200, false if HTTP 206
```

## Enum Fields

Enum fields with `enumOptions` automatically render a dropdown select:

```tsx
const fields = [
  {
    name: "status",
    label: "Status",
    type: "enum",
    enumOptions: [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
    ],
  },
];
```

No additional configuration needed — the built-in `DefaultSelect` is used.

## Controlled Open/Close

```tsx
const [open, setOpen] = useState(false);

<FilterPanel
  open={open}
  onOpenChange={setOpen}
  // ...
/>
```

## Validation

```tsx
<FilterPanel
  validate={(filter, field) => {
    if (field?.type === "date" && !filter.value) return "Date is required";
    return null;
  }}
  // ...
/>
```

Per-field validation:

```tsx
const fields = [
  {
    name: "email",
    label: "Email",
    type: "text",
    validate: (value) => value.includes("@") ? null : "Invalid email",
  },
];
```

## Custom Field Types

```tsx
import { type OperatorDefinition } from "@pia-team/pia-ui-tmf630-search";

const booleanOps: OperatorDefinition[] = [
  { value: "eq", requiresValue: true, isMultiValue: false },
  { value: "isnull", requiresValue: false, isMultiValue: false },
];

<FilterPanel
  customFieldTypes={{ boolean: booleanOps }}
  fields={[
    { name: "isActive", label: "Active", type: "boolean" },
  ]}
  // ...
/>
```

## Event Callbacks

```tsx
<FilterPanel
  onFilterAdd={(filter) => console.log("Added:", filter)}
  onFilterRemove={(index, filter) => console.log("Removed:", index)}
  onFilterChange={(index, filter) => console.log("Changed:", index)}
  // ...
/>
```

## Accessibility

- **Focus Trap** — When the filter panel is open, Tab cycling is trapped within the panel. Focus returns to the trigger on close.
- **ARIA** — All interactive elements have `role`, `aria-label`, and `aria-expanded` attributes.
- **Keyboard Shortcuts:**

| Key | Action |
|-----|--------|
| `Escape` | Close panel |
| `Ctrl/Cmd + Enter` | Apply filters |
| `Tab` / `Shift+Tab` | Navigate within panel (trapped) |

The `useFocusTrap` hook is exported separately for custom implementations:

```tsx
import { useFocusTrap } from "@pia-team/pia-ui-tmf630-search";

const ref = useFocusTrap<HTMLDivElement>(isOpen);
return <div ref={ref}>...</div>;
```

## Render Slots

Replace any internal component without forking:

```tsx
<FilterPanel
  rowSlots={{
    fieldSelect: ({ value, options, onChange }) => (
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    ),
    operatorSelect: ({ value, options, onChange }) => (
      <MyCombobox value={value} options={options} onChange={onChange} />
    ),
    valueInput: ({ value, onChange, type, enumOptions }) => (
      <MyInput value={value} onChange={onChange} />
    ),
  }}
/>
```

## Data Attributes

All elements have `data-slot` attributes for E2E testing:

```
data-slot="filter-panel-root"
data-slot="filter-trigger"
data-slot="filter-panel"
data-slot="filter-row"
data-slot="field-select"
data-slot="operator-select"
data-slot="value-input"
data-slot="remove-button"
data-slot="filter-apply"
data-slot="chip"
data-slot="chip-remove"
data-slot="filter-group"       (compound)
data-slot="logic-toggle"       (compound)
data-slot="add-condition"      (compound)
data-slot="add-group"          (compound)
```

## Storybook

Interactive component playground:

```bash
npm run storybook
# Opens at http://localhost:6006
```

Available stories:
- **Components/FilterPanel** — Default, with initial filters, with chips, unstyled, custom classNames
- **Components/FilterChips** — Default, empty, single filter
- **Components/CompoundFilterPanel** — Interactive AND/OR builder, pre-populated groups
- **Hooks/useFilterPanel** — Headless hook demo with raw HTML

## Development

```bash
# Install
npm install

# Build all packages (ESM + CJS + types)
npm run build

# Run tests (65 tests across 5 suites)
npm test

# Watch mode
npm run test:watch

# Storybook
npm run storybook

# Build Storybook static site
npm run build-storybook
```

### Project Structure

```
pia-ui-components/
├── packages/
│   ├── tmf630-query-core/           # Framework-agnostic core
│   │   ├── src/
│   │   │   ├── types.ts             # FilterCondition, FilterGroup, SortState, SearchParams
│   │   │   ├── operators.ts         # TMF630 operators by field type
│   │   │   ├── serialize.ts         # Conditions → query params (timezone-aware)
│   │   │   ├── deserialize.ts       # Query params → conditions
│   │   │   ├── sort.ts              # TMF630 sort serialize/deserialize/toggle
│   │   │   ├── pagination.ts        # TMF630 header parsing (X-Total-Count, Content-Range)
│   │   │   └── compound.ts          # V2: AND/OR tree utilities
│   │   └── tests/                   # 52 unit tests
│   └── tmf630-search-component/     # React UI
│       ├── src/
│       │   ├── FilterPanel.tsx       # Main filter panel
│       │   ├── FilterRow.tsx         # Single filter row
│       │   ├── FilterChips.tsx       # Active filter chips
│       │   ├── CompoundFilterPanel.tsx # V2: AND/OR grouped filters
│       │   ├── DefaultSelect.tsx     # Radix-based select (replaceable)
│       │   ├── useFilterPanel.ts     # Headless hook
│       │   ├── useFocusTrap.ts       # Focus trap hook
│       │   ├── FilterThemeContext.tsx # Theme provider
│       │   ├── defaults.ts           # Default Tailwind classes
│       │   ├── utils.ts              # cn(), slot(), setClassMerger()
│       │   ├── variables.css         # CSS custom properties
│       │   ├── filter-components.css # Prebuilt CSS (no Tailwind needed)
│       │   ├── i18n/                 # en.ts, tr.ts label presets
│       │   └── stories/              # Storybook stories
│       └── tests/                    # 13 hook tests
├── .storybook/                       # Storybook config
├── .github/workflows/ci.yml          # CI: build + test + publish
└── vitest.config.ts                  # Test config
```

## API Reference

### Components

| Export | Type | Description |
|--------|------|-------------|
| `FilterPanel` | Component | Main filter panel with trigger button |
| `FilterChips` | Component | Active filter chips display |
| `FilterRow` | Component | Single filter row (field, operator, value) |
| `CompoundFilterPanel` | Component | V2: AND/OR grouped filter builder |
| `DefaultSelect` | Component | Radix-based select (replaceable via slots) |
| `FilterThemeProvider` | Component | Global theme context provider |

### Hooks

| Export | Type | Description |
|--------|------|-------------|
| `useFilterPanel` | Hook | Headless state management for filters |
| `useFilterTheme` | Hook | Read current theme from context |
| `useFocusTrap` | Hook | Focus trap for modal-like panels |

### Functions

| Export | Description |
|--------|-------------|
| `serializeFilters` | FilterCondition[] → query params |
| `deserializeFilters` | Query params → FilterCondition[] |
| `serializeSort` | SortState → TMF630 sort string (`-field` / `field`) |
| `deserializeSort` | Sort string → SortState |
| `toggleSort` | Three-way toggle: null → asc → desc → null |
| `parseTMF630Headers` | Parse X-Total-Count, Content-Range, HTTP 200/206 → PaginatedResult |
| `serializeCompound` | FilterGroup → JSON object |
| `deserializeCompound` | JSON → FilterGroup |
| `flattenToConditions` | FilterGroup → FilterCondition[] |
| `createGroup` | Create empty AND/OR group |
| `groupFromFlat` | Wrap conditions in a group |
| `addToGroup` | Add node to group (immutable) |
| `removeFromGroup` | Remove from group (immutable) |
| `toggleGroupLogic` | Switch AND ↔ OR |
| `countConditions` | Count leaves in tree |
| `isFilterGroup` | Type guard for FilterGroup |
| `getOperatorsForFieldType` | Get operators for a field type |
| `setClassMerger` | Plug in tailwind-merge or custom merger |
| `normalizeDateToISO` | Date string → ISO 8601 (timezone-aware) |
| `normalizeDateTimeForDisplay` | Date/ISO string → `YYYY-MM-DD HH:mm` display |
| `normalizeDateToYYYYMMDD` | Date string → YYYY-MM-DD |
| `getLocalTimezoneOffset` | Runtime timezone offset (e.g. `+03:00`, `Z`) |

### Types

| Export | Description |
|--------|-------------|
| `FilterCondition` | `{ field, operator, value }` |
| `FilterOperator` | All 22 TMF630 operators (`eq`, `ne`, `contains`, `regex`, etc.) |
| `SortState` | `{ field, direction: "asc" \| "desc" }` |
| `SearchParams` | `{ offset?, limit?, sort?, fields?, filters? }` |
| `PaginatedResult<T>` | `{ data, totalCount, resultCount, rangeStart, rangeEnd, isLastPage }` |
| `FilterGroup` | Compound filter group `{ logic, conditions }` |
| `FilterNode` | Union: `FilterCondition \| FilterGroup` |
| `FilterLogic` | `"and" \| "or"` |
| `FilterableField` | Field definition `{ name, label, type, enumOptions? }` |
| `OperatorDefinition` | Operator metadata `{ value, requiresValue, isMultiValue }` |

### Constants

| Export | Description |
|--------|-------------|
| `filterPanelDefaults` | Default Tailwind classes for panel slots |
| `filterRowDefaults` | Default Tailwind classes for row slots |
| `filterChipsDefaults` | Default Tailwind classes for chips slots |
| `labelsEn` | English label preset |
| `labelsTr` | Turkish label preset |
| `TEXT_OPERATORS` | Operators for text fields |
| `DATE_OPERATORS` | Operators for date fields |
| `NUMERIC_OPERATORS` | Operators for numeric fields |
| `ENUM_OPERATORS` | Operators for enum fields |

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`):

- **Build job** — On every push/PR: `npm ci` → `npm run build` → `npm test`
- **Publish job** — On push to `main`: builds then publishes both packages to GitHub Packages

Set the `NODE_AUTH_TOKEN` secret in your GitHub repo settings (Settings → Secrets → Actions).

## License

MIT
