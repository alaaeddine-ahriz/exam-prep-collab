"use client";

import { Icon } from "./Icon";
import { useApp } from "../context/AppContext";

interface TokenBalanceProps {
  compact?: boolean;
  showLabel?: boolean;
  className?: string;
}

export function TokenBalance({ compact = false, showLabel = true, className = "" }: TokenBalanceProps) {
  const { currencyInfo } = useApp();

  if (!currencyInfo) {
    return null;
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <Icon name="toll" className="text-amber-500 w-5 h-5" />
        <span className="font-semibold text-text-primary-light dark:text-text-primary-dark">
          {currencyInfo.balance}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 ${className}`}>
      <Icon name="toll" className="text-amber-500 w-5 h-5" />
      <span className="font-semibold text-amber-800 dark:text-amber-200">
        {currencyInfo.balance}
      </span>
      {showLabel && (
        <span className="text-xs text-amber-600 dark:text-amber-400">
          {currencyInfo.config.currencyName}
        </span>
      )}
    </div>
  );
}

