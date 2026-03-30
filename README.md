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

## Config-Driven Search (`SearchConfigProvider`)

For applications that want to **externalize filter configuration** (e.g., via a JSON file or API), the library provides a complete config-driven system. Operators, field types, validation, and enum values are all determined by the config — no hardcoded operator lists needed.

### Setup

```tsx
import { SearchConfigProvider, useSearchConfig, useSearchFields } from "@pia-team/pia-ui-tmf630-search";

function App() {
  return (
    <SearchConfigProvider url="/api/search-config">
      <TransformationsPage />
    </SearchConfigProvider>
  );
}
```

### Using Config Fields

```tsx
import { useSearchConfig, useSearchFields } from "@pia-team/pia-ui-tmf630-search";

function TransformationsPage() {
  const searchCtx = useSearchConfig();       // raw context config (fields, defaults, responseFields)
  const configFields = useSearchFields();     // UI-ready field descriptors with resolved operators

  return (
    <FilterPanel
      fields={configFields}
      labels={labels}
      defaultFilter={{
        field: searchCtx?.defaults.defaultField ?? "name",
        operator: searchCtx?.defaults.defaultOperator ?? "containsi",
        value: "",
      }}
      onApply={handleApply}
    />
  );
}
```

### Config File Format (search-config.json)

```json
{
  "displayPattern": "dd/MM/yyyy HH:mm",
  "fields": {
    "name": {
      "operatorSet": "text-search",
      "validation": { "maxLength": 255 }
    },
    "engine": {
      "type": "enum",
      "operatorSet": "selection",
      "values": [{ "displayName": "JSLT", "serverValue": "JSLT" }]
    },
    "createdOn": {
      "type": "offsetDateTime",
      "operatorSet": "date-range",
      "displayFormat": "date"
    },
    "modifiedOn": {
      "type": "offsetDateTime",
      "operatorSet": "date-range",
      "displayFormat": "date",
      "nullable": true
    },
    "createdBy": {
      "type": "email",
      "operators": ["eq", "ne", "contains", "containsi", "startswith", "startswithi", "in", "nin"]
    }
  },
  "defaults": {
    "defaultField": "name",
    "defaultOperator": "containsi"
  },
  "responseFields": ["name", "engine", "createdOn", "modifiedOn", "createdBy"]
}
```

### Operator Preset System

Instead of listing TMF630 operator codes per field, use named presets:

```tsx
import { OPERATOR_PRESETS } from "@pia-team/pia-ui-tmf630-search";
```

| Preset | Operators | Auto-used by |
|---|---|---|
| `text-search` | eq, ne, contains, containsi, startswith, startswithi, endswith, endswithi, in, nin | `text`, `email`, `url` |
| `text-exact` | eq, ne, eqi, nei, in, nin | — |
| `selection` | eq, ne, in, nin | `enum` |
| `date-range` | eq, ne, gt, gte, lt, lte, between | `date`, `dateTime`, `offsetDateTime`, `instant` |
| `numeric` | eq, ne, gt, gte, lt, lte, between, in, nin | `numeric` |

### Override Priority (3 levels)

```
1. "operators": ["eq", "ne", "in"]   ← highest: explicit list (advanced admin)
2. "operatorSet": "text-exact"        ← named preset
3. auto-derived from "type"           ← lowest: type-based default
```

`"nullable": true` always appends `isnull` / `isnotnull` to whichever level is active.

### Programmatic Config Parsing

```tsx
import {
  parseSearchConfig,
  getContext,
  configToFilterableFields,
  buildSerializeOptions,
  serializeResponseFields,
} from "@pia-team/pia-ui-tmf630-search";

// Parse and validate raw JSON
const config = parseSearchConfig(rawJson);

// Get a specific context (defaults to "default")
const ctx = getContext(config);

// Convert to UI field descriptors
const fields = configToFilterableFields(ctx, i18nMap);

// Build serialization options for serializeFilters()
const opts = buildSerializeOptions(ctx);
const params = serializeFilters(filters, opts);

// Build TMF630 fields= query parameter
const fieldsParam = serializeResponseFields(ctx); // "name,engine,createdOn,..."
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

## Operator-Aware Value Inputs

`FilterRow` automatically switches the value input based on the selected operator:

| Operator | Input Type | Component | Value shape |
|----------|-----------|-----------|-------------|
| `between` | Dual from/to inputs | `BetweenValueInput` | `string[]` (`[from, to]`) |
| `in`, `nin` (enum) | Checkbox dropdown | `MultiSelectInput` | `string[]` |
| `in`, `nin` (text/numeric/date) | Tag/chip input | `TagValueInput` | `string[]` |
| `isnull`, `isnotnull` | No input (hidden) | — | `"true"` |
| All others | Single input | `<input>` or `renderValueInput` | `string` |

### BetweenValueInput

Renders two side-by-side inputs for range queries. Delegates to `renderSingleInput` for custom date pickers:

```tsx
import { BetweenValueInput } from "@pia-team/pia-ui-tmf630-search";

