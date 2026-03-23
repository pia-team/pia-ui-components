/**
 * TMF630 Pagination — Header parsing and result types.
 *
 * TMF630 APIs use these HTTP headers for pagination:
 *   - X-Total-Count:  total number of matching items
 *   - X-Result-Count: number of items in this page
 *   - Content-Range:  "items 0-19/42"
 *
 * HTTP status codes:
 *   - 200  = complete result (last page)
 *   - 206  = partial content (more pages available)
 */

/** Paginated result from a TMF630-compatible API. */
export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  resultCount: number;
  rangeStart: number;
  rangeEnd: number;
  isLastPage: boolean;
}

/**
 * Parse TMF630-style pagination headers from an HTTP response.
 *
 * @param data       - The parsed response body (array of items).
 * @param headers    - The response `Headers` object.
 * @param status     - The HTTP status code (200 = last page, 206 = more pages).
 * @returns A `PaginatedResult<T>` with pagination metadata.
 *
 * @example
 *   const res = await fetch(url);
 *   const body = await res.json();
 *   const page = parseTMF630Headers(body, res.headers, res.status);
 *   // page.totalCount, page.isLastPage, etc.
 */
export function parseTMF630Headers<T>(
  data: T[],
  headers: Headers,
  status: number,
): PaginatedResult<T> {
  const totalCount = parseInt(headers.get("X-Total-Count") ?? "0", 10);
  const resultCount = parseInt(
    headers.get("X-Result-Count") ?? String(data.length),
    10,
  );

  let rangeStart = 0;
  let rangeEnd = data.length > 0 ? data.length - 1 : 0;

  const contentRange = headers.get("Content-Range");
  if (contentRange) {
    const match = contentRange.match(/items\s+(\d+)-(\d+)\/(\d+|\*)/);
    if (match) {
      rangeStart = parseInt(match[1]!, 10);
      rangeEnd = parseInt(match[2]!, 10);
    }
  }

  const isLastPage = status === 200;

  return {
    data,
    totalCount,
    resultCount,
    rangeStart,
    rangeEnd,
    isLastPage,
  };
}
