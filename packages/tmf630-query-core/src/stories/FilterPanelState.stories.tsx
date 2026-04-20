import type { Meta, StoryObj } from "@storybook/react";
import type { CSSProperties } from "react";
import { useState, useCallback } from "react";
import {
  type FilterPanelState,
  type FilterPanelField,
  type FilterCondition,
  resolveDefaultRow,
  getFieldOperators,
  createFilterPanelState,
  addFilterRow,
  removeFilterRow,
  changeRowField,
  changeRowOperator,
  applyFilterRows,
  clearFilterRows,
  validateFilterRows,
} from "@pia-team/pia-ui-tmf630-query-core";

const SAMPLE_FIELDS: FilterPanelField[] = [
  { name: "name", label: "Name", type: "text" },
  { name: "age", label: "Age", type: "numeric" },
  {
    name: "status",
    label: "Status",
    type: "enum",
    enumOptions: [
      { value: "ACTIVE", label: "Active" },
      { value: "INACTIVE", label: "Inactive" },
      { value: "DRAFT", label: "Draft" },
    ],
  },
  {
    name: "createdOn",
    label: "Created On",
    type: "date",
    displayFormat: "date",
    displayPattern: "dd/MM/yyyy",
  },
  {
    name: "modifiedOn",
    label: "Modified On",
    type: "date",
    displayFormat: "datetime",
    displayPattern: "dd/MM/yyyy HH:mm",
    responseDisplayFormat: "datetime",
  },
];

const box: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.75rem",
  fontFamily: "ui-sans-serif, system-ui, sans-serif",
  fontSize: "0.875rem",
};

const labelStyle: CSSProperties = { fontWeight: 600, color: "#334155" };

const btn: CSSProperties = {
  padding: "0.35rem 0.75rem",
  borderRadius: "0.375rem",
  border: "1px solid #64748b",
  background: "#f8fafc",
  cursor: "pointer",
  fontSize: "0.8125rem",
};

const pre: CSSProperties = {
  fontSize: "0.7rem",
  background: "#f1f5f9",
  padding: "0.75rem",
  borderRadius: "0.5rem",
  overflow: "auto",
  maxHeight: "20rem",
  margin: 0,
};

const rowStyle: CSSProperties = { display: "flex", gap: "0.5rem", flexWrap: "wrap" };

const selectStyle: CSSProperties = {
  padding: "0.25rem 0.5rem",
  borderRadius: "0.25rem",
  border: "1px solid #cbd5e1",
};

