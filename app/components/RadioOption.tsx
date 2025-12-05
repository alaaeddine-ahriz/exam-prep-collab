"use client";

interface RadioOptionProps {
  id: string;
  name: string;
  label: string;
  description?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
}

export function RadioOption({
  id,
  name,
  label,
  description,
  checked = false,
  onChange,
  className = "",
}: RadioOptionProps) {
  return (
    <label
      className={`
        flex cursor-pointer items-center gap-4 rounded-xl border border-solid p-4
        transition-all duration-200
        ${checked
          ? "border-primary/50 ring-2 ring-primary/30 dark:border-primary dark:ring-primary/30"
          : "border-border-light dark:border-border-dark"
        }
        bg-surface-light dark:bg-surface-dark
        ${className}
      `}
    >
      <div className="flex grow flex-col">
        <p className="text-text-primary-light dark:text-text-primary-dark text-base font-medium leading-normal">
          {label}
        </p>
        {description && (
          <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm font-normal leading-normal">
            {description}
          </p>
        )}
      </div>
      <input
        type="radio"
        id={id}
        name={name}
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        className="h-5 w-5 border-2 border-border-light dark:border-border-dark bg-transparent text-primary focus:ring-primary focus:ring-offset-0"
      />
    </label>
  );
}

