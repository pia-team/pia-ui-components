import { describe, it, expect } from "vitest";
import { formatDateForDisplay } from "../src/date-display.js";

describe("formatDateForDisplay", () => {
  it("formats date-only strings with common patterns", () => {
    expect(formatDateForDisplay("2026-03-24", "dd/MM/yyyy")).toBe("24/03/2026");
    expect(formatDateForDisplay("2026-03-24", "MM/dd/yyyy")).toBe("03/24/2026");
    expect(formatDateForDisplay("2026-03-24", "yyyy-MM-dd")).toBe("2026-03-24");
  });

  it("formats datetime strings", () => {
    expect(formatDateForDisplay("2026-03-24T14:30:00", "dd/MM/yyyy HH:mm")).toBe(
      "24/03/2026 14:30",
    );
    expect(formatDateForDisplay("2026-03-24 14:30", "dd/MM/yyyy HH:mm")).toBe(
      "24/03/2026 14:30",
    );
  });

  it("returns empty string for empty or null-ish input", () => {
    expect(formatDateForDisplay("", "dd/MM/yyyy")).toBe("");
    expect(formatDateForDisplay("   ", "dd/MM/yyyy")).toBe("");
    expect(formatDateForDisplay(null as unknown as string, "dd/MM/yyyy")).toBe("");
    expect(formatDateForDisplay(undefined as unknown as string, "dd/MM/yyyy")).toBe("");
  });
});
