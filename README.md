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

### Creating a `search-config.json` — Complete Guide

This section explains every property and option so you can build a config from scratch for any project.

#### Minimal Example

The simplest valid config — a single text field:

```json
{
  "fields": {
    "name": {}
  }
}
```

That's it. The system auto-derives:
- `type` defaults to `"text"`
- Operators default to the `text-search` preset (eq, ne, contains, containsi, ...)
- Display name defaults to `"Name"` (camelCase → Title Case)

#### Full Structure Reference

```json
{
  "displayPattern": "dd/MM/yyyy HH:mm",

  "fields": {
    "fieldName": {
      "type": "text",
      "displayName": "My Field",
      "operatorSet": "text-search",
      "operators": ["eq", "ne", "contains"],
      "nullable": false,
      "displayFormat": "date",
      "displayPattern": "yyyy-MM-dd",
      "values": [
        { "displayName": "Option A", "serverValue": "A" }
      ],
      "defaultOperator": "containsi",
      "validation": {
        "required": true,
        "minLength": 2,
        "maxLength": 255,
        "min": 1,
        "max": 9999,
        "pattern": "^[A-Z].*",
        "patternMessage": "Must start with uppercase"
      }
    }
  },

  "defaults": {
    "defaultField": "fieldName",
    "defaultOperator": "containsi"
  },

  "responseFields": ["fieldName", "otherField"]
}
```

> Every property except `fields` is optional. Inside `fields`, every property except the key name is optional.

#### Top-Level Properties

| Property | Required | Description |
|---|---|---|
| `fields` | **Yes** | Map of field names to field configurations. Keys must match your backend DTO property names exactly. |
| `displayPattern` | No | Global date/time display pattern for all temporal fields (e.g. `"dd/MM/yyyy HH:mm"`). Individual fields can override this with their own `displayPattern`. |
| `defaults.defaultField` | No | Which field the search bar uses by default (e.g. typing "hello" searches `defaultField.defaultOperator=hello`). |
| `defaults.defaultOperator` | No | Which operator the search bar uses by default (e.g. `"containsi"` for case-insensitive substring match). |
| `responseFields` | No | Array of field names to include in the TMF630 `fields=` query parameter. Controls which columns the backend returns. Also used for CSV export headers. |

#### Field Types

The `type` property determines the input type rendered in the UI and which operators are available by default.

| Type | Description | Default Preset | UI Input | Example Backend Type |
|---|---|---|---|---|
| `text` | Free-text string (default if omitted) | `text-search` | `<input type="text">` | `String` |
| `numeric` | Numeric value | `numeric` | `<input type="number">` | `Integer`, `Long`, `BigDecimal` |
| `enum` | Fixed set of values | `selection` | `<select>` dropdown | Java `enum` |
| `email` | Email address (auto-validated) | `text-search` | `<input type="text">` | `String` |
| `url` | URL (auto-validated) | `text-search` | `<input type="text">` | `String` |
| `date` | Date only (no time) | `date-range` | `<input type="date">` | `LocalDate` |
| `dateTime` | Date + time (no timezone) | `date-range` | `<input type="datetime-local">` | `LocalDateTime` |
| `offsetDateTime` | Date + time + timezone offset | `date-range` | `<input type="datetime-local">` | `OffsetDateTime` |
| `instant` | UTC timestamp | `date-range` | `<input type="datetime-local">` | `Instant` |

> **Tip:** If your backend stores timestamps as `OffsetDateTime` (very common in Spring/JPA), use `"type": "offsetDateTime"`. If the backend stores date-only values (like `birthDate`), use `"type": "date"`.

#### Field Properties

| Property | Type | Default | Description |
|---|---|---|---|
| `type` | string | `"text"` | Field type (see table above) |
| `displayName` | string | auto from key | Human-readable label. Auto-generated from the field key via camelCase → Title Case (`"createdBy"` → `"Created By"`, `"transformationId"` → `"Transformation ID"`). |
| `operatorSet` | string | auto from type | Named operator preset (see below). Overrides the type's default preset. |
| `operators` | string[] | — | Explicit operator list. **Highest priority** — overrides both `operatorSet` and type defaults. |
| `nullable` | boolean | `false` | If `true`, appends `isnull` and `isnotnull` operators to the available list. Use for fields that can be `null` in the database. |
| `displayFormat` | `"date"` or `"datetime"` | auto from type | **Only for temporal types.** Controls whether the date picker shows time. `"date"` → date-only picker (`YYYY-MM-DD`), `"datetime"` → date+time picker. Defaults: `date` → `"date"`, `offsetDateTime`/`dateTime`/`instant` → `"datetime"`. |
| `displayPattern` | string | inherits global | Display format pattern for temporal fields (e.g. `"dd/MM/yyyy"`, `"yyyy-MM-dd HH:mm:ss"`). Overrides the top-level `displayPattern` for this field. |
| `values` | array | — | **Only for `type: "enum"`.** Static enum options. Each entry: `{ "displayName": "Label", "serverValue": "VALUE" }`. |
| `defaultOperator` | string | — | Override the operator pre-selected when this field is chosen in the filter row. |
| `validation` | object | — | Client-side validation rules (see below). |

