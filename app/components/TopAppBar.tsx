"use client";

import { ReactNode } from "react";
import { Icon } from "./Icon";

interface TopAppBarProps {
  title: string;
  onBack?: () => void;
  rightAction?: ReactNode;
  transparent?: boolean;
  bordered?: boolean;
}

export function TopAppBar({
  title,
  onBack,
  rightAction,
  transparent = false,
  bordered = false,
}: TopAppBarProps) {
  return (
    <header
      className={`
        sticky top-0 z-10 flex items-center p-4 pb-2 justify-between
        ${transparent ? "bg-transparent" : "bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm"}
        ${bordered ? "border-b border-border-light dark:border-slate-800" : ""}
      `}
    >
      <div className="flex w-12 items-center justify-start">
        {onBack && (
          <button
            onClick={onBack}
            className="flex size-10 items-center justify-center rounded-full text-text-primary-light dark:text-text-primary-dark hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <Icon name="arrow_back" />
          </button>
        )}
      </div>
      <h1 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center text-text-primary-light dark:text-text-primary-dark">
        {title}
      </h1>
      <div className="flex w-12 items-center justify-end">
        {rightAction}
      </div>
    </header>
  );
}

