import { render, screen } from '@testing-library/react';
import { SelectOptionType, SelectValue } from '../SelectField';
import { SelectFieldSpinner } from '../SelectFieldSpinner';

describe('SelectFieldSpinner', () => {
  it('should increase Value in button down', async () => {
    const options: Array<SelectOptionType> = [
      { label: 'first', value: 1 },
      { label: 'second', value: 2 },
    ];

    let result;

    const onChangeHandler = (selectedValue: SelectValue) => {
      result = selectedValue;
    };

    render(<SelectFieldSpinner currentValue={options[0].value} options={options} onChange={onChangeHandler} />);

    const incrementButton = screen.getByRole('button', { name: /increment/i });
    incrementButton.click();

    expect(result).toBe(options[1].value);
  });

  it('should decrease Value in button up', () => {
    const options: Array<SelectOptionType> = [
      { label: 'first', value: 1 },
      { label: 'second', value: 2 },
    ];

    let result;

    const onChangeHandler = (selectedValue: SelectValue) => {
      result = selectedValue;
    };

    render(<SelectFieldSpinner currentValue={options[1].value} options={options} onChange={onChangeHandler} />);

    const decrementButton = screen.getByRole('button', { name: /decrement/i });
    decrementButton.click();

    expect(result).toBe(options[0].value);
  });
});
