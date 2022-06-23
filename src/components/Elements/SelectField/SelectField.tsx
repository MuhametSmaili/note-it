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
  className?: string;
  defaultValue?: string;
  placeholder?: string;
} & Partial<SelectHTMLAttributes<HTMLSelectElement>>;

export const SelectField = React.forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ className, options, ...props }, ref) => {
    const [value, setValue] = useState(props.value || props.defaultValue || options[0].value);
    return (
      <div className="flex justify-center items-center h-9">
        <select
          value={value}
          ref={ref}
          className={clsx(
            'block w-full px-5 h-full text-md text-blue-prussian font-bold bg-gray-light focus:outline-none rounded-sm',
            className,
            'appearance-none',
          )}
          {...props}
          onChange={(e) => setValue(e.target.value)}
        >
          {options.map(({ label, value }) => (
            <option key={label?.toString()} value={value} className="text-md">
              {label}
            </option>
          ))}
        </select>
        <SelectFieldSpinner currentValue={value} options={options} onChange={(val) => setValue(val)} />
      </div>
    );
  },
);