#### TMF630 Operator Reference

All 22 TMF630 QueryDSL operators supported by the system:

| Operator | Meaning | Value Type | Query Example |
|---|---|---|---|
| `eq` | Equals | single | `name.eq=Alice` |
| `ne` | Not equals | single | `name.ne=Bob` |
| `eqi` | Equals (case-insensitive) | single | `name.eqi=alice` |
| `nei` | Not equals (case-insensitive) | single | `name.nei=bob` |
| `gt` | Greater than | single | `age.gt=18` |
| `gte` | Greater than or equal | single | `age.gte=18` |
| `lt` | Less than | single | `age.lt=65` |
| `lte` | Less than or equal | single | `age.lte=65` |
| `between` | Value range (2 values) | **dual** | `age.between=18&age.between=65` |
| `in` | In set (multi-value) | **multi** | `status.in=A&status.in=B` |
| `nin` | Not in set (multi-value) | **multi** | `status.nin=X&status.nin=Y` |
| `contains` | Contains substring | single | `name.contains=ali` |
| `containsi` | Contains (case-insensitive) | single | `name.containsi=ALI` |
| `startswith` | Starts with | single | `name.startswith=Al` |
| `startswithi` | Starts with (case-insensitive) | single | `name.startswithi=al` |
| `endswith` | Ends with | single | `name.endswith=ce` |
| `endswithi` | Ends with (case-insensitive) | single | `name.endswithi=CE` |
| `like` | SQL LIKE pattern | single | `name.like=A%` |
| `likei` | SQL LIKE (case-insensitive) | single | `name.likei=a%` |
| `regex` | Regular expression | single | `name.regex=^A.*` |
| `regexi` | Regex (case-insensitive) | single | `name.regexi=^a.*` |
| `isnull` | Is null (**no value needed**) | none | `name.isnull=true` |
| `isnotnull` | Is not null (**no value needed**) | none | `name.isnotnull=true` |

> **Backend notes:**
> - `regex` / `regexi` require `opentmf.tmf630.attribute-filtering.regex.enabled=true` on the backend.
> - `between`, `in`, `nin` are sent as **repeated query parameters** (e.g. `field.in=A&field.in=B`), not comma-separated.
> - Unknown fields/operators are validated by the backend's `on-unknown-field` and `on-unknown-operator` settings.

#### Operator Presets

Instead of listing raw operator codes per field, use named presets via `operatorSet`:

| Preset Name | Operators Included | Auto-Used By Types |
|---|---|---|
| `text-search` | eq, ne, contains, containsi, startswith, startswithi, endswith, endswithi, in, nin | `text`, `email`, `url` |
| `text-exact` | eq, ne, eqi, nei, in, nin | *(manual only)* |
| `selection` | eq, ne, in, nin | `enum` |
| `date-range` | eq, ne, gt, gte, lt, lte, between | `date`, `dateTime`, `offsetDateTime`, `instant` |
| `numeric` | eq, ne, gt, gte, lt, lte, between, in, nin | `numeric` |

#### Operator Resolution Priority (3 Levels)

The system resolves which operators a field gets using this priority:

```
1. "operators": ["eq", "ne", "in"]   ← HIGHEST: explicit list (full admin control)
2. "operatorSet": "text-exact"        ← MIDDLE:  named preset
3. auto-derived from "type"           ← LOWEST:  type-based default preset
```

`"nullable": true` **always** appends `isnull` / `isnotnull` to whichever level is active.

**Examples:**

