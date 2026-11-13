import type { JSX } from 'react';
import type { SelectOptionType, SelectValue } from './SelectField';
import ArrowUp from '@icons/ArrowUp';
import ArrowDown from '@icons/ArrowDown';
import clsx from 'clsx';

type ChangeSelectFieldProps = {
  currentValue: SelectValue;
  options: SelectOptionType[];
  onChange: (val: SelectValue) => void;
  showIndex?: boolean;
  active?: boolean;
  disabled?: boolean;
};

/**
 * Select the next or previous option. At the end of the list, start again at the other end.
 * Set showIndex to show the option number, starting at 1.
 */
export const SelectFieldSpinner = ({
  currentValue,
  options,
  onChange,
  showIndex,
  active,
  disabled = false,
}: ChangeSelectFieldProps): JSX.Element => {
  const currentPosition = options.findIndex((val) => val.value === currentValue);
  const maxIndex = options.length - 1;

  const onUpHandler = () => {
    const option = options[currentPosition > 0 ? currentPosition - 1 : maxIndex];
    if (option) onChange(option.value);
  };

  const onDownHandler = () => {
    const option = options[currentPosition < maxIndex ? currentPosition + 1 : 0];
    if (option) onChange(option.value);
  };

  return (
    <div
      className={clsx(
        'flex flex-col justify-between bg-light ml-1 h-full rounded-sm relative text-sm',
        'border border-primary',
        active && 'bg-gray-true',
        disabled && 'disabled:opacity-70 disabled:cursor-not-allowed',
      )}
    >
      <button
        type="button"
        aria-label="decrement"
        className="hover:cursor-pointer"
        onClick={() => !disabled && onUpHandler()}
      >
        <ArrowUp height={16} width={16} />
      </button>
      {showIndex && (
        <div className="absolute text-sm left-1/2 top-1/2 select-none" style={{ transform: 'translate(-50%, -50%)' }}>
          {currentPosition + 1}
        </div>
      )}
      <button
        type="button"
        aria-label="increment"
        className="hover:cursor-pointer"
        onClick={() => !disabled && onDownHandler()}
      >
        <ArrowDown />
      </button>
    </div>
  );
};
