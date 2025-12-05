"use client";

import { ProgressBar } from "./ProgressBar";

interface AnswerOptionProps {
  id: string;
  name: string;
  label: string;
  percentage?: number;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  showPercentage?: boolean;
  isUserVote?: boolean;
  className?: string;
}

export function AnswerOption({
  id,
  name,
  label,
  percentage = 0,
  checked = false,
  onChange,
  showPercentage = true,
  isUserVote = false,
  className = "",
}: AnswerOptionProps) {
  return (
    <label
      className={`
        flex flex-col gap-2 rounded-lg border p-4 cursor-pointer
        transition-all duration-200 relative
        ${checked
          ? "border-2 border-primary bg-primary/10 dark:bg-primary/20"
          : isUserVote
            ? "border-2 border-success bg-success/10 dark:bg-success/20"
            : "border-slate-200 dark:border-slate-800 bg-surface-light dark:bg-slate-800/50"
        }
        ${className}
      `}
    >
      {/* Your Vote Badge */}
      {isUserVote && !checked && (
        <span className="absolute -top-2 right-3 px-2 py-0.5 text-xs font-semibold bg-success text-white rounded-full">
          Your Vote
        </span>
      )}
      {isUserVote && checked && (
        <span className="absolute -top-2 right-3 px-2 py-0.5 text-xs font-semibold bg-primary text-white rounded-full">
          Your Vote
        </span>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <input
            type="radio"
            id={id}
            name={name}
            checked={checked}
            onChange={(e) => onChange?.(e.target.checked)}
            className="h-5 w-5 rounded-full border-2 border-slate-300 dark:border-slate-600 bg-transparent text-primary focus:ring-0 focus:ring-offset-0"
          />
          <span
            className={`text-base leading-normal ${
              checked
                ? "font-bold text-text-primary-light dark:text-text-primary-dark"
                : "font-medium text-slate-800 dark:text-slate-200"
            }`}
          >
            {label}
          </span>
        </div>
        {showPercentage && (
          <p
            className={`text-sm font-medium leading-normal ${
              checked
                ? "text-primary font-bold"
                : isUserVote
                  ? "text-success font-bold"
                  : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {percentage}%
          </p>
        )}
      </div>
      {showPercentage && (
        <div className="pl-9">
          <div
            className={`w-full overflow-hidden rounded-full h-2 ${
              checked
                ? "bg-primary/20 dark:bg-primary/30"
                : isUserVote
                  ? "bg-success/20 dark:bg-success/30"
                  : "bg-slate-200 dark:bg-slate-700"
            }`}
          >
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                checked ? "bg-primary" : isUserVote ? "bg-success" : "bg-primary/40"
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}
    </label>
  );
}

