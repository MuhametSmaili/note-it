import React, { SelectHTMLAttributes, useState } from 'react';
import clsx from 'clsx';
import { SelectFieldSpinner } from './SelectFieldSpinner';

export type SelectValue = string | number | readonly string[];

export type SelectOptionType = {
  label: React.ReactNode;
  value: SelectValue;
};

type SelectFieldProps = {
  options: SelectOptionType[];
  defaultValue?: string;
  placeholder?: string;
} & Partial<SelectHTMLAttributes<HTMLSelectElement>>;

export const SelectField = React.forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ className, options, ...props }, ref) => {
    const [value, setValue] = useState(props.value || props.defaultValue || options[0].value);
    return (
      <div className="flex justify-center items-center hover:cursor-pointer">
        <select
          value={value}
          ref={ref}
          className={clsx(
            'block w-full px-5 py-2 h-full text-md rounded-sm',
            'text-blue-prussian bg-gray-light text-center',
            'disabled:opacity-70 disabled:cursor-not-allowed',
            'appearance-none focus:outline-none',
            className,
          )}
          {...props}
          onChange={(e) => {
            setValue(e.target.value);
            if (props.onChange) {
              props.onChange(e);
            }
          }}
        >
          {options.map(({ label, value }) => (
            <option key={label?.toString()} value={value} className="text-md">
              {label}
            </option>
          ))}
        </select>
        <SelectFieldSpinner
          disabled={props.disabled}
          currentValue={value}
          options={options}
          onChange={(val) => setValue(val)}
        />
      </div>
    );
  },
);
SelectField.displayName = 'Select-field';
