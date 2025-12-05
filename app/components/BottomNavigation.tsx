"use client";

import { ReactNode } from "react";

interface BottomNavigationProps {
  children: ReactNode;
  className?: string;
}

export function BottomNavigation({ children, className = "" }: BottomNavigationProps) {
  return (
    <div
      className={`
        fixed bottom-0 left-0 right-0 z-10
        bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm
        border-t border-slate-200 dark:border-slate-800
        ${className}
      `}
    >
      <div className="flex justify-between items-center px-4 py-3">
        {children}
      </div>
    </div>
  );
}

