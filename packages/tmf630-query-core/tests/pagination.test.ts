import { describe, it, expect } from "vitest";
import { parseTMF630Headers } from "../src/pagination.js";

function makeHeaders(map: Record<string, string>): Headers {
  return new Headers(map);
}

describe("parseTMF630Headers", () => {
  it("parses a complete 200 response (last page)", () => {
    const data = [{ id: 1 }, { id: 2 }];
    const headers = makeHeaders({
      "X-Total-Count": "2",
      "X-Result-Count": "2",
      "Content-Range": "items 0-1/2",
    });

    const result = parseTMF630Headers(data, headers, 200);

    expect(result.data).toBe(data);
    expect(result.totalCount).toBe(2);
    expect(result.resultCount).toBe(2);
    expect(result.rangeStart).toBe(0);
    expect(result.rangeEnd).toBe(1);
    expect(result.isLastPage).toBe(true);
  });

  it("parses a 206 partial response (more pages)", () => {
    const data = Array.from({ length: 20 }, (_, i) => ({ id: i }));
    const headers = makeHeaders({
      "X-Total-Count": "42",
      "X-Result-Count": "20",
      "Content-Range": "items 0-19/42",
    });

    const result = parseTMF630Headers(data, headers, 206);

    expect(result.totalCount).toBe(42);
    expect(result.resultCount).toBe(20);
    expect(result.rangeStart).toBe(0);
    expect(result.rangeEnd).toBe(19);
    expect(result.isLastPage).toBe(false);
  });

  it("parses second page", () => {
    const data = Array.from({ length: 20 }, (_, i) => ({ id: i + 20 }));
    const headers = makeHeaders({
      "X-Total-Count": "42",
      "X-Result-Count": "20",
      "Content-Range": "items 20-39/42",
    });

    const result = parseTMF630Headers(data, headers, 206);

    expect(result.rangeStart).toBe(20);
    expect(result.rangeEnd).toBe(39);
    expect(result.isLastPage).toBe(false);
  });

  it("handles missing headers gracefully", () => {
    const data = [{ id: 1 }];
    const headers = makeHeaders({});

    const result = parseTMF630Headers(data, headers, 200);

    expect(result.totalCount).toBe(0);
    expect(result.resultCount).toBe(1);
    expect(result.rangeStart).toBe(0);
    expect(result.rangeEnd).toBe(0);
    expect(result.isLastPage).toBe(true);
  });

  it("handles empty data array", () => {
    const data: unknown[] = [];
    const headers = makeHeaders({
      "X-Total-Count": "0",
      "X-Result-Count": "0",
    });

    const result = parseTMF630Headers(data, headers, 200);

    expect(result.data).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.resultCount).toBe(0);
    expect(result.rangeStart).toBe(0);
    expect(result.rangeEnd).toBe(0);
    expect(result.isLastPage).toBe(true);
  });

  it("handles Content-Range with wildcard total", () => {
    const data = [{ id: 1 }];
    const headers = makeHeaders({
      "X-Total-Count": "100",
      "Content-Range": "items 0-0/*",
    });

    const result = parseTMF630Headers(data, headers, 206);

    expect(result.rangeStart).toBe(0);
    expect(result.rangeEnd).toBe(0);
    expect(result.isLastPage).toBe(false);
  });
});
