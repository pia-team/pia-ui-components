import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BetweenValueInput } from "../src/BetweenValueInput.js";

describe("BetweenValueInput", () => {
  it("renders two default inputs for text fields", () => {
    render(
      <BetweenValueInput
        value={["", ""]}
        onChange={vi.fn()}
        fieldType="text"
      />,
    );
    const inputs = screen.getAllByRole("textbox");
    expect(inputs).toHaveLength(2);
  });

  it("renders number inputs for numeric fields", () => {
    render(
      <BetweenValueInput
        value={["1", "10"]}
        onChange={vi.fn()}
        fieldType="numeric"
      />,
    );
    const inputs = screen.getAllByRole("spinbutton");
    expect(inputs).toHaveLength(2);
    expect(inputs[0]).toHaveValue(1);
    expect(inputs[1]).toHaveValue(10);
  });

  it("calls onChange with updated 'from' value", () => {
    const onChange = vi.fn();
    render(
      <BetweenValueInput
        value={["aaa", "zzz"]}
        onChange={onChange}
        fieldType="text"
      />,
    );
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "bbb" } });
    expect(onChange).toHaveBeenCalledWith(["bbb", "zzz"]);
  });

  it("calls onChange with updated 'to' value", () => {
    const onChange = vi.fn();
    render(
      <BetweenValueInput
        value={["aaa", "zzz"]}
        onChange={onChange}
        fieldType="text"
      />,
    );
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[1], { target: { value: "yyy" } });
    expect(onChange).toHaveBeenCalledWith(["aaa", "yyy"]);
  });

  it("defaults missing array elements to empty string", () => {
    render(
      <BetweenValueInput
        value={[]}
        onChange={vi.fn()}
        fieldType="text"
      />,
    );
    const inputs = screen.getAllByRole("textbox");
    expect(inputs[0]).toHaveValue("");
    expect(inputs[1]).toHaveValue("");
  });

  it("renders native date inputs for date fields with displayFormat=date", () => {
    render(
      <BetweenValueInput
        value={["", ""]}
        onChange={vi.fn()}
        fieldType="date"
        field={{ name: "createdOn", label: "Created On", type: "date", displayFormat: "date" }}
      />,
    );
    const inputs = document.querySelectorAll('[data-slot="date-input"]');
    expect(inputs).toHaveLength(2);
    expect(inputs[0]).toHaveAttribute("type", "date");
    expect(inputs[1]).toHaveAttribute("type", "date");
  });

  it("renders native datetime-local inputs for date fields with displayFormat=datetime", () => {
    render(
      <BetweenValueInput
        value={["", ""]}
        onChange={vi.fn()}
        fieldType="date"
        field={{ name: "modifiedOn", label: "Modified On", type: "date", displayFormat: "datetime" }}
      />,
    );
    const inputs = document.querySelectorAll('[data-slot="date-input"]');
    expect(inputs).toHaveLength(2);
    expect(inputs[0]).toHaveAttribute("type", "datetime-local");
    expect(inputs[1]).toHaveAttribute("type", "datetime-local");
  });

  it("shows From/To placeholders for non-date fields", () => {
    render(
      <BetweenValueInput
        value={["", ""]}
        onChange={vi.fn()}
        fieldType="numeric"
      />,
    );
    const inputs = screen.getAllByLabelText("Filter value");
    expect(inputs).toHaveLength(2);
    expect(inputs[0]).toHaveAttribute("placeholder", "From");
    expect(inputs[1]).toHaveAttribute("placeholder", "To");
  });

  it("uses renderSingleInput when provided", () => {
    const renderSingleInput = vi.fn(({ value, betweenIndex }) => (
      <span data-testid={`custom-${betweenIndex}`}>{value}</span>
    ));
    render(
      <BetweenValueInput
        value={["hello", "world"]}
        onChange={vi.fn()}
        fieldType="text"
        renderSingleInput={renderSingleInput}
      />,
    );
    expect(screen.getByTestId("custom-0")).toHaveTextContent("hello");
    expect(screen.getByTestId("custom-1")).toHaveTextContent("world");
    expect(renderSingleInput).toHaveBeenCalledTimes(2);
    expect(renderSingleInput.mock.calls[0][0].betweenIndex).toBe(0);
    expect(renderSingleInput.mock.calls[1][0].betweenIndex).toBe(1);
  });

  it("has correct data-slot attributes", () => {
    render(
      <BetweenValueInput
        value={["", ""]}
        onChange={vi.fn()}
        fieldType="text"
      />,
    );
    expect(document.querySelector('[data-slot="between-input"]')).toBeTruthy();
    expect(document.querySelector('[data-slot="value-input"]')).toBeTruthy();
  });
});
