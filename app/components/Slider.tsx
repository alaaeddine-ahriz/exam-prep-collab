"use client";

interface SliderProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  className?: string;
}

export function Slider({
  label,
  value,
  min = 1,
  max = 100,
  step = 1,
  onChange,
  className = "",
}: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div
      className={`
        relative flex w-full flex-col items-start justify-between gap-3 rounded-xl
        border border-border-light dark:border-border-dark
        bg-surface-light dark:bg-surface-dark p-5
        ${className}
      `}
    >
      <div className="flex w-full shrink-[3] items-center justify-between">
        <p className="text-text-primary-light dark:text-text-primary-dark text-base font-medium leading-normal">
          {label}
        </p>
        <p className="text-text-primary-light dark:text-text-primary-dark text-base font-bold leading-normal">
          {value}
        </p>
      </div>
      <div className="flex h-4 w-full items-center gap-4 pt-2">
        <div className="flex h-1.5 flex-1 rounded-full bg-border-light dark:bg-border-dark relative">
          <div
            className="relative h-full rounded-full bg-primary"
            style={{ width: `${percentage}%` }}
          >
            <div className="absolute -right-3 -top-[9px] size-6 rounded-full border-4 border-primary bg-surface-light dark:bg-surface-dark" />
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange?.(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}

