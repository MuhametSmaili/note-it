import { SelectOptionType, SelectValue } from './SelectField';
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
 * This is a component to go between(up and down) values of a select Field,
 * Can be used alone too, accepts options same as select field
 * and can show the current (index+1)
 * Based on the design.
 *
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
    if (currentPosition > 0) {
      onChange(options[currentPosition - 1].value);
    } else {
      onChange(options[maxIndex].value);
    }
  };

  const onDownHandler = () => {
    if (currentPosition < maxIndex) {
      onChange(options[currentPosition + 1].value);
    } else {
      onChange(options[0].value);
    }
  };

  return (
    <div
      className={clsx(
        'flex flex-col justify-between bg-gray-light ml-1 h-full rounded-sm relative text-sm',
        active && 'bg-gray-true',
        disabled && 'disabled:opacity-70 disabled:cursor-not-allowed',
      )}
    >
      <button aria-label="decrement" className="hover:cursor-pointer" onClick={() => !disabled && onUpHandler()}>
        <ArrowUp height={16} width={16} />
      </button>
      {showIndex && (
        <div className="absolute text-sm left-1/2 top-1/2 select-none" style={{ transform: 'translate(-50%, -50%)' }}>
          {currentPosition + 1}
        </div>
      )}
      <button aria-label="increment" className="hover:cursor-pointer" onClick={() => !disabled && onDownHandler()}>
        <ArrowDown />
      </button>
    </div>
  );
};