<BetweenValueInput
  value={["2026-01-01", "2026-12-31"]}
  onChange={(pair) => console.log(pair)}
  fieldType="date"
  field={currentField}
  renderSingleInput={({ value, onChange, betweenIndex, displayFormat }) => (
    <DatePicker value={value} onChange={onChange}
      mode={displayFormat === "datetime" ? "datetime" : "date"} />
  )}
/>
```

### TagValueInput

Tag/chip input for multi-value operators (`in`/`nin`) on text, numeric, or date fields. Type a value and press Enter or comma to add:

```tsx
import { TagValueInput } from "@pia-team/pia-ui-tmf630-search";

<TagValueInput
  values={["Alice", "Bob"]}
  onChange={(tags) => console.log(tags)}
  placeholder="Type and press Enter"
  inputType="text"
/>
```

### MultiSelectInput

Checkbox dropdown for multi-value operators on enum fields:

```tsx
import { MultiSelectInput } from "@pia-team/pia-ui-tmf630-search";

<MultiSelectInput
  values={["JSLT"]}
  options={[
    { value: "JSLT", label: "JSLT" },
    { value: "XSLT", label: "XSLT" },
  ]}
  onChange={(selected) => console.log(selected)}
/>
```

### Backend Serialization

Multi-value operators are serialized as **repeated query parameters**, matching the TMF630 toolkit specification:

```
# between
birthdate.between=1990-01-01&birthdate.between=1999-12-31

# in
surname.in=Doe&surname.in=Brown

# isnull (no value)
name.isnull=true
```

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

### Published site (GitHub Pages)

After you enable Pages once (repo **Settings → Pages → Source: GitHub Actions**), each push to `main` deploys Storybook:

**https://pia-team.github.io/pia-ui-components/**

Workflow: [`.github/workflows/storybook-pages.yml`](.github/workflows/storybook-pages.yml).

Available stories:
- **Query core/Playground** — `serializeFilters` / `deserializeFilters` (with typed `fieldConfigs`) and compound JSON round-trip
- **Components/FilterPanel** — Default, with initial filters, with chips, unstyled, custom classNames, **config-driven** (operator presets + enum dropdown), **operator-aware inputs** (between, in/nin, isnull/isnotnull)
- **Components/FilterChips** — Default, empty, single filter
- **Components/CompoundFilterPanel** — Interactive AND/OR builder, pre-populated groups, operator-aware fields
- **Components/BetweenValueInput** — Dual from/to inputs for `between` operator, custom renderers
- **Components/TagValueInput** — Tag/chip input for `in`/`nin` operators on text/numeric/date fields
- **Components/MultiSelectInput** — Checkbox dropdown for `in`/`nin` operators on enum fields
- **Hooks/useFilterPanel** — Headless hook demo, **operator-restricted fields** (preset + explicit operators + nullable + enum dropdown)

## Development

```bash
# Install
npm install

# Build all packages (ESM + CJS + types)
npm run build

