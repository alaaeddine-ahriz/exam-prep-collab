"use client";

interface SegmentOption {
  value: string;
  label: string;
}

interface SegmentedControlProps {
  options: SegmentOption[];
  value: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function SegmentedControl({
  options,
  value,
  onChange,
  className = "",
}: SegmentedControlProps) {
  return (
    <div className={`flex px-4 py-3 ${className}`}>
      <div className="flex h-10 flex-1 items-center justify-center rounded-lg bg-slate-200/80 dark:bg-slate-800/80 p-1">
        {options.map((option) => (
          <label
            key={option.value}
            className={`
              flex h-full flex-1 cursor-pointer items-center justify-center overflow-hidden rounded-md px-2
              text-sm font-medium leading-normal transition-all duration-200
              ${value === option.value
                ? "bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark shadow-sm"
                : "text-text-secondary-light dark:text-text-secondary-dark"
              }
            `}
          >
            <span className="truncate">{option.label}</span>
            <input
              type="radio"
              name="segment"
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange?.(option.value)}
              className="invisible w-0"
            />
          </label>
        ))}
      </div>
    </div>
  );
}