```json
// Level 3 — auto: type "text" → gets text-search preset automatically
{ "type": "text" }
// Result: eq, ne, contains, containsi, startswith, startswithi, endswith, endswithi, in, nin

// Level 2 — preset override: force text-exact instead of text-search
{ "type": "text", "operatorSet": "text-exact" }
// Result: eq, ne, eqi, nei, in, nin

// Level 1 — explicit override: only these 3 operators, nothing else
{ "type": "text", "operators": ["eq", "ne", "contains"] }
// Result: eq, ne, contains

// Nullable adds isnull/isnotnull to any level
{ "type": "text", "operatorSet": "text-exact", "nullable": true }
// Result: eq, ne, eqi, nei, in, nin, isnull, isnotnull
```

#### UI Input per Operator

The filter panel automatically renders the correct input widget based on the selected operator:

| Operator | UI Rendered | Description |
|---|---|---|
| `between` | Two side-by-side inputs ("From" / "To") | `BetweenValueInput` — works for text, numeric, and date fields |
| `in`, `nin` on **enum** fields | Checkbox dropdown (multi-select) | `MultiSelectInput` — shows all enum options as checkboxes |
| `in`, `nin` on **text/numeric/date** fields | Tag/chip input | `TagValueInput` — type a value, press Enter to add as tag |
| `isnull`, `isnotnull` | No input (value hidden) | Value is automatically set to `"true"` |
| All other operators | Single input | Text input, number input, date picker, or enum dropdown depending on field type |

#### Validation Rules

Add client-side validation via the `validation` property:

```json
{
  "validation": {
    "required": true,
    "minLength": 2,
    "maxLength": 255,
    "min": 1,
    "max": 9999,
    "pattern": "^[A-Z].*",
    "patternMessage": "Must start with an uppercase letter"
  }
}
```

| Rule | Applies To | Description |
|---|---|---|
| `required` | all | Value cannot be empty |
| `minLength` | text, email, url | Minimum character count |
| `maxLength` | text, email, url | Maximum character count |
| `min` | numeric | Minimum numeric value |
| `max` | numeric | Maximum numeric value |
| `pattern` | all | Regex pattern the value must match |
| `patternMessage` | all | Custom error message when pattern fails |

> `email` and `url` types have **built-in validation** (email format, URL format) that runs automatically — no need to add patterns for those.

#### Step-by-Step: Creating a Config for a New Project

Suppose you have a backend API for "Products" with these DTO fields:

| DTO Field | Java Type | Nullable? | Notes |
|---|---|---|---|
| `productId` | `String` | No | Primary identifier |
| `productName` | `String` | No | Searchable name |
| `category` | `CategoryEnum` | No | ELECTRONICS, CLOTHING, FOOD |
| `price` | `BigDecimal` | No | Product price |
| `createdAt` | `OffsetDateTime` | No | Creation timestamp |
| `updatedAt` | `OffsetDateTime` | Yes | Last update (can be null) |
| `supplierEmail` | `String` | Yes | Supplier contact email |

**Step 1: Define each field with its type**

```json
{
  "fields": {
    "productId": {},
    "productName": {},
    "category": { "type": "enum" },
    "price": { "type": "numeric" },
    "createdAt": { "type": "offsetDateTime" },
    "updatedAt": { "type": "offsetDateTime" },
    "supplierEmail": { "type": "email" }
  }
}
```

**Step 2: Add enum values for `category`**

```json
"category": {
  "type": "enum",
  "values": [
    { "displayName": "Electronics", "serverValue": "ELECTRONICS" },
    { "displayName": "Clothing", "serverValue": "CLOTHING" },
    { "displayName": "Food", "serverValue": "FOOD" }
  ]
}
```

**Step 3: Mark nullable fields and customize display**

```json
"updatedAt": {
  "type": "offsetDateTime",
  "nullable": true,
  "displayFormat": "datetime"
},
"supplierEmail": {
  "type": "email",
  "nullable": true,
  "displayName": "Supplier Email"
}
```

**Step 4: Choose operator presets (or keep defaults)**

```json
"productId": {
  "operatorSet": "text-exact"
},
"productName": {
  "operatorSet": "text-search"
},
"price": {
  "operatorSet": "numeric",
  "validation": { "min": 0 }
}
```

> If you don't set `operatorSet`, the system auto-assigns based on `type` (see Operator Presets table).

**Step 5: Set defaults and response fields**

```json
"defaults": {
  "defaultField": "productName",
  "defaultOperator": "containsi"
},
"responseFields": [
  "productId", "productName", "category",
  "price", "createdAt", "updatedAt"
]
```

**Step 6: Add global display pattern**

```json
"displayPattern": "dd/MM/yyyy HH:mm"
```

