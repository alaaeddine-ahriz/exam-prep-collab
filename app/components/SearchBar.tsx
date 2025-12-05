"use client";

import { InputHTMLAttributes } from "react";
import { Icon } from "./Icon";

interface SearchBarProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  onSearch?: (value: string) => void;
}

export function SearchBar({
  placeholder = "Search questions...",
  value,
  onChange,
  onSearch,
  className = "",
  ...props
}: SearchBarProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onSearch) {
      onSearch((e.target as HTMLInputElement).value);
    }
  };

  return (
    <div className={`px-4 py-3 ${className}`}>
      <label className="flex flex-col min-w-40 h-12 w-full">
        <div className="flex w-full flex-1 items-stretch rounded-xl h-full shadow-sm">
          <div className="flex items-center justify-center pl-4 rounded-l-xl bg-surface-light dark:bg-surface-dark text-text-secondary-light dark:text-primary/70">
            <Icon name="search" size="lg" />
          </div>
          <input
            type="text"
            className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-r-xl bg-surface-light dark:bg-surface-dark h-full px-4 pl-2 text-base font-normal leading-normal text-text-primary-light dark:text-text-primary-dark placeholder:text-text-secondary-light dark:placeholder:text-slate-500 border-none focus:outline-none focus:ring-0"
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            {...props}
          />
        </div>
      </label>
    </div>
  );
}