# Run tests (181 tests across 13 suites)
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
│   │   │   ├── compound.ts          # V2: AND/OR tree utilities
│   │   │   └── config.ts            # Search config: parse, normalize, validate, operator presets
│   │   └── tests/                   # 116 unit tests (core logic)
│   └── tmf630-search-component/     # React UI
│       ├── src/
│       │   ├── FilterPanel.tsx       # Main filter panel
│       │   ├── FilterRow.tsx         # Single filter row (operator-aware value inputs)
│       │   ├── FilterChips.tsx       # Active filter chips
│       │   ├── BetweenValueInput.tsx # Dual from/to inputs for between operator
│       │   ├── TagValueInput.tsx     # Tag/chip input for in/nin operators
│       │   ├── MultiSelectInput.tsx  # Checkbox dropdown for in/nin on enums
│       │   ├── DateInput.tsx         # Native date/datetime input
│       │   ├── DefaultValueInput.tsx # Built-in type-switching value input
│       │   ├── CompoundFilterPanel.tsx # V2: AND/OR grouped filters
│       │   ├── DefaultSelect.tsx     # Radix-based select (replaceable)
│       │   ├── useFilterPanel.ts     # Headless hook
│       │   ├── useFocusTrap.ts       # Focus trap hook
│       │   ├── FilterThemeContext.tsx # Theme provider
│       │   ├── defaults.ts           # Default Tailwind classes
│       │   ├── utils.ts              # cn(), slot(), setClassMerger()
│       │   ├── variables.css         # CSS custom properties
│       │   ├── filter-components.css # Prebuilt CSS (no Tailwind needed)
│       │   ├── SearchConfigContext.tsx # Config provider, useSearchConfig, useSearchFields
│       │   ├── i18n/                 # en.ts, tr.ts label presets
│       │   └── stories/              # Storybook stories
│       └── tests/                    # 60 component + hook tests
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
| `FilterRow` | Component | Single filter row with operator-aware value inputs |
| `BetweenValueInput` | Component | Dual from/to inputs for `between` operator |
| `TagValueInput` | Component | Tag/chip input for `in`/`nin` on text/numeric/date fields |
| `MultiSelectInput` | Component | Checkbox dropdown for `in`/`nin` on enum fields |
| `CompoundFilterPanel` | Component | V2: AND/OR grouped filter builder |
| `DefaultSelect` | Component | Radix-based select (replaceable via slots) |
| `FilterThemeProvider` | Component | Global theme context provider |
| `DateInput` | Component | Native browser date/datetime input with `mode` prop |
| `DefaultValueInput` | Component | Built-in type-switching input (date/enum/text/numeric) |
| `SearchConfigProvider` | Component | Config-driven search provider (fetches config from URL) |

### Hooks

| Export | Type | Description |
|--------|------|-------------|
| `useFilterPanel` | Hook | Headless state management for filters |
| `useFilterTheme` | Hook | Read current theme from context |
| `useFocusTrap` | Hook | Focus trap for modal-like panels |
| `useSearchConfig` | Hook | Read raw search config context |
| `useSearchFields` | Hook | Get UI-ready `FilterableField[]` from config context |

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
| `operatorsRequireNoValue` | Check if operator needs no value input (`isnull`, `isnotnull`) |
| `isMultiValueOperator` | Check if operator expects array values (`between`, `in`, `nin`) |
| `parseSearchConfig` | Parse and validate raw search-config JSON |
| `getContext` | Get a named context from parsed config |
| `configToFilterableFields` | Convert config context → `FilterableField[]` |
| `buildSerializeOptions` | Config context → `SerializeFiltersOptions` |
| `buildValidator` | Config context → per-field validation function |
| `serializeResponseFields` | Config context → TMF630 `fields=` parameter |
| `formatDateForDisplay` | Format date value using display pattern |
| `formatDateValue` | Format date for wire/display based on field config |
| `createSearchFilter` | Build a FilterCondition from search text + config defaults |
| `setClassMerger` | Plug in tailwind-merge or custom merger |
| `normalizeDateToISO` | Date string → ISO 8601 (timezone-aware) |
| `normalizeDateTimeForDisplay` | Date/ISO string → `YYYY-MM-DD HH:mm` display |
| `normalizeDateToYYYYMMDD` | Date string → YYYY-MM-DD |
| `getLocalTimezoneOffset` | Runtime timezone offset (e.g. `+03:00`, `Z`) — via `@pia-team/pia-ui-tmf630-query-core` |

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
| `FilterableField` | Field definition `{ name, label, type, displayFormat?, operators?, enumOptions?, validate? }` |
| `OperatorDefinition` | Operator metadata `{ value, requiresValue, isMultiValue }` |
| `ValueInputSlotProps` | Props for `renderValueInput` callback `{ value, onChange, type, enumOptions, ... }` |
| `BetweenValueInputProps` | Props for `BetweenValueInput` component |
| `TagValueInputProps` | Props for `TagValueInput` component |
| `MultiSelectInputProps` | Props for `MultiSelectInput` component |
| `FieldConfig` | Config-level field descriptor `{ type, operatorSet, operators, nullable, values, validation }` |
| `SearchConfig` | Parsed search-config structure |
| `SearchContextConfig` | Single context within config (fields, defaults, responseFields) |

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
| `OPERATOR_PRESETS` | Named operator preset map (`text-search`, `text-exact`, `selection`, `date-range`, `numeric`) |

## Real-World Integration Example: transformation-ui

> This section demonstrates how one consumer application integrates the library end-to-end. Your application's integration will follow the same patterns with your own fields, API endpoints, and UI framework.

