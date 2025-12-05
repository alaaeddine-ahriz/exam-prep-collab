"use client";

import { Icon } from "./Icon";

interface FloatingActionButtonProps {
  icon: string;
  onClick?: () => void;
  className?: string;
}

export function FloatingActionButton({
  icon,
  onClick,
  className = "",
}: FloatingActionButtonProps) {
  return (
    <div className={`fixed bottom-6 right-6 ${className}`}>
      <button
        onClick={onClick}
        className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-white shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-primary/40"
      >
        <Icon name={icon} size="xl" />
      </button>
    </div>
  );
}

