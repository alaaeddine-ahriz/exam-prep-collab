"use client";

interface PageIndicatorProps {
  total: number;
  current: number;
  className?: string;
}

export function PageIndicator({ total, current, className = "" }: PageIndicatorProps) {
  return (
    <div className={`flex w-full flex-row items-center justify-center gap-3 py-5 ${className}`}>
      {Array.from({ length: total }).map((_, index) => (
        <div
          key={index}
          className={`h-2 w-2 rounded-full transition-colors duration-200 ${
            index === current
              ? "bg-primary"
              : "bg-border-light dark:bg-slate-600"
          }`}
        />
      ))}
    </div>
  );
}

