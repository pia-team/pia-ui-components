import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MultiSelectInput } from "../src/MultiSelectInput.js";

const options = [
  { value: "JSLT", label: "JSLT" },
  { value: "XSLT", label: "XSLT" },
  { value: "JSONata", label: "JSONata" },
];

describe("MultiSelectInput", () => {
  it("renders with placeholder when no values selected", () => {
    render(
      <MultiSelectInput values={[]} options={options} onChange={vi.fn()} />,
    );
    expect(screen.getByText("Select...")).toBeTruthy();
  });

  it("renders custom placeholder", () => {
    render(
      <MultiSelectInput
        values={[]}
        options={options}
        onChange={vi.fn()}
        placeholder="Pick engines"
      />,
    );
    expect(screen.getByText("Pick engines")).toBeTruthy();
  });

  it("shows selected values as labels", () => {
    render(
      <MultiSelectInput
        values={["JSLT", "XSLT"]}
        options={options}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText("JSLT, XSLT")).toBeTruthy();
  });

  it("opens dropdown on click", async () => {
    const user = userEvent.setup();
    render(
      <MultiSelectInput values={[]} options={options} onChange={vi.fn()} />,
    );

    expect(screen.queryByRole("listbox")).toBeNull();

    const trigger = screen.getByRole("button");
    await user.click(trigger);

    expect(screen.getByRole("listbox")).toBeTruthy();
    expect(screen.getAllByText("JSLT")).toHaveLength(1);
    expect(screen.getByText("XSLT")).toBeTruthy();
    expect(screen.getByText("JSONata")).toBeTruthy();
  });

  it("selects an option by clicking checkbox", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <MultiSelectInput values={[]} options={options} onChange={onChange} />,
    );

    await user.click(screen.getByRole("button"));

    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[0]); // JSLT

    expect(onChange).toHaveBeenCalledWith(["JSLT"]);
  });

  it("deselects an already-selected option", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <MultiSelectInput
        values={["JSLT", "XSLT"]}
        options={options}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole("button"));

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes[0]).toBeChecked(); // JSLT
    expect(checkboxes[1]).toBeChecked(); // XSLT

    await user.click(checkboxes[0]); // uncheck JSLT

    expect(onChange).toHaveBeenCalledWith(["XSLT"]);
  });

  it("closes dropdown on click outside", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <span data-testid="outside">outside</span>
        <MultiSelectInput values={[]} options={options} onChange={vi.fn()} />
      </div>,
    );

    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("listbox")).toBeTruthy();

    await user.click(screen.getByTestId("outside"));
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("shows 'No options' when options list is empty", async () => {
    const user = userEvent.setup();
    render(
      <MultiSelectInput values={[]} options={[]} onChange={vi.fn()} />,
    );

    await user.click(screen.getByRole("button"));
    expect(screen.getByText("No options")).toBeTruthy();
  });

  it("has correct data-slot attributes", async () => {
    const user = userEvent.setup();
    render(
      <MultiSelectInput
        values={["JSLT"]}
        options={options}
        onChange={vi.fn()}
      />,
    );

    expect(document.querySelector('[data-slot="multi-select-input"]')).toBeTruthy();
    expect(document.querySelector('[data-slot="multi-select-trigger"]')).toBeTruthy();

    await user.click(screen.getByRole("button"));

    expect(document.querySelector('[data-slot="multi-select-content"]')).toBeTruthy();
    expect(document.querySelector('[data-slot="multi-select-item"]')).toBeTruthy();
    expect(document.querySelector('[data-slot="multi-select-checkbox"]')).toBeTruthy();
  });

  it("has correct aria attributes", async () => {
    const user = userEvent.setup();
    render(
      <MultiSelectInput values={[]} options={options} onChange={vi.fn()} />,
    );

    const trigger = screen.getByRole("button");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAttribute("aria-haspopup", "listbox");

    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("listbox")).toHaveAttribute("aria-multiselectable", "true");
  });
});
