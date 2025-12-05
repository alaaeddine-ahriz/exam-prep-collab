"use client";

interface PracticeAnswerOptionProps {
  id: string;
  name: string;
  label: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
}

export function PracticeAnswerOption({
  id,
  name,
  label,
  checked = false,
  onChange,
  className = "",
}: PracticeAnswerOptionProps) {
  return (
    <label
      className={`
        flex items-center gap-4 rounded-xl border border-solid p-4 cursor-pointer
        transition-colors duration-200
        ${checked
          ? "border-primary bg-primary/10 dark:bg-primary/20"
          : "border-slate-300 dark:border-slate-700"
        }
        ${className}
      `}
    >
      <div className="flex grow flex-col">
        <p className="text-base font-medium leading-normal text-text-primary-light dark:text-text-primary-dark">
          {label}
        </p>
      </div>
      <input
        type="radio"
        id={id}
        name={name}
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        className="h-5 w-5 border-2 border-slate-300 dark:border-slate-600 bg-transparent text-primary focus:ring-primary focus:ring-offset-0"
      />
    </label>
  );
}