function StatePlayground() {
  const defaultRow = resolveDefaultRow(undefined, SAMPLE_FIELDS);
  const [state, setState] = useState<FilterPanelState>(() =>
    createFilterPanelState(undefined, defaultRow),
  );
  const [applied, setApplied] = useState<FilterCondition[]>([]);

  const handleAdd = useCallback(() => {
    setState((prev) => addFilterRow(prev, defaultRow));
  }, [defaultRow]);

  const handleRemove = useCallback(
    (idx: number) => {
      setState((prev) => removeFilterRow(prev, idx, defaultRow));
    },
    [defaultRow],
  );

  const handleFieldChange = useCallback(
    (idx: number, fieldName: string) => {
      setState((prev) => changeRowField(prev, idx, fieldName, SAMPLE_FIELDS));
    },
    [],
  );

  const handleOperatorChange = useCallback(
    (idx: number, operator: string) => {
      setState((prev) => changeRowOperator(prev, idx, operator, SAMPLE_FIELDS));
    },
    [],
  );

  const handleValueChange = useCallback(
    (idx: number, value: string, valueIndex?: number) => {
      setState((prev) => {
        const row = prev.rows[idx];
        if (!row) return prev;
        let newValue: string | string[];
        if (Array.isArray(row.value) && valueIndex !== undefined) {
          const arr = [...row.value];
          arr[valueIndex] = value;
          newValue = arr;
        } else {
          newValue = value;
        }
        const rows = [...prev.rows];
        rows[idx] = { ...row, value: newValue };
        return { ...prev, rows };
      });
    },
    [],
  );

  const handleApply = useCallback(() => {
    const errors = validateFilterRows(state, SAMPLE_FIELDS);
    if (errors.size > 0) {
      setState((prev) => ({ ...prev, errors }));
      return;
    }
    setState((prev) => ({ ...prev, errors: new Map() }));
    setApplied(applyFilterRows(state));
  }, [state]);

  const handleClear = useCallback(() => {
    setState(clearFilterRows(defaultRow));
    setApplied([]);
  }, [defaultRow]);

  return (
    <div style={box}>
      <p style={{ margin: 0, color: "#64748b", maxWidth: "52rem" }}>
        <strong>Framework-agnostic filter panel state</strong> — uses{" "}
        <code>changeRowField</code> and <code>changeRowOperator</code> for
        smart field/operator changes with automatic value adaptation.
        Angular/Vue/vanilla JS can use the same pure functions.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {state.rows.map((r, i) => {
          const ops = getFieldOperators(r.field, SAMPLE_FIELDS);
          const fieldDef = SAMPLE_FIELDS.find((f) => f.name === r.field);
          const error = state.errors.get(r.id);
          const isMulti = Array.isArray(r.value);
          const opDef = ops.find((o) => o.value === r.operator);
          const noValue = opDef && !opDef.requiresValue;

          return (
            <div key={r.id} style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
              <select value={r.field} onChange={(e) => handleFieldChange(i, e.target.value)} style={selectStyle}>
                {SAMPLE_FIELDS.map((f) => (
                  <option key={f.name} value={f.name}>{f.label}</option>
                ))}
              </select>
              <select value={r.operator} onChange={(e) => handleOperatorChange(i, e.target.value)} style={selectStyle}>
                {ops.map((op) => (
                  <option key={op.value} value={op.value}>{op.value}</option>
                ))}
              </select>
              {noValue ? (
                <span style={{ color: "#94a3b8", fontStyle: "italic", flex: 1 }}>no value needed</span>
              ) : isMulti ? (
                <div style={{ display: "flex", gap: "0.25rem", flex: 1 }}>
                  {(r.value as string[]).map((v, vi) => (
                    <input
                      key={vi}
                      value={v}
                      onChange={(e) => handleValueChange(i, e.target.value, vi)}
                      placeholder={`Value ${vi + 1}`}
                      style={{
                        padding: "0.25rem 0.5rem",
                        borderRadius: "0.25rem",
                        border: `1px solid ${error ? "#ef4444" : "#cbd5e1"}`,
                        flex: 1,
                      }}
                    />
                  ))}
                </div>
              ) : fieldDef?.enumOptions ? (
                <select
                  value={r.value as string}
                  onChange={(e) => handleValueChange(i, e.target.value)}
                  style={{ ...selectStyle, flex: 1 }}
                >
                  <option value="">-- select --</option>
                  {fieldDef.enumOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  value={r.value as string}
                  onChange={(e) => handleValueChange(i, e.target.value)}
                  placeholder="Value"
                  style={{
                    padding: "0.25rem 0.5rem",
                    borderRadius: "0.25rem",
                    border: `1px solid ${error ? "#ef4444" : "#cbd5e1"}`,
                    flex: 1,
                  }}
                />
              )}
              <button type="button" style={btn} onClick={() => handleRemove(i)}>x</button>
              {error && <span style={{ color: "#ef4444", fontSize: "0.75rem" }}>{error}</span>}
            </div>
          );
        })}
      </div>

      <div style={rowStyle}>
        <button type="button" style={btn} onClick={handleAdd}>+ Add Row</button>
        <button type="button" style={{ ...btn, fontWeight: 600 }} onClick={handleApply}>Apply</button>
        <button type="button" style={btn} onClick={handleClear}>Clear All</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div>
          <span style={labelStyle}>Internal State</span>
          <pre style={pre}>
            {JSON.stringify(
              { rows: state.rows, errorCount: state.errors.size },
              null,
              2,
            )}
          </pre>
        </div>
        <div>
          <span style={labelStyle}>Applied Filters (output)</span>
          <pre style={{ ...pre, background: applied.length > 0 ? "#ecfdf5" : "#f1f5f9" }}>
            {JSON.stringify(applied, null, 2)}
          </pre>
        </div>
      </div>

      <details style={{ fontSize: "0.75rem", color: "#64748b" }}>
        <summary style={{ cursor: "pointer" }}>Angular usage example</summary>
        <pre style={{ ...pre, marginTop: "0.5rem" }}>{`import {
  resolveDefaultRow, createFilterPanelState,
  addFilterRow, removeFilterRow, changeRowField,
  changeRowOperator, applyFilterRows, applyAndSerialize,
  getFieldOperators, configToFilterableFields, parseSearchConfig,
} from '@pia-team/pia-ui-tmf630-query-core';

@Injectable({ providedIn: 'root' })
export class FilterPanelService {
  private fields = configToFilterableFields(parseSearchConfig(config));
  private defaultRow = resolveDefaultRow(undefined, this.fields);
  private state$ = new BehaviorSubject(
    createFilterPanelState(undefined, this.defaultRow)
  );

  state = this.state$.asObservable();

  addRow() {
    this.state$.next(addFilterRow(this.state$.value, this.defaultRow));
  }

  remove(i: number) {
    this.state$.next(removeFilterRow(this.state$.value, i, this.defaultRow));
  }

  changeField(i: number, fieldName: string) {
    this.state$.next(changeRowField(this.state$.value, i, fieldName, this.fields));
  }

  changeOperator(i: number, op: string) {
    this.state$.next(changeRowOperator(this.state$.value, i, op, this.fields));
  }

  getOperators(fieldName: string) {
    return getFieldOperators(fieldName, this.fields);
  }

  apply() {
    return applyFilterRows(this.state$.value);
  }

  // Or use the convenience function:
  applyAndSerialize(fieldConfigs: FieldConfig[]) {
    return applyAndSerialize(this.state$.value, { fieldConfigs });
  }
}`}</pre>
      </details>
    </div>
  );
}

const meta = {
  title: "Query core/FilterPanelState",
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: () => <StatePlayground />,
};