This section shows how [`transformation-ui`](https://github.com/pia-team/transformation-ui) integrates the full config-driven search system end-to-end.

### Architecture

```
search-config.json                    transformation-ui (Next.js)
   (ConfigMap / volume)
        │
        ▼
  GET /api/search-config  ──►  SearchConfigProvider  ──►  useSearchFields()
                                     │                         │
                                     ▼                         ▼
                              raw config context        FilterableField[]
                                     │                    (with operators)
                                     ▼                         │
                         buildSerializeOptions()               ▼
                         serializeResponseFields()       FilterPanel / FilterChips
                                     │
                                     ▼
                            serializeFilters()  ──►  TMF630 query string
                            (filter=..., fields=...)      to backend API
```

### Layout (SearchConfigProvider)

In `(main)/layout.tsx`, the config provider wraps all authenticated pages:

```tsx
import { SearchConfigProvider } from "@pia-team/pia-ui-tmf630-search";

export default function MainLayout({ children }) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  return (
    <SearchConfigProvider url={`${basePath}/api/search-config`}>
      {children}
    </SearchConfigProvider>
  );
}
```

### Filter Panel with Operator-Aware Inputs

In `transformations/page.tsx`, the config fields drive the panel. The library automatically renders `BetweenValueInput`, `TagValueInput`, and `MultiSelectInput` based on the selected operator. Custom date pickers and enum selects are integrated via `renderValueInput`:

```tsx
import { useSearchFields, FilterPanel, FilterChips, serializeFilters } from "@pia-team/pia-ui-tmf630-search";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function TransformationsPage() {
  const configFields = useSearchFields();

  return (
    <FilterPanel
      fields={configFields}
      labels={labels}
      onApply={(filters) => {
        const qs = serializeFilters(filters);
        router.push(`?${qs}`);
      }}
      renderValueInput={({ value, onChange, placeholder, className, type, enumOptions, displayFormat, betweenIndex }) =>
        type === "date" ? (
          <DatePicker value={value || undefined} onChange={onChange}
            placeholder={
              betweenIndex === 0 ? "From" :
              betweenIndex === 1 ? "To" :
              placeholder
            }
            className={className}
            mode={displayFormat === "datetime" ? "datetime" : "date"} />
        ) : type === "enum" && enumOptions?.length ? (
          <Select value={value || undefined} onValueChange={onChange}>
            <SelectTrigger className={className}>
              <SelectValue placeholder={placeholder || "Select..."} />
            </SelectTrigger>
            <SelectContent>
              {enumOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <input type={type === "numeric" ? "number" : "text"} value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={
              betweenIndex === 0 ? "From" :
              betweenIndex === 1 ? "To" :
              placeholder
            }
            className={className} />
        )
      }
    />
  );
}
```

### Admin Configuration Scenarios

| Scenario | Config change in `search-config.json` | Effect |
|---|---|---|
| Add a new searchable field | Add `"newField": { "type": "text" }` to `fields` | Field appears in filter dropdown, text-search operators auto-assigned |
| Restrict operators to exact match | Set `"operatorSet": "text-exact"` | Only eq, ne, eqi, nei, in, nin shown |
| Allow null checks on a date field | Add `"nullable": true` | `isnull` and `isnotnull` appended to operator list |
| Custom operator list for one field | Set `"operators": ["eq", "ne", "contains"]` | Only these 3 operators available for that field |
| Add enum dropdown with static values | Set `"type": "enum"`, `"values": [...]` | Dropdown renders instead of text input |
| Add client-side validation | Set `"validation": { "pattern": "...", "maxLength": 100 }` | Input validated before filter applied |
| Change date display format | Set root `"displayPattern": "yyyy-MM-dd"` | All date fields use new display format |
| No code changes required | All above are JSON-only | Restart/reload serves new config |

### Deployment Workflow

```
Developer/Admin                    transformation-ui
     │
     ├── Edits search-config.json
     │   (local file / ConfigMap / volume mount)
     │
     ├── Docker Compose: restart container
     │   or Kubernetes: kubectl apply -f configmap.yaml && kubectl rollout restart
     │
     └── Users refresh browser → new config active
```

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`):

- **Build job** — On every push/PR: `npm ci` → `npm run build` → `npm test`
- **Publish job** — On push to `main`: builds then publishes both packages to GitHub Packages

Set the `NODE_AUTH_TOKEN` secret in your GitHub repo settings (Settings → Secrets → Actions).

## License

MIT
