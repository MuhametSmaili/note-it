import { render, screen } from "@testing-library/react";
import type { SelectOptionType, SelectValue } from "../select-field";
import { SelectFieldSpinner } from "../select-field-spinner";

describe("SelectFieldSpinner", () => {
  it("should increase Value in button down", async () => {
    const options: Array<SelectOptionType> = [
      { label: "first", value: 1 },
      { label: "second", value: 2 },
    ];

    let result;

    const onChangeHandler = (selectedValue: SelectValue) => {
      result = selectedValue;
    };

    render(<SelectFieldSpinner currentValue={1} options={options} onChange={onChangeHandler} />);

    const incrementButton = screen.getByRole("button", { name: /increment/i });
    incrementButton.click();

    expect(result).toBe(2);
  });

  it("should decrease Value in button up", () => {
    const options: Array<SelectOptionType> = [
      { label: "first", value: 1 },
      { label: "second", value: 2 },
    ];

    let result;

    const onChangeHandler = (selectedValue: SelectValue) => {
      result = selectedValue;
    };

    render(<SelectFieldSpinner currentValue={2} options={options} onChange={onChangeHandler} />);

    const decrementButton = screen.getByRole("button", { name: /decrement/i });
    decrementButton.click();

    expect(result).toBe(1);
  });
});
