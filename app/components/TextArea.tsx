"use client";

import { TextareaHTMLAttributes, useState } from "react";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  maxLength?: number;
  showCounter?: boolean;
}

export function TextArea({
  label,
  maxLength = 500,
  showCounter = true,
  value,
  onChange,
  placeholder,
  className = "",
  ...props
}: TextAreaProps) {
  const [internalValue, setInternalValue] = useState("");
  const currentValue = value !== undefined ? String(value) : internalValue;
  const charCount = currentValue.length;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (value === undefined) {
      setInternalValue(e.target.value);
    }
    onChange?.(e);
  };

  return (
    <div className={`flex w-full flex-col ${className}`}>
      {label && (
        <p className="pb-2 text-base font-medium leading-normal text-text-primary-light dark:text-text-primary-dark">
          {label}
        </p>
      )}
      <textarea
        value={currentValue}
        onChange={handleChange}
        maxLength={maxLength}
        placeholder={placeholder}
        className="flex min-h-36 w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-4 text-base font-normal leading-normal text-text-primary-light dark:text-text-primary-dark placeholder:text-text-secondary-light dark:placeholder:text-text-secondary-dark focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
        {...props}
      />
      {showCounter && (
        <p className="pt-1 text-right text-sm font-normal leading-normal text-text-secondary-light dark:text-text-secondary-dark">
          {charCount}/{maxLength}
        </p>
      )}
    </div>
  );
}

