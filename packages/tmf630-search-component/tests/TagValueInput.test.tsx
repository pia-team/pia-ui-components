import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TagValueInput } from "../src/TagValueInput.js";

describe("TagValueInput", () => {
  it("renders existing tags", () => {
    render(
      <TagValueInput values={["Alice", "Bob"]} onChange={vi.fn()} />,
    );
    expect(screen.getByText("Alice")).toBeTruthy();
    expect(screen.getByText("Bob")).toBeTruthy();
  });

  it("shows placeholder when no tags exist", () => {
    render(
      <TagValueInput values={[]} onChange={vi.fn()} placeholder="Add names" />,
    );
    expect(screen.getByPlaceholderText("Add names")).toBeTruthy();
  });

  it("hides placeholder when tags exist", () => {
    render(
      <TagValueInput values={["Alice"]} onChange={vi.fn()} placeholder="Add names" />,
    );
    const input = screen.getByLabelText("Add value");
    expect(input).toHaveAttribute("placeholder", "");
  });

  it("adds a tag on Enter", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TagValueInput values={[]} onChange={onChange} />);

    const input = screen.getByLabelText("Add value");
    await user.type(input, "Charlie{Enter}");

    expect(onChange).toHaveBeenCalledWith(["Charlie"]);
  });

  it("adds a tag on comma", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TagValueInput values={[]} onChange={onChange} />);

    const input = screen.getByLabelText("Add value");
    await user.type(input, "Dave,");

    expect(onChange).toHaveBeenCalledWith(["Dave"]);
  });

  it("does not add duplicate tags", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TagValueInput values={["Alice"]} onChange={onChange} />);

    const input = screen.getByLabelText("Add value");
    await user.type(input, "Alice{Enter}");

    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not add empty tags", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TagValueInput values={[]} onChange={onChange} />);

    const input = screen.getByLabelText("Add value");
    await user.type(input, "   {Enter}");

    expect(onChange).not.toHaveBeenCalled();
  });

  it("removes a tag by clicking the remove button", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TagValueInput values={["Alice", "Bob"]} onChange={onChange} />);

    const removeBtn = screen.getByLabelText("Remove Alice");
    await user.click(removeBtn);

    expect(onChange).toHaveBeenCalledWith(["Bob"]);
  });

  it("removes last tag on Backspace when input is empty", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TagValueInput values={["Alice", "Bob"]} onChange={onChange} />);

    const input = screen.getByLabelText("Add value");
    await user.click(input);
    await user.keyboard("{Backspace}");

    expect(onChange).toHaveBeenCalledWith(["Alice"]);
  });

  it("adds tag on blur", () => {
    const onChange = vi.fn();
    render(<TagValueInput values={[]} onChange={onChange} />);

    const input = screen.getByLabelText("Add value");
    fireEvent.change(input, { target: { value: "Eve" } });
    fireEvent.blur(input);

    expect(onChange).toHaveBeenCalledWith(["Eve"]);
  });

  it("uses number input type when specified", () => {
    render(
      <TagValueInput values={[]} onChange={vi.fn()} inputType="number" />,
    );
    const input = screen.getByLabelText("Add value");
    expect(input).toHaveAttribute("type", "number");
  });

  it("has correct data-slot attributes", () => {
    render(
      <TagValueInput values={["A"]} onChange={vi.fn()} />,
    );
    expect(document.querySelector('[data-slot="tag-value-input"]')).toBeTruthy();
    expect(document.querySelector('[data-slot="tag"]')).toBeTruthy();
    expect(document.querySelector('[data-slot="tag-remove"]')).toBeTruthy();
    expect(document.querySelector('[data-slot="tag-input"]')).toBeTruthy();
  });
});
