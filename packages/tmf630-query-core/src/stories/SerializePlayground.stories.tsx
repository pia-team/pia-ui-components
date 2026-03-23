import type { Meta, StoryObj } from "@storybook/react";
import type { CSSProperties } from "react";
import { useCallback, useState } from "react";
import {
  type FilterCondition,
  type FilterGroup,
  deserializeCompound,
  deserializeFilters,
  serializeCompound,
  serializeFilters,
} from "@pia-team/pia-ui-tmf630-query-core";

const SAMPLE_FILTERS = `[
  { "field": "name", "operator": "contains", "value": "acme" },
  { "field": "status", "operator": "eq", "value": "active" },
  { "field": "amount", "operator": "gte", "value": "100" }
]`;

const SAMPLE_PARAMS = `{
  "name.contains": "acme",
  "status.eq": "active",
  "amount.gte": "100"
}`;

const SAMPLE_COMPOUND = `{
  "logic": "and",
  "conditions": [
    { "field": "name", "operator": "contains", "value": "test" },
    {
      "logic": "or",
      "conditions": [
        { "field": "status", "operator": "eq", "value": "active" },
        { "field": "status", "operator": "eq", "value": "pending" }
      ]
    }
  ]
}`;

const box: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
  fontFamily: "ui-sans-serif, system-ui, sans-serif",
  fontSize: "0.875rem",
};

const label: CSSProperties = { fontWeight: 600, color: "#334155" };

const textarea: CSSProperties = {
  width: "100%",
  minHeight: "8rem",
  padding: "0.5rem 0.75rem",
  borderRadius: "0.375rem",
  border: "1px solid #cbd5e1",
  fontFamily: "ui-monospace, monospace",
  fontSize: "0.75rem",
  lineHeight: 1.5,
  boxSizing: "border-box",
};

const row: CSSProperties = { display: "flex", gap: "0.5rem", flexWrap: "wrap" };

const btn: CSSProperties = {
  padding: "0.35rem 0.75rem",
  borderRadius: "0.375rem",
  border: "1px solid #64748b",
  background: "#f8fafc",
  cursor: "pointer",
  fontSize: "0.8125rem",
};

const err: CSSProperties = {
  color: "#b91c1c",
  fontSize: "0.8125rem",
  whiteSpace: "pre-wrap",
};