**Complete result:**

```json
{
  "displayPattern": "dd/MM/yyyy HH:mm",
  "fields": {
    "productId": {
      "operatorSet": "text-exact",
      "validation": { "maxLength": 100 }
    },
    "productName": {
      "operatorSet": "text-search",
      "validation": { "maxLength": 255 }
    },
    "category": {
      "type": "enum",
      "values": [
        { "displayName": "Electronics", "serverValue": "ELECTRONICS" },
        { "displayName": "Clothing", "serverValue": "CLOTHING" },
        { "displayName": "Food", "serverValue": "FOOD" }
      ]
    },
    "price": {
      "type": "numeric",
      "validation": { "min": 0 }
    },
    "createdAt": {
      "type": "offsetDateTime",
      "displayFormat": "date"
    },
    "updatedAt": {
      "type": "offsetDateTime",
      "displayFormat": "datetime",
      "nullable": true
    },
    "supplierEmail": {
      "type": "email",
      "displayName": "Supplier Email",
      "nullable": true
    }
  },
  "defaults": {
    "defaultField": "productName",
    "defaultOperator": "containsi"
  },
  "responseFields": [
    "productId",
    "productName",
    "category",
    "price",
    "createdAt",
    "updatedAt"
  ]
}
```

This config automatically gives you:
- `productId` with exact match operators (eq, ne, eqi, nei, in, nin)
- `productName` with full text search (contains, startswith, endswith, etc.)
- `category` as a dropdown with 3 options
- `price` with numeric comparisons (gt, lt, between, etc.) and minimum 0 validation
- `createdAt` as date-only picker
- `updatedAt` as date+time picker with isnull/isnotnull (nullable)
- `supplierEmail` with email validation and isnull/isnotnull (nullable)
- Search bar types into `productName` with case-insensitive contains

#### Advanced: Explicit Operator List

For full control, bypass presets entirely with `operators`:

```json
"supplierEmail": {
  "type": "email",
  "nullable": true,
  "operators": ["eq", "ne", "contains", "containsi", "startswith", "startswithi", "in", "nin"]
}
```

> When `operators` is set, `operatorSet` and type defaults are **completely ignored**. `nullable: true` still appends `isnull`/`isnotnull`.

#### Advanced: Multi-Context Config

For applications that need different search configs for different pages/entities:

```json
{
  "version": "1.0",
  "contexts": {
    "products": {
      "fields": { "productName": {}, "price": { "type": "numeric" } },
      "defaults": { "defaultField": "productName" }
    },
    "orders": {
      "fields": { "orderId": {}, "status": { "type": "enum", "values": [...] } },
      "defaults": { "defaultField": "orderId" }
    }
  }
}
```

Access a specific context programmatically:

```tsx
const config = parseSearchConfig(rawJson);
const productsCtx = getContext(config, "products");
const ordersCtx = getContext(config, "orders");
```

> If you don't use `contexts`, the entire config is treated as a single `"default"` context.

#### Serving the Config

The config file can be served in multiple ways — **no code changes needed**, just deploy the JSON:

| Environment | How to Serve | Where it Lives |
|---|---|---|
| Local dev (`npm run dev`) | File in project root | `./search-config.json` |
| Docker Compose | Volume mount into container | `./transformation-ui/search-config.json:/app/search-config.json:ro` |
| Kubernetes | ConfigMap + volume mount | `envjs-configmap.yaml` → mounted at `/app/search-config.json` |
| API endpoint | Next.js API route reads the file | `GET /api/search-config` |

The `SearchConfigProvider` fetches from the URL you provide:

```tsx
<SearchConfigProvider url="/api/search-config">
```

#### Quick Checklist for New Projects

- [ ] List all filterable fields from your backend DTO
- [ ] Set `type` for each field (`text`, `numeric`, `enum`, `date`, `offsetDateTime`, etc.)
- [ ] Add `values` array for any `enum` fields
- [ ] Set `nullable: true` for fields that can be `null` in the database
- [ ] Choose `displayFormat` for date fields: `"date"` (date-only) or `"datetime"` (date+time)
- [ ] Optionally set `operatorSet` or `operators` to restrict available operators
- [ ] Add `validation` rules for fields that need client-side checks
- [ ] Set `defaults.defaultField` and `defaults.defaultOperator` for the search bar
- [ ] List `responseFields` to control which columns the backend returns
- [ ] Place the JSON file and configure your serving method (volume mount, ConfigMap, API route)

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