function FlatPlayground() {
  const [filtersText, setFiltersText] = useState(SAMPLE_FILTERS);
  const [paramsText, setParamsText] = useState(SAMPLE_PARAMS);
  const [serializedOut, setSerializedOut] = useState("");
  const [deserializedOut, setDeserializedOut] = useState("");
  const [roundTripOut, setRoundTripOut] = useState("");
  const [error, setError] = useState<string | null>(null);

  const clearErr = useCallback(() => setError(null), []);

  const handleSerialize = () => {
    clearErr();
    try {
      const parsed = JSON.parse(filtersText) as unknown;
      if (!Array.isArray(parsed)) throw new Error("Expected FilterCondition[] (JSON array)");
      const params = serializeFilters(parsed as FilterCondition[], {
        dateFields: ["createdDate", "createdOn"],
      });
      setSerializedOut(JSON.stringify(params, null, 2));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleDeserialize = () => {
    clearErr();
    try {
      const parsed = JSON.parse(paramsText) as Record<string, string | string[]>;
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        throw new Error("Expected query param record (JSON object)");
      }
      const filters = deserializeFilters(parsed);
      setDeserializedOut(JSON.stringify(filters, null, 2));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleRoundTrip = () => {
    clearErr();
    try {
      const parsed = JSON.parse(filtersText) as unknown;
      if (!Array.isArray(parsed)) throw new Error("Expected FilterCondition[] (JSON array)");
      const params = serializeFilters(parsed as FilterCondition[]);
      const back = deserializeFilters(params as Record<string, string | string[]>);
      setRoundTripOut(JSON.stringify(back, null, 2));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div style={box}>
      <p style={{ margin: 0, color: "#64748b", maxWidth: "52rem" }}>
        Flat TMF630 filters: <code>serializeFilters</code> → query param record,{" "}
        <code>deserializeFilters</code> → array. Serialize uses{" "}
        <code>dateFields: [&quot;createdDate&quot;, &quot;createdOn&quot;]</code> as a demo for ISO
        normalization.
      </p>

      {error && <div style={err}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div style={box}>
          <span style={label}>FilterCondition[] (JSON array)</span>
          <textarea
            style={textarea}
            value={filtersText}
            onChange={(e) => setFiltersText(e.target.value)}
            spellCheck={false}
          />
          <div style={row}>
            <button type="button" style={btn} onClick={handleSerialize}>
              serializeFilters →
            </button>
            <button type="button" style={btn} onClick={handleRoundTrip}>
              Round-trip (serialize → deserialize)
            </button>
          </div>
          {serializedOut && (
            <>
              <span style={label}>Params (output)</span>
              <pre
                style={{
                  ...textarea,
                  minHeight: "6rem",
                  margin: 0,
                  background: "#f1f5f9",
                  overflow: "auto",
                }}
              >
                {serializedOut}
              </pre>
            </>
          )}
          {roundTripOut && (
            <>
              <span style={label}>Round-trip result</span>
              <pre
                style={{
                  ...textarea,
                  minHeight: "6rem",
                  margin: 0,
                  background: "#ecfdf5",
                  overflow: "auto",
                }}
              >
                {roundTripOut}
              </pre>
            </>
          )}
        </div>

        <div style={box}>
          <span style={label}>Query params (JSON object)</span>
          <textarea
            style={textarea}
            value={paramsText}
            onChange={(e) => setParamsText(e.target.value)}
            spellCheck={false}
          />
          <div style={row}>
            <button type="button" style={btn} onClick={handleDeserialize}>
              deserializeFilters →
            </button>
          </div>
          {deserializedOut && (
            <>
              <span style={label}>FilterCondition[] (output)</span>
              <pre
                style={{
                  ...textarea,
                  minHeight: "6rem",
                  margin: 0,
                  background: "#f1f5f9",
                  overflow: "auto",
                }}
              >
                {deserializedOut}
              </pre>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CompoundPlayground() {
  const [treeText, setTreeText] = useState(SAMPLE_COMPOUND);
  const [serializedOut, setSerializedOut] = useState("");
  const [roundTripOut, setRoundTripOut] = useState("");
  const [error, setError] = useState<string | null>(null);

  const parseTree = (): FilterGroup => {
    const parsed = JSON.parse(treeText) as unknown;
    return deserializeCompound(parsed as Parameters<typeof deserializeCompound>[0]);
  };

  const handleSerialize = () => {
    setError(null);
    try {
      const group = parseTree();
      const json = serializeCompound(group);
      setSerializedOut(JSON.stringify(json, null, 2));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleRoundTrip = () => {
    setError(null);
    try {
      const group = parseTree();
      const json = serializeCompound(group);
      const back = deserializeCompound(json);
      setRoundTripOut(JSON.stringify(back, null, 2));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div style={box}>
      <p style={{ margin: 0, color: "#64748b", maxWidth: "52rem" }}>
        Compound AND/OR tree: <code>serializeCompound</code> / <code>deserializeCompound</code> for JSON
        bodies or custom encoding (not flat URL params).
      </p>
      {error && <div style={err}>{error}</div>}
      <span style={label}>FilterGroup (JSON)</span>
      <textarea
        style={{ ...textarea, minHeight: "12rem" }}
        value={treeText}
        onChange={(e) => setTreeText(e.target.value)}
        spellCheck={false}
      />
      <div style={row}>
        <button type="button" style={btn} onClick={handleSerialize}>
          serializeCompound
        </button>
        <button type="button" style={btn} onClick={handleRoundTrip}>
          Round-trip
        </button>
      </div>
      {serializedOut && (
        <>
          <span style={label}>Serialized</span>
          <pre
            style={{
              ...textarea,
              minHeight: "8rem",
              margin: 0,
              background: "#f1f5f9",
              overflow: "auto",
            }}
          >
            {serializedOut}
          </pre>
        </>
      )}
      {roundTripOut && (
        <>
          <span style={label}>Round-trip</span>
          <pre
            style={{
              ...textarea,
              minHeight: "8rem",
              margin: 0,
              background: "#ecfdf5",
              overflow: "auto",
            }}
          >
            {roundTripOut}
          </pre>
        </>
      )}
    </div>
  );
}

const meta = {
  title: "Query core/Playground",
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const FlatFilters: Story = {
  render: () => <FlatPlayground />,
};

export const CompoundTree: Story = {
  render: () => <CompoundPlayground />,
};
